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

/**
 * The office stage: the open office of Harbor Trading late on a November
 * day. From the left: the copy corner (the copier, a wall shelf of supplies
 * over it; you stand beside it), then two desks side by side against a low
 * partition, under a wide window onto the harbour at dusk. The nearer desk is
 * yours, still almost empty: a monitor at its end, and the things handed over
 * rest on its top. Dan stands at his own desk, the next one along: his
 * monitor, one of the company's glass desk lamps (lit) and his chair. A
 * pinboard hangs on the wall behind him. Painted through the Painter
 * interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (taller windows, a clock, the air
 * conditioner, a poster of the lamp and the company's anchor, then a darker
 * upper wall with high windows onto the night sky). To the left are the open
 * door of the small kitchen, then windows with the printer and the water
 * cooler under them and filing cabinets; to the right the row of desks goes
 * on, each with its monitor, lamp and chair.
 */

/** Your desk: its left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 37, w: 48, top: 48 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;
/** Dan's desk starts where yours ends; he stands in front of its near end. */
const DAN_DESK_X = DESK.x + DESK.w;
const DAN = { x: 84, y: 39 } as const;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The low partition behind the desks: where it starts and the y of its top. */
const PARTITION = { x: 35, top: 35 } as const;
/** The wide window in the core: its outer frame. */
const WINDOW = { x: 42, y: 4, w: 59, h: 27 } as const;
/** The two pendant lamps of the core, either side of the window. */
const LAMPS = [36, 106] as const;
/** Width of one bay to the left of the core. */
const BAY_W = 44;
/** Wall above the core needed for the clock and air conditioner, and for the poster and emblem. */
const CLOCK_MIN = 20;
const POSTER_MIN = 46;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a window's glass, a doorway). */
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

/** Paints the office to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // Bays to the left of the core: [left x, kind].
  const bays: [number, 'kitchen' | 'window' | 'cabinet'][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i === 0 ? 'kitchen' : i % 2 === 1 ? 'window' : 'cabinet']);
  }
  // To the right the desks go on, one every DESK.w, a window over each.
  const desks: number[] = [];
  for (let x = ox + DAN_DESK_X + DESK.w; x < w; x += DESK.w) desks.push(x);

  const lamps: number[] = LAMPS.map((x) => ox + x);
  for (const [x, kind] of bays) if (kind === 'cabinet') lamps.push(x + BAY_W / 2);
  for (const x of desks) lamps.push(x + DESK.w - 3);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= CLOCK_MIN) {
    paintClock(p, ox + 24, oy - 8);
    paintAircon(p, ox + 109, oy - 14);
  }
  if (oy >= POSTER_MIN) {
    paintPoster(p, ox + 14, oy - 40);
    paintEmblem(p, ox + 64, oy - 41);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'kitchen') paintKitchen(p, x, oy, floorTop);
    else if (kind === 'window') {
      paintWindow(p, x + 5, winTop, 34, winH, ox, 2);
      paintPrinterBay(p, x, oy, floorTop);
    } else paintCabinetBay(p, x, oy, floorTop);
  }

  // The back wall of the core: the supply shelf, the window, the pinboard.
  paintSupplyShelf(p, ox + 2, oy + 6);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox, 3);
  paintPinboard(p, ox + 109, oy + 9);
  for (const x of desks) paintWindow(p, x + 5, winTop, 34, winH, ox, 2);
  for (const lx of lamps) paintLamp(p, lx, cornice, oy);

  paintPartition(p, ox + PARTITION.x, w, oy + PARTITION.top, floorTop);
  paintCopier(p, ox + 1, floorTop);

  // The desks, far ones first.
  desks.forEach((x, i) => {
    paintDesk(p, x, deskTop, floorTop);
    paintDeskKit(p, x, deskTop, floorTop, {
      screen: i % 3 === 1 ? 'sheet' : 'off',
      shade: SHADES[i % SHADES.length] ?? 'rosy',
      lit: i % 2 === 1,
    });
  });
  paintDesk(p, ox + DAN_DESK_X, deskTop, floorTop);
  paintDeskKit(p, ox + DAN_DESK_X, deskTop, floorTop, {
    screen: 'sheet',
    shade: 'teal',
    lit: true,
  });
  paintDesk(p, ox + DESK.x, deskTop, floorTop);
  paintMyDesk(p, ox + DESK.x, deskTop, floorTop);
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
function paintLamp(p: Painter, cx: number, from: number, oy: number): void {
  p.rect(cx, from, 1, oy + 3 - from, 'ink');
  p.rect(cx - 1, oy + 3, 3, 1, 'ember');
  p.rect(cx - 2, oy + 4, 5, 1, 'amber');
  p.rect(cx - 3, oy + 5, 7, 1, 'amber');
  p.rect(cx - 4, oy + 6, 9, 1, 'ember');
  p.rect(cx - 2, oy + 7, 5, 1, 'honey');
  px(p, cx - 2, oy + 5, 'lamp');
}

/**
 * The low partition behind the desks, from x0 to the right edge: blue cloth
 * panels with a pale cap. It is the calm ground the handed-over things are
 * seen against, and what Dan's head is seen against.
 */
