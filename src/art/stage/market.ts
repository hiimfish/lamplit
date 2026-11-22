import {
  ditherGradient,
  ditherRect,
  ellipse,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The market stage: a fruit and vegetable stall at an evening street market.
 * You stand on the cobbles to the left, by a street lamp and a stack of
 * crates; the stall fills the right: a red striped awning with a string of
 * warm bulbs, a plank counter with display crates of fruit along its front, a
 * hanging scale, and the vendor behind the counter. Painted through the
 * Painter interface, palette colours only, whole pixels.
 *
 * It fills any size: the 128x64 core sits centred near the bottom; above it
 * the dusk sky, far rooftops, strands of bulbs and flags over the market and
 * the stall's sign; to both sides more stalls under their own awnings.
 */

/** The counter's left edge and the y of its top plank, in core pixels (props rest on it). */
const COUNTER = { x: 46, top: 40 } as const;
/** Props stand on the plank with their shadow on it, like the café's. */
const PROP_TOP = COUNTER.top - 20;
/** Where the vendor stands (and the cashier, when she is the only one). */
const BEHIND_COUNTER = { x: 82, y: 19 } as const;

const FLOOR_TOP = 56;
/** Counter length past the core's right edge before the stall ends. */
const COUNTER_TAIL = 28;
/** A display crate on the counter front. */
const CRATE = { w: 17, h: 13 } as const;
/** Width of a neighbouring stall and the gap between two stalls. */
const STALL_W = 40;
const STALL_GAP = 8;
/** Distance between the masts that carry the strands of bulbs and flags. */
const MAST_GAP = 48;

interface Produce {
  body: PaletteName;
  light: PaletteName;
  shade: PaletteName;
  /** The dark between the fruit. */
  gap: PaletteName;
}

const APPLES: Produce = { body: 'red', light: 'rosy', shade: 'maroon', gap: 'plum' };
const ORANGES: Produce = { body: 'lamp', light: 'honey', shade: 'amber', gap: 'maroon' };
const LIMES: Produce = { body: 'leaf', light: 'honey', shade: 'moss', gap: 'moss' };
const LEMONS: Produce = { body: 'honey', light: 'paper', shade: 'lamp', gap: 'amber' };
const PLUMS: Produce = { body: 'violet', light: 'mauve', shade: 'plum', gap: 'night' };
const PRODUCE: readonly Produce[] = [APPLES, ORANGES, LIMES, LEMONS, PLUMS];

function produceAt(i: number): Produce {
  return PRODUCE[((i % PRODUCE.length) + PRODUCE.length) % PRODUCE.length] ?? APPLES;
}

/** Awning colours of the neighbouring stalls: stripe and its shade. */
const AWNINGS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['teal', 'indigo'],
  ['lamp', 'amber'],
  ['leaf', 'moss'],
];

