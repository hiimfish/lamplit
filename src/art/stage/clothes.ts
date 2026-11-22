import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The clothes-shop stage: a small boutique in the evening. From the left: a
 * mannequin in a red coat, a brass rail of hanging clothes under a shelf of
 * hats (you stand in front of it), a low display table in the middle where
 * handed-over things rest, then the fitting room with its cream curtain (the
 * shop assistant stands in front of it) and a standing mirror. Painted
 * through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (hat boxes, a hanger sign, pictures, then
 * a papered upper wall with a tall window), shop windows with mannequins to
 * the left and more shelves and rails to the right.
 */

/** The display table: left edge, width and the y of its top (props rest on it), in core pixels. */
const TABLE = { x: 41, w: 46, top: 48 } as const;
/** 24x24 pictures stand on the tabletop with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 54;
/** The two globe lamps, either side of the picture. */
const LAMPS = [44, 83] as const;
/** Width of one window or shelf bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed before the upper wall gets its own paper and rail. */
const CORNICE_MIN = 34;
/** How far above the core that rail sits. */
const CORNICE_UP = 22;

type Cloth = readonly [PaletteName, PaletteName];

/** Garment colours with their shade. */
const CLOTHS: readonly Cloth[] = [
  ['red', 'maroon'],
  ['paper', 'fog'],
  ['honey', 'lamp'],
  ['teal', 'moss'],
  ['denim', 'indigo'],
  ['neon', 'neonDeep'],
  ['sky', 'denim'],
  ['leaf', 'moss'],
  ['lamp', 'amber'],
];

function clothAt(a: number, b: number, seed: number): Cloth {
  return CLOTHS[Math.floor(hash2(a, b, seed) * CLOTHS.length)] ?? ['red', 'maroon'];
}

