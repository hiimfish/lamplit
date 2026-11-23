/**
 * 讀短文 (TOEIC Part 7): checks a task's `passages` (PassageItem in types.ts): single
 * passages, and from Act 4 on 兩篇／三篇一組閱讀, sets of 2 or 3 texts with one list of
 * questions.
 * (tests/smoothness.test.ts checks that the texts, questions and options use taught words.)
 *
 * The messages go to content writers who only see them, so each one names the passage
 * (validate.ts adds the task) and says what to change.
 */
import {
  checkChoiceQuestion,
  checkId,
  isAct4,
  isIndex,
  isLateAct,
  isObject,
  isText,
  list,
  sameText,
  wordCount,
  type TaskCheckContext,
} from './common';

export const PASSAGE_KINDS = ['message', 'flyer', 'notice', 'ad', 'form', 'email'];

/** Kinds whose `title` is part of the text (the sender of a message, an email's subject). */
export const PASSAGE_KINDS_WITH_TITLE = ['message', 'email'];

/** Shortest and longest passage, title and lines together (longer from Act 3 on). */
export const PASSAGE_MIN_WORDS = 15;
export const PASSAGE_MAX_WORDS = 80;
export const PASSAGE_MAX_WORDS_LATE = 160;
/** A single passage in Act 4: 150 to 300 words, exactly 3 questions. */
export const PASSAGE_MIN_WORDS_ACT4 = 150;
export const PASSAGE_MAX_WORDS_ACT4 = 300;
export const PASSAGE_QUESTIONS_ACT4 = 3;

/** At least this many lines: a one-line text is a sign, not a passage. */
export const PASSAGE_MIN_LINES = 2;

/** Questions per passage, and passages per task (each passage is read on its own screen). */
export const PASSAGE_MAX_QUESTIONS = 3;
export const PASSAGES_PER_TASK = 2;

/**
 * A passage set (Act 4): its words in all (every title and line), its questions, and how
 * many questions must need more than one text. Each text has at least PASSAGE_MIN_LINES
 * lines and PASSAGE_MIN_WORDS words.
 */
export const SET_LIMITS = {
  2: { minWords: 180, maxWords: 260, minQuestions: 4, maxQuestions: 4, minLinked: 1 },
  3: { minWords: 180, maxWords: 320, minQuestions: 4, maxQuestions: 5, minLinked: 2 },
} as const;

const PASSAGE_KEYS = ['id', 'kind', 'title', 'lines', 'questions'];
const SET_KEYS = ['id', 'texts', 'questions'];
const TEXT_KEYS = ['kind', 'title', 'lines'];
const QUESTION_KEYS = ['en', 'zh', 'options', 'answer'];

/** Text that is not only white space. */
const isRealText = (value: unknown): value is string => isText(value) && value.trim() !== '';

/** Fields a writer may have misspelled or invented. */
const unknownKeys = (value: Record<string, unknown>, known: string[]) =>
  Object.keys(value).filter((key) => !known.includes(key));

/** Problems with the task's `passages`, or none when it has no such field. */
export function checkPassages(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.passages === undefined) return [];
  const passages = list(task.passages);
  if (!passages || passages.length === 0) {
    return ['passages must be a non-empty list (leave the field out when there is none)'];
  }
  const problems: string[] = [];
  if (passages.length > PASSAGES_PER_TASK) {
    problems.push(
      `has ${passages.length} passages (at most ${PASSAGES_PER_TASK}): move one to another task`,
    );
  }
  const seen = ctx.seen('passage');
  for (const passage of passages) {
    const label = `passage "${String(passage.id)}"`;
    const idProblem = checkId(passage.id, seen, label);
    if (idProblem) problems.push(`${idProblem} (use lower-case letters, digits and _, unique)`);
    if (passage.texts !== undefined) problems.push(...checkSet(passage, label, ctx));
    else problems.push(...checkSingle(passage, label, ctx));
  }
  return problems;
}

/**
 * The kind, title and lines of one text (a single passage or one text of a set). Returns
 * its problems and its words (title and lines), or undefined words when the lines are bad.
 */
