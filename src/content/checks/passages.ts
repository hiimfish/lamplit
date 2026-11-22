/**
 * 讀短文 (TOEIC Part 7): checks a task's `passages` (PassageItem in types.ts).
 * (tests/smoothness.test.ts checks that the text, questions and options use taught words.)
 *
 * The messages go to content writers who only see them, so each one names the passage
 * (validate.ts adds the task) and says what to change.
 */
import {
  checkChoiceQuestion,
  checkId,
  isText,
  list,
  sameText,
  wordCount,
  type TaskCheckContext,
} from './common';

export const PASSAGE_KINDS = ['message', 'flyer', 'notice', 'ad', 'form', 'email'];

/** Kinds whose `title` is part of the text (the sender of a message, an email's subject). */
export const PASSAGE_KINDS_WITH_TITLE = ['message', 'email'];

/** Shortest and longest passage, title and lines together. */
export const PASSAGE_MIN_WORDS = 15;
export const PASSAGE_MAX_WORDS = 80;

/** At least this many lines: a one-line text is a sign, not a passage. */
export const PASSAGE_MIN_LINES = 2;

/** Questions per passage, and passages per task (each passage is read on its own screen). */
export const PASSAGE_MAX_QUESTIONS = 3;
export const PASSAGES_PER_TASK = 2;

/** Text that is not only white space. */
const isRealText = (value: unknown): value is string => isText(value) && value.trim() !== '';

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

    const kind = passage.kind;
    if (typeof kind !== 'string' || !PASSAGE_KINDS.includes(kind)) {
      problems.push(`${label} has bad kind "${String(kind)}" (use ${PASSAGE_KINDS.join(', ')})`);
    }

    if (passage.title !== undefined && !isRealText(passage.title)) {
      problems.push(`${label} has an empty title: write one or leave the field out`);
    } else if (
      passage.title === undefined &&
      typeof kind === 'string' &&
      PASSAGE_KINDS_WITH_TITLE.includes(kind)
    ) {
      const what = kind === 'message' ? 'the sender, e.g. "Tony (repair shop)"' : 'the subject';
      problems.push(
        `${label} is ${kind === 'email' ? 'an' : 'a'} ${kind} and needs a title: ${what}`,
      );
    }

    const lines = passage.lines;
    if (!Array.isArray(lines) || lines.length < PASSAGE_MIN_LINES) {
      problems.push(`${label} needs a list of at least ${PASSAGE_MIN_LINES} lines`);
    } else if (!lines.every(isRealText)) {
      const bad = lines.findIndex((line) => !isRealText(line));
      problems.push(`${label} line ${bad + 1} is empty or not text`);
    } else {
      const title = isRealText(passage.title) ? passage.title : '';
      const words = wordCount([title, ...lines].join(' '));
      if (words > PASSAGE_MAX_WORDS) {
        problems.push(
          `${label} has ${words} words with the title (max ${PASSAGE_MAX_WORDS}): shorten it`,
        );
      } else if (words < PASSAGE_MIN_WORDS) {
        problems.push(
          `${label} has ${words} words with the title (min ${PASSAGE_MIN_WORDS}): a shorter text is a sign`,
        );
      }
    }

    const questions = list(passage.questions);
    if (!questions || questions.length < 1 || questions.length > PASSAGE_MAX_QUESTIONS) {
      problems.push(`${label} needs 1 to ${PASSAGE_MAX_QUESTIONS} questions`);
    } else {
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
    }
  }
  return problems;
}
