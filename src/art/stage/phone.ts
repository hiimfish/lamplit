import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { CLIENT_SPRITE, COWORKER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The phone stage: your own desk at Harbor Trading on a December evening.
 * From the left: your swivel chair under a cork board of message slips (you
 * stand in front of it), then the desk with the desk phone at your end, lit
 * by one of the company's glass desk lamps, a message pad beside it and the
 * rest of the top free for handed-over things; the harbour at dusk in the
 * window behind; Dan stands at the desk's far end, a plant in the corner.
 *
 * The call backdrop (Mr. Hughes is only ever on the phone) keeps the same
 * desk on the left, the handset lifted and its cord stretched to you, and on
 * the right a framed panel with an inked, rounded border and a phone badge:
 * his office at Hughes Home and Garden in England, a rainy evening with a
 * clock tower and a red bus in the sash window, a little Union flag, plants
 * and one of Harbor's lamps on his shelves. The desk stays in front of the
 * panel: it is your room.
 *
 * Like the other stages both fill any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (two clocks, home time and London time, a
 * shelf of sample lamps, taller windows, then the darker upper wall with high
 * windows onto the night sky), the colleagues' desks, each with its own phone,
 * more harbour windows and filing cabinets to both sides. Painted through the
 * Painter interface, palette colours only, whole pixels.
 */

/** Your desk's left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 38, w: 57, top: 48 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The harbour window in the core: its outer frame. */
const WINDOW = { x: 62, y: 3, w: 47, h: 29 } as const;
/** Where Dan stands, at the desk's far end. */
const BY_DESK = { x: 96, y: 39 } as const;
/** The call panel in core pixels: its outer border. */
const PANEL = { x: 60, y: 2, w: 64, h: 62 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the two clocks, for the lamp shelf, and for the upper wall. */
const CLOCKS_MIN = 20;
const SHELF_MIN = 46;
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

type Bay = 'desk' | 'window' | 'cabinet';
const LEFT_BAYS: readonly Bay[] = ['cabinet', 'window', 'desk'];
const RIGHT_BAYS: readonly Bay[] = ['desk', 'window', 'cabinet'];

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

/** Paints a small picture given as rows of letters; a letter with no colour is left clear. */
function paintMap(
  p: Painter,
  x: number,
  y: number,
  rows: readonly string[],
  colours: Readonly<Record<string, PaletteName>>,
): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = colours[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
}

/** The office with Dan at your desk. */
function paintOffice(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintDesk(p, ox + DESK.x, oy + DESK.top, oy + FLOOR_TOP, false);
}

/** The same desk on the left, Mr. Hughes's office in a call panel on the right. */
function paintCall(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y);
  paintDesk(p, ox + DESK.x, oy + DESK.top, oy + FLOOR_TOP, true);
}

// ---------------------------------------------------------------------------
// The room

/** Everything of the office except your desk. */
function paintRoom(p: Painter, w: number, h: number): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind, how far from the core].
  const bays: [number, Bay, number][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, LEFT_BAYS[i % 3] ?? 'window', -1 - i]);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % 3] ?? 'window', i + 1]);
  }
  // Pendant lamps hang over the core and over every bay without a window.
  const lamps = [ox + 48];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it; the desk lamp lights the wall behind the phone.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  glowEllipse(p, ox + 50, oy + 41, 24, 15, 'honey', [0.3, 0.18, 0.08]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= CLOCKS_MIN) paintClocks(p, ox + 14, oy - 11);
  if (oy >= SHELF_MIN) paintLampShelf(p, ox + 5, oy - 24);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  for (const [x, kind, n] of bays) {
    if (kind === 'window') {
      paintWindow(p, x + 5, winTop, 34, winH, ox);
      paintRadiator(p, x + 8, oy + 40, 28, floorTop);
    } else if (kind === 'desk') paintDeskBay(p, x, oy, floorTop, n);
    else paintCabinetBay(p, x, oy, floorTop, n === -1);
  }

  // The core: the message board behind you, your chair, the harbour window, the plant.
  paintPinboard(p, ox + 6, oy + 13);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);
  paintChair(p, ox + 3, oy + 42, floorTop);
  paintPlant(p, ox + 116, oy + 38);
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
    const first = Math.floor(-(ox + 86) / HIGH_GAP) - 1;
    for (let k = first; ox + 86 + k * HIGH_GAP - 22 < w; k++) {
      paintHighWindow(p, ox + 86 + k * HIGH_GAP, top, wh, k);
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
    const sx = cx - 19 + Math.floor(hash2(i, n, 151) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 157) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 163) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 1) {
    p.rect(cx - 12, top + 3, 2, 5, 'paper');
    px(p, cx - 10, top + 3, 'paper');
    px(p, cx - 10, top + 7, 'paper');
    px(p, cx - 13, top + 4, 'honey');
    px(p, cx - 13, top + 6, 'honey');
  }
  p.rect(cx, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside (the same view as from the meeting table in interview.ts)

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
    // a few early stars
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
    // a channel buoy with its little light
    p.rect(base + 160, horizon + 6, 3, 2, 'red');
    px(p, base + 161, horizon + 3, 'honey');
    px(p, base + 161, horizon + 4, 'ink');
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
  const boom = horizon - tall;
  const apex = boom - 6;
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 6, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 7, 1, 'ink');
  p.rect(x - 14, boom, 25, 1, 'ink');
  p.rect(x + 7, boom - 1, 4, 1, 'ink');
  p.rect(x + 3, apex, 1, 6, 'ink');
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
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  px(p, x, waterline - 3, 'night');
  p.rect(x + 2, waterline - 2, len - 3, 1, 'maroon');
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

