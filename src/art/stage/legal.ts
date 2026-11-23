import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { CLIENT_SPRITE } from './act3Cast';
import { LAWYER_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The contract stage, on a May evening. Two places:
 *
 * - The Harbor Trading conference room (`paint`): from the left a window onto
 *   the town at dusk over a low cabinet with a lit Lantern lamp (you stand in
 *   front of it), a framed map with a pin in America and one in Britain, the
 *   clock, a bar light over a long wooden table, and the big wall screen at
 *   the far end, switched off (Mr. Hughes has flown in to sign). Everyone
 *   across the table stands behind it, so it hides them from the waist down;
 *   handed-over things rest on its near half.
 * - The same room on a video call (`backdrops.client`): the wall screen is a
 *   framed call panel with a camera badge, Mr. Hughes's office in England in
 *   it (rain on the window, a clock tower, a little flag, a Harbor lamp).
 * - Mr. Shaw's law office (`backdrops.lawyer`): dark wood, shelves of thick
 *   books to the ceiling, his high-backed chair, and a broad desk with a green
 *   banker's lamp, the contract and a fountain pen.
 *
 * Like the other stages it fills any size: the core sits centred near the
 * bottom, the wall goes on upward (posters, then a darker upper wall with high
 * windows; in the law office the bookshelves simply climb to the ceiling) and
 * the room goes on sideways in bays.
 */

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the panelled lower wall. */
const RAIL_Y = 41;
/** The table (or desk): left edge, width and the y of the far edge of its top. */
const TABLE = { x: 30, w: 90, top: 47 } as const;
const TABLE_DEPTH = 5;
/** 24x24 pictures stand on the top, their feet near its far edge. */
const PROP_TOP = TABLE.top - 20;
/** People across the table stand this high; the table hides them below its far edge. */
const BEHIND_Y = 31;
/** The head of the table, near the middle: Ms. Carter, and Mr. Shaw at his own desk. */
const AT_HEAD = { x: 74, y: BEHIND_Y } as const;
/** Nearer your end of the table: Mr. Shaw when someone else is in the meeting. */
const NEAR_END = { x: 58, y: BEHIND_Y } as const;
/** In front of the wall screen (and inside the call panel): Mr. Hughes. */
const BY_SCREEN = { x: 96, y: BEHIND_Y } as const;
/** The wall screen, its bezel's outer box. */
const SCREEN = { x: 91, y: 6, w: 31, h: 24 } as const;
/** The call panel over the screen; the table hides its bottom edge. */
const PANEL = { x: 89, y: 2, w: 35, h: 50 } as const;
/** The window behind you in the conference room. */
const WINDOW = { x: 2, y: 6, w: 25, h: 27 } as const;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** The bar light over the table. */
const BAR = { x: 42, w: 37, y: 6 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
type Bay = 'window' | 'cabinet' | 'door' | 'shelf';
const LEFT_BAYS: readonly Bay[] = ['door', 'window', 'cabinet', 'window'];
const RIGHT_BAYS: readonly Bay[] = ['window', 'cabinet', 'window', 'shelf'];
/** Wall above the core needed for the posters, and for the upper wall. */
const POSTER_MIN = 26;
const CORNICE_MIN = 60;
const CORNICE_UP = 48;
const HIGH_GAP = 88;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle. */
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

/** The conference room for the signing: the wall screen is off. */
function paintRoomScene(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintRoom(p, w, h);
  paintScreenOff(p, ox + SCREEN.x, oy + SCREEN.y);
  paintTable(p, ox, oy, oy + FLOOR_TOP);
}

/** The conference room on a video call: Mr. Hughes's office in a panel over the screen. */
function paintCallScene(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintRoom(p, w, h);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y, ox);
  paintTable(p, ox, oy, oy + FLOOR_TOP);
}

// ---------------------------------------------------------------------------
// The conference room

/** Everything of the conference room except the screen and the table. */
function paintRoom(p: Painter, w: number, h: number): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The bays beside the core: [left x, kind].
  const bays: [number, Bay][] = [];
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, LEFT_BAYS[i % LEFT_BAYS.length] ?? 'window']);
  }

  // The wall, warm under the bar light and the lamps.
  p.rect(0, 0, w, floorTop, 'fog');
  glowEllipse(p, ox + BAR.x + 18, oy + 16, 44, 24, 'honey', [0.2, 0.12, 0.06]);
  glowEllipse(p, ox + 12, oy + 40, 18, 12, 'honey', [0.22, 0.1]);
  for (const [x, kind] of bays) {
    if (kind === 'cabinet') glowEllipse(p, x + 30, oy + 36, 16, 11, 'honey', [0.2, 0.1]);
  }
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  if (oy >= POSTER_MIN) {
    paintLampPoster(p, ox + 38, oy - 23, 0);
    paintLampPoster(p, ox + 62, oy - 23, 1);
    for (const [x, kind] of bays) {
      if (kind === 'cabinet') paintLampPoster(p, x + 14, oy - 23, mod(x - ox, 3) === 0 ? 1 : 0);
    }
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') {
      paintTownWindow(p, x + 9, winTop, 26, winH, ox);
      paintPlant(p, x + 30, oy + 36);
    } else if (kind === 'cabinet') {
      paintCabinet(p, x + 6, oy + 44, floorTop, 32);
      paintLantern(p, x + 27, oy + 44);
    } else if (kind === 'door') {
      paintDoor(p, x + 10, oy + 8, floorTop);
    } else {
      paintBinderShelf(p, x + 7, oy + 10, floorTop, x - ox);
    }
  }

  // The core: the window over the cabinet, the map, the clock, the bar light.
  paintTownWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintCabinet(p, ox - 2, oy + 44, floorTop, 32);
  paintLantern(p, ox + 9, oy + 44);
  paintMap(p, ox + 33, oy + 9);
  paintClock(p, ox + 70, oy + 13);
  paintBarLight(p, ox + BAR.x, oy + BAR.y, cornice);
  // high-backed chairs waiting behind the far side of the table
  for (const cx of [63, 79, 101]) paintChairBack(p, ox + cx, oy + TABLE.top - 9);
}

