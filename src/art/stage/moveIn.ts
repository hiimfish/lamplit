import { ditherRect, lightPool, px, type Painter } from '../../game/painter';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintLamp, paintWindow } from './common';

/**
 * The moving-in stage: the entrance of your new flat on moving day, at dusk.
 * You stand on the left in front of a stack of moving boxes; a hall table sits
 * under the window; the landlord, Mr. Bell, stands on the right by the open
 * front door. Painted through the Painter interface, palette colours only.
 *
 * Like the café it fills any size: the 128x64 core sits centred near the
 * bottom, extra wall goes above and more windows and boxes at the sides.
 */

/** The hall table's left edge, width and the y of its top (props rest on it), in core pixels. */
export const HALL_TABLE = { x: 50, w: 34, top: 40 } as const;

/** Two-tone wall: the line where the paler upper wall meets the lower wall. */
const RAIL_Y = 38;
const FLOOR_TOP = 56;
/** The open front door: frame left edge and width. */
const DOOR = { x: 104, w: 22, top: 8 } as const;
/** Width of one window bay beside the core. */
const BAY_W = 44;

export function paintMoveIn(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const railY = oy + RAIL_Y;
  const floorTop = oy + FLOOR_TOP;

  // Walls: pale above a darker lower half, a white rail and skirting.
  p.rect(0, 0, w, railY, 'fog');
  ditherRect(p, 0, 0, w, 3, 'concrete', 8);
  lightPool(p, ox + 66, oy + 14, 26, 16, [['paper', 0.35]], { y0: 3, y1: railY });
  p.rect(0, railY, w, floorTop - railY, 'concrete');
  p.rect(0, railY, w, 1, 'paper');
  p.rect(0, railY + 1, w, 1, 'stone');
  p.rect(0, floorTop - 2, w, 2, 'paper');

  // A calendar with trash day, when there is wall above the core.
  if (oy >= 30) paintCalendar(p, ox + 24, oy - 22);

  // More windows (and boxes on the floor below some) on both sides of the core.
  const bays: number[] = [];
  for (let x = ox - BAY_W; x + 6 >= 0; x -= BAY_W) bays.push(x);
  for (let x = ox + CORE_W + 2; x + BAY_W - 6 <= w; x += BAY_W) bays.push(x);
  for (const x of bays) paintWindow(p, x + 8, oy + 6);

  paintFloor(p, w, floorTop, h);
  bays.forEach((x, i) => {
    if (i % 2 === 0) paintBox(p, x + 12, floorTop - 12, 18, 12);
  });

  paintWindow(p, ox + 52, oy + 12);
  paintLamp(p, ox + 66, oy);
  paintDoor(p, ox + DOOR.x, oy + DOOR.top, floorTop);
  paintBoxes(p, ox, floorTop);
  paintFloorLamp(p, ox + 42, oy + 17, floorTop);
  paintHallTable(p, ox + HALL_TABLE.x, oy + HALL_TABLE.top, floorTop);
}

/** Warm wooden floorboards. */
function paintFloor(p: Painter, w: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'amber');
  p.rect(0, floorTop, w, 1, 'ember');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'ember');
    for (let x = (row * 13) % 22; x < w; x += 22) px(p, x, y - 1, 'ember');
  }
}

/** A cardboard moving box with a strip of tape. */
function paintBox(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'tan');
  p.rect(x, y, w, 1, 'skin');
  p.rect(x + w - 3, y + 1, 3, h - 1, 'ember');
  p.rect(x + Math.floor(w / 2) - 1, y, 2, 4, 'paper');
  p.rect(x, y + h - 1, w, 1, 'ember');
}

/** The stack of moving boxes behind you, the top one open. */
function paintBoxes(p: Painter, ox: number, floorTop: number): void {
  paintBox(p, ox + 1, floorTop - 13, 17, 13);
  paintBox(p, ox + 3, floorTop - 24, 13, 11);
  // open flaps on the top box
  p.rect(ox + 1, floorTop - 26, 4, 2, 'skin');
  p.rect(ox + 14, floorTop - 26, 4, 2, 'skin');
  p.rect(ox + 4, floorTop - 24, 11, 1, 'ember');
}

/** A standing lamp with a paper shade, switched on. */
function paintFloorLamp(p: Painter, cx: number, top: number, floorTop: number): void {
  p.rect(cx - 4, top, 9, 1, 'paper');
  p.rect(cx - 5, top + 1, 11, 4, 'paper');
  p.rect(cx - 5, top + 5, 11, 1, 'honey');
  p.rect(cx + 3, top + 1, 3, 4, 'fog');
  p.rect(cx, top + 6, 1, floorTop - top - 7, 'ink');
  p.rect(cx - 2, floorTop - 1, 5, 1, 'ink');
}

/** A narrow hall table under the window, with a small tray. */
function paintHallTable(p: Painter, x: number, top: number, floorTop: number): void {
  const { w } = HALL_TABLE;
  p.rect(x, top, w, 2, 'amber');
  p.rect(x, top + 2, w, 1, 'ember');
  p.rect(x + 2, top + 3, w - 4, 4, 'ember');
  p.rect(x + 3, top + 4, w - 6, 2, 'amber');
  p.rect(x + 2, top + 7, 2, floorTop - top - 7, 'ember');
  p.rect(x + w - 4, top + 7, 2, floorTop - top - 7, 'ember');
  p.rect(x + 4, floorTop - 5, w - 8, 1, 'ember');
}

/** The open front door, with the dim hallway outside and the door leaf against the wall. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const { w } = DOOR;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'ember');
  p.rect(x + 2, top + 2, w - 4, h - 2, 'night');
  ditherRect(p, x + 2, top + 2, w - 4, 6, 'slate', 6);
  p.rect(x + 2, floorTop - 4, w - 4, 4, 'slate');
  p.rect(x + 4, floorTop - 4, w - 8, 1, 'stone');
  // the leaf, opened inward against the wall
  p.rect(x + w, top + 1, 2, h - 1, 'amber');
  p.rect(x + w + 2, top + 2, 1, h - 2, 'ember');
  px(p, x + w, top + Math.floor(h / 2), 'honey');
}

/** A wall calendar with trash day (Monday) ringed in red. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x, y, 12, 14, 'paper');
  p.rect(x, y, 12, 3, 'red');
  px(p, x + 6, y - 1, 'ink');
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) px(p, x + 2 + col * 3, y + 5 + row * 3, 'stone');
  }
  p.rect(x + 1, y + 4, 3, 3, 'red');
  p.rect(x + 2, y + 5, 1, 1, 'stone');
  p.rect(x + 1, y + 14, 11, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The landlord, Mr. Bell: 16x24, facing left. White hair and moustache, a teal
// cardigan over a white shirt, tan trousers.

export const LANDLORD_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhhh......',
    '.....hhhhhhh....',
    '.....sshhhhhh...',
    '....sssshhhhh...',
    '...ssesssshhh...',
    '....ssssssh.....',
    '....mmmsss......',
    '......sss.......',
    '.....wcccccc....',
    '....cwccccccc...',
    '....ccccccccc...',
    '....ccccccacc...',
    '....ccccccacc...',
    '....ccccccacc...',
    '....ccccccsc....',
    '.....cccccc.....',
    '.....dddddd.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'paper',
    s: 'skin',
    e: 'ink',
    m: 'paper',
    w: 'paper',
    c: 'teal',
    a: 'moss',
    d: 'ember',
    p: 'tan',
    q: 'ember',
    k: 'ink',
  },
};
