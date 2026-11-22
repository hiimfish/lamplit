import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { SUPPLIER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPicture, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The purchasing stage: the visitor corner of the Harbor Trading office on a
 * March evening, where a supplier shows his samples. From the left: a plant
 * and a window onto the harbour at dusk (you stand below it), a wall calendar
 * with the delivery date ringed, a round wooden table on a green rug under a
 * pendant lamp. On the table, from your end: the standard glass desk lamp
 * (unlit), the supplier's catalog, a calculator and the large lamp, switched
 * on, its glow on the wall and the tabletop. Jack's sample case stands under
 * the table at his end. On the wall to the right hangs the company's display
 * case of lamps, some of them lit. Jack stands at the table's far end;
 * Ms. Carter stands there too when she is alone with you, or a step further
 * right, under the display case, when Jack is there. Handed-over things rest
 * on the tabletop.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (taller windows, the lighting sign over
 * the display case, a clock, a shelf of cartons, a poster of a lamp, then
 * the office's darker upper wall with high windows onto the night sky); the
 * visitor sofa with its floor lamp, more windows and the office door go to
 * the left, more windows, stacked cartons and more display cases to the
 * right. Painted through the Painter interface, palette colours only, whole
 * pixels.
 */

/** The round table's left edge, width and the y of its top, in core pixels (props rest on it). */
const TABLE = { x: 34, w: 50, top: 48 } as const;
/** 24x24 pictures stand on the tabletop with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The harbour window in the core: its outer frame. */
const WINDOW = { x: 2, y: 4, w: 31, h: 29 } as const;
/** The display case of lamps on the wall: its outer frame. */
const DISPLAY = { x: 92, y: 3, w: 35, h: 33 } as const;
/** The pendant lamp over the table, and the lit sample lamp on it (core x of their centres). */
const PENDANT_X = 58;
const LIT_LAMP_X = 76;
/** Where the people at the table's far end stand. */
const BY_TABLE = { x: 80, y: 39 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the sign, the clock, the carton shelf, the poster and the picture. */
const SIGN_MIN = 14;
const CLOCK_MIN = 16;
const SHELF_MIN = 28;
const POSTER_MIN = 31;
const PICTURE_MIN = 41;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 56;
const CORNICE_UP = 44;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 22;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

type Bay = 'sofa' | 'window' | 'door' | 'cartons' | 'display';
const LEFT_BAYS: readonly Bay[] = ['sofa', 'window', 'door', 'window'];
const RIGHT_BAYS: readonly Bay[] = ['window', 'cartons', 'window', 'display'];

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

/** Paints the visitor corner to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 8));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind]. Pendants hang over the ones without a window.
  const bays: [number, Bay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, LEFT_BAYS[i % LEFT_BAYS.length] ?? 'window']);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  const pendants = [ox + PENDANT_X];
  for (const [x, kind] of bays) {
    if (kind === 'door' || kind === 'cartons') pendants.push(x + BAY_W / 2);
  }

  // The wall, warm where the lamps light it; the lit sample lamp glows strongest.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of pendants) glowEllipse(p, lx, oy + 12, 28, 22, 'honey', [0.2, 0.12, 0.06]);
  for (const [x, kind] of bays) {
    if (kind === 'sofa') glowEllipse(p, x + 37, oy + 26, 18, 16, 'honey', [0.3, 0.18, 0.08]);
  }
  glowEllipse(p, ox + LIT_LAMP_X, oy + 40, 20, 15, 'honey', [0.42, 0.26, 0.14, 0.06]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= SIGN_MIN) paintSign(p, ox + DISPLAY.x + 6, oy - 11);
  if (oy >= CLOCK_MIN) paintClock(p, ox + 45, oy - 9);
  if (oy >= SHELF_MIN) paintCartonShelf(p, ox + DISPLAY.x - 1, oy - 16);
  if (oy >= POSTER_MIN) paintPoster(p, ox + 64, oy - 30);
  if (oy >= PICTURE_MIN) paintPicture(p, ox + 34, oy - 38);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'sofa') paintSofaBay(p, x, oy, floorTop);
    else if (kind === 'window') paintWindow(p, x + 6, winTop, 32, winH, ox);
    else if (kind === 'door') paintDoor(p, x + 8, oy + 14, floorTop);
    else if (kind === 'cartons') paintCartonBay(p, x, oy, floorTop);
    else paintDisplay(p, x + 5, oy + DISPLAY.y, x);
  }

  // The core: the harbour window, the calendar, the display case of lamps.
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintCalendar(p, ox + 39, oy + 13);
  paintDisplay(p, ox + DISPLAY.x, oy + DISPLAY.y, 0);
  for (const lx of pendants) paintPendant(p, lx, cornice, oy);
  paintPlant(p, ox + 3, oy + 38);

  // The visitor corner itself: the rug, the sample case, the table and what is on it.
  paintRug(p, ox + 59, oy + 60);
  paintSampleCase(p, ox + 67, oy + 62);
  paintTable(p, ox + TABLE.x, oy + TABLE.top, oy + 62);
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
  p.rect(cx, from, 1, oy + 4 - from, 'ink');
  p.rect(cx - 1, oy + 4, 3, 1, 'ember');
  p.rect(cx - 2, oy + 5, 5, 1, 'amber');
  p.rect(cx - 3, oy + 6, 7, 1, 'amber');
  p.rect(cx - 4, oy + 7, 9, 1, 'ember');
  p.rect(cx - 2, oy + 8, 5, 1, 'honey');
  px(p, cx - 2, oy + 6, 'lamp');
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
    const first = Math.floor(-(ox + 40) / HIGH_GAP) - 1;
    for (let k = first; ox + 40 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 40 + k * HIGH_GAP, top, wh, k);
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
    const sx = cx - 19 + Math.floor(hash2(i, n, 231) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 237) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 239) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 1) {
    p.rect(cx - 12, top + 4, 2, 5, 'paper');
    px(p, cx - 10, top + 4, 'paper');
    px(p, cx - 10, top + 8, 'paper');
    px(p, cx - 13, top + 5, 'honey');
    px(p, cx - 13, top + 7, 'honey');
  }
  p.rect(cx, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; the scene repeats so every window shows a piece of it. */
const HARBOUR_P = 176;

/**
 * The harbour at dusk seen through a window: its glass from (x, y), w x h.
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
  const horizon = y + h - 10;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  // the water, darker towards us, with a few long glints of the afterglow
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hx % 7 === 0 && hash2(hx, 1, 171) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 173) * 6);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 5 ? 'rosy' : 'violet');
    }
    // a few early stars
    if (hash2(hx, 3, 179) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 183) * Math.max(3, horizon - y - 12)), 'fog');
    }
    // the far shore: low hills with lights
    const bump = Math.round(1.5 + Math.sin(hx / 9) + Math.sin(hx / 4.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 189) < 0.12) px(p, x + i, horizon, hash2(hx, 6, 197) < 0.5 ? 'honey' : 'lamp');
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 60) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 60; k++) {
    const base = ox + k * HARBOUR_P;
    paintQuay(p, base + 96, base + 170, horizon);
    paintCrane(p, base + 112, horizon, 9);
    paintCrane(p, base + 152, horizon, 8);
    paintShip(p, base + 6, horizon + 6, 23);
    paintShip(p, base + 134, horizon + 5, 18);
    paintBuoy(p, base + 60, horizon + 7);
  }
}

/** The container quay from x0 to x1 just below the horizon, stacks of containers on it. */
function paintQuay(p: Painter, x0: number, x1: number, horizon: number): void {
  const colours: readonly PaletteName[] = ['maroon', 'teal', 'ember', 'denim', 'maroon', 'moss'];
  for (let x = x0 + 2, i = 0; x + 4 <= x1; x += 5, i++) {
    const stack = 1 + Math.floor(hash2(i, 7, 201) * 3);
    for (let s = 0; s < stack; s++) {
      p.rect(x, horizon - 2 - s * 2, 4, 2, colours[(i + s * 2) % colours.length] ?? 'maroon');
    }
  }
  p.rect(x0, horizon, x1 - x0, 2, 'ink');
  p.rect(x0, horizon - 1, x1 - x0, 1, 'night');
  // its lights on the water
  for (let x = x0 + 4; x < x1; x += 11) {
    px(p, x, horizon - 1, 'honey');
    px(p, x, horizon + 3, 'lamp');
    px(p, x, horizon + 5, 'amber');
  }
}

/**
 * A container crane on the quay: a portal on two legs, a boom reaching out
 * over the water to the left, an A-frame on top with stays to both ends.
 */
function paintCrane(p: Painter, x: number, horizon: number, tall: number): void {
  const boom = horizon - tall; // the boom's row
  const apex = boom - 6;
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 6, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 7, 1, 'ink'); // the portal beam
  p.rect(x - 14, boom, 25, 1, 'ink');
  p.rect(x + 7, boom - 1, 4, 1, 'ink'); // the counterweight
  p.rect(x + 3, apex, 1, 6, 'ink');
  // stays from the apex down to the boom tip and the back
  for (let i = 1; i < 17; i++) px(p, x + 3 - i, apex + Math.floor((i * 6) / 17), 'ink');
  for (let i = 1; i < 6; i++) px(p, x + 3 + i, apex + i, 'ink');
  px(p, x + 3, apex - 1, 'red'); // the warning light
  // the trolley with its cab, and the hook hanging over the water
  p.rect(x - 8, boom + 1, 3, 2, 'night');
  px(p, x - 7, boom + 1, 'honey');
  p.rect(x - 7, boom + 3, 1, 3, 'night');
}

/** A moored ship, its bow to the left: dark hull, stacked containers, the bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number, len: number): void {
  // hull
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  px(p, x, waterline - 3, 'night');
  p.rect(x + 2, waterline - 2, len - 3, 1, 'maroon');
  // containers on deck
  const colours: readonly PaletteName[] = ['ember', 'teal', 'denim', 'maroon'];
  for (let c = 0, cx = x + 3; cx + 3 < x + len - 7; cx += 4, c++) {
    p.rect(cx, waterline - 6, 3, 2, colours[c % colours.length] ?? 'teal');
  }
  // the bridge and funnel at the stern
  const bx = x + len - 7;
  p.rect(bx, waterline - 9, 5, 5, 'night');
  p.rect(bx, waterline - 9, 5, 1, 'stone');
  px(p, bx + 1, waterline - 7, 'honey');
  px(p, bx + 3, waterline - 7, 'honey');
  p.rect(bx + 2, waterline - 12, 2, 3, 'ink');
  px(p, bx + 2, waterline - 12, 'red');
  // the masthead light, and its glow on the water
  px(p, x + 2, waterline - 6, 'lamp');
  px(p, bx + 2, waterline + 1, 'lamp');
  px(p, bx + 2, waterline + 3, 'amber');
}

/** A channel buoy with its little light. */
function paintBuoy(p: Painter, x: number, y: number): void {
  p.rect(x, y - 1, 3, 2, 'red');
  px(p, x + 1, y - 3, 'ink');
  px(p, x + 1, y - 4, 'honey');
  px(p, x + 1, y + 2, 'amber');
}

/** A window with a white frame and sill: the harbour behind the glass, a mullion down the middle. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  p.rect(x + 2, y + 2, w - 4, 1, 'concrete');
  // the sill and its shadow
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Lamps

/** Glass colours of the unlit lamps: the glass and its highlight. */
const GLASS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['teal', 'cyan'],
  ['neonDeep', 'neon'],
  ['denim', 'sky'],
  ['mauve', 'rosy'],
  ['sky', 'paper'],
];

/** The six lamps of the core's display case, top row first: [shape, glass, lit]. */
const CORE_CASE: readonly (readonly [number, number, boolean])[] = [
  [0, 0, false],
  [1, 0, true],
  [2, 2, false],
  [2, 0, true],
  [1, 3, false],
  [0, 1, false],
];

/**
 * A small lamp standing on a shelf at `base` (its lowest row), centred on
 * `cx`: one of four shapes, lit (warm, with a little glow) or dark glass.
 */
function paintShelfLamp(
  p: Painter,
  cx: number,
  base: number,
  shape: number,
  glass: number,
  lit: boolean,
): void {
  const [body, shine] = lit ? (['honey', 'paper'] as const) : (GLASS[glass % GLASS.length] ?? []);
  if (!body || !shine) return;
  if (lit) glowEllipse(p, cx, base - 5, 6, 6, 'honey', [0.32, 0.16]);
  const rim: PaletteName = lit ? 'lamp' : body;
  if (shape === 0) {
    // a dome shade on a brass stem
    p.rect(cx - 1, base - 8, 3, 1, body);
    p.rect(cx - 2, base - 7, 5, 1, body);
    p.rect(cx - 3, base - 6, 7, 1, body);
    p.rect(cx - 3, base - 5, 7, 1, rim);
    px(p, cx - 1, base - 7, shine);
    px(p, cx - 2, base - 6, shine);
    p.rect(cx, base - 4, 1, 3, 'amber');
    p.rect(cx - 2, base - 1, 5, 1, 'amber');
    p.rect(cx - 2, base, 5, 1, 'ember');
  } else if (shape === 1) {
    // a glass globe on a small foot
    p.rect(cx - 1, base - 8, 3, 1, body);
    p.rect(cx - 2, base - 7, 5, 4, body);
    p.rect(cx - 1, base - 3, 3, 1, rim);
    p.rect(cx - 1, base - 7, 2, 2, shine);
    p.rect(cx - 1, base - 2, 3, 1, 'amber');
    p.rect(cx - 2, base - 1, 5, 2, 'ember');
    p.rect(cx - 2, base - 1, 5, 1, 'amber');
  } else if (shape === 2) {
    // a cone shade on a tall stem
    p.rect(cx - 1, base - 9, 3, 1, body);
    p.rect(cx - 2, base - 8, 5, 1, body);
    p.rect(cx - 3, base - 7, 7, 1, body);
    p.rect(cx - 3, base - 6, 7, 1, rim);
    px(p, cx - 1, base - 8, shine);
    p.rect(cx, base - 5, 1, 5, 'concrete');
    p.rect(cx - 2, base, 5, 1, 'concrete');
    px(p, cx - 2, base, 'fog');
  } else {
    // a tall glass cylinder with a brass cap
    p.rect(cx - 1, base - 9, 3, 1, 'amber');
    p.rect(cx - 2, base - 8, 5, 7, body);
    p.rect(cx - 1, base - 7, 1, 5, shine);
    p.rect(cx - 2, base - 2, 5, 1, rim);
    p.rect(cx - 2, base - 1, 5, 2, 'ember');
    p.rect(cx - 2, base - 1, 5, 1, 'amber');
  }
}

/**
 * The display case on the wall: a wooden frame, a dark back, two shelves of
 * three lamps each. `seed` varies which lamps stand in a case and which are lit.
 */
function paintDisplay(p: Painter, x: number, y: number, seed: number): void {
  const { w, h } = DISPLAY;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + w - 1, y + 1, 1, h - 1, 'plum');
  p.rect(x + 2, y + 2, w - 4, h - 4, 'night');
  p.rect(x + 2, y + 2, w - 4, 1, 'ink');
  p.rect(x + 2, y + 17, w - 4, 1, 'ink');
  // the wall under it, in its shadow
  p.rect(x + 1, y + h, w - 1, 1, 'concrete');
  for (let row = 0; row < 2; row++) {
    const base = y + 15 + row * 14;
    for (let col = 0; col < 3; col++) {
      const n = row * 3 + col;
      const lit = hash2(n, seed, 211) < 0.4;
      // the tall cylinder only reads as a lamp when it is lit
      const shape = Math.floor(hash2(n, seed, 213) * (lit ? 4 : 3));
      const [s, g, on] = seed === 0 ? (CORE_CASE[n] ?? [0, 0, false]) : [shape, n + seed, lit];
      paintShelfLamp(p, x + 7 + col * 10, base, s, mod(g, GLASS.length), on);
    }
    p.rect(x + 2, base + 1, w - 4, 1, 'amber');
  }
}