/** The panelled lower wall under a pale rail, with a skirting board. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top + 2, w, floorTop - top - 2, 'plum');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'concrete');
  for (let x = mod(ox + 4, 16) - 16; x < w; x += 16) {
    p.rect(x, top + 4, 1, floorTop - top - 7, 'maroon');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Carpet tiles: slate with a short woven fleck, counted from the core so it never shifts. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 2 < h; row++) {
    const y = floorTop + 2 + row * 2;
    for (let x = mod(ox + row * 5, 10) - 10; x < w; x += 10) {
      p.rect(x, y, 2, 1, row % 2 === 0 ? 'stone' : 'night');
    }
  }
}

/** The darker wall under the ceiling on a tall stage, with high windows onto the night sky. */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'concrete');
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  const wh = Math.min(56, cornice - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((cornice - wh) / 2));
    const first = Math.floor(-(ox + 64) / HIGH_GAP) - 1;
    for (let k = first; ox + 64 + k * HIGH_GAP - 22 < w; k++) {
      const cx = ox + 64 + k * HIGH_GAP;
      p.rect(cx - 21, top - 1, 43, wh + 2, 'paper');
      ditherGradient(p, cx - 20, top, 41, wh, ['deep', 'deep', 'indigo', 'dusk']);
      for (let i = 0; i < 7; i++) {
        const sx = cx - 19 + Math.floor(hash2(i, k, 311) * 39);
        const sy = top + 1 + Math.floor(hash2(i, k, 313) * (wh - 3));
        px(p, sx, sy, hash2(i, k, 317) > 0.7 ? 'paper' : 'fog');
      }
      p.rect(cx - 7, top, 1, wh, 'paper');
      p.rect(cx + 7, top, 1, wh, 'paper');
      p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
    }
  }
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'fog');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

/** The town at dusk through a window: rosy sky, rooftops with lit windows, the first stars. */
function paintTown(target: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 4;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  for (let i = 0; i < w; i++) {
    const tx = mod(x + i - ox, 160);
    if (hash2(tx, 3, 401) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(tx, 4, 409) * Math.max(3, horizon - y - 14)), 'fog');
    }
  }
  // rooftops in blocks of a few pixels, some lit windows in them
  for (let bx = x - mod(x - ox, 6); bx < x + w; bx += 6) {
    const k = mod(bx - ox, 160);
    const tall = 3 + Math.floor(hash2(k, 1, 419) * 8);
    p.rect(bx, horizon - tall, 6, h, 'night');
    if (hash2(k, 2, 421) < 0.3) p.rect(bx + 2, horizon - tall - 2, 1, 2, 'night');
    for (let r = 0; r < 3; r++) {
      if (hash2(k, r + 5, 431) < 0.35) {
        px(p, bx + 1 + r * 2, horizon - tall + 2 + r, hash2(k, r, 433) < 0.5 ? 'honey' : 'lamp');
      }
    }
  }
  p.rect(x, y + h - 2, w, 2, 'deep');
}

