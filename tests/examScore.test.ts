import { describe, expect, it } from 'vitest';
import { createEmptySave, type Checkpoint } from '../src/core/save';
import { makeRng } from '../src/learning/gen/common';
import {
  calibrationOffset,
  examScore,
  updateCalibration,
  type ScoredAnswer,
} from '../src/learning/examScore';

const now = new Date(2026, 10, 24, 10, 0, 0);

/** `n` answers of 4 options and a difficulty, the first `right` of them correct. */
const answers = (n: number, right: number, difficulty = 0.5, options = 4): ScoredAnswer[] =>
  Array.from({ length: n }, (_, i) => ({ correct: i < right, options, difficulty }));

describe('examScore: the curve', () => {
  it('lands on the target at about 78% of four-option questions of middle difficulty', () => {
    expect(examScore(1, 'listening', answers(100, 78)).score).toBe(110);
    expect(examScore(3, 'reading', answers(100, 78)).score).toBe(235);
    expect(examScore(4, 'listening', answers(100, 78)).score).toBe(310);
  });

  it('is 5 for no answers and for all wrong, and the cap for all right', () => {
    expect(examScore(2, 'listening', [])).toEqual({ score: 5, low: 5, high: 5 });
    expect(examScore(2, 'listening', answers(20, 0)).score).toBe(5);
    expect(examScore(1, 'listening', answers(20, 20)).score).toBe(150);
    expect(examScore(2, 'reading', answers(20, 20)).score).toBe(210);
    expect(examScore(3, 'listening', answers(20, 20)).score).toBe(275);
    expect(examScore(4, 'reading', answers(20, 20)).score).toBe(340);
  });

  it('never goes over the cap or under 5, including with an offset, and rounds to 5', () => {
    expect(examScore(1, 'reading', answers(30, 30), 50)).toEqual({
      score: 150,
      low: 150,
      high: 150,
    });
    expect(examScore(1, 'reading', answers(30, 0), -50).score).toBe(5);
    for (let right = 0; right <= 24; right++) {
      const r = examScore(3, 'listening', answers(24, right), 13);
      for (const v of [r.score, r.low, r.high]) {
        expect(v % 5).toBe(0);
        expect(v).toBeGreaterThanOrEqual(5);
        expect(v).toBeLessThanOrEqual(275);
      }
      expect(r.low).toBeLessThanOrEqual(r.score);
      expect(r.score).toBeLessThanOrEqual(r.high);
    }
  });

  it('rises with every extra correct answer (never falls)', () => {
    let last = 0;
    for (let right = 0; right <= 30; right++) {
      const s = examScore(4, 'listening', answers(30, right)).score;
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
    expect(last).toBe(360);
  });

  it('corrects for guessing: random guessing reads low, and fewer options need more right', () => {
    expect(examScore(2, 'listening', answers(20, 5)).score).toBeLessThanOrEqual(10);
    const four = examScore(2, 'listening', answers(20, 12, 0.5, 4)).score;
    const three = examScore(2, 'listening', answers(20, 12, 0.5, 3)).score;
    const two = examScore(2, 'listening', answers(20, 12, 0.5, 2)).score;
    expect(four).toBeGreaterThan(three);
    expect(three).toBeGreaterThan(two);
  });

  it('gives more for the same number right on a hard set than on an easy one', () => {
    // The same 13 of 20 right: worth more on a hard set than on an easy one.
    const hardOnes = answers(20, 13, 0.9);
    const easyOnes = answers(20, 13, 0.1);
    expect(examScore(2, 'reading', hardOnes).score).toBeGreaterThan(
      examScore(2, 'reading', easyOnes).score,
    );
  });

  it('adds the offset to the score and the range, within 50', () => {
    const base = examScore(2, 'listening', answers(40, 22));
    const up = examScore(2, 'listening', answers(40, 22), 20);
    expect(up.score).toBe(base.score + 20);
    expect(up.low).toBe(base.low + 20);
    expect(examScore(2, 'listening', answers(40, 22), 500).score).toBe(
      examScore(2, 'listening', answers(40, 22), 50).score,
    );
  });
});

describe('examScore: the range', () => {
  const width = (n: number) => {
    const e = examScore(3, 'listening', answers(n, Math.round(n * 0.7)));
    return e.high - e.low;
  };

  it('widens as the number of questions shrinks', () => {
    expect(width(8)).toBeGreaterThan(width(16));
    expect(width(16)).toBeGreaterThan(width(40));
    expect(width(40)).toBeGreaterThan(width(160));
  });

  it('is wide enough to see with 16 questions and has the score inside', () => {
    const e = examScore(1, 'listening', answers(16, 12));
    expect(e.high - e.low).toBeGreaterThanOrEqual(20);
    expect(e.low).toBeLessThanOrEqual(e.score);
    expect(e.high).toBeGreaterThanOrEqual(e.score);
  });

  it('is not zero wide for a perfect run of a short exam', () => {
    const e = examScore(2, 'reading', answers(16, 16));
    expect(e.low).toBeLessThan(e.high);
  });
});

describe('examScore: simulated players', () => {
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  /** The true model: a guess floor plus a logistic in ability minus difficulty. */
  const sit = (theta: number, rng: () => number) => {
    const n = 16 + Math.floor(rng() * 25);
    const mean = 0.2 + rng() * 0.6;
    const set: ScoredAnswer[] = [];
    for (let i = 0; i < n; i++) {
      const difficulty = Math.min(1, Math.max(0, mean + (rng() - 0.5) * 0.4));
      const p = 0.25 + 0.75 * sigmoid(theta - (difficulty - 0.5) * 4);
      set.push({ correct: rng() < p, options: 4, difficulty });
    }
    return set;
  };
  const sd = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  };

  it('spreads less across different question sets than the plain percent does', () => {
    const rng = makeRng(20261124);
    const weighted: number[] = [];
    const plain: number[] = [];
    for (let i = 0; i < 200; i++) {
      const set = sit(0.8, rng);
      weighted.push(examScore(3, 'listening', set).score);
      plain.push(
        examScore(
          3,
          'listening',
          set.map((a) => ({ ...a, difficulty: 0.5 })),
        ).score,
      );
    }
    expect(sd(weighted)).toBeLessThan(sd(plain));
  });

  it('puts a stronger player above a weaker one on average', () => {
    const rng = makeRng(7);
    const mean = (theta: number) => {
      let sum = 0;
      for (let i = 0; i < 100; i++) sum += examScore(2, 'reading', sit(theta, rng)).score;
      return sum / 100;
    };
    expect(mean(1.5)).toBeGreaterThan(mean(0));
    expect(mean(0)).toBeGreaterThan(mean(-1.5));
  });
});