/** A white radiator under a window: it is December. */
function paintRadiator(p: Painter, x: number, y: number, w: number, floorTop: number): void {
  p.rect(x, y, w, 12, 'paper');
  for (let rx = x + 2; rx < x + w; rx += 3) p.rect(rx, y + 1, 1, 10, 'fog');
  p.rect(x, y + 11, w, 1, 'concrete');
  p.rect(x + 2, y + 12, 1, floorTop - y - 12, 'stone');
  p.rect(x + w - 3, y + 12, 1, floorTop - y - 12, 'stone');
  p.rect(x + w, y + 2, 2, 1, 'stone'); // the valve
  px(p, x + w + 1, y + 1, 'red');
}

// ---------------------------------------------------------------------------
// The phone, the lamp, the desks

/** A desk phone, 13x9: k handset, h its shine, b base, f keys, r the line's light. */
const PHONE: readonly string[] = [
  '..kkkkkkkkk..',
  '.khhhhhhhhkk.',
  'kkkk.....kkkk',
  'kkk.bbbbb.kkk',
  '...bbbbbbb...',
  '..bbfbfbfbb..',
  '.bbbbbbbbbbb.',
  '.bbfbfbfbrbb.',
  'bbbbbbbbbbbbb',
];
/** The same phone with the handset lifted: the cradle is empty and the line's light is on. */
const PHONE_LIFTED: readonly string[] = [
  '.............',
  '.............',
  '..b.......b..',
  '..bbbbbbbbb..',
  '...bbbbbbb...',
  '..bbfbfbfbb..',
  '.bbbbbbbbbbb.',
  '.bbfbfbfbrbb.',
  'bbbbbbbbbbbbb',
];
const PHONE_COLOURS: Readonly<Record<string, PaletteName>> = {
  k: 'ink',
  h: 'stone',
  b: 'night',
  f: 'fog',
  r: 'red',
};

/** A desk phone standing on a surface at `bottom`. */
function paintPhone(p: Painter, x: number, bottom: number, lifted: boolean): void {
  paintMap(p, x, bottom - PHONE.length, lifted ? PHONE_LIFTED : PHONE, {
    ...PHONE_COLOURS,
    r: lifted ? 'cyan' : 'red',
  });
  p.rect(x, bottom - 4, 1, 1, 'slate'); // the light catches the base's corner
}

/**
 * One of the company's glass desk lamps, lit, 10 wide, standing on a surface
 * at `bottom`: a brass foot and stem, a long glass shade with brass caps.
 */
function paintGlassLamp(
  p: Painter,
  x: number,
  bottom: number,
  glass: PaletteName,
  shine: PaletteName,
): void {
  p.rect(x + 1, bottom - 15, 8, 1, shine);
  p.rect(x, bottom - 14, 10, 3, glass);
  p.rect(x + 2, bottom - 14, 4, 1, shine);
  px(p, x, bottom - 13, 'amber');
  px(p, x + 9, bottom - 13, 'amber');
  p.rect(x + 1, bottom - 11, 8, 1, 'honey');
  p.rect(x, bottom - 10, 10, 1, 'honey', 0.35);
  p.rect(x + 5, bottom - 10, 1, 8, 'amber');
  px(p, x + 5, bottom - 7, 'honey');
  px(p, x + 7, bottom - 10, 'honey'); // the pull chain
  px(p, x + 7, bottom - 9, 'lamp');
  p.rect(x + 3, bottom - 2, 5, 1, 'amber');
  p.rect(x + 2, bottom - 1, 7, 1, 'ember');
  px(p, x + 4, bottom - 2, 'honey');
}

