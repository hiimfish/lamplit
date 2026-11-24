/**
 * 每日目標: whether each block of the day is met, and the 跟不上時 rule (three days
 * in a row missed on the sprint → offer to extend). Pure, per docs/specs/sprint.md.
 */
import { dailyFor, dateKey, HISTORY_DAYS, type SaveData } from '../core/save';
import { buildDailyReview, taskKey } from './sessionPlan';
import { reviewLimit, sprintPlan, sprintWeek, sprintWeeks, taskGoal } from './sprint';
import { actUnits, type TownAct } from './townPlan';

/** Days in a row missed before the sprint offers to extend. */
export const MISS_LIMIT = 3;

interface GoalTask {
  id: string;
  newWordIds: readonly string[];
}

interface GoalUnit {
  id: string;
  tasks: readonly GoalTask[];
}

export interface GoalStatus {
  /** 劇情任務: today's goal reached, or no story left to play. */
  tasks: boolean;
  /** 單字快練: today's new words taught, or every word up to one place ahead is. */
  sprint: boolean;
  /** 今日複習: nothing due. */
  review: boolean;
  /** Blocks met and blocks in all. */
  met: number;
  total: number;
  all: boolean;
}

/** Today's due reviews, as 今日複習 would count them. */
export const dueCount = (save: SaveData, now: Date): number =>
  buildDailyReview(save, now, reviewLimit(save.route)).length;

/** Which of today's blocks are met. `due` defaults to dueCount. */
export function goalStatus<U extends GoalUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
  now: Date,
  due: number = dueCount(save, now),
): GoalStatus {
  const daily = dailyFor(save, now);
  const storyLeft = town.some((act) =>
    actUnits(act).some((unit) => unit.tasks.some((t) => !(taskKey(unit.id, t.id) in save.tasks))),
  );
  const tasks = daily.tasksDone >= taskGoal(save.route) || !storyLeft;
  const status = sprintPlan(town, save, now, due).status;
  const sprint = status === 'goal-met' || status === 'caught-up';
  const review = due === 0;
  const flags = [tasks, sprint, review];
  const met = flags.filter(Boolean).length;
  return { tasks, sprint, review, met, total: flags.length, all: met === flags.length };
}

/** The local date `offset` days from `key`, as YYYY-MM-DD. */
function shiftDay(key: string, offset: number): string {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + offset));
}

/**
 * Sprint days in a row, ending yesterday, whose goals were not all met (a day not
 * played counts as missed). Only days since the sprint started, since history was
 * first kept, and after the player was last asked to extend count. 0 on 一般.
 */
export function missedDays(save: SaveData, now: Date): number {
  const { route, history } = save;
  if (route.kind !== 'sprint' || !route.start) return 0;
  const first = Object.keys(history).sort()[0];
  if (!first) return 0;
  let count = 0;
  for (let day = shiftDay(dateKey(now), -1); count < HISTORY_DAYS; day = shiftDay(day, -1)) {
    if (day < route.start || day < first) break;
    if (route.askedOn && day <= route.askedOn) break;
    if (history[day]?.met) break;
    count += 1;
  }
  return count;
}

/** Offer to extend: on a sprint still running, after MISS_LIMIT missed days in a row. */
export function shouldOfferExtend(save: SaveData, now: Date): boolean {
  if (save.route.kind !== 'sprint') return false;
  if (sprintWeek(save.route, now) > sprintWeeks(save.route)) return false;
  return missedDays(save, now) >= MISS_LIMIT;
}
