/**
 * 句子填空 (TOEIC Part 5): checks a task's `fills` (FillItem in types.ts).
 * (tests/smoothness.test.ts checks that the sentence with each option uses taught words.)
 */
import { checkId, isIndex, isText, list, textList, type TaskCheckContext } from './common';

/** How the blank is written in `en`: exactly once per sentence. */
export const BLANK = '___';

/** Problems with the task's `fills`, or none when it has no such field. */
export function checkFills(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.fills === undefined) return [];
  const fills = list(task.fills);
  if (!fills || fills.length === 0) return ['fills must be a non-empty list'];
  const problems: string[] = [];
  const seen = ctx.seen('fill');
  for (const fill of fills) {
    const label = `fill "${String(fill.id)}"`;
    const idProblem = checkId(fill.id, seen, label);
    if (idProblem) problems.push(idProblem);
    if (!isText(fill.en) || fill.en.split(BLANK).length !== 2) {
      problems.push(`${label} needs a sentence with "${BLANK}" exactly once`);
    }
    if (!isText(fill.zh)) problems.push(`${label} needs zh`);
    const options = textList(fill.options, 3, 4);
    if (!options) problems.push(`${label} needs 3 or 4 different options`);
    else if (!isIndex(fill.answer, options.length)) problems.push(`${label} has a bad answer`);
    if (fill.note !== undefined && !isText(fill.note)) problems.push(`${label} has a bad note`);
    if (fill.chunkId !== undefined) {
      if (typeof fill.chunkId !== 'string' || !ctx.taughtChunks.has(fill.chunkId)) {
        problems.push(`${label} uses chunk "${String(fill.chunkId)}" not taught by now`);
      }
    }
  }
  return problems;
}
