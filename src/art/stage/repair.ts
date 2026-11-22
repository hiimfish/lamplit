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
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant, paintWindow } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { LANDLORD_SPRITE } from './moveIn';

/**
 * The repair stage has two rooms, built on the same floor line and the same
 * resting surface so the cast, bubbles and props fit both:
 *
 * - The kitchen of your flat (landlord scenes, a late September evening): a
 *   stove under its hood, the sink under the window with the cabinet below it
 *   open and dark, water dripping from the pipe into a puddle on the floor,
 *   blue-grey cupboards, a wall lamp, the fridge, and Mr. Bell's red toolbox.
 * - A small car repair shop (mechanic scenes, the default): a used car up on
 *   a yellow two-post lift, a red tool chest with a wooden top under it, the
 *   tool wall and an oil drum on the left, a stack of tires, and the open bay
 *   door on the right with the dusk outside and its light across the floor.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom; more wall
 * above (shelves and a clock in the kitchen, high windows and a sign in the
 * shop) and more room to both sides. Palette colours only, whole pixels;
 * partial alpha only for light.
 */

const FLOOR_TOP = 56;
/** The kitchen counter / the top of the tool chest: left edge, width and top, in core pixels. */
const SURFACE = { x: 38, w: 46, top: 40 } as const;
/** 24x24 pictures stand on the surface with their shadow on it. */
const PROP_TOP = SURFACE.top - 20;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the upper wall (kitchen paper, shop roof), and how far up it starts. */
const CORNICE_MIN = 60;
const CORNICE_UP = 46;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Bays left of the core (going left) and right of `start` (going right). */
function bays(w: number, ox: number, start: number): { left: number[]; right: number[] } {
  const left: number[] = [];
  const right: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) left.push(x);
  for (let x = start; x < w; x += BAY_W) right.push(x);
  return { left, right };
}

// ===========================================================================
// The kitchen

/** Where the kitchen's pieces stand, in core pixels. */
const K = {
  stove: 2,
  counterL: 18,
  counterR: 102,
  window: 38,
  /** The cabinet under the sink: left edge and width. */
  cab: 41,
  cabW: 22,
  uppers: 70,
  fridge: 103,
  lamp: 30,
  /** The tiled splashback between the window sill and the counter top. */
  tileTop: 32,
} as const;

function paintKitchen(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const top = oy + SURFACE.top;
  const { left, right } = bays(w, ox, ox + CORE_W);

  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;

  p.rect(0, 0, w, floorTop, 'fog');
  if (cornice > 0) paintWallpaper(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 3, 'concrete', 8);
  paintTiles(p, ox, ox + K.stove - 2, ox + K.counterR, oy + K.tileTop, top);
  glowEllipse(p, ox + K.lamp + 1, oy + 18, 30, 20, 'honey', [0.14, 0.09, 0.05]);

  // Up the wall, when there is room above the core.
  if (oy >= 14) paintJarShelf(p, ox + K.window - 2, oy - 3);
  if (oy >= 36) paintClock(p, ox + 86, oy - 14);

  // Beside the core: the door to the hall, then windows with plants; a
  // dining table under the window right of the fridge.
  left.forEach((x, i) => {
    if (i === 0) paintHallDoor(p, x + 14, oy + 6, floorTop);
    else {
      paintWindow(p, x + 8, oy + 8);
      if (i % 2 === 1) paintPlant(p, x + 17, floorTop - 20);
    }
  });
  right.forEach((x, i) => {
    paintWindow(p, x + 9, oy + 8);
    if (i % 2 === 0) paintDiningTable(p, x + 6, floorTop);
    else paintPlant(p, x + 18, floorTop - 20);
  });

  paintWoodFloor(p, w, ox, floorTop, h);

  paintWindow(p, ox + K.window, oy + 6);
  paintHood(p, ox + K.stove, oy, cornice);
  paintUpperCupboards(p, ox + K.uppers, oy + 4);
  paintSconce(p, ox + K.lamp, oy + 14);
  paintStove(p, ox + K.stove, top, floorTop);
  paintCounter(p, ox + K.counterL, ox + K.counterR, top, floorTop);
  paintSink(p, ox + K.cab, top);
  paintOpenCabinet(p, ox + K.cab, top, floorTop);
  paintFridge(p, ox + K.fridge, oy + 12, floorTop);
  paintPuddle(p, ox + K.cab, floorTop);
  paintToolbox(p, ox + 66, floorTop);
}

/** Pale wall tiles with grey grout, from x0 to x1 between y0 and y1. */
function paintTiles(p: Painter, ox: number, x0: number, x1: number, y0: number, y1: number): void {
  p.rect(x0, y0, x1 - x0, y1 - y0, 'paper');
  for (let y = y1 - 5; y >= y0; y -= 5) p.rect(x0, y, x1 - x0, 1, 'fog');
  for (let x = x0 + mod(ox + 2 - x0, 5); x < x1; x += 5) p.rect(x, y0, 1, y1 - y0, 'fog');
  p.rect(x0, y0, x1 - x0, 1, 'concrete');
}

/** Warm floorboards, like the hall of the flat. */
function paintWoodFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'amber');
  p.rect(0, floorTop, w, 1, 'ember');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'ember');
    for (let x = mod(ox + row * 13, 22) - 22; x < w; x += 22) px(p, x, y - 1, 'ember');
  }
}

