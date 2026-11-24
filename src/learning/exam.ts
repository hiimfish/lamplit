/**
 * 幕結業考 sitting (docs/specs/ui-flow.md): which questions a section has, which form
 * (A or B) is sat, the unlock rule, the run kept in the save and the scoring of a
 * finished sitting. Pure: the seed makes a section repeatable, so a reload halfway gets
 * the same questions; the scoring and the checkpoint come in through `ExamDeps`.
 */
import {
  examAct,
  sectionAsUnit,
  type ExamForm,
  type ExamId,
  type ExamSectionFile,
  type SectionKind,
} from '../content/exam';
import type { Task } from '../content/types';
import {
  dateKey,
  daysBetween,
  EXAM_RUN_DAYS,
  touchPlayed,
  type ExamRecord,
  type ExamRun,
  type SaveData,
} from '../core/save';
import type { ExamAnswer, ExamItem, ExamSectionResult } from '../ui/exam/types';
import type { ExamEstimate, ScoredAnswer } from './examScore';
import { makeRng, shuffle, type Rng } from './gen/common';
import { fillQuestions } from './gen/fills';
import { passageQuestions } from './gen/passages';
import { pictureQuestions } from './gen/pictures';
import { respondQuestions } from './gen/responds';
import { talkQuestions } from './gen/talks';
import { textFillQuestions } from './gen/textFills';
import { logAnswer } from './mistakes';
import { signQuestions } from './questionGen';
import type { Question } from './questions';
import { addCoins } from './sessionPlan';
import { actUnits, progressOf, type TownAct, type UnitLike } from './townPlan';

/** Coins for the first completed sitting of an exam; retakes give none. */
export const EXAM_COINS = 50;

/* ---------- unlock and form ---------- */

/**
 * An exam opens once every task of its Act was played at least once (the same condition
 * as the Act opening after it); the dev switch (`openAll`) opens it at once. `act` is 1 to 4.
 */
export function isExamUnlocked<U extends UnitLike>(
  save: SaveData,
  town: readonly TownAct<U>[],
  act: 1 | 2 | 3 | 4,
  openAll = false,
): boolean {
  if (openAll) return true;
  const entry = town[act - 1];
  if (!entry) return false;
  const { done, total } = progressOf(save, actUnits(entry));
  return total > 0 && done === total;
}

/** The form of the next sitting: A first, B second, from the third on both forms mixed. */
export function chooseForm(save: SaveData, exam: ExamId): ExamForm | 'mixed' {
  const attempts = save.exams[exam]?.attempts ?? 0;
  return attempts <= 0 ? 'A' : attempts === 1 ? 'B' : 'mixed';
}

/* ---------- picking the written items ---------- */

type Seen = Readonly<Record<string, number>>;

const WRITTEN_KINDS = [
  'pictures',
  'responds',
  'talks',
  'signs',
  'fills',
  'textFills',
  'passages',
] as const;
type WrittenKind = (typeof WRITTEN_KINDS)[number];

interface AnyItem {
  id: string;
  form?: ExamForm;
}

const itemsOf = (file: ExamSectionFile, kind: WrittenKind): AnyItem[] =>
  (file[kind] as AnyItem[] | undefined) ?? [];

/** Questions an item asks (a talk or passage has several, a text fill one per blank). */
function sizeOf(kind: WrittenKind, item: AnyItem): number {
  const any = item as { questions?: unknown[]; blanks?: unknown[] };
  if (kind === 'talks' || kind === 'passages') return any.questions?.length ?? 1;
  if (kind === 'textFills') return any.blanks?.length ?? 1;
  return 1;
}

/** A stable number out of a text, to give every section its own stream of the seed. */
function hashText(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return h >>> 0;
}

const sectionRng = (seed: number, section: string): Rng =>
  makeRng((seed ^ hashText(section)) >>> 0);

/**
 * The hand-written items of one section for a form, as a section file holding only the
 * chosen items. `A` or `B` takes that form's items (an item with no form is in both);
 * `mixed` fills the places of the form A shape (same number of items, each with the same
 * number of questions) from the items of both forms, the least seen first (`seen` counts
 * per item id), ties broken by the seed. Deterministic per seed.
 */
