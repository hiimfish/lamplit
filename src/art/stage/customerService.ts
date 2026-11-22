import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { CUSTOMER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The customer service stage: your own desk at Harbor Trading on a May
 * evening. From the left: a box sent back with a broken glass desk lamp in it,
 * under the window onto the harbour at dusk (you stand in front of it); your
 * long desk with a headset and the order screen at its near end (handed-over
 * things rest on the clear end of its top); a pinboard of order slips, a
 * pendant lamp and a board of five stars on the wall; a cabinet of the
 * company's glass desk lamps, a few of them lit. Ms. Carter stands at the
 * desk's far end, in front of the cabinet.
 *
 * The phone call backdrop keeps the same desk on the left, and on the right a
 * framed panel with an inked, rounded border and a phone badge: Mr. Grant in
 * his lighting store, lamps hanging from the ceiling and standing on shelves.
 * The desk stays in front of the panel: it is your room.
 *
 * Like the other stages both fill any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a taller window, a clock, a poster of a
 * lamp and a chart of shipping routes, then a darker upper wall with high
 * windows onto the night sky), more windows with other people's desks, binder
 * shelves, the office door and filing cabinets to both sides. Painted through
 * the Painter interface, palette colours only, whole pixels.
 */

/** The desk's left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 36, w: 63, top: 48 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;
/** Where the clear end of the desk starts: the headset and the screen stand left of it. */
const CLEAR_X = 62;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The window behind you: its outer frame. */
const WINDOW = { x: 2, y: 3, w: 33, h: 29 } as const;
/**
 * The cabinet of sample lamps: its left edge, top and width. It starts behind
 * the back of whoever stands at the desk's end, so their face is against the wall.
 */
const CABINET = { x: 106, y: 9, w: 22 } as const;
/** Where the person at the desk's far end (or on the phone) stands. */
const BY_DESK = { x: 96, y: 39 } as const;
/** The call panel in core pixels: its outer border. */
const PANEL = { x: 70, y: 2, w: 56, h: 62 } as const;
/** The pendant lamp over the desk. */
const LAMP_X = 63;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the clock and poster, for the route chart, and for the ceiling. */
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

/** A painter that only paints inside one rectangle (a window's glass, the call panel). */
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

/** Your desk with Ms. Carter in the room. */
function paintOffice(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h, false);
  const { ox, oy } = coreOrigin(w, h);
  paintDesk(p, ox + DESK.x, oy + DESK.top, oy + FLOOR_TOP);
}

/** Your desk on the left, Mr. Grant's lighting store in a call panel on the right. */
function paintCall(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h, true);
  const { ox, oy } = coreOrigin(w, h);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y);
  paintDesk(p, ox + DESK.x, oy + DESK.top, oy + FLOOR_TOP);
}

// ---------------------------------------------------------------------------
// The office

/**
 * Everything of the office except your desk. On a `call` the star board and
 * the lamp cabinet are left out: the call panel stands where they are.
 */
