import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { DIRECTOR_SPRITE } from './act3Cast';
import { ACCOUNTANT_SPRITE } from './act4Cast';
import { clipped, coreOrigin, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The budget stage: two places at Harbor Trading on a January evening.
 *
 * Ms. Patel's desk (the main picture): from the left, a framed bar chart over
 * a grey filing cabinet (you stand beside it), then her desk with a monitor
 * showing a green-grid spreadsheet, a pile of receipts on a manila folder, the
 * keyboard and a desk calculator. Handed-over things rest on the desktop.
 * Ms. Patel stands at the desk's far end; Ms. Carter, when she is there too,
 * stands in front of the window onto the harbour at dusk.
 *
 * Mr. Ellis's office (`backdrops.director`, for t8): a tall bookshelf on the
 * left, a framed photo of a lit Lantern lamp on the wood-panelled wall, a big
 * wooden desk with a leather chair behind it, and a wide window at dusk with
 * red curtains. He stands at the desk's far end, in front of the window.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom, more wall
 * goes above and the room goes on to both sides. Palette colours only, whole
 * pixels, painted through the Painter interface.
 */

/** The desk in both rooms: left edge, width and the y of its top (props rest on it). */
const DESK = { x: 38, w: 46, top: 50 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;
const FLOOR_TOP = 56;
/** The rail between the upper and lower wall. */
const RAIL_Y = 46;
/** The window in the core, right of the desk: its outer frame. */
const WINDOW = { x: 97, y: 5, w: 29, h: 31 } as const;
/** Where the person at the desk's far end stands, and the second person by the window. */
const BY_DESK = { x: 80, y: 39 } as const;
const BY_WINDOW = { x: 96, y: 39 } as const;
/** Width of one bay of the room beside the core. */
const BAY_W = 48;
/** Wall above the core needed for the calendar and clock, and for the high shelf. */
const CALENDAR_MIN = 20;
const SHELF_MIN = 44;
/** Wall above the core needed for the darker upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;

type Tones = readonly [PaletteName, PaletteName];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a window's glass, a screen). */
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

/** How far up the windows reach on a stage whose core starts at `oy`. */
function windowTop(oy: number): number {
  return oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
}

// ---------------------------------------------------------------------------
// Ms. Patel's desk

type OfficeBay = 'window' | 'desk' | 'cabinets';

/** Paints the office around Ms. Patel's desk to fill a w x h stage. */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = windowTop(oy);
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  const bays: [number, OfficeBay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'desk' : 'window']);
  }
  for (let x = ox + 128, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'cabinets' : i % 4 === 1 ? 'desk' : 'window']);
  }
  const lamps = [ox + 60];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice, 'concrete');
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  if (oy >= CALENDAR_MIN) {
    paintCalendar(p, ox + 34, oy - 19);
    paintClock(p, ox + 86, oy - 9);
  }
  if (oy >= SHELF_MIN) paintBinderShelf(p, ox + 50, oy - 28);

  paintOfficeLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') {
      paintWindow(p, x + 9, winTop, 30, winH, ox);
      paintPlant(p, x + 19, floorTop - 19);
    } else if (kind === 'desk') {
      paintOtherDesk(p, x, oy, floorTop, x - ox);
    } else {
      paintFilingCabinet(p, x + 6, oy + 32, floorTop);
      paintFilingCabinet(p, x + 24, oy + 32, floorTop);
      paintBarChart(p, x + 9, oy + 8, x - ox);
    }
  }

  // Left of the desk: the bar chart and the tall filing cabinet beside you.
  paintBarChart(p, ox + 4, oy + 8, 0);
  paintFilingCabinet(p, ox + 3, oy + 32, floorTop);
  paintTray(p, ox + 5, oy + 32);

  // Right of the desk: the window and a low cabinet under it.
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintLowCabinet(p, ox + 96, oy + 44, floorTop);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);

  // Her desk: the monitor's glow on the wall, the desk, what stands on it.
  const dx = ox + DESK.x;
  glowEllipse(p, ox + 62, oy + 26, 22, 17, 'leaf', [0.12, 0.06]);
  paintDesk(p, dx, deskTop, DESK.w, floorTop, 'amber', 'ember');
  paintUnderDesk(p, dx, floorTop);
  paintMonitor(p, ox + 45, oy + 13, deskTop);
  paintReceipts(p, dx + 1, deskTop);
  paintKeyboard(p, ox + 50, deskTop);
  paintCalculator(p, ox + 69, deskTop);
}

/** The lower wall under a pale rail: grey-blue boards and a dark skirting. */
function paintOfficeLowerWall(
  p: Painter,
  w: number,
  ox: number,
  top: number,
  floorTop: number,
): void {
  p.rect(0, top, w, floorTop - top, 'stone');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'concrete');
  for (let x = mod(ox + 5, 10) - 10; x < w; x += 10) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'slate');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Office carpet: slate with a small dot pattern, counted from the core so it never shifts. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = mod(ox + (row % 2) * 4, 8) - 8; x < w; x += 8) px(p, x, y, 'stone');
  }
}

