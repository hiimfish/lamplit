import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { COWORKER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The email stage: your own desk at Harbor Trading on a January evening, seen
 * from close by. From the left: your swivel chair pushed back under a shelf of
 * binders (you stand beside it), then the desk against its teal screen: a big
 * monitor with an email open (an envelope, a few lines, a send button), a mug,
 * the keyboard, sticky notes on the screen behind. Handed-over things rest on
 * the desktop to the right of the envelope. Dan leans in at the desk's far end;
 * his own desk, with one of the company's glass lamps lit on it, stands under
 * the window onto the harbour at dusk. Ms. Carter stands where Dan stands when
 * she is alone, and in front of his desk when he is there too. Painted through
 * the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a calendar and a clock, a long shelf of
 * sample lamps and boxes, taller windows, then a darker upper wall with high
 * windows onto the night sky), and the office goes on to both sides: windows
 * over low cabinets, the other desks with their lamps left on, a bookcase.
 */

/** Your desk: its left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 35, w: 52, top: 50 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;
/** Dan's desk under the window; it runs on past the core's right edge. */
const NEXT_DESK = { x: 101, w: 46 } as const;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The top of the screens that stand behind the desks. */
const SCREEN_TOP = 26;
/** The big monitor's outer frame: where it stands on your desk. */
const MONITOR = { x: 37, y: 13 } as const;
/** The window in the core: its outer frame. */
const WINDOW = { x: 95, y: 5, w: 31, h: 30 } as const;
/** Where the people at the desk's far end stand. */
const BY_DESK = { x: 84, y: 39 } as const;
/** Width of one bay beside the core, and where the bays to the right start (past Dan's desk). */
const BAY_W = 48;
const RIGHT_BAYS_X = NEXT_DESK.x + NEXT_DESK.w + 3;
/** Wall above the core needed for the calendar and clock, and for the long shelf. */
const CALENDAR_MIN = 20;
const SHELF_MIN = 46;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

type Bay = 'window' | 'desk' | 'shelves';
/** A colour and its shade. */
type Tones = readonly [PaletteName, PaletteName];

const GREEN_GLASS: Tones = ['leaf', 'moss'];
const TEAL_GLASS: Tones = ['teal', 'moss'];
const ROSE_GLASS: Tones = ['rosy', 'mauve'];
const BLUE_GLASS: Tones = ['sky', 'denim'];

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