/** Paints the shop to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;

  // Bays beside the core: shop windows to the left, shelves and rails to the right.
  const windows: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) windows.push(x);
  const units: number[] = [];
  for (let x = ox + CORE_W; x < w; x += BAY_W) units.push(x);
  const lamps = [...LAMPS.map((x) => ox + x), ...[...windows, ...units].map((x) => x + 22)];

  paintWall(p, w, ox, floorTop, cornice);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 18, 24, 20, [['rosy', 0.4]], { y0: cornice + 3, y1: floorTop - 2 });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) {
    paintTallWindow(p, ox + 64, cornice, 0);
    // more of them between the lamp cords, wherever a whole one fits
    const sides = [ox + 11, ox + 117];
    for (let x = ox - BAY_W; x - 17 >= 0; x -= BAY_W) sides.push(x);
    for (let x = ox + CORE_W + BAY_W; x + 18 <= w; x += BAY_W) sides.push(x);
    sides.forEach((x, i) => {
      if (x - 17 >= 0 && x + 18 <= w) paintTallWindow(p, x, cornice, i + 1);
    });
  }
  if (oy >= 12) paintBoxShelf(p, ox + 91, oy - 3);
  if (oy >= 18) paintHangerSign(p, ox + 50, oy - 16);
  if (oy >= 20) {
    paintFrame(p, ox + 15, oy - 19, 'honey', 0);
    paintFrame(p, ox + 29, oy - 19, 'teal', 1);
  }

  windows.forEach((x, i) => paintWindowBay(p, x, oy, floorTop, i));
  units.forEach((x, i) => {
    if (i % 2 === 0) paintShelfUnit(p, x + 4, oy + 10, floorTop, i);
    else paintWallRail(p, x + 4, oy, floorTop, i);
  });

  paintFloor(p, w, ox, floorTop, h);
  lightPool(p, ox + 64, floorTop + 5, 46, 6, [['skin', 0.55]], {
    y0: floorTop + 1,
    y1: Math.min(h, floorTop + 11),
  });
  paintRug(p, ox + 36, floorTop + 3);

  paintMannequin(p, ox + 1, floorTop + 3, 'red', 'maroon');
  paintHatShelf(p, ox + 13, oy + 14);
  paintRack(p, ox + 13, oy + 22, floorTop);
  paintFrame(p, ox + 57, oy + 10, 'red', 0);
  paintFittingRoom(p, ox + 91, oy + 10, floorTop);
  paintMirror(p, ox + 118, oy + 26, floorTop);
  for (const lx of lamps) paintGlobeLamp(p, lx, oy);

  paintTable(p, ox + TABLE.x, oy + TABLE.top, floorTop);
}

/**
 * The wall: warm mauve, darker up by the ceiling. On a tall stage a rail runs
 * at `cornice` and the wall above it is papered in a darker violet.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'mauve');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'violet');
    // small diamonds, counted up from the rail so the pattern never shifts with the stage size
    for (let row = 0; cornice - 9 - row * 10 >= 4; row++) {
      const y = cornice - 9 - row * 10;
      const start = (((ox + (row % 2) * 6) % 12) + 12) % 12;
      for (let x = start - 12; x < w; x += 12) {
        px(p, x + 1, y, 'mauve');
        p.rect(x, y + 1, 3, 1, 'mauve');
        px(p, x + 1, y + 2, 'mauve');
      }
    }
    p.rect(0, cornice, w, 1, 'rosy');
    p.rect(0, cornice + 1, w, 1, 'plum');
    ditherRect(p, 0, 0, w, 3, 'plum', 8);
  } else {
    ditherRect(p, 0, 0, w, 3, 'violet', 8);
  }
  p.rect(0, floorTop - 2, w, 2, 'plum');
}

/** Warm wooden blocks, a shade paler than the flat's floorboards. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'tan');
  p.rect(0, floorTop, w, 1, 'ember');
  for (let row = 0; floorTop + 1 + row * 4 < h; row++) {
    const y = floorTop + 1 + row * 4;
    if (row > 0) p.rect(0, y - 1, w, 1, 'amber');
    const start = (((ox + row * 7) % 18) + 18) % 18;
    for (let x = start - 18; x < w; x += 18) p.rect(x, y, 1, 3, 'amber');
  }
}

/** A wine-red rug under the table, its top left at (x, y). */
function paintRug(p: Painter, x: number, y: number): void {
  const w = 56;
  p.rect(x, y, w, 6, 'maroon');
  p.rect(x + 2, y + 1, w - 4, 1, 'red');
  p.rect(x + 2, y + 4, w - 4, 1, 'red');
  for (let fy = y; fy < y + 6; fy += 2) {
    px(p, x - 1, fy, 'rosy');
    px(p, x + w, fy, 'rosy');
  }
}

/** A globe lamp hanging from the ceiling (y 0) down to the core. */
function paintGlobeLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 3, 'ink');
  p.rect(cx - 1, oy + 3, 3, 1, 'ink');
  p.rect(cx - 1, oy + 4, 3, 1, 'honey');
  p.rect(cx - 2, oy + 5, 5, 3, 'honey');
  p.rect(cx - 1, oy + 8, 3, 1, 'lamp');
  p.rect(cx - 1, oy + 5, 2, 2, 'paper');
  px(p, cx + 2, oy + 7, 'lamp');
}

/** One garment on a hanger, seen edge-on: its hook at y - 1, `len` rows long. */
function paintGarment(
  p: Painter,
  x: number,
  y: number,
  w: number,
  len: number,
  [color, shade]: Cloth,
): void {
  px(p, x + 1, y - 1, 'ink');
  p.rect(x + 1, y, w - 2, 1, color);
  p.rect(x, y + 1, w, len - 1, color);
  p.rect(x + w - 1, y + 2, 1, len - 2, shade);
  p.rect(x, y + len - 1, w, 1, shade);
}

/** The garments on the rail behind you: [dx, width, length, colour]. Short ones where your head is. */
const RACK: readonly (readonly [number, number, number, Cloth])[] = [
  [2, 4, 21, ['denim', 'indigo']],
  [6, 3, 14, ['red', 'maroon']],
  [10, 3, 12, ['paper', 'fog']],
  [14, 3, 13, ['honey', 'lamp']],
  [18, 3, 14, ['teal', 'moss']],
  [22, 4, 20, ['neon', 'neonDeep']],
];

