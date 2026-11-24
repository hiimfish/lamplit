/**
 * 進度 (docs/specs/sprint.md「進度儀表板」): what has been learned, how far each act
 * is, recent accuracy and days, and on the sprint how far ahead of or behind the
 * plan the story is. Pure; reads the save only.
 */
import { dateKey, daysBetween, shiftDay, type DayRecord, type SaveData } from '../core/save';
import { sprintWeek, sprintWeeks } from './sprint';
import { actUnits, progressOf, type TownAct, type UnitLike } from './townPlan';

/** Items with a card: words and chunks (詞塊) learned so far. */
export function learnedCounts(save: SaveData): { words: number; chunks: number } {
  let words = 0;
  let chunks = 0;
  for (const id of Object.keys(save.cards)) {
    if (id.startsWith('word:')) words += 1;
    else if (id.startsWith('chunk:')) chunks += 1;
  }
  return { words, chunks };
}

/** Tasks played, per act and in all. */
export function taskProgress<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
): { acts: { done: number; total: number }[]; done: number; total: number } {
  const acts = town.map((act) => {
    const { done, total } = progressOf(save, actUnits(act));
    return { done, total };
  });
  return {
    acts,
    done: acts.reduce((sum, act) => sum + act.done, 0),
    total: acts.reduce((sum, act) => sum + act.total, 0),
  };
}

const EMPTY_DAY: DayRecord = {
  tasks: 0,
  sprintNew: 0,
  reviewed: 0,
  listened: 0,
  answered: 0,
  correct: 0,
  met: false,
};

/** The last `count` days up to today, oldest first; a day not played is all zeros. */
export function recentDays(
  save: SaveData,
  now: Date,
  count: number,
): { date: string; record: DayRecord }[] {
  const today = dateKey(now);
  return Array.from({ length: count }, (_, i) => {
    const date = shiftDay(today, i - count + 1);
    return { date, record: save.history[date] ?? EMPTY_DAY };
  });
}

/** Answers and correct ones over the last `days` days; `rate` is null with no answers. */
export function accuracy(
  save: SaveData,
  now: Date,
  days: number,
): { answered: number; correct: number; rate: number | null } {
  let answered = 0;
  let correct = 0;
  for (const { record } of recentDays(save, now, days)) {
    answered += record.answered;
    correct += record.correct;
  }
  return { answered, correct, rate: answered > 0 ? correct / answered : null };
}

export interface PlanDelta {
  /** Tasks played, and tasks the plan expects by the start of today. */
  actual: number;
  planned: number;
  total: number;
  /** Days ahead (positive) or behind (negative) the plan, rounded. */
  days: number;
  week: number;
  weeks: number;
}

/**
 * The sprint plan spreads every task evenly over the teaching weeks (all but the
 * last). Compared at the start of today, so a new day never starts behind.
 * Undefined on the normal route.
 */
export function planDelta<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  now: Date,
): PlanDelta | undefined {
  const { route } = save;
  if (route.kind !== 'sprint' || !route.start) return undefined;
  const { done: actual, total } = taskProgress(town, save);
  const weeks = sprintWeeks(route);
  const perDay = total / Math.max(1, (weeks - 1) * 7);
  const daysIn = Math.max(0, daysBetween(route.start, dateKey(now)));
  const planned = Math.min(total, perDay * daysIn);
  const days = perDay > 0 ? Math.round((actual - planned) / perDay) : 0;
  return {
    actual,
    planned: Math.round(planned),
    total,
    days: days === 0 ? 0 : days,
    week: sprintWeek(route, now),
    weeks,
  };
}