function checkText(
  text: Record<string, unknown>,
  label: string,
): { problems: string[]; words?: number } {
  const problems: string[] = [];
  const kind = text.kind;
  if (typeof kind !== 'string' || !PASSAGE_KINDS.includes(kind)) {
    problems.push(`${label} has bad kind "${String(kind)}" (use ${PASSAGE_KINDS.join(', ')})`);
  }

  if (text.title !== undefined && !isRealText(text.title)) {
    problems.push(`${label} has an empty title: write one or leave the field out`);
  } else if (
    text.title === undefined &&
    typeof kind === 'string' &&
    PASSAGE_KINDS_WITH_TITLE.includes(kind)
  ) {
    const what = kind === 'message' ? 'the sender, e.g. "Tony (repair shop)"' : 'the subject';
    problems.push(
      `${label} is ${kind === 'email' ? 'an' : 'a'} ${kind} and needs a title: ${what}`,
    );
  }

  const lines = text.lines;
  if (!Array.isArray(lines) || lines.length < PASSAGE_MIN_LINES) {
    problems.push(`${label} needs a list of at least ${PASSAGE_MIN_LINES} lines`);
    return { problems };
  }
  if (!lines.every(isRealText)) {
    const bad = lines.findIndex((line) => !isRealText(line));
    problems.push(`${label} line ${bad + 1} is empty or not text`);
    return { problems };
  }
  const title = isRealText(text.title) ? text.title : '';
  return { problems, words: wordCount([title, ...lines].join(' ')) };
}

/** A single passage: one text, 1 to 3 questions (exactly 3 in Act 4). */
function checkSingle(
  passage: Record<string, unknown>,
  label: string,
  ctx: TaskCheckContext,
): string[] {
  const act4 = isAct4(ctx);
  const { problems, words } = checkText(passage, label);
  if (act4) {
    for (const key of unknownKeys(passage, PASSAGE_KEYS)) {
      problems.push(
        `${label} has unknown field "${key}" (a passage has ${PASSAGE_KEYS.join(', ')}; a set has ${SET_KEYS.join(', ')})`,
      );
    }
  }
  if (words !== undefined) {
    const min = act4 ? PASSAGE_MIN_WORDS_ACT4 : PASSAGE_MIN_WORDS;
    const max = act4
      ? PASSAGE_MAX_WORDS_ACT4
      : isLateAct(ctx)
        ? PASSAGE_MAX_WORDS_LATE
        : PASSAGE_MAX_WORDS;
    if (words > max) {
      problems.push(`${label} has ${words} words with the title (max ${max}): shorten it`);
    } else if (words < min) {
      problems.push(
        act4
          ? `${label} has ${words} words with the title (min ${min} in Act 4): lengthen it`
          : `${label} has ${words} words with the title (min ${min}): a shorter text is a sign`,
      );
    }
  }

  const questions = list(passage.questions);
  const [minQ, maxQ] = act4
    ? [PASSAGE_QUESTIONS_ACT4, PASSAGE_QUESTIONS_ACT4]
    : [1, PASSAGE_MAX_QUESTIONS];
  if (!questions || questions.length < minQ || questions.length > maxQ) {
    problems.push(
      minQ === maxQ
        ? `${label} needs exactly ${minQ} questions in Act 4`
        : `${label} needs 1 to ${PASSAGE_MAX_QUESTIONS} questions`,
    );
  } else {
    problems.push(...checkQuestions(questions, label));
    questions.forEach((q, i) => {
      if (q.needs !== undefined) {
        problems.push(`${label} question ${i + 1} has "needs", which only a passage set has`);
      }
    });
  }
  return problems;
}

/** Each question's shape, and no question asked twice. */
function checkQuestions(questions: Record<string, unknown>[], label: string): string[] {
  const problems: string[] = [];
  questions.forEach((q, i) =>
    problems.push(...checkChoiceQuestion(q, `${label} question ${i + 1}`)),
  );
  questions.forEach((q, i) => {
    const earlier = questions.slice(0, i).findIndex((p) => {
      return isText(p.en) && isText(q.en) && sameText(p.en, q.en);
    });
    if (earlier >= 0) {
      problems.push(`${label} question ${i + 1} asks the same as question ${earlier + 1}`);
    }
  });
  return problems;
}