function paintPartition(p: Painter, x0: number, w: number, top: number, floorTop: number): void {
  p.rect(x0, top, w - x0, floorTop - top, 'denim');
  for (let x = x0 + 24; x < w; x += 24) p.rect(x, top + 2, 1, floorTop - top - 2, 'indigo');
  p.rect(x0, top, w - x0, 1, 'sky');
  p.rect(x0, floorTop - 1, w - x0, 1, 'night');
  // the end post
  p.rect(x0 - 1, top, 2, floorTop + 1 - top, 'indigo');
  px(p, x0 - 1, top, 'sky');
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
    const first = Math.floor(-(ox + 71) / HIGH_GAP) - 1;
    for (let k = first; ox + 71 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 71 + k * HIGH_GAP, top, wh, k);
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
    px(p, cx - 13, top + 5, 'honey');
    px(p, cx - 13, top + 7, 'honey');
  }
  p.rect(cx - 7, top, 1, wh, 'paper');
  p.rect(cx + 7, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; the scene repeats so every window shows a piece of it. */
const HARBOUR_P = 150;

/**
 * The harbour at dusk seen through a window: its glass from (x, y), w x h.
 * Positions count from the core's left edge `ox`, so windows side by side
 * show one continuous view.
 */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  // The horizon sits a fixed way up from the sill, so a taller window only shows more sky.
  const horizon = y + h - 8;
  const sky: PaletteName[] =
    h > 30 ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy'] : ['indigo', 'violet', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    // a few early stars
    if (hash2(hx, 3, 211) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 223) * Math.max(3, horizon - y - 12)), 'fog');
    }
    // the far shore: low hills with lights
    const bump = Math.round(1.5 + Math.sin(hx / 8) + Math.sin(hx / 3.7) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 227) < 0.14) px(p, x + i, horizon, hash2(hx, 6, 229) < 0.5 ? 'honey' : 'lamp');
    // long glints of the afterglow on the water
    if (hx % 6 === 0 && hash2(hx, 1, 233) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 239) * 5);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 40) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 40; k++) {
    const base = ox + k * HARBOUR_P;
    paintCrane(p, base + 87, horizon, 6);
    paintCrane(p, base + 141, horizon, 7);
    paintShip(p, base + 48, horizon + 5, 22);
    paintShip(p, base + 4, horizon + 3, 14);
  }
}

/** A dockside crane against the sky: two legs, a boom out over the water to the left, stays. */
function paintCrane(p: Painter, x: number, horizon: number, tall: number): void {
  const boom = horizon - tall;
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 5, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 6, 1, 'ink');
  p.rect(x - 11, boom, 20, 1, 'ink');
  p.rect(x + 2, boom - 4, 1, 4, 'ink');
  for (let i = 1; i < 12; i++) px(p, x + 2 - i, boom - 4 + Math.floor((i * 4) / 12), 'ink');
  for (let i = 1; i < 5; i++) px(p, x + 2 + i, boom - 4 + i, 'ink');
  px(p, x + 2, boom - 5, 'red');
  // the trolley and its hook
  p.rect(x - 7, boom + 1, 2, 2, 'night');
  px(p, x - 7, boom + 3, 'night');
}