/** Paints the office around your desk to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind].
  const bays: [number, Bay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'desk']);
  }
  for (let x = ox + RIGHT_BAYS_X, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i === 0 ? 'shelves' : i % 2 === 1 ? 'window' : 'desk']);
  }
  // Pendant lamps hang over your desk and over every bay without a window.
  const lamps = [ox + 61];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= CALENDAR_MIN) {
    if (ox + 9 >= 0) paintCalendar(p, ox + 9, oy - 19);
    paintClock(p, ox + 82, oy - 9);
  }
  if (oy >= SHELF_MIN) {
    paintSampleShelf(p, ox + 4, oy - 26);
    for (const [x, kind] of bays) if (kind === 'desk') paintBoxShelf(p, x + 6, oy - 26, x - ox);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') {
      paintWindow(p, x + 7, winTop, 34, winH, ox);
      paintLowCabinet(p, x + 5, oy + 43, floorTop, x - ox);
      paintPlant(p, x + 37, oy + 38);
    } else if (kind === 'desk') {
      paintOtherDesk(p, x, oy, floorTop, x - ox);
    } else {
      paintBookcase(p, x + 8, oy + 12, 32, floorTop, x - ox);
    }
  }

  // The core, left of your desk: the shelf of binders and your chair.
  paintWallShelf(p, ox + 2, oy + 26);
  paintChair(p, ox + 2, floorTop);

  // The window, and Dan's desk under it with his monitor and a lit glass lamp.
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);
  const nx = ox + NEXT_DESK.x;
  glowEllipse(p, nx + 21, deskTop - 5, 12, 9, 'honey', [0.34, 0.18]);
  paintDesk(p, nx, deskTop, NEXT_DESK.w, floorTop);
  paintSmallMonitor(p, nx + 1, deskTop, true);
  paintGlassLamp(p, nx + 17, deskTop, GREEN_GLASS, true);
  p.rect(nx + 30, deskTop - 2, 9, 2, 'paper'); // papers on the far half of his desk
  p.rect(nx + 30, deskTop - 1, 9, 1, 'fog');
  paintChairBack(p, nx + 28, floorTop);

  // Your desk: the screen behind it, the big monitor, and what lies on the top.
  const dx = ox + DESK.x;
  paintScreen(p, dx, oy + SCREEN_TOP, DESK.w, deskTop);
  glowEllipse(p, ox + MONITOR.x + 17, oy + MONITOR.y + 13, 23, 18, 'paper', [0.2, 0.1]);
  paintDesk(p, dx, deskTop, DESK.w, floorTop);
  paintUnderDesk(p, dx, floorTop);
  paintMonitor(p, ox + MONITOR.x, oy + MONITOR.y, deskTop);
  paintDeskThings(p, dx, deskTop);
}

// ---------------------------------------------------------------------------
// Room

/** The dark lower wall under a pale rail, with a skirting board. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'plum');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'concrete');
  for (let x = mod(ox + 3, 12) - 12; x < w; x += 12) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'maroon');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Office carpet: slate with a small diamond pattern, counted from the core so it never shifts. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = mod(ox + (row % 2) * 4, 8) - 8; x < w; x += 8) px(p, x, y, 'stone');
  }
}

/** A brass pendant lamp hanging from the ceiling (`from`) down to the core. */
function paintPendant(p: Painter, cx: number, from: number, oy: number): void {
  p.rect(cx, from, 1, oy + 3 - from, 'ink');
  p.rect(cx - 1, oy + 3, 3, 1, 'ember');
  p.rect(cx - 2, oy + 4, 5, 1, 'amber');
  p.rect(cx - 3, oy + 5, 7, 1, 'amber');
  p.rect(cx - 4, oy + 6, 9, 1, 'ember');
  p.rect(cx - 2, oy + 7, 5, 1, 'honey');
  px(p, cx - 2, oy + 5, 'lamp');
}

/**
 * The wall above `cornice` on a tall stage: a darker band under the ceiling
 * with a ribbon of high windows onto the night sky.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'concrete');
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  const wh = Math.min(60, cornice - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((cornice - wh) / 2));
    const first = Math.floor(-(ox + 64) / HIGH_GAP) - 1;
    for (let k = first; ox + 64 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 64 + k * HIGH_GAP, top, wh, k);
    }
  }
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'fog');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

/** One high window centred on `cx`: the night sky with stars, a thin moon in every third. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 21, top - 1, 43, wh + 2, 'paper');
  ditherGradient(p, cx - 20, top, 41, wh, ['deep', 'deep', 'indigo', 'dusk']);
  for (let i = 0; i < 7; i++) {
    const sx = cx - 19 + Math.floor(hash2(i, n, 331) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 337) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 347) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 1) {
    p.rect(cx - 12, top + 4, 2, 5, 'paper');
    px(p, cx - 10, top + 4, 'paper');
    px(p, cx - 10, top + 8, 'paper');
  }
  p.rect(cx, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the view, in pixels; it repeats so every window shows a piece of it. */
const VIEW_P = 120;

/**
 * The harbour at dusk through a window: its glass from (x, y), w x h.
 * Positions count from the core's left edge `ox`, so windows side by side
 * show one continuous view.
 */