/** 兩篇／三篇一組閱讀 (Act 4): 2 or 3 texts, the words in all, the questions and their `needs`. */
function checkSet(set: Record<string, unknown>, label: string, ctx: TaskCheckContext): string[] {
  const problems: string[] = [];
  if (!isAct4(ctx)) {
    return [`${label} is a passage set (texts), which is for Act 4 units only`];
  }
  for (const key of unknownKeys(set, SET_KEYS)) {
    problems.push(
      `${label} has unknown field "${key}" (a passage set has only ${SET_KEYS.join(', ')}; kind, title and lines go in each text)`,
    );
  }
  const texts = Array.isArray(set.texts) ? set.texts : null;
  if (!texts || (texts.length !== 2 && texts.length !== 3)) {
    problems.push(`${label} needs "texts", a list of 2 or 3 texts { kind, title?, lines }`);
    return problems;
  }
  const count = texts.length as 2 | 3;
  const limits = SET_LIMITS[count];
  let words = 0;
  let wordsKnown = true;
  texts.forEach((text: unknown, t) => {
    const textLabel = `${label} text ${t + 1}`;
    if (!isObject(text)) {
      problems.push(`${textLabel} must be an object { kind, title?, lines }`);
      wordsKnown = false;
      return;
    }
    for (const key of unknownKeys(text, TEXT_KEYS)) {
      problems.push(
        `${textLabel} has unknown field "${key}" (a text has only ${TEXT_KEYS.join(', ')})`,
      );
    }
    const checked = checkText(text, textLabel);
    problems.push(...checked.problems);
    if (checked.words === undefined) wordsKnown = false;
    else {
      words += checked.words;
      if (checked.words < PASSAGE_MIN_WORDS) {
        problems.push(
          `${textLabel} has ${checked.words} words with the title (min ${PASSAGE_MIN_WORDS})`,
        );
      }
    }
  });
  const what = count === 2 ? 'a double set' : 'a triple set';
  if (wordsKnown && (words < limits.minWords || words > limits.maxWords)) {
    problems.push(
      `${label} has ${words} words in all with the titles; ${what} has ${limits.minWords} to ${limits.maxWords}`,
    );
  }

  const questions = list(set.questions);
  if (
    !questions ||
    questions.length < limits.minQuestions ||
    questions.length > limits.maxQuestions
  ) {
    const range =
      limits.minQuestions === limits.maxQuestions
        ? `exactly ${limits.minQuestions}`
        : `${limits.minQuestions} to ${limits.maxQuestions}`;
    problems.push(`${label} is ${what} and needs ${range} questions`);
    return problems;
  }
  problems.push(...checkQuestions(questions, label));
  let linked = 0;
  questions.forEach((q, i) => {
    const qLabel = `${label} question ${i + 1}`;
    for (const key of unknownKeys(q, [...QUESTION_KEYS, 'needs'])) {
      problems.push(
        `${qLabel} has unknown field "${key}" (a question has only ${[...QUESTION_KEYS, 'needs'].join(', ')})`,
      );
    }
    if (q.needs === undefined) return;
    const needs = q.needs;
    if (
      !Array.isArray(needs) ||
      needs.length === 0 ||
      !needs.every((n) => isIndex(n, count)) ||
      new Set(needs).size !== needs.length
    ) {
      problems.push(
        `${qLabel} has bad "needs": a list of different text indexes 0 to ${count - 1} (0 is the first text)`,
      );
      return;
    }
    if (needs.length >= 2) linked += 1;
  });
  if (linked < limits.minLinked) {
    problems.push(
      `${label} has ${linked} question(s) that need more than one text; ${what} needs at least ${limits.minLinked} (mark them with "needs", e.g. [0, 1])`,
    );
  }
  return problems;
}
