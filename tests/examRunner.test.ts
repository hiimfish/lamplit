import { describe, expect, it } from 'vitest';
import {
  collectAnswers,
  formatClock,
  playsLeftFor,
  secondsLeft,
  withPlay,
} from '../src/ui/exam/ExamRunner';
import type { ExamItem } from '../src/ui/exam/types';

const item = (qid: string, group?: string): ExamItem => ({
  qid,
  group,
  difficulty: 0.5,
  question: {} as ExamItem['question'],
});

describe('exam runner helpers', () => {
  it('shares plays inside a group and counts alone otherwise', () => {
    const a = item('a1', 'g');
    const b = item('a2', 'g');
    const c = item('c');
    const counts = withPlay({}, a);
    expect(playsLeftFor({ plays: 2 }, counts, b)).toBe(1);
    expect(playsLeftFor({ plays: 2 }, counts, c)).toBe(2);
    expect(playsLeftFor({ plays: 1 }, withPlay(counts, b), a)).toBe(0);
    expect(playsLeftFor({ plays: Infinity }, counts, a)).toBe(Infinity);
  });

  it('collects one answer per item in order, blank as null', () => {
    const items = [item('x'), item('y'), item('z')];
    expect(collectAnswers(items, { y: 'o2' })).toEqual([
      { qid: 'x', choice: null },
      { qid: 'y', choice: 'o2' },
      { qid: 'z', choice: null },
    ]);
  });

  it('counts the clock down and formats it', () => {
    expect(secondsLeft(600, 0, 61_500)).toBe(539);
    expect(secondsLeft(10, 0, 99_000)).toBe(0);
    expect(formatClock(539)).toBe('08:59');
    expect(formatClock(-3)).toBe('00:00');
  });
});