/** A window with a white frame and sill: the town at dusk, a blind rolled up at the top. */
function paintTownWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintTown(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  p.rect(x + 2, y + 2, w - 4, 2, 'fog');
  p.rect(x + 2, y + 4, w - 4, 1, 'concrete');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

/** A low wooden cabinet from (x, top), w wide, down to the floor: two doors and a top. */
function paintCabinet(p: Painter, x: number, top: number, floorTop: number, w: number): void {
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
  const half = Math.floor((w - 6) / 2);
  for (const dx of [2, 4 + half]) {
    p.rect(x + dx, top + 4, half, bottom - top - 6, 'amber');
    p.rect(x + dx + half - 1, top + 4, 1, bottom - top - 6, 'plum');
    p.rect(x + dx, bottom - 3, half, 1, 'plum');
  }
  px(p, x + 1 + half, top + 7, 'honey');
  px(p, x + 6 + half, top + 7, 'honey');
}

/**
 * A Lantern desk lamp, lit, standing on `baseY`: a little caged glass shade
 * on a short stem, its glow on the wall behind.
 */
function paintLantern(p: Painter, x: number, baseY: number): void {
  glowEllipse(p, x + 3, baseY - 7, 9, 7, 'honey', [0.35, 0.18, 0.08]);
  p.rect(x + 2, baseY - 13, 3, 1, 'ink');
  px(p, x + 3, baseY - 14, 'ink');
  p.rect(x + 1, baseY - 12, 5, 1, 'ink');
  p.rect(x, baseY - 11, 7, 5, 'ink');
  p.rect(x + 1, baseY - 11, 5, 5, 'honey');
  p.rect(x + 2, baseY - 10, 3, 3, 'paper');
  p.rect(x + 3, baseY - 11, 1, 5, 'lamp');
  p.rect(x + 1, baseY - 6, 5, 1, 'ink');
  p.rect(x + 3, baseY - 5, 1, 3, 'stone');
  p.rect(x + 1, baseY - 2, 5, 2, 'ink');
  px(p, x + 2, baseY - 2, 'stone');
}

/** The way out on the left: a wooden door in a pale frame, a brass handle. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x - 2, top - 2, 26, floorTop - top + 2, 'paper');
  p.rect(x - 1, top - 1, 24, floorTop - top + 1, 'concrete');
  p.rect(x, top, 22, floorTop - top, 'amber');
  p.rect(x + 3, top + 3, 16, 18, 'ember');
  p.rect(x + 4, top + 4, 14, 16, 'amber');
  p.rect(x + 3, top + 25, 16, floorTop - top - 29, 'ember');
  p.rect(x + 4, top + 26, 14, floorTop - top - 31, 'amber');
  p.rect(x + 18, top + 22, 3, 2, 'honey');
  px(p, x + 18, top + 23, 'ember');
  p.rect(x + 21, top, 1, floorTop - top, 'plum');
}

/** A tall shelf of binders and sample boxes from (x, top), 30 wide. */
function paintBinderShelf(p: Painter, x: number, top: number, floorTop: number, seed: number) {
  p.rect(x, top, 30, floorTop - top, 'ember');
  p.rect(x + 1, top + 1, 28, floorTop - top - 2, 'plum');
  const colours: readonly PaletteName[] = ['denim', 'maroon', 'moss', 'stone', 'teal', 'paper'];
  for (let s = 0; top + 10 + s * 10 < floorTop - 2; s++) {
    const sy = top + 10 + s * 10;
    if (s === 1) {
      // a shelf of the company's boxed lamps
      for (let b = 0; b < 3; b++) {
        p.rect(x + 2 + b * 9, sy - 7, 8, 7, 'tan');
        p.rect(x + 2 + b * 9, sy - 7, 8, 1, 'paper');
        px(p, x + 5 + b * 9, sy - 4, 'amber');
      }
    } else {
      for (let b = 0; b < 9; b++) {
        if (hash2(b, s, seed + 503) < 0.15) continue;
        const c = colours[Math.floor(hash2(b, s, seed + 509) * colours.length)] ?? 'denim';
        p.rect(x + 2 + b * 3, sy - 8, 2, 8, c);
        px(p, x + 2 + b * 3, sy - 6, 'paper');
      }
    }
    p.rect(x + 1, sy, 28, 1, 'amber');
  }
}

/** A framed poster of a Lantern lamp, lit; two colourways. */
function paintLampPoster(p: Painter, x: number, y: number, variant: 0 | 1): void {
  p.rect(x + 1, y + 20, 16, 1, 'concrete');
  p.rect(x, y, 16, 20, 'slate');
  p.rect(x + 1, y + 1, 14, 18, variant === 0 ? 'deep' : 'maroon');
  glowEllipse(p, x + 8, y + 8, 6, 5, 'honey', [0.4, 0.2]);
  paintLantern(p, x + 5, y + 15);
  p.rect(x + 3, y + 16, 10, 1, 'amber');
}

/**
 * A framed map of the world on dusky blue: America on the left, Britain and
 * Europe on the right, a pin in each and a dotted line across the ocean.
 */
function paintMap(p: Painter, x: number, y: number): void {
  const w = 25;
  const h = 17;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'amber');
  p.rect(x + 2, y + 2, w - 4, h - 4, 'denim');
  ditherRect(p, x + 2, y + 2, w - 4, h - 4, 'sky', 3);
  // North America and a bit of the south
  const america: readonly [number, number, number][] = [
    [3, 3, 6],
    [3, 4, 7],
    [4, 5, 6],
    [5, 6, 4],
    [6, 7, 3],
    [7, 8, 2],
    [8, 10, 2],
    [8, 11, 3],
    [9, 12, 2],
  ];
  for (const [dx, dy, lw] of america) p.rect(x + dx, y + dy, lw, 1, 'leaf');
  px(p, x + 3, y + 5, 'moss');
  // Britain, and Europe beside it
  p.rect(x + 15, y + 4, 1, 2, 'leaf');
  px(p, x + 16, y + 5, 'leaf');
  const europe: readonly [number, number, number][] = [
    [18, 3, 4],
    [17, 4, 5],
    [18, 5, 4],
    [18, 6, 3],
    [19, 7, 3],
    [18, 9, 3],
    [18, 10, 4],
    [19, 11, 3],
    [19, 12, 2],
  ];
  for (const [dx, dy, lw] of europe) p.rect(x + dx, y + dy, lw, 1, 'leaf');
  // the pins and the line between them
  for (const dx of [10, 12]) px(p, x + dx, y + 4, 'paper');
  px(p, x + 14, y + 3, 'paper');
  p.rect(x + 8, y + 5, 1, 2, 'red');
  px(p, x + 8, y + 4, 'red');
  p.rect(x + 15, y + 2, 1, 2, 'red');
  px(p, x + 15, y + 1, 'red');
}

