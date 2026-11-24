/**
 * Checks the sentence generator's data files (docs/specs/content.md): one location's
 * lexicon (word ids exist in the unit, `pos` agrees with the forms it needs, classes are
 * in LEX_CLASSES, `skip` entries carry nothing else, tagged story lines are real), the
 * patterns of an Act and the two sentence pools. Each returns problems; empty means good.
 */
import { ID_PATTERN } from './checks/common';
import {
  COMPATIBLE,
  LEX_CLASSES,
  type AnswerType,
  type BlankKind,
  type PatternShape,
  type Pos,
  type QuestionType,
} from './lexicon';
import type { Unit } from './types';

const POS: readonly Pos[] = ['n', 'v', 'adj', 'adv', 'prep', 'other'];
const QUESTION_TYPES = Object.keys(COMPATIBLE) as QuestionType[];
const ANSWER_TYPES: readonly AnswerType[] = [
  'place',
  'time',
  'person',
  'reason',
  'quantity',
  'price',
  'manner',
  'thing',
  'yes-no',
  'choice',
  'accept-offer',
  'decline',
  'agree',
  'thanks',
  'greeting',
  'statement',
  'universal',
];
const BLANKS: readonly BlankKind[] = [
  'verb-form',
  'prep',
  'article',
  'number',
  'object',
  'subject',
];
const SHAPES: readonly PatternShape[] = [
  'svo',
  'svo-prep',
  'svo-time',
  'be-adj',
  'there-be',
  'passive',
  'wh-question',
  'yes-no-question',
  'comparative',
];
const ENTRY_KEYS = ['pos', 'en', 'cls', 'forms', 'countable', 'an', 'frames', 'skip'];
const FORM_KEYS = ['pl', 's3', 'past', 'pp', 'ing', 'comp'];
const VERB_FORMS = ['s3', 'past', 'pp', 'ing'];
const FRAME_KEYS = ['subj', 'obj', 'prep', 'prepRequired'];
const LOWER_WORD = /^[a-z]+(?:['-][a-z]+)*$/;
const sameText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';
const isClass = (value: unknown): boolean =>
  typeof value === 'string' && (LEX_CLASSES as readonly string[]).includes(value);

function unknownKeys(obj: Record<string, unknown>, allowed: readonly string[], label: string) {
  return Object.keys(obj)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${label} has unknown key "${key}"`);
}

function checkClassList(value: unknown, label: string, problems: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    problems.push(`${label} must be a non-empty list of classes`);
    return;
  }
  for (const cls of value) {
    if (!isClass(cls)) problems.push(`${label} has class "${String(cls)}" outside LEX_CLASSES`);
  }
}

function checkFrame(frame: unknown, label: string, problems: string[]): void {
  if (!isObject(frame)) {
    problems.push(`${label} is not an object`);
    return;
  }
  problems.push(...unknownKeys(frame, FRAME_KEYS, label));
  checkClassList(frame.subj, `${label}.subj`, problems);
  if (frame.obj !== undefined) checkClassList(frame.obj, `${label}.obj`, problems);
  if (frame.prepRequired !== undefined && frame.prepRequired !== true) {
    problems.push(`${label}.prepRequired must be true`);
  }
  if (frame.prep === undefined) return;
  const prep = frame.prep;
  if (!isObject(prep)) {
    problems.push(`${label}.prep is not an object`);
    return;
  }
  problems.push(...unknownKeys(prep, ['word', 'cls', 'fixed'], `${label}.prep`));
  if (prep.fixed !== undefined && prep.fixed !== true)
    problems.push(`${label}.prep.fixed must be true`);
  if (typeof prep.word !== 'string' || !LOWER_WORD.test(prep.word)) {
    problems.push(`${label}.prep.word must be a lowercase word`);
  }
  checkClassList(prep.cls, `${label}.prep.cls`, problems);
}

function checkSkip(entry: Record<string, unknown>, label: string, problems: string[]): void {
  if (entry.skip !== true) problems.push(`${label}: skip must be true`);
  const extra = Object.keys(entry).filter((key) => key !== 'skip' && key !== 'pos');
  if (extra.length > 0)
    problems.push(`${label}: skip entry has other fields (${extra.join(', ')})`);
}

function checkForms(entry: Record<string, unknown>, label: string, problems: string[]) {
  if (entry.forms === undefined) return {};
  if (!isObject(entry.forms)) {
    problems.push(`${label}: forms is not an object`);
    return {};
  }
  problems.push(...unknownKeys(entry.forms, FORM_KEYS, `${label} forms`));
  for (const [key, value] of Object.entries(entry.forms)) {
    if (!isText(value)) problems.push(`${label} forms.${key} must be a non-empty string`);
  }
  return entry.forms;
}

function checkEntry(id: string, entry: unknown, problems: string[]): void {
  const label = `entry "${id}"`;
  if (!isObject(entry)) {
    problems.push(`${label} is not an object`);
    return;
  }
  problems.push(...unknownKeys(entry, ENTRY_KEYS, label));
  if (entry.en !== undefined && (typeof entry.en !== 'string' || entry.en.trim() === '')) {
    problems.push(`${label}: en must be a non-empty string`);
  }
  if (entry.skip !== undefined) checkSkip(entry, label, problems);
  if (!POS.includes(entry.pos as Pos)) {
    problems.push(`${label} has bad pos "${String(entry.pos)}"`);
    return;
  }
  if (entry.skip !== undefined) return;
  if (entry.cls !== undefined && !isClass(entry.cls)) {
    problems.push(`${label} has class "${String(entry.cls)}" outside LEX_CLASSES`);
  }
  if (entry.countable !== undefined && typeof entry.countable !== 'boolean') {
    problems.push(`${label}: countable must be a boolean`);
  }
  if (entry.an !== undefined && entry.an !== true) problems.push(`${label}: an must be true`);
  const forms: Record<string, unknown> = checkForms(entry, label, problems);
  if (entry.frames !== undefined) {
    if (!Array.isArray(entry.frames)) problems.push(`${label}: frames must be a list`);
    else entry.frames.forEach((f, i) => checkFrame(f, `${label} frame ${i + 1}`, problems));
  }
  if (entry.pos === 'n') {
    if (entry.cls === undefined) problems.push(`${label}: a noun needs cls`);
    if (entry.countable !== false && !isText(forms.pl)) {
      problems.push(`${label}: a countable noun needs forms.pl`);
    }
  }
  if (entry.pos === 'v') {
    for (const key of VERB_FORMS) {
      if (!isText(forms[key])) problems.push(`${label}: a verb needs forms.${key}`);
    }
    if (!Array.isArray(entry.frames) || entry.frames.length === 0) {
      problems.push(`${label}: a verb needs at least one frame (or skip)`);
    }
  }
}

function checkLineTag(id: string, tag: unknown, problems: string[]): void {
  const label = `line tag "${id}"`;
  if (!isObject(tag)) {
    problems.push(`${label} is not an object`);
    return;
  }
  problems.push(...unknownKeys(tag, ['side', 'qtype', 'atype'], label));
  if (tag.side !== 'question' && tag.side !== 'answer') {
    problems.push(`${label} has bad side "${String(tag.side)}"`);
    return;
  }
  if (tag.qtype !== undefined && !QUESTION_TYPES.includes(tag.qtype as QuestionType)) {
    problems.push(`${label} has bad qtype "${String(tag.qtype)}"`);
  }
  if (tag.atype !== undefined && !ANSWER_TYPES.includes(tag.atype as AnswerType)) {
    problems.push(`${label} has bad atype "${String(tag.atype)}"`);
  }
  if (tag.side === 'question') {
    if (tag.qtype === undefined) problems.push(`${label} needs qtype`);
    if (tag.atype !== undefined) problems.push(`${label}: a question has no atype`);
  } else {
    if (tag.atype === undefined) problems.push(`${label} needs atype`);
    if (tag.qtype !== undefined) problems.push(`${label}: an answer has no qtype`);
  }
}

function checkLines(lines: unknown, unit: Unit, problems: string[]): void {
  if (!isObject(lines)) {
    problems.push('"lines" is not an object');
    return;
  }
  const sceneIds = new Set<string>();
  for (const task of unit.tasks ?? []) for (const line of task.scene ?? []) sceneIds.add(line.id);
  for (const [id, tag] of Object.entries(lines)) {
    if (!sceneIds.has(id)) problems.push(`line tag "${id}" is not a scene line of ${unit.id}`);
    checkLineTag(id, tag, problems);
  }
}

/** Checks `src/data/lexicon/<unitId>.json` against the unit it belongs to. */
export function validateLexicon(file: unknown, unit: Unit): string[] {
  if (!isObject(file)) return ['lexicon file is not an object'];
  const problems: string[] = [];
  const wordIds = new Set((unit.words ?? []).map((w) => w.id));
  for (const [id, value] of Object.entries(file)) {
    if (id === 'lines') {
      checkLines(value, unit, problems);
      continue;
    }
    if (!wordIds.has(id)) problems.push(`entry "${id}" is not a word of ${unit.id}`);
    checkEntry(id, value, problems);
  }
  return problems;
}

/** Strict mode: ids of the unit's words that have no entry (not even a skip). */
export function missingLexiconWords(file: unknown, unit: Unit): string[] {
  const have = isObject(file) ? file : {};
  return (unit.words ?? []).filter((w) => !(w.id in have)).map((w) => w.id);
}

/** Checks `src/data/patterns/act<N>.json`. */
export function validatePatterns(
  file: unknown,
  actNo: number,
  grammarIds: ReadonlySet<string>,
): string[] {
  if (!Array.isArray(file)) return [`patterns of act ${actNo} are not a list`];
  const problems: string[] = [];
  const seen = new Set<string>();
  file.forEach((raw: unknown, index) => {
    const label = `act ${actNo} pattern ${index + 1}`;
    if (!isObject(raw)) {
      problems.push(`${label} is not an object`);
      return;
    }
    const keys = ['id', 'grammarId', 'shape', 'tense', 'cues', 'blanks'];
    problems.push(...unknownKeys(raw, keys, label));
    if (typeof raw.id !== 'string' || !ID_PATTERN.test(raw.id))
      problems.push(`${label} has a bad id`);
    else if (seen.has(raw.id)) problems.push(`${label} "${raw.id}" is a duplicate id`);
    else seen.add(raw.id);
    if (typeof raw.grammarId !== 'string' || !grammarIds.has(raw.grammarId)) {
      problems.push(`${label} has unknown grammarId "${String(raw.grammarId)}"`);
    }
    if (!SHAPES.includes(raw.shape as PatternShape)) {
      problems.push(`${label} has bad shape "${String(raw.shape)}"`);
    }
    if (!isText(raw.tense)) problems.push(`${label} needs a tense`);
    if (raw.cues !== undefined) {
      if (!Array.isArray(raw.cues)) problems.push(`${label}: cues must be a list`);
      else {
        for (const cue of raw.cues) {
          const words = typeof cue === 'string' ? cue.split(' ') : [];
          if (words.length === 0 || !words.every((w) => LOWER_WORD.test(w))) {
            problems.push(`${label} has a bad cue "${String(cue)}" (lowercase words only)`);
          }
        }
      }
    }
    if (!Array.isArray(raw.blanks) || raw.blanks.length === 0) {
      problems.push(`${label} needs a non-empty blanks list`);
    } else {
      for (const blank of raw.blanks) {
        if (!BLANKS.includes(blank as BlankKind)) {
          problems.push(`${label} has bad blank "${String(blank)}"`);
        }
      }
    }
  });
  return problems;
}

function checkPoolSentence(raw: Record<string, unknown>, label: string, problems: string[]): void {
  const keys = ['id', 'kind', 'en', 'grammarId', 'blankWord', 'responses', 'answer'];
  problems.push(...unknownKeys(raw, keys, label));
  if (raw.kind !== 'statement' && raw.kind !== 'qa') {
    problems.push(`${label} has bad kind "${String(raw.kind)}"`);
  }
  if (!isText(raw.en)) problems.push(`${label} needs en`);
  if (!isText(raw.grammarId)) problems.push(`${label} needs grammarId`);
  if (raw.kind === 'statement') {
    if (raw.responses !== undefined || raw.answer !== undefined) {
      problems.push(`${label}: a statement has no responses or answer`);
    }
    if (raw.blankWord !== undefined) {
      const words =
        typeof raw.en === 'string'
          ? (raw.en.toLowerCase().match(/[a-z']+/g) ?? [])
          : ([] as string[]);
      if (!isText(raw.blankWord) || !words.includes(raw.blankWord.toLowerCase())) {
        problems.push(`${label}: blankWord is not a word of the sentence`);
      }
    }
  }
  if (raw.kind !== 'qa') return;
  if (raw.blankWord !== undefined) problems.push(`${label}: a qa has no blankWord`);
  const responses = raw.responses;
  if (!Array.isArray(responses) || responses.length < 2 || !responses.every(isText)) {
    problems.push(`${label} needs at least 2 responses`);
    return;
  }
  const texts = responses.map((r: string) => sameText(r));
  if (new Set(texts).size !== texts.length) problems.push(`${label} has duplicate responses`);
  if (
    !Number.isInteger(raw.answer) ||
    (raw.answer as number) < 0 ||
    (raw.answer as number) >= texts.length
  ) {
    problems.push(`${label} needs exactly one right answer (answer is an index of responses)`);
  }
}

function checkRespondItem(raw: Record<string, unknown>, label: string, problems: string[]): void {
  problems.push(...unknownKeys(raw, ['id', 'question', 'answer', 'wrong', 'verified'], label));
  const { question, answer, wrong } = raw;
  if (raw.verified !== 2) problems.push(`${label} needs verified: 2`);
  if (!isObject(question) || !isText(question.en) || !isText(question.role)) {
    problems.push(`${label} needs a question with en and role`);
    return;
  }
  const qtype = question.qtype as QuestionType;
  if (!QUESTION_TYPES.includes(qtype)) {
    problems.push(`${label} has bad qtype "${String(question.qtype)}"`);
    return;
  }
  const options: { en: unknown; atype: unknown }[] = [];
  if (!isObject(answer) || !isText(answer.en)) problems.push(`${label} needs an answer with en`);
  else {
    options.push(answer as { en: unknown; atype: unknown });
    if (answer.atype === 'universal' || !ANSWER_TYPES.includes(answer.atype as AnswerType)) {
      problems.push(`${label}: the answer has bad atype "${String(answer.atype)}"`);
    } else if (!COMPATIBLE[qtype].includes(answer.atype as AnswerType)) {
      problems.push(`${label}: the answer type ${String(answer.atype)} does not fit ${qtype}`);
    }
  }
  if (!Array.isArray(wrong) || wrong.length < 2) {
    problems.push(`${label} needs at least 2 wrong options`);
    return;
  }
  for (const w of wrong as unknown[]) {
    if (!isObject(w) || !isText(w.en)) {
      problems.push(`${label} has a wrong option without en`);
      continue;
    }
    options.push(w as { en: unknown; atype: unknown });
    if (w.atype === 'universal') problems.push(`${label}: a wrong option is universal`);
    else if (!ANSWER_TYPES.includes(w.atype as AnswerType)) {
      problems.push(`${label}: a wrong option has bad atype "${String(w.atype)}"`);
    } else if (COMPATIBLE[qtype].includes(w.atype as AnswerType)) {
      problems.push(
        `${label}: wrong option "${w.en}" has atype ${String(w.atype)} that fits ${qtype}`,
      );
    }
  }
  const texts = options.map((o) => sameText(String(o.en)));
  if (new Set(texts).size !== texts.length) problems.push(`${label} has duplicate responses`);
}

/** Checks `src/data/sentences/act<N>.json` (`sentences`) or `src/data/responds/act<N>.json`. */
export function validatePool(file: unknown, kind: 'sentences' | 'responds'): string[] {
  if (!Array.isArray(file)) return [`${kind} file is not a list`];
  const problems: string[] = [];
  const seen = new Set<string>();
  file.forEach((raw: unknown, index) => {
    const label = `${kind} item ${index + 1}`;
    if (!isObject(raw)) {
      problems.push(`${label} is not an object`);
      return;
    }
    if (typeof raw.id !== 'string' || !ID_PATTERN.test(raw.id))
      problems.push(`${label} has a bad id`);
    else if (seen.has(raw.id)) problems.push(`${label} "${raw.id}" is a duplicate id`);
    else seen.add(raw.id);
    if (kind === 'sentences') checkPoolSentence(raw, label, problems);
    else checkRespondItem(raw, label, problems);
  });
  return problems;
}
