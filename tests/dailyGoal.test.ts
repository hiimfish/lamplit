import { describe, expect, it } from 'vitest';
import type { Act } from '../src/content/acts';
import {
  createEmptySave,
  dateKey,
  HISTORY_DAYS,
  mergeSaves,
  recordToday,
  sanitizeSave,
  type DayRecord,
  type SaveData,
} from '../src/core/save';
import { goalStatus, missedDays, shouldOfferExtend } from '../src/learning/dailyGoal';
import { finishListen } from '../src/learning/listen';
import { newStoredCard } from '../src/learning/scheduler';
import { finishTask, taskKey } from '../src/learning/sessionPlan';
import { chooseRoute, declineExtend, finishSprint, sprintCandidates } from '../src/learning/sprint';
import { buildTown } from '../src/learning/townPlan';

const now = new Date(2026, 10, 24, 10, 0, 0);
const day = (offset: number) => new Date(2026, 10, 24 + offset, 10, 0, 0);
const key = (offset: number) => dateKey(day(offset));

const unit = (id: string, tasks = 2) => ({
  id,
  title: id,
  tasks: Array.from({ length: tasks }, (_, i) => ({
    id: `t${i + 1}`,
    newWordIds: [`${id}${i + 1}a`, `${id}${i + 1}b`],
    scene: [{ id: 'l1' }],
  })),
});

const acts: Act[] = [
  {
    no: '一',
    title: 'first',
    places: [
      { unitId: 'a', title: 'A' },
      { unitId: 'b', title: 'B' },
    ],
  },
];
const town = buildTown(acts, [unit('a'), unit('b')]);

const record = (met: boolean, tasks = 0): DayRecord => ({
  tasks,
  sprintNew: 0,
  reviewed: 0,
  listened: 0,
  answered: 0,
  correct: 0,
  met,
});

function sprintSave(history: Record<string, DayRecord>): SaveData {
  return { ...chooseRoute(createEmptySave(now), 'sprint', now), history };
}

describe('recordToday', () => {
  it("copies today's counters into history", () => {
    const played = finishTask(createEmptySave(now), 'a/t1', [], now).save;
    const save = recordToday(played, now, false);
    expect(save.history[key(0)]).toEqual({ ...record(false, 1) });
  });

  it('keeps a met day met', () => {
    const met = recordToday(createEmptySave(now), now, true);
    expect(recordToday(met, now, false).history[key(0)]?.met).toBe(true);
  });

  it('returns the same save when nothing changed', () => {
    const save = recordToday(createEmptySave(now), now, false);
    expect(recordToday(save, now, false)).toBe(save);
  });

  it(`keeps only the last ${HISTORY_DAYS} days`, () => {
    const save = { ...createEmptySave(now), history: { [key(-HISTORY_DAYS)]: record(true) } };
    const next = recordToday(save, now, false);
    expect(Object.keys(next.history)).toEqual([key(0)]);
    const kept = { ...save, history: { [key(1 - HISTORY_DAYS)]: record(true) } };
    expect(Object.keys(recordToday(kept, now, false).history)).toHaveLength(2);
  });
});

describe('history in the save', () => {
  it('starts empty and loads an old save without it', () => {
    expect(createEmptySave(now).history).toEqual({});
    expect(sanitizeSave({ version: 1, cards: {} }, now).history).toEqual({});
  });

  it('cleans bad days and values', () => {
    const raw = {
      history: {
        [key(-1)]: { tasks: 2.7, sprintNew: -3, met: 'yes', listened: 1 },
        soon: { tasks: 1 },
        [key(-2)]: 'played',
        [key(-200)]: { tasks: 1, met: true },
      },
    };
    expect(sanitizeSave(raw, now).history).toEqual({
      [key(-1)]: { ...record(false, 2), listened: 1 },
    });
  });

  it('merges two tabs day by day: larger counters, met if either was', () => {
    const ours = { ...createEmptySave(now), history: { [key(-1)]: record(false, 3) } };
    const theirs = {
      ...createEmptySave(now),
      history: { [key(-1)]: { ...record(true, 1), reviewed: 9 }, [key(-2)]: record(true) },
    };
    expect(mergeSaves(ours, theirs).history).toEqual({
      [key(-1)]: { ...record(true, 3), reviewed: 9 },
      [key(-2)]: record(true),
    });
  });
});

describe('goalStatus', () => {
  it('counts met blocks on a new save', () => {
    const status = goalStatus(town, createEmptySave(now), now, 0);
    expect(status).toMatchObject({
      tasks: false,
      sprint: false,
      review: true,
      listen: true,
      met: 2,
      total: 4,
    });
    expect(status.all).toBe(false);
    expect(goalStatus(town, createEmptySave(now), now, 4).review).toBe(false);
  });

  it("is all met after a task, the day's new words, no reviews and a scene heard", () => {
    const played = finishTask(createEmptySave(now), taskKey('a', 't1'), [], now).save;
    const taught = finishSprint(played, 10, now);
    expect(goalStatus(town, taught, now, 0)).toMatchObject({ listen: false, met: 3, all: false });
    const heard = finishListen(taught, taskKey('a', 't1'), now);
    expect(goalStatus(town, heard, now, 0)).toMatchObject({ met: 4, all: true });
  });

  it('counts 快練 met once every word in reach is taught', () => {
    const save = createEmptySave(now);
    for (const id of sprintCandidates(town, save)) save.cards[id] = newStoredCard(now);
    expect(goalStatus(town, save, now, 0).sprint).toBe(true);
  });

  it('counts 劇情任務 met once the whole story is played', () => {
    const save = createEmptySave(now);
    for (const u of ['a', 'b'])
      for (const t of ['t1', 't2']) save.tasks[taskKey(u, t)] = { stars: 3, plays: 1 };
    expect(goalStatus(town, save, day(1), 0).tasks).toBe(true);
  });
});

describe('missedDays and the offer to extend', () => {
  it('counts days in a row not met, ending yesterday; unplayed days count too', () => {
    const save = sprintSave({ [key(0)]: record(false), [key(2)]: record(false) });
    expect(missedDays(save, day(4))).toBe(4);
    expect(shouldOfferExtend(save, day(4))).toBe(true);
  });

  it('stops at a met day', () => {
    const save = sprintSave({ [key(0)]: record(false), [key(2)]: record(true) });
    expect(missedDays(save, day(4))).toBe(1);
    expect(shouldOfferExtend(save, day(4))).toBe(false);
  });

  it('ignores today, days before history began and days up to the last ask', () => {
    const save = sprintSave({ [key(2)]: record(false), [key(5)]: record(false) });
    expect(missedDays(save, day(2))).toBe(0);
    expect(missedDays(save, day(5))).toBe(3);
    expect(missedDays(declineExtend(save, day(3)), day(5))).toBe(1);
    expect(missedDays(declineExtend(save, day(3)), day(7))).toBe(3);
  });

  it('never asks on the normal route or after the sprint is over', () => {
    const history = { [key(0)]: record(false) };
    const normal = { ...createEmptySave(now), history };
    expect(missedDays(normal, day(5))).toBe(0);
    expect(shouldOfferExtend(sprintSave(history), day(90))).toBe(false);
  });
});