/** A brass clothes rail on two legs, its bar at `y`, standing on the floor. */
function paintRack(p: Painter, x: number, y: number, floorTop: number): void {
  const w = 27;
  for (const ux of [x, x + w - 1]) {
    p.rect(ux, y - 1, 1, floorTop + 2 - y, 'lamp');
    px(p, ux, y - 2, 'honey');
    p.rect(ux - 1, floorTop + 1, 3, 1, 'amber');
    px(p, ux, floorTop + 2, 'ink');
  }
  p.rect(x, y, w, 1, 'lamp');
  p.rect(x + 3, y, 6, 1, 'honey');
  for (const [dx, gw, len, cloth] of RACK) paintGarment(p, x + dx, y + 2, gw, len, cloth);
}

/** A hat with a band, its brim on the shelf at `base`. */
function paintHat(p: Painter, x: number, base: number, color: PaletteName, band: PaletteName) {
  p.rect(x + 1, base - 4, 5, 3, color);
  p.rect(x + 2, base - 5, 3, 1, color);
  p.rect(x + 1, base - 2, 5, 1, band);
  p.rect(x, base - 1, 7, 1, color);
}

/** A wall shelf of hats above the rail, its top at `y`. */
function paintHatShelf(p: Painter, x: number, y: number): void {
  const w = 27;
  paintHat(p, x + 2, y, 'paper', 'red');
  paintHat(p, x + 11, y, 'honey', 'ember');
  paintHat(p, x + 20, y, 'denim', 'sky');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  px(p, x + 3, y + 2, 'ember');
  px(p, x + w - 4, y + 2, 'ember');
}

/** A dressmaker's dummy on a stand, wearing a coat; its base stands at `foot`. */
function paintMannequin(
  p: Painter,
  x: number,
  foot: number,
  coat: PaletteName,
  shade: PaletteName,
): void {
  p.rect(x + 5, foot - 12, 1, 11, 'ink');
  p.rect(x + 2, foot - 1, 7, 1, 'ink');
  p.rect(x + 4, foot - 31, 3, 1, 'fog');
  p.rect(x + 4, foot - 30, 3, 2, 'paper');
  p.rect(x + 2, foot - 28, 7, 1, coat);
  p.rect(x + 1, foot - 27, 9, 7, coat);
  p.rect(x + 2, foot - 20, 7, 2, coat);
  p.rect(x + 1, foot - 18, 9, 6, coat);
  p.rect(x + 8, foot - 27, 2, 7, shade);
  p.rect(x + 8, foot - 18, 2, 6, shade);
  p.rect(x + 1, foot - 13, 9, 1, shade);
  p.rect(x + 2, foot - 20, 7, 1, 'ink');
  px(p, x + 5, foot - 28, 'paper');
  px(p, x + 5, foot - 25, 'honey');
  px(p, x + 5, foot - 23, 'honey');
}

/** A small framed fashion print: a dress (kind 0) or a hat (kind 1) in `color`. */
function paintFrame(p: Painter, x: number, y: number, color: PaletteName, kind: number): void {
  const w = 13;
  const h = 17;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + 1, y + h, w - 1, 1, 'plum');
  if (kind === 0) {
    px(p, x + 5, y + 3, color);
    px(p, x + 7, y + 3, color);
    p.rect(x + 5, y + 4, 3, 3, color);
    p.rect(x + 4, y + 7, 5, 2, color);
    p.rect(x + 3, y + 9, 7, 4, color);
    p.rect(x + 5, y + 6, 3, 1, 'ink');
    p.rect(x + 3, y + 13, 7, 1, 'fog');
  } else {
    p.rect(x + 4, y + 5, 5, 4, color);
    p.rect(x + 5, y + 4, 3, 1, color);
    p.rect(x + 4, y + 8, 5, 1, 'ink');
    p.rect(x + 2, y + 9, 9, 1, color);
    p.rect(x + 3, y + 12, 7, 1, 'fog');
  }
}

