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
import { NEW_HIRE_SPRITE } from './act4Cast';
import { clipped, coreOrigin, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The training stage: your desk at Harbor Trading on an April evening, the
 * fortnight you mentor Leo, the new assistant. From the left: a whiteboard
 * with the two weeks of training sessions blocked out, then the desk against
 * its felt screen with two chairs pushed in side by side under it and one
 * computer between them, the ordering system on its screen (a search bar, a
 * table of product codes, one order picked out). On the desktop: an open box
 * of new stationery, the keyboard, and the welcome booklet leaning on the
 * monitor's stand. Handed-over things rest on the desktop. Leo stands at the
 * desk's far end; Ms. Carter or Dan stands beside him in front of the window
 * onto the harbour at dusk.
 *
 * The second backdrop (`coworker`, task t3) is the copier corner of the same
 * office: a paper cabinet with reams on it, the big copier with its document
 * feeder, a red warning light and a sheet jammed in its side door, a notice
 * board, and a supply cupboard of paper and toner. Props rest on the cabinet
 * and the copier's top, at the same height as the desktop.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom; extra
 * wall goes above (a calendar with the first of the month ringed and a clock,
 * a long shelf of sample lamps, taller windows, then a darker upper wall with
 * high windows onto the night sky), and the office goes on to both sides:
 * windows over low cabinets, the other desks with their lamps left on, a
 * bookcase. Palette colours only, whole pixels.
 */

/** Your desk: its left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 34, w: 50, top: 50 } as const;
/** 24x24 pictures stand on the desktop (or the copier) with their shadow on it. */
const PROP_TOP = DESK.top - 20;
const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The top of the felt screen behind your desk. */
const SCREEN_TOP = 24;
/** The monitor's outer frame: where it stands on your desk. */
const MONITOR = { x: 44, y: 14 } as const;
/** The window in the core: its outer frame. */
const WINDOW = { x: 95, y: 5, w: 31, h: 30 } as const;
/** Leo's spot at the desk's far end (or beside the copier). */
const LEO = { x: 76, y: 39 } as const;
/** The copier: its left edge and width; its top is the desktop's height. */
const COPIER = { x: 51, w: 25 } as const;
/** The paper cabinet left of the copier. */
const CABINET = { x: 33, w: 18 } as const;
/** Width of one bay beside the core, and where the bays to the right start. */
const BAY_W = 48;
const RIGHT_BAYS_X = 128;
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
type Corner = 'desk' | 'copier';
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

/** Your desk with Leo beside it. */
function paint(target: Painter, w: number, h: number): void {
  paintOffice(target, w, h, 'desk');
}

/** The copier corner (t3). */
function paintCopierCorner(target: Painter, w: number, h: number): void {
  paintOffice(target, w, h, 'copier');
}

/** The office around one corner of it, filling a w x h stage (at least the 128x64 core). */
function paintOffice(target: Painter, w: number, h: number, corner: Corner): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind]. The copier corner starts the other way round.
  const shift = corner === 'desk' ? 0 : 1;
  const bays: [number, Bay][] = [];
  for (let x = ox - BAY_W, i = shift; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'desk']);
  }
  for (let x = ox + RIGHT_BAYS_X, i = shift; x < w; x += BAY_W, i++) {
    bays.push([x, i % 3 === 0 ? 'desk' : i % 3 === 1 ? 'window' : 'shelves']);
  }
  // Pendant lamps hang over the core's middle and over every bay without a window.
  const lamps = [ox + 61];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= CALENDAR_MIN) {
    if (corner === 'desk') {
      paintCalendar(p, ox + 36, oy - 19);
      paintClock(p, ox + 84, oy - 9);
    } else {
      paintClock(p, ox + 30, oy - 9);
      paintCalendar(p, ox + 74, oy - 19);
    }
  }
  if (oy >= SHELF_MIN) {
    paintSampleShelf(p, ox + 20, oy - 28);
    for (const [x, kind] of bays) if (kind === 'desk') paintBoxShelf(p, x + 6, oy - 26, x - ox);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') {
      paintWindow(p, x + 7, winTop, 34, winH, ox);
      paintLowCabinet(p, x + 5, oy + 43, floorTop);
      // (the window bay next to the core leaves its corner to the core's own plant)
      if (x + BAY_W !== ox) paintPlant(p, x + 37, oy + 38);
    } else if (kind === 'desk') {
      paintOtherDesk(p, x, oy, floorTop, x - ox);
    } else {
      paintBookcase(p, x + 8, oy + 12, 32, floorTop, x - ox);
    }
  }

  if (corner === 'desk') paintDeskCorner(p, ox, oy, winTop, winH, floorTop);
  else paintCopierBay(p, ox, oy, floorTop);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);
}