function paintRoom(p: Painter, w: number, h: number, call: boolean): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind]. Lamps hang over the ones without a window.
  const bays: [number, 'door' | 'window' | 'shelf' | 'cabinet'][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 3 === 0 ? 'shelf' : i % 3 === 1 ? 'window' : 'door']);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'cabinet']);
  }
  const lamps = [ox + LAMP_X];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= PICTURE_MIN) {
    paintClock(p, ox + 47, oy - 9);
    paintLampPoster(p, ox + 74, oy - 19);
  }
  if (oy >= CHART_MIN) paintRouteChart(p, ox + 72, oy - 43);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'door') paintDoor(p, x + 8, oy + 14, floorTop);
    else if (kind === 'shelf') paintBookcase(p, x + 7, oy + 12, 30, floorTop, x);
    else if (kind === 'cabinet') paintCabinetBay(p, x, oy, floorTop);
    else {
      paintWindow(p, x + 5, winTop, 34, winH, ox);
      paintWorkstation(p, x + 4, oy + DESK.top, floorTop, x);
    }
  }

  // The core: the window behind you, the returned box under it, the boards, the lamp cabinet.
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintReturnedBox(p, ox + 4, floorTop);
  paintPinboard(p, ox + 40, oy + 12);
  if (!call) {
    paintStarBoard(p, ox + 74, oy + 10);
    paintLampCabinet(p, ox + CABINET.x, oy + CABINET.y, floorTop);
  }
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);
}

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
    const first = Math.floor(-(ox + 18) / HIGH_GAP) - 1;
    for (let k = first; ox + 18 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 18 + k * HIGH_GAP, top, wh, k);
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
  if (mod(n, 3) === 1) {
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
/** How far the harbour is slid left, so a crane and a ship's stern stand in the window behind you. */
const HARBOUR_SHIFT = 82;

/**
 * The harbour at dusk seen through a window: its glass from (x, y), w x h.
 * Positions count from the core's left edge `ox`, so windows side by side
 * show one continuous view.
 */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  const origin = ox - HARBOUR_SHIFT;
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
    const hx = mod(x + i - origin, HARBOUR_P);
    if (hx % 7 === 0 && hash2(hx, 1, 71) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 73) * 6);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 5 ? 'rosy' : 'violet');
    }
  }
  // a few early stars
  for (let i = 0; i < w; i += 1) {
    const hx = mod(x + i - origin, HARBOUR_P);
    if (hash2(hx, 3, 79) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 83) * Math.max(3, horizon - y - 12)), 'fog');
    }
  }
  // the far shore: low hills with lights
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - origin, HARBOUR_P);
    const bump = Math.round(1.5 + Math.sin(hx / 9) + Math.sin(hx / 4.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 89) < 0.12) px(p, x + i, horizon, hash2(hx, 6, 97) < 0.5 ? 'honey' : 'lamp');
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - origin - 60) / HARBOUR_P) - 1;
  for (let k = first; origin + k * HARBOUR_P < x + w + 60; k++) {
    const base = origin + k * HARBOUR_P;
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
    const stack = 1 + Math.floor(hash2(i, 7, 101) * 3);
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
// Lamps: what the company sells

/** Glass colours of the desk lamps: the shade and its highlight. */
const GLASS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['teal', 'cyan'],
  ['denim', 'sky'],
  ['neonDeep', 'rosy'],
  ['leaf', 'honey'],
];

/**
 * A glass desk lamp, 9 wide and 9 tall, standing on `shelf` (the row under its
 * foot): a long glass shade on a brass stem. Lit, it throws light downward.
 */
function paintDeskLamp(p: Painter, cx: number, shelf: number, kind: number, lit: boolean): void {
  const [glass, shine] = GLASS[mod(kind, GLASS.length)] ?? ['teal', 'cyan'];
  if (lit) glowEllipse(p, cx, shelf - 5, 6, 5, 'honey', [0.3, 0.14]);
  p.rect(cx - 2, shelf - 9, 5, 1, glass);
  p.rect(cx - 3, shelf - 8, 7, 1, glass);
  p.rect(cx - 4, shelf - 7, 9, 1, glass);
  p.rect(cx - 2, shelf - 8, 2, 1, shine);
  if (lit) p.rect(cx - 3, shelf - 6, 7, 1, 'honey');
  p.rect(cx, shelf - 6, 1, 4, 'amber');
  p.rect(cx - 2, shelf - 2, 5, 1, 'amber');
  p.rect(cx - 3, shelf - 1, 7, 1, 'ember');
  px(p, cx - 2, shelf - 2, 'honey');
}

/** A glass globe lamp, 7 wide and 8 tall, standing on `shelf`. */
function paintGlobeLamp(p: Painter, cx: number, shelf: number, lit: boolean): void {
  if (lit) glowEllipse(p, cx, shelf - 5, 6, 5, 'honey', [0.3, 0.14]);
  p.rect(cx - 1, shelf - 8, 3, 1, lit ? 'honey' : 'sky');
  p.rect(cx - 2, shelf - 7, 5, 3, lit ? 'honey' : 'sky');
  p.rect(cx - 1, shelf - 4, 3, 1, lit ? 'lamp' : 'denim');
  px(p, cx - 1, shelf - 7, 'paper');
  px(p, cx, shelf - 3, 'amber');
  p.rect(cx - 1, shelf - 2, 3, 1, 'amber');
  p.rect(cx - 2, shelf - 1, 5, 1, 'ember');
}

/**
 * The cabinet of sample lamps behind the desk's far end: three shelves of
 * glass desk lamps, some of them switched on, cupboard doors below.
 */
function paintLampCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const w = CABINET.w;
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, bottom - top - 15, 'plum');
  // the top shelf
  paintDeskLamp(p, x + 6, top + 13, 0, true);
  paintGlobeLamp(p, x + 15, top + 13, false);
  p.rect(x + 2, top + 13, w - 4, 1, 'amber');
  // the middle shelf
  paintGlobeLamp(p, x + 5, top + 25, true);
  paintDeskLamp(p, x + 14, top + 25, 2, false);
  p.rect(x + 2, top + 25, w - 4, 1, 'amber');
  // the lowest shelf
  paintDeskLamp(p, x + 6, bottom - 12, 3, false);
  paintDeskLamp(p, x + 15, bottom - 12, 1, true);
  // the cupboard below
  const cy = bottom - 12;
  p.rect(x + 1, cy, w - 2, 1, 'amber');
  const half = Math.floor((w - 4) / 2);
  for (const dx of [2, 2 + half]) {
    // two doors
    p.rect(x + dx, cy + 2, half - 1, 8, 'amber');
    p.rect(x + dx + half - 2, cy + 2, 1, 8, 'ember');
    p.rect(x + dx, cy + 9, half - 1, 1, 'ember');
  }
  px(p, x + half, cy + 5, 'honey');
  px(p, x + 3 + half, cy + 5, 'honey');
  // a carton of lamps on top
  p.rect(x + 3, top - 5, 10, 5, 'tan');
  p.rect(x + 3, top - 5, 10, 1, 'skin');
  p.rect(x + 7, top - 5, 2, 5, 'paper');
  p.rect(x + 11, top - 4, 2, 4, 'ember');
}

// ---------------------------------------------------------------------------
// Your desk and the things of the job

/** The desk: a long wooden top, drawers at your end, the headset and the order screen on it. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
  const foot = floorTop + 6;
  // shadow on the carpet
  p.rect(x + 1, foot, w - 1, 1, 'night');
  // the drawers under your end
  p.rect(x + 2, top + 4, 16, foot - top - 4, 'ember');
  p.rect(x + 17, top + 4, 1, foot - top - 4, 'plum');
  p.rect(x + 3, top + 5, 13, 3, 'amber');
  p.rect(x + 3, top + 9, 13, 4, 'amber');
  p.rect(x + 8, top + 6, 3, 1, 'honey');
  p.rect(x + 8, top + 10, 3, 1, 'honey');
  // the far leg
  p.rect(x + w - 4, top + 3, 2, foot - top - 3, 'ember');
  p.rect(x + w - 3, top + 3, 1, foot - top - 3, 'plum');
  // the top, a pixel proud of the apron
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 2, 'ember');
  p.rect(x + 1, top + 4, w - 2, 1, 'plum');
  paintHeadset(p, x + 1, top);
  paintScreen(p, x + 13, top, 0);
}

/**
 * The headset, 11 wide, resting on the desk on its ear cups: the band arching
 * over them, the microphone arm reaching forward from the left cup.
 */
function paintHeadset(p: Painter, x: number, deskTop: number): void {
  const y = deskTop - 11;
  // the band
  p.rect(x + 3, y, 5, 1, 'ink');
  p.rect(x + 2, y + 1, 1, 1, 'ink');
  p.rect(x + 8, y + 1, 1, 1, 'ink');
  p.rect(x + 1, y + 2, 1, 3, 'ink');
  p.rect(x + 9, y + 2, 1, 3, 'ink');
  p.rect(x + 3, y + 1, 5, 1, 'stone');
  // the ear cups, teal cushions inside
  for (const cx of [x, x + 8]) {
    p.rect(cx, y + 5, 3, 5, 'ink');
    p.rect(cx + 1, y + 6, 1, 3, 'teal');
  }
  // the microphone arm and its red tip
  px(p, x + 2, y + 10, 'ink');
  p.rect(x + 3, y + 10, 2, 1, 'ink');
  px(p, x + 5, y + 10, 'red');
}

/**
 * The order screen, 13 wide: a list of orders, each with a status light. On
 * your own screen (`seed` 0) the late order is marked red.
 */