/** A moored ship, its bow to the left: dark hull, containers on deck, the bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number, len: number): void {
  p.rect(x + 1, waterline - 2, len - 1, 2, 'ink');
  p.rect(x, waterline - 3, len, 1, 'night');
  p.rect(x + 2, waterline - 1, len - 4, 1, 'maroon');
  const colours: readonly PaletteName[] = ['teal', 'ember', 'maroon', 'denim'];
  for (let c = 0, cx = x + 3; cx + 3 < x + len - 6; cx += 4, c++) {
    p.rect(cx, waterline - 5, 3, 2, colours[c % colours.length] ?? 'teal');
  }
  const bx = x + len - 6;
  p.rect(bx, waterline - 7, 4, 4, 'night');
  px(p, bx + 1, waterline - 6, 'honey');
  px(p, bx + 1, waterline + 1, 'lamp');
  px(p, x + 1, waterline - 5, 'lamp');
}

/**
 * A window with a white frame and sill: the harbour behind `panes` panes of
 * glass, a blind drawn a little way down from the top.
 */
function paintWindow(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
  panes: number,
): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  for (let i = 1; i < panes; i++) {
    p.rect(x + 2 + Math.floor(((w - 4) * i) / panes), y + 2, 1, h - 4, 'paper');
  }
  // the blind: a few slats, longer on a taller window
  const blind = 3 + Math.floor((h - WINDOW.h) / 3);
  for (let r = 0; r < blind; r++) p.rect(x + 2, y + 2 + r, w - 4, 1, r % 2 === 0 ? 'paper' : 'fog');
  p.rect(x + 2, y + 2 + blind, w - 4, 1, 'concrete');
  p.rect(x + w - 5, y + 3 + blind, 1, 4, 'fog');
  // the sill and its shadow
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The copy corner

/** A box file standing on a shelf whose board is at `bottom`. */
function paintBoxFile(p: Painter, x: number, bottom: number, c: PaletteName, shade: PaletteName) {
  p.rect(x, bottom - 8, 3, 8, c);
  p.rect(x + 2, bottom - 8, 1, 8, shade);
  px(p, x + 1, bottom - 6, 'paper');
}

/** One board of the wall shelf with its brackets and the shadow under it. */
function paintBoard(p: Painter, x: number, y: number, w: number): void {
  p.rect(x + 1, y + 2, w, 1, 'concrete');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  p.rect(x + 3, y + 2, 1, 2, 'ember');
  p.rect(x + w - 4, y + 2, 1, 2, 'ember');
}

/**
 * The wall shelf of office supplies over the copier, 29 wide: box files, a
 * carton and reams of paper on the top board; ink cartridges, folders and a
 * cup of pens on the lower one.
 */
function paintSupplyShelf(p: Painter, x: number, y: number): void {
  const w = 29;
  const top = y + 10;
  const low = y + 21;
  paintBoard(p, x, top, w);
  paintBoard(p, x, low, w);
  // top board
  paintBoxFile(p, x + 1, top, 'denim', 'indigo');
  paintBoxFile(p, x + 5, top, 'red', 'maroon');
  paintBoxFile(p, x + 9, top, 'teal', 'moss');
  p.rect(x + 13, top - 6, 8, 6, 'tan');
  p.rect(x + 13, top - 6, 8, 1, 'skin');
  p.rect(x + 16, top - 6, 2, 3, 'ember');
  for (let s = 0; s < 3; s++) {
    p.rect(x + 22, top - 2 - s * 2, 6, 2, 'paper');
    p.rect(x + 22, top - 1 - s * 2, 6, 1, 'fog');
    p.rect(x + 25, top - 2 - s * 2, 2, 2, 'sky');
  }
  // lower board: the four inks, folders, pens
  const inks: readonly PaletteName[] = ['cyan', 'neon', 'lamp', 'ink'];
  inks.forEach((c, i) => {
    p.rect(x + 1 + i * 4, low - 5, 3, 5, c);
    px(p, x + 2 + i * 4, low - 4, 'paper');
  });
  p.rect(x + 18, low - 7, 2, 7, 'lamp');
  p.rect(x + 20, low - 7, 2, 7, 'leaf');
  p.rect(x + 22, low - 6, 1, 6, 'rosy');
  px(p, x + 23, low - 1, 'rosy');
  p.rect(x + 25, low - 3, 3, 3, 'slate');
  p.rect(x + 25, low - 5, 1, 2, 'red');
  p.rect(x + 27, low - 5, 1, 2, 'denim');
  px(p, x + 26, low - 4, 'paper');
}