/** The core of the desk scene: the schedule board, your desk and chairs, the window behind Leo. */
function paintDeskCorner(
  p: Painter,
  ox: number,
  oy: number,
  winTop: number,
  winH: number,
  floorTop: number,
): void {
  const deskTop = oy + DESK.top;
  paintScheduleBoard(p, ox + 3, oy + 9);
  paintPlant(p, ox + 2, oy + 38);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  // a low cabinet under the window, a sample lamp lit on it
  glowEllipse(p, ox + 117, oy + 40, 10, 8, 'honey', [0.3, 0.16]);
  paintSideCabinet(p, ox + 98, oy + 44, floorTop);
  paintGlassLamp(p, ox + 113, oy + 44, GREEN_GLASS, true);

  // the desk against its screen, the monitor and what lies on the top
  const dx = ox + DESK.x;
  paintScreen(p, dx, oy + SCREEN_TOP, DESK.w, deskTop);
  glowEllipse(p, ox + MONITOR.x + 15, oy + MONITOR.y + 12, 22, 17, 'paper', [0.2, 0.1]);
  paintDesk(p, dx, deskTop, DESK.w, floorTop);
  paintMonitor(p, ox + MONITOR.x, oy + MONITOR.y, deskTop);
  paintDeskThings(p, dx, deskTop);
  // two chairs pushed in side by side: yours and Leo's
  paintChairBack(p, dx + 5, deskTop, floorTop, 'denim');
  paintChairBack(p, dx + 19, deskTop, floorTop, 'teal');
}