/** A long bar light hung on two wires from the ceiling (`from`), its underside glowing. */
function paintBarLight(p: Painter, x: number, y: number, from: number): void {
  p.rect(x + 4, from, 1, y - from, 'stone');
  p.rect(x + BAR.w - 5, from, 1, y - from, 'stone');
  p.rect(x, y, BAR.w, 1, 'ink');
  p.rect(x, y + 1, BAR.w, 1, 'slate');
  p.rect(x + 1, y + 2, BAR.w - 2, 1, 'honey');
  px(p, x, y + 1, 'stone');
  px(p, x + BAR.w - 1, y + 1, 'stone');
}

/** A high-backed leather chair seen from behind the table: its back from (x, y), 10 wide. */
function paintChairBack(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 8, 1, 'ink');
  p.rect(x, y + 1, 10, 9, 'ink');
  p.rect(x + 1, y + 1, 8, 8, 'night');
  p.rect(x + 2, y + 2, 2, 6, 'slate');
  p.rect(x + 6, y + 2, 1, 6, 'deep');
}

/** The wall screen, switched off: dark glass in a thin bezel, a camera on top, a red standby light. */
function paintScreenOff(p: Painter, x: number, y: number): void {
  const { w, h } = SCREEN;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'ink');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 3, ['night', 'night', 'deep']);
  // the room and the light bar faintly reflected
  for (let i = 0; i < 8; i++) px(p, x + 4 + i, y + 12 - i, 'slate');
  for (let i = 0; i < 5; i++) px(p, x + 8 + i, y + 13 - i, 'slate');
  for (let i = 0; i < 10; i++) px(p, x + 15 + i, y + 18 - i, 'slate');
  p.rect(x + 3, y + 3, 6, 1, 'stone');
  // the camera, the standby light
  p.rect(x + 13, y - 2, 5, 2, 'ink');
  px(p, x + 15, y - 1, 'stone');
  px(p, x + w - 3, y + h - 2, 'red');
}

/**
 * The long conference table: a wooden top seen a little from above, a solid
 * front with a lighter band, the bar light's glow on the wood, and on its far
 * side a water jug and glasses, the contract in its folder with a pen, and
 * the conference speaker.
 */
function paintTable(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x = ox + TABLE.x;
  const top = oy + TABLE.top;
  const w = TABLE.w;
  const edge = top + TABLE_DEPTH;
  // the shadow on the carpet
  ditherRect(p, x + 1, floorTop + 1, w, 4, 'night', 8);
  p.rect(x + 2, floorTop + 5, w - 2, 1, 'night');
  // the front: the edge, a band and a dark plinth over the carpet
  p.rect(x, edge, w, floorTop + 5 - edge, 'ember');
  p.rect(x, edge, w, 1, 'amber');
  p.rect(x + 1, edge + 2, w - 2, 1, 'plum');
  for (let px0 = x + 4; px0 < x + w - 8; px0 += 22) {
    p.rect(px0, edge + 4, 18, floorTop - edge - 2, 'plum');
    p.rect(px0 + 1, edge + 5, 16, floorTop - edge - 4, 'ember');
  }
  p.rect(x + 2, floorTop + 3, w - 4, 2, 'plum');
  // the top: the far edge catches the light
  p.rect(x, top, w, TABLE_DEPTH, 'amber');
  p.rect(x + 1, top, w - 2, 1, 'honey');
  p.rect(x, edge - 1, w, 1, 'ember');
  // the bar light on the wood
  p.rect(x + 14, top + 2, 10, 1, 'honey');
  p.rect(x + 27, top + 2, 4, 1, 'honey');
  p.rect(x + 34, top + 1, 9, 1, 'honey');

  // a water jug and two glasses, by Ms. Carter's place
  const jx = ox + 70;
  p.rect(jx, top - 5, 4, 6, 'sky');
  p.rect(jx + 1, top - 4, 2, 4, 'cyan');
  p.rect(jx, top - 6, 3, 1, 'fog');
  p.rect(jx + 4, top - 4, 1, 3, 'fog');
  p.rect(jx + 6, top - 2, 2, 3, 'fog');
  px(p, jx + 6, top - 1, 'sky');
  // the contract in an open folder, a pen across it
  const cx = ox + 82;
  p.rect(cx, top + 1, 13, 3, 'denim');
  p.rect(cx + 1, top + 1, 5, 2, 'paper');
  p.rect(cx + 7, top + 1, 5, 2, 'paper');
  px(p, cx + 2, top + 1, 'stone');
  px(p, cx + 4, top + 1, 'stone');
  px(p, cx + 9, top + 2, 'denim');
  p.rect(cx + 8, top + 3, 4, 1, 'ink');
  px(p, cx + 12, top + 3, 'honey');
  // the conference speaker near the screen
  const sx = ox + 104;
  p.rect(sx + 1, top, 7, 1, 'slate');
  p.rect(sx, top + 1, 9, 2, 'ink');
  px(p, sx + 4, top + 1, 'cyan');
  p.rect(sx + 1, top + 3, 8, 1, 'ember');
}

