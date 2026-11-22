import {
  ditherGradient,
  ditherRect,
  ellipse,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { WAREHOUSE_LEAD_SPRITE } from './act3Cast';
import { clipped, coreOrigin, paintClock } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The warehouse stage: Harbor Trading's small warehouse on an April evening.
 * From the left: the one dock door, rolled up, with a carrier's truck waiting
 * outside against the sunset (you stand in front of it); the packing bench,
 * built into a bay of the pallet racking, with tape, labels, bubble wrap and a
 * lit sample of the glass desk lamp on its ledge; Luis beside the bench under
 * the warning sign; then the tall racking full of cartons, a hand truck and a
 * pallet of lamp boxes. Painted through the Painter interface, palette colours
 * only, whole pixels; partial alpha only for light.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom. Above it the racking climbs five levels, the dock gets its sign,
 * a banner and a clock, a loudspeaker hangs over Luis; a tall stage adds
 * high-bay lamps, rows of high windows and the roof trusses. To the left is
 * the safety corner (notice board, alarm, fire extinguisher, ladder, a stack
 * of pallets), and racking runs on to both edges.
 */

const FLOOR_TOP = 54;
/** The packing table: left edge, width and the y of its top, in core pixels (props rest on it). */
const TABLE = { x: 46, w: 45, top: 48 } as const;
/** 24x24 pictures stand on the table with their shadow on it. */
const PROP_TOP = TABLE.top - 20;
/** The dock door's opening [x0, x1) and its top, in core pixels. */
const DOOR = { x0: 6, x1: 44, top: 9 } as const;
/** The rack bay the bench is built into: its two uprights, in core x. */
const BENCH = { x0: 47, x1: 89 } as const;
/** The first upright of the racking right of Luis, and the width of one bay. */
const RACK_X = 104;
const BAY_W = 44;
/** Core y of the rack beams, lowest first, and of the top of the uprights. */
const BEAMS: readonly number[] = [37, 15, -7, -29, -51];
const RACK_TOP = -67;
/** Wall above the core needed for the high-bay lamps, and for the roof and high windows. */
const LAMP_MIN = 92;
const ROOF_MIN = 130;
/** Height of the roof trusses at the top of a tall stage. */
const TRUSS_H = 24;
/** The high-bay lamps: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 25;
const LAMP_GAP = 73;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Paints the warehouse to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const roofed = oy >= ROOF_MIN;

  paintWall(p, w, ox, floorTop, roofed);
  if (roofed) {
    paintRoof(p, w, ox);
    paintHighWindows(p, w, ox, oy);
  }
  if (oy >= LAMP_MIN) {
    const first = ox + LAMP_X - Math.ceil((ox + LAMP_X + 30) / LAMP_GAP) * LAMP_GAP;
    for (let x = first; x < w + 30; x += LAMP_GAP) paintHighBay(p, x, oy, roofed);
  }
  paintFloor(p, w, ox, floorTop, h);

  // Left of the core: the safety corner, then more racking.
  paintSafetyCorner(p, ox - BAY_W, oy, floorTop);
  for (let x = ox - 46 - BAY_W, i = 0; x + BAY_W + 2 > 0; x -= BAY_W, i++) {
    paintRack(p, x, BAY_W, oy, floorTop, 50 + i, true);
  }
  // Right of Luis: racking to the edge.
  for (let x = ox + RACK_X, i = 0; x < w; x += BAY_W, i++) {
    paintRack(p, x, BAY_W, oy, floorTop, 10 + i, true);
  }

  paintBenchBack(p, ox, oy);
  paintDoor(p, ox, oy, floorTop);
  if (oy >= 13) paintDockSign(p, ox + 12, oy - 12);
  if (oy >= 38) paintBanner(p, ox + 12, oy - 37);
  if (oy >= 52) paintClock(p, ox + 25, oy - 46);
  paintRack(p, ox + BENCH.x0, BENCH.x1 - BENCH.x0, oy, floorTop, 3, false);
  paintTable(p, ox + TABLE.x, oy + TABLE.top);

  paintWarningSign(p, ox + 92, oy + 5);
  if (oy >= 18) paintSpeaker(p, ox + 92, oy - 16);

  paintLampBox(p, ox + 36, oy + 55);
  paintHandTruck(p, ox + 102, oy + 62);
  paintFrontPallet(p, ox + 116, oy + 62);
}

// ---------------------------------------------------------------------------
// The building

/** Steel wall panels with a seam every few pixels, a darker band along the floor. */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, roofed: boolean): void {
  p.rect(0, 0, w, floorTop, 'dusk');
  for (let x = mod(ox + 2, 12) - 12; x < w; x += 12) p.rect(x, 0, 1, floorTop, 'indigo');
  p.rect(0, floorTop - 9, w, 9, 'indigo');
  p.rect(0, floorTop - 10, w, 1, 'slate');
  p.rect(0, floorTop - 1, w, 1, 'night');
  if (!roofed) ditherRect(p, 0, 0, w, 3, 'indigo', 8);
}