/** The copier, 20 wide, standing on the floor against the wall: feeder, panel, tray, paper drawers. */
function paintCopier(p: Painter, x: number, floorTop: number): void {
  const w = 20;
  const top = floorTop - 20;
  const bottom = floorTop + 2;
  p.rect(x, bottom, w + 1, 1, 'night');
  // the body, its right side in shade
  p.rect(x, top + 3, w, bottom - top - 3, 'fog');
  p.rect(x + w - 2, top + 3, 2, bottom - top - 3, 'concrete');
  p.rect(x, bottom - 1, w, 1, 'stone');
  // the document feeder on top, a few sheets waiting in it
  p.rect(x + 1, top, w - 6, 3, 'concrete');
  p.rect(x + 1, top, w - 6, 1, 'fog');
  p.rect(x + 3, top - 1, 9, 1, 'paper');
  p.rect(x, top + 3, w, 1, 'paper');
  // the control panel: a little screen, the start button
  p.rect(x + w - 9, top + 5, 8, 3, 'night');
  p.rect(x + w - 8, top + 6, 3, 1, 'cyan');
  px(p, x + w - 4, top + 6, 'leaf');
  px(p, x + w - 3, top + 6, 'red');
  // the output tray with a copy lying in it
  p.rect(x + 2, top + 9, w - 6, 3, 'slate');
  p.rect(x + 3, top + 11, w - 10, 1, 'paper');
  // two paper drawers
  for (let d = 0; d < 2; d++) {
    const dy = top + 13 + d * 4;
    p.rect(x + 1, dy, w - 4, 1, 'concrete');
    p.rect(x + 6, dy + 2, 5, 1, 'stone');
  }
}

/** A cork pinboard, 18 x 16, with a few notes pinned to it. */
function paintPinboard(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 16, 18, 1, 'concrete');
  p.rect(x, y, 18, 16, 'ember');
  p.rect(x + 1, y + 1, 16, 14, 'tan');
  p.rect(x + 2, y + 2, 5, 6, 'paper');
  p.rect(x + 3, y + 4, 3, 1, 'stone');
  p.rect(x + 3, y + 6, 2, 1, 'stone');
  p.rect(x + 9, y + 2, 4, 4, 'honey');
  p.rect(x + 8, y + 8, 7, 5, 'paper');
  p.rect(x + 9, y + 10, 5, 1, 'sky');
  p.rect(x + 3, y + 10, 3, 3, 'rosy');
  px(p, x + 4, y + 2, 'red');
  px(p, x + 11, y + 2, 'denim');
  px(p, x + 11, y + 8, 'red');
  px(p, x + 14, y + 4, 'leaf');
}

// ---------------------------------------------------------------------------
// The desks

/** Glass shades of the desk lamps down the row. */
const SHADES: readonly PaletteName[] = ['rosy', 'lamp', 'leaf', 'red'];

