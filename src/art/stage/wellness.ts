import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { COWORKER_SPRITE, HR_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintLamp, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The wellness stage has two rooms of the Harbor Trading office on a
 * September evening, built on the same floor line and the same resting
 * surface so the cast, bubbles and props fit both:
 *
 * - The office kitchen / break room (the default): a notice board with a
 *   yoga-mat flyer and a window onto the town at dusk on the left, a small
 *   round table with two chairs under a pendant lamp in the middle (handed-over
 *   things rest on it), and on the right the counter with a fruit bowl and a
 *   kettle under blue cupboards, then the water cooler.
 * - Ms. Reed's desk area (`backdrops.hr`): an office window, a board of
 *   benefits leaflets over her desk, her chair pushed back, a shelf of
 *   binders, a filing cabinet with folders and a lit Lantern lamp on it, and
 *   a plant.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom; extra wall
 * goes above (taller windows, a poster, a clock, things on top of the
 * cupboards, then a cornice and a dark upper wall with high windows) and to
 * both sides more of each room. Palette colours only, whole pixels; partial
 * alpha only for light.
 */

const FLOOR_TOP = 54;
/** The rail on the wall, and the skirting board's top. */
const DADO = 41;
const SKIRT = 52;
/** The round table / Ms. Reed's desk: left edge, width and the y of its top, in core pixels. */
const TABLE = { x: 38, w: 35, top: 48 } as const;
/** 24x24 pictures stand on the top with their shadow on it. */
const PROP_TOP = TABLE.top - 20;
/** The kitchen counter: its left end and its top. Cupboards hang above it. */
const COUNTER = { x: 74, top: 44 } as const;
const UPPERS = { top: 4, bottom: 20 } as const;
/** The water cooler's left edge and width. */
const COOLER = { x: 115, w: 9 } as const;
/** The core's window: outer frame. */
const WINDOW = { y: 7, w: 28, h: 25 } as const;
/** How much taller windows grow on a tall stage, at most. */
const WINDOW_GROW = 22;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the upper wall, and how far above the core its cornice sits. */
const CORNICE_MIN = 70;
const CORNICE_UP = 56;
/** Gap between the high windows of the upper wall. */
const HIGH_GAP = 64;

/** Where people stand: Dan alone (and anyone alone); Ms. Carter and Ms. Reed together. */
const BASE = { x: 84, y: 39 } as const;
const CARTER_BESIDE = { x: 74, y: 39 } as const;
const REED_BESIDE = { x: 92, y: 39 } as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a window's glass). */
function within(p: Painter, x: number, y: number, w: number, h: number): Painter {
  return {
    rect(rx, ry, rw, rh, color, alpha) {
      const x0 = Math.max(x, rx);
      const y0 = Math.max(y, ry);
      const x1 = Math.min(x + w, rx + rw);
      const y1 = Math.min(y + h, ry + rh);
      if (x1 > x0 && y1 > y0) p.rect(x0, y0, x1 - x0, y1 - y0, color, alpha);
    },
  };
}

/** Left edges of the bays left of the core (going left) and from `start` (going right). */
function bays(w: number, ox: number, start: number): { left: number[]; right: number[] } {
  const left: number[] = [];
  const right: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) left.push(x);
  for (let x = start; x < w; x += BAY_W) right.push(x);
  return { left, right };
}

/** The windows' top on a stage with `oy` pixels of wall above the core. */
function windowTop(oy: number): number {
  return oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 26));
}

// ===========================================================================
// Shared by both rooms

/**
 * The pale wall down to the rail, darker towards the ceiling, then the blue
 * beadboard under the rail and the skirting board; above a tall stage, the
 * cornice and the dark upper wall.
 */
function paintWalls(p: Painter, w: number, ox: number, oy: number): void {
  const rail = oy + DADO;
  const skirt = oy + SKIRT;
  p.rect(0, 0, w, rail, 'fog');
  if (oy >= CORNICE_MIN) paintUpperWall(p, w, ox, oy - CORNICE_UP);

  // the beadboard under a white rail
  p.rect(0, rail, w, skirt - rail, 'sky');
  for (let x = mod(ox, 4); x < w; x += 4) p.rect(x, rail + 2, 1, skirt - rail - 2, 'dusk');
  p.rect(0, rail, w, 1, 'paper');
  p.rect(0, rail + 1, w, 1, 'stone');
  p.rect(0, skirt, w, 2, 'slate');
  p.rect(0, skirt, w, 1, 'stone');
}

