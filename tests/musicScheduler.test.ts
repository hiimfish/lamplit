import { describe, expect, it } from 'vitest';
import { LOOKAHEAD_SECONDS, createStepScheduler } from '../src/audio/music';

const STEP = 0.5;
const TOTAL = 16;

function setup(start = 0.1) {
  let now = 0;
  const played: { step: number; when: number }[] = [];
  const scheduler = createStepScheduler(
    () => now,
    STEP,
    TOTAL,
    (step, when) => played.push({ step, when }),
    start,
  );
  return {
    scheduler,
    played,
    setNow: (t: number) => {
      now = t;
    },
  };
}

describe('music step scheduler', () => {
  it('schedules steps in order inside the look-ahead window', () => {
    const { scheduler, played, setNow } = setup();
    scheduler.tick();
    expect(played).toEqual([{ step: 0, when: 0.1 }]);
    for (let t = 0.05; t <= 2; t += 0.05) {
      setNow(t);
      scheduler.tick();
    }
    expect(played.map((p) => p.step)).toEqual([0, 1, 2, 3, 4]);
    played.forEach((p, i) => expect(p.when).toBeCloseTo(0.1 + i * STEP));
    // nothing is scheduled further ahead than the look-ahead
    for (const p of played) expect(p.when).toBeLessThan(2 + LOOKAHEAD_SECONDS);
  });

  it('wraps around the loop', () => {
    const { scheduler, played, setNow } = setup(0);
    for (let t = 0; t <= TOTAL * STEP + 1; t += 0.05) {
      setNow(t);
      scheduler.tick();
    }
    expect(played.slice(TOTAL, TOTAL + 2).map((p) => p.step)).toEqual([0, 1]);
  });

  it('skips missed steps after the clock jumps ahead instead of playing them all at once', () => {
    const { scheduler, played, setNow } = setup();
    scheduler.tick();
    played.length = 0;
    // A hidden tab: timers stopped for 10 s while the audio clock kept running.
    setNow(10);
    scheduler.tick();
    // At most the steps that fit in the look-ahead window, none in the past.
    expect(played.length).toBeLessThanOrEqual(Math.ceil(LOOKAHEAD_SECONDS / STEP) + 1);
    for (const p of played) {
      expect(p.when).toBeGreaterThanOrEqual(10);
      expect(p.when).toBeLessThan(10 + LOOKAHEAD_SECONDS);
    }
    // Still on the musical grid, and the step index matches the elapsed time.
    expect(scheduler.nextTime).toBeGreaterThan(10);
    const stepsSinceStart = Math.round((scheduler.nextTime - 0.1) / STEP);
    expect(((stepsSinceStart % TOTAL) + TOTAL) % TOTAL).toBe(scheduler.step);
    expect((scheduler.nextTime - 0.1) / STEP).toBeCloseTo(stepsSinceStart);
  });

  it('keeps playing normally after skipping', () => {
    const { scheduler, played, setNow } = setup();
    scheduler.tick();
    setNow(10);
    scheduler.tick();
    const first = played.length - 1;
    for (let t = 10.05; t <= 12; t += 0.05) {
      setNow(t);
      scheduler.tick();
    }
    const after = played.slice(first);
    expect(after.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < after.length; i++) {
      expect(after[i]?.step).toBe(((after[i - 1]?.step ?? 0) + 1) % TOTAL);
      expect((after[i]?.when ?? 0) - (after[i - 1]?.when ?? 0)).toBeCloseTo(STEP);
    }
  });
});