/** A bare desk, DESK.w wide: a wooden top on two legs, its shadow on the carpet. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w - 1, 1, 'night');
  for (const lx of [x + 1, x + w - 3]) {
    p.rect(lx, top + 2, 2, foot - top - 2, 'ember');
    p.rect(lx + 1, top + 2, 1, foot - top - 2, 'plum');
  }
  // the top, a pixel proud of the apron
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 2, 'ember');
  p.rect(x + 1, top + 4, w - 2, 1, 'plum');
  px(p, x + w - 1, top, 'amber');
}

/** A drawer unit under a desk, 11 wide: three drawers with brass pulls. */
function paintDrawers(p: Painter, x: number, top: number, floorTop: number): void {
  const y0 = top + 4;
  const foot = floorTop + 6;
  p.rect(x, y0, 11, foot - y0, 'ember');
  for (let dy = y0 + 1; dy + 2 < foot; dy += 3) {
    p.rect(x + 1, dy, 9, 2, 'amber');
    p.rect(x + 4, dy, 3, 1, 'honey');
  }
}

/** A flat monitor, 10 wide, on its stand on the desk: switched off, a login box, or a spreadsheet. */
function paintMonitor(p: Painter, x: number, deskTop: number, screen: 'off' | 'login' | 'sheet') {
  const y = deskTop - 11;
  p.rect(x, y, 10, 8, 'ink');
  if (screen === 'off') {
    p.rect(x + 1, y + 1, 8, 6, 'night');
    px(p, x + 2, y + 2, 'stone');
    px(p, x + 3, y + 2, 'stone');
    px(p, x + 2, y + 3, 'stone');
  } else if (screen === 'login') {
    p.rect(x + 1, y + 1, 8, 6, 'denim');
    p.rect(x + 1, y + 1, 8, 1, 'sky');
    p.rect(x + 3, y + 3, 4, 1, 'paper');
    p.rect(x + 3, y + 5, 4, 1, 'paper');
    px(p, x + 6, y + 5, 'lamp');
  } else {
    p.rect(x + 1, y + 1, 8, 6, 'sky');
    p.rect(x + 1, y + 1, 8, 1, 'denim');
    p.rect(x + 2, y + 3, 6, 1, 'paper');
    p.rect(x + 2, y + 5, 6, 1, 'paper');
    p.rect(x + 4, y + 3, 1, 3, 'sky');
    px(p, x + 6, y + 5, 'leaf');
  }
  p.rect(x + 4, y + 8, 2, 2, 'stone');
  p.rect(x + 2, y + 10, 6, 1, 'slate');
}

/**
 * One of the company's glass desk lamps, 7 wide: a brass foot and stem under
 * a dome of coloured glass. Lit, it throws warm light on the desk and the
 * partition behind it.
 */
function paintDeskLamp(p: Painter, x: number, deskTop: number, shade: PaletteName, lit: boolean) {
  if (lit) glowEllipse(p, x + 3, deskTop - 5, 10, 7, 'honey', [0.34, 0.2, 0.1]);
  p.rect(x + 1, deskTop - 1, 5, 1, 'amber');
  p.rect(x + 3, deskTop - 6, 1, 5, 'amber');
  p.rect(x + 1, deskTop - 10, 5, 1, shade);
  p.rect(x, deskTop - 9, 7, 3, shade);
  px(p, x + 1, deskTop - 9, lit ? 'paper' : 'fog');
  if (lit) {
    p.rect(x + 1, deskTop - 6, 5, 1, 'honey');
    p.rect(x + 2, deskTop - 5, 3, 1, 'lamp');
    px(p, x + 2, deskTop - 9, shade === 'teal' ? 'cyan' : 'honey');
  }
}

/** An office chair seen from the side, facing left: 12 wide, on a star base with casters. */
function paintChair(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x, foot, 12, 1, 'night');
  // the base and the gas lift
  p.rect(x + 1, foot - 2, 9, 1, 'ink');
  px(p, x + 1, foot - 1, 'ink');
  px(p, x + 5, foot - 1, 'ink');
  px(p, x + 9, foot - 1, 'ink');
  p.rect(x + 5, foot - 6, 1, 4, 'concrete');
  // the seat and the back
  p.rect(x, foot - 8, 10, 2, 'maroon');
  p.rect(x, foot - 7, 10, 1, 'plum');
  p.rect(x + 9, foot - 17, 2, 10, 'maroon');
  p.rect(x + 10, foot - 16, 1, 9, 'plum');
  px(p, x + 9, foot - 17, 'red');
  // the armrest
  p.rect(x + 4, foot - 11, 5, 1, 'ink');
  px(p, x + 4, foot - 10, 'ink');
  px(p, x + 4, foot - 9, 'ink');
}

