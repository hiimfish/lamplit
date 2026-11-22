/**
 * 段落填空 (TOEIC Part 6): checks a task's `textFills` (TextFillItem in types.ts).
 * (tests/smoothness.test.ts checks that the text with its answers, the title and every
 * option use taught words.)
 *
 * The messages go to content writers who only see them, so each one names the text
 * (validate.ts adds the task) and says what to change.
 */
import { BLANK, MAX_NOTE_CHARS } from './fills';
import { PASSAGE_KINDS } from './passages';
import { checkId, isIndex, isObject, list, wordCount, type TaskCheckContext } from './common';

/** One text fill per task: it is read on its own screen, blank by blank. */
export const TEXT_FILLS_PER_TASK = 1;
/** Blanks in one text. */
export const TEXT_FILL_MIN_BLANKS = 2;
export const TEXT_FILL_MAX_BLANKS = 4;
/** Options of each blank. */
export const TEXT_FILL_OPTIONS = 4;
/** Words in the title and lines together, each blank filled by its answer. */
export const TEXT_FILL_MAX_WORDS = 90;

const ITEM_KEYS = ['id', 'kind', 'title', 'lines', 'zh', 'blanks'];
const BLANK_KEYS = ['options', 'answer', 'note'];

/** Letters, digits and apostrophes: a blank must not touch one, or it splits a word. */
const WORD_CHAR = /[\p{L}\p{N}'’]/u;

/** Text that is not only white space. */
const isRealText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** How many blanks a line has. */
export const blankCount = (line: string) => line.split(BLANK).length - 1;

/**
 * The lines with blank `i` (counted across all lines, in reading order) replaced by
 * `fill(i)`. With `fill` giving each blank's answer, this is the finished text.
 */
export function fillLines(lines: readonly string[], fill: (i: number) => string): string[] {
  let i = 0;
  return lines.map((line) => line.split(BLANK).reduce((out, part) => `${out}${fill(i++)}${part}`));
}

/** Problems with the task's `textFills`, or none when it has no such field. */
export function checkTextFills(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.textFills === undefined) return [];
  const items = list(task.textFills);
  if (!items || items.length === 0) {
    return ['textFills must be a non-empty list (leave the field out when there is none)'];
  }
  const problems: string[] = [];
  if (items.length > TEXT_FILLS_PER_TASK) {
    problems.push(
      `has ${items.length} text fills (at most ${TEXT_FILLS_PER_TASK}): move one to another task`,
    );
  }
  const seen = ctx.seen('text fill');
  (task.textFills as unknown[]).forEach((raw, i) => {
    if (!isObject(raw)) {
      problems.push(`text fill ${i + 1} must be an object { id, kind, lines, zh, blanks }`);
      return;
    }
    problems.push(...checkItem(raw, seen));
  });
  return problems;
}