/** A wooden desk seen from the front: the top, a leg at one end and three drawers at the other. */
function paintDeskBody(
  p: Painter,
  x: number,
  top: number,
  w: number,
  floorTop: number,
  drawersLeft: boolean,
): void {
  const foot = floorTop + 6;
  // its shadow on the carpet
  p.rect(x + 1, foot, w - 1, 1, 'night');
  // the leg
  const lx = drawersLeft ? x + w - 4 : x + 2;
  p.rect(lx, top + 3, 2, foot - top - 3, 'ember');
  px(p, lx, top + 3, 'plum');
  px(p, lx + 1, top + 3, 'plum');
  // the drawers
  const dx = drawersLeft ? x + 1 : x + w - 15;
  p.rect(dx, top + 3, 14, foot - top - 3, 'ember');
  for (let d = 0, dy = top + 3; dy + 3 <= foot; dy += 4, d++) {
    p.rect(dx + 1, dy + (d === 0 ? 1 : 0), 12, d === 0 ? 2 : 3, 'amber');
    p.rect(dx + 5, dy + 1, 4, 1, 'honey');
  }
  // the top, a pixel proud of the drawers
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 1, 'ember');
}

/**
 * Your desk: the phone at your end under the glass lamp, the message pad and
 * a pen, a wastebasket in the knee space. On a call the handset is lifted and
 * its curly cord runs to you.
 */
function paintDesk(p: Painter, x: number, top: number, floorTop: number, onCall: boolean): void {
  // the wastebasket in the knee space, a ball of paper in it
  p.rect(x + 9, floorTop - 1, 7, 6, 'concrete');
  p.rect(x + 10, floorTop + 5, 5, 1, 'stone');
  p.rect(x + 9, floorTop - 1, 7, 1, 'fog');
  p.rect(x + 11, floorTop + 1, 1, 3, 'stone');
  p.rect(x + 13, floorTop + 1, 1, 3, 'stone');
  p.rect(x + 11, floorTop - 3, 3, 2, 'paper');
  px(p, x + 13, floorTop - 2, 'fog');

  paintDeskBody(p, x, top, DESK.w, floorTop, false);

  // the lamp's light on the desktop
  p.rect(x + 2, top, 20, 1, 'paper', 0.4);
  paintGlassLamp(p, x + 12, top, 'teal', 'cyan');
  paintPhone(p, x + 1, top, onCall);
  if (onCall) {
    // the cord, stretched from the phone to the handset at your chin
    for (let i = 0; i < 5; i++) px(p, x - i, top - 4 - (i % 2), 'ink');
    p.rect(x - 6, top - 5, 2, 3, 'ink');
    px(p, x - 6, top - 5, 'stone');
  } else {
    // the cord, hanging over the desk's edge
    for (let i = 0; i < 6; i++) px(p, x - 1 - (i % 2), top - 2 + i, 'ink');
  }

  // the message pad, a line already written on it, and a pen
  p.rect(x + 24, top - 3, 9, 3, 'paper');
  p.rect(x + 24, top - 3, 9, 1, 'red');
  p.rect(x + 25, top - 1, 5, 1, 'stone');
  p.rect(x + 24, top, 9, 1, 'ember');
  p.rect(x + 35, top - 1, 5, 1, 'denim');
  px(p, x + 40, top - 1, 'ink');
}