/** The lighting sign over the display case: a glowing bulb and three short words. */
function paintSign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 23, 9, 'ink');
  p.rect(x + 1, y + 1, 21, 7, 'deep');
  // the bulb
  p.rect(x + 3, y + 2, 3, 3, 'honey');
  px(p, x + 4, y + 3, 'paper');
  px(p, x + 4, y + 5, 'lamp');
  px(p, x + 4, y + 6, 'fog');
  // rays
  px(p, x + 2, y + 1, 'lamp');
  px(p, x + 6, y + 1, 'lamp');
  px(p, x + 7, y + 3, 'lamp');
  // lettering, too small to read
  p.rect(x + 9, y + 2, 11, 1, 'paper');
  p.rect(x + 9, y + 4, 7, 1, 'fog');
  p.rect(x + 9, y + 6, 9, 1, 'fog');
  p.rect(x + 1, y + 9, 23, 1, 'concrete');
}

/**
 * A sample desk lamp standing on the table at `top` (the tabletop's first
 * row), centred on `cx`: the large model, switched on, or the standard one, dark.
 */
function paintSampleLamp(p: Painter, cx: number, top: number, lit: boolean): void {
  if (lit) {
    // a glowing glass dome, a brass stem, a glass foot
    p.rect(cx - 1, top - 11, 3, 1, 'lamp');
    p.rect(cx - 2, top - 10, 5, 1, 'lamp');
    p.rect(cx - 3, top - 9, 7, 2, 'lamp');
    p.rect(cx - 3, top - 7, 7, 1, 'amber');
    p.rect(cx - 1, top - 10, 3, 1, 'honey');
    p.rect(cx - 2, top - 9, 5, 2, 'honey');
    p.rect(cx - 1, top - 9, 2, 2, 'paper');
    p.rect(cx, top - 6, 1, 4, 'amber');
    px(p, cx, top - 6, 'honey');
    p.rect(cx - 1, top - 2, 3, 1, 'amber');
    p.rect(cx - 2, top - 1, 5, 1, 'ember');
    p.rect(cx - 1, top - 1, 2, 1, 'amber');
    return;
  }
  // the standard model: a dark teal glass dome
  p.rect(cx - 1, top - 9, 3, 1, 'teal');
  p.rect(cx - 2, top - 8, 5, 2, 'teal');
  p.rect(cx - 2, top - 6, 5, 1, 'moss');
  px(p, cx - 1, top - 8, 'cyan');
  p.rect(cx, top - 5, 1, 3, 'amber');
  p.rect(cx - 1, top - 2, 3, 1, 'amber');
  p.rect(cx - 2, top - 1, 5, 1, 'ember');
}

