/**
 * 聽力加量 (docs/specs/sprint.md): hear a story already played again, English only.
 * Pure: which scene comes next, and recording one heard to the end.
 */
import {
  betterSpoken,
  dailyFor,
  touchPlayed,
  type Route,
  type SaveData,
  type SpokenRecord,
} from '../core/save';
import { taskKey } from './sessionPlan';
import { actUnits, type TownAct } from './townPlan';

/** Scenes a day: one on the normal route, three (about 30 minutes) on the sprint. */
export const LISTEN_GOAL = { normal: 1, sprint: 3 } as const;

export const listenGoal = (route: Route): number => LISTEN_GOAL[route.kind];

interface ListenTask {
  id: string;
  scene: readonly unknown[];
}

interface ListenUnit {
  id: string;
  tasks: readonly ListenTask[];
}

/**
 * The played task to hear next: the one heard the fewest times, the earliest in
 * play order among equals. Tasks with no scene are skipped. Undefined until a task
 * has been played.
 */
export function pickListenTask<U extends ListenUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
): { unit: U; task: U['tasks'][number] } | undefined {
  let best: { unit: U; task: U['tasks'][number]; heard: number } | undefined;
  for (const act of town) {
    for (const unit of actUnits(act)) {
      for (const task of unit.tasks) {
        const record = save.tasks[taskKey(unit.id, task.id)];
        if (!record || task.scene.length === 0) continue;
        const heard = record.heard ?? 0;
        if (!best || heard < best.heard) best = { unit, task, heard };
      }
    }
  }
  return best && { unit: best.unit, task: best.task };
}

/** How a scene's 跟著說 went: the average score over the lines that were scored. */
export interface SpokenSummary {
  /** Average score of the scored lines, 0 to 100. */
  score: number;
  /** Lines that got a score (silence is not scored). */
  lines: number;
  /** Lines in the scene. */
  sceneLines: number;
}

/** Scored lines needed before a result is kept: at least 3, and half of the scene. */
export const spokenLinesNeeded = (sceneLines: number): number =>
  Math.max(3, Math.ceil(sceneLines / 2));

/** The record to keep for a summary, or undefined when it is too thin or malformed. */
function spokenRecord(spoken: SpokenSummary | undefined): SpokenRecord | undefined {
  if (!spoken || !Number.isFinite(spoken.score) || !Number.isFinite(spoken.lines)) return undefined;
  const score = Math.round(spoken.score);
  if (score < 0 || score > 100) return undefined;
  if (spoken.lines < spokenLinesNeeded(spoken.sceneLines)) return undefined;
  return { score, lines: Math.floor(spoken.lines) };
}

/**
 * Records a scene heard to the end: the task's count, today's count and the streak.
 * A 跟著說 summary is kept only when it is better than the one already saved.
 */
export function finishListen(
  save: SaveData,
  key: string,
  now: Date,
  spoken?: SpokenSummary,
): SaveData {
  const played = touchPlayed(save, now);
  const record = played.tasks[key];
  const daily = dailyFor(played, now);
  const best = betterSpoken(record?.spoken, spokenRecord(spoken));
  const tasks = record
    ? {
        ...played.tasks,
        [key]: { ...record, heard: (record.heard ?? 0) + 1, ...(best && { spoken: best }) },
      }
    : played.tasks;
  return { ...played, tasks, daily: { ...daily, listened: daily.listened + 1 } };
}