// ---------------------------------------------------------------------------
// The call panel: Mr. Hughes in his office in England

/** The panel with its rounded, inked border, his office inside and a camera badge on top. */
function paintPanel(p: Painter, x: number, y: number, ox: number): void {
  const { w, h } = PANEL;
  p.rect(x + 2, y + 2, w, h, 'ink', 0.35);
  p.rect(x + 2, y, w - 4, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ink');
  p.rect(x, y + 2, w, h - 4, 'ink');
  p.rect(x + 2, y + 1, w - 4, h - 2, 'paper');
  p.rect(x + 1, y + 2, w - 2, h - 4, 'paper');
  const ix = x + 2;
  const iy = y + 2;
  const iw = w - 4;
  const ih = h - 4;
  p.rect(ix + 1, iy, iw - 2, ih, 'ink');
  p.rect(ix, iy + 1, iw, ih - 2, 'ink');
  paintHughesOffice(within(p, ix + 1, iy + 1, iw - 2, ih - 2), ix + 1, iy + 1, iw - 2, ih - 2, ox);
  paintCameraBadge(p, x + Math.floor((w - 16) / 2), y - 2);
}

/**
 * Inside the panel: a rainy English evening through the window behind him
 * (a clock tower against the sky), a warm wall, and a shelf with a little
 * flag and one of Harbor's lamps.
 */
function paintHughesOffice(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
): void {
  p.rect(x, y, w, h, 'concrete');
  glowEllipse(p, x + w - 5, y + 24, 16, 12, 'honey', [0.22, 0.12]);
  // the window, rain on the glass
  const wx = x + 2;
  const wy = y + 2;
  const ww = w - 12;
  const wh = 19;
  p.rect(wx, wy, ww, wh, 'paper');
  const glass = within(p, wx + 1, wy + 1, ww - 2, wh - 2);
  ditherGradient(glass, wx + 1, wy + 1, ww - 2, wh - 2, ['deep', 'indigo', 'dusk', 'violet']);
  // the clock tower, its face lit
  const tx = wx + 5;
  p.rect(tx, wy + 6, 5, wh, 'night');
  p.rect(tx + 1, wy + 4, 3, 2, 'night');
  px(p, tx + 2, wy + 3, 'night');
  p.rect(tx + 1, wy + 7, 3, 3, 'honey');
  px(p, tx + 2, wy + 8, 'ember');
  // roofs and a lit window
  p.rect(wx + 1, wy + wh - 5, ww - 2, 4, 'night');
  p.rect(wx + 13, wy + wh - 8, 6, 3, 'night');
  px(p, wx + 15, wy + wh - 6, 'honey');
  px(p, wx + 3, wy + wh - 3, 'lamp');
  for (let i = 0; i < 9; i++) {
    const rx = wx + 2 + Math.floor(hash2(i, x - ox, 601) * (ww - 4));
    const ry = wy + 2 + Math.floor(hash2(i, x - ox, 607) * (wh - 6));
    px(glass, rx, ry, 'sky');
    px(glass, rx, ry + 1, 'fog');
  }
  p.rect(wx + Math.floor(ww / 2), wy + 1, 1, wh - 2, 'paper');
  p.rect(wx - 1, wy + wh, ww + 2, 1, 'stone');
  // the shelf on the right: a flag on a stick and a lit lamp
  const sx = x + w - 9;
  p.rect(sx, y + 14, 9, 1, 'ember');
  p.rect(sx + 1, y + 15, 1, 2, 'ember');
  p.rect(sx + 1, y + 7, 1, 7, 'ink');
  p.rect(sx + 2, y + 7, 6, 4, 'denim');
  p.rect(sx + 2, y + 8, 6, 2, 'paper');
  p.rect(sx + 4, y + 7, 2, 4, 'paper');
  p.rect(sx + 2, y + 9, 6, 1, 'red');
  p.rect(sx + 4, y + 7, 1, 4, 'red');
  paintLantern(p, sx + 1, y + 28);
  p.rect(sx - 1, y + 28, 10, 1, 'ember');
  // the panelled wall lower down
  p.rect(x, y + 36, w, h - 36, 'ember');
  p.rect(x, y + 36, w, 1, 'amber');
}

/**
 * The camera badge on the panel's top edge: a rounded paper tag in an ink rim
 * with a video camera. O rim, w paper, k camera, t lens, r recording light.
 */
const BADGE: readonly string[] = [
  '.OOOOOOOOOOOOOO.',
  'OwwwwwwwwwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  'OwkkkkkkkkwwwkwO',
  'OwkttkkkkkwwkkwO',
  'OwkttkkkkkkkkkwO',
  'OwkkkkkkkkwwkkwO',
  'OwkkkkkrkkwwwkwO',
  'OwwwwwwwwwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  '.OOOOOOOOOOOOOO.',
];
const BADGE_COLOURS: Readonly<Record<string, PaletteName>> = {
  O: 'ink',
  w: 'paper',
  k: 'ink',
  t: 'teal',
  r: 'red',
};

function paintCameraBadge(p: Painter, x: number, y: number): void {
  BADGE.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = BADGE_COLOURS[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
  p.rect(x + 1, y + BADGE.length, 15, 1, 'ink', 0.35);
}

// ---------------------------------------------------------------------------
// Mr. Shaw's law office

/** Gap between the bookcases' shelves. */
const SHELF_H = 10;
/** Beside the core the office repeats: a curtained window, then a bookcase this wide. */
const LAW_WINDOW_W = 32;
const LAW_CASE_W = 44;
/** A bookcase over a window or a panel needs at least this much height. */
const CASE_MIN = 14;

/** Mr. Shaw's office: books to the ceiling, his chair, the desk with the contract. */
function paintLawOffice(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;
  const top = 3;

  // the panelled wall, dim
  p.rect(0, 0, w, floorTop, 'plum');
  for (let x = mod(ox + 2, 12) - 12; x < w; x += 12) p.rect(x, 0, 1, floorTop, 'maroon');
  p.rect(0, oy + RAIL_Y, w, 1, 'amber');
  p.rect(0, oy + RAIL_Y + 1, w, 1, 'ember');
  p.rect(0, 0, w, 2, 'ember');
  p.rect(0, 2, w, 1, 'amber');

  // Window bays (their left x) and full-height bookcases ([left, right)).
  const windows: number[] = [ox - 2];
  const cases: [number, number][] = [
    [ox + 56, ox + 74],
    [ox + 91, ox + CORE_W],
  ];
  for (let x = ox + CORE_W; x < w; x += LAW_WINDOW_W + LAW_CASE_W) {
    windows.push(x);
    cases.push([x + LAW_WINDOW_W, x + LAW_WINDOW_W + LAW_CASE_W]);
  }
  for (let x = ox - 2; x > 0; x -= LAW_WINDOW_W + LAW_CASE_W) {
    cases.push([x - LAW_CASE_W, x]);
    windows.push(x - LAW_CASE_W - LAW_WINDOW_W);
  }
  for (const [a, b] of cases) paintBookcase(p, a, b, top, floorTop, ox);
  for (const x of windows) {
    if (winTop - 5 - top >= CASE_MIN) paintBookcase(p, x, x + LAW_WINDOW_W, top, winTop - 5, ox);
    paintCurtainedWindow(p, x + 4, winTop, WINDOW.w, winH, ox);
  }

  // the plain panel by the window: books above it, a seascape on it
  if (oy + 4 - top >= CASE_MIN) paintBookcase(p, ox + 30, ox + 56, top, oy + 4, ox);
  paintSeascape(p, ox + 33, oy + 9);
  // the panel behind his chair: a framed certificate, a portrait above, then books
  paintCertificate(p, ox + 76, oy + 9);
  if (oy >= POSTER_MIN) paintPortrait(p, ox + 75, oy - 24);
  if (oy - 28 - top >= CASE_MIN) paintBookcase(p, ox + 74, ox + 91, top, oy - 28, ox);

  // the floorboards and a red rug under you
  p.rect(0, floorTop, w, h - floorTop, 'ember');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 3 + row * 3 < h + 3; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'plum');
    for (let x = mod(ox + row * 13, 26) - 26; x < w; x += 26) p.rect(x, y - 2, 1, 2, 'plum');
  }
  paintRug(p, ox + 2, floorTop + 3);

  // his high-backed chair, then the lamp's glow, then the desk
  paintLeatherChair(p, ox + AT_HEAD.x + 1, oy + 25);
  glowEllipse(p, ox + 101, oy + 42, 22, 12, 'honey', [0.28, 0.16, 0.08]);
  paintDesk(p, ox, oy, floorTop);
}

