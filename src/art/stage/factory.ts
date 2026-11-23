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
import { SUPPLIER_SPRITE } from './act3Cast';
import { PLANT_MANAGER_SPRITE } from './act4Cast';
import { clipped, coreOrigin, paintClock } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The factory stage has two places, built on the same floor line and the same
 * resting surface so the cast, bubbles and props fit both:
 *
 * - The production floor of the Brightway plant in Taoyuan on a June evening
 *   (the default): a row of high windows with the dusk outside, the safety
 *   station on the left (hard hats and vests on hooks, an extinguisher; you
 *   stand in front of it), the quality-check bench in the middle under the
 *   glass of the test lab, with a Lantern test lamp lit on it, and the end of
 *   the assembly line on the right: a conveyor carrying desk lamps at every
 *   stage (a wooden base, then the steel arm, then the cloth shade), a stack
 *   light and workers as dark shapes behind it. Yellow lines on a green floor.
 * - The raw-material store that is also Ms. Varga's office
 *   (`backdrops.plant_manager`): racks of stacked wood, lamp bases, steel
 *   arms and cloth rolls, a wooden desk with a lit Lantern and a clipboard, a
 *   production board and one high window.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom. Above it
 * the wall climbs to hanging lamps, then the roof trusses with a second row of
 * windows; to the sides the line (or the racks) runs on to both edges.
 * Palette colours only, whole pixels; partial alpha only for light.
 */

const FLOOR_TOP = 52;
/** The quality-check bench / the desk: left edge, width and the y its top is seen at (props rest on it). */
const BENCH = { x: 38, w: 44, top: 46 } as const;
/** 24x24 pictures stand on the bench with their shadow on it. */
const PROP_TOP = BENCH.top - 20;
/** The row of high windows in the core: top and height. */
const WIN = { top: 2, h: 11 } as const;
/** The conveyor: where it ends (core x) and the y of its belt. */
const LINE = { x: 85, belt: 36 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the hanging lamps, and for the roof and upper windows. */
const LAMP_MIN = 40;
const ROOF_MIN = 100;
const CRANE_MIN = 90;
/** Height of the roof trusses at the top of a tall stage. */
const TRUSS_H = 22;
/** Ms. Varga's spot, and Jack's when she is on the stage too. */
const VARGA = { x: 80, y: 39 } as const;
const JACK_BESIDE = { x: 96, y: 39 } as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// ===========================================================================
// Pieces both places share

/** The roof at the top of a tall stage: dark, with a steel truss running across. */
function paintRoof(p: Painter, w: number, ox: number): void {
  p.rect(0, 0, w, TRUSS_H, 'deep');
  p.rect(0, 2, w, 2, 'stone');
  p.rect(0, TRUSS_H - 4, w, 2, 'stone');
  for (let x = mod(ox + 10, 32) - 32; x < w; x += 32) {
    p.rect(x, 4, 2, TRUSS_H - 8, 'slate');
    for (let i = 0; i < 14; i++) {
      px(p, x + 2 + i, 4 + i, 'slate');
      px(p, x + 29 - i, 4 + i, 'slate');
    }
  }
  p.rect(0, TRUSS_H - 2, w, 1, 'slate');
  p.rect(0, TRUSS_H - 1, w, 1, 'night');
}

/** A band of factory windows from x 0 to w: dusk panes between steel mullions, a sill under them. */
function paintWindowBand(
  p: Painter,
  w: number,
  ox: number,
  top: number,
  h: number,
  seed: number,
): void {
  p.rect(0, top - 1, w, h + 2, 'slate');
  for (let x = mod(ox - 2, 12) - 12, i = 0; x < w; x += 12, i++) {
    ditherGradient(p, x + 1, top, 11, h, ['indigo', 'dusk', 'violet', 'mauve', 'rosy']);
    p.rect(x + 1, top + Math.floor(h / 2), 11, 1, 'slate');
    // a far star or two in the upper panes, a crane light sometimes low down
    const sx = x + 2 + Math.floor(hash2(x - ox, seed, 31) * 9);
    const sy = top + Math.floor(hash2(x - ox, seed, 37) * Math.max(1, h / 3));
    px(p, sx, sy, 'fog');
    if (hash2(x - ox, seed, 41) < 0.3) px(p, x + 3 + (i % 7), top + h - 2, 'honey');
  }
  p.rect(0, top + h + 1, w, 1, 'stone');
  p.rect(0, top + h + 2, w, 1, 'night');
}

/** A hanging enamel lamp on a long cord, its warm light on the wall around it. */
function paintHangingLamp(p: Painter, x: number, y: number, from: number): void {
  glowEllipse(p, x, y + 10, 22, 14, 'honey', [0.14, 0.08, 0.04]);
  p.rect(x, from, 1, y - from, 'ink');
  p.rect(x - 1, y, 3, 2, 'stone');
  p.rect(x - 3, y + 2, 7, 1, 'teal');
  p.rect(x - 4, y + 3, 9, 1, 'teal');
  p.rect(x - 5, y + 4, 11, 1, 'moss');
  p.rect(x - 3, y + 5, 7, 1, 'honey');
  p.rect(x - 1, y + 5, 3, 1, 'paper');
  px(p, x - 3, y + 3, 'cyan');
}

/**
 * The Lantern desk lamp, lit: a natural wood base, a steel arm with a bend,
 * a cloth shade with the bulb glowing under it. `x` is the left of the base
 * and `y` the surface it stands on.
 */
function paintLantern(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 6, y - 3, 12, 6, 'honey', [0.22, 0.12, 0.06]);
  // the wooden base
  p.rect(x, y - 3, 8, 3, 'amber');
  p.rect(x, y - 3, 8, 1, 'tan');
  p.rect(x + 7, y - 2, 1, 2, 'ember');
  px(p, x + 3, y - 2, 'ember');
  // the steel arm: up from the base, then reaching forward to the shade
  p.rect(x + 2, y - 11, 1, 8, 'fog');
  px(p, x + 1, y - 7, 'concrete');
  px(p, x + 3, y - 12, 'fog');
  px(p, x + 4, y - 13, 'fog');
  p.rect(x + 5, y - 13, 3, 1, 'fog');
  // the cloth shade, lit from inside
  p.rect(x + 6, y - 13, 4, 1, 'paper');
  p.rect(x + 5, y - 12, 6, 2, 'paper');
  p.rect(x + 4, y - 10, 8, 1, 'honey');
  px(p, x + 10, y - 12, 'fog');
  px(p, x + 11, y - 11, 'fog');
  p.rect(x + 6, y - 9, 4, 1, 'lamp');
  // the light on the surface under it
  p.rect(x + 8, y - 1, 6, 1, 'honey', 0.35);
  p.rect(x + 9, y, 6, 1, 'honey', 0.2);
}

