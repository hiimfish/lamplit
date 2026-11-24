import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACTS, type Act } from '../src/content/acts';
import { UNIT_ORDER } from '../src/content/unitOrder';
import { createEmptySave, type SaveData } from '../src/core/save';
import { taskKey } from '../src/learning/sessionPlan';
import {
  actUnits,
  buildTown,
  defaultAct,
  firstNewTask,
  isActUnlocked,
  isPlaceUnlocked,
  nextStep,
  nextStop,
  openUnits,
  progressOf,
} from '../src/learning/townPlan';

const now = new Date(2026, 10, 22, 10, 0, 0);

const unit = (id: string, tasks = 3) => ({
  id,
  title: `${id} title`,
  tasks: Array.from({ length: tasks }, (_, i) => ({ id: `t${i + 1}` })),
});

/** A save where the given `${unitId}/${taskId}` keys were played, each with these stars. */
function played(stars: Record<string, number>): SaveData {
  const save = createEmptySave(now);
  for (const [key, n] of Object.entries(stars)) {
    const [unitId = '', taskId = ''] = key.split('/');
    save.tasks[taskKey(unitId, taskId)] = { stars: n, plays: 1 };
  }
  return save;
}

const acts: Act[] = [
  {
    no: '一',
    title: 'first',
    places: [
      { unitId: 'a', title: 'A' },
      { unitId: 'b', title: 'B' },
    ],
  },
  { no: '二', title: 'second', places: [{ unitId: 'c', title: 'C' }, { title: 'D' }] },
];