/** On a tall stage: patterned paper above a white picture rail at `cornice`. */
function paintWallpaper(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'concrete');
  // small diamonds, counted up from the rail so they never shift with the stage size
  for (let row = 0; cornice - 6 - row * 8 >= 2; row++) {
    const y = cornice - 6 - row * 8;
    for (let x = mod(ox + (row % 2) * 8, 16) - 16; x < w; x += 16) {
      px(p, x, y - 1, 'fog');
      p.rect(x - 1, y, 3, 1, 'fog');
      px(p, x, y + 1, 'fog');
    }
  }
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'stone');
  ditherRect(p, 0, cornice + 2, w, 2, 'concrete', 6);
}

/** The extractor hood over the stove, its duct running up into the ceiling or the rail. */
function paintHood(p: Painter, x: number, oy: number, cornice: number): void {
  p.rect(x + 5, cornice, 7, oy + 12 - cornice, 'concrete');
  p.rect(x + 10, cornice, 2, oy + 12 - cornice, 'stone');
  p.rect(x + 3, oy + 12, 11, 2, 'concrete');
  p.rect(x + 1, oy + 14, 15, 2, 'concrete');
  p.rect(x - 1, oy + 16, 19, 3, 'concrete');
  p.rect(x + 14, oy + 14, 2, 2, 'stone');
  p.rect(x - 1, oy + 18, 19, 1, 'stone');
  p.rect(x + 2, oy + 19, 13, 1, 'ink');
  ditherRect(p, x + 1, oy + 20, 15, 3, 'honey', 4);
}

/** A small stove: a red kettle on the burners, an oven door with a towel on its handle. */
function paintStove(p: Painter, x: number, top: number, floorTop: number): void {
  // kettle
  p.rect(x + 5, top - 6, 7, 5, 'red');
  p.rect(x + 6, top - 7, 5, 1, 'red');
  p.rect(x + 10, top - 5, 2, 4, 'maroon');
  p.rect(x + 7, top - 9, 3, 1, 'ink');
  px(p, x + 6, top - 8, 'ink');
  px(p, x + 10, top - 8, 'ink');
  p.rect(x + 2, top - 5, 3, 1, 'red');
  px(p, x + 1, top - 6, 'red');
  px(p, x + 6, top - 5, 'rosy');
  p.rect(x + 4, top - 1, 9, 1, 'ink');
  // body
  p.rect(x, top, 16, floorTop - top, 'paper');
  p.rect(x, top, 16, 2, 'stone');
  p.rect(x + 14, top + 2, 2, floorTop - top - 2, 'fog');
  for (const kx of [3, 7, 11]) px(p, x + kx, top + 3, 'ink');
  p.rect(x + 1, top + 5, 14, 1, 'stone');
  p.rect(x + 2, top + 7, 11, 6, 'ink');
  p.rect(x + 3, top + 8, 9, 4, 'night');
  ditherRect(p, x + 3, top + 10, 9, 2, 'ember', 6);
  // towel over the handle
  p.rect(x + 9, top + 5, 4, 5, 'red');
  p.rect(x + 9, top + 6, 4, 1, 'paper');
  p.rect(x + 9, top + 8, 4, 1, 'paper');
  p.rect(x, floorTop - 2, 16, 2, 'stone');
}

/** The counter from x0 to x1: a wooden top over blue-grey cupboard doors and drawers. */
function paintCounter(p: Painter, x0: number, x1: number, top: number, floorTop: number): void {
  const w = x1 - x0;
  p.rect(x0, top + 3, w, floorTop - top - 3, 'sky');
  for (let x = x0; x < x1; x += 11) {
    const dw = Math.min(11, x1 - x);
    p.rect(x, top + 3, 1, floorTop - top - 5, 'denim');
    p.rect(x + 1, top + 4, dw - 2, 2, 'fog');
    p.rect(x + 1, top + 6, dw - 2, 1, 'denim');
    p.rect(x + 2, top + 8, dw - 4, floorTop - top - 12, 'sky');
    p.rect(x + 2, top + 8, 1, floorTop - top - 12, 'fog');
    p.rect(x + dw - 3, top + 8, 1, floorTop - top - 12, 'denim');
    px(p, x + Math.floor(dw / 2), top + 4, 'paper');
    px(p, x + dw - 4, top + 10, 'paper');
  }
  p.rect(x0, floorTop - 2, w, 2, 'night');
  // the wooden top, a little proud of the doors
  p.rect(x0, top, w, 2, 'amber');
  p.rect(x0, top, w, 1, 'honey');
  p.rect(x0, top + 2, w, 1, 'ember');
  p.rect(x0, top + 3, w, 1, 'denim');
}

/** The sink in the counter under the window: a steel rim and a gooseneck tap. */
function paintSink(p: Painter, cab: number, top: number): void {
  const x = cab + 2;
  p.rect(x, top - 1, 18, 1, 'fog');
  p.rect(x, top, 18, 2, 'concrete');
  p.rect(x + 1, top, 16, 1, 'paper');
  const fx = x + 12;
  p.rect(fx, top - 8, 2, 7, 'concrete');
  px(p, fx, top - 7, 'paper');
  p.rect(fx - 5, top - 9, 7, 2, 'concrete');
  p.rect(fx - 5, top - 9, 6, 1, 'paper');
  p.rect(fx - 5, top - 7, 2, 2, 'stone');
  p.rect(fx + 2, top - 4, 3, 1, 'paper');
  p.rect(fx - 3, top - 4, 3, 1, 'paper');
  p.rect(fx - 1, top - 2, 4, 1, 'stone');
}

/**
 * The cupboard under the sink with both doors open: dark inside, the drain pipe
 * and its trap, a slow drip from the joint, cleaning bottles and a wet floor.
 */
function paintOpenCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const w = K.cabW;
  const y0 = top + 4;
  const y1 = floorTop - 2;
  p.rect(x, y0, w, y1 - y0, 'ink');
  p.rect(x + 1, y0, w - 2, 5, 'night');
  // drain pipe down from the sink, the U trap, then into the wall
  const px0 = x + 12;
  p.rect(px0, y0, 2, 6, 'stone');
  px(p, px0, y0, 'fog');
  p.rect(px0, y0 + 6, 6, 2, 'stone');
  p.rect(px0 + 4, y0 + 3, 2, 3, 'stone');
  p.rect(px0 + 4, y0 + 2, w - 16, 2, 'stone');
  p.rect(px0, y0 + 7, 6, 1, 'slate');
  p.rect(px0 - 1, y0 + 4, 4, 1, 'concrete');
  // the drip from the joint, and water on the cupboard floor
  px(p, px0 + 1, y0 + 9, 'cyan');
  px(p, px0 + 1, y0 + 11, 'sky');
  // cleaning bottles and a sponge
  p.rect(x + 2, y1 - 6, 3, 6, 'leaf');
  p.rect(x + 3, y1 - 8, 1, 2, 'paper');
  p.rect(x + 4, y1 - 5, 1, 5, 'moss');
  p.rect(x + 6, y1 - 4, 3, 4, 'red');
  p.rect(x + 7, y1 - 5, 1, 1, 'paper');
  p.rect(x + 17, y1 - 3, 4, 3, 'honey');
  p.rect(x + 17, y1 - 3, 4, 1, 'leaf');
  p.rect(x + 9, y1 - 1, 9, 1, 'teal');
  px(p, x + 12, y1 - 1, 'cyan');
  // the doors, swung open towards you
  p.rect(x - 4, y0 - 1, 4, y1 - y0 + 2, 'sky');
  p.rect(x - 4, y0 - 1, 1, y1 - y0 + 2, 'denim');
  p.rect(x - 1, y0 - 1, 1, y1 - y0 + 2, 'fog');
  px(p, x - 3, y0 + 6, 'paper');
  p.rect(x + w, y0 - 1, 4, y1 - y0 + 2, 'sky');
  p.rect(x + w + 3, y0 - 1, 1, y1 - y0 + 2, 'denim');
  p.rect(x + w, y0 - 1, 1, y1 - y0 + 2, 'fog');
  px(p, x + w + 2, y0 + 6, 'paper');
}

/** Water running over the cupboard's edge and spreading on the floorboards. */
function paintPuddle(p: Painter, cab: number, floorTop: number): void {
  const cx = cab + 11;
  px(p, cx + 2, floorTop - 2, 'cyan');
  px(p, cx + 2, floorTop - 1, 'sky');
  px(p, cx + 2, floorTop + 1, 'cyan');
  ellipse(p, cx, floorTop + 4, 15, 2, 'teal');
  ellipse(p, cx - 3, floorTop + 4, 9, 1, 'sky');
  p.rect(cx - 16, floorTop + 5, 6, 1, 'teal');
  p.rect(cx + 8, floorTop + 3, 9, 1, 'teal');
  p.rect(cx - 8, floorTop + 4, 4, 1, 'cyan');
  p.rect(cx + 3, floorTop + 3, 3, 1, 'cyan');
  px(p, cx - 1, floorTop + 3, 'paper');
  px(p, cx + 9, floorTop + 4, 'paper');
}

/** Mr. Bell's red toolbox on the floor, lid open, a wrench sticking out. */
function paintToolbox(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 5;
  p.rect(x + 8, top - 6, 2, 6, 'fog');
  p.rect(x + 7, top - 7, 4, 2, 'fog');
  px(p, x + 8, top - 7, 'concrete');
  p.rect(x + 3, top - 3, 1, 3, 'lamp');
  px(p, x + 3, top - 4, 'stone');
  p.rect(x - 1, top - 2, 15, 2, 'maroon');
  p.rect(x, top, 13, 6, 'red');
  p.rect(x, top, 13, 1, 'neon');
  p.rect(x + 11, top + 1, 2, 5, 'maroon');
  p.rect(x + 4, top + 2, 5, 1, 'maroon');
  p.rect(x, floorTop + 1, 13, 1, 'ember');
}

/** Two wall cupboards, blue-grey like the ones below. */
function paintUpperCupboards(p: Painter, x: number, y: number): void {
  const w = 30;
  const h = 20;
  p.rect(x - 1, y - 1, w + 2, 1, 'denim');
  p.rect(x, y, w, h, 'sky');
  for (const dx of [0, 15]) {
    p.rect(x + dx, y, 1, h, 'denim');
    p.rect(x + dx + 2, y + 2, 11, h - 4, 'sky');
    p.rect(x + dx + 2, y + 2, 11, 1, 'fog');
    p.rect(x + dx + 2, y + 2, 1, h - 4, 'fog');
    p.rect(x + dx + 2, y + h - 3, 11, 1, 'denim');
    p.rect(x + dx + 12, y + 2, 1, h - 4, 'denim');
  }
  px(p, x + 13, y + h - 5, 'paper');
  px(p, x + 17, y + h - 5, 'paper');
  p.rect(x + w - 1, y, 1, h, 'denim');
  p.rect(x, y + h, w, 1, 'denim');
  // a shadow on the tiles below
  ditherRect(p, x, y + h + 1, w, 2, 'concrete', 6);
}