/** A colleague's desk by the wall: a monitor, a mug, the same phone, a calendar above. */
function paintDeskBay(p: Painter, x: number, oy: number, floorTop: number, n: number): void {
  const top = oy + DESK.top;
  const dx = x + 3;
  // the December calendar on the wall
  p.rect(x + 29, oy + 20, 10, 12, 'paper');
  p.rect(x + 29, oy + 20, 10, 3, n % 2 === 0 ? 'teal' : 'red');
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) px(p, x + 31 + col * 3, oy + 25 + row * 2, 'stone');
  }
  px(p, x + 34, oy + 27, 'red');
  p.rect(x + 30, oy + 32, 10, 1, 'concrete');
  paintDeskBody(p, dx, top, 38, floorTop, n % 2 !== 0);

  // the monitor: a sheet of figures on its screen
  const mx = dx + 2;
  p.rect(mx, top - 13, 15, 10, 'ink');
  p.rect(mx + 1, top - 12, 13, 8, 'denim');
  for (let r = 0; r < 3; r++) p.rect(mx + 2, top - 11 + r * 2, 6 + ((r + n) % 2) * 4, 1, 'sky');
  px(p, mx + 12, top - 11, 'cyan');
  p.rect(mx + 6, top - 3, 3, 2, 'stone');
  p.rect(mx + 4, top - 1, 7, 1, 'stone');
  // a mug and the phone
  p.rect(dx + 19, top - 3, 3, 3, n % 2 === 0 ? 'red' : 'paper');
  px(p, dx + 22, top - 2, n % 2 === 0 ? 'red' : 'paper');
  paintPhone(p, dx + 24, top, false);
}

/**
 * A filing cabinet beside a water cooler, a plant on the cabinet. The one
 * next to your desk has the office's little Christmas tree on it instead, and
 * the coat stand with winter coats.
 */
