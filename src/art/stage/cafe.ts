import { ditherRect, lightPool, px, type Painter } from '../../game/painter';
import {
  clipped,
  coreOrigin,
  CORE_H,
  CORE_W,
  paintClock,
  paintFloor,
  paintLamp,
  paintPicture,
  paintPlant,
  paintWainscot,
  paintWindow,
} from './common';

import type { PixelSprite } from '../../game/sprites';

export { coreOrigin, CORE_H, CORE_W };

/**
 * The café stage: a side view inside the shop at dusk. You stand on the left;
 * the barista stands behind the counter on the right. Painted through the
 * Painter interface, palette colours only, whole pixels.
 *
 * The stage fills whatever area it is given. The 128x64 "core" (you, the
 * counter, the barista) sits centred at the bottom; extra room above becomes
 * wall and ceiling, extra room at the sides becomes window seats.
 */

/** The counter's left edge and the y of its top surface, in core pixels (props rest on it). */
export const CAFE_COUNTER = { x: 58, top: 40 } as const;

const WALL_BOTTOM = 33;
const FLOOR_TOP = 58;
/** Counter length past the core's right edge before it ends. */
const COUNTER_TAIL = 24;
/** Width of one window seat beside the core. */
const BAY_W = 44;

/** Paints the café to fill a w x h stage (at least the 128x64 core). */
export function paintCafe(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const wallBottom = oy + WALL_BOTTOM;
  const floorTop = oy + FLOOR_TOP;
  const counterEnd = Math.min(w, ox + CORE_W + COUNTER_TAIL);

  // Wall, a little darker up by the ceiling, lighter in the lamps' light.
  p.rect(0, 0, w, wallBottom, 'concrete');
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  for (const lx of [ox + 28, ox + 100]) {
    lightPool(p, lx, oy + 12, 22, 14, [['fog', 0.5]], { y0: 3, y1: wallBottom });
  }

  // A strand of warm bulbs under the ceiling when there is wall above the core.
  if (oy >= 8) paintStringLights(p, w);
  // A clock and a framed picture when the wall above the core is tall.
  if (oy >= 36) {
    if (ox + 8 >= 0) paintClock(p, ox + 12, oy - 18);
    paintPicture(p, ox + 44, oy - 26);
  }

  // Window seats on both sides of the core, only where a whole window fits.
  const bays: number[] = [];
  for (let x = ox - BAY_W; x + 6 >= 0; x -= BAY_W) bays.push(x);
  for (let x = counterEnd + 2; x + BAY_W - 6 <= w; x += BAY_W) bays.push(x);
  for (const x of bays) paintWindow(p, x + 8, oy + 4);

  paintMenu(p, ox + 40, oy + 6);
  paintShelf(p, ox + 78, oy + 15);
  paintLamp(p, ox + 28, oy);
  paintLamp(p, ox + 100, oy);
  paintWainscot(p, w, wallBottom, floorTop);
  paintFloor(p, w, floorTop, h);
  for (const x of bays) paintTable(p, x + 10, floorTop);
  paintPlant(p, ox + 3, oy + 38);
  paintCounter(
    p,
    ox + CAFE_COUNTER.x,
    counterEnd,
    oy + CAFE_COUNTER.top,
    oy + CORE_H,
    counterEnd < w,
  );
  paintMachine(p, ox + 112, oy + 24, oy + CAFE_COUNTER.top);
}

/** A chalk menu board with a wooden frame. */
function paintMenu(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 16;
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'moss');
  p.rect(x + 1, y + h, w - 2, 1, 'stone'); // shadow under the board
  p.rect(x + 4, y + 3, 10, 1, 'honey');
  for (let row = 0; row < 3; row++) {
    const yy = y + 6 + row * 3;
    p.rect(x + 4, yy, 9 + ((row * 5) % 4), 1, 'paper');
    p.rect(x + w - 7, yy, 3, 1, 'paper');
  }
}

/** A wall shelf with cups and a jar of beans. */
function paintShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 2, 'ember');
  p.rect(x, y + 2, 32, 1, 'stone');
  px(p, x + 3, y + 3, 'ember');
  px(p, x + 28, y + 3, 'ember');
  for (const cx of [x + 3, x + 8, x + 13]) {
    p.rect(cx, y - 3, 3, 3, 'paper');
    px(p, cx + 3, y - 2, 'paper');
    px(p, cx + 2, y - 1, 'fog');
  }
  p.rect(x + 21, y - 5, 5, 5, 'teal');
  p.rect(x + 21, y - 6, 5, 1, 'ink');
  p.rect(x + 22, y - 3, 3, 2, 'ember');
}