/** What stands on and at a working desk whose left edge is x: monitor, lamp, drawers, chair. */
function paintDeskKit(
  p: Painter,
  x: number,
  deskTop: number,
  floorTop: number,
  kit: { screen: 'off' | 'sheet'; shade: PaletteName; lit: boolean },
): void {
  paintDrawers(p, x + 35, deskTop, floorTop);
  paintDeskLamp(p, x + 33, deskTop, kit.shade, kit.lit);
  paintMonitor(p, x + 15, deskTop, kit.screen);
  // the keyboard, and a note stuck on the partition
  p.rect(x + 26, deskTop - 1, 5, 1, 'concrete');
  p.rect(x + 28, deskTop - 10, 3, 3, kit.lit ? 'honey' : 'fog');
  paintChair(p, x + 19, floorTop);
}

/**
 * Your own desk, still being set up: only the monitor (at the login box) and
 * the drawers at its near end, so the top stays clear for what is handed
 * over. Under it a blue recycling bin, and the monitor's cable to the outlet.
 */
function paintMyDesk(p: Painter, x: number, deskTop: number, floorTop: number): void {
  const foot = floorTop + 6;
  // the outlet on the partition and the cable down to it
  p.rect(x + 19, deskTop + 6, 3, 3, 'paper');
  px(p, x + 20, deskTop + 7, 'ink');
  p.rect(x + 14, deskTop + 5, 1, 3, 'ink');
  p.rect(x + 14, deskTop + 7, 5, 1, 'ink');
  paintDrawers(p, x + 3, deskTop, floorTop);
  paintMonitor(p, x + 1, deskTop, 'login');
  // the recycling bin
  p.rect(x + 30, foot - 6, 7, 6, 'sky');
  p.rect(x + 30, foot - 6, 7, 1, 'denim');
  p.rect(x + 36, foot - 5, 1, 5, 'denim');
  p.rect(x + 32, foot - 4, 3, 2, 'paper');
  px(p, x + 33, foot - 3, 'sky');
  p.rect(x + 31, foot - 8, 3, 2, 'paper');
}

// ---------------------------------------------------------------------------
// Beside the core

/**
 * The bay next to the copier: the open door of the small kitchen, lit inside
 * (the refrigerator, the microwave and the coffee pot on the counter, the
 * memo on the wall), a cup sign over it and a bin beside it.
 */