/** A small lamp on the line or a shelf at one of its stages: 0 a base, 1 with its arm, 2 finished. */
function paintSmallLamp(p: Painter, x: number, y: number, stage: number): void {
  p.rect(x, y - 2, 6, 2, 'amber');
  p.rect(x, y - 2, 6, 1, 'tan');
  px(p, x + 5, y - 1, 'ember');
  if (stage < 1) return;
  p.rect(x + 1, y - 7, 1, 5, 'fog');
  p.rect(x + 2, y - 8, 2, 1, 'fog');
  if (stage < 2) return;
  p.rect(x + 3, y - 9, 3, 1, 'paper');
  p.rect(x + 2, y - 8, 5, 1, 'paper');
  p.rect(x + 2, y - 7, 5, 1, 'fog');
}

/**
 * The floor: green epoxy on the production floor (bare concrete in the store)
 * with slab joints, the shine of the lamps and yellow walkway lines.
 */
function paintFloor(
  p: Painter,
  w: number,
  ox: number,
  floorTop: number,
  h: number,
  base: PaletteName = 'moss',
  shine: PaletteName = 'teal',
): void {
  p.rect(0, floorTop, w, h - floorTop, base);
  p.rect(0, floorTop, w, 1, 'night');
  p.rect(0, floorTop + 1, w, 1, 'slate');
  for (let x = mod(ox + 22, 48) - 48; x < w; x += 48)
    p.rect(x, floorTop + 2, 1, h - floorTop - 2, 'night');
  for (let x = mod(ox, 16) - 16, i = 0; x < w; x += 16, i++) {
    const y = floorTop + 6 + (i % 3) * 3;
    if (y < h) p.rect(x + Math.floor(hash2(x - ox, 0, 61) * 8), y, 4, 1, shine);
  }
  // yellow walkway lines, the near one under everyone's feet
  p.rect(0, floorTop + 3, w, 1, 'lamp');
  if (floorTop + 11 < h) p.rect(0, floorTop + 11, w, 1, 'lamp');
}

/** A round air duct running across the wall, with a band every so often. */
function paintDuct(p: Painter, w: number, ox: number, y: number): void {
  p.rect(0, y, w, 6, 'stone');
  p.rect(0, y + 1, w, 1, 'concrete');
  p.rect(0, y + 5, w, 1, 'slate');
  for (let x = mod(ox + 30, 40) - 40; x < w; x += 40) {
    p.rect(x, y - 1, 2, 8, 'slate');
    px(p, x, y + 1, 'fog');
  }
}

/** A steel column from `top` to the floor, wrapped in yellow and black where carts could hit it. */
function paintColumn(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top, 3, floorTop - top, 'stone');
  p.rect(x, top, 1, floorTop - top, 'concrete');
  p.rect(x + 2, top, 1, floorTop - top, 'slate');
  for (let y = floorTop - 8; y < floorTop; y++) {
    p.rect(x, y, 3, 1, mod(y, 4) < 2 ? 'lamp' : 'ink');
  }
}

// ===========================================================================
// The production floor