/** A brass pendant lamp hanging from the ceiling (`from`) down to the core. */
function paintPendant(p: Painter, cx: number, from: number, oy: number): void {
  p.rect(cx, from, 1, oy + 2 - from, 'ink');
  p.rect(cx - 1, oy + 2, 3, 1, 'ember');
  p.rect(cx - 2, oy + 3, 5, 1, 'amber');
  p.rect(cx - 3, oy + 4, 7, 1, 'amber');
  p.rect(cx - 4, oy + 5, 9, 1, 'ember');
  p.rect(cx - 2, oy + 6, 5, 1, 'honey');
  px(p, cx - 2, oy + 4, 'lamp');
}

/** The wall above `cornice` on a tall stage: a darker band with high windows onto the night. */
function paintUpperWall(
  p: Painter,
  w: number,
  ox: number,
  cornice: number,
  wall: PaletteName,
): void {
  p.rect(0, 0, w, cornice, wall);
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  const wh = Math.min(56, cornice - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((cornice - wh) / 2));
    const gap = 88;
    const first = Math.floor(-(ox + 64) / gap) - 1;
    for (let k = first; ox + 64 + k * gap - 22 < w; k++) {
      const cx = ox + 64 + k * gap;
      p.rect(cx - 19, top - 1, 39, wh + 2, 'paper');
      ditherGradient(p, cx - 18, top, 37, wh, ['deep', 'deep', 'indigo', 'dusk']);
      for (let i = 0; i < 6; i++) {
        const sx = cx - 17 + Math.floor(hash2(i, k, 431) * 35);
        const sy = top + 1 + Math.floor(hash2(i, k, 433) * (wh - 3));
        px(p, sx, sy, hash2(i, k, 439) > 0.7 ? 'paper' : 'fog');
      }
      p.rect(cx, top, 1, wh, 'paper');
      p.rect(cx - 19, top + wh + 1, 39, 1, 'stone');
    }
  }
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'fog');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The town at dusk, through the windows

/** One period of the view, in pixels; windows side by side show one continuous view. */
const VIEW_P = 112;

/**
 * The harbour town in January dusk through glass at (x, y), w x h: a rose
 * afterglow, roofs with lit windows, the water with a moored ship.
 */
function paintView(target: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 8;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const vx = mod(x + i - ox, VIEW_P);
    if (hash2(vx, 3, 401) < 0.05) {
      px(p, x + i, y + 1 + Math.floor(hash2(vx, 4, 409) * Math.max(3, horizon - y - 14)), 'fog');
    }
    // roofs of the town across the water, a step every few pixels
    const roof = 2 + Math.floor(hash2(Math.floor(vx / 5), 7, 419) * 6);
    p.rect(x + i, horizon - roof, 1, roof, 'night');
    if (vx % 5 === 2 && hash2(vx, 8, 421) < 0.45) {
      px(p, x + i, horizon - roof + 2, hash2(vx, 9, 433) < 0.5 ? 'honey' : 'lamp');
    }
    // glints on the water
    if (vx % 6 === 0 && hash2(vx, 1, 443) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(vx, 2, 449) * 4);
      p.rect(x + i, gy, 2, 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // a church spire and a ship, once a period
  const first = Math.floor((x - ox - 30) / VIEW_P) - 1;
  for (let k = first; ox + k * VIEW_P < x + w + 30; k++) {
    const base = ox + k * VIEW_P;
    const sx = base + 104;
    p.rect(sx, horizon - 13, 3, 13, 'night');
    p.rect(sx + 1, horizon - 17, 1, 4, 'night');
    px(p, sx + 1, horizon - 10, 'honey');
    const shx = base + 52;
    p.rect(shx + 1, horizon + 2, 18, 2, 'ink');
    p.rect(shx, horizon + 1, 20, 1, 'night');
    p.rect(shx + 3, horizon - 1, 3, 2, 'teal');
    p.rect(shx + 7, horizon - 1, 3, 2, 'ember');
    p.rect(shx + 14, horizon - 3, 4, 4, 'night');
    px(p, shx + 15, horizon - 2, 'honey');
  }
}

/** A window with a white frame and sill: the town behind the glass, a mullion, the blind half up. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintView(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  for (let i = 0; i < 3; i++) p.rect(x + 2, y + 2 + i * 2, w - 4, 1, 'paper');
  p.rect(x + 2, y + 7, w - 4, 1, 'fog');
  p.rect(x + 3, y + 8, 1, 5, 'fog');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Furniture of the office

/** A desk seen from the front: a top a pixel proud, a modesty board, a pedestal of drawers at the right. */
function paintDesk(
  p: Painter,
  x: number,
  top: number,
  w: number,
  floorTop: number,
  wood: PaletteName,
  shade: PaletteName,
): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w, 1, 'night');
  p.rect(x, top + 2, 2, foot - top - 2, shade);
  p.rect(x + 2, top + 2, w - 4, 5, shade);
  p.rect(x + 2, top + 6, w - 4, 1, 'plum');
  const dx = x + w - 16;
  p.rect(dx, top + 2, 16, foot - top - 2, wood);
  p.rect(dx, top + 2, 1, foot - top - 2, shade);
  p.rect(x + w - 2, top + 2, 2, foot - top - 2, shade);
  const half = Math.floor((foot - top - 2) / 2);
  for (let d = 0; d < 2; d++) {
    const dy = top + 2 + d * half;
    p.rect(dx + 1, dy + half - 1, 13, 1, shade);
    p.rect(dx + 6, dy + 1, 4, 1, 'honey');
  }
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, wood);
}