export function pickWritten(
  file: ExamSectionFile,
  form: ExamForm | 'mixed',
  seen: Seen,
  seed: number,
): ExamSectionFile {
  const out: ExamSectionFile = { ...file };
  const rng = sectionRng(seed, file.section);
  for (const kind of WRITTEN_KINDS) {
    if (!file[kind]) continue;
    const all = itemsOf(file, kind);
    const inForm = (f: ExamForm) => all.filter((it) => it.form === undefined || it.form === f);
    let picked: AnyItem[];
    if (form !== 'mixed') {
      picked = inForm(form);
    } else {
      const pool = shuffle(all, rng);
      picked = [];
      for (const slot of inForm('A')) {
        const free = pool.filter((it) => !picked.includes(it));
        const same = free.filter((it) => sizeOf(kind, it) === sizeOf(kind, slot));
        let best: AnyItem | undefined;
        for (const it of same.length > 0 ? same : free) {
          if (!best || (seen[it.id] ?? 0) < (seen[best.id] ?? 0)) best = it;
        }
        if (best) picked.push(best);
      }
    }
    (out as unknown as Record<string, unknown>)[kind] = picked;
  }
  return out;
}

/* ---------- difficulty ---------- */

const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The stimulus text and the option texts of a question, to measure its length. */
function textsOf(q: Question): { context: string[]; options: string[] } {
  switch (q.kind) {
    case 'picture':
      return { context: [], options: q.options.map((o) => o.en) };
    case 'respond':
      return { context: [q.prompt.en], options: q.options.map((o) => o.en) };
    case 'talk':
      return {
        context: [...q.lines.map((l) => l.en), q.en],
        options: q.options.map((o) => o.label),
      };
    case 'read-passage':
      return {
        context: [...(q.texts ? q.texts.flatMap((t) => t.lines) : q.lines), q.en],
        options: q.options.map((o) => o.label),
      };
    case 'text-fill':
      return { context: q.lines, options: q.options.map((o) => o.label) };
    case 'fill':
    case 'cloze':
      return { context: [q.before, q.after], options: q.options.map((o) => o.label) };
    case 'read-sign':
      return {
        context: [...q.rows.map((r) => `${r.label} ${r.value ?? ''}`), q.en],
        options: q.options.map((o) => o.label),
      };
    case 'choose-reply':
      return { context: [q.npcText], options: q.options.map((o) => o.text) };
    default:
      return { context: [], options: [] };
  }
}

/** The options of a choice question (every kind an exam holds has some); 0 for others. */
/** The id of the right option of a choice question. */
export const correctOf = (q: Question): string | undefined =>
  'correctId' in q ? q.correctId : undefined;

export function optionCount(q: Question): number {
  return 'options' in q ? q.options.length : 0;
}

/**
 * Difficulty 0 (easy) to 1 (hard), length based (cheap, and the same measure for written
 * and generated questions): half from the average words per option (8 or more is the
 * top), half from the words of the text to hear or read (60 or more is the top).
 */
export function questionDifficulty(q: Question): number {
  const { context, options } = textsOf(q);
  const optionWords = options.length
    ? options.reduce((n, text) => n + words(text), 0) / options.length
    : 0;
  const contextWords = context.reduce((n, text) => n + words(text), 0);
  const d = 0.5 * clamp01(optionWords / 8) + 0.5 * clamp01(contextWords / 60);
  return Math.round(d * 100) / 100;
}

/* ---------- the questions of a section ---------- */

export interface SectionOptions {
  /** `s1`, `s2`, ...: prefixes the qids; needed when the section has no file. */
  section: string;
  /** Which hand-written form to sit (see chooseForm). */
  form: ExamForm | 'mixed';
  /** Times each written item was seen (`save.exams[exam].seen`); decides `mixed`. */
  seen?: Seen;
  /** The questions examGen built for this section, in the order wanted. */
  generated?: readonly Question[];
}