/** Paints the market to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const stallEnd = ox + CORE_W + COUNTER_TAIL;

  paintSky(p, w, ox, oy);
  paintSkyline(p, w, ox, floorTop);
  if (oy >= 32) paintStrands(p, w, ox, oy, floorTop);
  paintGround(p, w, ox, floorTop, h);

  // More stalls along the street on both sides.
  for (let x = ox - STALL_GAP - STALL_W, i = 1; x + STALL_W > 0; x -= STALL_W + STALL_GAP, i += 2) {
    paintSideStall(p, x, oy, floorTop, i);
  }
  for (let x = stallEnd + STALL_GAP + 4, i = 0; x < w; x += STALL_W + STALL_GAP, i += 2) {
    paintSideStall(p, x, oy, floorTop, i);
  }

  paintLampPost(p, ox + 12, oy, floorTop);
  paintLampString(p, ox + 16, ox + 40, oy);
  paintCrateStack(p, ox, floorTop);

  paintStall(p, ox + 44, stallEnd, oy, floorTop);
  if (oy >= 16) paintSign(p, ox + 68, oy - 13);
  paintScale(p, ox + 121, oy + 13);
  paintCounter(p, ox + COUNTER.x, stallEnd, oy + COUNTER.top, oy + CORE_H);
  paintBasket(p, ox + 131, oy + COUNTER.top, 11, LEMONS);
  paintBasket(p, ox + 143, oy + COUNTER.top, 10, APPLES);
}

/** Dusk sky: deep blue high up, violet and rose down by the roofs; stars, a moon, thin clouds. */
function paintSky(p: Painter, w: number, ox: number, oy: number): void {
  if (oy > 0) ditherGradient(p, 0, 0, w, oy, ['deep', 'indigo']);
  ditherGradient(p, 0, oy, w, FLOOR_TOP, ['indigo', 'dusk', 'violet', 'mauve', 'rosy']);

  // Stars, more of them higher up. Cells are counted from the core so they stay put.
  const cellW = 11;
  const cellH = 9;
  for (let gy = 1; oy - gy * cellH > -cellH; gy++) {
    const chance = Math.min(0.4, gy * 0.05);
    for (let gx = Math.floor(-ox / cellW) - 1; ox + gx * cellW < w; gx++) {
      if (hash2(gx, gy, 41) > chance) continue;
      const sx = ox + gx * cellW + Math.floor(hash2(gx, gy, 43) * cellW);
      const sy = oy - gy * cellH + Math.floor(hash2(gx, gy, 47) * cellH);
      px(p, sx, sy, hash2(gx, gy, 53) > 0.6 ? 'paper' : 'fog');
    }
  }

  // Thin clouds catching the last light.
  for (let k = 0; oy - 62 - k * 30 >= 6; k++) {
    const y = oy - 62 - k * 30;
    for (let slot = Math.floor(-ox / 110) - 1; ox + slot * 110 < w; slot++) {
      const x = ox + slot * 110 + Math.floor(hash2(slot, k, 61) * 60);
      const len = 26 + Math.floor(hash2(slot, k, 67) * 22);
      p.rect(x, y, len, 1, 'dusk');
      p.rect(x + 6, y + 1, len - 14, 1, 'violet');
      p.rect(x + 10, y - 1, len - 22, 1, 'dusk');
    }
  }

  // The moon, when the sky is tall enough to hold it clear of the roofs.
  if (oy >= 96) {
    const cx = ox + 26;
    const cy = Math.max(12, oy - 124);
    lightPool(p, cx, cy, 13, 13, [['dusk', 0.5]]);
    ellipse(p, cx, cy, 5, 5, 'paper');
    p.rect(cx + 1, cy - 3, 2, 2, 'fog');
    px(p, cx - 3, cy + 1, 'fog');
    p.rect(cx + 1, cy + 2, 2, 1, 'fog');
  }
}

/** Far buildings behind the market; low ones behind you so the sky stays open there. */
function paintSkyline(p: Painter, w: number, ox: number, floorTop: number): void {
  // Towers further away.
  for (let s = Math.floor(-ox / 28) - 1; ox + s * 28 < w; s++) {
    if ((s >= 0 && s <= 1) || hash2(s, 0, 71) < 0.3) continue;
    const bw = 16 + Math.floor(hash2(s, 1, 71) * 10);
    const bh = 78 + Math.floor(hash2(s, 2, 71) * 56);
    paintBuilding(p, ox + s * 28 + 1, floorTop - bh, bw, bh, 'slate', s * 2 + 1);
  }
  // The row of houses right behind the stalls.
  const low = [24, 22, 28] as const;
  for (let s = Math.floor(-ox / 20) - 1; ox + s * 20 < w; s++) {
    const near = low[s];
    const bw = 14 + Math.floor(hash2(s, 1, 73) * 6);
    const bh = near ?? 58 + Math.floor(hash2(s, 2, 73) * 44);
    const x = ox + s * 20 + Math.floor(hash2(s, 3, 73) * 3);
    paintBuilding(p, x, floorTop - bh, near ? 20 : bw, bh, near ? 'dusk' : 'night', s * 2);
  }
}