/**
 * A bookcase of thick law books from x0 to x1, top to the floor: dark wood,
 * shelves every SHELF_H, the books in deep colours with gilt bands, now and
 * then a gap, a book lying flat or a leaning one.
 */
function paintBookcase(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  floorTop: number,
  ox: number,
): void {
  p.rect(x0, top, x1 - x0, floorTop - top, 'ember');
  p.rect(x0 + 2, top + 2, x1 - x0 - 4, floorTop - top - 4, 'ink');
  p.rect(x0, top, x1 - x0, 1, 'amber');
  const colours: readonly PaletteName[] = [
    'maroon',
    'moss',
    'denim',
    'maroon',
    'plum',
    'ember',
    'teal',
  ];
  for (let sy = floorTop - 4; sy - SHELF_H + 2 > top; sy -= SHELF_H) {
    const row = Math.round((floorTop - sy) / SHELF_H);
    let bx = x0 + 2;
    let n = 0;
    while (bx < x1 - 3) {
      const k = bx - ox;
      const r = hash2(k, row, 701);
      const bw = r < 0.5 ? 2 : 3;
      if (bx + bw > x1 - 2) break;
      if (hash2(k, row, 709) < 0.06 && n > 2) {
        // a gap, and a book lying flat in it
        p.rect(bx, sy - 2, 5, 2, colours[n % colours.length] ?? 'maroon');
        px(p, bx + 1, sy - 2, 'honey');
        bx += 6;
        n++;
        continue;
      }
      const tall = 6 + Math.floor(hash2(k, row, 719) * 3);
      const c = colours[Math.floor(hash2(k, row, 727) * colours.length)] ?? 'maroon';
      p.rect(bx, sy - tall, bw, tall, c);
      px(p, bx, sy - tall + 1, 'honey');
      if (bw === 3) px(p, bx + 1, sy - tall + 1, 'honey');
      p.rect(bx, sy - 3, bw, 1, 'amber');
      if (bw === 3) p.rect(bx + 2, sy - tall, 1, tall, 'ink', 0.4);
      bx += bw;
      n++;
    }
    p.rect(x0 + 2, sy, x1 - x0 - 4, 1, 'amber');
    p.rect(x0 + 2, sy + 1, x1 - x0 - 4, 1, 'plum');
  }
  p.rect(x0, top, 2, floorTop - top, 'amber');
  p.rect(x1 - 2, top, 1, floorTop - top, 'ember');
  p.rect(x1 - 1, top, 1, floorTop - top, 'plum');
}