/**
 * The building above the core's wall on a tall stage: a white cornice and,
 * above it, a dark upper wall with high windows onto the night sky.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'slate');
  ditherRect(p, 0, 0, w, 3, 'night', 8);
  const wh = Math.min(44, cornice - 18);
  const top = Math.max(6, cornice - wh - 12);
  if (wh >= 12) {
    const first = Math.floor(-(ox + 24) / HIGH_GAP) - 1;
    for (let k = first; ox + 24 + k * HIGH_GAP - 12 < w; k++) {
      const x = ox + 12 + k * HIGH_GAP;
      p.rect(x, top, 24, wh, 'stone');
      ditherGradient(p, x + 1, top + 1, 22, wh - 2, ['night', 'deep', 'indigo']);
      for (let i = 0; i < 5; i++) {
        const sx = x + 2 + Math.floor(hash2(k, i, 131) * 20);
        const sy = top + 2 + Math.floor(hash2(k, i, 137) * (wh - 4));
        px(p, sx, sy, hash2(k, i, 139) > 0.7 ? 'paper' : 'fog');
      }
      p.rect(x + 12, top + 1, 1, wh - 2, 'stone');
      p.rect(x - 1, top + wh, 26, 1, 'fog');
      // a wall lamp between this window and the next
      const lx = x + 24 + HIGH_GAP / 2 - 12;
      const ly = top + Math.floor(wh / 2);
      glowEllipse(p, lx, ly, 10, 8, 'honey', [0.22, 0.12, 0.05]);
      p.rect(lx - 1, ly - 2, 3, 4, 'honey');
      p.rect(lx - 2, ly + 2, 5, 1, 'amber');
      px(p, lx, ly - 1, 'paper');
    }
  }
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'fog');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

/** One period of the town outside, in pixels; windows side by side show one view. */
const TOWN_P = 120;

/**
 * The small town at dusk through a window: glass from (x, y), w x h. Roofs,
 * a church spire and a few lit windows sit a fixed way up from the sill, so a
 * taller window only shows more sky. Positions count from the core's left edge.
 */
function paintTown(target: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  const p = within(target, x, y, w, h);
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'dusk', 'violet', 'mauve', 'rosy']
      : ['indigo', 'dusk', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, h, sky);
  const ground = y + h;
  for (let i = 0; i < w; i++) {
    const tx = mod(x + i - ox, TOWN_P);
    // roofs: blocks of different heights
    const block = Math.floor(tx / 13);
    const roof = 5 + Math.floor(hash2(block, 3, 41) * 7);
    p.rect(x + i, ground - roof, 1, roof, 'night');
    if (tx % 13 === 0) px(p, x + i, ground - roof - 1, 'night');
    // lit windows
    if (tx % 3 === 1 && hash2(tx, 5, 43) < 0.3) {
      px(p, x + i, ground - 2 - Math.floor(hash2(tx, 7, 47) * (roof - 3)), 'honey');
    }
    // trees in front
    if (hash2(Math.floor(tx / 4), 9, 53) < 0.25) p.rect(x + i, ground - 3, 1, 3, 'moss');
    // early stars
    if (hash2(tx, 11, 59) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(tx, 13, 61) * Math.max(2, h - 16)), 'fog');
    }
  }
  // the church spire, once a period
  const first = Math.floor((x - ox - 10) / TOWN_P);
  for (let k = first; ox + k * TOWN_P < x + w + 10; k++) {
    const sx = ox + k * TOWN_P + 52;
    p.rect(sx - 2, ground - 14, 5, 14, 'night');
    p.rect(sx - 1, ground - 18, 3, 4, 'night');
    p.rect(sx, ground - 22, 1, 4, 'night');
    px(p, sx, ground - 11, 'lamp');
  }
}

/** A white-framed window onto the town: outer frame from (x, top), `ht` high, a sill under it. */
function paintTownWindow(p: Painter, x: number, top: number, ht: number, ox: number): void {
  const w = WINDOW.w;
  p.rect(x, top, w, ht, 'paper');
  paintTown(p, x + 2, top + 2, w - 4, ht - 4, ox);
  p.rect(x + Math.floor(w / 2) - 1, top + 2, 2, ht - 4, 'paper');
  p.rect(x + 2, top + Math.floor(ht / 2), w - 4, 1, 'paper');
  p.rect(x + 1, top + 1, w - 2, 1, 'fog');
  // the sill and its shadow
  p.rect(x - 2, top + ht, w + 4, 2, 'paper');
  p.rect(x - 2, top + ht + 1, w + 4, 1, 'fog');
  p.rect(x - 1, top + ht + 2, w + 2, 1, 'concrete');
}

// ===========================================================================
// The break room