/** Questions that stay together, with the group id the UI keeps them under. */
interface Block {
  group?: string;
  items: ExamItem[];
}

function makeItem(
  section: string,
  q: Question,
  itemId: string,
  index: number,
  extra: { seenId?: string; group?: string },
): ExamItem {
  const item: ExamItem = {
    qid: `${section}/${q.kind}/${itemId}/${index}`,
    question: q,
    difficulty: questionDifficulty(q),
  };
  if (extra.seenId) item.seenId = extra.seenId;
  if (extra.group) item.group = extra.group;
  return item;
}

/** The written items of one kind, each turned into questions on its own. */
function writtenBlocks(
  section: string,
  file: ExamSectionFile,
  rng: Rng,
): Record<WrittenKind, Block[]> {
  const unit = sectionAsUnit(file);
  const base = unit.tasks[0] as Task;
  const blocks = {} as Record<WrittenKind, Block[]>;
  const build = (kind: WrittenKind, make: (task: Task) => Question[], grouped: boolean) => {
    blocks[kind] = itemsOf(file, kind).map((it) => {
      const questions = make({ ...base, [kind]: [it] });
      const group = grouped && questions.length > 1 ? `${section}/${it.id}` : undefined;
      return {
        ...(group ? { group } : {}),
        items: questions.map((q, i) =>
          makeItem(section, q, it.id, i, { seenId: it.id, ...(group ? { group } : {}) }),
        ),
      };
    });
  };
  build('pictures', (task) => pictureQuestions(unit, task, rng), false);
  build('responds', (task) => respondQuestions(unit, task, rng), false);
  build('talks', (task) => talkQuestions(unit, task, rng), true);
  build('signs', (task) => signQuestions(task, rng), false);
  build('fills', (task) => fillQuestions(task, rng), false);
  build('textFills', (task) => textFillQuestions(task, rng), true);
  build('passages', (task) => passageQuestions(task, rng), true);
  return blocks;
}

/**
 * The questions of one section: the generated ones first (as given), then the written
 * ones of the chosen form, part by part (pictures, responds, talks, signs, fills, text
 * fills, passages). Inside a part the items (a whole talk, passage or text fill counts as
 * one) come in an order shuffled by the seed; the questions of one item keep their order
 * and share `group`. Options are shuffled by the seed (the gen helpers do it) and keep
 * their content ids, so an answer `oN` names the content option whatever its place.
 *
 * qid: `section/kind/itemId/index` (generated ones: itemId `g<n>`, their place in
 * `generated`). Written items carry `seenId` (their item id); generated ones do not.
 * Deterministic for a seed.
 */
export function sectionQuestions(
  file: ExamSectionFile | undefined,
  seed: number,
  opts: SectionOptions,
): ExamItem[] {
  const section = opts.section;
  const rng = sectionRng(seed, section);
  const items: ExamItem[] = (opts.generated ?? []).map((q, i) =>
    makeItem(section, q, `g${i}`, 0, {}),
  );
  if (!file) return items;
  const picked = pickWritten(file, opts.form, opts.seen ?? {}, seed);
  const blocks = writtenBlocks(section, picked, rng);
  for (const kind of WRITTEN_KINDS) {
    for (const block of shuffle(blocks[kind] ?? [], rng)) items.push(...block.items);
  }
  return items;
}

/* ---------- the run kept in the save ---------- */

/** A seed for a new sitting, from the clock. */
export const newSeed = (now: Date): number => now.getTime() % 2147483647;

/** Starts a sitting of `exam`, replacing any run in progress (so it also restarts one). */
export function startRun(save: SaveData, exam: ExamId, now: Date, seed = newSeed(now)): SaveData {
  const run: ExamRun = { exam, seed, startedOn: dateKey(now), done: [], answers: {} };
  return { ...save, examRun: run };
}