/** A window onto the town at dusk with heavy red curtains drawn back. */
function paintCurtainedWindow(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
): void {
  p.rect(x - 1, y - 1, w + 2, h + 3, 'ember');
  paintTownWindow(p, x, y, w, h, ox);
  p.rect(x - 3, y - 3, w + 6, 1, 'honey');
  p.rect(x - 3, y - 2, w + 6, 1, 'ember');
  for (const cx of [x - 3, x + w - 2]) {
    p.rect(cx, y - 1, 5, h + 6, 'maroon');
    p.rect(cx + 1, y - 1, 1, h + 6, 'red');
    p.rect(cx + 3, y - 1, 1, h + 6, 'plum');
  }
  // the tie-backs
  p.rect(x - 3, y + Math.floor(h / 2), 5, 1, 'honey');
  p.rect(x + w - 2, y + Math.floor(h / 2), 5, 1, 'honey');
}

/** A gilt-framed painting of a ship at sea under an evening sky, 22x15 from (x, y). */
function paintSeascape(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 15, 22, 1, 'ink', 0.5);
  p.rect(x, y, 22, 15, 'honey');
  p.rect(x + 1, y + 1, 20, 13, 'amber');
  ditherGradient(p, x + 2, y + 2, 18, 7, ['indigo', 'violet', 'rosy']);
  ditherGradient(p, x + 2, y + 9, 18, 4, ['teal', 'deep']);
  // the ship: hull, two masts and sails
  p.rect(x + 7, y + 9, 8, 1, 'ink');
  p.rect(x + 8, y + 10, 6, 1, 'ink');
  p.rect(x + 9, y + 3, 1, 6, 'ink');
  p.rect(x + 12, y + 4, 1, 5, 'ink');
  p.rect(x + 10, y + 4, 2, 4, 'paper');
  p.rect(x + 13, y + 5, 2, 3, 'paper');
  px(p, x + 4, y + 3, 'honey');
}

/** A framed certificate behind the chair: cream paper, lines, a red seal. */
function paintCertificate(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 13, 14, 1, 'ink', 0.5);
  p.rect(x, y, 14, 13, 'honey');
  p.rect(x + 1, y + 1, 12, 11, 'ember');
  p.rect(x + 2, y + 2, 10, 9, 'paper');
  p.rect(x + 4, y + 3, 6, 1, 'stone');
  p.rect(x + 3, y + 5, 8, 1, 'fog');
  p.rect(x + 3, y + 7, 5, 1, 'fog');
  p.rect(x + 9, y + 7, 2, 2, 'red');
  px(p, x + 10, y + 9, 'maroon');
}

/** A gilt-framed portrait high on the panel (tall stages): a grey-haired judge in a dark robe. */
function paintPortrait(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 20, 16, 1, 'ink', 0.5);
  p.rect(x, y, 16, 20, 'honey');
  p.rect(x + 1, y + 1, 14, 18, 'amber');
  p.rect(x + 2, y + 2, 12, 16, 'moss');
  p.rect(x + 5, y + 4, 6, 3, 'fog');
  p.rect(x + 5, y + 7, 6, 4, 'skin');
  px(p, x + 6, y + 8, 'ink');
  px(p, x + 9, y + 8, 'ink');
  p.rect(x + 4, y + 11, 8, 7, 'ink');
  p.rect(x + 7, y + 11, 2, 3, 'paper');
}

/** The red rug under you, with a pale border and fringe. */
function paintRug(p: Painter, x: number, y: number): void {
  p.rect(x, y, 40, 5, 'maroon');
  p.rect(x + 1, y + 1, 38, 1, 'rosy');
  p.rect(x + 1, y + 3, 38, 1, 'red');
  for (let i = 0; i < 40; i += 2) px(p, x + i, y + 5, 'paper');
}