/** A wall lamp: a brass arm and a warm glass shade, lit. */
function paintSconce(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 1, y + 2, 9, 8, 'honey', [0.32, 0.18, 0.08]);
  p.rect(x, y + 2, 3, 6, 'ember');
  p.rect(x + 1, y + 1, 1, 2, 'amber');
  p.rect(x - 1, y - 2, 5, 1, 'lamp');
  p.rect(x - 2, y - 1, 7, 2, 'honey');
  p.rect(x - 2, y + 1, 7, 1, 'lamp');
  px(p, x, y - 1, 'paper');
}

/** The fridge: paper-white doors with handles, magnets and a note. */
function paintFridge(p: Painter, x: number, y: number, floorTop: number): void {
  const w = 21;
  p.rect(x + 3, y - 4, 12, 4, 'tan');
  p.rect(x + 3, y - 4, 12, 1, 'skin');
  p.rect(x + 13, y - 3, 2, 3, 'ember');
  p.rect(x, y, w, floorTop - y, 'paper');
  p.rect(x + w - 2, y, 2, floorTop - y, 'fog');
  p.rect(x, y, w, 1, 'fog');
  p.rect(x, y + 12, w, 1, 'concrete');
  p.rect(x + 2, y + 3, 1, 7, 'stone');
  p.rect(x + 2, y + 15, 1, 10, 'stone');
  // a note under a magnet, and two more magnets
  p.rect(x + 7, y + 16, 7, 8, 'honey');
  p.rect(x + 8, y + 18, 5, 1, 'amber');
  p.rect(x + 8, y + 20, 4, 1, 'amber');
  px(p, x + 10, y + 16, 'red');
  px(p, x + 15, y + 5, 'leaf');
  px(p, x + 8, y + 6, 'denim');
  p.rect(x, floorTop - 2, w, 2, 'night');
}

/** An open shelf with jars and a small plant, above the window. */
function paintJarShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 2, 'amber');
  p.rect(x, y + 2, 32, 1, 'ember');
  const jars: readonly (readonly [number, number, PaletteName])[] = [
    [2, 6, 'honey'],
    [7, 5, 'ember'],
    [12, 7, 'paper'],
    [17, 5, 'red'],
  ];
  for (const [dx, jh, fill] of jars) {
    p.rect(x + dx, y - jh, 4, jh, 'fog');
    p.rect(x + dx, y - jh + 2, 4, jh - 2, fill);
    p.rect(x + dx, y - jh, 4, 1, 'stone');
    px(p, x + dx, y - jh + 2, 'paper');
  }
  p.rect(x + 24, y - 4, 5, 4, 'amber');
  p.rect(x + 23, y - 8, 7, 3, 'leaf');
  p.rect(x + 25, y - 9, 3, 1, 'leaf');
  p.rect(x + 23, y - 5, 7, 1, 'moss');
}

/** The open door to the hall: a wooden frame, the dim hall and its light beyond. */
function paintHallDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 20;
  p.rect(x - 2, top - 2, w + 4, floorTop - top + 2, 'ember');
  p.rect(x - 2, top - 2, w + 4, 1, 'amber');
  p.rect(x, top, w, floorTop - top, 'slate');
  ditherRect(p, x, top, w, 8, 'night', 8);
  // the far end of the hall, lit by its own lamp
  p.rect(x + 5, top + 10, 10, floorTop - top - 14, 'stone');
  p.rect(x + 5, top + 10, 10, 1, 'concrete');
  p.rect(x + 8, top + 7, 4, 2, 'honey');
  glowEllipse(p, x + 10, top + 9, 7, 5, 'honey', [0.18, 0.08]);
  p.rect(x, floorTop - 4, w, 4, 'ember');
  p.rect(x, floorTop - 4, w, 1, 'amber');
}

/** A little dining table with two chairs under a window. */
function paintDiningTable(p: Painter, x: number, floorTop: number): void {
  const chair = (cx: number, back: number): void => {
    p.rect(cx + back, floorTop - 18, 2, 18, 'ember');
    p.rect(cx, floorTop - 9, 8, 2, 'amber');
    p.rect(cx + 7 - back, floorTop - 7, 1, 7, 'ember');
  };
  chair(x, 0);
  chair(x + 24, 6);
  p.rect(x + 6, floorTop - 13, 20, 2, 'amber');
  p.rect(x + 6, floorTop - 13, 20, 1, 'honey');
  p.rect(x + 15, floorTop - 11, 2, 11, 'ember');
  p.rect(x + 11, floorTop - 1, 10, 1, 'ember');
  // a mug and a bowl of fruit
  p.rect(x + 9, floorTop - 16, 3, 3, 'paper');
  p.rect(x + 18, floorTop - 15, 6, 2, 'fog');
  px(p, x + 19, floorTop - 16, 'red');
  px(p, x + 21, floorTop - 16, 'lamp');
  px(p, x + 22, floorTop - 16, 'leaf');
}

// ===========================================================================
// The car repair shop

/** Where the shop's pieces stand, in core pixels. */
const S = {
  /** The lift posts' left edges. */
  postL: 31,
  postR: 108,
  /** The car on the lift: rear and front, and the y under its wheels. */
  carL: 36,
  carR: 106,
  carBottom: 34,
  /** The open bay door: left edge of its opening and its width. */
  door: 115,
  doorW: 42,
  doorTop: 7,
  tires: 96,
  lampX: 70,
} as const;