/** Under her desk: a bag leaning on the board and a box of last year's receipts. */
function paintUnderDesk(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  // the archive box
  p.rect(x + 4, foot - 7, 11, 7, 'tan');
  p.rect(x + 4, foot - 7, 11, 1, 'skin');
  p.rect(x + 14, foot - 6, 1, 6, 'ember');
  p.rect(x + 7, foot - 5, 5, 2, 'paper');
  // her bag
  p.rect(x + 18, foot - 6, 7, 6, 'maroon');
  p.rect(x + 18, foot - 6, 7, 1, 'red');
  p.rect(x + 19, foot - 9, 1, 3, 'maroon');
  p.rect(x + 23, foot - 9, 1, 3, 'maroon');
  p.rect(x + 20, foot - 10, 3, 1, 'maroon');
  px(p, x + 21, foot - 4, 'lamp');
}

/**
 * The monitor at (x, y), 34 wide, on a stand down to the desktop. On the
 * screen a spreadsheet: a toolbar, a header row and column, a green grid of
 * cells, a few filled ones, one selected. No readable letters.
 */
function paintMonitor(p: Painter, x: number, y: number, deskTop: number): void {
  p.rect(x + 15, y + 27, 4, deskTop - y - 29, 'slate');
  p.rect(x + 15, y + 27, 1, deskTop - y - 29, 'stone');
  p.rect(x + 10, deskTop - 3, 14, 1, 'stone');
  p.rect(x + 9, deskTop - 2, 16, 2, 'night');
  p.rect(x + 1, y, 32, 27, 'ink');
  p.rect(x, y + 1, 34, 25, 'ink');
  p.rect(x + 2, y + 24, 30, 2, 'night');
  px(p, x + 30, y + 24, 'leaf');
  const sx = x + 2;
  const sy = y + 2;
  p.rect(sx, sy, 30, 21, 'paper');
  // the toolbar of the spreadsheet program
  p.rect(sx, sy, 30, 3, 'moss');
  p.rect(sx + 1, sy + 1, 5, 1, 'leaf');
  px(p, sx + 28, sy + 1, 'red');
  px(p, sx + 26, sy + 1, 'honey');
  // the header row and the row numbers
  p.rect(sx, sy + 3, 30, 2, 'fog');
  p.rect(sx, sy + 3, 3, 18, 'fog');
  // the grid: columns every 6 pixels, rows every 2
  for (let gx = sx + 3; gx < sx + 30; gx += 6) p.rect(gx, sy + 3, 1, 18, 'leaf');
  for (let gy = sy + 5; gy < sy + 21; gy += 2) p.rect(sx, gy, 30, 1, 'leaf');
  // figures in some cells (short dark bars), totals at the bottom
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) {
      if (hash2(r, c, 457) < 0.25) continue;
      const len = 2 + Math.floor(hash2(r, c, 461) * 3);
      p.rect(sx + 9 + c * 6 - len, sy + 6 + r * 2, len, 1, c === 0 ? 'stone' : 'slate');
    }
    p.rect(sx + 1, sy + 6 + r * 2, 1, 1, 'concrete');
  }
  p.rect(sx + 4, sy + 19, 26, 1, 'moss');
  // a cell picked out: the doubled travel line, highlighted
  p.rect(sx + 15, sy + 13, 7, 3, 'honey');
  p.rect(sx + 15, sy + 13, 7, 1, 'lamp');
  p.rect(sx + 15, sy + 15, 7, 1, 'lamp');
  p.rect(sx + 17, sy + 14, 3, 1, 'ember');
  // a sticky note on the frame
  p.rect(x + 31, y + 5, 4, 4, 'honey');
  p.rect(x + 31, y + 8, 4, 1, 'lamp');
}

/** A pile of receipts on a manila folder at the desk's left end, the top one curling. */
function paintReceipts(p: Painter, x: number, top: number): void {
  // the folder, lying flat with its tab
  p.rect(x, top - 2, 11, 2, 'lamp');
  p.rect(x, top - 1, 11, 1, 'amber');
  p.rect(x + 1, top - 3, 4, 1, 'lamp');
  // two stacks of slips
  for (let i = 0; i < 4; i++) {
    const sy = top - 3 - i;
    p.rect(x + 1 + (i % 2), sy, 5, 1, i % 2 === 0 ? 'paper' : 'fog');
  }
  p.rect(x + 7, top - 4, 4, 2, 'paper');
  p.rect(x + 7, top - 3, 4, 1, 'fog');
  // a slip on the spike, and the binder clip
  p.rect(x + 2, top - 9, 4, 3, 'paper');
  px(p, x + 3, top - 8, 'concrete');
  px(p, x + 4, top - 7, 'concrete');
  p.rect(x + 3, top - 11, 1, 4, 'ink');
  p.rect(x + 7, top - 5, 3, 1, 'ink');
}