// ---------------------------------------------------------------------------
// The visitor corner

/** A round green rug seen from the side, centred on (cx, cy). */
function paintRug(p: Painter, cx: number, cy: number): void {
  const halves = [32, 38, 41, 41, 38, 32];
  halves.forEach((half, row) => p.rect(cx - half, cy - 2 + row, half * 2 + 1, 1, 'moss'));
  // a lighter band just inside the edge
  p.rect(cx - 30, cy - 1, 61, 1, 'leaf');
  p.rect(cx - 34, cy + 2, 69, 1, 'leaf');
  for (const side of [-1, 1]) {
    p.rect(cx + side * 34 - 1, cy, 3, 1, 'leaf');
    p.rect(cx + side * 36 - 1, cy + 1, 3, 1, 'leaf');
  }
}

/**
 * The round table: a wooden top on one turned leg with a spreading foot that
 * stands on `footY`. On it, from your end: the standard lamp, the catalog, a
 * calculator and the large lamp, lit.
 */
function paintTable(p: Painter, x: number, top: number, footY: number): void {
  const w = TABLE.w;
  const cx = x + w / 2;
  // the foot and the leg
  p.rect(cx - 9, footY, 18, 1, 'night');
  p.rect(cx - 8, footY - 1, 16, 1, 'ember');
  p.rect(cx - 6, footY - 2, 12, 1, 'ember');
  p.rect(cx - 5, footY - 2, 6, 1, 'amber');
  p.rect(cx - 2, top + 4, 4, footY - 2 - top - 4, 'ember');
  p.rect(cx - 2, top + 4, 1, footY - 2 - top - 4, 'amber');
  p.rect(cx + 1, top + 4, 1, footY - 2 - top - 4, 'plum');
  p.rect(cx - 3, top + 4, 6, 1, 'plum');
  // the top: a thin disc, lit where the lamp stands
  p.rect(x + 2, top, w - 4, 1, 'amber');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 1, 'ember');
  p.rect(x + 5, top + 3, w - 10, 1, 'plum');
  const lampX = LIT_LAMP_X - TABLE.x;
  p.rect(x + lampX - 16, top, 20, 1, 'lamp');
  p.rect(x + lampX - 10, top, 14, 1, 'honey');
  p.rect(x + lampX - 6, top + 1, 9, 1, 'lamp');

  // the standard lamp, dark, at your end
  paintSampleLamp(p, x + 3, top, false);
  // the catalog: a closed booklet with a teal cover
  p.rect(x + 12, top - 2, 10, 1, 'teal');
  px(p, x + 14, top - 2, 'honey');
  p.rect(x + 12, top - 1, 10, 1, 'paper');
  px(p, x + 21, top - 1, 'fog');
  // the calculator: a little wedge with a display and keys
  p.rect(x + 27, top - 3, 4, 1, 'cyan');
  p.rect(x + 26, top - 2, 6, 1, 'ink');
  p.rect(x + 25, top - 1, 7, 1, 'ink');
  px(p, x + 26, top - 1, 'fog');
  px(p, x + 28, top - 1, 'fog');
  px(p, x + 30, top - 1, 'lamp');
  // the large lamp, switched on, at Jack's end
  paintSampleLamp(p, x + lampX, top, true);
}