/** Scalloped string lights just under the ceiling, a bulb at the bottom of each dip. */
function paintStringLights(p: Painter, w: number): void {
  const period = 16;
  const sag = [0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 0, 0] as const;
  for (let x = 0; x < w; x++) px(p, x, 4 + (sag[x % period] ?? 0), 'ink');
  for (let x = 8; x < w; x += period) {
    p.rect(x - 1, 8, 2, 2, 'honey');
    px(p, x - 1, 10, 'lamp');
    px(p, x, 10, 'amber');
  }
}

/** A small round table with two stools, standing on the floor. */
function paintTable(p: Painter, x: number, floorTop: number): void {
  p.rect(x + 4, floorTop - 11, 16, 1, 'amber');
  p.rect(x + 4, floorTop - 10, 16, 1, 'ember');
  p.rect(x + 11, floorTop - 9, 2, 9, 'ember');
  p.rect(x + 8, floorTop - 1, 8, 1, 'ink');
  p.rect(x + 9, floorTop - 13, 3, 2, 'paper'); // a cup
  for (const sx of [x, x + 20]) {
    p.rect(sx, floorTop - 7, 5, 1, 'amber');
    p.rect(sx + 1, floorTop - 6, 1, 6, 'ember');
    p.rect(sx + 3, floorTop - 6, 1, 6, 'ember');
  }
}

/** The serving counter from x0 to x1: a pale top and a wooden front with panels. */
function paintCounter(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  const h = bottom;
  p.rect(x0, top, w, 2, 'paper');
  p.rect(x0, top + 2, w, 1, 'fog');
  p.rect(x0, top + 3, w, h - top - 3, 'amber');
  p.rect(x0, top + 3, 1, h - top - 3, 'ember');
  if (endsInView) p.rect(x1 - 1, top + 3, 1, h - top - 3, 'ember');
  p.rect(x0, top + 3, w, 1, 'ember');
  for (let x = x0 + 4; x + 14 <= x1 - 2; x += 18) {
    p.rect(x, top + 6, 14, 1, 'ember');
    p.rect(x, top + 6, 1, 13, 'ember');
    p.rect(x + 1, top + 18, 13, 1, 'honey');
    p.rect(x + 13, top + 7, 1, 12, 'honey');
  }
  p.rect(x0, h - 2, w, 2, 'ember');
  p.rect(x0, h, w, 1, 'ink'); // its shadow on a deeper floor
}

/** An espresso machine standing on the counter (its base at `bottom`). */
function paintMachine(p: Painter, x: number, y: number, bottom: number): void {
  p.rect(x, y, 14, 2, 'stone');
  p.rect(x, y + 2, 14, bottom - y - 2, 'fog');
  p.rect(x + 11, y + 2, 3, bottom - y - 2, 'concrete');
  p.rect(x + 2, y + 4, 4, 2, 'ink');
  px(p, x + 8, y + 4, 'red');
  p.rect(x + 3, y + 8, 6, 2, 'stone');
  p.rect(x + 5, y + 10, 2, 1, 'stone');
  p.rect(x + 4, y + 12, 4, 3, 'paper');
  px(p, x + 8, y + 13, 'paper');
  p.rect(x + 1, bottom - 1, 12, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The barista: 16x24, facing left, green apron over a paper shirt and a bun.
// Only the top part shows above the counter; the legs are there so the
// sprite can bob without a gap at the counter line.

export const BARISTA_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.......hhhh.....',
    '......hhhhhhhh..',
    '.....hhhhhhhhhh.',
    '.....sshhhhhhhh.',
    '....ssesshhhh...',
    '.....sssshhhh...',
    '......ssshhh....',
    '.......sss......',
    '.....wwwwwww....',
    '....wgggggwww...',
    '....wgggggwwww..',
    '....wgggggswww..',
    '....wggggggsww..',
    '.....ggggggsww..',
    '.....ggggggs....',
    '.....gggggg.....',
    '.....gggggg.....',
    '.....dddddd.....',
    '.....dddddd.....',
    '......qqpp......',
    '......qqpp......',
    '......qqpp......',
    '.....kkkkk......',
  ],
  legend: {
    h: 'ink',
    s: 'tan',
    e: 'ink',
    w: 'paper',
    g: 'moss',
    d: 'night',
    q: 'slate',
    p: 'night',
    k: 'ink',
  },
};