function paintBreakRoom(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const winTop = windowTop(oy);
  const winH = oy + WINDOW.y + WINDOW.h - winTop;
  const fridgeX = ox + CORE_W;
  const { left, right } = bays(w, ox, fridgeX + 20);

  paintWalls(p, w, ox, oy);
  // the lamp over the table lights the wall around it
  glowEllipse(p, ox + 55, oy + 22, 36, 24, 'paper', [0.22, 0.14, 0.07]);
  paintTiles(p, w, ox, floorTop, h);

  // left: the notice board under a poster, the window over the table, more of the room
  paintTownWindow(p, ox + 36, winTop, winH, ox);
  paintNoticeBoard(p, ox + 3, oy + 10);
  if (oy >= 26) paintPoster(p, ox + 5, oy - 22);
  for (const [i, x] of left.entries()) {
    paintTownWindow(p, x + 8, winTop, winH, ox);
    if (i % 2 === 0) paintSofa(p, x + 6, oy);
    else {
      paintPlant(p, x + 4, oy + 34);
      paintSideTable(p, x + 22, oy);
    }
  }

  // right: cupboards and the counter, the water cooler, the fridge, more counter
  paintUppers(p, ox + COUNTER.x, w, oy, [[fridgeX - 1, fridgeX + 19]]);
  paintCounter(p, ox + COUNTER.x, ox + COOLER.x - 1, oy);
  paintCounter(p, ox + COOLER.x + COOLER.w + 1, w, oy);
  paintFruitBowl(p, ox + 100, oy + COUNTER.top);
  paintKettle(p, ox + 107, oy + COUNTER.top);
  paintMugs(p, ox + 76, oy + COUNTER.top);
  if (oy >= 8) paintCupboardTop(p, ox + 78, oy + UPPERS.top);
  if (oy >= 20) paintClock(p, ox + 110, oy - 9);
  paintCooler(p, ox + COOLER.x, oy);
  paintFridge(p, fridgeX, oy);
  for (const [i, x] of right.entries()) {
    if (i % 2 === 0) paintMicrowave(p, x + 10, oy + COUNTER.top);
    else paintCoffeeMaker(p, x + 14, oy + COUNTER.top);
  }

  // the round table with two chairs under the lamp
  paintChair(p, ox + TABLE.x - 3, oy, -1);
  paintChair(p, ox + TABLE.x + TABLE.w + 1, oy, 1);
  paintRoundTable(p, ox + TABLE.x, oy + TABLE.top, TABLE.w, oy);
  paintLamp(p, ox + 55, oy);
  glowEllipse(p, ox + 55, oy + 9, 9, 5, 'honey', [0.25, 0.12]);
}

/** A kitchen floor of big pale and grey tiles in rows, counted from the core. */
function paintTiles(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'stone');
  p.rect(0, floorTop, w, 1, 'slate');
  let y = floorTop + 1;
  for (let row = 0; y < h; row++) {
    const rowH = Math.min(3 + row, 6);
    for (let x = mod(ox + row * 5, 16) - 16; x < w; x += 16) {
      p.rect(x, y, 8, rowH - 1, 'concrete');
    }
    p.rect(0, y + rowH - 1, w, 1, 'slate');
    y += rowH;
  }
  // the lamp's light on the floor under the table
  glowEllipse(p, ox + 55, floorTop + 6, 28, 4, 'paper', [0.18, 0.08]);
}

/** The cork notice board: the yoga-mat flyer, a calendar page, a lunch menu, a note. */
function paintNoticeBoard(p: Painter, x: number, y: number): void {
  const w = 24;
  const h = 19;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'tan');
  ditherRect(p, x + 1, y + 1, w - 2, h - 2, 'amber', 3);
  // the yoga flyer: a person stretching on a green mat under a sun
  const fx = x + 2;
  const fy = y + 2;
  p.rect(fx, fy, 11, 14, 'paper');
  p.rect(fx + 1, fy + 1, 9, 1, 'leaf');
  p.rect(fx + 7, fy + 3, 2, 2, 'lamp');
  px(p, fx + 3, fy + 5, 'skin');
  p.rect(fx + 3, fy + 6, 1, 3, 'neon');
  px(p, fx + 2, fy + 6, 'neon');
  px(p, fx + 1, fy + 5, 'neon');
  px(p, fx + 4, fy + 6, 'neon');
  px(p, fx + 5, fy + 5, 'neon');
  p.rect(fx + 2, fy + 9, 1, 2, 'denim');
  p.rect(fx + 4, fy + 9, 1, 2, 'denim');
  p.rect(fx + 1, fy + 11, 9, 1, 'leaf');
  p.rect(fx + 1, fy + 12, 9, 1, 'moss');
  px(p, fx + 5, fy - 1, 'red'); // the pin
  // a calendar page with a ringed day
  p.rect(x + 14, y + 2, 8, 8, 'paper');
  p.rect(x + 14, y + 2, 8, 2, 'red');
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 3; c++) px(p, x + 15 + c * 2, y + 5 + r * 2, 'stone');
  px(p, x + 19, y + 7, 'red');
  px(p, x + 18, y + 1, 'lamp');
  // a menu card and a sticky note
  p.rect(x + 14, y + 11, 5, 6, 'fog');
  p.rect(x + 15, y + 12, 3, 1, 'stone');
  p.rect(x + 15, y + 14, 3, 1, 'stone');
  p.rect(x + 20, y + 12, 3, 3, 'honey');
}

/** A poster over the board: a red heart and a green leaf on white. */
function paintPoster(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 17, 18, 1, 'concrete');
  p.rect(x, y, 18, 17, 'paper');
  p.rect(x, y, 18, 1, 'fog');
  // the heart
  p.rect(x + 4, y + 4, 3, 1, 'red');
  p.rect(x + 9, y + 4, 3, 1, 'red');
  p.rect(x + 3, y + 5, 10, 2, 'red');
  p.rect(x + 4, y + 7, 8, 1, 'red');
  p.rect(x + 5, y + 8, 6, 1, 'red');
  p.rect(x + 6, y + 9, 4, 1, 'red');
  p.rect(x + 7, y + 10, 2, 1, 'maroon');
  px(p, x + 4, y + 5, 'rosy');
  // a little leaf under it
  p.rect(x + 7, y + 12, 4, 1, 'leaf');
  p.rect(x + 6, y + 13, 4, 1, 'moss');
  px(p, x + 6, y + 14, 'moss');
}