function paintKeyboard(p: Painter, x: number, top: number): void {
  p.rect(x, top - 2, 17, 2, 'fog');
  for (let i = 0; i < 8; i++) px(p, x + 1 + i * 2, top - 2, 'paper');
  p.rect(x, top - 1, 17, 1, 'concrete');
}

/** A desk calculator with a paper roll, its display lit green. */
function paintCalculator(p: Painter, x: number, top: number): void {
  // the paper roll curling out of the back
  p.rect(x + 2, top - 9, 6, 2, 'paper');
  p.rect(x + 2, top - 8, 6, 1, 'fog');
  p.rect(x + 7, top - 11, 1, 3, 'paper');
  p.rect(x, top - 7, 10, 7, 'slate');
  p.rect(x, top - 7, 10, 1, 'stone');
  p.rect(x + 1, top - 6, 8, 2, 'moss');
  p.rect(x + 5, top - 5, 3, 1, 'leaf');
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) px(p, x + 1 + c * 2, top - 3 + r, c === 3 ? 'lamp' : 'fog');
  }
  p.rect(x + 1, top - 1, 9, 1, 'night');
}

/** A framed bar chart: bars climbing to the right, one of them red, a trend line over them. */
function paintBarChart(p: Painter, x: number, y: number, seed: number): void {
  const w = 24;
  const h = 18;
  p.rect(x, y, w, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + 3, y + 3, 1, h - 6, 'stone');
  p.rect(x + 3, y + h - 4, w - 6, 1, 'stone');
  const bars = [4, 6, 5, 8, 10];
  bars.forEach((bh, i) => {
    const tall = bh + (hash2(i, seed, 467) < 0.3 ? -1 : 0);
    const color: PaletteName = i === 2 ? 'red' : i === 4 ? 'leaf' : 'denim';
    p.rect(x + 5 + i * 3, y + h - 4 - tall, 2, tall, color);
  });
  for (let i = 0; i < 4; i++) px(p, x + 6 + i * 4, y + 7 - i, 'lamp');
  p.rect(x + 1, y + h, w - 2, 1, 'stone');
  px(p, x + 11, y - 1, 'ink');
}

/** A tall grey filing cabinet of three drawers, from `top` to the floor. */
function paintFilingCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const cw = 16;
  const bottom = floorTop + 2;
  p.rect(x, top, cw, bottom - top, 'concrete');
  p.rect(x, top, cw, 1, 'fog');
  p.rect(x + cw - 1, top + 1, 1, bottom - top - 1, 'stone');
  const dh = Math.floor((bottom - top - 1) / 3);
  for (let d = 0; d < 3; d++) {
    const dy = top + 1 + d * dh;
    p.rect(x + 1, dy + dh - 1, cw - 2, 1, 'stone');
    p.rect(x + 5, dy + 2, 6, 1, 'night');
    p.rect(x + 6, dy + 4, 4, 2, 'paper');
  }
  p.rect(x + 1, bottom, cw, 1, 'night');
}

/** A wire tray of papers standing on a cabinet top at `top`. */
function paintTray(p: Painter, x: number, top: number): void {
  p.rect(x, top - 4, 12, 1, 'paper');
  p.rect(x + 1, top - 3, 11, 1, 'fog');
  p.rect(x, top - 2, 12, 1, 'paper');
  p.rect(x - 1, top - 5, 1, 5, 'ink');
  p.rect(x + 12, top - 5, 1, 5, 'ink');
  p.rect(x - 1, top - 1, 14, 1, 'ink');
}

/** A low cabinet under the window: a tray of papers and a small cactus on it. */
function paintLowCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const cw = 30;
  p.rect(x, top, cw, floorTop + 1 - top, 'concrete');
  p.rect(x, top, cw, 1, 'fog');
  p.rect(x + cw - 1, top + 1, 1, floorTop - top, 'stone');
  p.rect(x + 14, top + 1, 1, floorTop - top, 'stone');
  for (const hx of [x + 5, x + 20]) p.rect(hx, top + 4, 4, 1, 'night');
  p.rect(x + 4, top - 3, 10, 3, 'night');
  p.rect(x + 5, top - 4, 8, 1, 'paper');
  p.rect(x + 21, top - 3, 4, 3, 'amber');
  p.rect(x + 22, top - 7, 2, 4, 'leaf');
  px(p, x + 21, top - 6, 'leaf');
}