/** The core of the copier scene: a notice board, the paper cabinet, the copier, the supply cupboard. */
function paintCopierBay(p: Painter, ox: number, oy: number, floorTop: number): void {
  const top = oy + DESK.top;
  paintNoticeBoard(p, ox + 4, oy + 10);
  paintBin(p, ox + 4, floorTop);
  paintCupboard(p, ox + 95, oy + 6, 30, floorTop);
  glowEllipse(p, ox + COPIER.x + 12, top - 2, 24, 10, 'honey', [0.16, 0.08]);
  paintPaperCabinet(p, ox + CABINET.x, top, CABINET.w, floorTop);
  paintCopier(p, ox + COPIER.x, top, COPIER.w, floorTop);
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
    const sx = cx - 19 + Math.floor(hash2(i, n, 431) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 437) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 447) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 2) {
    p.rect(cx + 10, top + 4, 2, 5, 'paper');
    px(p, cx + 12, top + 4, 'paper');
    px(p, cx + 12, top + 8, 'paper');
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
  const horizon = y + h - 9;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const vx = mod(x + i - ox, VIEW_P);
    if (hash2(vx, 3, 311) < 0.05) {
      px(p, x + i, y + 1 + Math.floor(hash2(vx, 4, 323) * Math.max(3, horizon - y - 12)), 'fog');
    }
    // the far shore: low hills with a few lights
    const turn = (vx / VIEW_P) * Math.PI * 2;
    const bump = Math.max(0, Math.round(1.4 + Math.sin(turn * 2) + Math.sin(turn * 7) * 0.6));
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(vx, 5, 327) < 0.14) px(p, x + i, horizon, hash2(vx, 6, 329) < 0.5 ? 'honey' : 'lamp');
    // glints of the afterglow on the water
    if (vx % 6 === 0 && hash2(vx, 1, 333) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(vx, 2, 339) * 5);
      p.rect(x + i, gy, 2 + (vx % 3), 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  const first = Math.floor((x - ox - 40) / VIEW_P) - 1;
  for (let k = first; ox + k * VIEW_P < x + w + 40; k++) {
    const base = ox + k * VIEW_P;
    paintCrane(p, base + 104, horizon, 9);
    paintShip(p, base + 112, horizon + 5, 18);
    paintShip(p, base + 40, horizon + 4, 22);
    paintCrane(p, base + 66, horizon, 7);
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
}

/** A moored ship, its bow to the left: dark hull, containers on deck, the bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number, len: number): void {
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  p.rect(x + 2, waterline - 2, len - 3, 1, 'maroon');
  const colours: readonly PaletteName[] = ['ember', 'teal', 'denim', 'maroon'];
  for (let c = 0, cx = x + 3; cx + 3 < x + len - 6; cx += 4, c++) {
    p.rect(cx, waterline - 6, 3, 2, colours[c % colours.length] ?? 'teal');
  }
  const bx = x + len - 6;
  p.rect(bx, waterline - 8, 4, 4, 'night');
  px(p, bx + 1, waterline - 7, 'honey');
  p.rect(bx + 2, waterline - 10, 1, 2, 'ink');
}

/** A window with a white frame and sill: the harbour behind the glass, a mullion, the blind a little down. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  for (let i = 0; i < 3; i++) p.rect(x + 2, y + 2 + i * 2, w - 4, 1, 'paper');
  p.rect(x + 2, y + 7, w - 4, 1, 'fog');
  p.rect(x + w - 4, y + 8, 1, 5, 'fog');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Your desk

/** The felt screen standing behind a desk, from `top` down to the desktop. */
function paintScreen(p: Painter, x: number, top: number, w: number, deskTop: number): void {
  p.rect(x, top, w, deskTop - top, 'teal');
  for (let yy = top + 5, row = 0; yy < deskTop - 1; yy += 3, row++) {
    for (let xx = x + 3 + (row % 2) * 3; xx < x + w - 2; xx += 6) px(p, xx, yy, 'moss');
  }
  p.rect(x, top + 2, w, 1, 'moss');
  p.rect(x, top, w, 1, 'paper');
  p.rect(x, top + 1, w, 1, 'concrete');
  p.rect(x, top, 1, deskTop - top, 'concrete');
  p.rect(x + w - 1, top, 1, deskTop - top, 'moss');
  // pinned to it: Leo's first-week checklist and a sticky note
  p.rect(x + 2, top + 5, 6, 8, 'paper');
  for (let i = 0; i < 3; i++) {
    px(p, x + 3, top + 7 + i * 2, i < 2 ? 'leaf' : 'concrete');
    p.rect(x + 5, top + 7 + i * 2, 2, 1, 'concrete');
  }
  px(p, x + 4, top + 5, 'red');
  p.rect(x + w - 7, top + 6, 4, 4, 'honey');
  p.rect(x + w - 7, top + 9, 4, 1, 'lamp');
}

/**
 * A desk seen from the front: a pale wooden top, a modesty board between the
 * end panels, a pedestal of two drawers at the right end.
 */
function paintDesk(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w, 1, 'night');
  p.rect(x, top + 2, 2, foot - top - 2, 'ember');
  p.rect(x + 2, top + 2, w - 4, 5, 'ember');
  p.rect(x + 2, top + 6, w - 4, 1, 'plum');
  const dx = x + w - 15;
  p.rect(dx, top + 2, 15, foot - top - 2, 'amber');
  p.rect(dx, top + 2, 1, foot - top - 2, 'ember');
  p.rect(x + w - 2, top + 2, 2, foot - top - 2, 'ember');
  const half = Math.floor((foot - top - 2) / 2);
  for (let d = 0; d < 2; d++) {
    const dy = top + 2 + d * half;
    p.rect(dx + 1, dy + half - 1, 12, 1, 'ember');
    p.rect(dx + 5, dy + 1, 4, 1, 'honey');
  }
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
}

/**
 * A swivel chair pushed in under the desk, seen from behind: its back stops
 * just under the desktop, so it never hides what rests there.
 */