/** The roof at the top of a tall stage: dark, with a steel truss running across. */
function paintRoof(p: Painter, w: number, ox: number): void {
  p.rect(0, 0, w, TRUSS_H, 'deep');
  p.rect(0, 2, w, 2, 'stone');
  p.rect(0, TRUSS_H - 4, w, 2, 'stone');
  for (let x = mod(ox + 6, 32) - 32; x < w; x += 32) {
    p.rect(x, 4, 2, TRUSS_H - 8, 'slate');
    for (let i = 0; i < 16; i++) {
      px(p, x + 2 + i, 4 + i, 'slate');
      px(p, x + 31 - i, 4 + i, 'slate');
    }
  }
  p.rect(0, TRUSS_H - 2, w, 1, 'slate');
  p.rect(0, TRUSS_H - 1, w, 1, 'night');
}

/**
 * Rows of high windows between the trusses and the lamps: the last light of
 * the day, one pane between every two wall seams.
 */
function paintHighWindows(p: Painter, w: number, ox: number, oy: number): void {
  const y0 = TRUSS_H + 2;
  const space = oy - 90 - y0;
  const rows = Math.max(1, Math.floor(space / 70));
  const wh = Math.min(40, Math.floor(space / rows) - 20);
  if (wh < 12) return;
  for (let r = 0; r < rows; r++) {
    const top = y0 + Math.floor((space * (r + 0.5)) / rows - wh / 2);
    p.rect(0, top - 1, w, wh + 2, 'slate');
    for (let x = mod(ox + 2, 24) - 24, i = 0; x < w; x += 24, i++) {
      ditherGradient(p, x + 1, top, 23, wh, ['indigo', 'dusk', 'violet', 'mauve']);
      p.rect(x + 12, top, 1, wh, 'slate');
      for (let s = 0; s < 2; s++) {
        const sx = x + 2 + Math.floor(hash2(x - ox, s + r * 5, 31) * 20);
        const sy = top + 1 + Math.floor(hash2(x - ox, s + r * 5, 37) * Math.max(1, wh / 3));
        if (sx !== x + 12) px(p, sx, sy, 'fog');
      }
    }
    p.rect(0, top + wh + 1, w, 1, 'night');
  }
}

/** A high-bay lamp hanging on a long cord above the racking, its light on the wall. */
function paintHighBay(p: Painter, x: number, oy: number, roofed: boolean): void {
  const y = oy - 86;
  glowEllipse(p, x, y + 12, 26, 18, 'honey', [0.16, 0.09, 0.04]);
  const from = roofed ? TRUSS_H - 2 : 0;
  p.rect(x, from, 1, y - from, 'night');
  p.rect(x - 1, y, 3, 2, 'stone');
  p.rect(x - 2, y + 2, 5, 1, 'amber');
  p.rect(x - 3, y + 3, 7, 1, 'amber');
  p.rect(x - 4, y + 4, 9, 1, 'amber');
  p.rect(x - 5, y + 5, 11, 1, 'ember');
  p.rect(x - 3, y + 6, 7, 1, 'honey');
  p.rect(x - 1, y + 6, 3, 1, 'paper');
  px(p, x - 3, y + 4, 'lamp');
}