function paintShop(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const top = oy + SURFACE.top;
  const doorX = ox + S.door;
  const doorEnd = doorX + S.doorW;
  const { left, right } = bays(w, ox, doorEnd + 4);

  paintBlockWall(p, w, ox, floorTop);
  if (oy >= CORNICE_MIN) paintRoof(p, w, ox, oy - CORNICE_UP);
  else ditherRect(p, 0, 0, w, 3, 'night', 8);

  // Up the wall: high windows, and a sign over the tool wall.
  if (oy >= 18) paintHighWindows(p, w, ox, oy - 15);
  if (oy >= 40) paintSign(p, ox + 46, oy - 32);

  left.forEach((x, i) => {
    if (i % 2 === 0) paintPartsShelf(p, x + 6, oy + 6, floorTop, i);
    else {
      paintToolWall(p, x + 6, oy + 9);
      paintTireStack(p, x + 14, floorTop, 4);
    }
  });
  right.forEach((x, i) => {
    if (i % 2 === 1) paintPartsShelf(p, x + 4, oy + 6, floorTop, i + 7);
    else {
      paintToolWall(p, x + 4, oy + 9);
      paintTireStack(p, x + 10, floorTop, 3);
    }
  });

  paintConcreteFloor(p, w, ox, floorTop, h);
  paintBayDoor(p, doorX, oy + S.doorTop, floorTop, S.doorW);
  paintDoorLight(p, w, h, doorX, floorTop);

  // Lamps over the car and along the shop.
  for (let x = ox + S.lampX - Math.ceil((ox + S.lampX + 8) / 52) * 52; x < w + 8; x += 52) {
    if (x < doorX - 6 || x > doorEnd + 6) paintShopLamp(p, x, oy);
  }

  // the lamp over the car lights the wall behind it
  glowEllipse(p, ox + S.lampX, oy + 14, 44, 18, 'honey', [0.12, 0.08, 0.04]);
  paintToolWall(p, ox + 2, oy + 9);
  paintOilDrum(p, ox + 3, floorTop);
  paintLift(p, ox, oy, floorTop);
  paintCar(p, ox, oy);
  paintToolChest(p, ox + SURFACE.x, top, floorTop);
  paintTireStack(p, ox + S.tires, floorTop, 4);
}

/** Painted cinder blocks with dark mortar, a darker band low down. */
function paintBlockWall(p: Painter, w: number, ox: number, floorTop: number): void {
  p.rect(0, 0, w, floorTop, 'stone');
  for (let row = 0; floorTop - 1 - row * 5 >= 0; row++) {
    const y = floorTop - 1 - row * 5;
    p.rect(0, y, w, 1, 'slate');
    for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) p.rect(x, y - 4, 1, 4, 'slate');
  }
  p.rect(0, floorTop - 11, w, 11, 'slate');
  p.rect(0, floorTop - 11, w, 1, 'lamp');
  p.rect(0, floorTop - 10, w, 1, 'night');
}

/** Bare concrete with joints and a few oil stains. */
function paintConcreteFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  p.rect(0, floorTop, w, 1, 'night');
  p.rect(0, floorTop + 1, w, 1, 'stone');
  for (let x = mod(ox + 9, 32) - 32; x < w; x += 32) {
    p.rect(x, floorTop + 2, 1, h - floorTop - 2, 'stone');
  }
  if (floorTop + 9 < h) p.rect(0, floorTop + 9, w, 1, 'stone');
  for (let i = 0; i < Math.ceil(w / 40) + 1; i++) {
    const sx = mod(ox, 40) - 40 + i * 40 + Math.floor(hash2(i - Math.floor(ox / 40), 3, 51) * 30);
    const sy = floorTop + 3 + Math.floor(hash2(i - Math.floor(ox / 40), 5, 53) * 5);
    ellipse(p, sx, sy, 3, 0, 'stone');
    px(p, sx + 1, sy, 'slate');
  }
}

/** The open roll-up door: the shutter rolled up, the street outside at dusk. */
function paintBayDoor(p: Painter, x: number, top: number, floorTop: number, w: number): void {
  const inside = top + 4;
  ditherGradient(p, x, inside, w, floorTop - inside - 6, [
    'indigo',
    'violet',
    'mauve',
    'rosy',
    'honey',
  ]);
  // the houses across the street
  const roofs: readonly (readonly [number, number, number])[] = [
    [0, 12, 14],
    [11, 9, 18],
    [27, 15, 11],
  ];
  for (const [dx, rw, rh] of roofs) {
    const by = floorTop - 6 - rh;
    p.rect(x + dx, by, rw, rh, 'plum');
    p.rect(x + dx, by, rw, 1, 'night');
    for (let wx = 2; wx + 2 <= rw - 1; wx += 4) {
      if (hash2(dx, wx, 61) > 0.4) p.rect(x + dx + wx, by + 4, 2, 2, 'honey');
    }
  }
  // a street lamp
  p.rect(x + 9, floorTop - 26, 1, 20, 'ink');
  p.rect(x + 9, floorTop - 27, 4, 1, 'ink');
  p.rect(x + 12, floorTop - 26, 2, 1, 'lamp');
  glowEllipse(p, x + 12, floorTop - 24, 4, 3, 'honey', [0.4, 0.2]);
  // the driveway
  p.rect(x, floorTop - 6, w, 6, 'slate');
  p.rect(x, floorTop - 6, w, 1, 'stone');
  p.rect(x + 4, floorTop - 3, 8, 1, 'stone');
  p.rect(x + 22, floorTop - 3, 8, 1, 'stone');
  // the frame and the rolled-up shutter
  p.rect(x - 2, top - 1, 2, floorTop - top + 1, 'night');
  p.rect(x + w, top - 1, 2, floorTop - top + 1, 'night');
  p.rect(x - 2, top, w + 4, 5, 'concrete');
  for (let i = 0; i < 4; i++) p.rect(x - 2, top + i + 1, w + 4, 1, i % 2 === 0 ? 'fog' : 'stone');
  p.rect(x - 2, top + 5, w + 4, 1, 'ink');
  p.rect(x + Math.floor(w / 2) - 2, top + 6, 4, 1, 'ink');
}