/** A shelf of year binders high on the wall. */
function paintBinderShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 48, 1, 'amber');
  p.rect(x, y + 1, 48, 1, 'ember');
  for (const bx of [x + 3, x + 44]) p.rect(bx, y + 2, 1, 3, 'ember');
  const spines: readonly Tones[] = [
    ['denim', 'indigo'],
    ['leaf', 'moss'],
    ['red', 'maroon'],
    ['lamp', 'amber'],
    ['teal', 'moss'],
    ['paper', 'concrete'],
  ];
  for (let i = 0, bx = x + 2; bx + 3 <= x + 46; bx += 3, i++) {
    if (i === 9) {
      // a box lying in the row
      p.rect(bx, y - 6, 8, 6, 'tan');
      p.rect(bx, y - 6, 8, 1, 'skin');
      bx += 6;
      continue;
    }
    const [spine, shade] = spines[i % spines.length] ?? ['denim', 'indigo'];
    const bh = 8 + (i % 3 === 0 ? 1 : 0);
    p.rect(bx, y - bh, 3, bh, spine);
    p.rect(bx + 2, y - bh, 1, bh, shade);
    px(p, bx + 1, y - bh + 2, spine === 'paper' ? 'stone' : 'paper');
  }
}

/** A wall calendar for January: a red head, the days as dots, the first ringed. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x, y, 16, 16, 'paper');
  p.rect(x, y, 16, 4, 'red');
  px(p, x + 4, y - 1, 'ink');
  px(p, x + 11, y - 1, 'ink');
  p.rect(x + 3, y + 1, 6, 1, 'paper');
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      if (r === 4 && c > 3) break;
      px(p, x + 1 + c * 2, y + 6 + r * 2, c === 6 ? 'rosy' : 'concrete');
    }
  }
  px(p, x + 5, y + 6, 'red');
  p.rect(x + 1, y + 16, 16, 1, 'concrete');
}

/** Another desk of the office, its owner gone home: screen dark, a glass lamp left on. */
function paintOtherDesk(p: Painter, x: number, oy: number, floorTop: number, seed: number): void {
  const top = oy + DESK.top;
  const glass: Tones =
    (
      [
        ['leaf', 'moss'],
        ['rosy', 'mauve'],
        ['sky', 'denim'],
      ] as const
    )[mod(Math.floor(seed / BAY_W), 3)] ?? (['leaf', 'moss'] as const);
  glowEllipse(p, x + 36, top - 5, 11, 9, 'honey', [0.34, 0.18]);
  paintDesk(p, x + 3, top, 42, floorTop, 'amber', 'ember');
  // the monitor, switched off
  const my = top - 15;
  p.rect(x + 12, my + 11, 3, 2, 'slate');
  p.rect(x + 10, my + 13, 7, 2, 'night');
  p.rect(x + 6, my, 15, 11, 'ink');
  p.rect(x + 7, my + 1, 13, 8, 'night');
  p.rect(x + 8, my + 2, 2, 1, 'slate');
  // a glass lamp, lit
  const lx = x + 32;
  p.rect(lx + 2, top - 2, 5, 2, 'amber');
  p.rect(lx + 2, top - 2, 5, 1, 'lamp');
  p.rect(lx + 4, top - 7, 1, 5, 'amber');
  p.rect(lx + 1, top - 11, 7, 1, glass[0]);
  p.rect(lx, top - 10, 9, 3, glass[0]);
  p.rect(lx, top - 8, 9, 1, glass[1]);
  px(p, lx + 2, top - 10, 'paper');
  p.rect(lx + 1, top - 7, 7, 1, 'honey');
  // the chair pushed in
  const foot = floorTop + 6;
  const cx = x + 20;
  p.rect(cx + 1, foot - 1, 9, 1, 'ink');
  p.rect(cx + 5, foot - 6, 1, 5, 'ink');
  p.rect(cx, foot - 18, 11, 10, 'denim');
  p.rect(cx + 1, foot - 18, 9, 1, 'sky');
  p.rect(cx, foot - 10, 11, 2, 'indigo');
}

// ---------------------------------------------------------------------------
// Mr. Ellis's office

type EllisBay = 'books' | 'window' | 'cabinet';