function paintCabinetBay(
  p: Painter,
  x: number,
  oy: number,
  floorTop: number,
  festive: boolean,
): void {
  const cx = x + 5;
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
  if (festive) {
    paintTree(p, cx + 4, top);
    paintCoatStand(p, x + 34, oy + 16, floorTop);
    return;
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

/** A small Christmas tree in a pot, standing on a surface at `bottom`: a star, a few baubles. */
function paintTree(p: Painter, x: number, bottom: number): void {
  p.rect(x + 2, bottom - 3, 5, 3, 'ember');
  p.rect(x + 2, bottom - 3, 5, 1, 'amber');
  p.rect(x + 4, bottom - 4, 1, 1, 'ember');
  const rows = [1, 3, 3, 5, 5, 7, 7, 9, 9];
  rows.forEach((rw, i) => {
    const y = bottom - 13 + i;
    p.rect(x + 4 - (rw - 1) / 2, y, rw, 1, i % 2 === 0 ? 'leaf' : 'moss');
  });
  px(p, x + 4, bottom - 14, 'honey');
  px(p, x + 4, bottom - 15, 'lamp');
  const baubles: readonly [number, number, PaletteName][] = [
    [3, -11, 'red'],
    [5, -9, 'honey'],
    [2, -8, 'cyan'],
    [6, -6, 'red'],
    [1, -5, 'honey'],
    [4, -6, 'paper'],
  ];
  for (const [dx, dy, c] of baubles) px(p, x + dx, bottom + dy, c);
}

/** A coat stand: a red woolly hat on top, a striped scarf, a navy winter coat with its sleeve. */
function paintCoatStand(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top, 1, floorTop + 5 - top, 'ember');
  p.rect(x - 3, floorTop + 5, 7, 1, 'ember');
  px(p, x - 3, floorTop + 4, 'ember');
  px(p, x + 3, floorTop + 4, 'ember');
  p.rect(x - 3, top + 2, 7, 1, 'ember');
  // the hat
  p.rect(x - 2, top - 3, 5, 3, 'red');
  p.rect(x - 2, top - 1, 5, 1, 'paper');
  px(p, x, top - 4, 'paper');
  // the scarf
  p.rect(x - 4, top + 3, 3, 13, 'honey');
  for (let sy = top + 5; sy < top + 15; sy += 3) p.rect(x - 4, sy, 3, 1, 'red');
  px(p, x - 4, top + 16, 'honey');
  px(p, x - 2, top + 16, 'honey');
  // the coat: collar, shoulders, a sleeve hanging in front, the hem
  p.rect(x + 2, top + 3, 3, 1, 'sky');
  p.rect(x + 1, top + 4, 6, 2, 'denim');
  p.rect(x + 1, top + 6, 7, 20, 'denim');
  p.rect(x + 1, top + 26, 7, 1, 'indigo');
  p.rect(x + 1, top + 5, 1, 21, 'indigo');
  p.rect(x + 5, top + 7, 1, 13, 'indigo');
  p.rect(x + 6, top + 20, 2, 1, 'indigo');
  px(p, x + 3, top + 10, 'honey');
  px(p, x + 3, top + 15, 'honey');
  px(p, x + 3, top + 20, 'honey');
}

/** Your swivel chair, pushed back from the desk: teal seat and back, a five-star foot. */
function paintChair(p: Painter, x: number, top: number, floorTop: number): void {
  const seat = top + 12;
  const foot = floorTop + 5;
  // the back
  p.rect(x + 1, top + 1, 3, 11, 'teal');
  p.rect(x + 1, top, 2, 1, 'teal');
  p.rect(x + 1, top + 1, 1, 9, 'cyan');
  p.rect(x + 3, top + 2, 1, 10, 'moss');
  // the armrest
  p.rect(x + 4, seat - 4, 8, 1, 'ink');
  p.rect(x + 11, seat - 3, 1, 3, 'ink');
  // the seat
  p.rect(x + 1, seat, 14, 2, 'teal');
  p.rect(x + 2, seat, 12, 1, 'cyan');
  p.rect(x + 1, seat + 2, 14, 1, 'moss');
  // the stem and the foot with its casters
  p.rect(x + 7, seat + 3, 2, foot - seat - 3, 'stone');
  p.rect(x + 2, foot, 12, 1, 'ink');
  px(p, x + 2, foot + 1, 'ink');
  px(p, x + 8, foot + 1, 'ink');
  px(p, x + 13, foot + 1, 'ink');
  p.rect(x + 1, foot + 2, 14, 1, 'night');
}

/** The cork board of message slips: who called, and who should call back. */
function paintPinboard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 28, 18, 'ember');
  p.rect(x, y, 28, 1, 'amber');
  p.rect(x + 1, y + 1, 26, 16, 'tan');
  // slips: [dx, dy, w, h, colour]
  const slips: readonly [number, number, number, number, PaletteName][] = [
    [2, 2, 7, 8, 'paper'],
    [11, 2, 6, 5, 'honey'],
    [19, 3, 6, 6, 'paper'],
    [11, 9, 6, 6, 'rosy'],
    [3, 11, 6, 5, 'cyan'],
    [19, 11, 6, 5, 'honey'],
  ];
  for (const [dx, dy, sw, sh, c] of slips) {
    p.rect(x + dx, y + dy, sw, sh, c);
    for (let ly = y + dy + 2; ly < y + dy + sh - 1; ly += 2) {
      p.rect(x + dx + 1, ly, sw - 2 - ((ly + dx) % 2), 1, c === 'paper' ? 'stone' : 'ember');
    }
    px(p, x + dx + Math.floor(sw / 2), y + dy, 'red');
  }
  p.rect(x + 1, y + 18, 27, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Above the core

/** A tiny Union flag, 7x5. */
const UNION_FLAG: readonly string[] = ['wddrddw', 'dwwrwwd', 'rrrrrrr', 'dwwrwwd', 'wddrddw'];
/** The company's anchor on navy, 7x5. */
const ANCHOR_PLATE: readonly string[] = ['dddhddd', 'ddhhhdd', 'dddhddd', 'dhdhdhd', 'ddhhhdd'];
const PLATE_COLOURS: Readonly<Record<string, PaletteName>> = {
  w: 'paper',
  d: 'denim',
  r: 'red',
  h: 'honey',
};

/** A round wall clock; its hour hand points along (hx, hy). */
function paintWallClock(p: Painter, cx: number, cy: number, hx: number, hy: number): void {
  p.rect(cx - 2, cy - 4, 5, 9, 'ink');
  p.rect(cx - 4, cy - 2, 9, 5, 'ink');
  p.rect(cx - 3, cy - 3, 7, 7, 'ink');
  p.rect(cx - 2, cy - 3, 5, 7, 'paper');
  p.rect(cx - 3, cy - 2, 7, 5, 'paper');
  p.rect(cx, cy - 2, 1, 3, 'ink');
  px(p, cx + hx, cy + hy, 'ink');
  px(p, cx + hx * 2, cy + hy, 'ink');
}

/**
 * Two clocks side by side: the time here (four o'clock, over the company's
 * anchor) and the time in London (nine in the evening, over a Union flag).
 */
function paintClocks(p: Painter, cx: number, cy: number): void {
  paintWallClock(p, cx, cy, 1, 1);
  paintMap(p, cx - 3, cy + 6, ANCHOR_PLATE, PLATE_COLOURS);
  paintWallClock(p, cx + 20, cy, -1, 0);
  paintMap(p, cx + 17, cy + 6, UNION_FLAG, PLATE_COLOURS);
}

/** A shelf of sample lamps, lit: the glass shades the company sells. */
function paintLampShelf(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 19, y - 6, 24, 9, 'honey', [0.2, 0.1]);
  p.rect(x, y, 38, 2, 'amber');
  p.rect(x, y, 38, 1, 'honey');
  p.rect(x + 1, y + 2, 36, 1, 'ember');
  px(p, x + 4, y + 3, 'ember');
  px(p, x + 33, y + 3, 'ember');
  paintGlassLamp(p, x + 2, y, 'teal', 'cyan');
  paintGlassLamp(p, x + 14, y, 'mauve', 'rosy');
  paintGlassLamp(p, x + 26, y, 'denim', 'sky');
}