/** Blue cupboards on the wall from x0 to x1, a light strip under them; `gaps` are left bare. */
function paintUppers(
  p: Painter,
  x0: number,
  x1: number,
  oy: number,
  gaps: readonly (readonly [number, number])[],
): void {
  const top = oy + UPPERS.top;
  const bottom = oy + UPPERS.bottom;
  const counter = oy + COUNTER.top;
  // the white tiled splashback between the cupboards and the counter
  p.rect(x0, bottom, x1 - x0, counter - bottom, 'paper');
  for (let y = bottom + 4; y < counter; y += 4) p.rect(x0, y, x1 - x0, 1, 'fog');
  for (let y = bottom, r = 0; y < counter; y += 4, r++) {
    for (let x = x0 + (r % 2) * 3; x < x1; x += 6) p.rect(x, y, 1, Math.min(4, counter - y), 'fog');
  }
  // the light from under the cupboards
  ditherRect(p, x0, bottom, x1 - x0, 3, 'honey', 4);
  ditherRect(p, x0, bottom + 3, x1 - x0, 3, 'honey', 2);
  p.rect(x0, top - 1, x1 - x0, 1, 'stone');
  for (let x = x0; x < x1; x += 13) {
    if (gaps.some(([g0, g1]) => x + 12 > g0 && x < g1)) continue;
    p.rect(x, top, 12, bottom - top, 'denim');
    p.rect(x, top, 12, 1, 'sky');
    p.rect(x, top, 1, bottom - top, 'sky');
    p.rect(x + 2, top + 2, 8, bottom - top - 4, 'indigo');
    p.rect(x + 3, top + 3, 6, bottom - top - 6, 'denim');
    px(p, x + 9, bottom - 4, 'fog');
    p.rect(x, bottom - 1, 12, 1, 'deep');
    p.rect(x + 12, top, 1, bottom - top, 'night');
  }
  p.rect(x0, bottom, x1 - x0, 1, 'lamp');
}

/** Things kept on top of the cupboards: tea boxes, a jar and a small plant. */
function paintCupboardTop(p: Painter, x: number, top: number): void {
  p.rect(x, top - 6, 6, 5, 'red');
  p.rect(x, top - 6, 6, 1, 'rosy');
  p.rect(x + 1, top - 4, 4, 1, 'paper');
  p.rect(x + 7, top - 4, 5, 3, 'leaf');
  p.rect(x + 7, top - 4, 5, 1, 'paper');
  p.rect(x + 16, top - 6, 4, 5, 'fog');
  p.rect(x + 16, top - 7, 4, 1, 'amber');
  px(p, x + 17, top - 5, 'paper');
  // a small plant in a pot
  p.rect(x + 24, top - 4, 5, 3, 'amber');
  p.rect(x + 23, top - 8, 3, 3, 'leaf');
  p.rect(x + 27, top - 9, 3, 4, 'leaf');
  p.rect(x + 25, top - 10, 2, 5, 'moss');
  p.rect(x, top - 1, 30, 1, 'stone');
}

/** The counter from x0 to x1: a pale worktop over blue cupboard doors, a dark toe kick. */
function paintCounter(p: Painter, x0: number, x1: number, oy: number): void {
  if (x1 <= x0) return;
  const top = oy + COUNTER.top;
  const floor = oy + FLOOR_TOP;
  const w = x1 - x0;
  p.rect(x0, top, w, floor - top, 'denim');
  p.rect(x0, top, w, 1, 'paper');
  p.rect(x0, top + 1, w, 1, 'fog');
  p.rect(x0, top + 2, w, 1, 'stone');
  for (let x = x0; x < x1; x += 10) {
    p.rect(x, top + 3, 1, floor - top - 5, 'indigo');
    p.rect(x + 1, top + 3, 1, floor - top - 5, 'sky');
    px(p, x + 7, top + 5, 'fog');
  }
  p.rect(x0, floor - 2, w, 2, 'night');
}

/** A bowl of fruit on the counter, its foot on `top`. */
function paintFruitBowl(p: Painter, x: number, top: number): void {
  p.rect(x + 1, top - 5, 2, 2, 'red');
  p.rect(x + 3, top - 6, 2, 3, 'lamp');
  p.rect(x + 5, top - 5, 2, 2, 'leaf');
  px(p, x + 1, top - 5, 'rosy');
  px(p, x + 4, top - 7, 'moss');
  p.rect(x, top - 3, 8, 2, 'paper');
  p.rect(x + 1, top - 1, 6, 1, 'fog');
  p.rect(x + 1, top - 3, 6, 1, 'fog');
}