/** The concrete floor: slab joints, a yellow walkway line, the evening light through the dock door. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  for (let x = mod(ox + 14, 40) - 40; x < w; x += 40) p.rect(x, floorTop, 1, h - floorTop, 'stone');
  for (let y = floorTop + 10; y < h; y += 9) p.rect(0, y, w, 1, 'stone');
  for (let x = mod(ox, 16) - 16, i = 0; x < w; x += 16, i++) {
    const y = floorTop + 5 + (i % 2) * 3;
    if (y < h) p.rect(x + Math.floor(hash2(x - ox, 0, 61) * 8), y, 5, 1, 'fog');
  }
  // the light from the door falls to the right across the floor
  for (let y = floorTop + 1; y < h; y++) {
    const d = y - floorTop;
    const x0 = ox + DOOR.x0 + d;
    const x1 = ox + DOOR.x1 + d * 2;
    p.rect(x0, y, x1 - x0, 1, 'rosy', d < 5 ? 0.3 : 0.18);
    p.rect(x0 + 6, y, x1 - x0 - 12 - d, 1, 'honey', 0.12);
  }
  p.rect(0, floorTop + 3, w, 1, 'lamp');
}

// ---------------------------------------------------------------------------
// Racking and what stands on it

/** A carton: brown cardboard most of the time, now and then a white product box or a blue tote. */
function paintBox(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  kind = hash2(seed, 3, 91),
): void {
  let face: PaletteName = 'tan';
  let top: PaletteName = 'skin';
  let side: PaletteName = 'ember';
  if (kind < 0.12) {
    face = 'fog';
    top = 'paper';
    side = 'concrete';
  } else if (kind < 0.22) {
    face = 'denim';
    top = 'sky';
    side = 'indigo';
  } else if (kind < 0.42) {
    face = 'ember';
    top = 'tan';
    side = 'plum';
  }
  p.rect(x, y, w, h, face);
  p.rect(x, y, w, 1, top);
  p.rect(x + w - 1, y + 1, 1, h - 1, side);
  if (face === 'denim') {
    p.rect(x + Math.floor(w / 2) - 1, y + 2, 2, 1, 'indigo');
    return;
  }
  // the tape down the middle, a shipping label, sometimes a red "fragile" mark
  if (h >= 5) p.rect(x + Math.floor(w / 2), y + 1, 1, 2, top);
  if (w >= 8 && h >= 7) {
    p.rect(x + 1, y + h - 4, 3, 2, face === 'fog' ? 'teal' : 'paper');
    if (hash2(seed, 5, 91) < 0.4) px(p, x + w - 3, y + h - 3, 'red');
  }
}

/** A row of cartons standing on `base` between x0 and x1, none taller than maxH, some stacked two high. */
function paintLoad(
  p: Painter,
  x0: number,
  x1: number,
  base: number,
  maxH: number,
  seed: number,
): void {
  let x = x0 + Math.floor(hash2(seed, 1, 7) * 3);
  for (let i = 0; x + 6 <= x1; i++) {
    const bw = Math.min(x1 - x, 7 + Math.floor(hash2(seed, i, 11) * 6));
    const bh = 6 + Math.floor(hash2(seed, i, 13) * (maxH - 5));
    if (hash2(seed, i, 17) > 0.1) {
      paintBox(p, x, base - bh, bw, bh, seed * 31 + i);
      const room = maxH - bh;
      if (room >= 5 && bw >= 8 && hash2(seed, i, 19) < 0.6) {
        const th = 5 + Math.floor(hash2(seed, i, 23) * (room - 4));
        paintBox(p, x + 1, base - bh - th, bw - 3, th, seed * 37 + i);
      }
    }
    x += bw + 1;
  }
}

/** A wooden pallet, 4 high, its top at `y`. */
function paintPallet(p: Painter, x: number, y: number, w: number): void {
  p.rect(x, y, w, 1, 'tan');
  p.rect(x, y + 1, w, 2, 'night');
  for (const dx of [0, Math.floor(w / 2) - 1, w - 3]) p.rect(x + dx, y + 1, 3, 2, 'ember');
  p.rect(x, y + 3, w, 1, 'tan');
}

/** One upright of the racking, 2 wide, from the floor to the top of the rack. */
function paintUpright(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + RACK_TOP;
  p.rect(x, top, 1, floorTop - top, 'sky');
  p.rect(x + 1, top, 1, floorTop - top, 'denim');
  for (let y = floorTop - 5; y > top; y -= 6) px(p, x, y, 'denim');
  p.rect(x - 1, floorTop - 1, 4, 1, 'night');
}

