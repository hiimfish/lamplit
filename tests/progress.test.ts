import { describe, expect, it } from 'vitest';
import { ACTS, type Act } from '../src/content/acts';
import { UNITS } from '../src/content/units';
import { createEmptySave, dateKey, type DayRecord, type SaveData } from '../src/core/save';
import {
  accuracy,
  learnedCounts,
  planDelta,
  recentDays,
  taskProgress,
} from '../src/learning/progress';
import { newStoredCard } from '../src/learning/scheduler';
import { taskKey } from '../src/learning/sessionPlan';
import { chooseRoute, extendSprint } from '../src/learning/sprint';
import { buildTown } from '../src/learning/townPlan';

const now = new Date(2026, 10, 24, 10, 0, 0);
const day = (offset: number) => new Date(2026, 10, 24 + offset, 10, 0, 0);
const key = (offset: number) => dateKey(day(offset));

const unit = (id: string, tasks: number) => ({
  id,
  title: id,
  tasks: Array.from({ length: tasks }, (_, i) => ({ id: `t${i + 1}` })),
});

const acts: Act[] = [
  { no: '一', title: 'first', places: [{ unitId: 'a', title: 'A' }] },
  { no: '二', title: 'second', places: [{ unitId: 'b', title: 'B' }] },
];
const town = buildTown(acts, [unit('a', 40), unit('b', 37)]);

const record = (answered: number, correct: number, tasks = 0): DayRecord => ({
  tasks,
  sprintNew: 0,
  reviewed: 0,
  listened: 0,
  grammar: 0,
  answered,
  correct,
  met: false,
});

function playedTasks(save: SaveData, count: number): SaveData {
  const tasks = { ...save.tasks };
  for (let i = 0; i < count; i++) {
    const [u, n] = i < 40 ? ['a', i + 1] : ['b', i - 39];
    tasks[taskKey(u as string, `t${n}`)] = { stars: 2, plays: 1 };
  }
  return { ...save, tasks };
}

describe('learnedCounts and taskProgress', () => {
  it('counts words and chunks with a card', () => {
    const save = createEmptySave(now);
    for (const id of ['word:a', 'word:b', 'chunk:c', 'pair:d']) save.cards[id] = newStoredCard(now);
    expect(learnedCounts(save)).toEqual({ words: 2, chunks: 1 });
  });

  it('counts tasks played per act and in all', () => {
    const save = playedTasks(createEmptySave(now), 42);
    expect(taskProgress(town, save)).toEqual({
      acts: [
        { done: 40, total: 40 },
        { done: 2, total: 37 },
      ],
      done: 42,
      total: 77,
    });
  });

  it('knows the real town has 360 tasks', () => {
    expect(taskProgress(buildTown(ACTS, UNITS), createEmptySave(now)).total).toBe(360);
  });
});

describe('recentDays and accuracy', () => {
  const save = {
    ...createEmptySave(now),
    history: {
      [key(0)]: record(10, 9, 2),
      [key(-3)]: record(10, 5),
      [key(-20)]: record(20, 20),
      [key(-40)]: record(50, 0),
    },
  };

  it('lists the last days oldest first, zeros for days not played', () => {
    const days = recentDays(save, now, 4);
    expect(days.map((d) => d.date)).toEqual([key(-3), key(-2), key(-1), key(0)]);
    expect(days[0]?.record.answered).toBe(10);
    expect(days[1]?.record).toMatchObject({ answered: 0, tasks: 0, met: false });
  });

  it('adds up answers over 7 and 30 days', () => {
    expect(accuracy(save, now, 7)).toEqual({ answered: 20, correct: 14, rate: 0.7 });
    expect(accuracy(save, now, 30)).toEqual({ answered: 40, correct: 34, rate: 0.85 });
    expect(accuracy(createEmptySave(now), now, 7).rate).toBeNull();
  });
});

describe('planDelta', () => {
  // 77 tasks over 11 teaching weeks (77 days): one task a day.
  const sprint = chooseRoute(createEmptySave(now), 'sprint', now);

  it('is undefined on the normal route', () => {
    expect(planDelta(town, createEmptySave(now), now)).toBeUndefined();
  });

  it('starts even on the first day', () => {
    expect(planDelta(town, sprint, now)).toMatchObject({ actual: 0, planned: 0, days: 0, week: 1 });
  });

  it('is ahead, even or behind by days of the plan', () => {
    expect(planDelta(town, playedTasks(sprint, 13), day(10))).toMatchObject({
      planned: 10,
      days: 3,
    });
    expect(planDelta(town, playedTasks(sprint, 10), day(10))?.days).toBe(0);
    expect(planDelta(town, playedTasks(sprint, 6), day(10))).toMatchObject({ days: -4, week: 2 });
  });

  it('spreads the plan over an extended sprint', () => {
    // 15 teaching weeks: 105 days for 77 tasks.
    const longer = extendSprint(sprint, now);
    expect(planDelta(town, playedTasks(longer, 0), day(105))).toMatchObject({
      planned: 77,
      weeks: 16,
    });
    expect(planDelta(town, playedTasks(longer, 0), day(200))?.planned).toBe(77);
  });
});