function checkItem(item: Record<string, unknown>, seen: Set<string>): string[] {
  const label = `text fill "${String(item.id)}"`;
  const problems: string[] = [];
  const idProblem = checkId(item.id, seen, label);
  if (idProblem) problems.push(`${idProblem} (use lower-case letters, digits and _, unique)`);
  for (const key of Object.keys(item).filter((k) => !ITEM_KEYS.includes(k))) {
    problems.push(`${label} has unknown field "${key}" (it has only ${ITEM_KEYS.join(', ')})`);
  }
  if (typeof item.kind !== 'string' || !PASSAGE_KINDS.includes(item.kind)) {
    problems.push(
      `${label} has bad kind "${String(item.kind)}" (use ${PASSAGE_KINDS.join(', ')}; usually email or notice)`,
    );
  }
  if (item.title !== undefined && !isRealText(item.title)) {
    problems.push(`${label} has an empty title: write one or leave the field out`);
  } else if (typeof item.title === 'string' && item.title.includes('_')) {
    problems.push(`${label} title must have no blank or "_": blanks go only in the lines`);
  }

  const lines = item.lines;
  const linesOk = Array.isArray(lines) && lines.length > 0 && lines.every(isRealText);
  if (!linesOk) problems.push(`${label} needs "lines", a list of non-empty texts`);
  const textLines = linesOk ? (lines as string[]) : [];
  textLines.forEach((line, i) => problems.push(...lineProblems(line, `${label} line ${i + 1}`)));

  const zh = item.zh;
  if (!Array.isArray(zh) || !zh.every(isRealText)) {
    problems.push(`${label} needs "zh", the Chinese of each line with the answers in`);
  } else {
    if (linesOk && zh.length !== textLines.length) {
      problems.push(
        `${label} has ${textLines.length} lines but ${zh.length} zh entries; write one per line`,
      );
    }
    if (zh.some((z: string) => z.includes(BLANK))) {
      problems.push(`${label} zh is the whole text in Chinese with the answers in, no blank`);
    }
  }

  const blanks = item.blanks;
  if (
    !Array.isArray(blanks) ||
    blanks.length < TEXT_FILL_MIN_BLANKS ||
    blanks.length > TEXT_FILL_MAX_BLANKS
  ) {
    const has = Array.isArray(blanks) ? ` (it has ${blanks.length})` : '';
    problems.push(
      `${label} needs "blanks", a list of ${TEXT_FILL_MIN_BLANKS} to ${TEXT_FILL_MAX_BLANKS} blanks${has}`,
    );
    return problems;
  }
  const answers: (string | null)[] = blanks.map((blank: unknown, i) => {
    const found = checkBlank(blank, `${label} blank ${i + 1}`);
    problems.push(...found.problems);
    return found.answer;
  });
  if (!linesOk) return problems;
  const count = textLines.reduce((sum, line) => sum + blankCount(line), 0);
  if (count !== blanks.length) {
    problems.push(
      `${label} has ${count} "${BLANK}" in its lines but ${blanks.length} blanks; they must match (one blank per "${BLANK}", in reading order)`,
    );
  } else if (answers.every((a): a is string => a !== null)) {
    const title = isRealText(item.title) ? item.title : '';
    const words = wordCount([title, ...fillLines(textLines, (i) => answers[i]!)].join(' '));
    if (words > TEXT_FILL_MAX_WORDS) {
      problems.push(
        `${label} has ${words} words with the title and the answers in (max ${TEXT_FILL_MAX_WORDS}): shorten it`,
      );
    }
  }
  return problems;
}

/** Problems with how the blanks are written in one line. */
function lineProblems(line: string, label: string): string[] {
  const problems: string[] = [];
  if (/_/.test(line.split(BLANK).join(''))) {
    problems.push(`${label} must write each blank as exactly three underscores "${BLANK}"`);
  }
  const parts = line.split(BLANK);
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i]!.slice(-1);
    const after = parts[i + 1]!.charAt(0);
    if ((before && WORD_CHAR.test(before)) || (after && WORD_CHAR.test(after))) {
      problems.push(`${label} has a blank glued to a word; put a space around "${BLANK}"`);
      break;
    }
  }
  return problems;
}

/** One blank: 4 different options, an answer index, maybe a short note. */
function checkBlank(value: unknown, label: string): { answer: string | null; problems: string[] } {
  if (!isObject(value)) return { answer: null, problems: [`${label} must be an object`] };
  const problems: string[] = [];
  for (const key of Object.keys(value).filter((k) => !BLANK_KEYS.includes(k))) {
    problems.push(
      `${label} has unknown field "${key}" (a blank has only ${BLANK_KEYS.join(', ')})`,
    );
  }
  const options = value.options;
  let good: string[] | null = null;
  if (!Array.isArray(options) || options.length !== TEXT_FILL_OPTIONS) {
    const has = Array.isArray(options) ? ` (it has ${options.length})` : '';
    problems.push(`${label} needs exactly ${TEXT_FILL_OPTIONS} options${has}`);
  } else if (!options.every((o) => isRealText(o) && o.trim() === o && !o.includes('_'))) {
    problems.push(
      `${label} options must be non-empty texts with no "_" and no space at either end`,
    );
  } else if (new Set(options.map((o: string) => o.toLowerCase())).size !== options.length) {
    problems.push(`${label} has two options that are the same (ignoring case)`);
  } else {
    good = options as string[];
  }
  if (good && !isIndex(value.answer, good.length)) {
    problems.push(`${label} answer must be the index (0 to ${good.length - 1}) of an option`);
  }
  if (value.note !== undefined) {
    if (!isRealText(value.note))
      problems.push(`${label} note must be a non-empty text (or left out)`);
    else if ([...value.note].length > MAX_NOTE_CHARS) {
      problems.push(`${label} note is longer than ${MAX_NOTE_CHARS} characters`);
    }
  }
  const answer =
    good && typeof value.answer === 'number' && isIndex(value.answer, good.length)
      ? good[value.answer]!
      : null;
  return { answer, problems };
}
