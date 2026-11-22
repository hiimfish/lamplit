/**
 * 句子填空 (TOEIC Part 5): checks a task's `fills` (FillItem in types.ts).
 * (tests/smoothness.test.ts checks that the sentence with each option uses taught words.)
 *
 * The size limits below are what the question screen (src/ui/minigames/Fill.tsx) is laid
 * out for: it must fit a phone held upright without scrolling.
 */
import {
  checkId,
  isIndex,
  isObject,
  isText,
  list,
  wordCount,
  type TaskCheckContext,
} from './common';

/** How the blank is written in `en`: exactly once per sentence. */
export const BLANK = '___';

/** At most this many fills in one task. */
export const MAX_FILLS = 4;
/** Words in the sentence once the answer is put in. */
export const MAX_SENTENCE_WORDS = 14;
/** Words, and characters, in one option (the gap is as wide as the longest option). */
export const MAX_OPTION_WORDS = 3;
export const MAX_OPTION_CHARS = 18;
/** Characters in the note. */
export const MAX_NOTE_CHARS = 30;

/** Letters, digits and apostrophes: the blank must not touch one, or it splits a word. */
const WORD_CHAR = /[\p{L}\p{N}'’]/u;

/** The sentence with `option` put into the blank. */
export const filledSentence = (en: string, option: string) => en.replace(BLANK, option);

/** For comparing a filled sentence with a chunk: case, end punctuation and spacing do not count. */
const comparable = (text: string) =>
  text
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?。！？]+$/u, '')
    .trim()
    .toLowerCase();

/** A string that is not empty and has no space at either end. */
const isTrimmedText = (value: unknown): value is string => isText(value) && value.trim() === value;

/** Problems with the sentence `en` itself (the blank, the spacing). */
function sentenceProblems(en: unknown, label: string): string[] {
  if (!isText(en) || en.split(BLANK).length !== 2) {
    return [`${label} needs a sentence (en) with "${BLANK}" exactly once`];
  }
  const problems: string[] = [];
  if (en.trim() !== en) problems.push(`${label} en has a space at the start or end`);
  if (/\s{2}/.test(en)) problems.push(`${label} en has two spaces in a row`);
  if (/\s[.,!?;:]/.test(en.replace(BLANK, 'x'))) {
    problems.push(`${label} en has a space before a punctuation mark`);
  }
  if (/_/.test(en.replace(BLANK, ''))) {
    problems.push(`${label} en must write the blank as exactly three underscores "${BLANK}"`);
  }
  const at = en.indexOf(BLANK);
  const before = en[at - 1];
  const after = en[at + BLANK.length];
  if ((before && WORD_CHAR.test(before)) || (after && WORD_CHAR.test(after))) {
    problems.push(
      `${label} en has the blank glued to a word; put a space between "${BLANK}" and the next word`,
    );
  }
  return problems;
}

/** The options as texts when they are all good, with their problems. */
function optionProblems(
  value: unknown,
  label: string,
  blankFirst: boolean,
): { options: string[] | null; problems: string[] } {
  if (!Array.isArray(value) || value.length < 3 || value.length > 4) {
    return { options: null, problems: [`${label} needs 3 or 4 options`] };
  }
  const problems: string[] = [];
  value.forEach((option, i) => {
    const which = `${label} option ${i + 1}`;
    if (!isTrimmedText(option)) {
      problems.push(`${which} must be a non-empty text with no space at either end`);
      return;
    }
    if (option.includes(BLANK) || option.includes('_')) {
      problems.push(`${which} "${option}" must not contain "_"`);
    }
    if (/\s{2}/.test(option)) problems.push(`${which} "${option}" has two spaces in a row`);
    if (wordCount(option) > MAX_OPTION_WORDS) {
      problems.push(`${which} "${option}" is longer than ${MAX_OPTION_WORDS} words`);
    }
    if (option.length > MAX_OPTION_CHARS) {
      problems.push(`${which} "${option}" is longer than ${MAX_OPTION_CHARS} characters`);
    }
    // At the start of the sentence the right one must be capitalised, so all of them are
    // (a single capital letter would give the answer away).
    if (blankFirst && !/^\p{Lu}/u.test(option) && !/^\p{N}/u.test(option)) {
      problems.push(`${which} "${option}" starts the sentence, so it needs a capital letter`);
    }
  });
  const texts = value.filter(isTrimmedText);
  if (new Set(texts.map((t) => t.toLowerCase())).size !== texts.length) {
    problems.push(`${label} has two options that are the same (ignoring case)`);
  }
  return { options: problems.length === 0 ? (value as string[]) : null, problems };
}