/** The fitting room: a wooden frame, a cream curtain drawn most of the way, a shirt hung inside. */
function paintFittingRoom(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 26;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 3, w - 4, h - 3, 'plum');
  p.rect(x + 2, floorTop - 3, w - 4, 3, 'night');
  // inside, where the curtain is open: a hook with a shirt, a stool
  px(p, x + 21, top + 7, 'honey');
  paintGarment(p, x + 19, top + 9, 4, 13, ['sky', 'denim']);
  p.rect(x + 19, floorTop - 8, 5, 1, 'amber');
  px(p, x + 19, floorTop - 7, 'ember');
  px(p, x + 23, floorTop - 7, 'ember');
  p.rect(x + 19, floorTop - 6, 1, 4, 'ember');
  p.rect(x + 23, floorTop - 6, 1, 4, 'ember');
  // the rod and the curtain
  p.rect(x + 2, top + 4, w - 4, 1, 'lamp');
  p.rect(x + 2, top + 5, 16, h - 6, 'paper');
  for (let fx = x + 4; fx < x + 18; fx += 3) {
    p.rect(fx, top + 6, 1, h - 7, 'fog');
    px(p, fx, top + 4, 'honey');
  }
  p.rect(x + 17, top + 5, 1, h - 6, 'concrete');
}

/** A standing mirror in a brass frame, its top at `top`. */
function paintMirror(p: Painter, x: number, top: number, floorTop: number): void {
  const bottom = floorTop - 2;
  p.rect(x + 2, top, 5, 1, 'lamp');
  p.rect(x + 1, top + 1, 7, 1, 'lamp');
  p.rect(x, top + 2, 9, bottom - top - 3, 'lamp');
  p.rect(x + 1, bottom - 1, 7, 1, 'lamp');
  p.rect(x + 8, top + 3, 1, bottom - top - 5, 'amber');
  p.rect(x + 2, top + 2, 5, bottom - top - 4, 'sky');
  p.rect(x + 2, top + 2, 5, 6, 'fog');
  // a glint across the glass
  for (let i = 0; i < 4; i++) px(p, x + 5 - i, top + 4 + i, 'paper');
  for (let i = 0; i < 3; i++) px(p, x + 6 - i, top + 9 + i, 'fog');
  p.rect(x + 2, bottom - 6, 5, 4, 'denim');
  // feet
  p.rect(x, bottom, 2, 1, 'amber');
  p.rect(x + 7, bottom, 2, 1, 'amber');
  p.rect(x - 1, bottom + 1, 2, 3, 'amber');
  p.rect(x + 8, bottom + 1, 2, 3, 'amber');
  p.rect(x + 1, bottom + 2, 7, 1, 'ember');
}

/** A pile of folded clothes, `w` wide, standing on `bottom`; two rows a piece. */
function paintStack(
  p: Painter,
  x: number,
  bottom: number,
  w: number,
  cloths: readonly Cloth[],
): void {
  cloths.forEach(([color, shade], i) => {
    const y = bottom - 2 * (i + 1);
    p.rect(x, y, w, 2, color);
    p.rect(x, y + 1, w, 1, shade);
    px(p, x, y, shade);
  });
}

