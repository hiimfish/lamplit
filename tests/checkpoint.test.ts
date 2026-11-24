import { describe, expect, it } from 'vitest';
import { createEmptySave, mergeSaves, sanitizeSave } from '../src/core/save';
import {
  addCheckpoint,
  checkpointTarget,
  checkpointVerdict,
  clampScore,
} from '../src/learning/checkpoint';
import { chooseRoute, extendSprint } from '../src/learning/sprint';

const now = new Date(2026, 10, 24, 10, 0, 0);
const day = (offset: number) => new Date(2026, 10, 24 + offset, 10, 0, 0);
/** The first day of a sprint week that started on `now`. */
const week = (n: number) => day((n - 1) * 7);

const sprint = chooseRoute(createEmptySave(now), 'sprint', now).route;

describe('checkpointTarget', () => {
  it('has no target on the normal route or before week 3', () => {
    expect(checkpointTarget({ kind: 'normal', start: null }, week(5))).toBeUndefined();
    expect(checkpointTarget(sprint, week(2))).toBeUndefined();
  });

  it("follows the plan's checkpoints and runs straight between them", () => {
    expect(checkpointTarget(sprint, week(3))).toBe(225);
    expect(checkpointTarget(sprint, week(4))).toBe(300);
    expect(checkpointTarget(sprint, week(5))).toBe(375);
    expect(checkpointTarget(sprint, week(8))).toBe(475);
    expect(checkpointTarget(sprint, week(10))).toBe(540);
    expect(checkpointTarget(sprint, week(12))).toBe(600);
    expect(checkpointTarget(sprint, week(15))).toBe(600);
  });

  it('stretches the curve over an extended sprint', () => {
    const longer = extendSprint(createEmptySave(now), now).route;
    const sixteen = { ...sprint, weeks: longer.weeks };
    // Week 4 of 16 is week 3 of the 12-week plan.
    expect(checkpointTarget(sixteen, week(4))).toBe(225);
    expect(checkpointTarget(sixteen, week(16))).toBe(600);
  });
});

describe('checkpointVerdict and clampScore', () => {
  it('counts within 25 under the target as on track', () => {
    expect(checkpointVerdict(400, 375)).toBe('ahead');
    expect(checkpointVerdict(399, 375)).toBe('on-track');
    expect(checkpointVerdict(350, 375)).toBe('on-track');
    expect(checkpointVerdict(349, 375)).toBe('behind');
  });

  it('keeps each part between 5 and 495 in steps of 5', () => {
    expect(clampScore(-40)).toBe(5);
    expect(clampScore(512)).toBe(495);
    expect(clampScore(273)).toBe(275);
  });
});

describe('checkpoints in the save', () => {
  it('adds a score for today, oldest first', () => {
    const one = addCheckpoint(createEmptySave(now), now, 200, 150);
    const two = addCheckpoint(one, day(7), 600, 3);
    expect(two.checkpoints).toEqual([
      { date: '2026-11-24', listening: 200, reading: 150 },
      { date: '2026-12-01', listening: 495, reading: 5 },
    ]);
  });

  it('starts empty, loads an old save and drops bad entries', () => {
    expect(createEmptySave(now).checkpoints).toEqual([]);
    expect(sanitizeSave({ version: 1, cards: {} }, now).checkpoints).toEqual([]);
    const raw = {
      checkpoints: [
        { date: '2026-12-01', listening: 300, reading: 250, extra: 1 },
        { date: '2026-11-25', listening: 200, reading: 200 },
        { date: 'soon', listening: 200, reading: 200 },
        { date: '2026-11-26', listening: 203, reading: 200 },
        { date: '2026-11-26', listening: 500, reading: 200 },
        'great',
      ],
    };
    expect(sanitizeSave(raw, now).checkpoints).toEqual([
      { date: '2026-11-25', listening: 200, reading: 200 },
      { date: '2026-12-01', listening: 300, reading: 250 },
    ]);
  });

  it('merges two tabs: every score once, by date', () => {
    const base = addCheckpoint(createEmptySave(now), now, 200, 200);
    const ours = addCheckpoint(base, day(2), 250, 250);
    const theirs = addCheckpoint(base, day(1), 220, 230);
    expect(mergeSaves(ours, theirs).checkpoints.map((c) => c.date)).toEqual([
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
    ]);
  });
});

describe('exam scores in the checkpoints', () => {
  const entry = (extra: object) => ({ date: '2026-11-25', listening: 200, reading: 190, ...extra });
  const load = (list: unknown[]) => sanitizeSave({ checkpoints: list }, now).checkpoints;

  it('keeps source, act and retake of an exam score; extra fields are still dropped', () => {
    expect(load([entry({ source: 'exam', act: 2, retake: true, extra: 1 })])).toEqual([
      entry({ source: 'exam', act: 2, retake: true }),
    ]);
    expect(load([entry({ source: 'exam', act: 1 })])).toEqual([entry({ source: 'exam', act: 1 })]);
  });

  it('drops an exam score with no valid Act or an unknown source', () => {
    expect(load([entry({ source: 'exam' }), entry({ source: 'exam', act: 5 })])).toEqual([]);
    expect(load([entry({ source: 'friend', act: 1 })])).toEqual([]);
  });

  it('forgets act and retake when the score is not from an exam', () => {
    expect(load([entry({ act: 3, retake: true })])).toEqual([entry({})]);
  });

  it('keeps an ETS score and an exam score of the same numbers apart, by Act too', () => {
    const list = load([
      entry({}),
      entry({ source: 'exam', act: 1 }),
      entry({ source: 'exam', act: 2 }),
      entry({ source: 'exam', act: 2 }),
    ]);
    expect(list).toHaveLength(3);
  });

  it('merges two tabs without duplicating an exam score', () => {
    const base = createEmptySave(now);
    const withExam = {
      ...base,
      checkpoints: load([entry({ source: 'exam', act: 1, retake: true })]),
    };
    expect(mergeSaves(withExam, withExam).checkpoints).toEqual(withExam.checkpoints);
    expect(mergeSaves(withExam, base).checkpoints).toEqual(withExam.checkpoints);
  });
});