describe('ACTS', () => {
  const unitIds = ACTS.flatMap((act) => act.places.flatMap((place) => place.unitId ?? []));

  it('lists every unit file in an act, so no location is left out of the town', () => {
    const files = readdirSync(new URL('../src/data/units', import.meta.url))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''));
    expect(files.filter((id) => !unitIds.includes(id))).toEqual([]);
  });

  it('keeps the play order of UNIT_ORDER', () => {
    expect(unitIds.filter((id) => UNIT_ORDER.includes(id))).toEqual([...UNIT_ORDER]);
  });

  it('has four acts with unique unit ids and location names', () => {
    expect(ACTS.map((act) => act.no)).toEqual(['一', '二', '三', '四']);
    expect(new Set(unitIds).size).toBe(unitIds.length);
    const titles = ACTS.flatMap((act) => act.places.map((place) => place.title));
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('buildTown', () => {
  it('fills in the units that exist and leaves the others as coming soon', () => {
    const town = buildTown(acts, [unit('a'), unit('b')]);
    expect(town[0]?.places.map((p) => [p.title, p.unit?.id])).toEqual([
      ['a title', 'a'],
      ['b title', 'b'],
    ]);
    expect(town[1]?.places.map((p) => [p.title, p.unit?.id])).toEqual([
      ['C', undefined],
      ['D', undefined],
    ]);
  });

  it('adds a unit no act lists to the last act that has units', () => {
    const town = buildTown(acts, [unit('a'), unit('zzz')]);
    expect(actUnits(town[0]!).map((u) => u.id)).toEqual(['a', 'zzz']);
    expect(actUnits(town[1]!)).toEqual([]);
  });
});

describe('progressOf', () => {
  it('counts tasks done and stars over the given units', () => {
    const save = played({ 'a/t1': 3, 'a/t2': 1, 'b/t1': 2 });
    expect(progressOf(save, [unit('a')])).toEqual({ done: 2, total: 3, stars: 4, maxStars: 9 });
    expect(progressOf(save, [unit('a'), unit('b')])).toEqual({
      done: 3,
      total: 6,
      stars: 6,
      maxStars: 18,
    });
  });

  it('is all zero for nothing', () => {
    expect(progressOf(createEmptySave(now), [])).toEqual({
      done: 0,
      total: 0,
      stars: 0,
      maxStars: 0,
    });
  });
});

describe('firstNewTask', () => {
  it('finds the first task never played', () => {
    expect(firstNewTask(createEmptySave(now), unit('a'))).toBe(0);
    expect(firstNewTask(played({ 'a/t1': 1 }), unit('a'))).toBe(1);
    expect(firstNewTask(played({ 'a/t1': 1, 'a/t2': 1, 'a/t3': 1 }), unit('a'))).toBe(-1);
  });
});

describe('nextStop', () => {
  const units = [unit('a'), unit('b'), unit('c')];

  it('starts at the first task of the first unit', () => {
    expect(nextStop(createEmptySave(now), units)).toEqual({ unit: units[0], index: 0 });
  });

  it('goes on in the location played last while it has a new task', () => {
    const save = played({ 'b/t1': 2 });
    expect(nextStop(save, units, 'b')).toEqual({ unit: units[1], index: 1 });
  });

  it('falls back to play order when the last location is finished or unknown', () => {
    const save = played({ 'a/t1': 1, 'b/t1': 1, 'b/t2': 1, 'b/t3': 1 });
    expect(nextStop(save, units, 'b')).toEqual({ unit: units[0], index: 1 });
    expect(nextStop(save, units, 'nowhere')).toEqual({ unit: units[0], index: 1 });
  });

  it('is undefined when everything was played', () => {
    const save = played({ 'a/t1': 1, 'a/t2': 1, 'a/t3': 1 });
    expect(nextStop(save, [unit('a')])).toBeUndefined();
  });
});

describe('nextStep', () => {
  const units = [unit('a', 2)];
  const open = { open: true, taken: false };

  it('is the next new task while there is one, even with the exam open', () => {
    const save = played({ 'a/t1': 1 });
    expect(nextStep(save, units, open)).toEqual({ kind: 'task', unit: units[0], index: 1 });
  });

  it("leads to the act's exam once every task is done and the exam was never sat", () => {
    const save = played({ 'a/t1': 1, 'a/t2': 3 });
    expect(nextStep(save, units, open)).toEqual({ kind: 'exam' });
  });

  it('is undefined once the exam was sat, or while it is closed', () => {
    const save = played({ 'a/t1': 1, 'a/t2': 3 });
    expect(nextStep(save, units, { open: true, taken: true })).toBeUndefined();
    expect(nextStep(save, units, { open: false, taken: false })).toBeUndefined();
  });
});

describe('defaultAct', () => {
  const town = buildTown(acts, [unit('a', 1), unit('b', 1), unit('c', 1)]);

  it('opens the act with the task to continue', () => {
    expect(defaultAct(town, createEmptySave(now))).toBe(0);
    expect(defaultAct(town, played({ 'a/t1': 1, 'b/t1': 1 }))).toBe(1);
  });

  it('never opens on a locked act, unless everything is open', () => {
    expect(defaultAct(town, createEmptySave(now), 'c')).toBe(0);
    expect(defaultAct(town, createEmptySave(now), 'c', true)).toBe(1);
    expect(defaultAct(town, played({ 'a/t1': 1 }))).toBe(0);
  });

  it('opens the last playable act when everything was played', () => {
    const all = played({ 'a/t1': 1, 'b/t1': 1, 'c/t1': 1 });
    expect(defaultAct(town, all)).toBe(1);
    expect(defaultAct(buildTown(acts, [unit('a', 1)]), played({ 'a/t1': 1 }))).toBe(0);
  });
});

describe('isActUnlocked', () => {
  const town = buildTown(acts, [unit('a', 2), unit('b', 1), unit('c', 1)]);

  it('always opens the first act', () => {
    expect(isActUnlocked(town, createEmptySave(now), 0)).toBe(true);
  });

  it('keeps the next act locked until every task of the act before was played', () => {
    expect(isActUnlocked(town, createEmptySave(now), 1)).toBe(false);
    expect(isActUnlocked(town, played({ 'a/t1': 3, 'a/t2': 3 }), 1)).toBe(false);
    expect(isActUnlocked(town, played({ 'a/t1': 1, 'a/t2': 1, 'b/t1': 1 }), 1)).toBe(true);
  });

  it('keeps an act open where the save already has a record', () => {
    expect(isActUnlocked(town, played({ 'c/t1': 2 }), 1)).toBe(true);
  });

  it('opens everything with the dev switch', () => {
    expect(isActUnlocked(town, createEmptySave(now), 1, true)).toBe(true);
  });

  it('is false for an act that does not exist', () => {
    expect(isActUnlocked(town, createEmptySave(now), 5)).toBe(false);
  });

  it('lists only the units of open acts', () => {
    expect(openUnits(town, createEmptySave(now)).map((u) => u.id)).toEqual(['a', 'b']);
    expect(openUnits(town, createEmptySave(now), true).map((u) => u.id)).toEqual(['a', 'b', 'c']);
  });

  it('locks every later act of the real town on a new save', () => {
    const real = buildTown(ACTS, [unit('cafe', 1)]);
    expect(real.map((_, i) => isActUnlocked(real, createEmptySave(now), i))).toEqual([
      true,
      ...real.slice(1).map(() => false),
    ]);
  });
});

describe('isPlaceUnlocked', () => {
  const town = buildTown(acts, [unit('a', 2), unit('b', 1), unit('c', 1)]);
  const [a, b, c] = [0, 1].flatMap((i) => actUnits(town[i]!));
  if (!a || !b || !c) throw new Error('missing units');

  it('opens only the first place of the first act on a new save', () => {
    const save = createEmptySave(now);
    expect(isPlaceUnlocked(town, save, 0, a)).toBe(true);
    expect(isPlaceUnlocked(town, save, 0, b)).toBe(false);
    expect(isPlaceUnlocked(town, save, 1, c)).toBe(false);
  });

  it('opens the next place once every task of the one before was played', () => {
    expect(isPlaceUnlocked(town, played({ 'a/t1': 3 }), 0, b)).toBe(false);
    expect(isPlaceUnlocked(town, played({ 'a/t1': 1, 'a/t2': 1 }), 0, b)).toBe(true);
  });

  it('opens the first place of a later act with the act', () => {
    expect(isPlaceUnlocked(town, played({ 'a/t1': 1, 'a/t2': 1, 'b/t1': 1 }), 1, c)).toBe(true);
  });

  it('keeps a place open where the save already has a record', () => {
    expect(isPlaceUnlocked(town, played({ 'b/t1': 2 }), 0, b)).toBe(true);
  });

  it('opens everything with the dev switch, and nothing for a unit not in the act', () => {
    expect(isPlaceUnlocked(town, createEmptySave(now), 0, b, true)).toBe(true);
    expect(isPlaceUnlocked(town, createEmptySave(now), 0, c)).toBe(false);
  });
});