/** The low display table: a lit top, folded clothes on the shelf underneath. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const { w } = TABLE;
  const feet = floorTop + 8;
  p.rect(x + 3, feet, w - 6, 1, 'plum'); // its shadow on the rug
  p.rect(x + 1, top + 2, 2, feet - top - 2, 'ember');
  p.rect(x + w - 3, top + 2, 2, feet - top - 2, 'ember');
  p.rect(x + 3, top + 4, w - 6, feet - top - 7, 'plum'); // the dark back of the shelf
  p.rect(x + 3, feet - 3, w - 6, 1, 'amber');
  p.rect(x + 3, feet - 2, w - 6, 1, 'ember');
  paintStack(p, x + 5, feet - 3, 10, [
    ['teal', 'moss'],
    ['paper', 'fog'],
    ['red', 'maroon'],
  ]);
  paintStack(p, x + 18, feet - 3, 10, [
    ['honey', 'lamp'],
    ['sky', 'denim'],
  ]);
  paintStack(p, x + 31, feet - 3, 10, [
    ['denim', 'indigo'],
    ['neon', 'neonDeep'],
    ['paper', 'fog'],
  ]);
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'lamp');
  p.rect(x, top + 2, w, 2, 'amber');
  p.rect(x, top + 3, w, 1, 'ember');
}

// ---------------------------------------------------------------------------
// Above the core

/** A shelf of hat boxes and a handbag over the fitting room, its top at `y`. */
function paintBoxShelf(p: Painter, x: number, y: number): void {
  const w = 34;
  // a round hat box with a ribbon
  p.rect(x + 2, y - 6, 10, 6, 'paper');
  p.rect(x + 1, y - 8, 12, 2, 'rosy');
  p.rect(x + 6, y - 6, 2, 6, 'neon');
  // a handbag
  p.rect(x + 16, y - 5, 7, 5, 'red');
  p.rect(x + 16, y - 5, 7, 1, 'maroon');
  p.rect(x + 17, y - 8, 1, 3, 'maroon');
  p.rect(x + 21, y - 8, 1, 3, 'maroon');
  p.rect(x + 18, y - 8, 3, 1, 'maroon');
  px(p, x + 19, y - 3, 'honey');
  // a second box
  p.rect(x + 25, y - 5, 8, 5, 'teal');
  p.rect(x + 24, y - 7, 10, 2, 'honey');
  p.rect(x + 28, y - 5, 2, 5, 'honey');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  px(p, x + 3, y + 2, 'ember');
  px(p, x + w - 4, y + 2, 'ember');
}

/** The shop's sign: a dark board with a brass clothes hanger. */
function paintHangerSign(p: Painter, x: number, y: number): void {
  const w = 28;
  const h = 11;
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'night');
  p.rect(x + 1, y + h, w - 1, 1, 'plum');
  const c = x + 14;
  px(p, c, y + 2, 'honey');
  px(p, c - 1, y + 2, 'honey');
  px(p, c, y + 3, 'honey');
  for (let d = 0; d < 4; d++) {
    p.rect(c - 3 - d * 2, y + 4 + d, 3, 1, 'honey');
    p.rect(c + d * 2, y + 4 + d, 3, 1, 'honey');
  }
  p.rect(c - 9, y + 8, 19, 1, 'lamp');
}

/** A tall arched window in the upper wall, centred on `cx`: the dusk sky and a thin moon. */
function paintTallWindow(p: Painter, cx: number, cornice: number, n: number): void {
  const wh = Math.min(72, cornice - 28);
  if (wh < 30) return;
  const top = Math.floor((cornice - wh) / 2) + 2;
  const half = 16;
  // frame: an arch stepped in by hand, then straight sides
  const arch = [8, 11, 13, 14, 15, 16] as const;
  arch.forEach((r, i) => p.rect(cx - r, top + i, r * 2 + 1, 1, 'ember'));
  p.rect(cx - half, top + arch.length, half * 2 + 1, wh - arch.length, 'ember');
  arch.forEach((r, i) => {
    if (i >= 2) p.rect(cx - r + 2, top + i, r * 2 - 3, 1, 'deep');
  });
  ditherGradient(p, cx - half + 2, top + arch.length, half * 2 - 3, wh - arch.length - 2, [
    'deep',
    'indigo',
    'dusk',
    'violet',
  ]);
  // stars and a thin moon
  for (let i = 0; i < 7; i++) {
    const sx = cx - half + 3 + Math.floor(hash2(i, 5 + n, 31) * (half * 2 - 6));
    const sy = top + 4 + Math.floor(hash2(i, 9 + n, 31) * Math.max(1, wh - 24));
    px(p, sx, sy, hash2(i, 2 + n, 31) > 0.6 ? 'honey' : 'fog');
  }
  if (n === 0) {
    p.rect(cx + 6, top + 9, 2, 5, 'paper');
    px(p, cx + 5, top + 8, 'paper');
    px(p, cx + 5, top + 14, 'paper');
  }
  // rooftops at the bottom of the view
  for (let i = 0; i < 4; i++) {
    const bh = 4 + Math.floor(hash2(i, 3 + n, 37) * 7);
    const bx = cx - half + 2 + i * 7;
    p.rect(bx, top + wh - 2 - bh, 8, bh, 'night');
    if (hash2(i, 4 + n, 37) > 0.35) px(p, bx + 2 + (i % 3), top + wh - bh, 'honey');
  }
  // glazing bars and the sill
  p.rect(cx, top + 2, 1, wh - 4, 'ember');
  for (let by = top + 18; by < top + wh - 6; by += 18) {
    p.rect(cx - half + 2, by, half * 2 - 3, 1, 'ember');
  }
  p.rect(cx - half - 1, top + wh, half * 2 + 3, 1, 'amber');
  p.rect(cx - half - 1, top + wh + 1, half * 2 + 3, 1, 'plum');
}