function paintHarbour(
  target: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
): void {
  const p = within(target, x, y, w, h);
  // The horizon sits a fixed way up from the sill, so a taller window only shows more sky.
  const horizon = y + h - 9;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const vx = mod(x + i - ox, VIEW_P);
    // an early star
    if (hash2(vx, 3, 211) < 0.05) {
      px(p, x + i, y + 1 + Math.floor(hash2(vx, 4, 223) * Math.max(3, horizon - y - 12)), 'fog');
    }
    // the far shore: low hills with a few lights
    const turn = (vx / VIEW_P) * Math.PI * 2;
    const bump = Math.max(0, Math.round(1.4 + Math.sin(turn * 3) + Math.sin(turn * 8) * 0.6));
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(vx, 5, 227) < 0.14) px(p, x + i, horizon, hash2(vx, 6, 229) < 0.5 ? 'honey' : 'lamp');
    // glints of the afterglow on the water
    if (vx % 6 === 0 && hash2(vx, 1, 233) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(vx, 2, 239) * 5);
      p.rect(x + i, gy, 2 + (vx % 3), 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 40) / VIEW_P) - 1;
  for (let k = first; ox + k * VIEW_P < x + w + 40; k++) {
    const base = ox + k * VIEW_P;
    paintCrane(p, base + 112, horizon, 9);
    paintShip(p, base + 99, horizon + 5, 17);
    paintShip(p, base + 34, horizon + 4, 24);
    paintCrane(p, base + 70, horizon, 7);
  }
}

/** A container crane on the far quay: two legs, a boom out over the water, a stay to its tip. */
function paintCrane(p: Painter, x: number, horizon: number, tall: number): void {
  const boom = horizon - tall;
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 5, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 6, 1, 'ink');
  p.rect(x - 11, boom, 20, 1, 'ink');
  p.rect(x + 2, boom - 5, 1, 5, 'ink');
  for (let i = 1; i < 13; i++) px(p, x + 2 - i, boom - 5 + Math.floor((i * 5) / 13), 'ink');
  for (let i = 1; i < 5; i++) px(p, x + 2 + i, boom - 5 + i, 'ink');
  px(p, x + 2, boom - 6, 'red');
  p.rect(x - 7, boom + 1, 2, 2, 'night');
  px(p, x - 6, boom + 3, 'night');
}

/** A moored ship, its bow to the left: dark hull, containers on deck, the bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number, len: number): void {
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  p.rect(x + 2, waterline - 2, len - 3, 1, 'maroon');
  const colours: readonly PaletteName[] = ['teal', 'ember', 'maroon', 'denim'];
  for (let c = 0, cx = x + 3; cx + 3 < x + len - 6; cx += 4, c++) {
    p.rect(cx, waterline - 6, 3, 2, colours[c % colours.length] ?? 'teal');
  }
  const bx = x + len - 6;
  p.rect(bx, waterline - 8, 4, 4, 'night');
  px(p, bx + 1, waterline - 7, 'honey');
  p.rect(bx + 2, waterline - 10, 1, 2, 'ink');
  px(p, bx + 1, waterline + 1, 'lamp');
}

/**
 * A window with a white frame and sill: the harbour behind the glass, a mullion
 * down the middle, the blind pulled a little way down.
 */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  // the blind: a few slats and its cord
  for (let i = 0; i < 3; i++) p.rect(x + 2, y + 2 + i * 2, w - 4, 1, 'paper');
  p.rect(x + 2, y + 7, w - 4, 1, 'fog');
  p.rect(x + w - 4, y + 8, 1, 5, 'fog');
  // the sill and its shadow
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Your desk

/** The felt screen standing behind a desk, from `top` down to the desktop. */
function paintScreen(p: Painter, x: number, top: number, w: number, deskTop: number): void {
  p.rect(x, top, w, deskTop - top, 'teal');
  // the weave of the felt: a sparse, even grid of darker stitches
  for (let yy = top + 5, row = 0; yy < deskTop - 1; yy += 3, row++) {
    for (let xx = x + 3 + (row % 2) * 3; xx < x + w - 2; xx += 6) px(p, xx, yy, 'moss');
  }
  p.rect(x, top + 2, w, 1, 'moss');
  p.rect(x, top, w, 1, 'paper');
  p.rect(x, top + 1, w, 1, 'concrete');
  p.rect(x, top, 1, deskTop - top, 'concrete');
  p.rect(x + w - 1, top, 1, deskTop - top, 'moss');
}

