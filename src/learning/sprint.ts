/**
 * 單字快練 and the two routes (一般／衝刺), per docs/specs/sprint.md. Pure: every
 * function takes the save, the town and `now`, so tests can run any day.
 *
 * 快練 teaches words a little ahead of the story: the new words of the place the
 * player is in and of the next place in the same act, in play order. Words with a
 * card are never drilled here (their reviews belong to 今日複習), and new words wait
 * while any review is due.
 */
import { dateKey, dailyFor, type Route, type SaveData } from '../core/save';
import { actUnits, isActUnlocked, type TownAct } from './townPlan';

/** Words per 快練 round. */
export const SPRINT_SIZE = 10;
/** The sprint route lasts 12 weeks; the last one teaches nothing new. */
export const SPRINT_WEEKS = 12;
/** Daily review cap: the normal route keeps it small, the sprint route needs room. */
export const REVIEW_LIMIT = { normal: 20, sprint: 200 } as const;
/** Story tasks a day the goal screen aims for. */
export const TASK_GOAL = { normal: 1, sprint: 4 } as const;
/** New words a day on the normal route. */
const NORMAL_NEW_WORDS = 10;

interface WordTask {
  id: string;
  newWordIds: readonly string[];
}

interface WordUnit {
  id: string;
  tasks: readonly WordTask[];
}

const DAY_MS = 86_400_000;

function dayIndex(key: string): number {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Week of the sprint route, 1 on the start day; 0 on the normal route. */
export function sprintWeek(route: Route, now: Date): number {
  if (route.kind !== 'sprint' || !route.start) return 0;
  const days = dayIndex(dateKey(now)) - dayIndex(route.start);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/** The sprint route's planned last day (start + 12 weeks - 1 day), as YYYY-MM-DD. */
export function sprintEndDate(start: string): string {
  const [y = 0, m = 1, d = 1] = start.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + SPRINT_WEEKS * 7 - 1));
}

/** New words a day: 10 on the normal route; 15, 25, then 42, and none in week 12+. */
export function dailyNewWordGoal(route: Route, now: Date): number {
  if (route.kind !== 'sprint') return NORMAL_NEW_WORDS;
  const week = sprintWeek(route, now);
  if (week <= 1) return 15;
  if (week === 2) return 25;
  if (week < SPRINT_WEEKS) return 42;
  return 0;
}

export const reviewLimit = (route: Route): number => REVIEW_LIMIT[route.kind];
export const taskGoal = (route: Route): number => TASK_GOAL[route.kind];

const played = (save: SaveData, unit: WordUnit): boolean =>
  unit.tasks.some((task) => `${unit.id}/${task.id}` in save.tasks);

/**
 * The places 快練 may teach from: the furthest place (in play order, open acts only)
 * the player has played a task in (the first place on a new save), and the next
 * place when it is in the same act.
 */
export function sprintWindow<U extends WordUnit>(town: readonly TownAct<U>[], save: SaveData): U[] {
  const open = town.flatMap((act, index) =>
    isActUnlocked(town, save, index) ? actUnits(act).map((unit) => ({ unit, act: index })) : [],
  );
  let current = 0;
  open.forEach((entry, i) => {
    if (played(save, entry.unit)) current = i;
  });
  const here = open[current];
  if (!here) return [];
  const next = open[current + 1];
  return next && next.act === here.act ? [here.unit, next.unit] : [here.unit];
}

/** Word item ids of the window, in play order, that have no card yet. */
export function sprintCandidates<U extends WordUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
): string[] {
  const ids = sprintWindow(town, save).flatMap((unit) =>
    unit.tasks.flatMap((task) => task.newWordIds.map((id) => `word:${id}`)),
  );
  return [...new Set(ids)].filter((id) => !(id in save.cards));
}

export type SprintStatus =
  /** Reviews are due: 今日複習 first. */
  | 'review-first'
  /** Today's new-word goal is met. */
  | 'goal-met'
  /** Every word up to one place ahead is taught: play the story to go on. */
  | 'caught-up'
  | 'ready';

export interface SprintPlan {
  status: SprintStatus;
  /** Word item ids for this round (empty unless ready). */
  words: string[];
  /** New words taught by 快練 today and the day's goal. */
  today: number;
  goal: number;
}

/** What 快練 would do right now. `dueCount` is today's due reviews (buildDailyReview). */
export function sprintPlan<U extends WordUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
  now: Date,
  dueCount: number,
): SprintPlan {
  const today = dailyFor(save, now).sprintNew;
  const goal = dailyNewWordGoal(save.route, now);
  const base = { today, goal, words: [] };
  if (dueCount > 0) return { ...base, status: 'review-first' };
  const left = goal - today;
  if (left <= 0) return { ...base, status: 'goal-met' };
  const candidates = sprintCandidates(town, save);
  if (candidates.length === 0) return { ...base, status: 'caught-up' };
  return { ...base, status: 'ready', words: candidates.slice(0, Math.min(SPRINT_SIZE, left)) };
}

/** Records a finished 快練 round: `count` new words toward today's goal. */
export function finishSprint(save: SaveData, count: number, now: Date): SaveData {
  const daily = dailyFor(save, now);
  return { ...save, daily: { ...daily, sprintNew: daily.sprintNew + count } };
}

/** Records a finished 今日複習 round of `count` answers. */
export function finishReview(save: SaveData, count: number, now: Date): SaveData {
  const daily = dailyFor(save, now);
  return { ...save, daily: { ...daily, reviewed: daily.reviewed + count } };
}

/** Switches route. Choosing 衝刺 starts its 12 weeks today; 一般 keeps the old start. */
export function chooseRoute(save: SaveData, kind: Route['kind'], now: Date): SaveData {
  if (save.route.kind === kind) return save;
  return {
    ...save,
    route: kind === 'sprint' ? { kind, start: dateKey(now) } : { kind, start: save.route.start },
  };
}