/** The electric kettle on its base, steaming a little. */
function paintKettle(p: Painter, x: number, top: number): void {
  p.rect(x, top - 1, 7, 1, 'night');
  p.rect(x + 1, top - 7, 5, 6, 'paper');
  p.rect(x + 5, top - 7, 1, 6, 'fog');
  p.rect(x + 1, top - 8, 4, 1, 'fog');
  p.rect(x + 6, top - 6, 1, 4, 'ink');
  px(p, x, top - 6, 'paper'); // the spout
  px(p, x + 2, top - 3, 'red'); // the switch light
  px(p, x + 2, top - 10, 'fog');
  px(p, x + 3, top - 12, 'fog');
}

/** Two mugs by the counter's left end. */
function paintMugs(p: Painter, x: number, top: number): void {
  p.rect(x, top - 3, 3, 3, 'red');
  px(p, x + 3, top - 2, 'red');
  p.rect(x + 5, top - 3, 3, 3, 'lamp');
  px(p, x + 8, top - 2, 'lamp');
  px(p, x, top - 3, 'rosy');
}

/** The water cooler: a blue bottle upside down on a white stand with two taps. */
function paintCooler(p: Painter, x: number, oy: number): void {
  const floor = oy + FLOOR_TOP;
  const body = oy + 33;
  // the bottle
  p.rect(x + 1, body - 11, 7, 9, 'sky');
  p.rect(x + 2, body - 12, 5, 1, 'sky');
  p.rect(x + 3, body - 2, 3, 2, 'dusk');
  p.rect(x + 6, body - 10, 1, 7, 'dusk');
  px(p, x + 2, body - 10, 'paper');
  p.rect(x + 2, body - 7, 3, 1, 'cyan');
  // the stand
  p.rect(x, body, COOLER.w, floor - body + 1, 'paper');
  p.rect(x + COOLER.w - 2, body, 2, floor - body + 1, 'fog');
  p.rect(x, body, COOLER.w, 1, 'fog');
  p.rect(x + 1, body + 4, 7, 4, 'concrete');
  px(p, x + 2, body + 5, 'cyan');
  px(p, x + 6, body + 5, 'red');
  p.rect(x + 1, body + 9, 7, 1, 'stone');
  p.rect(x + 2, body + 13, 5, 6, 'fog');
  p.rect(x, floor, COOLER.w, 1, 'slate');
}

/** A tall fridge, its top at the cupboards. */
function paintFridge(p: Painter, x: number, oy: number): void {
  const top = oy + UPPERS.top;
  const floor = oy + FLOOR_TOP;
  p.rect(x, top, 18, floor - top, 'paper');
  p.rect(x + 16, top, 2, floor - top, 'fog');
  p.rect(x, top, 18, 1, 'fog');
  p.rect(x, top + 16, 18, 1, 'concrete');
  p.rect(x + 2, top + 5, 1, 7, 'concrete');
  p.rect(x + 2, top + 19, 1, 10, 'concrete');
  // a photo and a magnet
  p.rect(x + 8, top + 21, 5, 4, 'sky');
  px(p, x + 9, top + 23, 'leaf');
  px(p, x + 13, top + 4, 'red');
  p.rect(x, floor - 1, 18, 1, 'stone');
}

/** A microwave on the counter. */
function paintMicrowave(p: Painter, x: number, top: number): void {
  p.rect(x, top - 9, 16, 9, 'paper');
  p.rect(x, top - 9, 16, 1, 'fog');
  p.rect(x + 1, top - 7, 10, 6, 'night');
  ditherRect(p, x + 2, top - 6, 8, 4, 'slate', 6);
  p.rect(x + 12, top - 7, 3, 2, 'ink');
  px(p, x + 13, top - 7, 'leaf');
  p.rect(x + 12, top - 4, 3, 1, 'stone');
}

/** A coffee maker with its glass jug, and a mug. */
function paintCoffeeMaker(p: Painter, x: number, top: number): void {
  p.rect(x, top - 12, 9, 12, 'ink');
  p.rect(x, top - 12, 9, 1, 'stone');
  p.rect(x + 1, top - 6, 6, 5, 'fog');
  p.rect(x + 2, top - 4, 4, 3, 'ember');
  px(p, x + 7, top - 10, 'red');
  p.rect(x + 12, top - 3, 3, 3, 'teal');
  px(p, x + 15, top - 2, 'teal');
}

/** A two-seat sofa under a window, from x. */
function paintSofa(p: Painter, x: number, oy: number): void {
  const floor = oy + FLOOR_TOP;
  p.rect(x, oy + 40, 32, 10, 'teal');
  p.rect(x, oy + 40, 32, 1, 'cyan');
  p.rect(x + 3, oy + 46, 26, 5, 'teal');
  p.rect(x + 3, oy + 46, 26, 1, 'cyan');
  p.rect(x + 16, oy + 41, 1, 5, 'moss');
  p.rect(x, oy + 44, 4, 9, 'teal');
  p.rect(x + 28, oy + 44, 4, 9, 'teal');
  p.rect(x, oy + 44, 4, 1, 'cyan');
  p.rect(x + 28, oy + 44, 4, 1, 'cyan');
  p.rect(x + 3, oy + 51, 26, 2, 'moss');
  // a cushion
  p.rect(x + 5, oy + 42, 6, 4, 'lamp');
  p.rect(x + 5, oy + 45, 6, 1, 'amber');
  p.rect(x + 1, floor - 1, 2, 1, 'ink');
  p.rect(x + 29, floor - 1, 2, 1, 'ink');
}