/** Jack's sample case standing on the floor at `bottom`: teal, brass latches, a handle. */
function paintSampleCase(p: Painter, x: number, bottom: number): void {
  p.rect(x, bottom, 14, 1, 'night');
  p.rect(x, bottom - 8, 13, 8, 'teal');
  p.rect(x, bottom - 8, 13, 1, 'cyan');
  p.rect(x + 12, bottom - 7, 1, 7, 'moss');
  p.rect(x, bottom - 1, 13, 1, 'moss');
  p.rect(x, bottom - 5, 13, 1, 'moss');
  px(p, x + 3, bottom - 5, 'honey');
  px(p, x + 9, bottom - 5, 'honey');
  // the handle
  p.rect(x + 4, bottom - 10, 5, 1, 'ink');
  px(p, x + 4, bottom - 9, 'ink');
  px(p, x + 8, bottom - 9, 'ink');
  // a paper tag
  p.rect(x + 1, bottom - 3, 3, 2, 'paper');
}

/** A wall calendar: this month's page, the delivery date ringed in red. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 16, 13, 1, 'concrete');
  p.rect(x, y, 13, 16, 'paper');
  p.rect(x, y, 13, 4, 'red');
  p.rect(x, y + 3, 13, 1, 'maroon');
  px(p, x + 3, y - 1, 'ink');
  px(p, x + 9, y - 1, 'ink');
  p.rect(x + 3, y + 1, 7, 1, 'paper');
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++)
      px(p, x + 2 + col * 2, y + 6 + row * 2 + (row > 1 ? 1 : 0), 'fog');
  }
  // the ringed day
  p.rect(x + 7, y + 9, 3, 3, 'red');
  px(p, x + 8, y + 10, 'paper');
}

// ---------------------------------------------------------------------------
// Beside and above the core

/** A small framed drawing of one lamp, its glass in `glass`. */
function paintSketch(p: Painter, x: number, y: number, glass: PaletteName): void {
  p.rect(x + 1, y + 13, 10, 1, 'concrete');
  p.rect(x, y, 10, 13, 'slate');
  p.rect(x + 1, y + 1, 8, 11, 'paper');
  p.rect(x + 4, y + 3, 2, 1, glass);
  p.rect(x + 3, y + 4, 4, 2, glass);
  p.rect(x + 4, y + 6, 1, 3, 'stone');
  p.rect(x + 3, y + 9, 4, 1, 'stone');
}