/**
 * A desk seen from the front: a pale wooden top, a board between the end
 * panels, a pedestal of two drawers at the right end.
 */
function paintDesk(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w, 1, 'night'); // its shadow on the carpet
  p.rect(x, top + 2, 2, foot - top - 2, 'ember');
  p.rect(x + 2, top + 2, w - 4, 5, 'ember');
  p.rect(x + 2, top + 6, w - 4, 1, 'plum');
  // the pedestal
  const dx = x + w - 17;
  p.rect(dx, top + 2, 17, foot - top - 2, 'amber');
  p.rect(dx, top + 2, 1, foot - top - 2, 'ember');
  p.rect(x + w - 2, top + 2, 2, foot - top - 2, 'ember');
  const half = Math.floor((foot - top - 2) / 2);
  for (let d = 0; d < 2; d++) {
    const dy = top + 2 + d * half;
    p.rect(dx + 1, dy + half - 1, 14, 1, 'ember');
    p.rect(dx + 6, dy + 1, 4, 1, 'honey');
  }
  // the top, a pixel proud of the panels
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
}

/** Under your desk: a waste bin with a crumpled draft in it, and the computer. */
function paintUnderDesk(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  // the bin
  p.rect(x + 5, foot - 6, 7, 6, 'concrete');
  p.rect(x + 5, foot - 6, 7, 1, 'fog');
  p.rect(x + 11, foot - 5, 1, 5, 'stone');
  px(p, x + 6, foot - 3, 'stone');
  px(p, x + 8, foot - 2, 'stone');
  p.rect(x + 7, foot - 8, 3, 2, 'paper');
  px(p, x + 9, foot - 8, 'fog');
  // the computer
  p.rect(x + 17, foot - 9, 7, 9, 'night');
  p.rect(x + 17, foot - 9, 7, 1, 'stone');
  p.rect(x + 19, foot - 6, 3, 1, 'slate');
  px(p, x + 18, foot - 7, 'cyan');
}

/**
 * The big monitor at (x, y), 34 wide, on a stand down to the desktop. On the
 * screen an email: a title bar, a column of folders, an envelope with an
 * unread mark, lines of text and a send button. No readable letters.
 */