/** Low evening light from the open door, lying across the floor towards the car. */
function paintDoorLight(p: Painter, w: number, h: number, doorX: number, floorTop: number): void {
  for (let y = floorTop + 1; y < h; y++) {
    const d = y - floorTop;
    const x0 = doorX - 50 - d * 3;
    const x1 = doorX + 10 + d;
    p.rect(Math.max(0, x0), y, Math.min(w, x1) - Math.max(0, x0), 1, 'honey', 0.14);
    p.rect(Math.max(0, x0 + 30), y, Math.min(w, x1) - Math.max(0, x0 + 30), 1, 'rosy', 0.12);
  }
  // and a little on the wall beside the frame
  p.rect(doorX - 12, floorTop - 30, 10, 30, 'rosy', 0.1);
}

/** An enamel shop lamp on a long cord. */
function paintShopLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 1, 'ink');
  p.rect(cx - 2, oy + 1, 5, 1, 'stone');
  p.rect(cx - 4, oy + 2, 9, 1, 'concrete');
  p.rect(cx - 5, oy + 3, 11, 1, 'stone');
  p.rect(cx - 2, oy + 4, 5, 1, 'honey');
  px(p, cx - 3, oy + 2, 'fog');
}

/** The tool wall: a pegboard with wrenches, a hammer, screwdrivers and pliers. */
function paintToolWall(p: Painter, x: number, y: number): void {
  const w = 27;
  const h = 24;
  p.rect(x - 1, y - 1, w + 2, h + 2, 'ember');
  p.rect(x, y, w, h, 'tan');
  for (let yy = y + 1; yy < y + h; yy += 3) {
    for (let xx = x + 1; xx < x + w; xx += 3) px(p, xx, yy, 'amber');
  }
  // wrenches, short to long
  for (let i = 0; i < 4; i++) {
    const wx = x + 2 + i * 3;
    const len = 6 + i * 2;
    p.rect(wx, y + 3, 1, len, 'fog');
    p.rect(wx - 1, y + 2, 3, 2, 'fog');
    px(p, wx, y + 2, 'tan');
    px(p, wx, y + 3 + len, 'concrete');
  }
  // a hammer
  p.rect(x + 15, y + 3, 6, 2, 'stone');
  p.rect(x + 17, y + 5, 2, 9, 'amber');
  p.rect(x + 18, y + 5, 1, 9, 'ember');
  // screwdrivers
  for (const [dx, c] of [
    [23, 'red'],
    [25, 'teal'],
  ] as const) {
    p.rect(x + dx, y + 3, 1, 4, c);
    p.rect(x + dx, y + 7, 1, 5, 'fog');
  }
  // pliers and a coil of wire low down
  p.rect(x + 3, y + 17, 1, 5, 'red');
  p.rect(x + 5, y + 17, 1, 5, 'red');
  p.rect(x + 4, y + 15, 1, 2, 'stone');
  ellipse(p, x + 13, y + 19, 4, 2, 'ink');
  ellipse(p, x + 13, y + 19, 2, 1, 'tan');
  p.rect(x + 19, y + 16, 6, 6, 'honey');
  p.rect(x + 19, y + 16, 6, 1, 'lamp');
  p.rect(x + 21, y + 18, 2, 2, 'red');
}

/** A blue oil drum. */
function paintOilDrum(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 15;
  p.rect(x, top, 12, 15, 'denim');
  p.rect(x + 9, top, 3, 15, 'indigo');
  p.rect(x + 1, top + 1, 2, 13, 'sky');
  p.rect(x, top, 12, 1, 'sky');
  p.rect(x, top + 5, 12, 1, 'indigo');
  p.rect(x, top + 10, 12, 1, 'indigo');
  p.rect(x + 4, top + 6, 4, 3, 'honey');
  px(p, x + 2, top - 1, 'stone');
  p.rect(x, floorTop, 12, 1, 'slate');
}

/** Tires stacked on their sides, `n` high, from `foot` up. */
function paintTireStack(p: Painter, x: number, foot: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const y = foot - 6 * (i + 1);
    const dx = i % 2 === 0 ? 0 : 1;
    p.rect(x + dx + 1, y, 13, 6, 'ink');
    p.rect(x + dx, y + 1, 15, 4, 'ink');
    p.rect(x + dx + 1, y + 1, 13, 1, 'slate');
    p.rect(x + dx + 1, y + 4, 13, 1, 'night');
    for (let t = 2; t < 14; t += 3) px(p, x + dx + t, y + 2, 'night');
    px(p, x + dx + 12, y + 1, 'stone');
  }
}

/** The yellow two-post lift: posts, base plates and the arms under the car. */
function paintLift(p: Painter, ox: number, oy: number, floorTop: number): void {
  const armY = oy + S.carBottom;
  for (const [x, side] of [
    [ox + S.postL, 1],
    [ox + S.postR, -1],
  ] as const) {
    p.rect(x, oy + 4, 4, floorTop - oy - 4, 'lamp');
    p.rect(x + (side > 0 ? 3 : 0), oy + 4, 1, floorTop - oy - 4, 'amber');
    p.rect(x - 1, oy + 3, 6, 2, 'amber');
    p.rect(x + 1, oy + 7, 2, floorTop - oy - 12, 'amber');
    p.rect(x - 2, floorTop - 2, 8, 2, 'stone');
    p.rect(x - 1, armY - 2, 6, 4, 'amber');
    // the arm reaching in under the car
    const ax = side > 0 ? x + 4 : x - 12;
    p.rect(ax, armY, 12, 2, 'lamp');
    p.rect(ax, armY + 1, 12, 1, 'amber');
    p.rect(side > 0 ? ax + 9 : ax, armY - 1, 3, 1, 'ink');
  }
}