/** Paints the production floor to fill a w x h stage (at least the 128x64 core). */
function paintPlant(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const roofed = oy >= ROOF_MIN;
  const ceiling = roofed ? TRUSS_H : 0;

  // The wall: dark steel panels, a painted band along the floor.
  p.rect(0, 0, w, floorTop, 'night');
  for (let x = mod(ox + 5, 16) - 16; x < w; x += 16) p.rect(x, 0, 1, floorTop, 'deep');
  p.rect(0, floorTop - 12, w, 12, 'slate');
  p.rect(0, floorTop - 12, w, 1, 'stone');
  if (roofed) {
    paintRoof(p, w, ox);
    const space = oy - 52 - (TRUSS_H + 4);
    if (space >= 14) paintWindowBand(p, w, ox, TRUSS_H + 4, Math.min(30, space), 5);
  }
  paintWindowBand(p, w, ox, oy + WIN.top, WIN.h, 1);
  for (let x = mod(ox + 37, 48) - 48; x < w; x += 48) paintColumn(p, x, ceiling, floorTop);
  if (oy >= 10) paintDuct(p, w, ox, oy - 8);
  if (oy >= 30) paintLogo(p, ox + 50, oy - 28);
  if (oy >= 50) paintClock(p, ox + 64, oy - 38);
  if (oy >= CRANE_MIN) paintCrane(p, w, ox, oy - 74, oy - 56);
  if (oy >= LAMP_MIN) {
    const y = oy - 24 - Math.min(20, Math.floor((oy - LAMP_MIN) / 3));
    for (let x = ox + 24 - Math.ceil((ox + 24 + 30) / 64) * 64; x < w + 30; x += 64) {
      paintHangingLamp(p, x, y, ceiling);
    }
  }
  paintFloor(p, w, ox, floorTop, h);

  // Left of the core: the packing bays where finished lamps are boxed.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++)
    paintPacking(p, x, oy, floorTop, i);
  // Right: the assembly line, running on to the edge.
  paintLine(p, ox + LINE.x, w, ox, oy, floorTop);

  paintSafety(p, ox, oy, floorTop);
  paintLabWindow(p, ox + BENCH.x + 1, oy + 15, BENCH.w - 2, BENCH.top - 17);
  paintBench(p, ox + BENCH.x, oy + BENCH.top, floorTop);
  paintLantern(p, ox + BENCH.x + 1, oy + BENCH.top);
  paintStackLight(p, ox + 100, oy + LINE.belt);
}

/** The yellow girder of the overhead crane across the hall, its trolley and hook over the line. */
function paintCrane(p: Painter, w: number, ox: number, y: number, hookY: number): void {
  p.rect(0, y, w, 6, 'lamp');
  p.rect(0, y, w, 1, 'honey');
  p.rect(0, y + 5, w, 1, 'amber');
  for (let x = mod(ox, 8) - 8; x < w; x += 8) {
    p.rect(x + 1, y + 2, 5, 2, 'amber');
    px(p, x + 3, y + 2, 'ember');
  }
  p.rect(0, y + 6, w, 1, 'night');
  // the trolley under the girder, the cable and the hook
  const tx = ox + 104;
  p.rect(tx, y + 6, 12, 4, 'stone');
  p.rect(tx, y + 6, 12, 1, 'concrete');
  px(p, tx + 2, y + 9, 'ink');
  px(p, tx + 9, y + 9, 'ink');
  p.rect(tx + 5, y + 10, 1, hookY - y - 10, 'ink');
  p.rect(tx + 4, hookY, 3, 3, 'lamp');
  p.rect(tx + 5, hookY + 3, 1, 3, 'concrete');
  p.rect(tx + 3, hookY + 6, 3, 1, 'concrete');
  px(p, tx + 3, hookY + 5, 'concrete');
}

/** Brightway's sign on the wall: a sun rising over a line, on a teal plate. */
function paintLogo(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 14, y + 7, 20, 11, 'cyan', [0.06, 0.03]);
  p.rect(x, y, 28, 14, 'ink');
  p.rect(x + 1, y + 1, 26, 12, 'teal');
  p.rect(x + 1, y + 1, 26, 1, 'cyan');
  ellipse(p, x + 14, y + 9, 5, 4, 'honey');
  p.rect(x + 7, y + 10, 15, 3, 'teal');
  p.rect(x + 4, y + 10, 20, 1, 'paper');
  for (const [dx, dy] of [
    [5, 4],
    [9, 2],
    [14, 1],
    [19, 2],
    [23, 4],
  ] as const) {
    px(p, x + dx, y + 1 + dy, 'lamp');
  }
}

/**
 * The safety station you stand in front of: a board with hard hats and
 * high-visibility vests on hooks, a first-aid box, and a fire extinguisher.
 */