/**
 * One bay of pallet racking between two blue uprights: orange beams with
 * cartons on every level. `ground` adds the lowest beam and two loaded pallets
 * on the floor under it (the bench bay keeps that space for the bench).
 */
function paintRack(
  p: Painter,
  x: number,
  bayW: number,
  oy: number,
  floorTop: number,
  seed: number,
  ground: boolean,
): void {
  const x0 = x + 2;
  const x1 = x + bayW;
  BEAMS.forEach((beam, tier) => {
    if (tier === 0 && !ground) return;
    const y = oy + beam;
    const maxH = tier === BEAMS.length - 1 ? 14 : 17;
    paintLoad(p, x0 + 1, x1 - 1, y, maxH, seed * 16 + tier + 1);
    p.rect(x0, y, x1 - x0, 1, 'lamp');
    p.rect(x0, y + 1, x1 - x0, 1, 'amber');
    p.rect(x0, y + 2, x1 - x0, 1, 'indigo');
  });
  if (ground) {
    const half = Math.floor((x1 - x0 - 3) / 2);
    [x0 + 1, x0 + 2 + half].forEach((px0, i) => {
      paintPallet(p, px0, floorTop - 4, half);
      paintLoad(p, px0 + 1, px0 + half - 1, floorTop - 4, 10, seed * 16 + 9 + i);
    });
  }
  paintUpright(p, x, oy, floorTop);
  paintUpright(p, x + bayW, oy, floorTop);
}

// ---------------------------------------------------------------------------
// The dock

/** The carrier's truck outside the door, seen from the side, its cab to the right (core origin given). */
function paintTruck(p: Painter, ox: number, oy: number): void {
  // the box: plain and pale behind your head, the carrier's stripe along the top
  p.rect(ox + 6, oy + 27, 26, 20, 'fog');
  p.rect(ox + 6, oy + 27, 26, 1, 'paper');
  p.rect(ox + 6, oy + 30, 26, 2, 'teal');
  p.rect(ox + 6, oy + 44, 26, 3, 'concrete');
  p.rect(ox + 15, oy + 33, 1, 11, 'concrete');
  p.rect(ox + 31, oy + 28, 1, 19, 'concrete');
  p.rect(ox + 32, oy + 34, 1, 13, 'night');
  // the wind deflector and the cab
  p.rect(ox + 33, oy + 29, 2, 1, 'cyan');
  p.rect(ox + 33, oy + 30, 4, 1, 'teal');
  p.rect(ox + 33, oy + 31, 6, 1, 'teal');
  p.rect(ox + 33, oy + 32, 9, 1, 'cyan');
  p.rect(ox + 33, oy + 33, 10, 7, 'teal');
  p.rect(ox + 33, oy + 40, 11, 7, 'teal');
  p.rect(ox + 35, oy + 34, 5, 5, 'deep');
  px(p, ox + 35, oy + 35, 'sky');
  px(p, ox + 36, oy + 34, 'sky');
  p.rect(ox + 41, oy + 34, 2, 5, 'sky');
  px(p, ox + 42, oy + 34, 'teal');
  px(p, ox + 41, oy + 35, 'paper');
  p.rect(ox + 40, oy + 40, 1, 6, 'indigo');
  px(p, ox + 38, oy + 41, 'cyan');
  p.rect(ox + 33, oy + 46, 8, 1, 'indigo');
  p.rect(ox + 43, oy + 42, 1, 2, 'honey');
  p.rect(ox + 41, oy + 46, 3, 2, 'fog');
  // the chassis and the wheels
  p.rect(ox + 6, oy + 47, 36, 2, 'night');
  for (const cx of [11, 19, 38]) {
    p.rect(ox + cx - 2, oy + 47, 5, 6, 'ink');
    p.rect(ox + cx - 3, oy + 48, 7, 4, 'ink');
    p.rect(ox + cx - 1, oy + 49, 3, 2, 'concrete');
  }
}