/** The visitor sofa under two framed drawings, a floor lamp lit beside it. */
function paintSofaBay(p: Painter, x: number, oy: number, floorTop: number): void {
  paintSketch(p, x + 6, oy + 18, 'teal');
  paintSketch(p, x + 19, oy + 18, 'neonDeep');
  // the sofa
  const sx = x + 3;
  const seat = oy + 50;
  p.rect(sx + 1, floorTop + 4, 28, 1, 'night');
  p.rect(sx + 2, seat + 6, 2, floorTop + 4 - seat - 6, 'ink');
  p.rect(sx + 25, seat + 6, 2, floorTop + 4 - seat - 6, 'ink');
  p.rect(sx + 2, seat - 9, 25, 10, 'teal');
  p.rect(sx + 3, seat - 10, 23, 1, 'teal');
  p.rect(sx + 3, seat - 9, 23, 1, 'cyan');
  p.rect(sx + 14, seat - 8, 1, 8, 'moss');
  p.rect(sx, seat - 4, 3, 10, 'teal');
  p.rect(sx + 26, seat - 4, 3, 10, 'teal');
  p.rect(sx, seat - 4, 3, 1, 'cyan');
  p.rect(sx + 26, seat - 4, 3, 1, 'cyan');
  p.rect(sx + 3, seat, 23, 3, 'teal');
  p.rect(sx + 3, seat, 23, 1, 'cyan');
  p.rect(sx + 3, seat + 3, 23, 3, 'moss');
  // a cushion
  p.rect(sx + 5, seat - 6, 6, 6, 'lamp');
  p.rect(sx + 5, seat - 6, 6, 1, 'honey');
  px(p, sx + 10, seat - 1, 'amber');
  // the floor lamp
  const lx = x + 37;
  p.rect(lx - 4, floorTop + 4, 9, 1, 'night');
  p.rect(lx - 3, floorTop + 3, 7, 1, 'ink');
  p.rect(lx, oy + 28, 1, floorTop + 3 - oy - 28, 'ink');
  p.rect(lx - 2, oy + 20, 5, 1, 'honey');
  p.rect(lx - 3, oy + 21, 7, 3, 'honey');
  p.rect(lx - 4, oy + 24, 9, 3, 'honey');
  p.rect(lx - 4, oy + 26, 9, 1, 'lamp');
  p.rect(lx - 2, oy + 22, 3, 3, 'paper');
  p.rect(lx - 1, oy + 27, 3, 1, 'amber');
}