/** The run in progress for this exam, unless it is over EXAM_RUN_DAYS old. */
export function resumeRun(save: SaveData, exam: ExamId, now: Date): ExamRun | undefined {
  const run = save.examRun;
  if (!run || run.exam !== exam) return undefined;
  return daysBetween(run.startedOn, dateKey(now)) > EXAM_RUN_DAYS ? undefined : run;
}

/** Records a finished section: its id in `done` and each chosen option in `answers`. */
export function commitSection(
  save: SaveData,
  sectionId: string,
  answers: readonly ExamAnswer[],
): SaveData {
  const run = save.examRun;
  if (!run) return save;
  const kept: Record<string, string> = { ...run.answers };
  for (const answer of answers) if (answer.choice) kept[answer.qid] = answer.choice;
  const done = run.done.includes(sectionId) ? run.done : [...run.done, sectionId];
  return { ...save, examRun: { ...run, done, answers: kept } };
}

/** Drops the run in progress (leaving, or 重新開始 before startRun). */
export function abandonRun(save: SaveData): SaveData {
  if (!save.examRun) return save;
  const rest = { ...save };
  delete rest.examRun;
  return rest;
}

/* ---------- finishing ---------- */

/** A finished section with the questions it was made of (the scoring and the log need them). */
export interface ExamOutcome extends ExamSectionResult {
  items: ExamItem[];
}

/** Grades a section: `answers` as the runner collects them, or the saved qid-to-option map. */
export function gradeSection(
  section: { id: string; kind: SectionKind; items: readonly ExamItem[] },
  answers: readonly ExamAnswer[] | Readonly<Record<string, string>>,
): ExamOutcome {
  const list: ExamAnswer[] = Array.isArray(answers)
    ? [...(answers as readonly ExamAnswer[])]
    : section.items.map((item) => ({
        qid: item.qid,
        choice: (answers as Record<string, string>)[item.qid] ?? null,
      }));
  const choiceOf = new Map(list.map((a) => [a.qid, a.choice]));
  const correct = section.items.filter(
    (item) => choiceOf.get(item.qid) === correctOf(item.question),
  ).length;
  return {
    id: section.id,
    kind: section.kind,
    answers: section.items.map((item) => ({
      qid: item.qid,
      choice: choiceOf.get(item.qid) ?? null,
    })),
    total: section.items.length,
    correct,
    items: [...section.items],
  };
}

/** What finishRun needs from other modules (injected so tests need no real scoring). */
export interface ExamDeps {
  /** examScore from src/learning/examScore.ts. */
  score: (
    act: 1 | 2 | 3 | 4,
    kind: SectionKind,
    answers: readonly ScoredAnswer[],
    offset?: number,
  ) => ExamEstimate;
  /** addExamCheckpoint from src/learning/checkpoint.ts. */
  addCheckpoint: (
    save: SaveData,
    now: Date,
    act: 1 | 2 | 3 | 4,
    listening: number,
    reading: number,
    retake: boolean,
  ) => SaveData;
  /** updateCalibration from src/learning/examScore.ts, run after the checkpoint is stored. */
  updateCalibration: (save: SaveData, now: Date) => SaveData;
}

export interface ExamSummary {
  exam: ExamId;
  /** The raw estimates (no personal offset): what is stored in the record and checkpoint. */
  listening: ExamEstimate;
  reading: ExamEstimate;
  /** The estimates with the player's calibration offset: what the screen shows. */
  shown: { listening: ExamEstimate; reading: ExamEstimate };
  /** The first completed sitting of this exam (the one that pays). */
  first: boolean;
  coins: number;
  /** Any written question seen in an earlier sitting was used again. */
  retake: boolean;
  /** How many such questions (for 「有 N 題你看過」). */
  reused: number;
  total: number;
  correct: number;
  attempts: number;
}

/** The option count and difficulty a scored answer is made of. */
function scored(outcome: ExamOutcome): ScoredAnswer[] {
  const choiceOf = new Map(outcome.answers.map((a) => [a.qid, a.choice]));
  return outcome.items.map((item) => ({
    correct: choiceOf.get(item.qid) === correctOf(item.question),
    options: optionCount(item.question),
    difficulty: item.difficulty,
  }));
}