/** The dock door, rolled up: the yard in the last light, the truck, the striped posts. */
function paintDoor(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x0 = ox + DOOR.x0;
  const x1 = ox + DOOR.x1;
  const top = oy + DOOR.top;
  const wd = x1 - x0;
  ditherGradient(p, x0, top, wd, 16, ['violet', 'mauve', 'rosy']);
  p.rect(x0, top + 16, wd, 1, 'rosy');
  ditherRect(p, x0, top + 16, wd, 1, 'honey', 8);
  p.rect(x0, top + 17, wd, 2, 'honey');
  p.rect(x0, top + 19, wd, 8, 'plum');
  p.rect(x0, top + 27, wd, floorTop - top - 27, 'slate');
  // buildings across the yard, and the yard lamp, just lit
  p.rect(x0 + 2, oy + 20, 10, 8, 'plum');
  p.rect(x0 + 12, oy + 23, 8, 5, 'plum');
  p.rect(x0 + 24, oy + 22, 4, 6, 'plum');
  px(p, x0 + 4, oy + 22, 'honey');
  px(p, x0 + 8, oy + 24, 'honey');
  px(p, x0 + 15, oy + 25, 'lamp');
  glowEllipse(p, x0 + 33, oy + 16, 5, 4, 'honey', [0.4, 0.2]);
  p.rect(x0 + 35, oy + 14, 1, 19, 'night');
  p.rect(x0 + 32, oy + 14, 3, 1, 'night');
  p.rect(x0 + 32, oy + 15, 2, 1, 'honey');

  paintTruck(p, ox, oy);
  p.rect(x0, floorTop - 3, wd, 3, 'night');
  p.rect(x0, floorTop - 1, wd, 1, 'stone');

  // the rolled shutter in its housing, a green light: the dock is free
  p.rect(x0, top, wd, 4, 'fog');
  p.rect(x0, top + 1, wd, 1, 'concrete');
  p.rect(x0, top + 3, wd, 1, 'stone');
  p.rect(x0 - 3, top - 4, wd + 6, 4, 'stone');
  p.rect(x0 - 3, top - 4, wd + 6, 1, 'fog');
  p.rect(x0 - 3, top - 1, wd + 6, 1, 'slate');
  p.rect(x1 - 7, top - 3, 2, 2, 'leaf');
  p.rect(x1 - 4, top - 3, 2, 2, 'maroon');
  // steel posts, striped yellow and black near the floor
  for (const x of [x0 - 2, x1]) {
    p.rect(x, top, 1, floorTop - top, 'fog');
    p.rect(x + 1, top, 1, floorTop - top, 'concrete');
    for (let y = floorTop - 12; y < floorTop; y++) {
      for (let dx = 0; dx < 2; dx++) {
        px(p, x + dx, y, mod(y - floorTop + dx, 4) < 2 ? 'lamp' : 'ink');
      }
    }
  }
  // the threshold
  for (let x = x0 - 2; x < x1 + 2; x++) {
    px(p, x, floorTop, mod(x - ox, 6) < 3 ? 'lamp' : 'ink');
  }
}

const GLYPHS: Record<string, readonly string[]> = {
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  C: ['###', '#..', '#..', '#..', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
};

/** The sign over the door: "DOCK 1", the only dock there is. */
function paintDockSign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 26, 9, 'ink');
  p.rect(x, y, 26, 1, 'stone');
  let cx = x + 2;
  for (const ch of 'DOCK 1') {
    const glyph = GLYPHS[ch];
    if (!glyph) {
      cx += 3;
      continue;
    }
    glyph.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] === '#') px(p, cx + dx, y + 2 + dy, 'lamp');
      }
    });
    cx += 4;
  }
  p.rect(x + 1, y + 9, 25, 1, 'indigo');
}

/** The company's banner: a desk lamp, what Harbor Trading sells. */
function paintBanner(p: Painter, x: number, y: number): void {
  p.rect(x - 1, y, 28, 1, 'fog');
  p.rect(x, y + 1, 26, 19, 'teal');
  p.rect(x, y + 1, 26, 2, 'cyan');
  p.rect(x + 25, y + 3, 1, 17, 'moss');
  // the lamp: a shade, a stem, a foot
  p.rect(x + 11, y + 5, 5, 1, 'honey');
  p.rect(x + 10, y + 6, 7, 1, 'honey');
  p.rect(x + 9, y + 7, 9, 2, 'honey');
  p.rect(x + 10, y + 6, 2, 1, 'paper');
  p.rect(x + 13, y + 9, 1, 6, 'paper');
  p.rect(x + 10, y + 15, 7, 1, 'paper');
  // two waves for the harbour
  for (const dx of [3, 19]) {
    p.rect(x + dx, y + 16, 2, 1, 'cyan');
    p.rect(x + dx + 2, y + 17, 2, 1, 'cyan');
  }
  px(p, x, y + 19, 'dusk');
  px(p, x + 25, y + 19, 'dusk');
}