/** The used car up on the lift: faded teal, a rust patch, the wheels hanging. */
function paintCar(p: Painter, ox: number, oy: number): void {
  const x0 = ox + S.carL;
  const x1 = ox + S.carR;
  const by = oy + S.carBottom;
  const wheels = [x0 + 13, x1 - 13];
  // underside and exhaust
  p.rect(x0 + 4, by - 6, x1 - x0 - 8, 3, 'night');
  p.rect(x0 + 2, by - 4, 10, 1, 'stone');
  // body
  p.rect(x0 + 1, by - 15, x1 - x0 - 2, 10, 'teal');
  p.rect(x0, by - 13, x1 - x0, 7, 'teal');
  p.rect(x0 + 1, by - 15, x1 - x0 - 2, 1, 'cyan');
  p.rect(x0, by - 8, x1 - x0, 2, 'moss');
  p.rect(x0 + 2, by - 11, x1 - x0 - 4, 1, 'moss');
  // cabin with a sloping windscreen and rear window
  const cabL = x0 + 15;
  const cabR = x1 - 18;
  for (let r = 0; r < 8; r++) {
    const y = by - 16 - r;
    const inset = Math.floor(r * 0.9);
    p.rect(cabL + inset, y, cabR - cabL - inset * 2 + r, 1, 'teal');
  }
  for (let r = 1; r < 7; r++) {
    const y = by - 16 - r;
    const inset = Math.floor(r * 0.9) + 2;
    const len = cabR - cabL - inset * 2 + r;
    p.rect(cabL + inset, y, len, 1, 'night');
  }
  const pillar = cabL + Math.floor((cabR - cabL) / 2);
  p.rect(pillar, by - 22, 2, 7, 'teal');
  p.rect(cabL + 6, by - 21, 3, 1, 'sky');
  p.rect(cabL + 5, by - 20, 2, 1, 'sky');
  p.rect(pillar + 6, by - 21, 3, 1, 'sky');
  p.rect(cabL + 7, by - 24, cabR - cabL - 8, 1, 'cyan');
  // doors, handles, lights, bumpers
  p.rect(pillar, by - 14, 1, 7, 'moss');
  p.rect(cabL + 1, by - 14, 1, 7, 'moss');
  p.rect(cabR + 5, by - 14, 1, 7, 'moss');
  p.rect(pillar - 6, by - 12, 3, 1, 'fog');
  p.rect(pillar + 4, by - 12, 3, 1, 'fog');
  p.rect(x1 - 2, by - 13, 2, 2, 'honey');
  p.rect(x0, by - 13, 2, 2, 'red');
  p.rect(x0 - 1, by - 9, 4, 3, 'fog');
  p.rect(x1 - 3, by - 9, 4, 3, 'fog');
  p.rect(x0 - 1, by - 7, 4, 1, 'concrete');
  p.rect(x1 - 3, by - 7, 4, 1, 'concrete');
  // a used car: rust by the rear wheel, a dent in the front door
  p.rect(x0 + 5, by - 9, 3, 1, 'ember');
  px(p, x0 + 6, by - 10, 'ember');
  px(p, x0 + 8, by - 9, 'amber');
  px(p, pillar + 9, by - 10, 'moss');
  p.rect(pillar + 8, by - 9, 3, 1, 'moss');
  // wheel arches and wheels
  for (const wx of wheels) {
    ellipse(p, wx, by - 5, 6, 5, 'night');
    ellipse(p, wx, by - 4, 5, 4, 'ink');
    p.rect(wx - 2, by - 6, 5, 5, 'stone');
    p.rect(wx - 1, by - 5, 3, 3, 'fog');
    px(p, wx, by - 4, 'stone');
  }
}

/** The red rolling tool chest with a wooden top: drawers, handles and casters. */
function paintToolChest(p: Painter, x: number, top: number, floorTop: number): void {
  const w = SURFACE.w;
  const body = floorTop - 2 - (top + 3);
  p.rect(x, top + 3, w, body, 'red');
  p.rect(x + w - 2, top + 3, 2, body, 'maroon');
  const rows = [3, 3, 4];
  let y = top + 4;
  for (const rh of rows) {
    p.rect(x + 1, y + rh, w - 3, 1, 'maroon');
    p.rect(x + 4, y + 1, 10, 1, 'fog');
    p.rect(x + 26, y + 1, 10, 1, 'fog');
    y += rh + 1;
  }
  p.rect(x + 21, top + 4, 1, y - top - 4, 'maroon');
  p.rect(x, floorTop - 2, w, 1, 'ink');
  for (const cx of [2, w - 5]) {
    p.rect(x + cx, floorTop - 1, 3, 1, 'ink');
    px(p, x + cx + 1, floorTop, 'ink');
  }
  // the top
  p.rect(x - 1, top, w + 2, 2, 'amber');
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 2, w + 2, 1, 'ember');
  // an oil can and a rag at the far end
  p.rect(x + w - 6, top - 5, 4, 5, 'lamp');
  p.rect(x + w - 6, top - 5, 4, 1, 'honey');
  p.rect(x + w - 5, top - 7, 1, 2, 'stone');
  p.rect(x + w - 4, top - 3, 2, 3, 'amber');
}

