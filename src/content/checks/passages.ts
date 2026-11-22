/**
 * 讀短文 (TOEIC Part 7): checks a task's `passages` (PassageItem in types.ts).
 * (tests/smoothness.test.ts checks that the text, questions and options use taught words.)
 */
import {
  checkChoiceQuestion,
  checkId,
  isText,
  list,
  wordCount,
  type TaskCheckContext,
} from './common';

export const PASSAGE_KINDS = ['message', 'flyer', 'notice', 'ad', 'form', 'email'];

/** Longest passage, title and lines together. */
export const PASSAGE_MAX_WORDS = 80;

/** Problems with the task's `passages`, or none when it has no such field. */
export function checkPassages(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.passages === undefined) return [];
  const passages = list(task.passages);
  if (!passages || passages.length === 0) return ['passages must be a non-empty list'];
  const problems: string[] = [];
  const seen = ctx.seen('passage');
  for (const passage of passages) {
    const label = `passage "${String(passage.id)}"`;
    const idProblem = checkId(passage.id, seen, label);
    if (idProblem) problems.push(idProblem);
    if (typeof passage.kind !== 'string' || !PASSAGE_KINDS.includes(passage.kind)) {
      problems.push(`${label} has bad kind "${String(passage.kind)}"`);
    }
    if (passage.title !== undefined && !isText(passage.title)) {
      problems.push(`${label} has a bad title`);
    }
    const lines = passage.lines;
    if (!Array.isArray(lines) || lines.length === 0 || !lines.every(isText)) {
      problems.push(`${label} needs lines of text`);
    } else {
      const text = [passage.title, ...lines].filter(isText).join(' ');
      const words = wordCount(text);
      if (words > PASSAGE_MAX_WORDS) {
        problems.push(`${label} has ${words} words (max ${PASSAGE_MAX_WORDS})`);
      }
    }
    const questions = list(passage.questions);
    if (!questions || questions.length < 1 || questions.length > 3) {
      problems.push(`${label} needs 1 to 3 questions`);
    } else {
      questions.forEach((q, i) =>
        problems.push(...checkChoiceQuestion(q, `${label} question ${i + 1}`)),
      );
    }
  }
  return problems;
}
