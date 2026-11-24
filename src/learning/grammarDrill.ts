/**
 * 文法快練 (docs/specs/sprint.md): a short daily drill from the hand-written grammar bank
 * (src/data/grammar). Which points to drill, the questions, remembering the items
 * answered, and finishing a round. Pure; no FSRS cards. Nothing here imports the units
 * or the bank: the town, points and items come in as arguments.
 */
import type { GrammarPoint } from '../content/grammar';
import type { GrammarItem } from '../content/grammarBank';
import { dailyFor, keepNewestSeen, touchPlayed } from '../core/save';
import type { GrammarSeen, Route, SaveData } from '../core/save';
import { makeRng, shuffle, shuffledOptions } from './gen/common';
import { mistakeTotals } from './mistakes';
import { NO_ITEM } from './questions';
import type { AnswerResult, FillQuestion, Question } from './questions';
import { addCoins, reviewCoins, taskKey } from './sessionPlan';
import { actUnits } from './townPlan';
import type { TownAct } from './townPlan';

/** Days of `g:` counts that decide which points come first. */
const MISTAKE_DAYS = 30;

/** Points a round practises at most. */
export const DRILL_POINTS = 6;

const BLANK = '___';

/** The part of a unit the drill needs: its tasks and the words each teaches. */
export interface DrillUnit {
  id: string;
  tasks: readonly { id: string; newWordIds: readonly string[] }[];
}

/** Questions in one round: 10 on the normal route, 15 on the sprint. */
export function grammarGoal(route: Route): number {
  return route.kind === 'sprint' ? 15 : 10;
}

/** Questions still to answer today (never below 0). */
export function drillRemaining(save: SaveData, route: Route, now: Date): number {
  return Math.max(0, grammarGoal(route) - dailyFor(save, now).grammar);
}

/** The points whose home task exists in the town and has been played at least once. */
function playedPoints<U extends DrillUnit>(
  save: SaveData,
  town: readonly TownAct<U>[],
  points: readonly GrammarPoint[],
): GrammarPoint[] {
  const tasks = new Set(
    town.flatMap((act) =>
      actUnits(act).flatMap((unit) => unit.tasks.map((task) => taskKey(unit.id, task.id))),
    ),
  );
  return points.filter((point) => {
    const key = taskKey(point.unitId, point.taskId);
    return tasks.has(key) && (save.tasks[key]?.plays ?? 0) >= 1;
  });
}

/**
 * The points to drill today: only those already played, the ones with the most `g:`
 * mistakes in the last 30 days first, then the least asked, at most `limit`.
 */
export function pickDrillPoints<U extends DrillUnit>(
  save: SaveData,
  now: Date,
  town: readonly TownAct<U>[],
  points: readonly GrammarPoint[],
  limit = DRILL_POINTS,
): GrammarPoint[] {
  const open = playedPoints(save, town, points);
  const totals = mistakeTotals(save, now, MISTAKE_DAYS);
  const missed = (point: GrammarPoint) => totals[`g:${point.id}`]?.[0] ?? 0;
  const asked = (point: GrammarPoint) => totals[`g:${point.id}`]?.[1] ?? 0;
  const order = new Map(open.map((point, i) => [point.id, i]));
  const index = (point: GrammarPoint) => order.get(point.id) ?? 0;
  const wrong = open
    .filter((point) => missed(point) >= 1)
    .sort(
      (a, b) =>
        missed(b) - missed(a) ||
        missed(b) / Math.max(asked(b), 1) - missed(a) / Math.max(asked(a), 1) ||
        index(a) - index(b),
    );
  const rest = open
    .filter((point) => missed(point) < 1)
    .sort((a, b) => asked(a) - asked(b) || index(a) - index(b));
  return [...wrong, ...rest].slice(0, Math.max(0, limit));
}

/**
 * The word ids taught up to the furthest task the player has played, in town order
 * (every earlier task counts, played or not). Empty when nothing was played.
 */