/**
 * Closes a sitting: estimates 聽力 and 閱讀 over all the sections, writes `exams[exam]`
 * (attempts, date, scores, `seen`), the checkpoint, the coins (first completion only),
 * the streak, the mistake tags of every answer, and drops the run. The answers do not
 * count in `daily.answered`/`correct`: they carry no feedback.
 */
export function finishRun(
  save: SaveData,
  exam: ExamId,
  outcomes: readonly ExamOutcome[],
  now: Date,
  deps: ExamDeps,
): { save: SaveData; summary: ExamSummary } {
  const act = examAct(exam);
  const before: ExamRecord | undefined = save.exams[exam];
  const priorSeen = before?.seen ?? {};
  const offsets = save.exams.calibration;
  const estimate = (kind: SectionKind, offset: number): ExamEstimate =>
    deps.score(act, kind, outcomes.filter((o) => o.kind === kind).flatMap(scored), offset);
  // Stored values carry no offset: calibration pairs ETS scores with the raw estimates.
  const listening = estimate('listening', 0);
  const reading = estimate('reading', 0);
  const shownScores = {
    listening: estimate('listening', offsets?.listening ?? 0),
    reading: estimate('reading', offsets?.reading ?? 0),
  };

  // Written items shown: counted once per sitting; a reused question was seen before.
  const shown = new Set<string>();
  let reused = 0;
  for (const outcome of outcomes) {
    for (const item of outcome.items) {
      if (!item.seenId) continue;
      shown.add(item.seenId);
      if ((priorSeen[item.seenId] ?? 0) > 0) reused += 1;
    }
  }
  const seen: Record<string, number> = { ...priorSeen };
  for (const id of shown) seen[id] = (seen[id] ?? 0) + 1;
  const retake = reused > 0;

  let next: SaveData = save;
  for (const outcome of outcomes) {
    const choiceOf = new Map(outcome.answers.map((a) => [a.qid, a.choice]));
    for (const item of outcome.items) {
      const correct = choiceOf.get(item.qid) === correctOf(item.question);
      next = logAnswer(
        next,
        item.question,
        { itemId: item.question.itemId, correct, usedHelp: false, ms: 0 },
        now,
      );
    }
    next = touchPlayed(next, now);
  }

  const first = before === undefined;
  const coins = first ? EXAM_COINS : 0;
  const attempts = (before?.attempts ?? 0) + 1;
  const record: ExamRecord = {
    attempts,
    lastDate: dateKey(now),
    listening: listening.score,
    reading: reading.score,
    seen,
  };
  next = { ...next, exams: { ...next.exams, [exam]: record } };
  next = abandonRun(next);
  next = deps.addCheckpoint(next, now, act, listening.score, reading.score, retake);
  next = deps.updateCalibration(next, now);
  if (coins > 0) next = addCoins(next, coins);

  return {
    save: next,
    summary: {
      exam,
      listening,
      reading,
      shown: shownScores,
      first,
      coins,
      retake,
      reused,
      total: outcomes.reduce((n, o) => n + o.total, 0),
      correct: outcomes.reduce((n, o) => n + o.correct, 0),
      attempts,
    },
  };
}

/* ---------- 重做錯題 ---------- */

export interface ReviewItem {
  qid: string;
  question: Question;
  /** The option the player picked, or null when it was left blank. */
  picked: string | null;
}

/** The wrong (or blank) questions of a sitting, for 重做錯題 in QuestionView. No save effect. */
export function reviewQuestions(outcomes: readonly ExamOutcome[]): ReviewItem[] {
  return outcomes.flatMap((outcome) => {
    const choiceOf = new Map(outcome.answers.map((a) => [a.qid, a.choice]));
    return outcome.items
      .filter((item) => choiceOf.get(item.qid) !== correctOf(item.question))
      .map((item) => ({
        qid: item.qid,
        question: item.question,
        picked: choiceOf.get(item.qid) ?? null,
      }));
  });
}