// ---------------------------------------------------------------------------
// The packing bench

/** Behind the bench: a dark pegboard, the lamp sample's light, the ledge and what is kept on it. */
function paintBenchBack(p: Painter, ox: number, oy: number): void {
  const x0 = ox + BENCH.x0 + 2;
  const wd = BENCH.x1 - BENCH.x0 - 2;
  p.rect(x0, oy + 28, wd, 26, 'slate');
  for (let y = oy + 30; y < oy + 47; y += 4) {
    for (let x = x0 + 2; x < x0 + wd; x += 4) px(p, x, y, 'night');
  }
  glowEllipse(p, x0 + 6, oy + 24, 22, 15, 'honey', [0.22, 0.12, 0.06]);
  p.rect(x0, oy + 26, wd, 1, 'fog');
  p.rect(x0, oy + 27, wd, 1, 'stone');
  const base = oy + 26;
  // a sample of the glass desk lamp, switched on
  p.rect(x0 + 5, base - 8, 2, 1, 'paper');
  p.rect(x0 + 4, base - 7, 4, 1, 'honey');
  p.rect(x0 + 3, base - 6, 6, 2, 'honey');
  p.rect(x0 + 4, base - 6, 2, 1, 'paper');
  p.rect(x0 + 3, base - 4, 6, 1, 'lamp');
  p.rect(x0 + 5, base - 3, 1, 2, 'fog');
  p.rect(x0 + 4, base - 1, 4, 1, 'concrete');
  // a tape gun and a spare roll of tape
  p.rect(x0 + 13, base - 4, 4, 4, 'tan');
  px(p, x0 + 14, base - 3, 'ember');
  px(p, x0 + 15, base - 2, 'ember');
  p.rect(x0 + 17, base - 3, 3, 2, 'red');
  px(p, x0 + 20, base - 3, 'fog');
  p.rect(x0 + 18, base - 1, 1, 1, 'maroon');
  // a roll of shipping labels, the end hanging loose
  p.rect(x0 + 24, base - 5, 5, 5, 'paper');
  p.rect(x0 + 24, base - 5, 5, 1, 'fog');
  px(p, x0 + 26, base - 3, 'stone');
  p.rect(x0 + 29, base - 2, 2, 2, 'paper');
  px(p, x0 + 29, base - 1, 'ink');
  // a roll of bubble wrap standing on end
  p.rect(x0 + 34, base - 8, 4, 8, 'sky');
  p.rect(x0 + 34, base - 8, 4, 1, 'paper');
  for (let i = 0; i < 3; i++) px(p, x0 + 35 + (i % 2), base - 6 + i * 2, 'paper');
  p.rect(x0 + 37, base - 7, 1, 7, 'denim');
}

/** The packing table: a wooden top on steel legs, flat cartons and a bin on the shelf below. */
function paintTable(p: Painter, x: number, top: number): void {
  const w = TABLE.w;
  p.rect(x + 3, top + 3, w - 6, 3, 'night');
  // the lower shelf: flattened cartons, a roll of wrap, a bin of offcuts
  p.rect(x + 3, top + 9, w - 6, 1, 'amber');
  p.rect(x + 3, top + 10, w - 6, 1, 'ember');
  p.rect(x + 7, top + 5, 14, 4, 'tan');
  p.rect(x + 7, top + 5, 14, 1, 'skin');
  p.rect(x + 7, top + 7, 14, 1, 'ember');
  p.rect(x + 24, top + 6, 9, 3, 'sky');
  p.rect(x + 24, top + 6, 1, 3, 'paper');
  p.rect(x + 32, top + 6, 1, 3, 'denim');
  p.rect(x + 36, top + 5, 5, 4, 'teal');
  p.rect(x + 36, top + 5, 5, 1, 'cyan');
  // the legs and their shadow on the floor
  for (const lx of [x + 1, x + w - 3]) {
    p.rect(lx, top + 3, 1, 10, 'fog');
    p.rect(lx + 1, top + 3, 1, 10, 'stone');
  }
  p.rect(x + 3, top + 13, w - 6, 1, 'stone');
  // the top, a pixel proud of the legs
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x, top + 2, w, 1, 'ember');
}