function paintMonitor(p: Painter, x: number, y: number, deskTop: number): void {
  // the stand
  p.rect(x + 15, y + 27, 4, deskTop - y - 29, 'slate');
  p.rect(x + 15, y + 27, 1, deskTop - y - 29, 'stone');
  p.rect(x + 10, deskTop - 3, 14, 1, 'stone');
  p.rect(x + 9, deskTop - 2, 16, 2, 'night');
  // the case, its corners cut
  p.rect(x + 1, y, 32, 27, 'ink');
  p.rect(x, y + 1, 34, 25, 'ink');
  p.rect(x + 2, y + 24, 30, 2, 'night');
  px(p, x + 30, y + 24, 'cyan');
  // the screen
  const sx = x + 2;
  const sy = y + 2;
  p.rect(sx, sy, 30, 21, 'paper');
  p.rect(sx, sy, 30, 3, 'denim');
  p.rect(sx + 1, sy + 1, 7, 1, 'sky');
  px(p, sx + 28, sy + 1, 'red');
  px(p, sx + 26, sy + 1, 'honey');
  // folders down the left
  p.rect(sx, sy + 3, 4, 18, 'fog');
  for (let i = 0; i < 5; i++) p.rect(sx + 1, sy + 5 + i * 3, 2, 1, i === 0 ? 'denim' : 'concrete');
  // the envelope on its tile, an unread mark at its corner
  p.rect(sx + 5, sy + 5, 15, 11, 'denim');
  p.rect(sx + 6, sy + 6, 13, 9, 'paper');
  for (let i = 0; i < 7; i++) {
    px(p, sx + 6 + i, sy + 6 + i, 'denim');
    px(p, sx + 18 - i, sy + 6 + i, 'denim');
  }
  p.rect(sx + 6, sy + 14, 13, 1, 'fog');
  p.rect(sx + 18, sy + 4, 3, 3, 'red');
  // who it is from, what it is about, and the first lines of the letter
  p.rect(sx + 22, sy + 5, 7, 1, 'slate');
  p.rect(sx + 22, sy + 7, 5, 1, 'concrete');
  p.rect(sx + 22, sy + 10, 7, 1, 'fog');
  p.rect(sx + 22, sy + 12, 6, 1, 'fog');
  p.rect(sx + 22, sy + 14, 7, 1, 'fog');
  // the send button; the rest of the page is still empty
  p.rect(sx + 5, sy + 17, 7, 3, 'lamp');
  p.rect(sx + 7, sy + 18, 3, 1, 'paper');
  // sticky notes around the frame
  p.rect(x + 32, y + 6, 4, 4, 'honey');
  p.rect(x + 32, y + 9, 4, 1, 'lamp');
  p.rect(x + 32, y + 12, 4, 4, 'rosy');
  p.rect(x + 32, y + 15, 4, 1, 'mauve');
  p.rect(x + 5, y - 2, 4, 4, 'honey');
  p.rect(x + 5, y + 1, 4, 1, 'lamp');
  p.rect(x - 2, y + 14, 4, 4, 'paper');
  p.rect(x - 2, y + 17, 4, 1, 'fog');
}

/** What lies on your desktop: a mug, the keyboard and mouse, a pad of notes, a pen. */
function paintDeskThings(p: Painter, x: number, top: number): void {
  // the mug, left of the stand, a thread of steam over it
  p.rect(x + 4, top - 5, 5, 5, 'red');
  p.rect(x + 4, top - 5, 5, 1, 'paper');
  p.rect(x + 4, top - 4, 1, 4, 'rosy');
  px(p, x + 9, top - 4, 'red');
  px(p, x + 10, top - 3, 'red');
  px(p, x + 9, top - 2, 'red');
  px(p, x + 6, top - 7, 'fog');
  px(p, x + 5, top - 9, 'fog');
  // the keyboard in front of the stand
  p.rect(x + 12, top - 2, 21, 2, 'fog');
  for (let i = 0; i < 10; i++) px(p, x + 13 + i * 2, top - 2, 'paper');
  p.rect(x + 12, top - 1, 21, 1, 'concrete');
  // the mouse
  p.rect(x + 35, top - 1, 3, 1, 'paper');
  px(p, x + 37, top - 1, 'fog');
  // a pad of sticky notes and a pen
  p.rect(x + 41, top - 2, 5, 2, 'honey');
  p.rect(x + 41, top - 1, 5, 1, 'lamp');
  p.rect(x + 47, top - 1, 4, 1, 'denim');
  px(p, x + 46, top - 1, 'ink');
}

// ---------------------------------------------------------------------------
// The rest of the office

/**
 * One of the company's glass desk lamps: a brass foot and stem under a long
 * glass shade, `x` the shade's left edge. Lit, its underside glows.
 */
function paintGlassLamp(p: Painter, x: number, base: number, glass: Tones, lit: boolean): void {
  p.rect(x + 2, base - 2, 5, 2, 'amber');
  p.rect(x + 2, base - 2, 5, 1, 'lamp');
  p.rect(x + 4, base - 7, 1, 5, 'amber');
  p.rect(x + 1, base - 11, 7, 1, glass[0]);
  p.rect(x, base - 10, 9, 3, glass[0]);
  p.rect(x, base - 8, 9, 1, glass[1]);
  px(p, x + 2, base - 10, 'paper');
  if (lit) p.rect(x + 1, base - 7, 7, 1, 'honey');
}

