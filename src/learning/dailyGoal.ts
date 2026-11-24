/**
 * 每日目標: whether each block of the day is met, and the 跟不上時 rule (three days
 * in a row missed on the sprint → offer to extend). Pure, per docs/specs/sprint.md.
 */
import { dailyFor, dateKey, HISTORY_DAYS, shiftDay, type SaveData } from '../core/save';
import { grammarGoal } from './grammarDrill';
import { listenGoal, pickListenTask } from './listen';
import { buildDailyReview, taskKey } from './sessionPlan';
import { reviewLimit, sprintPlan, sprintWeek, sprintWeeks, taskGoal } from './sprint';
import { actUnits, type TownAct } from './townPlan';

/** Days in a row missed before the sprint offers to extend. */
export const MISS_LIMIT = 3;

interface GoalTask {
  id: string;
  newWordIds: readonly string[];
  scene: readonly unknown[];
}

interface GoalUnit {
  id: string;
  tasks: readonly GoalTask[];
}

export type GoalBlock = 'tasks' | 'sprint' | 'review' | 'listen' | 'grammar';

export interface GoalStatus {
  /** 劇情任務: today's goal reached, or no story left to play. */
  tasks: boolean;
  /** 單字快練: today's new words taught. */
  sprint: boolean;
  /** 今日複習: nothing due today, or today's review limit (20／200) answered. */
  review: boolean;
  /** 聽力加量: today's scenes heard. */
  listen: boolean;
  /** 文法快練: today's questions answered. */
  grammar: boolean;
  /** Whether 文法快練 is offered today (the drill has sentences to ask). */
  hasGrammar: boolean;
  /**
   * Whether each block counts today. A block with nothing to do (no story left, no
   * new words to teach, nothing due and no review done, nothing to hear again yet,
   * no grammar drill) is 今天不用: neither met nor in the total. A block that starts
   * to count mid-day does so unmet, so `met` never goes down as the day goes on.
   */
  applies: Record<GoalBlock, boolean>;
  /** Blocks met and blocks that count today. */
  met: number;
  total: number;
  all: boolean;
}

/** Today's due reviews, as 今日複習 would count them. */
export const dueCount = (save: SaveData, now: Date): number =>
  buildDailyReview(save, now, reviewLimit(save.route)).length;

/**
 * Which of today's blocks are met. `due` defaults to dueCount. `grammarAvailable`
 * (default false: no 文法快練 block) is drillAvailable(...) for the real town.
 */
export function goalStatus<U extends GoalUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
  now: Date,
  due: number = dueCount(save, now),
  grammarAvailable = false,
): GoalStatus {
  const daily = dailyFor(save, now);
  const storyLeft = town.some((act) =>
    actUnits(act).some((unit) => unit.tasks.some((t) => !(taskKey(unit.id, t.id) in save.tasks))),
  );
  const tasks = daily.tasksDone >= taskGoal(save.route) || !storyLeft;
  const plan = sprintPlan(town, save, now, due);
  const sprint = plan.status === 'goal-met' && plan.today > 0;
  const review = due === 0 || daily.reviewed >= reviewLimit(save.route);
  const listen = daily.listened >= listenGoal(save.route);
  const grammar = daily.grammar >= grammarGoal(save.route);
  const applies: Record<GoalBlock, boolean> = {
    tasks: storyLeft || daily.tasksDone > 0,
    // 'caught-up' (nothing to teach until the story moves on) never counts, met or
    // not: it may turn 'ready' after a task, and a met block must not turn unmet.
    sprint: plan.status === 'ready' || plan.status === 'review-first' || sprint,
    review: due > 0 || daily.reviewed > 0,
    listen: listen || pickListenTask(town, save) !== undefined,
    grammar: grammarAvailable || (grammar && daily.grammar > 0),
  };
  const flags: Record<GoalBlock, boolean> = { tasks, sprint, review, listen, grammar };
  const counted = (Object.keys(applies) as GoalBlock[]).filter((block) => applies[block]);
  const met = counted.filter((block) => flags[block]).length;
  return {
    tasks: applies.tasks && tasks,
    sprint: applies.sprint && sprint,
    review: applies.review && review,
    listen: applies.listen && listen,
    grammar: applies.grammar && grammar,
    hasGrammar: grammarAvailable,
    applies,
    met,
    total: counted.length,
    all: met === counted.length,
  };
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
