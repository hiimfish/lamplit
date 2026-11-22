/**
 * What the town (home) screen shows: the acts with their locations, how far
 * each location is, and which task 繼續 opens. Pure, so it can be tested
 * without a browser.
 */
import type { Act } from '../content/acts';
import type { SaveData } from '../core/save';
import { taskKey } from './sessionPlan';

const STARS_PER_TASK = 3;

interface UnitLike {
  id: string;
  tasks: readonly { id: string }[];
}

/** One location of an act: playable when it has a unit, coming soon when not. */
export interface TownPlace<U> {
  title: string;
  unit?: U;
}

export interface TownAct<U> {
  no: string;
  title: string;
  places: TownPlace<U>[];
}

/**
 * The acts with their units filled in. A unit that no act lists is added to the
 * last act that already has one (the first act if none has), so nothing
 * playable is ever hidden from the town.
 */
export function buildTown<U extends UnitLike & { title: string }>(
  acts: readonly Act[],
  units: readonly U[],
): TownAct<U>[] {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const listed = new Set<string>();
  const town = acts.map((act) => ({
    no: act.no,
    title: act.title,
    places: act.places.map((place): TownPlace<U> => {
      const unit = place.unitId ? byId.get(place.unitId) : undefined;
      if (!unit) return { title: place.title };
      listed.add(unit.id);
      return { title: unit.title, unit };
    }),
  }));
  const extra = units.filter((unit) => !listed.has(unit.id));
  if (extra.length > 0) {
    town[lastPlayableAct(town)]?.places.push(...extra.map((unit) => ({ title: unit.title, unit })));
  }
  return town;
}

/** Index of the last act with a playable location (0 when none has one). */
function lastPlayableAct<U>(town: readonly TownAct<U>[]): number {
  for (let i = town.length - 1; i > 0; i--) {
    if (town[i]?.places.some((place) => place.unit)) return i;
  }
  return 0;
}

/** The playable units of an act, in play order. */
export function actUnits<U>(act: TownAct<U>): U[] {
  return act.places.flatMap((place) => place.unit ?? []);
}

export interface Progress {
  /** Tasks played at least once. */
  done: number;
  total: number;
  stars: number;
  maxStars: number;
}

/** Tasks done and stars earned over some units (one location, or a whole act). */
export function progressOf(save: SaveData, units: readonly UnitLike[]): Progress {
  const progress: Progress = { done: 0, total: 0, stars: 0, maxStars: 0 };
  for (const unit of units) {
    for (const task of unit.tasks) {
      const record = save.tasks[taskKey(unit.id, task.id)];
      progress.total += 1;
      progress.maxStars += STARS_PER_TASK;
      if (record) {
        progress.done += 1;
        progress.stars += record.stars;
      }
    }
  }
  return progress;
}

/** Index of the first task of a unit that was never played, or -1 when all were. */
export function firstNewTask(save: SaveData, unit: UnitLike): number {
  return unit.tasks.findIndex((task) => !(taskKey(unit.id, task.id) in save.tasks));
}

/**
 * Where 繼續 goes among `units` (in play order): the next new task of the
 * location played last (`lastUnitId`) while it still has one, otherwise the
 * first new task in play order. Undefined when every task has been played.
 * A unit's first new task is always unlocked (see isTaskUnlocked).
 */
export function nextStop<U extends UnitLike>(
  save: SaveData,
  units: readonly U[],
  lastUnitId?: string,
): { unit: U; index: number } | undefined {
  const last = units.find((unit) => unit.id === lastUnitId);
  for (const unit of last ? [last, ...units] : units) {
    const index = firstNewTask(save, unit);
    if (index >= 0) return { unit, index };
  }
  return undefined;
}

/** The act shown when the town opens: the one with the task to continue, else the last playable one. */
export function defaultAct<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  lastUnitId?: string,
): number {
  const next = nextStop(save, town.flatMap(actUnits), lastUnitId);
  if (next) return town.findIndex((act) => actUnits(act).includes(next.unit));
  return lastPlayableAct(town);
}