/** Problems with the task's `fills`, or none when it has no such field. */
export function checkFills(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.fills === undefined) return [];
  const fills = list(task.fills);
  if (!fills || fills.length === 0) return ['fills must be a non-empty list'];
  const problems: string[] = [];
  if (fills.length > MAX_FILLS) {
    problems.push(`has ${fills.length} fills; at most ${MAX_FILLS} in one task`);
  }
  const seen = ctx.seen('fill');
  (task.fills as unknown[]).forEach((raw, i) => {
    const fill = fills[i] ?? {};
    const label = `fill ${isObject(raw) ? `"${String(fill.id)}"` : `${i + 1}`}`;
    if (!isObject(raw)) {
      problems.push(`${label} must be an object`);
      return;
    }
    const idProblem = checkId(fill.id, seen, label);
    if (idProblem) problems.push(idProblem);
    const enProblems = sentenceProblems(fill.en, label);
    problems.push(...enProblems);
    const en = typeof fill.en === 'string' ? fill.en : '';
    if (!isText(fill.zh) || fill.zh.trim() === '') {
      problems.push(`${label} needs zh, the Chinese of the whole sentence`);
    } else if (fill.zh.includes(BLANK)) {
      problems.push(`${label} zh is the whole sentence in Chinese, with no blank`);
    }
    const { options, problems: optProblems } = optionProblems(
      fill.options,
      label,
      en.startsWith(BLANK),
    );
    problems.push(...optProblems);
    if (options && !isIndex(fill.answer, options.length)) {
      problems.push(`${label} answer must be the index (0 to ${options.length - 1}) of an option`);
    }
    if (fill.note !== undefined) {
      if (!isText(fill.note) || fill.note.trim() === '') {
        problems.push(`${label} note must be a non-empty text (or left out)`);
      } else if ([...fill.note].length > MAX_NOTE_CHARS) {
        problems.push(`${label} note is longer than ${MAX_NOTE_CHARS} characters`);
      }
    }
    if (fill.chunkId !== undefined) {
      if (typeof fill.chunkId !== 'string' || !ctx.taughtChunks.has(fill.chunkId)) {
        problems.push(
          `${label} uses chunk "${String(fill.chunkId)}", which is not a chunk of this unit taught by this task or earlier`,
        );
      }
    }
    const answer =
      options && typeof fill.answer === 'number' && isIndex(fill.answer, options.length)
        ? options[fill.answer]
        : null;
    if (enProblems.length === 0 && answer) {
      const full = filledSentence(en, answer);
      if (wordCount(full) > MAX_SENTENCE_WORDS) {
        problems.push(
          `${label} sentence "${full}" is longer than ${MAX_SENTENCE_WORDS} words with the answer in`,
        );
      }
    }
  });
  return problems;
}

/**
 * A fill with a `chunkId` must be that chunk once the answer is put in: its `en` or one of
 * its `accept` variants (ignoring case and end punctuation). This needs the unit's chunks,
 * which checkFills does not get, so it runs on the whole unit. Expects a unit that
 * otherwise passes validateUnit; anything malformed is left to that.
 */
export function checkFillChunks(value: unknown): string[] {
  if (!isObject(value)) return [];
  const unit = value;
  const chunks = new Map<string, Record<string, unknown>>();
  for (const chunk of list(unit.chunks) ?? []) {
    if (typeof chunk.id === 'string') chunks.set(chunk.id, chunk);
  }
  const problems: string[] = [];
  for (const task of list(unit.tasks) ?? []) {
    for (const fill of list(task.fills) ?? []) {
      if (typeof fill.chunkId !== 'string') continue;
      const chunk = chunks.get(fill.chunkId);
      const options = fill.options;
      if (!chunk || typeof fill.en !== 'string' || !Array.isArray(options)) continue;
      const answer: unknown = typeof fill.answer === 'number' ? options[fill.answer] : undefined;
      if (typeof answer !== 'string') continue;
      const full = filledSentence(fill.en, answer);
      const variants = [chunk.en, ...(Array.isArray(chunk.accept) ? chunk.accept : [])].filter(
        (v): v is string => typeof v === 'string',
      );
      if (!variants.some((v) => comparable(v) === comparable(full))) {
        problems.push(
          `${String(unit.id)}: task "${String(task.id)}" fill "${String(fill.id)}" reads "${full}" with the answer in, but chunk "${fill.chunkId}" is "${String(chunk.en)}"; make them the same or drop chunkId`,
        );
      }
    }
  }
  return problems;
}