/** His high-backed leather chair from (x, y), 14 wide, studded in brass; the desk hides its seat. */
function paintLeatherChair(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 12, 1, 'ink');
  p.rect(x, y + 1, 14, 20, 'ink');
  p.rect(x + 1, y + 1, 12, 20, 'maroon');
  p.rect(x + 2, y + 2, 2, 17, 'red');
  for (let i = 0; i < 4; i++) {
    px(p, x + 5 + (i % 2) * 4, y + 4 + i * 4, 'ink');
  }
  for (let i = 0; i < 10; i++) px(p, x + 1, y + 2 + i * 2, 'honey');
  for (let i = 0; i < 10; i++) px(p, x + 12, y + 2 + i * 2, 'honey');
}

/**
 * The broad desk: a dark top with a leather inlay, a carved front down to the
 * floor; on it the contract with the fountain pen lying across it, the green
 * banker's lamp and a stack of thick books.
 */
function paintDesk(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x = ox + TABLE.x;
  const top = oy + TABLE.top;
  const w = 82;
  const edge = top + TABLE_DEPTH;
  ditherRect(p, x + 1, floorTop + 1, w, 4, 'ink', 8);
  // the front, in carved panels, and its plinth
  p.rect(x, edge, w, floorTop + 4 - edge, 'plum');
  p.rect(x, edge, w, 1, 'amber');
  for (let px0 = x + 3; px0 + 14 < x + w; px0 += 19) {
    p.rect(px0, edge + 3, 15, floorTop - edge - 2, 'maroon');
    p.rect(px0 + 1, edge + 4, 13, floorTop - edge - 4, 'plum');
    px(p, px0 + 7, edge + 6, 'honey');
  }
  p.rect(x, floorTop + 2, w, 2, 'ink');
  // the top and its leather inlay
  p.rect(x, top, w, TABLE_DEPTH, 'ember');
  p.rect(x + 1, top, w - 2, 1, 'amber');
  p.rect(x + 22, top + 1, 46, 3, 'moss');
  p.rect(x + 22, top + 1, 46, 1, 'leaf');
  p.rect(x, edge - 1, w, 1, 'plum');

  // the contract, its pages fanned, the fountain pen across it
  const cx = ox + 62;
  p.rect(cx, top + 1, 12, 3, 'paper');
  p.rect(cx + 1, top, 10, 1, 'fog');
  px(p, cx + 2, top + 2, 'stone');
  p.rect(cx + 4, top + 2, 5, 1, 'stone');
  p.rect(cx + 2, top + 3, 7, 1, 'fog');
  p.rect(cx + 6, top + 1, 7, 1, 'ink');
  px(p, cx + 13, top + 1, 'honey');
  px(p, cx + 6, top + 1, 'honey');
  // the banker's lamp: brass foot and stem, a green glass shade lit underneath
  const lx = ox + 96;
  p.rect(lx + 1, top - 1, 9, 2, 'honey');
  p.rect(lx + 1, top, 9, 1, 'amber');
  p.rect(lx + 5, top - 6, 1, 5, 'honey');
  p.rect(lx, top - 9, 11, 3, 'leaf');
  p.rect(lx + 1, top - 10, 9, 1, 'moss');
  p.rect(lx, top - 7, 11, 1, 'moss');
  p.rect(lx + 1, top - 6, 9, 1, 'lamp');
  px(p, lx + 2, top - 9, 'paper');
  // a stack of thick books at the far corner
  const bx = ox + 108;
  p.rect(bx, top - 3, 10, 3, 'maroon');
  p.rect(bx + 1, top - 6, 9, 3, 'denim');
  p.rect(bx, top - 8, 10, 2, 'moss');
  p.rect(bx + 9, top - 8, 1, 8, 'paper');
  px(p, bx + 2, top - 2, 'honey');
  px(p, bx + 3, top - 5, 'honey');
}

export const LEGAL_STAGE: StageConfig = {
  paint: paintRoomScene,
  backdrops: { client: paintCallScene, lawyer: paintLawOffice },
  cast: {
    guide: GUIDE_ACTOR,
    // Everyone across the table stands behind it; it hides them below its far edge.
    manager: { sprite: MANAGER_SPRITE, ...AT_HEAD, side: 'right', clipBottom: TABLE.top },
    // Mr. Hughes is always at the screen end: in the call panel on a video
    // call, in front of the dark screen when he has flown in to sign.
    client: {
      sprite: CLIENT_SPRITE,
      ...BY_SCREEN,
      side: 'right',
      clipBottom: TABLE.top,
      beside: { ...BY_SCREEN },
    },
    // Alone, Mr. Shaw is at his own desk (the law office backdrop); in a
    // meeting he stands nearer your end of the table.
    lawyer: {
      sprite: LAWYER_SPRITE,
      ...AT_HEAD,
      side: 'right',
      clipBottom: TABLE.top,
      beside: { ...NEAR_END },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 84, y: 17 } },
  rest: {
    left: { x: 32, y: PROP_TOP },
    right: { x: 40, y: PROP_TOP },
  },
};