/** One building: a block with a water tank or an aerial on the roof and a few lit windows. */
function paintBuilding(
  p: Painter,
  x: number,
  y: number,
  bw: number,
  bh: number,
  color: PaletteName,
  seed: number,
): void {
  p.rect(x, y, bw, bh, color);
  const roof = hash2(seed, 9, 79);
  if (roof < 0.4) {
    p.rect(x + 2, y - 3, 5, 3, color);
    p.rect(x + 3, y - 4, 3, 1, color);
  } else if (roof < 0.75) {
    p.rect(x + bw - 4, y - 5, 1, 5, color);
    p.rect(x + bw - 5, y - 4, 3, 1, color);
  }
  for (let wy = 3; wy + 3 < bh; wy += 5) {
    for (let wx = 2; wx + 3 <= bw; wx += 4) {
      const r = hash2(wx + seed * 31, wy, 83);
      if (r < 0.09) p.rect(x + wx, y + wy, 1, 2, r < 0.03 ? 'honey' : 'lamp');
    }
  }
}

/** Strands over the market, hung from thin masts: warm bulbs, and flags higher up when there is room. */
function paintStrands(p: Painter, w: number, ox: number, oy: number, floorTop: number): void {
  const first = ox + 12 - Math.ceil((ox + 12) / MAST_GAP) * MAST_GAP;
  const lightsY = oy - 29;
  const flagsY = oy - 49;
  const flags = oy >= 52;
  const mastTop = (flags ? flagsY : lightsY) - 2;
  for (let x = first; x < w + MAST_GAP; x += MAST_GAP) {
    p.rect(x, mastTop, 1, floorTop - mastTop, 'ink');
    px(p, x, mastTop - 1, 'stone');
  }
  const flagColours: readonly PaletteName[] = ['red', 'paper', 'teal', 'lamp', 'leaf'];
  for (let x = first; x < w; x++) {
    const along = x - first;
    const t = (along % MAST_GAP) / MAST_GAP;
    const sag = Math.round(24 * t * (1 - t));
    px(p, x, lightsY + sag, 'ink');
    if (along % 8 === 4) {
      p.rect(x, lightsY + sag + 1, 2, 2, 'honey');
      px(p, x, lightsY + sag + 3, 'lamp');
    }
    if (!flags) continue;
    const dip = Math.round(16 * t * (1 - t));
    px(p, x, flagsY + dip, 'ink');
    if (along % 6 === 1) {
      const c = flagColours[Math.floor(along / 6) % flagColours.length] ?? 'red';
      p.rect(x, flagsY + dip + 1, 4, 1, c);
      p.rect(x + 1, flagsY + dip + 2, 2, 2, c);
    }
  }
}

/** Cobbles, a little worn and lit here and there. */
function paintGround(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'stone');
  p.rect(0, floorTop, w, 1, 'slate');
  const shift = ((ox % 8) + 8) % 8;
  for (let row = 0; floorTop + 1 + row * 4 < h; row++) {
    const y = floorTop + 1 + row * 4;
    p.rect(0, y + 3, w, 1, 'slate');
    for (let x = shift + (row % 2) * 4 - 8; x < w; x += 8) {
      p.rect(x, y, 1, 3, 'slate');
      if (hash2(x - ox, row, 5) > 0.72) p.rect(x + 2, y, 3, 1, 'concrete');
    }
  }
}

/** A street lamp with a warm lantern (its pole's left edge at x). */
function paintLampPost(p: Painter, x: number, oy: number, floorTop: number): void {
  lightPool(p, x, oy + 10, 10, 8, [['rosy', 0.5]]);
  p.rect(x, oy + 13, 2, floorTop - oy - 12, 'ink');
  p.rect(x - 1, floorTop - 1, 4, 3, 'ink');
  p.rect(x - 2, oy + 5, 6, 1, 'ink');
  p.rect(x - 3, oy + 6, 8, 1, 'ink');
  p.rect(x - 2, oy + 7, 6, 5, 'lamp');
  p.rect(x - 1, oy + 7, 4, 5, 'honey');
  p.rect(x, oy + 8, 2, 3, 'paper');
  p.rect(x - 1, oy + 12, 4, 1, 'ink');
}