/** The office door, frosted glass and a brass handle. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 26;
  const h = floorTop - top;
  p.rect(x - 2, top - 2, w + 4, h + 2, 'paper');
  p.rect(x, top, w, h, 'amber');
  p.rect(x + w - 2, top, 2, h, 'ember');
  ditherGradient(p, x + 4, top + 4, w - 8, 18, ['fog', 'concrete']);
  // the company's anchor, faint on the glass
  p.rect(x + 12, top + 8, 1, 7, 'stone');
  p.rect(x + 10, top + 9, 5, 1, 'stone');
  p.rect(x + 9, top + 13, 1, 2, 'stone');
  p.rect(x + 15, top + 13, 1, 2, 'stone');
  p.rect(x + 10, top + 15, 5, 1, 'stone');
  p.rect(x + 4, top + 25, w - 8, h - 30, 'ember');
  p.rect(x + 5, top + 26, w - 10, h - 32, 'amber');
  p.rect(x + w - 6, top + 22, 3, 1, 'honey');
  px(p, x + w - 5, top + 23, 'honey');
}

/** One shipping carton, w x h, its bottom row at `bottom`: tape down the middle, a label. */
function paintCarton(p: Painter, x: number, bottom: number, w: number, h: number): void {
  const top = bottom - h + 1;
  p.rect(x, top, w, h, 'tan');
  p.rect(x, top, w, 1, 'skin');
  p.rect(x + w - 1, top + 1, 1, h - 1, 'ember');
  p.rect(x, bottom, w, 1, 'ember');
  p.rect(x + Math.floor(w / 2) - 1, top, 2, Math.min(3, h), 'honey');
  if (h >= 6 && w >= 8) {
    p.rect(x + 1, top + 3, 3, 2, 'paper');
    px(p, x + w - 3, bottom - 2, 'red');
  }
}

