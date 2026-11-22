/**
 * 聽對話答題 (TOEIC Part 3): checks a task's `talks` (TalkItem in types.ts).
 * Line audio ids are `${unitId}.talk.${lineId}`, so line ids are unique across the unit.
 * (tests/smoothness.test.ts checks that the lines, questions and options use taught words.)
 */
import { checkChoiceQuestion, checkId, isText, list, type TaskCheckContext } from './common';

export const TALK_MIN_LINES = 3;
export const TALK_MAX_LINES = 6;

/** Problems with the task's `talks`, or none when it has no such field. */
export function checkTalks(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.talks === undefined) return [];
  const talks = list(task.talks);
  if (!talks || talks.length === 0) return ['talks must be a non-empty list'];
  const problems: string[] = [];
  const seen = ctx.seen('talk');
  const lineIds = ctx.seen('talk line');
  for (const talk of talks) {
    const label = `talk "${String(talk.id)}"`;
    const idProblem = checkId(talk.id, seen, label);
    if (idProblem) problems.push(idProblem);
    const lines = list(talk.lines);
    if (!lines || lines.length < TALK_MIN_LINES || lines.length > TALK_MAX_LINES) {
      problems.push(`${label} needs ${TALK_MIN_LINES} to ${TALK_MAX_LINES} lines`);
    } else {
      const roles = new Set<string>();
      for (const line of lines) {
        const lineLabel = `${label} line "${String(line.id)}"`;
        const lineProblem = checkId(line.id, lineIds, lineLabel);
        if (lineProblem) problems.push(lineProblem);
        if (!ctx.isRole(line.role))
          problems.push(`${lineLabel} has bad role "${String(line.role)}"`);
        else roles.add(String(line.role));
        if (!isText(line.en) || !isText(line.zh)) problems.push(`${lineLabel} needs en and zh`);
      }
      if (roles.size !== 2) problems.push(`${label} needs two speakers`);
    }
    const questions = list(talk.questions);
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