/** A low side table with a stack of magazines. */
function paintSideTable(p: Painter, x: number, oy: number): void {
  const floor = oy + FLOOR_TOP;
  p.rect(x, oy + 45, 14, 2, 'amber');
  p.rect(x, oy + 47, 14, 1, 'ember');
  p.rect(x + 1, oy + 48, 1, floor - oy - 48, 'ember');
  p.rect(x + 12, oy + 48, 1, floor - oy - 48, 'ember');
  p.rect(x + 2, oy + 43, 8, 2, 'rosy');
  p.rect(x + 3, oy + 42, 7, 1, 'sky');
}

/** A wooden café chair beside the table; `side` -1 has its back on the left. */
function paintChair(p: Painter, x: number, oy: number, side: -1 | 1): void {
  const seat = oy + 52;
  const feet = oy + 61;
  const back = side < 0 ? x : x + 6;
  p.rect(back, oy + 41, 1, feet - oy - 41, 'ember');
  p.rect(back, oy + 41, 1, 1, 'amber');
  p.rect(side < 0 ? x : x + 3, oy + 43, 4, 1, 'amber');
  p.rect(side < 0 ? x : x + 3, oy + 46, 4, 1, 'amber');
  p.rect(x, seat, 7, 1, 'amber');
  p.rect(x, seat + 1, 7, 1, 'ember');
  p.rect(side < 0 ? x + 6 : x, seat + 2, 1, feet - seat - 2, 'ember');
  p.rect(x + 1, feet, 6, 1, 'slate');
}

/**
 * The small round table: a pale oval top lit by the lamp, a dark rim, one
 * pedestal and a round foot. `top` is the tabletop; nothing stands on it, so
 * pictures read clearly.
 */
function paintRoundTable(p: Painter, x: number, top: number, w: number, oy: number): void {
  const cx = x + Math.floor(w / 2);
  const foot = oy + 61;
  // the shadow on the floor
  p.rect(cx - 10, foot + 1, 21, 1, 'slate');
  // the pedestal and its foot
  p.rect(cx - 1, top + 4, 3, foot - top - 5, 'ember');
  px(p, cx - 1, top + 4, 'amber');
  p.rect(cx - 6, foot - 1, 13, 1, 'ember');
  p.rect(cx - 7, foot, 15, 1, 'plum');
  // the top: a flattened oval seen from a little above
  p.rect(x + 2, top, w - 4, 1, 'paper');
  p.rect(x, top + 1, w, 2, 'paper');
  ditherRect(p, x + 2, top + 1, w - 4, 2, 'fog', 4);
  p.rect(x + 1, top + 3, w - 2, 1, 'concrete');
  p.rect(x + 3, top + 4, w - 6, 1, 'stone');
}

// ===========================================================================
// Ms. Reed's desk area

function paintHrDesk(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const winTop = windowTop(oy);
  const winH = oy + WINDOW.y + WINDOW.h - winTop;
  const { left, right } = bays(w, ox, ox + CORE_W);

  paintWalls(p, w, ox, oy);
  glowEllipse(p, ox + 55, oy + 22, 36, 24, 'paper', [0.22, 0.14, 0.07]);
  paintCarpet(p, w, ox, floorTop, h);

  paintTownWindow(p, ox + 4, winTop, winH, ox);
  paintLeafletBoard(p, ox + 38, oy + 10);
  if (oy >= 20) paintClock(p, ox + 86, oy - 10);
  if (oy >= 28) paintCertificate(p, ox + 40, oy - 18);
  paintBinderShelf(p, ox + 74, oy + 22, 34);
  paintOfficeChair(p, ox + 79, oy);
  paintFilingCabinet(p, ox + 96, oy, true);
  paintPlant(p, ox + 113, oy + 34);

  for (const [i, x] of left.entries()) {
    if (i % 2 === 0) {
      paintTownWindow(p, x + 8, winTop, winH, ox);
      paintPlant(p, x + 30, oy + 34);
    } else paintOtherDesk(p, x + 6, oy, i);
  }
  for (const [i, x] of right.entries()) {
    if (i % 2 === 0) {
      paintFilingCabinet(p, x + 4, oy, false);
      paintFilingCabinet(p, x + 20, oy, false);
      paintBinderShelf(p, x + 4, oy + 22, 32);
    } else {
      paintTownWindow(p, x + 8, winTop, winH, ox);
      paintOtherDesk(p, x + 6, oy, i);
    }
  }

  paintDesk(p, ox + TABLE.x, oy + TABLE.top, TABLE.w, oy);
  paintLamp(p, ox + 55, oy);
  glowEllipse(p, ox + 55, oy + 9, 9, 5, 'honey', [0.25, 0.12]);
}

