/**
 * 單字快練 and the two routes (一般／衝刺), per docs/specs/sprint.md. Pure: every
 * function takes the save, the town and `now`, so tests can run any day.
 *
 * 快練 teaches words a little ahead of the story: the new words of the place the
 * player is in and of the next place in the same act, in play order. Words with a
 * card are never drilled here (their reviews belong to 今日複習), and new words wait
 * while reviews are due today and no review round has been done today.
 */
import { dateKey, dailyFor, type Route, type SaveData } from '../core/save';
import { actUnits, isActUnlocked, type TownAct } from './townPlan';

/** Words per 快練 round. */
export const SPRINT_SIZE = 10;
/** The sprint route lasts 12 weeks unless extended; the last week teaches nothing new. */
export const SPRINT_WEEKS = 12;
/** Weeks one extension adds. */
export const EXTEND_WEEKS = 4;
/** From week 3 the daily new words are spread over the days left, within these bounds. */
const SPREAD_MIN = 10;
const SPREAD_MAX = 50;
/** Daily review cap: the normal route keeps it small, the sprint route needs room. */
export const REVIEW_LIMIT = { normal: 20, sprint: 200 } as const;
/** Story tasks a day the goal screen aims for. */
export const TASK_GOAL = { normal: 1, sprint: 5 } as const;
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

/** How many weeks the sprint lasts: 12, plus any extensions. */
export const sprintWeeks = (route: Route): number => route.weeks ?? SPRINT_WEEKS;

/** The sprint route's planned last day (start + its weeks - 1 day), as YYYY-MM-DD. */
export function sprintEndDate(start: string, weeks: number = SPRINT_WEEKS): string {
  const [y = 0, m = 1, d = 1] = start.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + weeks * 7 - 1));
}

/**
 * New words a day. Normal route: 10. Sprint: 15 in week 1 and 25 in week 2 to ease
 * in; then `wordsLeft` (words without a card at the start of today) spread over the
 * days up to the end of the next-to-last week, kept within 10 to 50; none in the
 * last week. Never more than `wordsLeft`.
 */
export function dailyNewWordGoal(route: Route, now: Date, wordsLeft: number): number {
  if (route.kind !== 'sprint' || !route.start) return Math.min(NORMAL_NEW_WORDS, wordsLeft);
  const weeks = sprintWeeks(route);
  const week = sprintWeek(route, now);
  if (week >= weeks) return 0;
  if (week <= 1) return Math.min(15, wordsLeft);
  if (week === 2) return Math.min(25, wordsLeft);
  const daysIn = dayIndex(dateKey(now)) - dayIndex(route.start);
  const daysLeft = (weeks - 1) * 7 - daysIn;
  const spread = Math.ceil(wordsLeft / Math.max(1, daysLeft));
  return Math.min(wordsLeft, Math.max(SPREAD_MIN, Math.min(SPREAD_MAX, spread)));
}

/** Adds EXTEND_WEEKS to the sprint; the ask is answered today. */
export function extendSprint(save: SaveData, now: Date): SaveData {
  const weeks = sprintWeeks(save.route) + EXTEND_WEEKS;
  return { ...save, route: { ...save.route, weeks, askedOn: dateKey(now) } };
}

/** The player said no to extending: ask again only after new missed days. */
export function declineExtend(save: SaveData, now: Date): SaveData {
  return { ...save, route: { ...save.route, askedOn: dateKey(now) } };
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

const townWordCache = new WeakMap<object, readonly string[]>();

/** Every word item id taught anywhere in the town, once each. */
export function townWordIds<U extends WordUnit>(town: readonly TownAct<U>[]): readonly string[] {
  let ids = townWordCache.get(town);
  if (!ids) {
    const all = town.flatMap((act) =>
      actUnits(act).flatMap((unit) =>
        unit.tasks.flatMap((task) => task.newWordIds.map((id) => `word:${id}`)),
      ),
    );
    ids = [...new Set(all)];
    townWordCache.set(town, ids);
  }
  return ids;
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
  /** Reviews are due and none done today: 今日複習 first. */
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
  // Count today's 快練 words as still left, so the goal holds still through the day.
  const wordsLeft = townWordIds(town).filter((id) => !(id in save.cards)).length + today;
  const goal = dailyNewWordGoal(save.route, now, wordsLeft);
  const base = { today, goal, words: [] };
  const left = goal - today;
  if (left <= 0) return { ...base, status: 'goal-met' };
  // Reviews come first only until the player has done a review round today: after
  // that, new words are open even if more cards are due.
  if (dueCount > 0 && dailyFor(save, now).reviewed === 0)
    return { ...base, status: 'review-first' };
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

/**
 * Switches route. Choosing 衝刺 starts a fresh 12 weeks today; 一般 keeps the old
 * start (and any extension), so going back is not a loss.
 */
export function chooseRoute(save: SaveData, kind: Route['kind'], now: Date): SaveData {
  if (save.route.kind === kind) return save;
  return {
    ...save,
    route: kind === 'sprint' ? { kind, start: dateKey(now) } : { ...save.route, kind },
  };
}
