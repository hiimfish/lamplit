/**
 * The 12-week table of docs/specs/sprint.md, worked out by playing the real rules day
 * by day (story first, then 快練) instead of by hand. Pure; scripts/sprint-table.mjs
 * prints it through tests/sprintSchedule.test.ts.
 */
import { createEmptySave, dateKey, type SaveData } from '../core/save';
import { checkpointTarget } from './checkpoint';
import { newStoredCard } from './scheduler';
import { taskKey } from './sessionPlan';
import { finishSprint, sprintPlan } from './sprint';
import { actUnits, type TownAct } from './townPlan';

interface ScheduleUnit {
  id: string;
  tasks: readonly { id: string; newWordIds: readonly string[] }[];
}

/** One row of the table: where the plan stands at the end of a week. */
export interface SprintRow {
  /** Week of the sprint, 1 to `weeks`. */
  week: number;
  /** Story tasks played at the end of the week. */
  tasks: number;
  /** The act the player is in (1 to 4), or 'done' when every task is played. */
  act: number | 'done';
  /** Words with a card at the end of the week. */
  words: number;
  /** New words a day, averaged over the week. */
  newPerDay: number;
  /** Story tasks a day, averaged over the week. */
  tasksPerDay: number;
  /** The checkpoint target total at the end of the week, when it has one. */
  target?: number;
}

/** Weeks that end with a checkpoint (or the sprint's last teaching week) in the table. */
export const TABLE_WEEKS: readonly number[] = [3, 5, 8, 11, 12];
/** Weeks whose end carries a checkpoint target. */
const CHECKPOINT_WEEKS: readonly number[] = [3, 5, 8, 12];

const START = new Date(2026, 0, 5, 10, 0, 0);
const dayAt = (offset: number): Date =>
  new Date(START.getFullYear(), START.getMonth(), START.getDate() + offset, 10, 0, 0);

const wordCards = (save: SaveData): number =>
  Object.keys(save.cards).filter((id) => id.startsWith('word:')).length;

/**
 * Plays the sprint for `weeks` weeks (a player who follows the plan: the planned story
 * tasks each day, then 快練 rounds until none is ready) and returns one row per week.
 */
export function simulateSprint<U extends ScheduleUnit>(
  town: readonly TownAct<U>[],
  weeks: number = 12,
): SprintRow[] {
  const ordered = town.flatMap((act, actIndex) =>
    actUnits(act).flatMap((unit) =>
      unit.tasks.map((task) => ({ key: taskKey(unit.id, task.id), act: actIndex + 1, task })),
    ),
  );
  const total = ordered.length;
  const teachingDays = Math.max(1, (weeks - 1) * 7);
  let save = createEmptySave(START);
  save = { ...save, route: { kind: 'sprint', start: dateKey(START) } };
  const route = save.route;
  let played = 0;
  const rows: SprintRow[] = [];
  let tasksAtWeekStart = 0;
  let wordsAtWeekStart = 0;

  for (let d = 0; d < weeks * 7; d++) {
    const now = dayAt(d);
    const planned = Math.min(total, Math.round(((d + 1) * total) / teachingDays));
    while (played < planned) {
      const entry = ordered[played];
      if (!entry) break;
      save = { ...save, tasks: { ...save.tasks, [entry.key]: { stars: 2, plays: 1 } } };
      const cards = { ...save.cards };
      for (const id of entry.task.newWordIds) cards[`word:${id}`] ??= newStoredCard(now);
      save = { ...save, cards };
      played++;
    }
    for (let guard = 0; guard < 1000; guard++) {
      const plan = sprintPlan(town, save, now, 0);
      if (plan.status !== 'ready' || plan.words.length === 0) break;
      const cards = { ...save.cards };
      for (const id of plan.words) cards[id] ??= newStoredCard(now);
      save = finishSprint({ ...save, cards }, plan.words.length, now);
    }
    if (d % 7 === 6) {
      const week = (d + 1) / 7;
      const words = wordCards(save);
      const last = ordered[played - 1];
      rows.push({
        week,
        tasks: played,
        act: played >= total ? 'done' : (last?.act ?? 1),
        words,
        newPerDay: (words - wordsAtWeekStart) / 7,
        tasksPerDay: (played - tasksAtWeekStart) / 7,
        target: CHECKPOINT_WEEKS.includes(week) ? checkpointTarget(route, now) : undefined,
      });
      tasksAtWeekStart = played;
      wordsAtWeekStart = words;
    }
  }
  return rows;
}

const thousands = (n: number): string => n.toLocaleString('en-US');

/** The Markdown table for the rows (what sits between the sprint-table markers). */
export function sprintTableMarkdown(rows: readonly SprintRow[]): string {
  const header = [
    '到第幾週結束',
    '累積任務',
    '所在的幕',
    '每天任務',
    '每天新字',
    '累積單字',
    '檢查點',
  ];
  const body = rows
    .filter((row) => TABLE_WEEKS.includes(row.week))
    .map((row) => [
      `第 ${row.week} 週`,
      String(row.tasks),
      row.act === 'done' ? '全部完成' : `第 ${row.act} 幕`,
      row.tasksPerDay.toFixed(1),
      String(Math.round(row.newPerDay)),
      thousands(row.words),
      row.target === undefined ? '—' : `目標 ${row.target}`,
    ]);
  const line = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...body.map(line)].join('\n');
}
