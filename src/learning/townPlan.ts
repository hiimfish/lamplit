/**
 * What the town (home) screen shows: the acts with their locations, how far
 * each location is, and which task 下一關 opens. Pure, so it can be tested
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
 * Where 下一關 goes among `units` (in play order): the next new task of the
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

/**
 * Whether an act's locations can be played: the first act always; a later one once
 * every task of the act before it was played at least once (any score). An act the
 * player already has a task record in stays open, so an older save is never locked
 * out of where it was. `openAll` (the dev switch) opens everything.
 */
export function isActUnlocked<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  index: number,
  openAll = false,
): boolean {
  if (openAll || index <= 0) return true;
  const act = town[index];
  const before = town[index - 1];
  if (!act || !before) return false;
  if (progressOf(save, actUnits(act)).done > 0) return true;
  const prev = progressOf(save, actUnits(before));
  return prev.total > 0 && prev.done === prev.total;
}

/**
 * Whether a place of an open act can be played: the act's first playable place
 * always; a later one once every task of the playable place before it was played
 * at least once. A place the save already has a record in stays open. `openAll`
 * (the dev switch) opens everything.
 */
export function isPlaceUnlocked<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  actIndex: number,
  unit: U,
  openAll = false,
): boolean {
  if (openAll) return true;
  const act = town[actIndex];
  if (!act || !isActUnlocked(town, save, actIndex)) return false;
  const units = actUnits(act);
  const at = units.indexOf(unit);
  if (at < 0) return false;
  if (at === 0 || progressOf(save, [unit]).done > 0) return true;
  const before = units[at - 1];
  return before !== undefined && firstNewTask(save, before) === -1;
}

/** The playable units of every act that is open, in play order. */
export function openUnits<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  openAll = false,
): U[] {
  return town.flatMap((act, index) =>
    isActUnlocked(town, save, index, openAll) ? actUnits(act) : [],
  );
}

/**
 * The act shown when the town opens: the open act with the task to continue, else
 * the last open act that has a playable location.
 */
export function defaultAct<U extends UnitLike>(
  town: readonly TownAct<U>[],
  save: SaveData,
  lastUnitId?: string,
  openAll = false,
): number {
  const next = nextStop(save, openUnits(town, save, openAll), lastUnitId);
  if (next) return town.findIndex((act) => actUnits(act).includes(next.unit));
  for (let i = lastPlayableAct(town); i > 0; i--) {
    if (isActUnlocked(town, save, i, openAll)) return i;
  }
  return 0;
}