/** A small monitor on a desk, `x` its left edge: lit with a table of figures, or switched off. */
function paintSmallMonitor(p: Painter, x: number, deskTop: number, lit: boolean): void {
  const y = deskTop - 15;
  p.rect(x + 6, y + 11, 3, 2, 'slate');
  p.rect(x + 4, y + 13, 7, 2, 'night');
  p.rect(x, y, 15, 11, 'ink');
  p.rect(x + 1, y + 1, 13, 8, lit ? 'sky' : 'night');
  if (lit) {
    p.rect(x + 1, y + 1, 13, 2, 'denim');
    p.rect(x + 2, y + 4, 7, 1, 'paper');
    p.rect(x + 2, y + 6, 10, 1, 'paper');
    px(p, x + 11, y + 4, 'honey');
  } else {
    p.rect(x + 2, y + 2, 2, 1, 'slate');
    px(p, x + 2, y + 3, 'slate');
  }
}

/** Your swivel chair seen from the side, its back to the left. */
function paintChair(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  // the base and its casters
  p.rect(x + 2, foot - 1, 11, 1, 'ink');
  px(p, x + 2, foot, 'night');
  px(p, x + 7, foot, 'night');
  px(p, x + 12, foot, 'night');
  p.rect(x + 7, foot - 6, 1, 5, 'ink');
  // the seat
  p.rect(x + 2, foot - 9, 12, 3, 'denim');
  p.rect(x + 2, foot - 9, 12, 1, 'sky');
  p.rect(x + 2, foot - 7, 12, 1, 'indigo');
  // the back
  p.rect(x + 1, foot - 21, 3, 13, 'denim');
  p.rect(x + 3, foot - 21, 1, 12, 'sky');
  p.rect(x + 1, foot - 21, 1, 13, 'indigo');
  p.rect(x + 2, foot - 22, 2, 1, 'denim');
  // the armrest
  p.rect(x + 5, foot - 13, 6, 1, 'ink');
  p.rect(x + 9, foot - 12, 1, 3, 'ink');
}

/** A swivel chair pushed in under a desk, seen from behind. */
function paintChairBack(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot - 1, 9, 1, 'ink');
  px(p, x + 1, foot, 'night');
  px(p, x + 9, foot, 'night');
  p.rect(x + 5, foot - 6, 1, 5, 'ink');
  p.rect(x + 1, foot - 8, 9, 2, 'indigo');
  p.rect(x, foot - 18, 11, 10, 'denim');
  p.rect(x + 1, foot - 19, 9, 1, 'denim');
  p.rect(x + 1, foot - 18, 9, 1, 'sky');
  p.rect(x, foot - 10, 11, 2, 'indigo');
  p.rect(x + 10, foot - 17, 1, 9, 'indigo');
}

/** Binder colours: spine and its shade. */
const BINDERS: readonly Tones[] = [
  ['denim', 'indigo'],
  ['red', 'maroon'],
  ['teal', 'moss'],
  ['lamp', 'amber'],
  ['paper', 'concrete'],
  ['leaf', 'moss'],
  ['sky', 'denim'],
];

/** A row of binders standing on a shelf at `bottom`, from x0 to x1, with a gap here and there. */
function paintBinders(p: Painter, x0: number, x1: number, bottom: number, seed: number): void {
  for (let x = x0, i = 0; x + 3 <= x1; x += 3, i++) {
    if (hash2(i, seed, 257) < 0.12) continue;
    const [spine, shade] = BINDERS[Math.floor(hash2(i, seed, 263) * BINDERS.length)] ?? [
      'denim',
      'indigo',
    ];
    const bh = 8 + Math.floor(hash2(i, seed, 269) * 2);
    p.rect(x, bottom - bh, 3, bh, spine);
    p.rect(x + 2, bottom - bh, 1, bh, shade);
    px(p, x + 1, bottom - bh + 2, spine === 'paper' ? 'stone' : 'paper');
    px(p, x + 1, bottom - 2, shade);
  }
}

