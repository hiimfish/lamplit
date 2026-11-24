/**
 * Checks one exam section file (docs/specs/content.md): counts equal EXAM_PLAN, ids,
 * option counts and positions, plus the existing per-task checks. Generated questions
 * are not in the file, so only the hand-written part is counted. Returns problems; an
 * empty list means the file is good.
 *
 * Every hand-written item carries `form: 'A' | 'B'`; each form must have the planned
 * counts on its own (the first sitting uses A, the second B).
 */
import { checkPassages } from './checks/passages';
import { checkPictures } from './checks/pictures';
import { checkTalks } from './checks/talks';
import { checkTextFills } from './checks/textFills';
import { ID_PATTERN, isObject, isLateAct, wordCount, type TaskCheckContext } from './checks/common';
import {
  EXAM_PLAN,
  examAct,
  isExamId,
  type ExamForm,
  type SectionPlan,
  type WrittenCounts,
} from './exam';
import { ROLE_LABEL } from './roles';

/** Item kinds a section file may hold, with the field of WrittenCounts that plans each. */
const KINDS = ['pictures', 'talks', 'passages', 'textFills'] as const;
type Kind = (typeof KINDS)[number];

/** Fields of a task that the exam files never hold: those questions are generated. */
const GENERATED_KINDS = ['responds', 'signs', 'fills'] as const;

const TOP_KEYS: readonly string[] = ['exam', 'section', 'draft', ...KINDS, ...GENERATED_KINDS];
const FORMS: readonly ExamForm[] = ['A', 'B'];

/** An option's position may hold at most this share of a section-form's answers. */
export const MAX_ANSWER_SHARE = 0.4;
/** The share is only judged with at least this many answers (a lone item is 100%). */
const MIN_ANSWERS_FOR_SHARE = 5;
/** A line or sentence of this many words that appears twice is a copy. */
const MIN_COPY_WORDS = 5;
/** Options per question: at least this many everywhere, exactly 4 in Acts 3 and 4. */
const MIN_OPTIONS = 3;
const LATE_OPTIONS = 4;

const CHECKS: Record<Kind, (task: Record<string, unknown>, ctx: TaskCheckContext) => string[]> = {
  pictures: checkPictures,
  talks: checkTalks,
  passages: checkPassages,
  textFills: checkTextFills,
};

const isRole = (value: unknown): boolean =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ROLE_LABEL, value);

const normal = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

/** The questions of a talk or a passage (a set has its own list): objects only. */
const questionsOf = (item: Record<string, unknown>): Record<string, unknown>[] =>
  Array.isArray(item.questions) ? item.questions.filter(isObject) : [];

/** The questions an item counts for: a picture is one, a text fill has one per blank. */
function questionCount(kind: Kind, item: Record<string, unknown>): number {
  if (kind === 'pictures') return 1;
  if (kind === 'textFills') return Array.isArray(item.blanks) ? item.blanks.length : 0;
  return Array.isArray(item.questions) ? item.questions.length : 0;
}

/** Everything in an item that has options and an answer, with a label for messages. */
function choiceParts(
  kind: Kind,
  item: Record<string, unknown>,
  label: string,
): { label: string; options: unknown; answer: unknown }[] {
  if (kind === 'pictures') return [{ label, options: item.options, answer: item.answer }];
  const parts = kind === 'textFills' ? item.blanks : item.questions;
  if (!Array.isArray(parts)) return [];
  return parts.filter(isObject).map((part, i) => ({
    label: `${label} ${kind === 'textFills' ? 'blank' : 'question'} ${i + 1}`,
    options: part.options,
    answer: part.answer,
  }));
}

/** The lines and questions of an item that count when looking for a copy. */
function copyTexts(kind: Kind, item: Record<string, unknown>): string[] {
  const texts: string[] = [];
  const longLine = (value: unknown) => {
    if (typeof value === 'string' && wordCount(value) >= MIN_COPY_WORDS) texts.push(value);
  };
  if (kind === 'pictures') {
    const options = Array.isArray(item.options) ? item.options : [];
    const right: unknown = typeof item.answer === 'number' ? options[item.answer] : undefined;
    if (isObject(right) && typeof right.en === 'string') texts.push(right.en);
    return texts;
  }
  if (kind === 'textFills') {
    if (Array.isArray(item.lines)) item.lines.forEach(longLine);
    return texts;
  }
  if (kind === 'talks') {
    if (Array.isArray(item.lines)) {
      for (const line of item.lines) if (isObject(line)) longLine(line.en);
    }
  } else {
    const sources = Array.isArray(item.texts) ? item.texts : [item];
    for (const source of sources) {
      if (isObject(source) && Array.isArray(source.lines)) source.lines.forEach(longLine);
    }
  }
  for (const question of questionsOf(item)) {
    if (typeof question.en === 'string') texts.push(question.en);
  }
  return texts;
}