/** Paints the director's office to fill a w x h stage. */
function paintDirector(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = windowTop(oy);
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  const bays: [number, EllisBay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'cabinet' : 'books']);
  }
  for (let x = ox + 128, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'books' : 'window']);
  }

  // A warmer wall than the open office, lit by the wall lamps.
  p.rect(0, 0, w, floorTop, 'moss');
  for (let x = mod(ox + 3, 8) - 8; x < w; x += 8) ditherRect(p, x, 0, 1, floorTop, 'teal', 8);
  glowEllipse(p, ox + 58, oy + 16, 36, 28, 'honey', [0.24, 0.15, 0.08]);
  glowEllipse(p, ox + DESK.x + 8, oy + DESK.top - 8, 14, 10, 'honey', [0.3, 0.15]);
  for (const [x, kind] of bays) {
    if (kind === 'cabinet') glowEllipse(p, x + 24, oy + 18, 24, 20, 'honey', [0.18, 0.08]);
  }
  if (cornice > 0) paintUpperWall(p, w, ox, cornice, 'moss');
  else ditherRect(p, 0, 0, w, 2, 'night', 8);

  if (oy >= CALENDAR_MIN) paintClock(p, ox + 58, oy - 10);
  if (oy >= SHELF_MIN) paintCertificates(p, ox + 36, oy - 32);

  // Wood panels on the lower wall, a wooden floor and a rug under the desk.
  paintPanels(p, w, ox, oy + RAIL_Y - 4, floorTop);
  paintBoards(p, w, ox, floorTop, h);
  paintRug(p, ox + 30, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'books') paintBookcase(p, x + 8, oy + 2, 32, floorTop, x - ox);
    else if (kind === 'window') paintCurtainedWindow(p, x + 9, winTop, 30, winH, ox);
    else paintSampleCabinet(p, x + 6, oy, floorTop);
  }

  // The core: the tall bookshelf behind you, the lamp photo, the window.
  paintBookcase(p, ox + 1, oy + 2, 32, floorTop, 0);
  paintLampPhoto(p, ox + 46, oy + 6);
  paintCurtainedWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);

  // The desk, the chair behind it, and what is on it.
  paintLeatherChair(p, ox + 56, deskTop);
  const dx = ox + DESK.x;
  paintExecutiveDesk(p, dx, deskTop, DESK.w, floorTop);
  paintLanternLamp(p, dx + 2, deskTop);
  paintDeskSet(p, dx + 34, deskTop);
}

/** Dark wooden panels from `top` to the floor, a moulding along the top. */
function paintPanels(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'honey');
  p.rect(0, top + 1, w, 1, 'amber');
  p.rect(0, top + 2, w, 1, 'plum');
  for (let x = mod(ox + 2, 14) - 14; x < w; x += 14) {
    p.rect(x + 2, top + 4, 10, floorTop - top - 7, 'plum');
    p.rect(x + 3, top + 5, 8, floorTop - top - 9, 'ember');
    p.rect(x + 3, top + 5, 8, 1, 'amber');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** A wooden floor: long boards, their joints staggered, counted from the core. */
function paintBoards(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'ember');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'plum');
    for (let x = mod(ox + row * 13, 26) - 26; x < w; x += 26) px(p, x, y - 1, 'plum');
  }
}

/** A red rug under the desk, a pale border. */
function paintRug(p: Painter, x: number, floorTop: number, h: number): void {
  const rh = Math.min(h - floorTop - 1, 10);
  if (rh < 3) return;
  p.rect(x, floorTop + 1, 66, rh, 'maroon');
  p.rect(x + 1, floorTop + 2, 64, 1, 'rosy');
  if (rh > 5) p.rect(x + 1, floorTop + rh - 1, 64, 1, 'rosy');
  for (let i = 0; i < 7; i++) px(p, x + 6 + i * 9, floorTop + 3 + (i % 2), 'red');
}

/** Book colours: spine and its shade. */
const BOOKS: readonly Tones[] = [
  ['red', 'maroon'],
  ['denim', 'indigo'],
  ['leaf', 'moss'],
  ['lamp', 'amber'],
  ['paper', 'fog'],
  ['teal', 'moss'],
  ['mauve', 'plum'],
];

/** A row of books on a shelf at `bottom`, from x0 to x1, some leaning, a gap here and there. */
function paintBooks(p: Painter, x0: number, x1: number, bottom: number, seed: number): void {
  for (let x = x0, i = 0; x + 2 <= x1; i++) {
    const bw = hash2(i, seed, 487) < 0.3 ? 3 : 2;
    if (x + bw > x1) break;
    if (hash2(i, seed, 491) < 0.1) {
      x += 3;
      continue;
    }
    const [spine, shade] = BOOKS[Math.floor(hash2(i, seed, 499) * BOOKS.length)] ?? [
      'red',
      'maroon',
    ];
    const bh = 6 + Math.floor(hash2(i, seed, 503) * 3);
    p.rect(x, bottom - bh, bw, bh, spine);
    p.rect(x + bw - 1, bottom - bh, 1, bh, shade);
    px(p, x, bottom - bh + 2, shade === 'fog' ? 'stone' : 'honey');
    x += bw;
  }
}

/** A tall wooden bookcase from `top` to the floor: shelves of books, a cupboard at the bottom. */
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
  p.rect(x - 1, top, w + 2, 2, 'amber');
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x + 2, top + 3, w - 4, bottom - top - 16, 'plum');
  for (let s = 0, sy = top + 12; sy < bottom - 13; sy += 10, s++) {
    if (s === 1) {
      // a small globe on its stand among the books
      paintBooks(p, x + 2, x + 18, sy, seed + s * 7);
      p.rect(x + 22, sy - 7, 5, 5, 'teal');
      p.rect(x + 23, sy - 6, 2, 2, 'leaf');
      p.rect(x + 24, sy - 2, 1, 1, 'amber');
      p.rect(x + 22, sy - 1, 5, 1, 'amber');
    } else {
      paintBooks(p, x + 2, x + w - 2, sy, seed + s * 7);
    }
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
}