// ---------------------------------------------------------------------------
// Signs and the safety corner

/** A yellow warning triangle with an exclamation mark, a small plate of rules under it. */
function paintWarningSign(p: Painter, x: number, y: number): void {
  for (let r = 0; r < 10; r++) {
    const half = Math.floor((r * 5) / 9);
    p.rect(x + 5 - half, y + r, half * 2 + 1, 1, 'ink');
  }
  p.rect(x, y + 10, 11, 1, 'ink');
  for (let r = 2; r < 10; r++) {
    const half = Math.floor((r * 5) / 9) - 1;
    if (half >= 0) p.rect(x + 5 - half, y + r, half * 2 + 1, 1, 'lamp');
  }
  p.rect(x + 5, y + 4, 1, 3, 'ink');
  px(p, x + 5, y + 8, 'ink');
  p.rect(x + 1, y + 13, 9, 4, 'fog');
  p.rect(x + 2, y + 14, 6, 1, 'stone');
  p.rect(x + 2, y + 15, 4, 1, 'stone');
}

/** The loudspeaker the announcements come from, on its bracket. */
function paintSpeaker(p: Painter, x: number, y: number): void {
  p.rect(x + 9, y, 1, 10, 'night');
  p.rect(x + 7, y + 4, 3, 3, 'stone');
  for (let i = 0; i < 6; i++) {
    const half = 4 - Math.floor(i / 2);
    p.rect(x + 1 + i, y + 5 - half, 1, half * 2 + 1, i < 2 ? 'paper' : 'fog');
  }
  p.rect(x, y, 1, 11, 'concrete');
  p.rect(x + 1, y + 9, 5, 1, 'concrete');
}

/**
 * The safety corner left of the dock, one bay wide from `x`: the notice board,
 * the alarm bell, the fire extinguisher, a ladder and a stack of empty pallets;
 * an extractor fan higher up.
 */
function paintSafetyCorner(p: Painter, x: number, oy: number, floorTop: number): void {
  if (oy >= 32) {
    const cx = x + 22;
    const cy = oy - 18;
    ellipse(p, cx, cy, 10, 10, 'slate');
    ellipse(p, cx, cy, 8, 8, 'night');
    p.rect(cx - 7, cy, 15, 1, 'stone');
    p.rect(cx, cy - 7, 1, 15, 'stone');
    for (let i = -5; i <= 5; i++) {
      px(p, cx + i, cy + i, 'slate');
      px(p, cx + i, cy - i, 'slate');
    }
    p.rect(cx - 1, cy - 1, 3, 3, 'fog');
  }
  // the notice board: the safety rules, a fire notice, the shipping schedule
  p.rect(x + 3, oy + 12, 20, 19, 'fog');
  p.rect(x + 4, oy + 13, 18, 17, 'slate');
  p.rect(x + 5, oy + 14, 7, 10, 'paper');
  px(p, x + 8, oy + 15, 'lamp');
  p.rect(x + 7, oy + 16, 3, 1, 'lamp');
  p.rect(x + 6, oy + 17, 5, 1, 'lamp');
  p.rect(x + 6, oy + 19, 5, 1, 'stone');
  p.rect(x + 6, oy + 21, 4, 1, 'stone');
  p.rect(x + 14, oy + 14, 7, 6, 'paper');
  px(p, x + 17, oy + 15, 'red');
  p.rect(x + 16, oy + 16, 3, 2, 'red');
  px(p, x + 17, oy + 17, 'lamp');
  p.rect(x + 14, oy + 22, 7, 7, 'honey');
  for (let r = 0; r < 3; r++) p.rect(x + 15, oy + 23 + r * 2, 5 - (r % 2), 1, 'ember');
  p.rect(x + 5, oy + 26, 7, 3, 'sky');
  // the alarm bell
  p.rect(x + 29, oy + 11, 5, 7, 'maroon');
  p.rect(x + 28, oy + 12, 7, 5, 'red');
  p.rect(x + 29, oy + 11, 5, 1, 'red');
  p.rect(x + 30, oy + 13, 3, 3, 'fog');
  px(p, x + 31, oy + 14, 'ink');
  // the fire extinguisher under its red plate
  p.rect(x + 29, oy + 26, 5, 4, 'red');
  px(p, x + 31, oy + 27, 'paper');
  p.rect(x + 30, oy + 28, 3, 1, 'paper');
  p.rect(x + 30, oy + 34, 3, 2, 'ink');
  px(p, x + 33, oy + 35, 'ink');
  p.rect(x + 29, oy + 36, 5, 10, 'red');
  p.rect(x + 33, oy + 37, 1, 9, 'maroon');
  p.rect(x + 30, oy + 39, 3, 2, 'paper');
  // an aluminium ladder against the wall
  for (const dx of [37, 42]) p.rect(x + dx, oy + 8, 1, floorTop + 4 - oy - 8, 'fog');
  for (let y = oy + 11; y < floorTop + 3; y += 5) p.rect(x + 38, y, 4, 1, 'concrete');
  // empty pallets, stacked
  for (let i = 0; i < 4; i++) paintPallet(p, x + 4 + (i % 2), floorTop + 1 - i * 4, 22);
}

