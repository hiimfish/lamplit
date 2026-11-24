import { describe, expect, it } from 'vitest';
import { ACTS, type Act } from '../src/content/acts';
import { UNITS } from '../src/content/units';
import {
  betterSpoken,
  createEmptySave,
  mergeSaves,
  sanitizeSave,
  type SaveData,
} from '../src/core/save';
import { finishListen, listenGoal, pickListenTask } from '../src/learning/listen';
import { finishTask, taskKey } from '../src/learning/sessionPlan';
import { buildTown } from '../src/learning/townPlan';

const now = new Date(2026, 10, 24, 10, 0, 0);
const day = (offset: number) => new Date(2026, 10, 24 + offset, 10, 0, 0);

const unit = (id: string, scenes: number[]) => ({
  id,
  title: id,
  tasks: scenes.map((lines, i) => ({
    id: `t${i + 1}`,
    scene: Array.from({ length: lines }, (_, l) => ({ id: `l${l}` })),
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
const town = buildTown(acts, [unit('a', [2, 0, 3]), unit('b', [2])]);

function played(keys: string[], heard: Record<string, number> = {}): SaveData {
  const save = createEmptySave(now);
  for (const key of keys)
    save.tasks[key] = { stars: 2, plays: 1, ...(heard[key] && { heard: heard[key] }) };
  return save;
}

const picked = (save: SaveData) => {
  const pick = pickListenTask(town, save);
  return pick && taskKey(pick.unit.id, pick.task.id);
};

describe('pickListenTask', () => {
  it('has nothing before a task is played', () => {
    expect(pickListenTask(town, createEmptySave(now))).toBeUndefined();
  });

  it('takes the played task heard least, the earliest in play order among equals', () => {
    expect(picked(played(['b/t1', 'a/t1']))).toBe('a/t1');
    expect(picked(played(['a/t1', 'b/t1'], { 'a/t1': 2, 'b/t1': 1 }))).toBe('b/t1');
  });

  it('skips a task with no scene', () => {
    expect(picked(played(['a/t2']))).toBeUndefined();
    expect(picked(played(['a/t2', 'a/t3']))).toBe('a/t3');
  });

  it('works on the real town', () => {
    const real = buildTown(ACTS, UNITS);
    const save = played([taskKey('move_in', 't1')]);
    const pick = pickListenTask(real, save);
    expect(pick?.unit.id).toBe('move_in');
    expect(pick?.task.scene.length).toBeGreaterThan(0);
  });
});

describe('finishListen', () => {
  it("counts the task's hearing and today's scenes, and keeps the streak", () => {
    const once = finishListen(played(['a/t1']), 'a/t1', now);
    expect(once.tasks['a/t1']).toMatchObject({ heard: 1, plays: 1, stars: 2 });
    expect(once.daily.listened).toBe(1);
    expect(once.streak).toEqual({ count: 1, lastDate: '2026-11-24' });
    const next = finishListen(once, 'a/t1', day(1));
    expect(next.tasks['a/t1']?.heard).toBe(2);
    expect(next.daily).toMatchObject({ listened: 1, date: '2026-11-25' });
    expect(next.streak.count).toBe(2);
  });

  it('sets the goal by route', () => {
    expect(listenGoal({ kind: 'normal', start: null })).toBe(1);
    expect(listenGoal({ kind: 'sprint', start: '2026-11-24' })).toBe(3);
  });
});

describe('heard in the save', () => {
  it('keeps a good count and drops a bad one', () => {
    const raw = { tasks: { 'a/t1': { stars: 2, plays: 1, heard: 3 }, 'b/t1': { heard: -1 } } };
    const save = sanitizeSave(raw, now);
    expect(save.tasks['a/t1']?.heard).toBe(3);
    expect(save.tasks['b/t1']).toEqual({ stars: 1, plays: 1 });
  });

  it('merges two tabs: the larger count', () => {
    const ours = played(['a/t1'], { 'a/t1': 1 });
    const theirs = played(['a/t1'], { 'a/t1': 4 });
    expect(mergeSaves(ours, theirs).tasks['a/t1']?.heard).toBe(4);
    expect(mergeSaves(played(['a/t1']), played(['a/t1'])).tasks['a/t1']).toEqual({
      stars: 2,
      plays: 1,
    });
  });

  it('survives playing the task again', () => {
    const heard = finishListen(played(['a/t1']), 'a/t1', now);
    const replayed = finishTask(heard, 'a/t1', [], now).save;
    expect(replayed.tasks['a/t1']).toMatchObject({ heard: 1, plays: 2 });
  });
});

describe('spoken in the save', () => {
  const withSpoken = (spoken: unknown) =>
    sanitizeSave({ tasks: { 'a/t1': { stars: 2, plays: 1, spoken } } }, now).tasks['a/t1'];

  it('keeps a good record', () => {
    expect(withSpoken({ score: 82, lines: 8 })?.spoken).toEqual({ score: 82, lines: 8 });
    expect(withSpoken({ score: 0, lines: 1, extra: 1 })?.spoken).toEqual({ score: 0, lines: 1 });
  });

  it('drops a bad one', () => {
    for (const bad of [
      { score: 101, lines: 3 },
      { score: -1, lines: 3 },
      { score: 50.5, lines: 3 },
      { score: 50, lines: 0 },
      { score: 50 },
      'great',
      null,
    ]) {
      expect(withSpoken(bad)).toEqual({ stars: 2, plays: 1 });
    }
  });

  it('keeps the higher score, on a tie the one with more lines', () => {
    expect(betterSpoken({ score: 80, lines: 5 }, { score: 90, lines: 3 })).toEqual({
      score: 90,
      lines: 3,
    });
    expect(betterSpoken({ score: 80, lines: 5 }, { score: 80, lines: 7 })).toEqual({
      score: 80,
      lines: 7,
    });
    expect(betterSpoken(undefined, { score: 10, lines: 1 })).toEqual({ score: 10, lines: 1 });
    expect(betterSpoken(undefined, undefined)).toBeUndefined();
  });

  it('merges two tabs: the better record', () => {
    const ours = played(['a/t1']);
    ours.tasks['a/t1'] = { stars: 2, plays: 1, spoken: { score: 60, lines: 4 } };
    const theirs = played(['a/t1']);
    theirs.tasks['a/t1'] = { stars: 2, plays: 1, spoken: { score: 75, lines: 3 } };
    expect(mergeSaves(ours, theirs).tasks['a/t1']?.spoken).toEqual({ score: 75, lines: 3 });
    expect(mergeSaves(theirs, ours).tasks['a/t1']?.spoken).toEqual({ score: 75, lines: 3 });
    const none = played(['a/t1']);
    expect(mergeSaves(none, ours).tasks['a/t1']?.spoken).toEqual({ score: 60, lines: 4 });
  });
});

describe('finishListen with a spoken summary', () => {
  const summary = (score: number, lines: number, sceneLines = 6) => ({ score, lines, sceneLines });
  const finish = (save: SaveData, spoken?: ReturnType<typeof summary>) =>
    finishListen(save, 'a/t1', now, spoken).tasks['a/t1']?.spoken;

  it('stores a score when enough lines were scored', () => {
    const save = finishListen(played(['a/t1']), 'a/t1', now, summary(82, 4));
    expect(save.tasks['a/t1']?.spoken).toEqual({ score: 82, lines: 4 });
    expect(save.tasks['a/t1']?.heard).toBe(1);
  });

  it('stores nothing without a summary', () => {
    expect(finish(played(['a/t1']))).toBeUndefined();
  });

  it('needs at least 3 scored lines', () => {
    expect(finish(played(['a/t1']), summary(90, 2, 2))).toBeUndefined();
    expect(finish(played(['a/t1']), summary(90, 3, 2))).toEqual({ score: 90, lines: 3 });
  });

  it('needs half of a long scene', () => {
    expect(finish(played(['a/t1']), summary(90, 4, 10))).toBeUndefined();
    expect(finish(played(['a/t1']), summary(90, 5, 10))).toEqual({ score: 90, lines: 5 });
    expect(finish(played(['a/t1']), summary(90, 5, 9))).toEqual({ score: 90, lines: 5 });
  });

  it('keeps the better of the old and new', () => {
    const first = finishListen(played(['a/t1']), 'a/t1', now, summary(80, 5));
    expect(finish(first, summary(60, 6))).toEqual({ score: 80, lines: 5 });
    expect(finish(first, summary(85, 3))).toEqual({ score: 85, lines: 3 });
    expect(finish(first, summary(80, 7))).toEqual({ score: 80, lines: 7 });
    expect(finish(first, summary(80, 4))).toEqual({ score: 80, lines: 5 });
  });

  it('still counts the listen when the score is dropped', () => {
    const save = finishListen(played(['a/t1']), 'a/t1', now, summary(90, 1));
    expect(save.tasks['a/t1']?.heard).toBe(1);
    expect(save.tasks['a/t1']?.spoken).toBeUndefined();
  });

  it('ignores a malformed summary', () => {
    for (const bad of [summary(101, 5), summary(-1, 5), summary(Number.NaN, 5)]) {
      expect(finish(played(['a/t1']), bad)).toBeUndefined();
    }
  });

  it('rounds a fractional score', () => {
    expect(finish(played(['a/t1']), summary(82.4, 4))?.score).toBe(82);
  });
});
