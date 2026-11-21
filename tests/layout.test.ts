import { describe, expect, it } from 'vitest';
import { computeLayout } from '../src/layout';

const devices = [
  { name: 'desktop 1920x1080', w: 1920, h: 1080, dpr: 1 },
  { name: 'laptop 1366x768', w: 1366, h: 768, dpr: 1 },
  { name: 'laptop 125% scaling', w: 1536, h: 730, dpr: 1.25 },
  { name: '4K 150% scaling', w: 2560, h: 1300, dpr: 1.5 },
  { name: 'iPhone portrait', w: 390, h: 844, dpr: 3 },
  { name: 'iPhone landscape', w: 844, h: 390, dpr: 3 },
  { name: 'iPhone SE portrait', w: 375, h: 667, dpr: 2 },
  { name: 'Android portrait', w: 412, h: 915, dpr: 2.625 },
  { name: 'tablet portrait', w: 768, h: 1024, dpr: 2 },
  { name: 'tiny window', w: 200, h: 150, dpr: 1 },
];

describe('computeLayout', () => {
  it.each(devices)('$name: whole-number zoom that fits the screen', ({ w, h, dpr }) => {
    const l = computeLayout(w, h, dpr);
    expect(Number.isInteger(l.zoom)).toBe(true);
    expect(l.zoom).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(l.sceneW)).toBe(true);
    expect(Number.isInteger(l.sceneH)).toBe(true);
    expect(l.px * dpr).toBeCloseTo(l.zoom, 10);
    expect(l.cssW).toBeLessThanOrEqual(w + 0.001);
    expect(l.cssH).toBeLessThanOrEqual(h + 0.001);
    // The canvas must start on a whole device pixel and stay on screen.
    expect(l.offsetX * dpr).toBeCloseTo(Math.round(l.offsetX * dpr), 10);
    expect(l.offsetY * dpr).toBeCloseTo(Math.round(l.offsetY * dpr), 10);
    expect(l.offsetX).toBeGreaterThanOrEqual(0);
    expect(l.offsetX + l.cssW).toBeLessThanOrEqual(w + 0.001);
    expect(l.offsetY + l.cssH).toBeLessThanOrEqual(h + 0.001);
  });

  it('snaps an odd leftover pixel instead of centring on a half pixel', () => {
    const l = computeLayout(1366, 768, 1);
    expect(l.cssW).toBe(1365);
    expect(l.offsetX).toBe(0);
    expect(l.offsetY).toBe(0);
  });

  it('pins the scene to the top in portrait', () => {
    expect(computeLayout(390, 844, 3).offsetY).toBe(0);
  });

  it('uses the design resolution on a full HD desktop', () => {
    expect(computeLayout(1920, 1080, 1)).toMatchObject({
      orientation: 'landscape',
      zoom: 4,
      sceneW: 480,
      sceneH: 270,
      cssW: 1920,
      cssH: 1080,
    });
  });

  it('fills a smaller laptop screen instead of leaving wide margins', () => {
    const l = computeLayout(1366, 768, 1);
    expect(l.zoom).toBe(3);
    expect(l.sceneW).toBe(455);
    expect(l.sceneH).toBe(256);
  });

  it('keeps at least the minimum landscape view on normal screens', () => {
    for (const d of devices.filter((d) => d.w > d.h && d.w >= 800)) {
      const l = computeLayout(d.w, d.h, d.dpr);
      expect(l.sceneW).toBeGreaterThanOrEqual(400);
      expect(l.sceneH).toBeGreaterThanOrEqual(225);
    }
  });

  it('puts the scene on top in portrait and leaves most of the height for the UI', () => {
    const l = computeLayout(390, 844, 3);
    expect(l.orientation).toBe('portrait');
    expect(l.zoom).toBe(4);
    expect(l.sceneW).toBe(292);
    expect(l.sceneH).toBe(180);
    expect(l.cssH).toBeLessThanOrEqual(844 * 0.45);
  });

  it('caps the view on very large or very wide screens', () => {
    const wide = computeLayout(3440, 1440, 1);
    expect(wide.sceneW).toBeLessThanOrEqual(560);
    expect(wide.sceneH).toBeLessThanOrEqual(315);
  });

  it('treats a bad devicePixelRatio as 1', () => {
    expect(computeLayout(1920, 1080, 0)).toEqual(computeLayout(1920, 1080, 1));
  });
});

describe('computeLayout on short portrait screens', () => {
  it('shrinks the scene so the UI still has room', () => {
    const l = computeLayout(360, 520, 2);
    expect(l.orientation).toBe('portrait');
    expect(l.sceneH).toBeLessThan(180);
    expect(l.sceneH).toBeGreaterThanOrEqual(120);
    expect(l.cssH).toBeLessThanOrEqual(520 * 0.45 + 0.001);
  });
});