function paintSafety(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x = ox + 2;
  const y = oy + 16;
  p.rect(x, y, 33, 22, 'stone');
  p.rect(x + 1, y + 1, 31, 20, 'slate');
  // a yellow and black header
  p.rect(x + 1, y + 1, 31, 2, 'lamp');
  for (let i = 0; i < 31; i += 4) p.rect(x + 1 + i, y + 1, 2, 2, 'ink');
  // the hooks, three hard hats
  const hats: PaletteName[] = ['lamp', 'paper', 'lamp'];
  hats.forEach((c, i) => {
    const hx = x + 3 + i * 9;
    const yellow = c === 'lamp';
    px(p, hx + 3, y + 4, 'fog');
    p.rect(hx + 2, y + 5, 3, 1, c);
    p.rect(hx + 1, y + 6, 5, 1, c);
    p.rect(hx, y + 7, 7, 1, yellow ? 'amber' : 'fog');
    px(p, hx + 2, y + 5, yellow ? 'honey' : 'paper');
    p.rect(hx + 4, y + 5, 1, 2, yellow ? 'amber' : 'fog');
  });
  // two vests on hangers
  for (let i = 0; i < 2; i++) {
    const vx = x + 4 + i * 9;
    const vy = y + 10;
    p.rect(vx + 1, vy, 5, 1, 'fog');
    p.rect(vx, vy + 1, 2, 9, 'lamp');
    p.rect(vx + 5, vy + 1, 2, 9, 'lamp');
    p.rect(vx + 2, vy + 3, 3, 7, 'lamp');
    p.rect(vx, vy + 5, 7, 1, 'fog');
    p.rect(vx, vy + 8, 7, 1, 'fog');
    p.rect(vx + 6, vy + 1, 1, 9, 'amber');
    px(p, vx + 3, vy + 2, 'slate');
  }
  // the first-aid box
  p.rect(x + 23, y + 10, 8, 7, 'leaf');
  p.rect(x + 23, y + 10, 8, 1, 'paper');
  p.rect(x + 26, y + 12, 2, 4, 'paper');
  p.rect(x + 25, y + 13, 4, 2, 'paper');
  p.rect(x + 30, y + 11, 1, 6, 'moss');
  // the fire extinguisher on its bracket by the floor, its sign above it
  const ex = ox + 3;
  const ey = floorTop - 13;
  p.rect(ex, ey - 6, 5, 4, 'red');
  p.rect(ex + 1, ey - 5, 3, 2, 'paper');
  p.rect(ex + 1, ey, 3, 2, 'ink');
  p.rect(ex + 3, ey + 1, 3, 1, 'ink');
  px(p, ex + 5, ey + 2, 'ink');
  p.rect(ex, ey + 2, 5, 11, 'red');
  p.rect(ex + 4, ey + 2, 1, 11, 'maroon');
  px(p, ex + 1, ey + 3, 'rosy');
  p.rect(ex, ey + 7, 5, 1, 'paper');
  p.rect(ex - 1, ey + 13, 7, 1, 'ink');
}

/** The glass wall of the test lab behind the bench: dark glass, a shelf of lamps inside, two reflections. */
function paintLabWindow(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'stone');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 1, ['deep', 'indigo']);
  // inside the lab: a shelf of lamps under test, their shades faintly lit
  const shelf = y + 10;
  p.rect(x + 1, shelf, w - 2, 1, 'slate');
  for (let lx = x + 4; lx + 6 < x + w - 1; lx += 9) {
    p.rect(lx, shelf - 1, 5, 1, 'slate');
    p.rect(lx + 1, shelf - 6, 1, 5, 'slate');
    p.rect(lx + 1, shelf - 7, 4, 2, 'dusk');
    px(p, lx + 2, shelf - 5, 'violet');
  }
  // the reflections in the glass
  for (let i = 0; i < 9; i++) {
    const ry = y + h - 2 - i * 2;
    p.rect(x + 6 + i, ry, 2, 1, 'dusk');
    px(p, x + 11 + i, ry, 'dusk');
  }
  // the mullion between two panes, and a small lab sign over the glass
  p.rect(x + Math.floor(w / 2), y + 1, 1, h - 1, 'stone');
  const sx = x + Math.floor(w / 2) - 5;
  p.rect(sx, y - 3, 11, 6, 'ink');
  p.rect(sx + 1, y - 2, 9, 4, 'paper');
  p.rect(sx + 5, y - 2, 1, 2, 'teal');
  p.rect(sx + 4, y, 3, 2, 'teal');
  px(p, sx + 5, y + 1, 'cyan');
}

/**
 * The quality-check bench: a pale steel top (props rest on it), drawers in
 * the apron, and on the shelf below a crate of wooden lamp bases, one of them
 * tagged red for a crack.
 */
function paintBench(p: Painter, x: number, top: number, floorTop: number): void {
  const w = BENCH.w;
  const legBottom = floorTop + 5;
  ditherRect(p, x - 1, legBottom, w + 2, 1, 'night', 10);
  p.rect(x + 1, top + 4, 2, legBottom - top - 4, 'slate');
  p.rect(x + w - 3, top + 4, 2, legBottom - top - 4, 'slate');
  px(p, x + 1, top + 4, 'stone');
  // the shelf below, with the crate of bases
  const shelf = top + 9;
  p.rect(x + 1, shelf, w - 2, 2, 'stone');
  p.rect(x + 1, shelf, w - 2, 1, 'concrete');
  const cx = x + 6;
  p.rect(cx, shelf - 6, 20, 6, 'ember');
  p.rect(cx, shelf - 6, 20, 1, 'amber');
  p.rect(cx, shelf - 3, 20, 1, 'plum');
  for (let i = 0; i < 4; i++) {
    p.rect(cx + 1 + i * 5, shelf - 8, 4, 2, 'tan');
    px(p, cx + 4 + i * 5, shelf - 7, 'amber');
  }
  // the red tag on the cracked one
  p.rect(cx + 11, shelf - 9, 2, 2, 'red');
  px(p, cx + 12, shelf - 8, 'maroon');
  // a tray of steel arms beside the crate
  p.rect(x + 29, shelf - 3, 10, 3, 'slate');
  p.rect(x + 30, shelf - 4, 8, 1, 'fog');
  p.rect(x + 31, shelf - 5, 6, 1, 'concrete');
  // the top: back edge, pale steel, the front edge, then the apron and its drawers
  p.rect(x, top - 2, w, 1, 'concrete');
  p.rect(x, top - 1, w, 2, 'fog');
  p.rect(x, top + 1, w, 1, 'paper');
  p.rect(x, top + 2, w, 3, 'stone');
  p.rect(x, top + 2, w, 1, 'concrete');
  for (let dx = 12; dx < w - 4; dx += 14) {
    p.rect(x + dx, top + 3, 8, 1, 'slate');
    px(p, x + dx + 4, top + 3, 'fog');
  }
  p.rect(x, top + 5, w, 1, 'slate');
  // the lamplight from the test lamp and the hanging lights, on the steel
  ditherRect(p, x + 2, top - 1, w - 6, 2, 'paper', 4);
}

