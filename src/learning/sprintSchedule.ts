/**
 * The 12-week table of docs/specs/sprint.md, worked out by playing the real rules day
 * by day (story first, then 快練) instead of by hand. Pure; scripts/sprint-table.mjs
 * prints it through tests/sprintSchedule.test.ts.
 */
import type { TownAct } from './townPlan';

interface ScheduleUnit {
  id: string;
  tasks: readonly { id: string; newWordIds: readonly string[] }[];
}

/** One row of the table: where the plan stands at the end of a week. */
export interface SprintRow {
  /** Week of the sprint, 1 to `weeks`. */
  week: number;
  /** Words with a card at the end of the week. */
  words: number;
  /** Story tasks played at the end of the week. */
  tasks: number;
}

/** Plays the sprint for `weeks` weeks and returns one row per week. */
export function simulateSprint<U extends ScheduleUnit>(
  town: readonly TownAct<U>[],
  weeks: number,
): SprintRow[] {
  void town;
  void weeks;
  return [];
}

/** The Markdown table for the rows (what sits between the sprint-table markers). */
export function sprintTableMarkdown(rows: readonly SprintRow[]): string {
  void rows;
  return '';
}
