import { describe, expect, it } from 'vitest';
import { isPaletteName } from '../src/game/palette';
import { recordingPainter, type Painter } from '../src/game/painter';
import { paintBack } from '../src/game/pixelArt';
import { paintForeground, paintGlow, smallArt } from '../src/game/street/paintFront';
import { buildStreet, type StreetPlan } from '../src/game/street/plan';

const SIZES: [number, number][] = [
  [560, 315],
  [480, 270],
  [400, 225],
  [400, 180],
  [320, 150],
  [240, 120],
];

function record(paint: (p: Painter, plan: StreetPlan) => void, plan: StreetPlan) {
  const p = recordingPainter();
  paint(p, plan);
  return p.record;
}

describe('buildStreet', () => {
  it('is deterministic for a given size', () => {
    expect(buildStreet(480, 270)).toEqual(buildStreet(480, 270));
    expect(record(paintBack, buildStreet(400, 180)).hash).toBe(
      record(paintBack, buildStreet(400, 180)).hash,
    );
  });

  it.each(SIZES)('lays out a %ix%i street with the cafe in the middle', (w, h) => {
    const plan = buildStreet(w, h);
    const { cafe } = plan;
    expect(Math.abs(cafe.x + cafe.w / 2 - w / 2)).toBeLessThanOrEqual(1);
    // Bays touch each other and cover the whole width.
    expect(plan.bays[0]?.x).toBeLessThanOrEqual(0);
    const last = plan.bays[plan.bays.length - 1];
    expect(last && last.x + last.w).toBeGreaterThanOrEqual(w);
    for (let i = 1; i < plan.bays.length; i++) {
      const a = plan.bays[i - 1];
      const b = plan.bays[i];
      expect(a && b && a.x + a.w).toBe(b?.x);
    }
    // Vertical bands are in order and inside the scene.
    expect(plan.beamTop).toBeGreaterThan(0);
    expect(plan.beamTop).toBeLessThan(plan.beamBottom);
    expect(plan.beamBottom).toBeLessThan(plan.pavTop);
    expect(plan.pavTop).toBeLessThan(plan.groundY);
    expect(plan.groundY).toBeLessThan(plan.curbY);
    expect(plan.curbY).toBeLessThan(plan.roadTop);
    expect(plan.roadTop).toBeLessThan(h);
    // People (24 px tall) fit under the arcade.
    expect(plan.groundY - 24).toBeGreaterThan(plan.beamBottom + 2);
    // The cafe window is a real window, within the cafe.
    expect(plan.cafeWindow.w).toBeGreaterThan(30);
    expect(plan.cafeWindow.h).toBeGreaterThan(15);
    expect(plan.cafeWindow.x).toBeGreaterThan(cafe.x);
    expect(plan.cafeDoor.x + plan.cafeDoor.w).toBeLessThan(cafe.x + cafe.w);
    // The protagonist stops at the window, and walks in from off-screen.
    expect(plan.walk.stopX).toBeGreaterThan(plan.cafeWindow.x);
    expect(plan.walk.stopX).toBeLessThan(plan.cafeWindow.x + plan.cafeWindow.w);
    expect(plan.walk.startX).toBeLessThan(0);
    expect(plan.walk.endX).toBeGreaterThan(w);
    // Neon cup sits on the cafe's sign panel.
    expect(plan.neonCup.x).toBeGreaterThan(cafe.x);
    expect(plan.neonCup.x + 22).toBeLessThan(cafe.x + cafe.w);
    expect(plan.skyTop).toHaveLength(w);
    expect(plan.lamps.length).toBeGreaterThan(0);
  });

  it.each(SIZES)('keeps the moon and stars in open sky at %ix%i', (w, h) => {
    const plan = buildStreet(w, h);
    for (const s of plan.stars) expect(s.y).toBeLessThan(plan.skyTop[s.x] ?? 0);
    expect(plan.moon.y).toBeGreaterThan(0);
    expect(plan.moon.x).toBeLessThan(w);
  });
});

describe('painted layers', () => {
  it.each(SIZES)(
    'only use palette colours, whole pixels, and alpha only for light (%ix%i)',
    (w, h) => {
      const plan = buildStreet(w, h);
      for (const paint of [paintBack, paintForeground]) {
        const rec = record(paint, plan);
        expect(rec.ops).toBeGreaterThan(0);
        expect(rec.fractional).toBe(0);
        expect([...rec.alphas]).toEqual([1]);
        for (const c of rec.colors) expect(isPaletteName(c)).toBe(true);
      }
      const glow = record(paintGlow, plan);
      expect(glow.fractional).toBe(0);
      for (const c of glow.colors) expect(isPaletteName(c)).toBe(true);
      for (const a of glow.alphas) expect(a).toBeLessThanOrEqual(0.5);
    },
  );

  it('the small flicker textures use palette colours too', () => {
    for (const art of smallArt()) {
      const p = recordingPainter();
      art.paint(p);
      expect(p.record.ops, art.key).toBeGreaterThan(0);
      for (const c of p.record.colors) expect(isPaletteName(c)).toBe(true);
    }
  });

  it('the background uses at most the 32 palette colours and most of them', () => {
    const rec = record(paintBack, buildStreet(480, 270));
    expect(rec.colors.size).toBeLessThanOrEqual(32);
    expect(rec.colors.size).toBeGreaterThan(20);
  });
});