/** The stack light at the end of the line: red and amber off, green lit (the line is running). */
function paintStackLight(p: Painter, x: number, belt: number): void {
  glowEllipse(p, x + 1, belt - 13, 7, 5, 'leaf', [0.25, 0.12]);
  p.rect(x, belt - 22, 3, 1, 'ink');
  p.rect(x, belt - 21, 3, 3, 'maroon');
  p.rect(x, belt - 18, 3, 3, 'ember');
  p.rect(x, belt - 15, 3, 3, 'leaf');
  px(p, x, belt - 15, 'paper');
  p.rect(x, belt - 12, 3, 1, 'ink');
  p.rect(x + 1, belt - 11, 1, 10, 'stone');
}

/** A worker behind the line, only a dark shape in a yellow hard hat, reaching to the belt. */
function paintWorker(p: Painter, x: number, belt: number): void {
  p.rect(x + 2, belt - 15, 4, 1, 'amber');
  p.rect(x + 1, belt - 14, 6, 1, 'amber');
  px(p, x + 2, belt - 15, 'lamp');
  p.rect(x + 2, belt - 13, 4, 4, 'slate');
  px(p, x + 2, belt - 12, 'stone');
  p.rect(x + 1, belt - 9, 7, 9, 'slate');
  p.rect(x + 1, belt - 9, 7, 1, 'stone');
  p.rect(x + 1, belt - 6, 7, 1, 'ember');
  p.rect(x - 2, belt - 4, 4, 1, 'slate');
}

/**
 * The assembly line from its end at x0 on to x1: a conveyor carrying lamps
 * at every stage, workers behind it, work lights over it.
 */
function paintLine(
  p: Painter,
  x0: number,
  x1: number,
  ox: number,
  oy: number,
  floorTop: number,
): void {
  const b = oy + LINE.belt;
  // the work lights, on cords from the window sill
  const from = oy + WIN.top + WIN.h + 3;
  for (let x = x0 + 12; x < x1 + 14; x += 40) {
    glowEllipse(p, x + 6, b - 8, 16, 9, 'honey', [0.14, 0.08, 0.04]);
    p.rect(x, from, 1, b - 18 - from, 'ink');
    p.rect(x + 12, from, 1, b - 18 - from, 'ink');
    p.rect(x - 1, b - 18, 15, 1, 'stone');
    p.rect(x, b - 17, 13, 1, 'paper');
  }
  for (let x = ox + 116; x < x1 + 8; x += 52) paintWorker(p, x, b);
  // legs and the shadow under the line
  ditherRect(p, x0, floorTop + 2, x1 - x0, 2, 'night', 8);
  for (let x = x0 + 6; x < x1; x += 20) {
    p.rect(x, b + 6, 2, floorTop + 3 - b - 6, 'slate');
    p.rect(x - 1, floorTop + 3, 4, 1, 'ink');
  }
  p.rect(x0, b + 12, x1 - x0, 1, 'slate');
  // the frame with its rollers, the belt on top
  p.rect(x0, b + 1, x1 - x0, 5, 'stone');
  p.rect(x0, b + 1, x1 - x0, 1, 'concrete');
  for (let x = x0 + 1; x < x1; x += 3) px(p, x, b + 3, 'night');
  p.rect(x0, b + 5, x1 - x0, 1, 'slate');
  p.rect(x0, b - 1, x1 - x0, 1, 'ink');
  p.rect(x0, b, x1 - x0, 1, 'night');
  for (let x = x0 + 2; x < x1; x += 6) px(p, x, b, 'slate');
  // the end roller
  p.rect(x0 - 2, b - 1, 3, 7, 'ink');
  p.rect(x0 - 1, b, 2, 5, 'concrete');
  px(p, x0 - 1, b + 2, 'fog');
  // lamps on the belt: finished near the end, earlier stages further up the line
  for (let x = x0 + 3, k = 0; x + 6 < x1; x += 11, k++) {
    const r = hash2(x - ox, k, 71);
    if (k > 1 && r < 0.15) continue;
    const stage = k < 2 ? 2 : r < 0.45 ? 0 : r < 0.75 ? 1 : 2;
    paintSmallLamp(p, x, b - 1, stage);
  }
}

/**
 * One packing bay left of the core: a pallet of boxed lamps, or a packing
 * table with a worker behind it and a box being closed.
 */
