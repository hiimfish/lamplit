import { PALETTE, type PaletteName } from './palette';
import type { PixelSprite } from './sprites';

/**
 * Everything in the street is drawn through this tiny interface, so the
 * pictures can be checked in tests without a browser and so no shape can use
 * a colour outside the palette. Coordinates are whole pixels.
 *
 * `alpha` below 1 is reserved for light (glow layers); see palette.ts.
 */
export interface Painter {
  rect(x: number, y: number, w: number, h: number, color: PaletteName, alpha?: number): void;
}

/** Paints into a 2D canvas with hard edges (whole-pixel rectangles only). */
export function canvasPainter(ctx: CanvasRenderingContext2D): Painter {
  ctx.imageSmoothingEnabled = false;
  return {
    rect(x, y, w, h, color, alpha = 1) {
      if (w <= 0 || h <= 0) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PALETTE[color];
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      ctx.globalAlpha = 1;
    },
  };
}

export interface PaintRecord {
  ops: number;
  colors: Set<PaletteName>;
  /** Distinct alpha values used (1 for solid pixels). */
  alphas: Set<number>;
  /** Order-sensitive fingerprint of every call, for determinism tests. */
  hash: number;
  /** Calls with non-integer coordinates (should stay 0: no sub-pixel shapes). */
  fractional: number;
}

/** A painter that only records what it was asked to draw. */
export function recordingPainter(): Painter & { record: PaintRecord } {
  const record: PaintRecord = {
    ops: 0,
    colors: new Set(),
    alphas: new Set(),
    hash: 2166136261,
    fractional: 0,
  };
  const mix = (value: number): void => {
    record.hash = Math.imul(record.hash ^ (value | 0), 16777619) >>> 0;
  };
  return {
    record,
    rect(x, y, w, h, color, alpha = 1) {
      if (w <= 0 || h <= 0) return;
      record.ops++;
      record.colors.add(color);
      record.alphas.add(alpha);
      if (![x, y, w, h].every(Number.isInteger)) record.fractional++;
      mix(x);
      mix(y);
      mix(w);
      mix(h);
      mix(Math.round(alpha * 1000));
      for (const ch of color) mix(ch.charCodeAt(0));
    },
  };
}

// ---------------------------------------------------------------------------
// Seeded randomness: the same scene size always gives the same picture.

/** Deterministic hash of two integers and a seed, in [0, 1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h =
    Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Small seeded random generator (mulberry32). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Drawing helpers. Dither is only used to shape light and the sky gradient.

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** True when an ordered-dither pattern at `level` (0..16) covers pixel (x, y). */
export function ditherOn(x: number, y: number, level: number): boolean {
  return (BAYER[y & 3]?.[x & 3] ?? 16) < level;
}

export function px(p: Painter, x: number, y: number, color: PaletteName): void {
  p.rect(x, y, 1, 1, color);
}

/** Fills a rectangle with an ordered dither of `color` at `level` (0..16). */
export function ditherRect(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  color: PaletteName,
  level: number,
): void {
  if (level <= 0) return;
  if (level >= 16) {
    p.rect(x, y, w, h, color);
    return;
  }
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) if (ditherOn(xx, yy, level)) px(p, xx, yy, color);
  }
}

/**
 * Vertical gradient through `colors`, top to bottom, with a dithered
 * transition between neighbouring bands.
 */
export function ditherGradient(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: readonly PaletteName[],
): void {
  const bands = colors.length;
  if (bands === 0 || h <= 0) return;
  for (let row = 0; row < h; row++) {
    const t = (row / Math.max(1, h - 1)) * (bands - 1);
    const index = Math.min(bands - 2, Math.floor(t));
    const base = colors[Math.max(0, index)] ?? colors[0];
    const next = colors[Math.min(bands - 1, index + 1)] ?? base;
    if (!base || !next) continue;
    const level = Math.round((t - index) * 16);
    p.rect(x, y + row, w, 1, base);
    if (bands > 1) ditherRect(p, x, y + row, w, 1, next, level);
  }
}

/** Solid ellipse made of whole-pixel spans (hard edge, no anti-aliasing). */
export function ellipse(
  p: Painter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: PaletteName,
  alpha = 1,
): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
    p.rect(cx - half, cy + dy, half * 2 + 1, 1, color, alpha);
  }
}

/**
 * Pool of light: an ellipse whose dither density falls off from the centre.
 * `stops` are [colour, strength] pairs painted in order (outer first).
 */
export function lightPool(
  p: Painter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stops: readonly (readonly [PaletteName, number])[],
  clip?: { y0: number; y1: number },
): void {
  for (const [color, strength] of stops) {
    for (let dy = -ry; dy <= ry; dy++) {
      const y = cy + dy;
      if (clip && (y < clip.y0 || y >= clip.y1)) continue;
      for (let dx = -rx; dx <= rx; dx++) {
        const d = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
        if (d >= 1) continue;
        const level = Math.round((1 - d) * strength * 16);
        if (ditherOn(cx + dx, y, level)) px(p, cx + dx, y, color);
      }
    }
  }
}

/**
 * Stepped glow around an ellipse centre: rings of the same colour at
 * decreasing alpha (`alphas[0]` is the innermost ring). Used on glow layers.
 */
export function glowEllipse(
  p: Painter,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: PaletteName,
  alphas: readonly number[],
): void {
  const steps = alphas.length;
  for (let dy = -ry; dy <= ry; dy++) {
    let runStart = 0;
    let runAlpha = -1;
    const flush = (end: number): void => {
      if (runAlpha > 0) p.rect(cx + runStart, cy + dy, end - runStart, 1, color, runAlpha);
    };
    for (let dx = -rx; dx <= rx + 1; dx++) {
      let alpha = -1;
      if (dx <= rx) {
        const d = Math.sqrt((dx / (rx + 0.5)) ** 2 + (dy / (ry + 0.5)) ** 2);
        if (d < 1) alpha = alphas[Math.min(steps - 1, Math.floor(d * steps))] ?? -1;
      }
      if (alpha !== runAlpha) {
        flush(dx);
        runStart = dx;
        runAlpha = alpha;
      }
    }
  }
}

/**
 * Hard-edged halo around a set of lit pixels: each surrounding pixel gets the
 * alpha of its distance ring (`alphas[0]` touches the shape).
 */
export function halo(
  p: Painter,
  lit: ReadonlySet<number>,
  width: number,
  height: number,
  color: PaletteName,
  alphas: readonly number[],
): void {
  const r = alphas.length;
  const key = (x: number, y: number): number => y * width + x;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (lit.has(key(x, y))) continue;
      let best = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          if (lit.has(key(xx, yy))) best = Math.min(best, Math.hypot(dx, dy));
        }
      }
      const ring = Math.ceil(best - 0.25) - 1;
      const alpha = alphas[ring];
      if (alpha !== undefined) p.rect(x, y, 1, 1, color, alpha);
    }
  }
}

/** Paints a code-defined sprite at (x, y), optionally mirrored. */
export function paintSprite(
  p: Painter,
  sprite: PixelSprite,
  x: number,
  y: number,
  flip = false,
): void {
  const width = sprite.rows[0]?.length ?? 0;
  sprite.rows.forEach((row, yy) => {
    for (let xx = 0; xx < row.length; xx++) {
      const color = sprite.legend[row[xx] ?? '.'];
      if (color) px(p, x + (flip ? width - 1 - xx : xx), y + yy, color);
    }
  });
}