function paintScreen(p: Painter, x: number, deskTop: number, seed: number): void {
  const y = deskTop - 14;
  p.rect(x - 1, y - 1, 15, 12, 'sky', 0.14);
  p.rect(x, y, 13, 11, 'ink');
  p.rect(x + 1, y + 1, 11, 9, 'deep');
  p.rect(x + 1, y + 1, 11, 2, 'denim');
  p.rect(x + 2, y + 1, 4, 1, 'sky');
  for (let row = 0; row < 3; row++) {
    const ry = y + 4 + row * 2;
    const late = seed === 0 ? row === 1 : hash2(seed, row, 151) < 0.2;
    const len = 4 + Math.floor(hash2(seed, row, 157) * 3);
    if (late) p.rect(x + 1, ry, 11, 1, 'maroon');
    p.rect(x + 2, ry, len, 1, late ? 'paper' : 'fog');
    p.rect(x + 9, ry, 2, 1, late ? 'red' : 'leaf');
  }
  // the stand
  p.rect(x + 5, y + 11, 3, 2, 'ink');
  p.rect(x + 3, y + 13, 7, 1, 'ink');
}

/**
 * The box a customer sent back, open on the floor: a glass desk lamp leaning
 * out of it with half its shade broken off, a fragile sticker on the side.
 */
function paintReturnedBox(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 9;
  const bottom = floorTop + 2;
  // the broken lamp: its brass stem, and the teal glass shade cracked in two,
  // the right half hanging a pixel lower
  p.rect(x + 6, top - 3, 1, 3, 'amber');
  p.rect(x + 7, top - 6, 1, 3, 'amber');
  p.rect(x + 5, top - 9, 2, 1, 'teal');
  p.rect(x + 4, top - 8, 3, 1, 'teal');
  p.rect(x + 3, top - 7, 4, 1, 'teal');
  px(p, x + 5, top - 8, 'cyan');
  p.rect(x + 8, top - 8, 2, 1, 'teal');
  p.rect(x + 8, top - 7, 3, 1, 'teal');
  p.rect(x + 9, top - 6, 3, 1, 'teal');
  px(p, x + 9, top - 7, 'cyan');
  px(p, x + 7, top - 7, 'ink'); // the crack
  // the open flaps
  for (let i = 0; i < 4; i++) {
    p.rect(x - 1 - i, top - 1 - i, 2, 1, 'tan');
    p.rect(x + 15 + i, top - 1 - i, 2, 1, 'ember');
  }
  // the box
  p.rect(x, top, 16, bottom - top, 'tan');
  p.rect(x, top, 16, 1, 'ember');
  p.rect(x + 13, top + 1, 3, bottom - top - 1, 'ember');
  // the fragile sticker: a red glass on white
  p.rect(x + 3, top + 3, 7, 6, 'paper');
  p.rect(x + 4, top + 4, 5, 1, 'red');
  p.rect(x + 5, top + 5, 3, 1, 'red');
  p.rect(x + 6, top + 6, 1, 1, 'red');
  p.rect(x + 5, top + 7, 3, 1, 'red');
  // its shadow, and pieces of glass on the carpet
  p.rect(x + 1, bottom, 17, 1, 'night');
  px(p, x + 12, top - 2, 'cyan');
  px(p, x + 18, bottom - 1, 'cyan');
  px(p, x + 20, bottom + 1, 'teal');
}

/** A cork pinboard of order slips over the screen. */
function paintPinboard(p: Painter, x: number, y: number): void {
  const w = 18;
  const h = 14;
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'tan');
  p.rect(x + 2, y + 2, 4, 5, 'paper');
  px(p, x + 3, y + 2, 'red');
  px(p, x + 3, y + 4, 'stone');
  p.rect(x + 7, y + 3, 4, 4, 'honey');
  px(p, x + 8, y + 3, 'ink');
  p.rect(x + 12, y + 2, 4, 6, 'paper');
  px(p, x + 13, y + 2, 'teal');
  p.rect(x + 13, y + 4, 2, 1, 'stone');
  p.rect(x + 13, y + 6, 2, 1, 'red');
  p.rect(x + 3, y + 8, 5, 4, 'sky');
  px(p, x + 5, y + 8, 'ink');
  p.rect(x + 9, y + 9, 3, 3, 'rosy');
  p.rect(x + 1, y + h, w - 1, 1, 'concrete');
}