function paintPacking(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  if (i % 2 === 0) {
    // a pallet of lamp boxes, stacked two or three high
    p.rect(x + 5, floorTop + 2, 33, 3, 'ember');
    p.rect(x + 5, floorTop + 2, 33, 1, 'amber');
    for (let dx = 9; dx < 33; dx += 10) p.rect(x + 5 + dx, floorTop + 3, 2, 2, 'plum');
    for (let c = 0; c < 3; c++) {
      const rows = 2 + Math.floor(hash2(x - c, i, 83) * 2);
      for (let r = 0; r < rows; r++) {
        const bx = x + 6 + c * 10;
        const by = floorTop + 2 - (r + 1) * 9;
        p.rect(bx, by, 10, 9, 'fog');
        p.rect(bx, by, 10, 1, 'paper');
        p.rect(bx + 9, by + 1, 1, 8, 'concrete');
        p.rect(bx, by + 8, 10, 1, 'concrete');
        p.rect(bx + 3, by + 3, 3, 1, 'amber');
        p.rect(bx + 4, by + 4, 1, 2, 'stone');
        p.rect(bx + 3, by + 6, 3, 1, 'ember');
      }
    }
    return;
  }
  // the packing table, a worker behind it
  const top = oy + BENCH.top;
  paintWorker(p, x + 18, top - 1);
  p.rect(x + 4, top - 2, 36, 3, 'amber');
  p.rect(x + 4, top - 2, 36, 1, 'tan');
  p.rect(x + 4, top + 1, 36, 2, 'ember');
  p.rect(x + 5, top + 3, 2, floorTop + 4 - top - 3, 'plum');
  p.rect(x + 37, top + 3, 2, floorTop + 4 - top - 3, 'plum');
  // an open box with a lamp going in, a roll of tape
  p.rect(x + 8, top - 9, 11, 7, 'tan');
  p.rect(x + 8, top - 9, 11, 1, 'skin');
  p.rect(x + 18, top - 8, 1, 6, 'ember');
  p.rect(x + 6, top - 12, 3, 4, 'tan');
  p.rect(x + 19, top - 12, 3, 4, 'tan');
  paintSmallLamp(p, x + 10, top - 9, 2);
  p.rect(x + 27, top - 5, 5, 3, 'concrete');
  px(p, x + 29, top - 4, 'night');
  // flattened boxes on a shelf on the wall
  p.rect(x + 4, oy + 24, 36, 2, 'stone');
  p.rect(x + 4, oy + 24, 36, 1, 'concrete');
  for (let s = 0; s < 4; s++) p.rect(x + 7 + s * 8, oy + 17, 7, 7, s % 2 ? 'tan' : 'fog');
}

// ===========================================================================
// The raw-material store, Ms. Varga's office

/** Paints the store and office to fill a w x h stage (at least the 128x64 core). */
function paintStoreroom(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const roofed = oy >= ROOF_MIN;
  const ceiling = roofed ? TRUSS_H : 0;

  // Block walls: mortar lines, every other course shifted by half a block.
  p.rect(0, 0, w, floorTop, 'slate');
  for (let k = 0; floorTop - k * 5 > 0; k++) {
    const y = floorTop - k * 5;
    p.rect(0, y - 1, w, 1, 'night');
    for (let x = mod(ox + (k % 2) * 6, 12) - 12; x < w; x += 12) p.rect(x, y - 5, 1, 4, 'night');
  }
  if (roofed) {
    paintRoof(p, w, ox);
    const space = oy - 66 - (TRUSS_H + 4);
    if (space >= 14) paintWindowBand(p, w, ox, TRUSS_H + 4, Math.min(24, space), 9);
  }
  if (oy >= 24) paintClock(p, ox + 63, oy - 12);
  if (oy >= 80) paintSamples(p, ox + 47, oy - 74);
  paintFloor(p, w, ox, floorTop, h, 'slate', 'stone');

  // The racks: one behind you, one behind the people on the right, more to both edges.
  const top = Math.max(roofed ? ceiling + 40 : 0, oy - 100);
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    paintMaterialRack(p, x + 1, BAY_W - 2, top, floorTop, 40 + i);
  }
  paintMaterialRack(p, ox + 1, 36, top, floorTop, 1);
  for (let x = ox + 84, i = 0; x < w; x += BAY_W, i++) {
    paintMaterialRack(p, x, BAY_W - 2, top, floorTop, 20 + i);
  }
  if (oy >= LAMP_MIN) {
    const y = oy - 24 - Math.min(20, Math.floor((oy - LAMP_MIN) / 3));
    for (let x = ox + 62 - Math.ceil((ox + 62 + 30) / 64) * 64; x < w + 30; x += 64) {
      paintHangingLamp(p, x, y, ceiling);
    }
  }

  // Between them, her corner: a high window, the production board, the desk.
  paintHighWindow(p, ox + 49, oy + WIN.top, 28, WIN.h + 1);
  paintBoard(p, ox + 45, oy + 18, 34, 17);
  paintChair(p, ox + 64, oy + 37);
  paintDesk(p, ox + BENCH.x, oy + BENCH.top, floorTop);
  paintLantern(p, ox + BENCH.x + 1, oy + BENCH.top);
  paintClipboard(p, ox + BENCH.x + 31, oy + BENCH.top);
  paintWoodPile(p, ox + 113, floorTop + 5);
}

/** One window high in the block wall: the dusk sky in four panes. */
function paintHighWindow(p: Painter, x: number, y: number, w: number, h: number): void {
  glowEllipse(p, x + w / 2, y + h, w, 10, 'rosy', [0.08, 0.04]);
  p.rect(x - 1, y - 1, w + 2, h + 2, 'stone');
  ditherGradient(p, x, y, w, h, ['indigo', 'dusk', 'violet', 'mauve', 'rosy']);
  p.rect(x + Math.floor(w / 2), y, 1, h, 'stone');
  p.rect(x, y + Math.floor(h / 2), w, 1, 'stone');
  px(p, x + 4, y + 2, 'fog');
  px(p, x + 20, y + 1, 'fog');
  p.rect(x - 2, y + h + 1, w + 4, 1, 'concrete');
}