/** A short string of bulbs from the lamp post (x0) up to the corner of the awning (x1). */
function paintLampString(p: Painter, x0: number, x1: number, oy: number): void {
  for (let x = x0; x < x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const y = oy + 6 - Math.round(4 * t) + Math.round(12 * t * (1 - t));
    px(p, x, y, 'ink');
    if ((x - x0) % 8 === 4) {
      p.rect(x, y + 1, 2, 2, 'honey');
      px(p, x, y + 3, 'lamp');
    }
  }
}

/** A slatted wooden crate seen from the side. */
function paintBox(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'ember');
  for (let sy = y + 1; sy + 2 < y + h; sy += 3) p.rect(x + 1, sy, w - 2, 2, 'amber');
  p.rect(x + 1, y + 1, w - 2, 1, 'tan');
  p.rect(x + Math.floor(w / 2), y, 1, h, 'ember');
}

/** A row of fruit showing over a rim, sitting on `base`. */
function paintFruitRow(p: Painter, x: number, base: number, w: number, kind: Produce): void {
  for (let fx = x; fx + 3 <= x + w; fx += 4) {
    p.rect(fx, base - 2, 3, 2, kind.body);
    px(p, fx + 1, base - 3, kind.body);
    px(p, fx, base - 2, kind.light);
    px(p, fx + 2, base - 1, kind.shade);
  }
}

/** Two stacked crates by the lamp post, full of limes and oranges, and a melon on the ground. */
function paintCrateStack(p: Painter, x: number, floorTop: number): void {
  const base = floorTop + 2;
  paintFruitRow(p, x + 3, base - 19, 11, ORANGES);
  paintBox(p, x + 2, base - 19, 13, 9);
  paintFruitRow(p, x + 14, base - 10, 3, LIMES);
  paintBox(p, x, base - 10, 17, 10);
  // a watermelon leaning on the crates
  p.rect(x + 17, base - 5, 6, 4, 'leaf');
  p.rect(x + 18, base - 6, 4, 6, 'leaf');
  p.rect(x + 18, base - 6, 1, 6, 'moss');
  p.rect(x + 20, base - 6, 1, 6, 'moss');
  px(p, x + 22, base - 4, 'moss');
  px(p, x + 22, base - 3, 'moss');
}

/** A striped awning from x0 to x1: the sloping roof, a fold, and a scalloped valance. */
function paintAwning(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  roofH: number,
  stripeW: number,
  color: PaletteName,
  shade: PaletteName,
): void {
  for (let x = x0, i = 0; x < x1; x += stripeW, i++) {
    const sw = Math.min(stripeW, x1 - x);
    const c = i % 2 === 0 ? color : 'paper';
    const s = i % 2 === 0 ? shade : 'fog';
    p.rect(x, top, sw, roofH, c);
    p.rect(x, top + roofH - 2, sw, 2, s);
    p.rect(x, top + roofH, sw, 2, c);
    p.rect(x + 1, top + roofH + 2, sw - 2, 1, c);
  }
  p.rect(x0, top, x1 - x0, 1, shade);
}

/** A wire of warm bulbs from x0 to x1 at y, one bulb every `step` pixels. */
function paintBulbs(p: Painter, x0: number, x1: number, y: number, step: number): void {
  p.rect(x0, y, x1 - x0, 1, 'ink');
  for (let x = x0 + Math.floor(step / 2) - 2; x + 2 <= x1; x += step) {
    p.rect(x, y + 1, 2, 2, 'honey');
    px(p, x, y + 3, 'lamp');
    px(p, x + 1, y + 3, 'amber');
  }
}