// ---------------------------------------------------------------------------
// On the floor

/** An open carton by the door: a glass lamp shade nested in bubble wrap. Its top left at (x, y). */
function paintLampBox(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 2, 9, 6, 'tan');
  p.rect(x + 9, y + 3, 1, 5, 'ember');
  p.rect(x + 1, y + 2, 9, 1, 'ember');
  p.rect(x, y, 2, 2, 'skin');
  p.rect(x + 9, y, 2, 2, 'skin');
  p.rect(x + 3, y - 1, 5, 1, 'honey');
  p.rect(x + 2, y, 7, 2, 'honey');
  px(p, x + 3, y, 'paper');
  px(p, x + 2, y + 2, 'sky');
  px(p, x + 8, y + 2, 'sky');
  p.rect(x + 2, y + 4, 3, 2, 'paper');
  px(p, x + 7, y + 5, 'red');
}

/** A red hand truck with two cartons on it; `foot` is the floor line it stands on. */
function paintHandTruck(p: Painter, x: number, foot: number): void {
  // the frame behind the load and the handle
  p.rect(x + 9, foot - 21, 1, 20, 'red');
  p.rect(x + 10, foot - 21, 2, 1, 'red');
  px(p, x + 11, foot - 20, 'maroon');
  paintBox(p, x + 1, foot - 9, 8, 8, 401, 1);
  paintBox(p, x + 2, foot - 16, 7, 7, 407, 1);
  // the toe plate and the wheel
  p.rect(x, foot - 1, 10, 1, 'fog');
  p.rect(x + 8, foot - 3, 4, 4, 'ink');
  p.rect(x + 9, foot - 2, 2, 2, 'fog');
}

/** A pallet of white lamp boxes, strapped, waiting to go out. */
function paintFrontPallet(p: Painter, x: number, foot: number): void {
  paintPallet(p, x, foot - 3, 21);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const bx = x + 1 + col * 10;
      const by = foot - 10 - row * 7;
      p.rect(bx, by, 9, 7, 'paper');
      p.rect(bx, by + 6, 9, 1, 'fog');
      p.rect(bx + 8, by, 1, 7, 'fog');
      p.rect(bx + 1, by + 1, 7, 1, 'teal');
      p.rect(bx + 3, by + 3, 3, 1, 'lamp');
      px(p, bx + 4, by + 4, 'stone');
    }
  }
  p.rect(x + 5, foot - 17, 1, 14, 'stone');
  p.rect(x + 15, foot - 17, 1, 14, 'stone');
}

export const WAREHOUSE_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    warehouse_lead: { sprite: WAREHOUSE_LEAD_SPRITE, x: 88, y: 39, side: 'right' },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 60, y: 6 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 92, y: 25 } },
  rest: {
    left: { x: TABLE.x + 3, y: PROP_TOP },
    // Stops short of Luis, so a prop stays clear of his face.
    right: { x: TABLE.x + 18, y: PROP_TOP },
  },
};