function paintChairBack(
  p: Painter,
  x: number,
  deskTop: number,
  floorTop: number,
  cloth: 'denim' | 'teal',
): void {
  const foot = floorTop + 6;
  const shade: PaletteName = cloth === 'denim' ? 'indigo' : 'moss';
  const light: PaletteName = cloth === 'denim' ? 'sky' : 'cyan';
  // the base and its casters
  p.rect(x + 1, foot - 1, 10, 1, 'ink');
  px(p, x + 1, foot, 'night');
  px(p, x + 6, foot, 'night');
  px(p, x + 10, foot, 'night');
  p.rect(x + 5, foot - 4, 2, 3, 'ink');
  // the seat's edge and the back
  p.rect(x, foot - 5, 12, 1, shade);
  const backTop = deskTop + 2;
  p.rect(x + 1, backTop, 10, foot - 5 - backTop, cloth);
  p.rect(x + 2, backTop - 1, 8, 1, cloth);
  p.rect(x + 2, backTop - 1, 8, 1, light);
  p.rect(x + 1, backTop, 1, foot - 5 - backTop, light);
  p.rect(x + 10, backTop, 1, foot - 5 - backTop, shade);
  p.rect(x + 4, backTop + 2, 4, 1, shade);
}

/**
 * The monitor at (x, y), 30 wide, on a stand down to the desktop. On the
 * screen the ordering system: a title bar, a search box, a table of product
 * codes with one order picked out, and a small lamp beside it. No letters.
 */
function paintMonitor(p: Painter, x: number, y: number, deskTop: number): void {
  // the stand
  p.rect(x + 13, y + 24, 4, deskTop - y - 26, 'slate');
  p.rect(x + 13, y + 24, 1, deskTop - y - 26, 'stone');
  p.rect(x + 8, deskTop - 3, 14, 1, 'stone');
  p.rect(x + 7, deskTop - 2, 16, 2, 'night');
  // the case
  p.rect(x + 1, y, 28, 24, 'ink');
  p.rect(x, y + 1, 30, 22, 'ink');
  p.rect(x + 2, y + 21, 26, 2, 'night');
  px(p, x + 26, y + 21, 'leaf');
  // the screen
  const sx = x + 2;
  const sy = y + 2;
  p.rect(sx, sy, 26, 19, 'paper');
  p.rect(sx, sy, 26, 3, 'teal');
  p.rect(sx + 1, sy + 1, 2, 1, 'lamp');
  p.rect(sx + 4, sy + 1, 6, 1, 'cyan');
  px(p, sx + 24, sy + 1, 'paper');
  // the search box with its lens
  p.rect(sx + 1, sy + 4, 15, 3, 'fog');
  p.rect(sx + 2, sy + 5, 13, 1, 'paper');
  p.rect(sx + 3, sy + 5, 5, 1, 'stone');
  px(p, sx + 14, sy + 5, 'teal');
  // the table: a header row, then rows of code and quantity
  p.rect(sx + 1, sy + 8, 24, 1, 'concrete');
  for (let r = 0; r < 4; r++) {
    const ry = sy + 10 + r * 2;
    const picked = r === 1;
    if (picked) p.rect(sx + 1, ry - 1, 17, 3, 'honey');
    p.rect(sx + 2, ry, 4, 1, picked ? 'amber' : 'denim');
    p.rect(sx + 8, ry, 5, 1, picked ? 'ember' : 'fog');
    p.rect(sx + 15, ry, 2, 1, picked ? 'ember' : 'concrete');
  }
  // the picked lamp, and the button to place the order
  p.rect(sx + 19, sy + 4, 6, 9, 'fog');
  p.rect(sx + 20, sy + 6, 4, 2, 'leaf');
  px(p, sx + 22, sy + 8, 'amber');
  p.rect(sx + 21, sy + 10, 3, 1, 'amber');
  p.rect(sx + 19, sy + 15, 6, 3, 'leaf');
  p.rect(sx + 21, sy + 16, 2, 1, 'paper');
}

