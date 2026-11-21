import { describe, expect, it } from 'vitest';
import { buildKey, needsRebuild } from '../src/game/buildKey';

describe('street rebuild guard', () => {
  it('builds the first time', () => {
    expect(needsRebuild(null, buildKey(480, 270, true))).toBe(true);
  });

  it('skips repeated RESIZE events for the same layout', () => {
    const built = buildKey(480, 270, true);
    expect(needsRebuild(built, buildKey(480, 270, true))).toBe(false);
    // sub-pixel sizes round like buildStreet does, so they paint the same street
    expect(needsRebuild(built, buildKey(480.2, 269.6, true))).toBe(false);
  });

  it('rebuilds when the size or the reduced-motion setting really changes', () => {
    const built = buildKey(480, 270, true);
    expect(needsRebuild(built, buildKey(481, 270, true))).toBe(true);
    expect(needsRebuild(built, buildKey(480, 180, true))).toBe(true);
    expect(needsRebuild(built, buildKey(480, 270, false))).toBe(true);
  });

  it('one layout change (setZoom, then resize, then a refresh) builds exactly once', () => {
    let last = buildKey(400, 225, true);
    let builds = 0;
    // setZoom emits RESIZE with the old logical size; resize() emits with the new one.
    for (const [w, h] of [
      [400, 225],
      [560, 315],
      [560, 315],
    ] as const) {
      const key = buildKey(w, h, true);
      if (needsRebuild(last, key)) {
        last = key;
        builds++;
      }
    }
    expect(builds).toBe(1);
  });
});