/** A cardboard box of stock with a label, standing on `bottom`. */
function paintBox(p: Painter, x: number, bottom: number, bw: number, bh: number): void {
  p.rect(x, bottom - bh, bw, bh, 'tan');
  p.rect(x + bw - 1, bottom - bh, 1, bh, 'ember');
  p.rect(x, bottom - bh, bw, 1, 'skin');
  p.rect(x + 2, bottom - bh + 2, 3, 2, 'paper');
}

/** A wooden shelf board with a bracket near each end. */
function paintBoard(p: Painter, x: number, y: number, w: number): void {
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  for (const bx of [x + 3, x + w - 4]) {
    p.rect(bx, y + 2, 1, 3, 'ember');
    px(p, bx + 1, y + 2, 'ember');
  }
}

/** The shelf by your desk: binders, a box and a small trailing plant. */
function paintWallShelf(p: Painter, x: number, y: number): void {
  paintBoard(p, x, y, 28);
  paintBinders(p, x + 1, x + 14, y, 5);
  paintBox(p, x + 15, y, 7, 6);
  p.rect(x + 23, y - 3, 4, 3, 'amber');
  p.rect(x + 23, y - 5, 4, 2, 'leaf');
  px(p, x + 24, y - 6, 'leaf');
  px(p, x + 27, y - 3, 'moss');
  px(p, x + 27, y - 2, 'leaf');
  px(p, x + 22, y - 4, 'moss');
}

/** The long shelf up the wall: sample lamps in their different glass between boxes of stock. */
function paintSampleShelf(p: Painter, x: number, y: number): void {
  paintBoard(p, x, y, 86);
  paintBox(p, x + 2, y, 9, 7);
  paintBox(p, x + 3, y - 7, 7, 4);
  paintGlassLamp(p, x + 14, y, TEAL_GLASS, false);
  paintBinders(p, x + 26, x + 41, y, 3);
  paintGlassLamp(p, x + 44, y, ROSE_GLASS, false);
  // (the cord of the lamp over your desk comes down here)
  paintGlassLamp(p, x + 62, y, BLUE_GLASS, false);
  paintBox(p, x + 74, y, 8, 6);
}

/** A shorter shelf of boxes and binders over one of the other desks. */
function paintBoxShelf(p: Painter, x: number, y: number, seed: number): void {
  paintBoard(p, x, y, 36);
  paintBinders(p, x + 2, x + 17, y, seed + 11);
  paintBox(p, x + 19, y, 8, 7);
  paintBox(p, x + 28, y, 6, 5);
}

/** A wall calendar: a red head, the days as dots, one of them ringed. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x, y, 16, 16, 'paper');
  p.rect(x, y, 16, 4, 'red');
  px(p, x + 4, y - 1, 'ink');
  px(p, x + 11, y - 1, 'ink');
  p.rect(x + 3, y + 1, 6, 1, 'paper');
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      if (r === 4 && c > 2) break;
      px(p, x + 1 + c * 2, y + 6 + r * 2, c === 6 ? 'rosy' : 'concrete');
    }
  }
  px(p, x + 7, y + 10, 'red');
  p.rect(x + 1, y + 16, 16, 1, 'concrete');
}

/** A low filing cabinet under a window, a printer on it with a sheet coming out. */
function paintLowCabinet(p: Painter, x: number, top: number, floorTop: number, seed: number): void {
  const cw = 30;
  p.rect(x, top, cw, floorTop + 1 - top, 'concrete');
  p.rect(x, top, cw, 1, 'fog');
  p.rect(x + cw - 1, top + 1, 1, floorTop - top, 'stone');
  p.rect(x + 14, top + 1, 1, floorTop - top, 'stone');
  for (const hx of [x + 5, x + 20]) {
    p.rect(hx, top + 3, 4, 1, 'night');
    p.rect(hx, top + 8, 4, 1, 'night');
    p.rect(hx - 3, top + 6, 10, 1, 'stone');
  }
  // the printer, or a stack of binders lying flat
  if (hash2(seed, 0, 271) < 0.6) {
    p.rect(x + 3, top - 6, 13, 6, 'paper');
    p.rect(x + 3, top - 6, 13, 1, 'fog');
    p.rect(x + 15, top - 5, 1, 5, 'fog');
    p.rect(x + 5, top - 3, 9, 1, 'ink');
    p.rect(x + 6, top - 9, 7, 3, 'paper');
    p.rect(x + 7, top - 8, 4, 1, 'fog');
    px(p, x + 13, top - 5, 'leaf');
  } else {
    p.rect(x + 4, top - 2, 11, 2, 'denim');
    p.rect(x + 5, top - 4, 10, 2, 'red');
    p.rect(x + 4, top - 6, 11, 2, 'lamp');
    px(p, x + 5, top - 1, 'paper');
    px(p, x + 6, top - 3, 'paper');
    px(p, x + 5, top - 5, 'paper');
  }
}