/**
 * The framed photo of a Lantern lamp: a gilt frame, and inside it the lamp
 * lit on a dark ground, its light spreading on the table under it.
 */
function paintLampPhoto(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 20;
  p.rect(x - 1, y - 1, w + 2, h + 2, 'ember');
  p.rect(x, y, w, h, 'amber');
  p.rect(x + 1, y + 1, w - 2, 1, 'honey');
  p.rect(x + 2, y + 2, w - 4, h - 4, 'paper');
  const ix = x + 3;
  const iy = y + 3;
  const iw = w - 6;
  const ih = h - 6;
  p.rect(ix, iy, iw, ih, 'night');
  ditherRect(p, ix, iy, iw, 3, 'deep', 8);
  lightPool(within(p, ix, iy, iw, ih), ix + 10, iy + 10, 9, 5, [
    ['plum', 0.9],
    ['ember', 0.5],
  ]);
  // the table edge
  p.rect(ix, iy + ih - 3, iw, 1, 'ember');
  p.rect(ix, iy + ih - 2, iw, 2, 'plum');
  // the lamp: a round foot, a bent arm and a lantern-shaped shade, lit
  const lx = ix + 8;
  const base = iy + ih - 3;
  p.rect(lx - 1, base - 1, 6, 1, 'amber');
  p.rect(lx + 1, base - 6, 1, 5, 'amber');
  p.rect(lx + 2, base - 7, 2, 1, 'amber');
  p.rect(lx + 3, base - 10, 5, 1, 'ember');
  p.rect(lx + 2, base - 9, 7, 3, 'lamp');
  p.rect(lx + 3, base - 9, 1, 3, 'honey');
  p.rect(lx + 2, base - 6, 7, 1, 'ember');
  p.rect(lx + 3, base - 5, 5, 1, 'honey');
  px(p, lx + 5, base - 11, 'ember');
  // the picture light over the frame
  p.rect(x + 8, y - 3, 10, 2, 'amber');
  p.rect(x + 8, y - 3, 10, 1, 'honey');
  px(p, x + 12, y - 4, 'ember');
}

/** A window with heavy red curtains drawn back, the town at dusk behind it. */
function paintCurtainedWindow(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  ox: number,
): void {
  p.rect(x, y, w, h, 'amber');
  paintView(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'amber');
  p.rect(x + 2, y + 2 + Math.floor((h - 4) / 2), w - 4, 1, 'amber');
  p.rect(x - 1, y + h, w + 2, 1, 'honey');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'ember');
  // the curtains and their rod
  p.rect(x - 3, y - 3, w + 6, 1, 'ember');
  px(p, x - 4, y - 3, 'amber');
  px(p, x + w + 3, y - 3, 'amber');
  for (const [cx, dir] of [
    [x - 3, 1],
    [x + w - 2, -1],
  ] as const) {
    const len = h + 6;
    p.rect(cx, y - 2, 5, len, 'red');
    p.rect(dir > 0 ? cx + 4 : cx, y - 2, 1, len, 'maroon');
    p.rect(cx + 2, y - 2, 1, len, 'maroon');
    p.rect(cx, y + Math.floor(h * 0.6), 5, 1, 'lamp');
  }
}

/** A glass-fronted cabinet of sample lamps, used on the sides of the office. */
function paintSampleCabinet(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 12;
  const cw = 36;
  p.rect(x, top, cw, floorTop + 1 - top, 'ember');
  p.rect(x - 1, top, cw + 2, 1, 'honey');
  p.rect(x + 2, top + 2, cw - 4, 28, 'plum');
  for (let s = 0; s < 2; s++) {
    const sy = top + 15 + s * 14;
    p.rect(x + 2, sy, cw - 4, 1, 'amber');
    for (let i = 0; i < 3; i++) {
      const lx = x + 5 + i * 10;
      const shade: PaletteName = (['lamp', 'leaf', 'rosy'] as const)[(i + s) % 3] ?? 'lamp';
      p.rect(lx, sy - 1, 5, 1, 'amber');
      p.rect(lx + 2, sy - 6, 1, 5, 'amber');
      p.rect(lx, sy - 9, 5, 3, shade);
      p.rect(lx + 1, sy - 6, 3, 1, 'honey');
    }
  }
  // a glint on the glass
  for (let i = 0; i < 6; i++) px(p, x + 26 + i, top + 4 + i, 'fog');
  p.rect(x + 2, top + 32, cw - 4, floorTop - top - 33, 'amber');
  p.rect(x + Math.floor(cw / 2), top + 32, 1, floorTop - top - 33, 'ember');
}