/** What lies on your desktop: the box of new stationery, the keyboard and mouse, the welcome booklet. */
function paintDeskThings(p: Painter, x: number, top: number): void {
  // the stationery box, its lid propped behind it, pencils and a ruler standing up
  p.rect(x + 2, top - 11, 9, 2, 'sky');
  p.rect(x + 2, top - 11, 9, 1, 'paper');
  p.rect(x + 4, top - 8, 1, 4, 'lamp');
  px(p, x + 4, top - 9, 'skin');
  p.rect(x + 6, top - 9, 1, 5, 'red');
  px(p, x + 6, top - 10, 'ink');
  p.rect(x + 8, top - 10, 2, 6, 'honey');
  px(p, x + 8, top - 9, 'amber');
  px(p, x + 8, top - 7, 'amber');
  p.rect(x + 1, top - 5, 10, 5, 'tan');
  p.rect(x + 1, top - 5, 10, 1, 'skin');
  p.rect(x + 10, top - 4, 1, 4, 'ember');
  p.rect(x + 3, top - 3, 5, 2, 'paper');
  px(p, x + 4, top - 2, 'denim');
  // the keyboard in front of the stand, the mouse beside it
  p.rect(x + 13, top - 2, 19, 2, 'fog');
  for (let i = 0; i < 9; i++) px(p, x + 14 + i * 2, top - 2, 'paper');
  p.rect(x + 13, top - 1, 19, 1, 'concrete');
  p.rect(x + 33, top - 1, 3, 1, 'paper');
  px(p, x + 35, top - 1, 'fog');
  // the welcome booklet, standing against the end of the screen: the company's lamp on its cover
  const bx = x + 37;
  p.rect(bx, top - 10, 7, 10, 'denim');
  p.rect(bx, top - 10, 1, 10, 'indigo');
  p.rect(bx + 2, top - 8, 4, 2, 'honey');
  px(p, bx + 4, top - 6, 'lamp');
  p.rect(bx + 3, top - 5, 3, 1, 'lamp');
  p.rect(bx + 2, top - 3, 4, 1, 'paper');
  // a pen and a sticky pad by it
  p.rect(x + 45, top - 2, 4, 2, 'rosy');
  p.rect(x + 45, top - 1, 4, 1, 'mauve');
}

/** The whiteboard of training sessions: two weeks of five days, sessions as coloured blocks. */
function paintScheduleBoard(p: Painter, x: number, y: number): void {
  const bw = 28;
  const bh = 20;
  p.rect(x, y, bw, bh, 'concrete');
  p.rect(x + 1, y + 1, bw - 2, bh - 2, 'paper');
  p.rect(x + 1, y + bh - 2, bw - 2, 1, 'fog');
  // the title line in red marker, and the days across
  p.rect(x + 3, y + 3, 10, 1, 'red');
  px(p, x + 14, y + 3, 'red');
  const sessions: readonly (PaletteName | null)[] = [
    'lamp',
    'teal',
    'teal',
    'sky',
    'rosy',
    'teal',
    'lamp',
    null,
    'sky',
    'leaf',
  ];
  for (let wk = 0; wk < 2; wk++) {
    for (let d = 0; d < 5; d++) {
      const cx = x + 3 + d * 5;
      const cy = y + 6 + wk * 6;
      p.rect(cx, cy, 4, 5, 'fog');
      p.rect(cx, cy, 4, 1, 'concrete');
      const s = sessions[wk * 5 + d] ?? null;
      if (s) p.rect(cx, cy + 2, 4, 2, s);
    }
  }
  // the first day starred
  px(p, x + 4, y + 7, 'red');
  px(p, x + 5, y + 7, 'red');
  // the tray and two markers
  p.rect(x + 3, y + bh, bw - 6, 1, 'stone');
  p.rect(x + 6, y + bh - 1, 4, 1, 'red');
  p.rect(x + 12, y + bh - 1, 4, 1, 'denim');
}

// ---------------------------------------------------------------------------
// The copier corner

/** A metal cabinet of paper, as tall as the desk, reams stacked on it. */
function paintPaperCabinet(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w, 1, 'night');
  p.rect(x, top, w, foot - top, 'concrete');
  p.rect(x, top, w, 1, 'paper');
  p.rect(x, top + 1, w, 1, 'fog');
  p.rect(x + w - 1, top + 1, 1, foot - top - 1, 'stone');
  const half = Math.floor((foot - top - 2) / 2);
  for (let d = 0; d < 2; d++) {
    const dy = top + 2 + d * half;
    p.rect(x + 1, dy + half - 1, w - 2, 1, 'stone');
    p.rect(x + 6, dy + 2, 6, 1, 'night');
    p.rect(x + 7, dy + 3, 4, 1, 'paper');
  }
  // reams of paper and a tray of finished copies on top
  for (let i = 0; i < 3; i++) {
    p.rect(x + 1, top - 2 - i * 2, 8, 2, i === 1 ? 'sky' : 'paper');
    p.rect(x + 1, top - 1 - i * 2, 8, 1, i === 1 ? 'denim' : 'fog');
  }
  p.rect(x + 11, top - 3, 6, 3, 'night');
  p.rect(x + 12, top - 4, 4, 1, 'paper');
}

