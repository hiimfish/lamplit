import { describe, expect, it } from 'vitest';
import { ACTS } from '../src/content/acts';
import { GRAMMAR_POINTS } from '../src/content/grammar';
import { UNITS } from '../src/content/units';
import { createEmptySave } from '../src/core/save';
import type { SaveData } from '../src/core/save';
import { drillPointsToday, grammarOn } from '../src/learning/grammarOn';
import { taskKey } from '../src/learning/sessionPlan';
import { buildTown } from '../src/learning/townPlan';

const town = buildTown(ACTS, UNITS);
const now = new Date('2026-11-25T09:00:00');

/** A save where every task listed has been played once. */
function played(keys: string[]): SaveData {
  const save = createEmptySave(now);
  for (const key of keys) save.tasks[key] = { stars: 3, plays: 1 };
  return save;
}

const first = GRAMMAR_POINTS[0];
if (!first) throw new Error('no grammar points');
const firstTask = taskKey(first.unitId, first.taskId);

describe('grammarOn', () => {
  it('is off for a new save', () => {
    expect(grammarOn(createEmptySave(now), town)).toBe(false);
  });

  it('is off while no task that teaches a point was played', () => {
    const other = played([taskKey('nowhere', 't1')]);
    expect(grammarOn(other, town)).toBe(false);
  });

  it('turns on once the first point is played (its bank has enough items)', () => {
    expect(grammarOn(played([firstTask]), town)).toBe(true);
  });
});

describe('drillPointsToday', () => {
  it('gives only played points that have bank items', () => {
    expect(drillPointsToday(createEmptySave(now), now, town)).toEqual([]);
    expect(drillPointsToday(played([firstTask]), now, town).map((p) => p.id)).toEqual([first.id]);
  });
});