/** Office carpet: dark blue with a small dotted pattern, counted from the core. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'night');
  for (let y = floorTop + 2, row = 0; y < h; y += 3, row++) {
    for (let x = mod(ox + row * 3, 6); x < w; x += 6) px(p, x, y, 'stone');
  }
  glowEllipse(p, ox + 55, floorTop + 6, 28, 4, 'fog', [0.16, 0.08]);
}

/** A board of benefits leaflets in clear pockets: heart, cross, tooth, dollar, eye, leaf. */
function paintLeafletBoard(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 20;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'stone');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'fog');
  const colours: readonly PaletteName[] = ['rosy', 'sky', 'paper', 'honey', 'cyan', 'leaf'];
  for (let i = 0; i < 6; i++) {
    const lx = x + 2 + (i % 3) * 8;
    const ly = y + 2 + Math.floor(i / 3) * 9;
    p.rect(lx, ly, 6, 8, colours[i] ?? 'paper');
    p.rect(lx, ly + 5, 6, 3, 'paper');
    p.rect(lx, ly + 5, 6, 1, 'concrete');
    const cx = lx + 2;
    const cy = ly + 1;
    if (i === 0) {
      px(p, cx, cy, 'red');
      px(p, cx + 2, cy, 'red');
      p.rect(cx, cy + 1, 3, 1, 'red');
      px(p, cx + 1, cy + 2, 'red');
    } else if (i === 1) {
      p.rect(cx + 1, cy, 1, 3, 'red');
      p.rect(cx, cy + 1, 3, 1, 'red');
    } else if (i === 2) {
      p.rect(cx, cy, 3, 2, 'fog');
      px(p, cx, cy + 2, 'fog');
      px(p, cx + 2, cy + 2, 'fog');
    } else if (i === 3) {
      p.rect(cx + 1, cy, 1, 3, 'moss');
      px(p, cx, cy + 1, 'moss');
      px(p, cx + 2, cy + 1, 'moss');
    } else if (i === 4) {
      p.rect(cx, cy + 1, 3, 1, 'deep');
      px(p, cx + 1, cy, 'deep');
      px(p, cx + 1, cy + 2, 'deep');
    } else {
      p.rect(cx, cy + 1, 3, 1, 'paper');
      px(p, cx + 1, cy, 'paper');
    }
  }
  // the pockets' clear fronts
  p.rect(x + 1, y + 7, w - 2, 1, 'paper');
  p.rect(x + 1, y + 16, w - 2, 1, 'paper');
}

/** A framed certificate on the wall. */
function paintCertificate(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 13, 18, 1, 'concrete');
  p.rect(x, y, 18, 13, 'amber');
  p.rect(x + 1, y + 1, 16, 11, 'paper');
  p.rect(x + 4, y + 3, 10, 1, 'stone');
  p.rect(x + 3, y + 5, 12, 1, 'fog');
  p.rect(x + 3, y + 7, 12, 1, 'fog');
  p.rect(x + 12, y + 8, 3, 3, 'red');
  px(p, x + 13, y + 9, 'honey');
}