/**
 * The office copier: a pale body on a plinth, paper drawers, the document
 * feeder on top, the control panel with a red warning light, and a sheet
 * jammed in its open side door. Its top is at `top`, the desktop's height.
 */
function paintCopier(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w + 1, 1, 'night');
  // the plinth and its casters
  p.rect(x, foot - 2, w, 2, 'stone');
  px(p, x + 2, foot - 1, 'ink');
  px(p, x + w - 3, foot - 1, 'ink');
  // the body
  p.rect(x, top, w, foot - 2 - top, 'fog');
  p.rect(x, top, w, 1, 'paper');
  p.rect(x + w - 1, top + 1, 1, foot - 3 - top, 'concrete');
  p.rect(x, top + 1, 1, foot - 3 - top, 'paper');
  // the drawers of paper
  for (let d = 0; d < 2; d++) {
    const dy = top + 4 + d * 4;
    p.rect(x + 1, dy, w - 2, 1, 'concrete');
    p.rect(x + 8, dy + 2, 8, 1, 'stone');
  }
  // the side door hanging open, a sheet jammed in it
  p.rect(x - 2, top + 2, 2, 8, 'concrete');
  p.rect(x - 2, top + 2, 1, 8, 'fog');
  p.rect(x - 4, top + 5, 3, 3, 'paper');
  px(p, x - 4, top + 7, 'fog');
  px(p, x - 3, top + 4, 'paper');
  // the document feeder on top, its tray of originals slanting up to the left
  p.rect(x + 1, top - 8, w - 8, 8, 'paper');
  p.rect(x + 1, top - 8, w - 8, 1, 'fog');
  p.rect(x + w - 8, top - 7, 1, 7, 'concrete');
  p.rect(x + 3, top - 5, w - 12, 1, 'night'); // the slot the copies come out of
  p.rect(x + 1, top - 2, w - 8, 1, 'concrete');
  p.rect(x + 1, top - 1, w - 8, 1, 'stone');
  p.rect(x + 3, top - 10, 10, 2, 'paper');
  p.rect(x + 4, top - 11, 7, 1, 'paper');
  p.rect(x + 4, top - 10, 7, 1, 'fog');
  // a red "out of order" note taped on the feeder
  p.rect(x + 12, top - 4, 4, 3, 'rosy');
  px(p, x + 13, top - 3, 'red');
  // the control panel: a small screen with a warning, the keys, the red light
  const cx = x + w - 7;
  p.rect(cx, top - 4, 7, 4, 'stone');
  p.rect(cx, top - 4, 7, 1, 'concrete');
  p.rect(cx + 1, top - 3, 3, 2, 'cyan');
  px(p, cx + 2, top - 3, 'red');
  px(p, cx + 5, top - 3, 'red');
  px(p, cx + 5, top - 2, 'paper');
  // a sign of the company's lamp on the front
  px(p, x + w - 5, top + 2, 'teal');
  p.rect(x + 2, top + 2, 5, 1, 'stone');
}

/** A pin board of notices over the copier corner. */
function paintNoticeBoard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 26, 20, 'ember');
  p.rect(x + 1, y + 1, 24, 18, 'tan');
  ditherRect(p, x + 1, y + 1, 24, 18, 'amber', 3);
  const notes: readonly [number, number, number, number, PaletteName][] = [
    [3, 3, 7, 9, 'paper'],
    [12, 2, 6, 6, 'honey'],
    [19, 4, 5, 7, 'paper'],
    [12, 10, 9, 7, 'paper'],
    [3, 13, 6, 5, 'sky'],
  ];
  for (const [nx, ny, nw, nh, c] of notes) {
    p.rect(x + nx, y + ny, nw, nh, c);
    px(p, x + nx + Math.floor(nw / 2), y + ny, 'red');
    if (c === 'paper' && nh > 6) {
      for (let r = ny + 2; r < ny + nh - 1; r += 2) p.rect(x + nx + 1, y + r, nw - 2, 1, 'fog');
    }
  }
  // the copier's sign: a sheet with an arrow coming out
  p.rect(x + 14, y + 12, 2, 1, 'denim');
  p.rect(x + 16, y + 12, 1, 3, 'denim');
}