/** The items of a kind that are objects, with their form, in file order. */
function itemsOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

/**
 * The sentences and question stems of a file that must not appear twice in one exam
 * (normalised; each once per item). validateExam uses them within a file; the content
 * test joins the files of one exam.
 */
export function examCopyKeys(file: unknown): string[] {
  if (!isObject(file)) return [];
  return KINDS.flatMap((kind) =>
    itemsOf(file[kind]).flatMap((item) => [...new Set(copyTexts(kind, item).map(normal))]),
  );
}

/** Which kinds the plan hand-writes for a section, with the counts. */
function plannedKinds(written: WrittenCounts): Map<Kind, number | number[]> {
  const planned = new Map<Kind, number | number[]>();
  if (written.pictures) planned.set('pictures', written.pictures);
  if (written.talks) planned.set('talks', written.talks);
  if (written.passages) planned.set('passages', written.passages);
  if (written.textFills) planned.set('textFills', written.textFills);
  return planned;
}

/** Problems with one section file; an empty list means it is good. */
export function validateExam(file: unknown): string[] {
  if (!isObject(file)) return ['exam file is not an object'];
  const exam = file.exam;
  if (!isExamId(exam)) return [`unknown exam "${String(exam)}"`];
  const plan: SectionPlan | undefined = EXAM_PLAN[exam].sections.find((s) => s.id === file.section);
  if (!plan) return [`${exam}: unknown section "${String(file.section)}"`];
  const where = `${exam}.${plan.id}`;
  const problems: string[] = [];
  const report = (problem: string) => problems.push(`${where}: ${problem}`);

  for (const key of Object.keys(file)) {
    if (!TOP_KEYS.includes(key)) report(`unknown field "${key}"`);
  }
  if (file.draft !== undefined && typeof file.draft !== 'boolean') {
    report('draft must be true or false (or left out)');
  }
  const planned = plannedKinds(plan.written);
  if (planned.size === 0) {
    report('this section has no hand-written questions, so it has no file');
  }
  for (const key of [...GENERATED_KINDS, ...KINDS]) {
    if (file[key] === undefined) continue;
    if (!Array.isArray(file[key])) report(`${key} must be a list`);
    else if (!(KINDS as readonly string[]).includes(key) || !planned.has(key as Kind)) {
      const generated = (GENERATED_KINDS as readonly string[]).includes(key);
      if (file.draft === true && file[key].length === 0) continue;
      report(
        generated
          ? `has ${key}: those questions are generated, not written in the file`
          : `has ${key}, which the plan does not hand-write for this section`,
      );
    }
  }

  if (file.draft === true) {
    for (const kind of planned.keys()) {
      if (itemsOf(file[kind]).length > 0 || (Array.isArray(file[kind]) && file[kind].length > 0)) {
        report(`is a draft (draft: true) but has ${kind}: finish it and take "draft" out`);
      }
    }
    return problems;
  }

  const answers: Record<ExamForm, number[]> = { A: [], B: [] };
  const ids = new Set<string>();
  const copies = new Map<string, string>();
  const ctx = (): TaskCheckContext => {
    const seen = new Map<string, Set<string>>();
    return {
      seen: (kind) => {
        if (!seen.has(kind)) seen.set(kind, new Set());
        return seen.get(kind)!;
      },
      taughtChunks: new Set(),
      isRole,
      act: examAct(exam),
    };
  };
  const act = examAct(exam);

  for (const [kind, expected] of planned) {
    const raw = file[kind];
    if (!Array.isArray(raw)) {
      report(`needs ${kind}: a list of ${describe(expected)}`);
      continue;
    }
    const counts: Record<ExamForm, number[]> = { A: [], B: [] };

    raw.forEach((value: unknown, index) => {
      if (!isObject(value)) {
        report(`${kind} ${index + 1} must be an object`);
        return;
      }
      const label = `${kind.replace(/s$/, '')} "${String(value.id)}"`;
      const form = value.form;
      const known = FORMS.includes(form as ExamForm);
      if (!known) report(`${label} needs form "A" or "B" (has ${JSON.stringify(form)})`);

      const id = value.id;
      if (typeof id === 'string') {
        if (!id.startsWith(`${plan.id}_`)) report(`${label} id must start with "${plan.id}_"`);
        if (!ID_PATTERN.test(id)) report(`${label} id must use only a-z, 0-9 and _`);
        if (ids.has(id)) report(`${label} id is used twice in the exam`);
        ids.add(id);
      }
      if (kind === 'talks' && Array.isArray(value.lines)) {
        for (const line of value.lines.filter(isObject)) {
          const lineId = line.id;
          if (typeof lineId !== 'string') continue;
          if (!lineId.startsWith(`${plan.id}_`)) {
            report(`${label} line "${lineId}" id must start with "${plan.id}_"`);
          }
          if (ids.has(lineId)) report(`${label} line "${lineId}" id is used twice in the exam`);
          ids.add(lineId);
        }
      }

      const rest = { ...value };
      delete rest.form;
      const task = { id: plan.id, title: plan.id, newChunkIds: [], newWordIds: [], scene: [] };
      for (const problem of CHECKS[kind]({ ...task, [kind]: [rest] }, ctx())) {
        report(problem);
      }

      if (kind === 'pictures' && act === 4 && value.listen !== true) {
        report(`${label} must be a sound-option picture ("listen": true) in exam4`);
      }

      for (const part of choiceParts(kind, value, label)) {
        const n = Array.isArray(part.options) ? part.options.length : undefined;
        if (n === undefined) continue;
        if (n < MIN_OPTIONS) {
          report(`${part.label} has ${n} options (at least ${MIN_OPTIONS})`);
        } else if (isLateAct({ act }) && n !== LATE_OPTIONS) {
          report(`${part.label} has ${n} options (exactly ${LATE_OPTIONS} in Acts 3 and 4)`);
        }
      }

      for (const text of new Set(copyTexts(kind, value).map(normal))) {
        const first = copies.get(text);
        if (first !== undefined) report(`${label} repeats "${text}" (also in ${first})`);
        else copies.set(text, label);
      }

      if (known) {
        const f = form as ExamForm;
        counts[f].push(questionCount(kind, value));
        for (const part of choiceParts(kind, value, label)) {
          if (typeof part.answer === 'number') answers[f].push(part.answer);
        }
      }
    });

    for (const form of FORMS) {
      const wanted = Array.isArray(expected) ? expected : [expected];
      const have = kind === 'pictures' ? [counts[form].length] : counts[form];
      if (JSON.stringify(have) !== JSON.stringify(wanted)) {
        report(
          kind === 'pictures'
            ? `form ${form} has ${have[0]} pictures; the plan wants ${wanted[0]}`
            : `form ${form} ${kind} have questions ${JSON.stringify(have)}; the plan wants ${JSON.stringify(wanted)}`,
        );
      }
    }
  }
  problems.push(...balance(where, answers));
  return problems;
}

/** Problems with how often one option position is the answer, per form of the section. */
function balance(where: string, answers: Record<ExamForm, number[]>): string[] {
  const problems: string[] = [];
  for (const form of FORMS) {
    const list = answers[form];
    if (list.length < MIN_ANSWERS_FOR_SHARE) continue;
    const tally = new Map<number, number>();
    for (const answer of list) tally.set(answer, (tally.get(answer) ?? 0) + 1);
    for (const [index, n] of tally) {
      if (n / list.length > MAX_ANSWER_SHARE) {
        problems.push(
          `${where}: form ${form} answer ${'ABCD'[index] ?? index} ${n} times of ${list.length} (at most ${Math.floor(list.length * MAX_ANSWER_SHARE)}): mix the answer positions`,
        );
      }
    }
  }
  return problems;
}

const describe = (expected: number | number[]) =>
  Array.isArray(expected)
    ? `items with ${JSON.stringify(expected)} questions`
    : `${expected} items`;