/** A tall shelf of parts: boxes and oil bottles. */
function paintPartsShelf(p: Painter, x: number, y: number, floorTop: number, seed: number): void {
  const w = 30;
  p.rect(x, y, 2, floorTop - y, 'night');
  p.rect(x + w - 2, y, 2, floorTop - y, 'night');
  const colours: readonly (readonly [PaletteName, PaletteName])[] = [
    ['amber', 'ember'],
    ['tan', 'ember'],
    ['red', 'maroon'],
    ['sky', 'denim'],
    ['honey', 'amber'],
  ];
  for (let s = 0; s < 4; s++) {
    const sy = y + 12 + s * 12;
    if (sy >= floorTop) break;
    let bx = x + 2;
    for (let i = 0; bx + 4 <= x + w - 2; i++) {
      const bw = Math.min(x + w - 2 - bx, 4 + Math.floor(hash2(i, s + seed * 5, 71) * 6));
      const bh = 4 + Math.floor(hash2(i, s + seed * 5, 73) * 6);
      const [c, d] = colours[Math.floor(hash2(i, s + seed * 5, 79) * colours.length)] ?? [
        'amber',
        'ember',
      ];
      p.rect(bx, sy - bh, bw, bh, c);
      p.rect(bx + bw - 1, sy - bh, 1, bh, d);
      if (bw >= 5) px(p, bx + 1, sy - bh + 1, 'paper');
      bx += bw + 1;
    }
    p.rect(x, sy, w, 2, 'slate');
    p.rect(x, sy, w, 1, 'concrete');
  }
}

/** On a tall stage: a steel roof truss at `y`, the dark roof above it. */
function paintRoof(p: Painter, w: number, ox: number, y: number): void {
  p.rect(0, 0, w, y, 'slate');
  for (let x = mod(ox, 4); x < w; x += 4) p.rect(x, 0, 1, y, 'night');
  ditherRect(p, 0, y - 6, w, 6, 'night', 8);
  p.rect(0, y, w, 2, 'night');
  p.rect(0, y + 8, w, 2, 'night');
  for (let x = mod(ox, 12) - 12; x < w; x += 12) {
    for (let i = 0; i < 6; i++) {
      px(p, x + i, y + 2 + i, 'ink');
      px(p, x + 11 - i, y + 2 + i, 'ink');
    }
  }
  p.rect(0, y + 10, w, 1, 'ink');
}

/** A row of high windows above the core, showing the dusk. */
function paintHighWindows(p: Painter, w: number, ox: number, y: number): void {
  for (let x = mod(ox + 6, 24) - 24; x < w; x += 24) {
    p.rect(x - 1, y - 1, 18, 10, 'night');
    ditherGradient(p, x, y, 16, 8, ['violet', 'mauve', 'rosy']);
    p.rect(x + 8, y, 1, 8, 'night');
  }
}

/** A round sign over the shop: a white wrench on red. */
function paintSign(p: Painter, x: number, y: number): void {
  ellipse(p, x + 8, y + 8, 8, 8, 'paper');
  ellipse(p, x + 8, y + 8, 7, 7, 'red');
  for (let i = 0; i < 8; i++) p.rect(x + 4 + i, y + 12 - i, 2, 1, 'paper');
  p.rect(x + 11, y + 3, 3, 1, 'paper');
  p.rect(x + 13, y + 4, 1, 2, 'paper');
  p.rect(x + 3, y + 11, 1, 3, 'paper');
  p.rect(x + 4, y + 13, 2, 1, 'paper');
}

// ---------------------------------------------------------------------------
// The mechanic, Tony: 16x24, facing left. A man in his forties: a red cap,
// brown hair greying at the temple, stubble, a white T-shirt under blue work
// overalls, a red rag hanging from his back pocket, dark work boots.

const MECHANIC_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....ccccc......',
    '....cccccccc....',
    '..bbbcccccccc...',
    '....sssshhhhh...',
    '...ssesssshhh...',
    '....ssssssgh....',
    '....tttsss......',
    '......sss.......',
    '.....wwwwwww....',
    '....wwowwwwoww..',
    '...wwwowwwwowww.',
    '...wwooooooooww.',
    '...ssoonnoooooq.',
    '...ssoooooooooq.',
    '...ssoooooooooq.',
    '..sssoooooooooq.',
    '..sssooooooooorq',
    '....oooooooooorr',
    '....oooooooooqr.',
    '.....ooo..qqq...',
    '.....ooo..qqq...',
    '.....ooo..qqq...',
    '....kkkk..kkkk..',
  ],
  legend: {
    c: 'red',
    b: 'maroon',
    h: 'ember',
    g: 'fog',
    s: 'skin',
    e: 'ink',
    t: 'tan',
    w: 'paper',
    o: 'denim',
    n: 'indigo',
    q: 'indigo',
    r: 'red',
    k: 'ink',
  },
};

export const REPAIR_STAGE: StageConfig = {
  paint: paintShop,
  backdrops: { landlord: paintKitchen },
  cast: {
    guide: GUIDE_ACTOR,
    mechanic: { sprite: MECHANIC_SPRITE, x: 82, y: 39, side: 'right' },
    // Alone he stands where the mechanic stands; with the mechanic there too, by the fridge.
    landlord: {
      sprite: LANDLORD_SPRITE,
      x: 82,
      y: 39,
      side: 'right',
      beside: { x: 96, y: 39 },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 94, y: 24 } },
  rest: {
    left: { x: SURFACE.x, y: PROP_TOP },
    // Stops short of the person on the right, clear of their face and arm.
    right: { x: SURFACE.x + 20, y: PROP_TOP },
  },
};