/** A recycling bin with a few spoiled copies in it. */
function paintBin(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x, foot - 9, 9, 9, 'denim');
  p.rect(x, foot - 9, 9, 1, 'sky');
  p.rect(x + 8, foot - 8, 1, 8, 'indigo');
  p.rect(x + 3, foot - 6, 3, 3, 'sky');
  p.rect(x + 1, foot - 11, 4, 2, 'paper');
  p.rect(x + 5, foot - 10, 3, 1, 'fog');
}

/** A tall supply cupboard with its glass doors: reams of paper, boxes of toner, envelopes. */
function paintCupboard(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'stone');
  p.rect(x, top, w, 1, 'concrete');
  p.rect(x + 2, top + 2, w - 4, bottom - top - 4, 'night');
  for (let s = 0, sy = top + 11; sy < bottom - 3; sy += 10, s++) {
    p.rect(x + 2, sy, w - 4, 1, 'concrete');
    for (let i = 0, bx = x + 3; bx + 5 < x + w - 2; bx += 6, i++) {
      const kind = hash2(i, s, 451);
      if (kind < 0.45) {
        for (let r = 0; r < 3; r++) p.rect(bx, sy - 2 - r * 2, 5, 2, r === 1 ? 'fog' : 'paper');
      } else if (kind < 0.8) {
        p.rect(bx, sy - 4, 5, 4, 'ink');
        p.rect(bx, sy - 4, 5, 1, 'slate');
        px(p, bx + 1, sy - 2, 'cyan');
      } else {
        p.rect(bx, sy - 7, 5, 7, 'tan');
        p.rect(bx + 1, sy - 6, 3, 1, 'paper');
      }
    }
  }
  // the doors' frames and their handles
  p.rect(x + Math.floor(w / 2), top + 2, 1, bottom - top - 4, 'stone');
  px(p, x + Math.floor(w / 2) - 2, top + 22, 'honey');
  px(p, x + Math.floor(w / 2) + 2, top + 22, 'honey');
  ditherRect(p, x + 3, top + 3, 3, 8, 'fog', 4);
}

// ---------------------------------------------------------------------------
// The rest of the office

/** One of the company's glass desk lamps: a brass foot and stem under a long glass shade. */
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

/** A low wooden cabinet under the window in the core. */
function paintSideCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const cw = 28;
  p.rect(x, top, cw, floorTop + 1 - top, 'ember');
  p.rect(x - 1, top, cw + 2, 1, 'honey');
  p.rect(x - 1, top + 1, cw + 2, 1, 'amber');
  p.rect(x + 13, top + 2, 1, floorTop - top - 1, 'plum');
  px(p, x + 11, top + 6, 'honey');
  px(p, x + 15, top + 6, 'honey');
  // binders lying flat on its top
  p.rect(x + 2, top - 2, 9, 2, 'red');
  p.rect(x + 3, top - 4, 8, 2, 'paper');
  px(p, x + 3, top - 1, 'paper');
}

