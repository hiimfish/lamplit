import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/core/settings';
import { easierSkip, LEVEL_PLAN, shouldOnboard } from '../src/learning/onboarding';

describe('shouldOnboard', () => {
  const fresh = { tasks: {} };

  it('asks a new player', () => {
    expect(shouldOnboard({ onboarded: false }, fresh)).toBe(true);
  });

  it('asks once', () => {
    expect(shouldOnboard({ onboarded: true }, fresh)).toBe(false);
  });

  it('does not ask a player from before the questions existed', () => {
    const played = { tasks: { 'cafe/t1': { stars: 3, plays: 1 } } } as never;
    expect(shouldOnboard({ onboarded: false }, played)).toBe(false);
    expect(shouldOnboard({ onboarded: false }, { tasks: {}, skipTo: 1 })).toBe(false);
  });
});

describe('LEVEL_PLAN', () => {
  it('has a plan for every level', () => {
    for (const level of LEVELS) expect(LEVEL_PLAN[level]).toBeDefined();
  });

  it('starts A1 at Act 1 and offers a harder 跳級考 as the level goes up', () => {
    expect(LEVEL_PLAN.a1.skip).toBeUndefined();
    expect(LEVEL_PLAN.a2.skip).toBe(1);
    expect(LEVEL_PLAN.b1.skip).toBe(2);
    expect(LEVEL_PLAN.b2.skip).toBe(3);
    expect(LEVEL_PLAN.c1.skip).toBe(3);
  });

  it('suggests Chinese up to A2 and English from B1', () => {
    expect(LEVELS.map((level) => LEVEL_PLAN[level].uiLang)).toEqual(['zh', 'zh', 'en', 'en', 'en']);
  });

  it('tells B2 the game may be easy and C1 that it is below their level', () => {
    expect(LEVELS.map((level) => LEVEL_PLAN[level].fit)).toEqual([
      'good',
      'good',
      'good',
      'easy',
      'beyond',
    ]);
  });
});

describe('easierSkip', () => {
  it('offers the act before while the failed act is still locked', () => {
    expect(easierSkip(3, () => false)).toBe(2);
    expect(easierSkip(2, () => false)).toBe(1);
  });

  it('offers nothing for Act 1, or when the act can be played', () => {
    expect(easierSkip(1, () => false)).toBeUndefined();
    expect(easierSkip(2, (act) => act === 2)).toBeUndefined();
  });
});
