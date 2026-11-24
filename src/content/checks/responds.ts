/**
 * 應答題 (TOEIC Part 2, sound only, Act 4 on): checks a task's `responds` (RespondItem in
 * types.ts). Each item is a prompt said by one role and 3 responses said by the guide (your
 * voice), so the prompt's role is any role with a voice but the guide.
 * Audio ids: `${unitId}.respond.${id}` for the prompt and `${unitId}.response.${id}_${index}`
 * for each response, so item ids use only what an audio id accepts.
 * (tests/smoothness.test.ts checks that the prompt and the responses use taught words.)
 */
import type { Role } from '../types';
import { allDifferent, checkId, isAct4, isIndex, isObject, type TaskCheckContext } from './common';

/** Items per task. */
export const RESPONDS_MIN = 3;
export const RESPONDS_MAX = 4;
/** Responses per item (A, B, C). */
export const RESPONSES_PER_ITEM = 3;
/** Who says every response: you. */
export const RESPONSE_ROLE: Role = 'guide';

/** Audio id of a 應答題 prompt. */
export const respondAudioId = (unitId: string, itemId: string) => `${unitId}.respond.${itemId}`;
/** Audio id of response `index` (0-based, content order) of a 應答題 item. */
export const responseAudioId = (unitId: string, itemId: string, index: number) =>
  `${unitId}.response.${itemId}_${index}`;

const ITEM_KEYS = ['id', 'prompt', 'responses', 'answer'];
const PROMPT_KEYS = ['role', 'en', 'zh'];
const RESPONSE_KEYS = ['en', 'zh'];

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

const unknownKeys = (value: Record<string, unknown>, known: string[]) =>
  Object.keys(value).filter((key) => !known.includes(key));

/**
 * Problems with the task's `responds`, or none when it has no such field. `exam`: an
 * exam file (src/content/validateExam.ts), which has 應答題 in every Act and plans its
 * own counts, so the Act 4 and per-task limits do not apply.
 */
export function checkResponds(
  task: Record<string, unknown>,
  ctx: TaskCheckContext,
  exam = false,
): string[] {
  if (task.responds === undefined) return [];
  if (!exam && !isAct4(ctx)) return ['has responds (應答題), which are for Act 4 units only'];
  const items = task.responds;
  if (exam && !Array.isArray(items)) return ['responds must be a list'];
  if (
    !Array.isArray(items) ||
    (!exam && (items.length < RESPONDS_MIN || items.length > RESPONDS_MAX))
  ) {
    return [`responds must be a list of ${RESPONDS_MIN} to ${RESPONDS_MAX} items`];
  }
  const problems: string[] = [];
  const seen = ctx.seen('respond');
  const prompts: string[] = [];
  items.forEach((item: unknown, i) => {
    if (!isObject(item)) {
      problems.push(`respond ${i + 1} must be an object { id, prompt, responses, answer }`);
      return;
    }
    const label = `respond "${String(item.id)}"`;
    const idProblem = checkId(item.id, seen, label);
    if (idProblem) problems.push(`${idProblem} (use lower-case letters, digits and _, unique)`);
    for (const key of unknownKeys(item, ITEM_KEYS)) {
      problems.push(
        `${label} has unknown field "${key}" (an item has only ${ITEM_KEYS.join(', ')})`,
      );
    }

    const prompt = item.prompt;
    if (!isObject(prompt)) {
      problems.push(`${label} needs "prompt": { role, en, zh }`);
    } else {
      for (const key of unknownKeys(prompt, PROMPT_KEYS)) {
        problems.push(
          `${label} prompt has unknown field "${key}" (a prompt has only ${PROMPT_KEYS.join(', ')})`,
        );
      }
      if (prompt.role === RESPONSE_ROLE) {
        problems.push(
          `${label} prompt is said by "${RESPONSE_ROLE}", who says the responses; pick the role who asks`,
        );
      } else if (!ctx.isRole(prompt.role)) {
        problems.push(
          `${label} prompt has bad role "${String(prompt.role)}" (use a role with a voice)`,
        );
      }
      if (!hasText(prompt.en)) problems.push(`${label} prompt needs its English in "en"`);
      else if (
        prompts.some((en) => en.trim().toLowerCase() === (prompt.en as string).trim().toLowerCase())
      ) {
        problems.push(`${label} prompt is the same as an earlier item's`);
      } else prompts.push(prompt.en);
      if (!hasText(prompt.zh)) problems.push(`${label} prompt needs its Chinese in "zh"`);
    }

    const responses = item.responses;
    if (!Array.isArray(responses) || responses.length !== RESPONSES_PER_ITEM) {
      problems.push(
        `${label} needs "responses", a list of exactly ${RESPONSES_PER_ITEM} { en, zh }`,
      );
      return;
    }
    let shaped = true;
    responses.forEach((response: unknown, r) => {
      const rLabel = `${label} response ${r + 1}`;
      if (!isObject(response)) {
        problems.push(`${rLabel} must be an object { en, zh }`);
        shaped = false;
        return;
      }
      for (const key of unknownKeys(response, RESPONSE_KEYS)) {
        problems.push(
          `${rLabel} has unknown field "${key}" (a response has only ${RESPONSE_KEYS.join(', ')})`,
        );
      }
      if (!hasText(response.en)) {
        problems.push(`${rLabel} needs its English in "en"`);
        shaped = false;
      }
      if (!hasText(response.zh)) problems.push(`${rLabel} needs its Chinese in "zh"`);
    });
    if (shaped && !allDifferent(responses.map((r) => String((r as Record<string, unknown>).en)))) {
      problems.push(`${label} has two responses that are the same`);
    }
    if (!isIndex(item.answer, RESPONSES_PER_ITEM)) {
      problems.push(
        `${label} has a bad answer (the index 0 to ${RESPONSES_PER_ITEM - 1} of the right response)`,
      );
    }
  });
  return problems;
}