/** A board of the Lantern's three materials, mounted for visitors: a wood block, a steel bar, a cloth swatch. */
function paintSamples(p: Painter, x: number, y: number): void {
  p.rect(x, y, 34, 18, 'ink');
  p.rect(x + 1, y + 1, 32, 16, 'plum');
  p.rect(x + 1, y + 1, 32, 1, 'maroon');
  // the wood block, with grain
  p.rect(x + 3, y + 4, 8, 8, 'amber');
  p.rect(x + 3, y + 4, 8, 1, 'tan');
  p.rect(x + 4, y + 7, 6, 1, 'ember');
  p.rect(x + 5, y + 10, 5, 1, 'ember');
  // the steel bar
  p.rect(x + 14, y + 5, 6, 7, 'concrete');
  p.rect(x + 14, y + 5, 6, 1, 'paper');
  p.rect(x + 14, y + 6, 1, 6, 'fog');
  p.rect(x + 19, y + 6, 1, 6, 'stone');
  // the cloth swatch, its edge frayed
  p.rect(x + 23, y + 4, 8, 8, 'paper');
  p.rect(x + 23, y + 4, 8, 1, 'fog');
  for (let i = 0; i < 4; i++) px(p, x + 24 + i * 2, y + 12, 'paper');
  p.rect(x + 24, y + 7, 6, 1, 'fog');
  // a small brass plate under each
  for (let i = 0; i < 3; i++) p.rect(x + 4 + i * 10, y + 14, 6, 1, 'honey');
}

/** The production board: a dark green glass board with a bar for each line and two magnets. */
function paintBoard(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'stone');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'moss');
  const bars: readonly [number, PaletteName][] = [
    [22, 'leaf'],
    [15, 'lamp'],
    [26, 'leaf'],
    [9, 'rosy'],
  ];
  bars.forEach(([len, c], i) => {
    const by = y + 3 + i * 3;
    p.rect(x + 3, by, 2, 1, 'fog');
    p.rect(x + 6, by, len, 1, c);
  });
  px(p, x + w - 4, y + 2, 'red');
  px(p, x + w - 6, y + 2, 'cyan');
  p.rect(x + 2, y + h, w - 4, 1, 'concrete');
}

/** Her office chair, pushed in behind the desk: only the rounded back and the arms show. */
function paintChair(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 7, 1, 'ink');
  p.rect(x, y + 1, 9, 6, 'ink');
  p.rect(x + 1, y + 1, 7, 5, 'maroon');
  p.rect(x + 2, y + 1, 5, 1, 'red');
  p.rect(x + 7, y + 2, 1, 4, 'plum');
  p.rect(x - 2, y + 5, 3, 2, 'ink');
  p.rect(x + 8, y + 5, 3, 2, 'ink');
}

/** Her wooden desk: the top props rest on, a modesty panel, a pedestal of drawers on the right. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = BENCH.w;
  const bottom = floorTop + 5;
  ditherRect(p, x - 1, bottom, w + 2, 1, 'night', 10);
  p.rect(x + 1, top + 2, 2, bottom - top - 2, 'plum');
  p.rect(x + 2, top + 2, w - 16, 8, 'ember');
  p.rect(x + 2, top + 9, w - 16, 1, 'plum');
  // the drawers
  const dx = x + w - 14;
  p.rect(dx, top + 2, 14, bottom - top - 2, 'ember');
  p.rect(dx, top + 2, 1, bottom - top - 2, 'plum');
  for (let i = 0; i < 3; i++) {
    const y = top + 4 + i * 3;
    p.rect(dx + 1, y + 2, 13, 1, 'plum');
    p.rect(dx + 6, y, 3, 1, 'honey');
  }
  // the top
  p.rect(x, top - 2, w, 1, 'ember');
  p.rect(x, top - 1, w, 2, 'amber');
  p.rect(x, top + 1, w, 1, 'tan');
  for (let gx = 5; gx < w - 4; gx += 9) px(p, x + gx, top, 'ember');
}

/** A clipboard lying on the desk with a checklist on it and a pen. */
function paintClipboard(p: Painter, x: number, top: number): void {
  p.rect(x, top - 2, 10, 3, 'tan');
  p.rect(x + 1, top - 2, 8, 2, 'paper');
  p.rect(x + 2, top - 1, 5, 1, 'fog');
  p.rect(x + 3, top - 3, 4, 1, 'concrete');
  px(p, x + 4, top - 3, 'fog');
  p.rect(x + 10, top - 1, 3, 1, 'red');
}

/** A pallet of fresh planks on the floor, strapped. */
function paintWoodPile(p: Painter, x: number, floor: number): void {
  p.rect(x, floor - 3, 18, 3, 'ember');
  p.rect(x, floor - 3, 18, 1, 'plum');
  p.rect(x + 5, floor - 2, 2, 2, 'night');
  p.rect(x + 12, floor - 2, 2, 2, 'night');
  for (let r = 0; r < 3; r++) {
    const y = floor - 5 - r * 2;
    p.rect(x + 1, y, 16, 2, r % 2 ? 'tan' : 'amber');
    px(p, x + 1, y, 'ember');
    px(p, x + 16, y + 1, 'ember');
  }
  p.rect(x + 8, floor - 9, 1, 6, 'ink');
}