function paintKitchen(p: Painter, bx: number, oy: number, floorTop: number): void {
  const x = bx + 14;
  const top = oy + 14;
  const w = 26;
  const h = floorTop - top;
  p.rect(x - 2, top - 2, w + 4, h + 2, 'paper');
  p.rect(x + w, top - 2, 2, h + 2, 'fog');
  const q = within(p, x, top, w, h);
  ditherGradient(q, x, top, w, h, ['honey', 'honey', 'skin', 'tan']);
  // the ceiling light
  q.rect(x + 8, top, 10, 1, 'paper');
  // the wall cupboard
  q.rect(x + 12, top + 4, 14, 8, 'teal');
  q.rect(x + 12, top + 11, 14, 1, 'moss');
  q.rect(x + 19, top + 4, 1, 7, 'moss');
  px(q, x + 17, top + 9, 'honey');
  px(q, x + 21, top + 9, 'honey');
  // the memo about the bins
  q.rect(x + 14, top + 15, 5, 6, 'paper');
  q.rect(x + 15, top + 16, 3, 1, 'red');
  q.rect(x + 15, top + 18, 3, 1, 'stone');
  // the counter: microwave and coffee pot on it
  const counter = floorTop - 13;
  q.rect(x + 11, counter, 15, 13, 'teal');
  q.rect(x + 11, counter, 15, 1, 'paper');
  q.rect(x + 11, counter + 1, 15, 1, 'moss');
  q.rect(x + 18, counter + 3, 1, 9, 'moss');
  px(q, x + 16, counter + 5, 'honey');
  px(q, x + 20, counter + 5, 'honey');
  q.rect(x + 12, counter - 6, 9, 6, 'stone');
  q.rect(x + 13, counter - 5, 5, 4, 'night');
  px(q, x + 14, counter - 4, 'lamp');
  px(q, x + 19, counter - 4, 'leaf');
  px(q, x + 19, counter - 2, 'fog');
  q.rect(x + 22, counter - 4, 3, 4, 'ink');
  px(q, x + 23, counter - 2, 'amber');
  px(q, x + 23, counter - 5, 'paper');
  // the refrigerator
  const fridge = floorTop - 28;
  q.rect(x, fridge - 1, 11, 29, 'concrete');
  q.rect(x + 1, fridge, 9, 28, 'paper');
  q.rect(x + 8, fridge, 2, 28, 'fog');
  q.rect(x + 1, fridge + 9, 9, 1, 'concrete');
  q.rect(x + 7, fridge + 4, 1, 3, 'stone');
  q.rect(x + 7, fridge + 12, 1, 5, 'stone');
  q.rect(x + 3, fridge + 3, 2, 2, 'red');
  q.rect(x + 2, fridge - 4, 5, 4, 'ember');
  q.rect(x + 2, fridge - 4, 5, 1, 'amber');
  // the threshold
  q.rect(x, floorTop - 1, w, 1, 'concrete');
  // the cup sign over the door
  p.rect(x + 8, top - 10, 10, 7, 'night');
  p.rect(x + 11, top - 8, 4, 3, 'paper');
  px(p, x + 15, top - 7, 'paper');
  px(p, x + 12, top - 9, 'fog');
  // the general-waste bin beside the door
  const foot = floorTop + 2;
  p.rect(bx + 3, foot - 9, 7, 9, 'stone');
  p.rect(bx + 3, foot - 9, 7, 1, 'fog');
  p.rect(bx + 9, foot - 8, 1, 8, 'slate');
  p.rect(bx + 2, foot, 9, 1, 'night');
}

/** Under a window to the left: a low cupboard with the printer on it, and the water cooler. */
function paintPrinterBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const cx = x + 5;
  const top = oy + 41;
  p.rect(cx, top, 20, floorTop + 1 - top, 'concrete');
  p.rect(cx, top, 20, 1, 'fog');
  p.rect(cx + 19, top, 1, floorTop + 1 - top, 'stone');
  p.rect(cx + 9, top + 2, 1, floorTop - top - 2, 'stone');
  px(p, cx + 7, top + 7, 'night');
  px(p, cx + 11, top + 7, 'night');
  // the printer, a sheet coming out
  p.rect(cx + 6, top - 9, 7, 3, 'paper');
  p.rect(cx + 3, top - 6, 13, 6, 'slate');
  p.rect(cx + 3, top - 6, 13, 1, 'stone');
  p.rect(cx + 5, top - 3, 9, 1, 'ink');
  p.rect(cx + 6, top - 2, 7, 2, 'paper');
  px(p, cx + 14, top - 4, 'leaf');
  // the water cooler
  const wx = x + 30;
  p.rect(wx + 2, oy + 33, 7, 9, 'sky');
  p.rect(wx + 3, oy + 34, 1, 7, 'paper');
  p.rect(wx + 4, oy + 32, 3, 1, 'denim');
  p.rect(wx, oy + 42, 11, floorTop + 1 - oy - 42, 'paper');
  p.rect(wx + 9, oy + 42, 2, floorTop + 1 - oy - 42, 'fog');
  px(p, wx + 3, oy + 45, 'red');
  px(p, wx + 6, oy + 45, 'denim');
  p.rect(wx + 2, oy + 47, 7, 1, 'stone');
}