/** Cartons of lamps just delivered, stacked beside a hand truck under a notice board. */
function paintCartonBay(p: Painter, x: number, oy: number, floorTop: number): void {
  // the notice board
  p.rect(x + 8, oy + 14, 28, 17, 'ember');
  p.rect(x + 9, oy + 15, 26, 15, 'tan');
  p.rect(x + 11, oy + 17, 7, 9, 'paper');
  p.rect(x + 20, oy + 17, 6, 5, 'honey');
  p.rect(x + 20, oy + 24, 6, 4, 'paper');
  p.rect(x + 28, oy + 18, 5, 8, 'sky');
  px(p, x + 14, oy + 17, 'red');
  px(p, x + 22, oy + 17, 'teal');
  px(p, x + 30, oy + 18, 'red');
  p.rect(x + 12, oy + 20, 5, 1, 'fog');
  p.rect(x + 12, oy + 22, 4, 1, 'fog');
  p.rect(x + 9, oy + 31, 28, 1, 'concrete');
  // the cartons, standing a little way into the room
  const bottom = floorTop + 3;
  p.rect(x + 5, bottom + 1, 35, 1, 'night');
  paintCarton(p, x + 5, bottom, 14, 10);
  paintCarton(p, x + 20, bottom, 12, 9);
  paintCarton(p, x + 7, bottom - 10, 11, 8);
  paintCarton(p, x + 21, bottom - 9, 9, 7);
  paintCarton(p, x + 33, bottom, 7, 6);
}