/** The stall itself, from its left pole (x0) to x1: back cloth in the bulbs' glow, poles, awning. */
function paintStall(p: Painter, x0: number, x1: number, oy: number, floorTop: number): void {
  p.rect(x0, oy + 10, x1 - x0, COUNTER.top - 10, 'plum');
  ditherRect(p, x0, oy + 13, x1 - x0, 3, 'night', 8);
  lightPool(p, x0 + 42, oy + 26, 48, 16, [['maroon', 0.75]], {
    y0: oy + 16,
    y1: oy + COUNTER.top,
  });
  for (const poleX of [x0 - 2, x1 - 2]) {
    p.rect(poleX, oy + 10, 2, floorTop + 2 - oy - 10, 'ember');
    p.rect(poleX, oy + 10, 1, floorTop + 2 - oy - 10, 'amber');
  }
  paintAwning(p, x0 - 4, x1 + 4, oy + 1, 9, 6, 'red', 'maroon');
  paintBulbs(p, x0, x1 - 2, oy + 14, 16);
}

/** The stall's sign on two short posts above the awning: an apple, an orange, a line of paint. */
function paintSign(p: Painter, x: number, y: number): void {
  p.rect(x + 4, y + 11, 2, 3, 'ember');
  p.rect(x + 30, y + 11, 2, 3, 'ember');
  p.rect(x, y, 36, 11, 'ember');
  p.rect(x + 1, y + 1, 34, 9, 'honey');
  p.rect(x + 1, y + 9, 34, 1, 'lamp');
  // apple
  p.rect(x + 4, y + 4, 5, 4, 'red');
  p.rect(x + 5, y + 3, 3, 6, 'red');
  px(p, x + 5, y + 4, 'rosy');
  px(p, x + 6, y + 2, 'ember');
  px(p, x + 7, y + 2, 'leaf');
  // orange
  p.rect(x + 11, y + 4, 5, 4, 'amber');
  p.rect(x + 12, y + 3, 3, 6, 'amber');
  px(p, x + 12, y + 4, 'lamp');
  px(p, x + 13, y + 2, 'leaf');
  // painted lines, like a name
  p.rect(x + 19, y + 3, 13, 1, 'ember');
  p.rect(x + 19, y + 5, 9, 1, 'ember');
  p.rect(x + 19, y + 7, 11, 1, 'amber');
}

/** A hanging scale: a round dial on a chain (centre cx, hung from y) and a pan with tomatoes. */
function paintScale(p: Painter, cx: number, y: number): void {
  p.rect(cx, y, 1, 3, 'fog');
  const top = y + 3;
  p.rect(cx - 2, top, 5, 9, 'ink');
  p.rect(cx - 4, top + 2, 9, 5, 'ink');
  p.rect(cx - 3, top + 1, 7, 7, 'ink');
  p.rect(cx - 2, top + 1, 5, 7, 'paper');
  p.rect(cx - 3, top + 2, 7, 5, 'paper');
  px(p, cx - 2, top + 4, 'fog');
  px(p, cx + 2, top + 4, 'fog');
  px(p, cx, top + 6, 'fog');
  p.rect(cx, top + 2, 1, 3, 'red');
  px(p, cx + 1, top + 2, 'red');
  // the hook and three chains down to the pan
  p.rect(cx, top + 9, 1, 2, 'fog');
  for (let i = 0; i < 5; i++) {
    px(p, cx - 1 - i, top + 11 + i, 'fog');
    px(p, cx + 1 + i, top + 11 + i, 'fog');
  }
  p.rect(cx - 2, top + 14, 3, 2, 'red');
  p.rect(cx + 1, top + 13, 3, 3, 'red');
  px(p, cx + 1, top + 13, 'rosy');
  px(p, cx - 2, top + 14, 'rosy');
  p.rect(cx - 6, top + 16, 13, 1, 'fog');
  p.rect(cx - 5, top + 17, 11, 1, 'concrete');
  p.rect(cx - 3, top + 18, 7, 1, 'stone');
}