/** Two tall filing cabinets, boxes and a plant on top. */
function paintCabinetBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 28;
  for (const cx of [x + 5, x + 22]) {
    p.rect(cx, top, 16, floorTop + 1 - top, 'concrete');
    p.rect(cx, top, 16, 1, 'fog');
    p.rect(cx + 15, top, 1, floorTop + 1 - top, 'stone');
    for (let dy = top + 2; dy + 6 < floorTop; dy += 7) {
      p.rect(cx + 1, dy + 6, 14, 1, 'stone');
      p.rect(cx + 6, dy + 2, 4, 1, 'night');
      p.rect(cx + 7, dy + 4, 2, 1, 'paper');
    }
  }
  p.rect(x + 7, top - 6, 9, 6, 'tan');
  p.rect(x + 7, top - 6, 9, 1, 'skin');
  p.rect(x + 11, top - 6, 2, 3, 'ember');
  paintPlant(p, x + 25, top - 20);
}

// ---------------------------------------------------------------------------
// Above the core

/** The air conditioner on the wall, 19 wide. */
function paintAircon(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 7, 19, 1, 'concrete');
  p.rect(x, y, 19, 7, 'paper');
  p.rect(x, y + 5, 19, 2, 'fog');
  p.rect(x + 2, y + 5, 15, 1, 'stone');
  px(p, x + 16, y + 2, 'leaf');
}

/** A framed poster of the company's lamp glowing in the dark, 20 x 22. */
function paintPoster(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 22, 20, 1, 'concrete');
  p.rect(x, y, 20, 22, 'ink');
  p.rect(x + 1, y + 1, 18, 20, 'deep');
  p.rect(x + 4, y + 8, 12, 6, 'indigo');
  p.rect(x + 6, y + 8, 8, 4, 'dusk');
  p.rect(x + 7, y + 3, 6, 1, 'teal');
  p.rect(x + 6, y + 4, 8, 3, 'teal');
  px(p, x + 7, y + 4, 'cyan');
  p.rect(x + 7, y + 7, 6, 1, 'honey');
  p.rect(x + 8, y + 8, 4, 1, 'lamp');
  p.rect(x + 10, y + 9, 1, 6, 'amber');
  p.rect(x + 7, y + 15, 7, 1, 'amber');
  p.rect(x + 4, y + 18, 12, 1, 'paper');
}

/** The company emblem: an anchor on a navy roundel in a brass ring. */
function paintEmblem(p: Painter, x: number, y: number): void {
  p.rect(x + 4, y, 7, 15, 'amber');
  p.rect(x, y + 4, 15, 7, 'amber');
  p.rect(x + 2, y + 1, 11, 13, 'amber');
  p.rect(x + 1, y + 2, 13, 11, 'amber');
  p.rect(x + 4, y + 1, 7, 13, 'denim');
  p.rect(x + 1, y + 4, 13, 7, 'denim');
  p.rect(x + 2, y + 2, 11, 11, 'denim');
  px(p, x + 4, y, 'lamp');
  p.rect(x + 2, y + 1, 2, 1, 'lamp');
  px(p, x + 1, y + 2, 'lamp');
  p.rect(x + 3, y + 14, 9, 1, 'ember');
  // the anchor
  const c = x + 7;
  p.rect(c - 1, y + 2, 3, 1, 'honey');
  px(p, c - 1, y + 3, 'honey');
  px(p, c + 1, y + 3, 'honey');
  p.rect(c - 2, y + 4, 5, 1, 'honey');
  p.rect(c, y + 5, 1, 6, 'honey');
  p.rect(c - 3, y + 9, 1, 2, 'honey');
  p.rect(c + 3, y + 9, 1, 2, 'honey');
  px(p, c - 4, y + 9, 'honey');
  px(p, c + 4, y + 9, 'honey');
  p.rect(c - 2, y + 11, 5, 1, 'honey');
}

export const OFFICE_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    // Dan stands in front of the near end of his desk, the partition behind his head.
    coworker: { sprite: COWORKER_SPRITE, ...DAN, side: 'right' },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 68, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 89, y: 25 } },
  rest: {
    left: { x: DESK.x + 11, y: PROP_TOP },
    right: { x: DESK.x + 23, y: PROP_TOP },
  },
};