/** A wall shelf of small lamp boxes on two brackets. */
function paintCartonShelf(p: Painter, x: number, y: number): void {
  const w = 37;
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  p.rect(x + 3, y + 2, 1, 3, 'ember');
  p.rect(x + w - 4, y + 2, 1, 3, 'ember');
  p.rect(x + 1, y + 2, w, 1, 'concrete');
  paintCarton(p, x + 2, y - 1, 9, 7);
  paintCarton(p, x + 12, y - 1, 8, 6);
  paintCarton(p, x + 13, y - 7, 6, 4);
  paintCarton(p, x + 22, y - 1, 12, 8);
}

/** A framed poster: one lamp glowing in the dark. */
function paintPoster(p: Painter, x: number, y: number): void {
  const w = 21;
  const h = 24;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'slate');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'deep');
  const cx = x + 10;
  glowEllipse(p, cx, y + 9, 8, 7, 'honey', [0.4, 0.22, 0.1]);
  p.rect(cx - 2, y + 5, 5, 1, 'honey');
  p.rect(cx - 3, y + 6, 7, 1, 'honey');
  p.rect(cx - 4, y + 7, 9, 3, 'honey');
  p.rect(cx - 4, y + 10, 9, 1, 'lamp');
  p.rect(cx - 2, y + 7, 4, 2, 'paper');
  p.rect(cx, y + 11, 1, 6, 'amber');
  p.rect(cx - 3, y + 17, 7, 1, 'amber');
  p.rect(cx - 3, y + 18, 7, 1, 'ember');
  // a line of lettering
  p.rect(x + 4, y + 20, 13, 1, 'fog');
}

export const PURCHASING_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    supplier: { sprite: SUPPLIER_SPRITE, ...BY_TABLE, side: 'right' },
    // Alone with you (reporting back) Ms. Carter stands where Jack stands; with
    // Jack there too she stands a step further right, under the display case.
    manager: {
      sprite: MANAGER_SPRITE,
      ...BY_TABLE,
      side: 'right',
      beside: { x: 96, y: BY_TABLE.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 84, y: 25 } },
  rest: {
    left: { x: TABLE.x + 3, y: PROP_TOP },
    right: { x: TABLE.x + 15, y: PROP_TOP },
  },
};