export function taughtUpTo<U extends DrillUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
): Set<string> {
  const flat = town.flatMap((act) =>
    actUnits(act).flatMap((unit) =>
      unit.tasks.map((task) => ({ key: taskKey(unit.id, task.id), words: task.newWordIds })),
    ),
  );
  let last = -1;
  flat.forEach((task, i) => {
    if (task.key in save.tasks) last = i;
  });
  return new Set(flat.slice(0, last + 1).flatMap((task) => task.words));
}

/**
 * One point's items in the order to ask them: never answered first (in a shuffled
 * order), then the ones last answered wrong, then the rest; both by oldest answer first.
 */
function itemOrder(
  items: readonly GrammarItem[],
  seen: Record<string, GrammarSeen>,
  rng: () => number,
): GrammarItem[] {
  const fresh = shuffle(
    items.filter((item) => !seen[item.id]),
    rng,
  );
  const oldest = (a: GrammarItem, b: GrammarItem) => (seen[a.id]?.at ?? 0) - (seen[b.id]?.at ?? 0);
  const wrong = items.filter((item) => seen[item.id]?.wrong).sort(oldest);
  const right = items.filter((item) => seen[item.id] && !seen[item.id]?.wrong).sort(oldest);
  return [...fresh, ...wrong, ...right];
}

/** The 填空 question of one bank item, options shuffled. Null when the item is broken. */
function itemQuestion(item: GrammarItem, rng: () => number): FillQuestion | null {
  const at = item.en.indexOf(BLANK);
  const answer = item.options[item.answer];
  if (at < 0 || answer === undefined) return null;
  return {
    kind: 'fill',
    before: item.en.slice(0, at),
    after: item.en.slice(at + BLANK.length),
    answer,
    zh: item.zh,
    note: item.note,
    options: shuffledOptions(item.options, rng),
    correctId: `o${item.answer}`,
    itemId: NO_ITEM,
    grammar: true,
    grammarIds: [item.grammarId],
    bankId: item.id,
  };
}

/**
 * A round of up to `count` questions over the points, one point after another in turn,
 * each from the point's bank items in `itemOrder`. An item is asked once per round.
 * The same seed (and save) gives the same round.
 */
export function buildDrill(
  points: readonly GrammarPoint[],
  bank: Readonly<Record<string, readonly GrammarItem[]>>,
  seen: Record<string, GrammarSeen> | undefined,
  seed: number,
  count: number,
): Question[] {
  const rng = makeRng(seed);
  const queues = points
    .map((point) => itemOrder(bank[point.id] ?? [], seen ?? {}, rng))
    .filter((queue) => queue.length > 0);
  const used = new Set<string>();
  const questions: Question[] = [];
  while (questions.length < count && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      if (questions.length >= count) break;
      const item = queue.shift();
      if (!item || used.has(item.id)) continue;
      used.add(item.id);
      const question = itemQuestion(item, rng);
      if (question) questions.push(question);
    }
  }
  return questions;
}

/** Remembers a 文法快練 answer in `grammarSeen`; other questions leave the save as it is. */
export function markGrammarItem(
  save: SaveData,
  question: Question,
  result: AnswerResult,
  now: Date,
): SaveData {
  if (question.kind !== 'fill' || !question.bankId) return save;
  const entry: GrammarSeen = { at: now.getTime() };
  if (!result.correct) entry.wrong = true;
  const grammarSeen = keepNewestSeen({ ...save.grammarSeen, [question.bankId]: entry });
  return grammarSeen ? { ...save, grammarSeen } : save;
}

/**
 * Counts a finished round: `answered` questions on `daily.grammar`, the streak, and the
 * coins of a review round (same rate: 5 per correct answer; `correct` defaults to all).
 */
export function finishDrill(
  save: SaveData,
  answered: number,
  now: Date,
  correct: number = answered,
): SaveData {
  if (answered <= 0) return save;
  const played = touchPlayed(save, now);
  const daily = dailyFor(played, now);
  const results: AnswerResult[] = Array.from({ length: Math.min(correct, answered) }, () => ({
    itemId: '',
    correct: true,
    usedHelp: false,
    ms: 0,
  }));
  return addCoins(
    { ...played, daily: { ...daily, grammar: daily.grammar + answered } },
    reviewCoins(results),
  );
}