// ---------------------------------------------------------------------------
// Beside the core

/**
 * A shop window onto the evening street with a dressed mannequin; beside it a
 * sale tag and a handbag, or (every other window) a hat on a stand and a pile of jumpers.
 */
function paintWindowBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  const left = x + 3;
  const top = oy + 12;
  const w = 38;
  const sill = oy + 48;
  p.rect(left, top, w, sill - top, 'ember');
  ditherGradient(p, left + 2, top + 2, w - 4, sill - top - 3, ['deep', 'indigo', 'dusk']);
  // the far side of the street: dark fronts, a few lit windows
  for (let b = 0; b < 5; b++) {
    const bh = 4 + Math.floor(hash2(i, b, 41) * 6);
    p.rect(left + 2 + b * 7, sill - 1 - bh, b === 4 ? 6 : 7, bh, 'night');
    if (hash2(i, b, 43) > 0.3) px(p, left + 4 + b * 7, sill - bh + 1, 'honey');
    if (hash2(i, b, 47) > 0.6) px(p, left + 6 + b * 7, sill - bh + 3, 'lamp');
  }
  px(p, left + 3, top + 3, 'fog');
  px(p, left + 4, top + 3, 'fog');
  px(p, left + 3, top + 4, 'fog');
  // the display step
  p.rect(x + 2, sill, w + 2, floorTop - 2 - sill, 'ember');
  p.rect(x + 2, sill, w + 2, 1, 'amber');
  const [coat, shade] = CLOTHS[(i * 3 + 3) % CLOTHS.length] ?? ['teal', 'moss'];
  paintMannequin(p, x + 8, sill, coat, shade);
  if (i % 2 === 1) {
    p.rect(x + 31, sill - 12, 1, 11, 'ink');
    p.rect(x + 29, sill - 1, 5, 1, 'ink');
    paintHat(p, x + 28, sill - 11, 'paper', 'red');
    paintStack(p, x + 20, sill, 7, [clothAt(i, 1, 73), clothAt(i, 2, 79), clothAt(i, 3, 83)]);
    return;
  }
  // a sale tag on a string: a red card with a per cent sign
  p.rect(x + 30, top + 2, 1, 6, 'fog');
  p.rect(x + 26, top + 8, 9, 9, 'red');
  p.rect(x + 26, top + 16, 9, 1, 'maroon');
  px(p, x + 28, top + 10, 'paper');
  px(p, x + 32, top + 14, 'paper');
  for (let d = 0; d < 3; d++) px(p, x + 31 - d, top + 11 + d, 'paper');
  // a handbag on the step
  p.rect(x + 26, sill - 6, 8, 6, 'amber');
  p.rect(x + 26, sill - 6, 8, 1, 'lamp');
  p.rect(x + 28, sill - 9, 1, 3, 'ember');
  p.rect(x + 31, sill - 9, 1, 3, 'ember');
  p.rect(x + 29, sill - 9, 2, 1, 'ember');
  px(p, x + 30, sill - 4, 'honey');
}