/** A display crate tilted towards you: rows of round fruit and a price card. */
function paintCrate(p: Painter, x: number, y: number, kind: Produce): void {
  const { w, h } = CRATE;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, kind.gap);
  for (let fy = y + 1; fy + 3 <= y + h - 1; fy += 4) {
    for (let fx = x + 1; fx + 3 <= x + w - 1; fx += 4) {
      p.rect(fx, fy, 3, 3, kind.body);
      px(p, fx, fy, kind.light);
      px(p, fx + 2, fy + 2, kind.shade);
    }
  }
  // the price card, stuck in at the corner
  p.rect(x + w - 5, y + 1, 4, 3, 'paper');
  p.rect(x + w - 4, y + 2, 2, 1, 'ink');
}

/** The counter from x0 to x1: a plank top, display crates along the front, boards below. */
function paintCounter(p: Painter, x0: number, x1: number, top: number, bottom: number): void {
  const w = x1 - x0;
  p.rect(x0, top, w, 1, 'skin');
  p.rect(x0, top + 1, w, 1, 'tan');
  p.rect(x0, top + 2, w, 1, 'ember');
  p.rect(x0, top + 3, w, CRATE.h + 2, 'plum');
  for (let x = x0 + 2, i = 0; x + CRATE.w <= x1 - 1; x += CRATE.w + 1, i++) {
    paintCrate(p, x, top + 4, produceAt(i));
  }
  const boards = top + CRATE.h + 5;
  p.rect(x0, boards - 1, w, 1, 'amber');
  p.rect(x0, boards, w, bottom - boards, 'ember');
  for (let x = x0 + 8; x < x1; x += 9) p.rect(x, boards, 1, bottom - boards, 'plum');
  p.rect(x0, bottom - 1, w, 1, 'plum');
  p.rect(x0, bottom, w, 1, 'ink'); // its shadow on a deeper floor
}

/** A woven basket heaped with fruit, standing on `base`. */
function paintBasket(p: Painter, x: number, base: number, w: number, kind: Produce): void {
  p.rect(x + 1, base - 7, w - 2, 3, kind.body);
  p.rect(x + 3, base - 9, w - 6, 2, kind.body);
  for (let fx = x + 2; fx < x + w - 2; fx += 3) {
    px(p, fx, base - 7, kind.light);
    px(p, fx + 1, base - 5, kind.shade);
  }
  px(p, x + 4, base - 9, kind.light);
  p.rect(x, base - 4, w, 1, 'skin');
  p.rect(x, base - 3, w, 3, 'tan');
  for (let bx = x + 1; bx < x + w; bx += 2) px(p, bx, base - 2, 'ember');
  p.rect(x, base - 1, 1, 1, 'ember');
  p.rect(x + w - 1, base - 1, 1, 1, 'ember');
}

/** A neighbouring stall, STALL_W wide from x: its own awning and bulbs, a table of produce. */
function paintSideStall(p: Painter, x: number, oy: number, floorTop: number, n: number): void {
  const [color, shade] = AWNINGS[n % AWNINGS.length] ?? ['teal', 'indigo'];
  const tableTop = oy + 41;
  p.rect(x + 2, oy + 12, STALL_W - 4, tableTop - oy - 12, 'night');
  lightPool(p, x + STALL_W / 2, oy + 28, 16, 11, [['plum', 0.7]], { y0: oy + 18, y1: tableTop });
  // goods on a shelf at the back
  p.rect(x + 6, oy + 30, STALL_W - 12, 1, 'ember');
  for (let gx = x + 7, i = 0; gx + 3 <= x + STALL_W - 6; gx += 4, i++) {
    const kind = produceAt(n + i);
    const gh = 3 + Math.floor(hash2(n, i, 29) * 3);
    p.rect(gx, oy + 30 - gh, 3, gh, kind.shade);
    px(p, gx, oy + 30 - gh, kind.body);
  }
  for (const poleX of [x + 1, x + STALL_W - 2]) {
    p.rect(poleX, oy + 12, 1, floorTop + 1 - oy - 12, 'ember');
  }
  paintAwning(p, x, x + STALL_W, oy + 5, 7, 5, color, shade);
  paintBulbs(p, x + 3, x + STALL_W - 3, oy + 16, 12);

  paintBasket(p, x + 4, tableTop, 12, produceAt(n + 1));
  paintBasket(p, x + 23, tableTop, 12, produceAt(n + 3));
  p.rect(x, tableTop, STALL_W, 1, 'tan');
  p.rect(x, tableTop + 1, STALL_W, 1, 'ember');
  p.rect(x + 1, tableTop + 2, STALL_W - 2, floorTop + 1 - tableTop - 2, 'plum');
  paintCrate(p, x + 2, tableTop + 2, produceAt(n + 2));
  paintCrate(p, x + 21, tableTop + 2, produceAt(n + 4));
  p.rect(x + 1, floorTop + 1, STALL_W - 2, 1, 'night');
}