/**
 * A rack bay of raw materials: steel uprights, teal beams, and on each level
 * wooden planks, stacks of turned lamp bases, bundles of steel arms, rolls of
 * shade cloth or bins of small parts.
 */
function paintMaterialRack(
  p: Painter,
  x: number,
  w: number,
  top: number,
  floorTop: number,
  seed: number,
): void {
  for (const ux of [x, x + w - 2]) {
    p.rect(ux, top, 2, floorTop + 2 - top, 'stone');
    p.rect(ux, top, 1, floorTop + 2 - top, 'concrete');
    for (let y = top + 2; y < floorTop; y += 4) px(p, ux + 1, y, 'night');
  }
  for (let y = floorTop - 2, level = 0; y > top + 8; y -= 16, level++) {
    paintLoad(p, x + 3, x + w - 3, y, Math.floor(hash2(seed, level, 13) * 5), seed * 7 + level);
    p.rect(x, y, w, 2, 'teal');
    p.rect(x, y, w, 1, 'sky');
    p.rect(x, y + 2, w, 1, 'night');
  }
}

/** What stands on one rack level between x0 and x1, on `base`. */
function paintLoad(
  p: Painter,
  x0: number,
  x1: number,
  base: number,
  kind: number,
  seed: number,
): void {
  const w = x1 - x0;
  if (kind === 0) {
    // planks, stacked flat
    const rows = 3 + Math.floor(hash2(seed, 1, 5) * 3);
    for (let r = 0; r < rows; r++) {
      const y = base - 2 - r * 2;
      const inset = Math.floor(hash2(seed, r, 9) * 3);
      p.rect(x0 + inset, y, w - inset - 1, 2, r % 2 ? 'tan' : 'amber');
      px(p, x0 + inset, y, 'ember');
      px(p, x1 - 2, y + 1, 'ember');
    }
    return;
  }
  if (kind === 1) {
    // turned wooden lamp bases, in stacks
    for (let sx = x0; sx + 6 <= x1; sx += 8) {
      const n = 2 + Math.floor(hash2(seed, sx, 7) * 4);
      for (let i = 0; i < n; i++) {
        const y = base - 2 - i * 2;
        p.rect(sx, y, 6, 2, 'tan');
        p.rect(sx, y + 1, 6, 1, 'amber');
        px(p, sx + 5, y + 1, 'ember');
      }
    }
    return;
  }
  if (kind === 2) {
    // steel arms in bundles, and a blue tote of springs
    for (let r = 0; r < 5; r++) {
      const y = base - 2 - r * 2;
      p.rect(x0, y, w - 12, 1, r % 2 ? 'concrete' : 'fog');
      p.rect(x0 + w - 13, y - 1, 1, 2, 'fog');
    }
    p.rect(x0 + 3, base - 11, 1, 10, 'ink');
    p.rect(x1 - 10, base - 6, 10, 6, 'denim');
    p.rect(x1 - 10, base - 6, 10, 1, 'sky');
    p.rect(x1 - 8, base - 8, 6, 2, 'fog');
    return;
  }
  if (kind === 3) {
    // rolls of shade cloth lying end on, in a pile: round ends with a core in the middle
    const cloth: PaletteName[] = ['paper', 'rosy', 'fog', 'sky', 'mauve'];
    const n = Math.floor((w - 1) / 6);
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < n - row; i++) {
        const c = cloth[Math.floor(hash2(seed, i + row * 9, 3) * cloth.length)] ?? 'paper';
        const rx = x0 + i * 6 + row * 3;
        const ry = base - 6 - row * 5;
        p.rect(rx + 1, ry, 4, 6, c);
        p.rect(rx, ry + 1, 6, 4, c);
        px(p, rx + 4, ry + 4, 'concrete');
        p.rect(rx + 2, ry + 2, 2, 2, 'night');
      }
    }
    return;
  }
  // bins of small parts, with labels
  for (let sx = x0; sx + 8 <= x1; sx += 9) {
    const c: PaletteName = hash2(seed, sx, 2) < 0.3 ? 'red' : 'denim';
    p.rect(sx + 1, base - 8, 6, 2, 'fog');
    p.rect(sx, base - 6, 8, 6, c);
    p.rect(sx, base - 6, 8, 1, c === 'red' ? 'rosy' : 'sky');
    p.rect(sx + 2, base - 4, 3, 2, 'paper');
  }
}

export const FACTORY_STAGE: StageConfig = {
  paint: paintPlant,
  backdrops: { plant_manager: paintStoreroom },
  cast: {
    guide: GUIDE_ACTOR,
    plant_manager: { sprite: PLANT_MANAGER_SPRITE, ...VARGA, side: 'right' },
    // Alone Jack stands where Ms. Varga stands; with her there too, a step further along the line.
    supplier: { sprite: SUPPLIER_SPRITE, ...VARGA, side: 'right', beside: { ...JACK_BESIDE } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 88, y: 26 } },
  rest: {
    // Right of the test lamp, so its shade stays in sight.
    left: { x: BENCH.x + 13, y: PROP_TOP },
    right: { x: BENCH.x + 18, y: PROP_TOP },
  },
};