/** A wall shelf of coloured binders, `w` wide, its board at `y`. */
function paintBinderShelf(p: Painter, x: number, y: number, w: number): void {
  const colours: readonly PaletteName[] = ['red', 'denim', 'leaf', 'lamp', 'teal', 'violet'];
  for (let bx = x + 1, i = 0; bx < x + w - 3; bx += 4, i++) {
    if (hash2(bx, i, 17) < 0.15) continue;
    const bh = 9 + Math.floor(hash2(bx, i, 19) * 2);
    const c = colours[mod(Math.floor(hash2(bx, i, 23) * 6), 6)] ?? 'red';
    p.rect(bx, y - bh, 3, bh, c);
    p.rect(bx, y - bh + 3, 3, 2, 'paper');
    px(p, bx + 2, y - bh, 'ink');
  }
  p.rect(x, y, w, 2, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  p.rect(x + 1, y + 2, w - 2, 1, 'concrete');
}

/** Ms. Reed's swivel chair, pushed back from the desk. */
function paintOfficeChair(p: Painter, x: number, oy: number): void {
  p.rect(x + 2, oy + 37, 8, 12, 'night');
  p.rect(x + 2, oy + 37, 8, 1, 'stone');
  p.rect(x + 3, oy + 38, 6, 10, 'slate');
  p.rect(x + 5, oy + 49, 2, 2, 'ink');
  p.rect(x, oy + 51, 12, 2, 'night');
  p.rect(x, oy + 51, 12, 1, 'stone');
  p.rect(x + 5, oy + 53, 2, 5, 'ink');
  p.rect(x, oy + 58, 12, 1, 'ink');
  px(p, x, oy + 59, 'ink');
  px(p, x + 11, oy + 59, 'ink');
  px(p, x + 6, oy + 59, 'ink');
}

/**
 * A grey filing cabinet with three drawers. Ms. Reed's (`hers`) has a tray of
 * folders and one of the company's Lantern lamps, lit, on top.
 */
function paintFilingCabinet(p: Painter, x: number, oy: number, hers: boolean): void {
  const top = oy + 33;
  const floor = oy + FLOOR_TOP;
  p.rect(x, top, 15, floor - top, 'concrete');
  p.rect(x, top, 15, 1, 'fog');
  p.rect(x + 14, top, 1, floor - top, 'stone');
  for (let i = 0; i < 3; i++) {
    const dy = top + 2 + i * 7;
    p.rect(x + 1, dy + 5, 13, 1, 'stone');
    p.rect(x + 5, dy + 1, 5, 2, 'paper');
    p.rect(x + 6, dy + 3, 3, 1, 'fog');
  }
  p.rect(x, floor - 1, 15, 1, 'slate');
  if (!hers) return;
  // a tray of folders
  p.rect(x + 1, top - 4, 7, 4, 'stone');
  p.rect(x + 1, top - 5, 7, 1, 'lamp');
  p.rect(x + 1, top - 6, 7, 1, 'sky');
  p.rect(x + 2, top - 7, 6, 1, 'rosy');
  // the Lantern lamp: a glowing glass shade on a slim stem
  glowEllipse(p, x + 11, top - 9, 9, 7, 'honey', [0.3, 0.16, 0.08]);
  p.rect(x + 9, top - 1, 5, 1, 'teal');
  p.rect(x + 11, top - 6, 1, 5, 'cyan');
  p.rect(x + 9, top - 10, 5, 4, 'honey');
  p.rect(x + 10, top - 11, 3, 1, 'lamp');
  p.rect(x + 10, top - 9, 2, 1, 'paper');
  p.rect(x + 9, top - 6, 5, 1, 'lamp');
}

/** Ms. Reed's desk: a wooden top, a drawer pedestal at the far end, a few things at the ends. */
function paintDesk(p: Painter, x: number, top: number, w: number, oy: number): void {
  const floor = oy + 61;
  p.rect(x + 1, floor + 1, w, 1, 'night');
  // the front panel and the drawers
  p.rect(x + 1, top + 3, w - 2, floor - top - 3, 'ember');
  p.rect(x + 1, top + 3, w - 2, 1, 'plum');
  for (let i = 0; i < 3; i++) {
    const dy = top + 5 + i * 4;
    p.rect(x + w - 12, dy, 10, 3, 'amber');
    p.rect(x + w - 8, dy + 1, 2, 1, 'honey');
  }
  p.rect(x + 3, top + 6, 1, floor - top - 6, 'plum');
  // the top
  p.rect(x, top, w, 2, 'amber');
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 2, w, 1, 'plum');
  // fanned leaflets at the near end, a pen cup at the far end
  p.rect(x + 1, top - 1, 4, 1, 'rosy');
  p.rect(x + 2, top - 2, 3, 1, 'sky');
  p.rect(x + w - 3, top - 4, 2, 4, 'stone');
  px(p, x + w - 3, top - 5, 'red');
  px(p, x + w - 2, top - 6, 'denim');
}

/** A colleague's empty desk further along: a lit lamp and a screen. */
function paintOtherDesk(p: Painter, x: number, oy: number, n: number): void {
  const top = oy + 46;
  const floor = oy + 61;
  glowEllipse(p, x + 26, top - 6, 8, 6, 'honey', [0.25, 0.12]);
  p.rect(x, top, 32, 2, 'amber');
  p.rect(x, top, 32, 1, 'honey');
  p.rect(x + 1, top + 2, 30, floor - top - 2, 'ember');
  p.rect(x + 2, top + 4, 1, floor - top - 4, 'plum');
  // a screen
  p.rect(x + 6, top - 10, 12, 8, 'ink');
  p.rect(x + 7, top - 9, 10, 6, n % 2 === 0 ? 'indigo' : 'deep');
  p.rect(x + 11, top - 2, 2, 2, 'stone');
  // a lamp left on
  p.rect(x + 24, top - 1, 5, 1, 'teal');
  p.rect(x + 26, top - 5, 1, 4, 'cyan');
  p.rect(x + 24, top - 8, 5, 3, 'honey');
  p.rect(x + 25, top - 9, 3, 1, 'lamp');
}

export const WELLNESS_STAGE: StageConfig = {
  paint: paintBreakRoom,
  // Ms. Reed's scenes (t2, t5) are at her desk.
  backdrops: { hr: paintHrDesk },
  cast: {
    guide: GUIDE_ACTOR,
    coworker: { sprite: COWORKER_SPRITE, ...BASE, side: 'right' },
    // Alone each stands where Dan stands; together Ms. Carter is nearer the
    // table and Ms. Reed further along.
    hr: { sprite: HR_SPRITE, ...BASE, side: 'right', beside: REED_BESIDE },
    manager: { sprite: MANAGER_SPRITE, ...BASE, side: 'right', beside: CARTER_BESIDE },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 66, y: 6 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 24 } },
  rest: {
    left: { x: TABLE.x + 2, y: PROP_TOP },
    right: { x: TABLE.x + 12, y: PROP_TOP },
  },
};
