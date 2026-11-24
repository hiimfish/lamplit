import { describe, expect, it } from 'vitest';
import { ACTS } from '../src/content/acts';
import { UNITS } from '../src/content/units';
import { createEmptySave } from '../src/core/save';
import type { SaveData } from '../src/core/save';
import { grammarOn } from '../src/learning/grammarOn';
import { taskKey } from '../src/learning/sessionPlan';
import { actUnits, buildTown } from '../src/learning/townPlan';

const town = buildTown(ACTS, UNITS);
const act1 = town[0];
if (!act1) throw new Error('the town has no first act');

/** A save where every task listed has been played once. */
function played(keys: string[]): SaveData {
  const save = createEmptySave(new Date('2026-11-25T09:00:00'));
  for (const key of keys) save.tasks[key] = { stars: 3, plays: 1 };
  return save;
}

const tasksOf = (unitIds: readonly string[]): string[] =>
  actUnits(act1)
    .filter((unit) => unitIds.includes(unit.id))
    .flatMap((unit) => unit.tasks.map((task) => taskKey(unit.id, task.id)));

describe('grammarOn', () => {
  it('is off for a new save', () => {
    expect(grammarOn(createEmptySave(new Date('2026-11-25T09:00:00')), town)).toBe(false);
  });

  it('stays off while the words learned so far cannot build enough sentences', () => {
    const firstFive = ['t1', 't2', 't3', 't4', 't5'].map((id) => taskKey('move_in', id));
    expect(grammarOn(played(firstFive), town)).toBe(false);
  });

  it('turns on once Act 1 has been played', () => {
    const all = actUnits(act1).flatMap((unit) =>
      unit.tasks.map((task) => taskKey(unit.id, task.id)),
    );
    expect(all.length).toBeGreaterThan(50);
    expect(grammarOn(played(all), town)).toBe(true);
  });

  it('looks at the plays, not at a stale answer', () => {
    const some = tasksOf(['move_in']);
    expect(grammarOn(played(some), town)).toBe(false);
    const all = actUnits(act1).flatMap((unit) =>
      unit.tasks.map((task) => taskKey(unit.id, task.id)),
    );
    expect(grammarOn(played(all), town)).toBe(true);
    expect(grammarOn(played(some), town)).toBe(false);
  });
});