// ---------------------------------------------------------------------------
// The call panel: Mr. Hughes's office at Hughes Home and Garden, in England

/** The panel with its rounded, inked border, the office inside and a phone badge on the corner. */
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
  paintEnglishOffice(within(p, ix + 1, iy + 1, iw - 2, ih - 2), ix + 1, iy + 1, iw - 2, ih - 2);
  paintMap(p, x + w - 22, y - 2, BADGE, BADGE_COLOURS);
  p.rect(x + w - 21, y - 2 + BADGE.length, 15, 1, 'ink', 0.35);
}

/**
 * Inside the panel: a green papered wall over navy panelling, a red carpet, a
 * sash window onto a wet English evening, a little flag, shelves of plants
 * and a glass lamp bought from Harbor Trading.
 */
function paintEnglishOffice(p: Painter, x: number, y: number, w: number, h: number): void {
  const bottom = y + h;
  const floor = bottom - 6;
  const rail = floor - 9;
  // the papered wall: small sprigs on dark green
  p.rect(x, y, w, rail - y, 'moss');
  for (let row = 0, wy = y + 4; wy < rail - 2; wy += 8, row++) {
    for (let wx = x + 2 + (row % 2) * 6; wx < x + w; wx += 12) px(p, wx, wy, 'leaf');
  }
  glowEllipse(p, x + w - 6, y + 27, 16, 13, 'honey', [0.26, 0.14]);

  paintSashWindow(p, x + 4, y + 3);

  // the flag in a little frame
  p.rect(x + 37, y + 11, 9, 7, 'amber');
  paintMap(p, x + 38, y + 12, UNION_FLAG, PLATE_COLOURS);
  p.rect(x + 38, y + 18, 9, 1, 'ink', 0.35);

  // the panelling and the carpet
  p.rect(x, rail, w, floor - rail, 'night');
  p.rect(x, rail, w, 1, 'amber');
  p.rect(x, rail + 1, w, 1, 'ember');
  for (let lx = x + 5; lx < x + w; lx += 9) p.rect(lx, rail + 3, 1, floor - rail - 4, 'slate');
  p.rect(x, floor, w, bottom - floor, 'maroon');
  p.rect(x, floor, w, 1, 'ink');
  for (let row = 0; floor + 2 + row * 2 < bottom; row++) {
    for (let bx = x + 1 + (row % 2) * 3; bx < x + w; bx += 6) px(p, bx, floor + 2 + row * 2, 'red');
  }

  // the shelves by the wall: a fern, the glass lamp, a plant in flower on the floor
  const sx = x + w - 11;
  for (const sy of [y + 19, y + 35]) {
    p.rect(sx, sy, 11, 1, 'amber');
    p.rect(sx, sy + 1, 11, 1, 'ember');
  }
  // the fern
  p.rect(sx + 4, y + 16, 4, 3, 'tan');
  p.rect(sx + 3, y + 13, 6, 3, 'leaf');
  p.rect(sx + 2, y + 14, 1, 2, 'leaf');
  p.rect(sx + 9, y + 14, 1, 2, 'leaf');
  px(p, sx + 5, y + 12, 'leaf');
  px(p, sx + 7, y + 12, 'leaf');
  paintGlassLamp(p, sx + 1, y + 35, 'teal', 'cyan');
  // the plant in flower
  p.rect(sx + 5, floor - 5, 5, 6, 'tan');
  p.rect(sx + 5, floor - 5, 5, 1, 'ember');
  p.rect(sx + 4, floor - 10, 7, 5, 'leaf');
  p.rect(sx + 5, floor - 12, 5, 2, 'leaf');
  px(p, sx + 5, floor - 11, 'neon');
  px(p, sx + 8, floor - 12, 'neon');
  px(p, sx + 6, floor - 8, 'neon');
  px(p, sx + 9, floor - 9, 'honey');
}

