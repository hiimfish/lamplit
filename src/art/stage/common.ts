import { ditherGradient, hash2, px, type Painter } from '../../game/painter';

/**
 * Pieces shared by every stage: the 128x64 core and where it sits in a stage
 * of any size, a painter that clips to the stage, and furniture that more than
 * one room uses. Palette colours only, whole pixels.
 */

export const CORE_W = 128;
export const CORE_H = 64;

/** Spare height below the core becomes deeper floor, up to this many pixels. */
const MAX_FLOOR_EXTRA = 12;

/**
 * Where the core's top left lands in a stage of the given size: centred
 * across, near the bottom. A quarter of any spare height (at most
 * MAX_FLOOR_EXTRA) goes below as floor; the rest is wall above.
 */
export function coreOrigin(w: number, h: number): { ox: number; oy: number } {
  const extra = Math.min(MAX_FLOOR_EXTRA, Math.floor(Math.max(0, h - CORE_H) / 4));
  return { ox: Math.floor((w - CORE_W) / 2), oy: h - CORE_H - extra };
}

/** Keeps every rectangle inside the w x h stage. */
export function clipped(p: Painter, w: number, h: number): Painter {
  return {
    rect(x, y, rw, rh, color, alpha) {
      const x0 = Math.max(0, x);
      const y0 = Math.max(0, y);
      const x1 = Math.min(w, x + rw);
      const y1 = Math.min(h, y + rh);
      if (x1 > x0 && y1 > y0) p.rect(x0, y0, x1 - x0, y1 - y0, color, alpha);
    },
  };
}

/** A pendant lamp hanging from the ceiling (y 0) down to the core, with a warm bulb. */
export function paintLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 5, 'ink');
  p.rect(cx - 1, oy + 5, 3, 1, 'ink');
  p.rect(cx - 2, oy + 6, 5, 1, 'amber');
  p.rect(cx - 3, oy + 7, 7, 1, 'amber');
  p.rect(cx - 3, oy + 8, 7, 1, 'ember');
  p.rect(cx - 1, oy + 9, 3, 1, 'honey');
  px(p, cx - 2, oy + 7, 'honey');
}

/** A window onto the evening street: dusk sky, a few far lights, a wooden frame and sill. */
export function paintWindow(p: Painter, x: number, y: number): void {
  const w = 28;
  const h = 24;
  p.rect(x, y, w, h, 'ember');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['deep', 'indigo', 'dusk']);
  for (let i = 0; i < 6; i++) {
    const lx = x + 2 + Math.floor(hash2(x, i, 7) * (w - 4));
    const ly = y + 8 + Math.floor(hash2(x, i, 11) * (h - 10));
    px(p, lx, ly, hash2(x, i, 3) > 0.5 ? 'honey' : 'lamp');
  }
  p.rect(x + w / 2, y + 1, 1, h - 2, 'ember');
  p.rect(x + 1, y + 10, w - 2, 1, 'ember');
  p.rect(x - 1, y + h, w + 2, 1, 'amber');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'stone');
}

/** Wooden boards on the lower wall, with a rail on top. */
export function paintWainscot(p: Painter, w: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'amber');
  p.rect(0, top + 1, w, 1, 'plum');
  for (let x = 5; x < w; x += 8) p.rect(x, top + 2, 1, floorTop - top - 2, 'plum');
}

export function paintFloor(p: Painter, w: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'night');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = (row * 11) % 16; x < w; x += 16) p.rect(x, y, 9, 1, 'slate');
  }
}

/** A potted plant in the corner. */
export function paintPlant(p: Painter, x: number, y: number): void {
  const leaves: readonly [number, number, number][] = [
    [3, 0, 2],
    [1, 2, 3],
    [5, 2, 3],
    [0, 5, 4],
    [5, 5, 4],
    [2, 8, 5],
    [1, 11, 7],
  ];
  for (const [dx, dy, w] of leaves) {
    p.rect(x + dx, y + dy, w, 2, 'leaf');
    p.rect(x + dx, y + dy + 2, w, 1, 'moss');
  }
  p.rect(x + 1, y + 14, 8, 1, 'amber');
  p.rect(x + 2, y + 15, 6, 5, 'amber');
  p.rect(x + 6, y + 15, 2, 5, 'ember');
}

/** A round wall clock. */
export function paintClock(p: Painter, cx: number, cy: number): void {
  p.rect(cx - 2, cy - 4, 5, 9, 'ink');
  p.rect(cx - 4, cy - 2, 9, 5, 'ink');
  p.rect(cx - 3, cy - 3, 7, 7, 'ink');
  p.rect(cx - 2, cy - 3, 5, 7, 'paper');
  p.rect(cx - 3, cy - 2, 7, 5, 'paper');
  p.rect(cx, cy - 2, 1, 3, 'ink');
  p.rect(cx, cy, 2, 1, 'ink');
  px(p, cx + 2, cy + 2, 'fog');
}

/** A framed picture of a hill at sunset. */
export function paintPicture(p: Painter, x: number, y: number): void {
  const w = 22;
  const h = 16;
  p.rect(x, y, w, h, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ember');
  ditherGradient(p, x + 2, y + 2, w - 4, h - 4, ['violet', 'rosy', 'honey']);
  p.rect(x + 2, y + h - 6, w - 4, 4, 'moss');
  p.rect(x + 6, y + h - 8, 8, 2, 'moss');
  p.rect(x + 13, y + 4, 2, 2, 'paper');
  p.rect(x + 1, y + h, w - 2, 1, 'stone');
}
