/**
 * 檢查點 (docs/specs/sprint.md): the player enters a score from an official ETS
 * practice test; on the sprint it is compared with the plan's target for that week,
 * and a score well below it offers to extend. Pure.
 */
import { t } from '../core/i18n';
import { dateKey, sortCheckpoints, type Checkpoint, type Route, type SaveData } from '../core/save';
import { SPRINT_WEEKS, sprintWeek, sprintWeeks } from './sprint';

/** Total-score targets by week of a 12-week sprint (the plan's checkpoints). */
const TARGETS: readonly (readonly [week: number, total: number])[] = [
  [3, 225],
  [5, 375],
  [8, 475],
  [12, 600],
];

/** How far under the target still counts as on track; as far over counts as ahead. */
export const TARGET_MARGIN = 25;

/** A score part as ETS reports it: kept within 5 to 495, rounded to a step of 5. */
export const clampScore = (value: number): number =>
  Math.min(495, Math.max(5, Math.round(value / 5) * 5));

/**
 * The total score the sprint aims for on `now`, rounded to 5. An extended sprint
 * stretches the same curve over its weeks. Undefined on the normal route and
 * before the first checkpoint (week 3 of 12).
 */
export function checkpointTarget(route: Route, now: Date): number | undefined {
  if (route.kind !== 'sprint' || !route.start) return undefined;
  const week = (sprintWeek(route, now) * SPRINT_WEEKS) / sprintWeeks(route);
  const first = TARGETS[0];
  if (!first || week < first[0]) return undefined;
  for (let i = 1; i < TARGETS.length; i++) {
    const [w0, t0] = TARGETS[i - 1] ?? first;
    const [w1, t1] = TARGETS[i] ?? first;
    if (week <= w1) return Math.round((t0 + ((t1 - t0) * (week - w0)) / (w1 - w0)) / 5) * 5;
  }
  return TARGETS[TARGETS.length - 1]?.[1];
}

export type Verdict = 'ahead' | 'on-track' | 'behind';

export function checkpointVerdict(total: number, target: number): Verdict {
  if (total < target - TARGET_MARGIN) return 'behind';
  if (total >= target + TARGET_MARGIN) return 'ahead';
  return 'on-track';
}

/** Records a practice score for today. */
export function addCheckpoint(
  save: SaveData,
  now: Date,
  listening: number,
  reading: number,
): SaveData {
  const entry = {
    date: dateKey(now),
    listening: clampScore(listening),
    reading: clampScore(reading),
  };
  return { ...save, checkpoints: sortCheckpoints([...save.checkpoints, entry]) };
}

/**
 * Records the estimate of a 幕結業考 for today. The first sitting of the day counts:
 * when the same Act already has an entry today, a later sitting changes nothing (it
 * has just seen the questions). `retake` marks a sitting that reused questions.
 */
export function addExamCheckpoint(
  save: SaveData,
  now: Date,
  act: 1 | 2 | 3 | 4,
  listening: number,
  reading: number,
  retake: boolean,
): SaveData {
  const date = dateKey(now);
  const entry: Checkpoint = {
    date,
    listening: clampScore(listening),
    reading: clampScore(reading),
    source: 'exam',
    act,
  };
  if (retake) entry.retake = true;
  const already = save.checkpoints.some(
    (c) => c.source === 'exam' && c.act === act && c.date === date,
  );
  if (already) return save;
  return { ...save, checkpoints: sortCheckpoints([...save.checkpoints, entry]) };
}

/** The most total score an exam of each Act can estimate (the caps of both parts added). */
const EXAM_CAPS: Record<1 | 2 | 3 | 4, number> = { 1: 300, 2: 425, 3: 540, 4: 700 };

/**
 * Whether an exam of this Act can be compared with the sprint's target: only when the
 * target is not above the highest total the exam can estimate (Act 1: 300, 2: 425,
 * 3: 540, 4: 700).
 */
export function examComparable(act: 1 | 2 | 3 | 4, target: number): boolean {
  return target <= EXAM_CAPS[act];
}

/**
 * How an exam sees the target: 'behind' only when even the high end of its range is
 * under target - TARGET_MARGIN, 'ahead' only when even the low end is over target +
 * TARGET_MARGIN, otherwise 'on-track'. Undefined with no target. `total` is the point
 * estimate, which the range already stands for.
 */
export function examVerdict(
  total: number,
  low: number,
  high: number,
  target: number | undefined,
): Verdict | undefined {
  void total;
  if (target === undefined) return undefined;
  if (high < target - TARGET_MARGIN) return 'behind';
  if (low > target + TARGET_MARGIN) return 'ahead';
  return 'on-track';
}

/** Why an exam is not held against the target (undefined when it can be, or no target). */
export function examCapNote(
  act: 1 | 2 | 3 | 4,
  target: number | undefined,
  week?: number,
): string | undefined {
  if (target === undefined || examComparable(act, target)) return undefined;
  const of = week === undefined ? '' : `第 ${week} 週的`;
  const ofEn = week === undefined ? 'the' : `the week ${week}`;
  return t(
    `這場考試最高估到 ${EXAM_CAPS[act]}，不和${of}目標比`,
    `This exam tops out at ${EXAM_CAPS[act]}, so it isn't compared with ${ofEn} target`,
  );
}