/** A wooden bookcase of binders from `top` to the floor, cupboard doors at the bottom. */
function paintBookcase(
  p: Painter,
  x: number,
  top: number,
  w: number,
  floorTop: number,
  seed: number,
): void {
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, bottom - top - 15, 'plum');
  for (let s = 0, sy = top + 12; sy < bottom - 13; sy += 11, s++) {
    paintBinders(p, x + 2, x + w - 2, sy, seed + s * 7);
    p.rect(x + 2, sy, w - 4, 1, 'amber');
  }
  const cy = bottom - 12;
  p.rect(x + 1, cy, w - 2, 1, 'amber');
  const half = Math.floor((w - 4) / 2);
  for (const dx of [2, 2 + half]) {
    p.rect(x + dx, cy + 2, half - 1, 8, 'amber');
    p.rect(x + dx + half - 2, cy + 2, 1, 8, 'ember');
  }
  px(p, x + half, cy + 5, 'honey');
  px(p, x + 3 + half, cy + 5, 'honey');
  // boxes of stock on top, clear of the pendant lamp
  paintBox(p, x + 1, top, 9, 6);
  paintBox(p, x + 23, top, 7, 5);
}

/** One of the other desks: its screen, a monitor gone dark, a glass lamp left on, the chair pushed in. */
function paintOtherDesk(p: Painter, x: number, oy: number, floorTop: number, seed: number): void {
  const top = oy + DESK.top;
  const glass =
    [ROSE_GLASS, BLUE_GLASS, GREEN_GLASS][mod(Math.floor(seed / BAY_W), 3)] ?? ROSE_GLASS;
  paintScreen(p, x + 3, oy + SCREEN_TOP, 42, top);
  // a note or two pinned up
  p.rect(x + 7, oy + SCREEN_TOP + 4, 4, 4, hash2(seed, 1, 277) < 0.5 ? 'honey' : 'paper');
  p.rect(x + 13, oy + SCREEN_TOP + 6, 4, 5, 'paper');
  p.rect(x + 14, oy + SCREEN_TOP + 8, 2, 1, 'fog');
  glowEllipse(p, x + 36, top - 5, 11, 9, 'honey', [0.34, 0.18]);
  paintDesk(p, x + 3, top, 42, floorTop);
  paintSmallMonitor(p, x + 6, top, false);
  paintGlassLamp(p, x + 32, top, glass, true);
  paintChairBack(p, x + 17, floorTop);
}

export const EMAIL_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    coworker: { sprite: COWORKER_SPRITE, ...BY_DESK, side: 'right' },
    // Alone she stands where Dan stands; with Dan there too she stands in front of his desk.
    manager: {
      sprite: MANAGER_SPRITE,
      ...BY_DESK,
      side: 'right',
      beside: { x: 96, y: BY_DESK.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 89, y: 25 } },
  rest: {
    left: { x: DESK.x + 16, y: PROP_TOP },
    right: { x: DESK.x + 28, y: PROP_TOP },
  },
};