describe('calibrationOffset', () => {
  const ets = (date: string, listening: number, reading: number): Checkpoint => ({
    date,
    listening,
    reading,
  });
  const exam = (date: string, listening: number, reading: number): Checkpoint => ({
    date,
    listening,
    reading,
    source: 'exam',
    act: 1,
  });

  it('is zero with no pairs', () => {
    expect(calibrationOffset([], [], 'listening', now)).toEqual({ offset: 0, pairs: 0 });
    expect(
      calibrationOffset(
        [ets('2026-11-01', 300, 300)],
        [exam('2026-11-24', 100, 100)],
        'reading',
        now,
      ),
    ).toEqual({ offset: 0, pairs: 0 });
  });

  it('pairs only within 14 days, on either side', () => {
    const e = [exam('2026-11-20', 100, 100)];
    expect(calibrationOffset([ets('2026-11-06', 200, 200)], e, 'listening', now).pairs).toBe(1);
    expect(calibrationOffset([ets('2026-11-05', 200, 200)], e, 'listening', now).pairs).toBe(0);
    expect(calibrationOffset([ets('2026-11-24', 200, 200)], e, 'listening', now).pairs).toBe(1);
  });

  it('uses the nearest ETS entry, and the skill asked for', () => {
    const list = [ets('2026-11-10', 400, 200), ets('2026-11-19', 140, 180)];
    const e = [exam('2026-11-20', 100, 100)];
    expect(calibrationOffset(list, e, 'listening', now)).toEqual({ offset: 20, pairs: 1 });
    expect(calibrationOffset(list, e, 'reading', now).offset).toBe(40);
  });

  it('halves the mean gap, rounds to 5 and stays within 50', () => {
    const one = (l: number) =>
      calibrationOffset(
        [ets('2026-11-20', l, l)],
        [exam('2026-11-20', 100, 100)],
        'listening',
        now,
      );
    expect(one(130).offset).toBe(15);
    expect(one(135).offset).toBe(20);
    expect(one(60).offset).toBe(-20);
    expect(one(495).offset).toBe(50);
    expect(one(5).offset).toBe(-45);
    expect(one(100).offset).toBe(0);
  });

  it('averages several pairs and does not take an exam entry as the reference', () => {
    const list = [
      ets('2026-11-10', 200, 200),
      exam('2026-11-12', 999, 999),
      ets('2026-11-22', 100, 100),
    ];
    const exams = [exam('2026-11-10', 100, 100), exam('2026-11-22', 50, 50)];
    // gaps 100 and 50, mean 75, half 37.5 -> 40
    expect(calibrationOffset(list, exams, 'listening', now)).toEqual({ offset: 40, pairs: 2 });
  });

  it('ignores entries dated after today', () => {
    expect(
      calibrationOffset(
        [ets('2026-11-30', 300, 300)],
        [exam('2026-11-29', 100, 100)],
        'listening',
        now,
      ).pairs,
    ).toBe(0);
  });
});

describe('updateCalibration', () => {
  it('stores both offsets and the pair count in the save', () => {
    const save = {
      ...createEmptySave(now),
      checkpoints: [
        { date: '2026-11-20', listening: 140, reading: 120 },
        {
          date: '2026-11-21',
          listening: 100,
          reading: 100,
          source: 'exam' as const,
          act: 1 as const,
        },
      ],
    };
    expect(updateCalibration(save, now).exams.calibration).toEqual({
      listening: 20,
      reading: 10,
      pairs: 1,
    });
  });

  it('leaves the save alone when there is nothing to pair', () => {
    const save = createEmptySave(now);
    expect(updateCalibration(save, now)).toBe(save);
  });
});
