import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The interview stage: the office of Harbor Trading, a small trading company,
 * on an early November evening. From the left: a bookcase of binders (you
 * stand in front of it), the company's anchor emblem on the wall, a wooden
 * meeting table (handed-over things rest on its top), and a big window onto
 * the harbour at dusk: a moored ship and dockside cranes against the last of
 * the light, a plant in the corner. Ms. Carter, the office manager, stands at
 * the table's far end; the front desk worker stands there too when alone, or
 * nearer the window when Ms. Carter is there. Painted through the Painter
 * interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a ship's picture, a clock and a framed
 * chart of shipping routes, taller windows, then a darker upper wall with high
 * windows onto the night sky), the office door, more windows and binder
 * shelves to the left, more windows onto the same harbour and filing
 * cabinets with a water cooler to the right.
 */

/** The meeting table's left edge, width and the y of its top, in core pixels (props rest on it). */
const TABLE = { x: 38, w: 41, top: 48 } as const;
/** 24x24 pictures stand on the tabletop with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The big window in the core: its outer frame. */
const WINDOW = { x: 64, y: 3, w: 51, h: 29 } as const;
/** Where the people at the table's far end stand. */
const BY_TABLE = { x: 78, y: 39 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the pictures, for the route chart, and for the ceiling. */
const PICTURE_MIN = 20;
const CHART_MIN = 46;
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

/** Paints the office to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind]. Lamps hang over the ones without a window.
  const bays: [number, 'door' | 'window' | 'shelf' | 'cabinet'][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i === 0 ? 'door' : i % 2 === 1 ? 'window' : 'shelf']);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'cabinet']);
  }
  const lamps = [ox + 50];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= PICTURE_MIN) {
    if (ox + 8 >= 0) paintShipPicture(p, ox + 8, oy - 17);
    paintClock(p, ox + 41, oy - 8);
  }
  if (oy >= CHART_MIN && ox + 8 >= 0) paintRouteChart(p, ox + 8, oy - 41);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'door') paintDoor(p, x + 8, oy + 14, floorTop);
    else if (kind === 'window') paintWindow(p, x + 5, winTop, 34, winH, ox);
    else if (kind === 'shelf') paintBookcase(p, x + 7, oy + 12, 30, floorTop, x);
    else paintCabinetBay(p, x, oy, floorTop);
  }

  // The core: the bookcase behind you, the emblem, the harbour window.
  paintBookcase(p, ox + 2, oy + 12, 30, floorTop, ox);
  paintEmblem(p, ox + 40, oy + 13);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintLamp(p, lx, cornice, oy);

  paintTable(p, ox + TABLE.x, oy + TABLE.top, floorTop);
  paintPlant(p, ox + 116, oy + 38);
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
    const first = Math.floor(-(ox + 90) / HIGH_GAP) - 1;
    for (let k = first; ox + 90 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 90 + k * HIGH_GAP, top, wh, k);
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
    const sx = cx - 19 + Math.floor(hash2(i, n, 131) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 137) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 139) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 0) {
    p.rect(cx + 9, top + 3, 2, 5, 'paper');
    px(p, cx + 11, top + 3, 'paper');
    px(p, cx + 11, top + 7, 'paper');
    px(p, cx + 8, top + 4, 'honey');
    px(p, cx + 8, top + 6, 'honey');
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
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
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
    if (hx % 7 === 0 && hash2(hx, 1, 71) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 73) * 6);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 5 ? 'rosy' : 'violet');
    }
  }
  // a few early stars
  for (let i = 0; i < w; i += 1) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hash2(hx, 3, 79) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 83) * Math.max(3, horizon - y - 12)), 'fog');
    }
  }
  // the far shore: low hills with lights
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    const bump = Math.round(1.5 + Math.sin(hx / 9) + Math.sin(hx / 4.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 89) < 0.12) px(p, x + i, horizon, hash2(hx, 6, 97) < 0.5 ? 'honey' : 'lamp');
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 60) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 60; k++) {
    const base = ox + k * HARBOUR_P;
    paintQuay(p, base + 92, base + 150, horizon);
    paintCrane(p, base + 100, horizon, 9);
    paintCrane(p, base + 132, horizon, 8);
    paintShip(p, base + 68, horizon + 6, 26);
    paintShip(p, base + 4, horizon + 4, 18);
    paintBuoy(p, base + 160, horizon + 7);
  }
}

/** The container quay from x0 to x1 just below the horizon, stacks of containers on it. */
function paintQuay(p: Painter, x0: number, x1: number, horizon: number): void {
  const colours: readonly PaletteName[] = ['maroon', 'teal', 'ember', 'denim', 'maroon', 'moss'];
  for (let x = x0 + 2, i = 0; x + 4 <= x1; x += 5, i++) {
    const stack = 1 + Math.floor(hash2(i, x0, 101) * 3);
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
  const colours: readonly PaletteName[] = ['teal', 'ember', 'maroon', 'denim'];
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
// The office

/** Binder colours: spine and its shade. */
const BINDERS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['denim', 'indigo'],
  ['red', 'maroon'],
  ['teal', 'moss'],
  ['lamp', 'amber'],
  ['paper', 'fog'],
  ['leaf', 'moss'],
  ['sky', 'denim'],
];

/** A row of binders standing on a shelf at `bottom`, from x0 to x1, the odd one leaning. */
function paintBinders(p: Painter, x0: number, x1: number, bottom: number, seed: number): void {
  for (let x = x0, i = 0; x + 3 <= x1; i++) {
    const r = hash2(i, seed, 107);
    if (r < 0.1) {
      x += 3; // a gap
      continue;
    }
    const [spine, shade] = BINDERS[Math.floor(hash2(i, seed, 109) * BINDERS.length)] ?? [
      'denim',
      'indigo',
    ];
    const bh = 8 + Math.floor(hash2(i, seed, 113) * 2);
    p.rect(x, bottom - bh, 3, bh, spine);
    p.rect(x + 2, bottom - bh, 1, bh, shade);
    px(p, x + 1, bottom - bh + 2, spine === 'paper' ? 'stone' : 'paper'); // the label
    px(p, x + 1, bottom - 2, shade); // the finger hole
    x += 3;
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
  // the cupboard below
  const cy = bottom - 12;
  p.rect(x + 1, cy, w - 2, 1, 'amber');
  const half = Math.floor((w - 4) / 2);
  for (const dx of [2, 3 + half]) {
    p.rect(x + dx, cy + 2, half - 1, 8, 'amber');
    p.rect(x + dx + half - 2, cy + 2, 1, 8, 'ember');
    p.rect(x + dx, cy + 9, half - 1, 1, 'ember');
  }
  px(p, x + 1 + half, cy + 5, 'honey');
  px(p, x + 4 + half, cy + 5, 'honey');
  // a small plant and a box file on top
  p.rect(x + 3, top - 3, 4, 3, 'amber');
  p.rect(x + 3, top - 6, 2, 3, 'leaf');
  p.rect(x + 5, top - 5, 2, 2, 'moss');
  px(p, x + 2, top - 5, 'leaf');
  p.rect(x + w - 10, top - 4, 7, 4, 'denim');
  p.rect(x + w - 10, top - 4, 7, 1, 'sky');
  px(p, x + w - 7, top - 2, 'paper');
}

/** The company emblem: an anchor on a navy roundel in a brass ring, over a little wave. */
function paintEmblem(p: Painter, x: number, y: number): void {
  // brass ring, 15 across
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
  p.rect(c - 1, y + 2, 3, 1, 'honey'); // the ring
  px(p, c - 1, y + 3, 'honey');
  px(p, c + 1, y + 3, 'honey');
  p.rect(c - 2, y + 4, 5, 1, 'honey'); // the stock
  p.rect(c, y + 5, 1, 6, 'honey'); // the shank
  p.rect(c - 3, y + 9, 1, 2, 'honey'); // the arms curving up
  p.rect(c + 3, y + 9, 1, 2, 'honey');
  px(p, c - 4, y + 9, 'honey');
  px(p, c + 4, y + 9, 'honey');
  p.rect(c - 2, y + 11, 5, 1, 'honey');
  // the wave under it
  for (let i = 0; i < 13; i++) px(p, x + 1 + i, y + 18 + (i % 4 === 1 ? -1 : 0), 'denim');
}

/** The meeting table: a wooden top on two legs, papers and a pen near the far end. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  // shadow on the carpet
  p.rect(x + 1, floorTop + 6, w - 1, 1, 'night');
  // the legs
  p.rect(x + 2, top + 3, 2, floorTop + 6 - top - 3, 'ember');
  p.rect(x + w - 4, top + 3, 2, floorTop + 6 - top - 3, 'ember');
  p.rect(x + 3, top + 3, 1, floorTop + 6 - top - 3, 'plum');
  // the top, a pixel proud of the apron
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 2, 'ember');
  p.rect(x + 1, top + 4, w - 2, 1, 'plum');
  // a sheet of paper and a pen near the manager's end, flat on the top
  p.rect(x + 28, top, 7, 1, 'paper');
  p.rect(x + 29, top - 1, 6, 1, 'paper');
  p.rect(x + 35, top, 3, 1, 'ink');
}

/** The office door, frosted glass and a brass handle, a dark corridor at its foot. */
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

/** A filing cabinet with a plant on it beside a water cooler. */
function paintCabinetBay(p: Painter, x: number, oy: number, floorTop: number): void {
  // the cabinet
  const cx = x + 6;
  const top = oy + 30;
  p.rect(cx, top, 16, floorTop + 1 - top, 'concrete');
  p.rect(cx, top, 16, 1, 'fog');
  p.rect(cx + 15, top, 1, floorTop + 1 - top, 'stone');
  for (let d = 0; d < 3; d++) {
    const dy = top + 2 + d * 9;
    if (dy + 7 > floorTop) break;
    p.rect(cx + 1, dy + 7, 14, 1, 'stone');
    p.rect(cx + 6, dy + 2, 4, 1, 'night');
    p.rect(cx + 7, dy + 4, 2, 1, 'paper');
  }
  paintPlant(p, cx + 3, top - 20);
  // the water cooler
  const wx = x + 28;
  p.rect(wx + 2, oy + 33, 7, 9, 'sky');
  p.rect(wx + 3, oy + 34, 1, 7, 'paper');
  p.rect(wx + 4, oy + 32, 3, 1, 'denim');
  p.rect(wx, oy + 42, 11, floorTop + 1 - oy - 42, 'paper');
  p.rect(wx + 9, oy + 42, 2, floorTop + 1 - oy - 42, 'fog');
  px(p, wx + 3, oy + 45, 'red');
  px(p, wx + 6, oy + 45, 'denim');
  p.rect(wx + 2, oy + 47, 7, 1, 'stone');
}

// ---------------------------------------------------------------------------
// Above the core

/** A framed picture of a sailing ship on an evening sea. */
function paintShipPicture(p: Painter, x: number, y: number): void {
  const w = 22;
  const h = 14;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['violet', 'rosy', 'honey']);
  p.rect(x + 1, y + 9, w - 2, 4, 'denim');
  p.rect(x + 1, y + 10, w - 2, 1, 'sky');
  // the ship
  p.rect(x + 6, y + 8, 10, 2, 'ink');
  p.rect(x + 10, y + 2, 1, 6, 'ink');
  p.rect(x + 7, y + 3, 3, 4, 'paper');
  p.rect(x + 11, y + 4, 3, 3, 'paper');
  px(p, x + 18, y + 3, 'paper');
  p.rect(x + 1, y + h, w, 1, 'concrete');
}

/** A framed chart: two coastlines and the company's routes across the sea between them. */
function paintRouteChart(p: Painter, x: number, y: number): void {
  const w = 38;
  const h = 18;
  p.rect(x, y, w, h, 'slate');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + 2, y + 2, w - 4, h - 4, 'sky');
  // land at both ends
  p.rect(x + 2, y + 2, 6, 8, 'tan');
  p.rect(x + 2, y + 10, 4, 4, 'tan');
  p.rect(x + 8, y + 4, 2, 3, 'tan');
  p.rect(x + 29, y + 4, 7, 10, 'tan');
  p.rect(x + 26, y + 9, 3, 4, 'tan');
  p.rect(x + 31, y + 2, 5, 2, 'tan');
  // the routes: dotted, a port pin at each end
  for (let i = 0; i < 8; i++) {
    px(p, x + 10 + i * 2, y + 6 - Math.floor(Math.abs(i - 3.5) / 2.5), 'red');
    px(p, x + 9 + i * 2, y + 12 + Math.floor(Math.abs(i - 3.5) / 3), 'denim');
  }
  px(p, x + 9, y + 7, 'ink');
  px(p, x + 27, y + 7, 'ink');
  px(p, x + 25, y + 12, 'ink');
  p.rect(x + 1, y + h, w, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Ms. Carter, the office manager: 16x24, facing left. A calm woman around
// fifty: short dark hair with a grey streak, a grey suit jacket over a white
// blouse with a small gold pendant, grey trousers and dark shoes. She is in
// the day-before stage too, so the sprite is exported.

export const MANAGER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhh......',
    '....hhHHhhhh....',
    '....hhhhhhhhh...',
    '....shhhhhhhh...',
    '...ssessGhhhh...',
    '....ssssGhhh....',
    '....rssshhh.....',
    '......sss.......',
    '.....jwwjjj.....',
    '....jjwbwjjjj...',
    '....jjjwjjjjj...',
    '....jjjjjjjaj...',
    '....jjjjjjjaj...',
    '....jjjjjjjaj...',
    '....jjjjjjjaj...',
    '....jjjjjjjsj...',
    '.....jjjjjjj....',
    '.....pppppq.....',
    '.....pppppq.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'ink',
    H: 'slate',
    G: 'concrete',
    s: 'skin',
    e: 'ink',
    r: 'tan',
    j: 'concrete',
    a: 'stone',
    w: 'paper',
    b: 'honey',
    p: 'stone',
    q: 'slate',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// The front desk worker: 16x24, facing left. A woman in her twenties with
// light brown hair in a high ponytail tied with a teal band, a white blouse
// with a pale blue bow, a teal name badge, a navy skirt, dark tights and
// maroon shoes.

const FRONT_DESK_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhh......',
    '....hhHhhhhht...',
    '....hhhhhhhhPP..',
    '....shhhhhhh.PP.',
    '...ssesshhhh..P.',
    '....sssshhh...P.',
    '....rsssshh.....',
    '......sss.......',
    '.....wbbwww.....',
    '....wwwbwwwww...',
    '....wwwwwnwww...',
    '....wwwwwwwaw...',
    '....wwwwwwwaw...',
    '....wwwwwwwaw...',
    '....wwwwwwwsw...',
    '.....dddddd.....',
    '.....dddddd.....',
    '.....dddddd.....',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'amber',
    H: 'lamp',
    P: 'ember',
    t: 'teal',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    w: 'paper',
    b: 'sky',
    n: 'teal',
    a: 'fog',
    d: 'denim',
    g: 'slate',
    q: 'night',
    k: 'maroon',
  },
};

export const INTERVIEW_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...BY_TABLE, side: 'right' },
    // Alone (at reception) she stands where Ms. Carter stands; with Ms. Carter
    // there too she steps back towards the window.
    front_desk: {
      sprite: FRONT_DESK_SPRITE,
      ...BY_TABLE,
      side: 'right',
      beside: { x: 96, y: BY_TABLE.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 83, y: 25 } },
  rest: {
    left: { x: TABLE.x + 1, y: PROP_TOP },
    right: { x: TABLE.x + 14, y: PROP_TOP },
  },
};