/** A small monitor on a desk, gone dark for the evening. */
function paintSmallMonitor(p: Painter, x: number, deskTop: number): void {
  const y = deskTop - 15;
  p.rect(x + 6, y + 11, 3, 2, 'slate');
  p.rect(x + 4, y + 13, 7, 2, 'night');
  p.rect(x, y, 15, 11, 'ink');
  p.rect(x + 1, y + 1, 13, 8, 'night');
  p.rect(x + 2, y + 2, 2, 1, 'slate');
  px(p, x + 2, y + 3, 'slate');
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
    if (hash2(i, seed, 357) < 0.12) continue;
    const [spine, shade] = BINDERS[Math.floor(hash2(i, seed, 363) * BINDERS.length)] ?? [
      'denim',
      'indigo',
    ];
    const bh = 8 + Math.floor(hash2(i, seed, 369) * 2);
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

/** The long shelf up the wall: sample lamps in their different glass between boxes of stock. */
function paintSampleShelf(p: Painter, x: number, y: number): void {
  paintBoard(p, x, y, 84);
  paintBox(p, x + 2, y, 9, 7);
  paintGlassLamp(p, x + 14, y, ROSE_GLASS, false);
  paintBinders(p, x + 26, x + 38, y, 9);
  // (the cord of the lamp over the core comes down here)
  paintGlassLamp(p, x + 46, y, TEAL_GLASS, false);
  paintBox(p, x + 58, y, 8, 6);
  paintBox(p, x + 59, y - 6, 6, 4);
  paintGlassLamp(p, x + 70, y, BLUE_GLASS, false);
}

/** A shorter shelf of boxes and binders over one of the other desks. */
function paintBoxShelf(p: Painter, x: number, y: number, seed: number): void {
  paintBoard(p, x, y, 36);
  paintBinders(p, x + 2, x + 17, y, seed + 11);
  paintBox(p, x + 19, y, 8, 7);
  paintBox(p, x + 28, y, 6, 5);
}

/** A wall calendar turned to April: a green head, the days as dots, the first one ringed. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x, y, 16, 16, 'paper');
  p.rect(x, y, 16, 4, 'leaf');
  px(p, x + 4, y - 1, 'ink');
  px(p, x + 11, y - 1, 'ink');
  p.rect(x + 3, y + 1, 6, 1, 'paper');
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      if (r === 0 && c < 2) continue;
      if (r === 4 && c > 3) break;
      px(p, x + 1 + c * 2, y + 6 + r * 2, c === 6 ? 'rosy' : 'concrete');
    }
  }
  // the first, ringed in red, and the end of Leo's two weeks marked
  p.rect(x + 4, y + 5, 3, 3, 'red');
  px(p, x + 5, y + 6, 'paper');
  px(p, x + 11, y + 10, 'teal');
  p.rect(x + 1, y + 16, 16, 1, 'concrete');
}

/** A low filing cabinet under a window, a printer on it with a sheet coming out. */
function paintLowCabinet(p: Painter, x: number, top: number, floorTop: number): void {
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
  p.rect(x + 3, top - 6, 13, 6, 'paper');
  p.rect(x + 3, top - 6, 13, 1, 'fog');
  p.rect(x + 15, top - 5, 1, 5, 'fog');
  p.rect(x + 5, top - 3, 9, 1, 'ink');
  p.rect(x + 6, top - 9, 7, 3, 'paper');
  p.rect(x + 7, top - 8, 4, 1, 'fog');
  px(p, x + 13, top - 5, 'leaf');
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
  paintBox(p, x + 1, top, 9, 6);
  paintBox(p, x + 23, top, 7, 5);
}

/** One of the other desks: its screen, a monitor gone dark, a glass lamp left on, a chair pushed in. */
function paintOtherDesk(p: Painter, x: number, oy: number, floorTop: number, seed: number): void {
  const top = oy + DESK.top;
  const glass =
    [ROSE_GLASS, BLUE_GLASS, GREEN_GLASS][mod(Math.floor(seed / BAY_W), 3)] ?? ROSE_GLASS;
  paintScreen(p, x + 3, oy + SCREEN_TOP + 2, 42, top);
  glowEllipse(p, x + 36, top - 5, 11, 9, 'honey', [0.34, 0.18]);
  paintDesk(p, x + 3, top, 42, floorTop);
  paintSmallMonitor(p, x + 12, top);
  paintGlassLamp(p, x + 32, top, glass, true);
  paintChairBack(p, x + 14, top, floorTop, hash2(seed, 2, 377) < 0.5 ? 'denim' : 'teal');
}

export const TRAINING_STAGE: StageConfig = {
  paint,
  backdrops: { coworker: paintCopierCorner },
  cast: {
    guide: GUIDE_ACTOR,
    // Leo stands at the desk's far end (by the copier in t3), whoever else is there.
    new_hire: { sprite: NEW_HIRE_SPRITE, ...LEO, side: 'right' },
    // With Leo there, Ms. Carter stands behind him in front of the window, Dan a step nearer.
    manager: { sprite: MANAGER_SPRITE, ...LEO, side: 'right', beside: { x: 96, y: LEO.y } },
    coworker: { sprite: COWORKER_SPRITE, ...LEO, side: 'right', beside: { x: 93, y: LEO.y } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 60, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 89, y: 25 } },
  rest: {
    left: { x: 38, y: PROP_TOP },
    right: { x: 52, y: PROP_TOP },
  },
};