/** Framed certificates high on the wall. */
function paintCertificates(p: Painter, x: number, y: number): void {
  for (const [dx, dy] of [
    [0, 2],
    [22, 0],
    [44, 2],
  ] as const) {
    p.rect(x + dx, y + dy, 16, 12, 'ember');
    p.rect(x + dx + 1, y + dy + 1, 14, 10, 'paper');
    p.rect(x + dx + 3, y + dy + 3, 10, 1, 'fog');
    p.rect(x + dx + 3, y + dy + 5, 8, 1, 'fog');
    px(p, x + dx + 11, y + dy + 8, 'red');
    px(p, x + dx + 12, y + dy + 8, 'lamp');
  }
}

/** The high back of a leather chair, standing behind the desk down to its top. */
function paintLeatherChair(p: Painter, x: number, deskTop: number): void {
  const top = deskTop - 18;
  p.rect(x + 1, top, 16, 18, 'maroon');
  p.rect(x, top + 1, 18, 17, 'maroon');
  p.rect(x + 2, top + 1, 14, 1, 'red');
  for (let i = 0; i < 3; i++) p.rect(x + 3, top + 4 + i * 4, 12, 1, 'plum');
  for (let i = 0; i < 3; i++) px(p, x + 5 + i * 4, top + 6, 'ember');
  p.rect(x, top + 1, 1, 17, 'plum');
  p.rect(x + 17, top + 1, 1, 17, 'plum');
}

/** The big desk: a dark top with a gilt edge, panelled front, carved feet. */
function paintExecutiveDesk(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w, 1, 'ink');
  p.rect(x, top + 2, w, foot - top - 4, 'ember');
  // three raised panels on the front
  const pw = Math.floor((w - 8) / 3);
  for (let i = 0; i < 3; i++) {
    const px0 = x + 2 + i * (pw + 2);
    p.rect(px0, top + 5, pw, foot - top - 10, 'plum');
    p.rect(px0 + 1, top + 6, pw - 2, foot - top - 12, 'ember');
    p.rect(px0 + 1, top + 6, pw - 2, 1, 'amber');
  }
  p.rect(x + w / 2 - 2, top + 3, 4, 1, 'honey');
  // the plinth and feet
  p.rect(x - 1, foot - 2, w + 2, 2, 'plum');
  p.rect(x - 1, foot - 2, w + 2, 1, 'amber');
  // the top, proud of the body, with a leather blotter on it
  p.rect(x - 2, top, w + 4, 1, 'honey');
  p.rect(x - 2, top + 1, w + 4, 1, 'amber');
  p.rect(x - 2, top + 2, w + 4, 1, 'plum');
}

/** A Lantern desk lamp on the desk's left end, lit, `x` its foot's left edge. */
function paintLanternLamp(p: Painter, x: number, top: number): void {
  p.rect(x, top - 1, 7, 1, 'amber');
  p.rect(x + 1, top - 2, 5, 1, 'lamp');
  p.rect(x + 3, top - 9, 1, 7, 'amber');
  p.rect(x + 4, top - 10, 2, 1, 'amber');
  p.rect(x + 5, top - 14, 7, 1, 'ember');
  p.rect(x + 4, top - 13, 9, 3, 'lamp');
  p.rect(x + 5, top - 13, 1, 3, 'honey');
  p.rect(x + 4, top - 10, 9, 1, 'ember');
  p.rect(x + 5, top - 9, 7, 1, 'honey');
  px(p, x + 8, top - 15, 'ember');
}

/** A pen stand, a closed folder with the budget in it, and a cup of coffee. */
function paintDeskSet(p: Painter, x: number, top: number): void {
  // the folder, its corner of paper showing
  p.rect(x - 14, top - 2, 12, 2, 'denim');
  p.rect(x - 14, top - 1, 12, 1, 'indigo');
  p.rect(x - 12, top - 3, 8, 1, 'paper');
  // the pen stand
  p.rect(x, top - 3, 7, 3, 'ink');
  p.rect(x, top - 3, 7, 1, 'slate');
  p.rect(x + 2, top - 7, 1, 4, 'lamp');
  px(p, x + 2, top - 8, 'honey');
  p.rect(x + 4, top - 6, 1, 3, 'ink');
  // the cup
  p.rect(x + 9, top - 4, 3, 4, 'paper');
  px(p, x + 12, top - 3, 'paper');
  px(p, x + 10, top - 6, 'fog');
}

export const BUDGET_STAGE: StageConfig = {
  paint,
  backdrops: { director: paintDirector },
  cast: {
    guide: GUIDE_ACTOR,
    accountant: { sprite: ACCOUNTANT_SPRITE, ...BY_DESK, side: 'right' },
    // Alone she stands where Ms. Patel stands; with her, in front of the window.
    manager: { sprite: MANAGER_SPRITE, ...BY_DESK, side: 'right', beside: BY_WINDOW },
    // In his own office (t8) he stands at the desk's far end; no task puts
    // him with another NPC, but his second spot would be in front of the desk.
    director: { sprite: DIRECTOR_SPRITE, ...BY_DESK, side: 'right', beside: { x: 58, y: 39 } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 6 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 94, y: 24 } },
  rest: {
    left: { x: DESK.x + 4, y: PROP_TOP },
    right: { x: DESK.x + 18, y: PROP_TOP },
  },
};