/** A wooden shelf unit of folded clothes, 36 wide, with drawers at the bottom. */
function paintShelfUnit(p: Painter, x: number, top: number, floorTop: number, i: number): void {
  const w = 36;
  p.rect(x, top, w, floorTop - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, floorTop - top - 12, 'plum');
  for (let row = 0; row < 3; row++) {
    const sy = top + 11 + row * 11;
    for (let col = 0; col < 3; col++) {
      const n = 2 + Math.floor(hash2(i * 7 + col, row, 51) * 3);
      const cloths = Array.from({ length: n }, (_, k) =>
        clothAt(i * 7 + col, row * 5 + k, 53 + k * 3),
      );
      paintStack(p, x + 3 + col * 11, sy, 8, cloths);
    }
    p.rect(x + 2, sy, w - 4, 1, 'amber');
    if (row < 2) p.rect(x + 2, sy + 1, w - 4, 1, 'night');
  }
  // two drawers
  for (const dx of [2, 19]) {
    p.rect(x + dx, floorTop - 9, 15, 7, 'amber');
    p.rect(x + dx, floorTop - 3, 15, 1, 'ember');
    p.rect(x + dx + 6, floorTop - 6, 3, 1, 'honey');
  }
}

/** A rail of clothes on the wall with a low bench of shoes under it. */
function paintWallRail(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  const w = 36;
  const y = oy + 20;
  p.rect(x + 2, y - 3, 1, 3, 'amber');
  p.rect(x + w - 3, y - 3, 1, 3, 'amber');
  p.rect(x, y, w, 1, 'lamp');
  for (let g = 0; g < 8; g++) {
    const len = 12 + Math.floor(hash2(i, g, 61) * 9);
    paintGarment(p, x + 2 + g * 4, y + 2, 3 + (g % 3 === 0 ? 1 : 0), len, clothAt(i, g, 67));
  }
  // the bench and three pairs of shoes
  p.rect(x, floorTop - 8, w, 2, 'amber');
  p.rect(x, floorTop - 6, w, 1, 'ember');
  p.rect(x + 2, floorTop - 5, 2, 3, 'ember');
  p.rect(x + w - 4, floorTop - 5, 2, 3, 'ember');
  for (let s = 0; s < 3; s++) {
    const [color, shade] = clothAt(i, s, 71);
    const sx = x + 4 + s * 11;
    p.rect(sx, floorTop - 10, 6, 2, color);
    p.rect(sx + 3, floorTop - 12, 3, 2, color);
    p.rect(sx, floorTop - 9, 6, 1, shade);
  }
}

// ---------------------------------------------------------------------------
// The shop assistant: 16x24, facing left. A neat woman with a wine-red bob, a
// navy dress with a white collar, a yellow tape measure round her neck, dark
// tights and red shoes. She stands on the shop floor in front of the curtain.

const ASSISTANT_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhhh...',
    '....hhhhhhhhh...',
    '....shhhhhhhh...',
    '...ssesshhhhh...',
    '....sssshhhh....',
    '....rssshhhh....',
    '......sss.hh....',
    '.....wwnnnn.....',
    '....nntnnnnn....',
    '....nntntnnn....',
    '....nntntnan....',
    '....nntnnnan....',
    '.....ntnnnan....',
    '.....aaaaasn....',
    '.....nnnnnnn....',
    '....nnnnnnnn....',
    '....nnnnnnnnn...',
    '....nnnnnnnnn...',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '.....kkkkk......',
  ],
  legend: {
    h: 'maroon',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    w: 'paper',
    t: 'honey',
    n: 'indigo',
    a: 'deep',
    g: 'night',
    q: 'ink',
    k: 'red',
  },
};

export const CLOTHES_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    assistant: { sprite: ASSISTANT_SPRITE, x: 92, y: 39, side: 'right' },
  },
  want: { left: { x: 30, y: 4 }, right: { x: 72, y: 6 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 96, y: 25 } },
  rest: { left: { x: TABLE.x + 1, y: PROP_TOP }, right: { x: TABLE.x + 19, y: PROP_TOP } },
};