/**
 * A white sash window from (x, y), 28x22, between maroon curtains: rain, a
 * clock tower with its lit face, terraced roofs with chimneys, a red bus.
 */
function paintSashWindow(target: Painter, x: number, y: number): void {
  const w = 28;
  const h = 22;
  // the rod and the curtains
  target.rect(x - 4, y - 2, w + 8, 1, 'amber');
  for (const cx of [x - 3, x + w]) {
    target.rect(cx, y - 1, 3, h + 5, 'maroon');
    target.rect(cx + 1, y - 1, 1, h + 5, 'red');
  }
  target.rect(x, y, w, h, 'paper');
  const gx = x + 2;
  const gy = y + 2;
  const gw = w - 4;
  const gh = h - 4;
  const p = within(target, gx, gy, gw, gh);
  const street = gy + gh - 1;
  ditherGradient(p, gx, gy, gw, gh - 5, ['indigo', 'dusk', 'dusk', 'violet']);
  // the clock tower
  p.rect(gx + 15, gy + 4, 4, gh, 'night');
  p.rect(gx + 16, gy + 2, 2, 2, 'night');
  px(p, gx + 16, gy + 1, 'night');
  p.rect(gx + 16, gy + 5, 2, 2, 'honey');
  p.rect(gx + 15, gy + 8, 4, 1, 'slate');
  // terraced roofs with chimneys, a few windows lit
  p.rect(gx, street - 6, gw, 6, 'night');
  for (let i = 0; i < gw; i += 6) {
    p.rect(gx + i + 1, street - 7, 4, 1, 'night');
    p.rect(gx + i + 4, street - 9, 2, 2, 'ink');
    if (hash2(i, 7, 181) < 0.6) px(p, gx + i + 2, street - 4, i % 12 === 0 ? 'honey' : 'lamp');
  }
  // the wet street and the bus
  p.rect(gx, street, gw, 1, 'slate');
  const bx = gx + 2;
  p.rect(bx + 1, street - 6, 9, 1, 'red');
  p.rect(bx, street - 5, 11, 5, 'red');
  for (let i = 0; i < 3; i++) {
    p.rect(bx + 1 + i * 3, street - 5, 2, 1, 'honey');
    p.rect(bx + 1 + i * 3, street - 3, 2, 2, i === 2 ? 'paper' : 'honey');
  }
  p.rect(bx, street - 1, 11, 1, 'maroon');
  px(p, bx + 2, street, 'ink');
  px(p, bx + 8, street, 'ink');
  px(p, bx + 5, street, 'rosy'); // its lights on the wet road
  px(p, bx + 12, street, 'honey');
  // the rain
  for (let i = 0; i < 9; i++) {
    const rx = gx + 1 + Math.floor(hash2(i, 1, 191) * (gw - 2));
    const ry = gy + Math.floor(hash2(i, 2, 193) * (gh - 9));
    px(p, rx, ry, 'sky');
    px(p, rx - 1, ry + 1, 'sky');
  }
  // the glazing bars, the sill
  target.rect(gx, y + Math.floor(h / 2) - 1, gw, 1, 'paper');
  target.rect(x - 1, y + h, w + 2, 1, 'paper');
  target.rect(x - 1, y + h + 1, w + 2, 1, 'ink', 0.35);
}

/**
 * The phone badge on the panel's top edge: a rounded paper tag in an ink rim,
 * a handset and two signal arcs (the same tag as the call panel of the
 * day-before stage). O rim, w paper, k handset, t arcs.
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

export const PHONE_STAGE: StageConfig = {
  paint: paintOffice,
  backdrops: { client: paintCall },
  cast: {
    guide: GUIDE_ACTOR,
    coworker: { sprite: COWORKER_SPRITE, ...BY_DESK, side: 'right' },
    // Mr. Hughes is never in the room: he stands inside the call panel, on his
    // own floor, two pixels above yours.
    client: { sprite: CLIENT_SPRITE, x: BY_DESK.x, y: BY_DESK.y - 2, side: 'right' },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 72, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 101, y: 25 } },
  rest: {
    left: { x: DESK.x + 21, y: PROP_TOP },
    right: { x: DESK.x + 33, y: PROP_TOP },
  },
};