/** A board of five stars on the wall: what the job is for. */
function paintStarBoard(p: Painter, x: number, y: number): void {
  const w = 23;
  const h = 9;
  p.rect(x, y, w, h, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'indigo');
  for (let i = 0; i < 5; i++) {
    const sx = x + 3 + i * 4;
    p.rect(sx, y + 3, 3, 1, 'honey');
    p.rect(sx + 1, y + 2, 1, 3, 'honey');
    px(p, sx, y + 5, 'lamp');
    px(p, sx + 2, y + 5, 'lamp');
  }
  p.rect(x + 1, y + h, w - 1, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The rest of the office, beside the core

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

/** A row of binders standing on a shelf at `bottom`, from x0 to x1. */
function paintBinders(p: Painter, x0: number, x1: number, bottom: number, seed: number): void {
  for (let x = x0, i = 0; x + 3 <= x1; i++) {
    if (hash2(i, seed, 107) < 0.1) {
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
  // a lit sample lamp and a box file on top
  paintGlobeLamp(p, x + 6, top, true);
  p.rect(x + w - 10, top - 4, 7, 4, 'denim');
  p.rect(x + w - 10, top - 4, 7, 1, 'sky');
  px(p, x + w - 7, top - 2, 'paper');
}

/** Somebody else's desk under a window: a screen, a headset, a mug, a swivel chair pushed in. */
function paintWorkstation(p: Painter, x: number, top: number, floorTop: number, seed: number) {
  const w = 36;
  const foot = floorTop + 5;
  p.rect(x + 1, foot, w - 1, 1, 'night');
  // the chair, behind the desk's left half
  p.rect(x + 6, top - 11, 7, 8, 'slate');
  p.rect(x + 7, top - 12, 5, 1, 'slate');
  p.rect(x + 7, top - 4, 5, 1, 'slate');
  p.rect(x + 7, top - 11, 5, 1, 'stone');
  p.rect(x + 12, top - 10, 1, 6, 'night');
  p.rect(x + 9, top - 3, 1, 3, 'ink');
  p.rect(x + 9, top + 4, 1, foot - top - 5, 'ink');
  p.rect(x + 6, foot - 1, 7, 1, 'ink');
  // the legs
  p.rect(x + 2, top + 3, 2, foot - top - 3, 'ember');
  p.rect(x + w - 4, top + 3, 2, foot - top - 3, 'ember');
  // the top
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 2, 'ember');
  // the screen, a mug, the phone
  paintScreen(p, x + 19, top, seed + 11);
  p.rect(x + 15, top - 3, 3, 3, mod(seed, 3) === 0 ? 'red' : 'paper');
  px(p, x + 14, top - 2, mod(seed, 3) === 0 ? 'red' : 'paper');
  p.rect(x + 2, top - 2, 2, 2, 'ink');
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

/** A framed poster of the company's best seller: a lit glass desk lamp on a night-blue ground. */
function paintLampPoster(p: Painter, x: number, y: number): void {
  const w = 20;
  const h = 17;
  p.rect(x, y, w, h, 'slate');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + 2, y + 2, w - 4, h - 4, 'indigo');
  p.rect(x + 2, y + h - 5, w - 4, 3, 'deep');
  paintDeskLamp(p, x + 10, y + h - 4, 0, true);
  px(p, x + 4, y + 4, 'honey');
  px(p, x + 15, y + 5, 'fog');
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
// The call panel: Mr. Grant's lighting store

/** The panel with its rounded, inked border, the store inside and a phone badge on the corner. */
function paintPanel(p: Painter, x: number, y: number): void {
  const { w, h } = PANEL;
  // a soft shadow on the room behind it
  p.rect(x + 2, y + 2, w, h, 'ink', 0.35);
  // the border: ink outside, paper inside, the corners rounded
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
  paintLampStore(within(p, ix + 1, iy + 1, iw - 2, ih - 2), ix + 1, iy + 1, iw - 2, ih - 2);
  // the badge stays inside the middle of the core, so a narrow stage still shows it
  paintPhoneBadge(p, x + 26, y - 2);
}

/**
 * Inside the panel: a lighting store after dark. Lamps hang from the ceiling,
 * table lamps stand on a shelf along the wall, a floor lamp is lit in the
 * corner. The wall is deep blue so the lamps, and Mr. Grant, stand out.
 */
function paintLampStore(p: Painter, x: number, y: number, w: number, h: number): void {
  const bottom = y + h;
  const floor = bottom - 7;
  const shelf = y + 22;
  p.rect(x, y, w, floor - y, 'indigo');
  p.rect(x, y, w, 2, 'night');
  // the lower wall and the wooden floor
  p.rect(x, floor - 11, w, 11, 'deep');
  p.rect(x, floor - 11, w, 1, 'dusk');
  for (let lx = x + 5; lx < x + w; lx += 10) p.rect(lx, floor - 8, 1, 6, 'indigo');
  p.rect(x, floor, w, bottom - floor, 'plum');
  p.rect(x, floor, w, 1, 'night');
  for (let row = 0; floor + 2 + row * 2 < bottom; row++) {
    for (let lx = x + 3 + (row % 2) * 6; lx < x + w; lx += 12) {
      p.rect(lx, floor + 2 + row * 2, 5, 1, 'maroon');
    }
  }

  // lamps hanging from the ceiling
  paintHangingGlobe(p, x + 9, y + 2, 2);
  paintHangingCone(p, x + 20, y + 2, 2, 'red');
  paintHangingDrum(p, x + 37, y + 2, 9, 'teal');

  // table lamps on the shelf, left and right of where he stands
  paintTableLamp(p, x + 4, shelf, 'honey', 'teal');
  paintTableLamp(p, x + 15, shelf, 'paper', 'red');
  paintTableLamp(p, x + 44, shelf, 'rosy', 'sky');
  p.rect(x, shelf, 22, 1, 'amber');
  p.rect(x, shelf + 1, 22, 1, 'ember');
  px(p, x + 3, shelf + 2, 'ember');
  px(p, x + 18, shelf + 2, 'ember');
  p.rect(x + 38, shelf, w - 38, 1, 'amber');
  p.rect(x + 38, shelf + 1, w - 38, 1, 'ember');
  px(p, x + 40, shelf + 2, 'ember');

  // a lower shelf of lamps that are switched off, dim behind anything handed over
  const low = shelf + 15;
  paintDarkLamp(p, x + 5, low);
  paintDarkLamp(p, x + 15, low);
  p.rect(x, low, 21, 1, 'ember');
  p.rect(x, low + 1, 21, 1, 'plum');

  // the floor lamp in the corner
  const fx = x + 43;
  glowEllipse(p, fx, shelf + 12, 9, 9, 'honey', [0.3, 0.16, 0.08]);
  p.rect(fx - 2, shelf + 6, 5, 1, 'honey');
  p.rect(fx - 3, shelf + 7, 7, 2, 'honey');
  p.rect(fx - 4, shelf + 9, 9, 2, 'honey');
  p.rect(fx - 4, shelf + 10, 9, 1, 'lamp');
  px(p, fx - 2, shelf + 7, 'paper');
  p.rect(fx, shelf + 11, 1, floor - shelf - 10, 'amber');
  p.rect(fx - 2, floor + 1, 5, 1, 'amber');
}

/** A glowing glass globe on a cord `drop` long. */
function paintHangingGlobe(p: Painter, cx: number, top: number, drop: number): void {
  const y = top + drop;
  glowEllipse(p, cx, y + 2, 7, 6, 'honey', [0.32, 0.16]);
  p.rect(cx, top, 1, drop, 'ink');
  p.rect(cx - 1, y, 3, 1, 'paper');
  p.rect(cx - 2, y + 1, 5, 3, 'paper');
  p.rect(cx - 1, y + 4, 3, 1, 'honey');
  p.rect(cx, y + 2, 2, 2, 'honey');
}

/** A cone shade on a cord, light spilling from under it. */
function paintHangingCone(p: Painter, cx: number, top: number, drop: number, c: PaletteName) {
  const y = top + drop;
  glowEllipse(p, cx, y + 5, 6, 5, 'honey', [0.3, 0.14]);
  p.rect(cx, top, 1, drop, 'ink');
  p.rect(cx - 1, y, 3, 1, c);
  p.rect(cx - 2, y + 1, 5, 1, c);
  p.rect(cx - 3, y + 2, 7, 1, c);
  p.rect(cx - 2, y + 3, 5, 1, 'honey');
  px(p, cx - 1, y + 1, 'honey');
}

/** A drum shade on a cord. */
function paintHangingDrum(p: Painter, cx: number, top: number, drop: number, c: PaletteName) {
  const y = top + drop;
  glowEllipse(p, cx, y + 4, 6, 5, 'honey', [0.3, 0.14]);
  p.rect(cx, top, 1, drop, 'ink');
  p.rect(cx - 3, y, 7, 4, c);
  p.rect(cx - 3, y, 7, 1, 'cyan');
  p.rect(cx - 2, y + 4, 5, 1, 'honey');
}

/** A table lamp, 7 wide and 10 tall, standing on `shelf`: a lit shade on a coloured base. */
function paintTableLamp(
  p: Painter,
  cx: number,
  shelf: number,
  shade: PaletteName,
  body: PaletteName,
): void {
  glowEllipse(p, cx, shelf - 7, 7, 6, 'honey', [0.3, 0.14]);
  p.rect(cx - 1, shelf - 10, 3, 1, shade);
  p.rect(cx - 2, shelf - 9, 5, 2, shade);
  p.rect(cx - 3, shelf - 7, 7, 1, shade);
  px(p, cx - 1, shelf - 9, 'paper');
  p.rect(cx - 1, shelf - 6, 3, 1, 'honey');
  px(p, cx, shelf - 5, 'stone');
  p.rect(cx - 1, shelf - 4, 3, 3, body);
  p.rect(cx - 2, shelf - 3, 5, 1, body);
  p.rect(cx - 2, shelf - 1, 5, 1, 'ember');
}

/** A table lamp that is switched off, in the dim colours of the wall behind it. */
function paintDarkLamp(p: Painter, cx: number, shelf: number): void {
  p.rect(cx - 1, shelf - 9, 3, 1, 'dusk');
  p.rect(cx - 2, shelf - 8, 5, 2, 'dusk');
  p.rect(cx - 3, shelf - 6, 7, 1, 'dusk');
  px(p, cx, shelf - 5, 'slate');
  p.rect(cx - 1, shelf - 4, 3, 3, 'denim');
  p.rect(cx - 2, shelf - 1, 5, 1, 'slate');
}

/**
 * The phone badge on the panel's top edge: a rounded paper tag in an ink rim,
 * a handset and two signal arcs. O rim, w paper, k handset, t arcs.
 */
const BADGE: readonly string[] = [
  '.OOOOOOOOOOOOOO.',
  'OwwwwwwwwwwwwwwO',
  'OwwkkwwwwwwtwwwO',
  'OwkkkkwwwwwwtwwO',
  'OwkkkwwwwtwwwtwO',
  'OwwkkwwwwwtwwtwO',
  'OwwkkwwwwwtwwtwO',
  'OwwwkkwwwkwwwwwO',
  'OwwwwkkwkkkwwwwO',
  'OwwwwwkkkkwwwwwO',
  'OwwwwwwkkwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  '.OOOOOOOOOOOOOO.',
];
const BADGE_COLOURS: Readonly<Record<string, PaletteName>> = {
  O: 'ink',
  w: 'paper',
  k: 'ink',
  t: 'teal',
};

function paintPhoneBadge(p: Painter, x: number, y: number): void {
  BADGE.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = BADGE_COLOURS[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
  p.rect(x + 1, y + BADGE.length, 15, 1, 'ink', 0.35);
}

export const CUSTOMER_SERVICE_STAGE: StageConfig = {
  paint: paintOffice,
  backdrops: { customer: paintCall },
  cast: {
    guide: GUIDE_ACTOR,
    // Mr. Grant is only ever on the phone: he stands inside the call panel.
    customer: { sprite: CUSTOMER_SPRITE, ...BY_DESK, side: 'right' },
    // Ms. Carter stands at the desk's far end. Should she ever be in the room
    // while Mr. Grant is on the line, she stays left of the call panel (PANEL.x).
    manager: {
      sprite: MANAGER_SPRITE,
      ...BY_DESK,
      side: 'right',
      beside: { x: 50, y: BY_DESK.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 78, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 101, y: 25 } },
  rest: {
    left: { x: CLEAR_X, y: PROP_TOP },
    right: { x: CLEAR_X + 14, y: PROP_TOP },
  },
};