// ---------------------------------------------------------------------------
// The vendor: 16x24, facing left. A greengrocer in his fifties: a grey flat
// cap, brown hair and a short beard, a white shirt with the sleeves rolled up
// and a leaf-green apron. Only the top part shows above the counter; the legs
// are there so the sprite can bob without a gap at the counter line.

const VENDOR_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......gggggg....',
    '....gGggggggg...',
    '..BBBgggggggg...',
    '....sssshhhhh...',
    '...ssesssshhh...',
    '....ssssbbh.....',
    '....bbbbbs......',
    '.....bbss.......',
    '.....waaaww.....',
    '....wwaaawwww...',
    '....waaaawwww...',
    '....aaaaaowww...',
    '....aaaaaooow...',
    '....aaaamssww...',
    '....aaaamssmm...',
    '....aaaamssw....',
    '....aammmssw....',
    '.....aaaaaww....',
    '.....aaaaaq.....',
    '.....aaaaaq.....',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    g: 'concrete',
    G: 'fog',
    B: 'stone',
    h: 'ember',
    s: 'skin',
    e: 'ink',
    b: 'ember',
    w: 'paper',
    o: 'fog',
    a: 'leaf',
    m: 'moss',
    p: 'slate',
    q: 'night',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// The cashier: 16x24, facing left. A supermarket cashier in her twenties: a
// straight black bob, a blue uniform vest with a name badge over a white polo,
// a red neckerchief. She stands where the vendor stands, behind the counter.

const CASHIER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhchh.....',
    '....hhhHchhhh...',
    '....hhhhchhhhh..',
    '....sshhhhhhhh..',
    '...ssesshhhhhh..',
    '....sssshhhhhh..',
    '....lssshhhhh...',
    '......ssshhh....',
    '.....ccwwww.....',
    '....vcvvwwwvv...',
    '....vnnvwwwvi...',
    '....vvvvwwwvi...',
    '....vvvvvssvi...',
    '....vvvvvssvi...',
    '....vvvvvssvi...',
    '....vvvvvssvi...',
    '....vvvvvssv....',
    '.....dddddd.....',
    '.....dddddd.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'ink',
    H: 'stone',
    s: 'skin',
    e: 'ink',
    l: 'rosy',
    c: 'red',
    w: 'paper',
    v: 'denim',
    i: 'indigo',
    n: 'honey',
    d: 'slate',
    p: 'slate',
    q: 'night',
    k: 'ink',
  },
};

export const MARKET_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    vendor: { sprite: VENDOR_SPRITE, ...BEHIND_COUNTER, side: 'right', clipBottom: COUNTER.top },
    // Alone, the cashier stands where the vendor stands. With him there too
    // (the role-play), she stands next to him at the end of the counter.
    cashier: {
      sprite: CASHIER_SPRITE,
      ...BEHIND_COUNTER,
      side: 'right',
      clipBottom: COUNTER.top,
      beside: { x: 96, y: BEHIND_COUNTER.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 54, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 86, y: 5 } },
  rest: {
    left: { x: COUNTER.x, y: PROP_TOP },
    // Stops short of the vendor, so a prop stays clear of his face.
    right: { x: COUNTER.x + 14, y: PROP_TOP },
  },
};
