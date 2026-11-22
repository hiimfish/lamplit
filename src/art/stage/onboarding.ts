import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { HR_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The onboarding stage: the HR office of Harbor Trading on your first Monday,
 * the sun low over the harbour. From the left: grey filing cabinets under a
 * wall clock at nine (you stand in front of them), the company's name plate
 * (a desk lamp: lamps are what the company sells), a pendant lamp, a cork
 * notice board (the organisation chart, the staff's photo cards with one
 * still empty, notes), and a window onto the harbour with a plant under it.
 * The HR desk runs across the middle: forms, the handbook and a badge lie on
 * its top, one of the company's glass lamps glows at its far end, and a small
 * "HR" plate hangs on its front. Handed-over things rest on the desk top.
 * Ms. Reed sits behind the desk (her empty chair shows when she is away);
 * Ms. Carter stands on the carpet at its far end.
 * Painted through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a certificate, the team photo, then an
 * air conditioner and the year planner, taller windows, then a darker upper
 * wall with high windows onto the morning sky), the office door, windows and
 * binder shelves to the left, the corner where badge photos are taken,
 * windows and the copier to the right.
 */

/** The desk's left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 40, w: 57, top: 47 } as const;
/** 24x24 pictures stand on the desk top with their shadow on it. */
const PROP_TOP = DESK.top - 20;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 47;
/** The window in the core: its outer frame. */
const WINDOW = { x: 102, y: 4, w: 25, h: 26 } as const;
/** Ms. Reed, behind the desk (it hides her below the desk top). */
const BEHIND_DESK = { x: 73, y: 31 } as const;
/** Ms. Carter, on the carpet at the desk's far end. */
const BY_DESK = { x: 96, y: 39 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the framed things, and for the planner and air conditioner. */
const PICTURE_MIN = 20;
const PLANNER_MIN = 46;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

type Bay = 'door' | 'window' | 'shelf' | 'photo' | 'copier';
/** What stands in the bays to the right of the core, in order, again and again. */
const RIGHT_BAYS: readonly Bay[] = ['photo', 'window', 'copier', 'window'];

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

/** Paints the HR office to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays beside the core: [left x, kind]. Lamps hang over the ones without a window.
  const bays: [number, Bay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i === 0 ? 'door' : i % 2 === 1 ? 'window' : 'shelf']);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  const lamps = [ox + 59];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  glowEllipse(p, ox + DESK.x + 52, oy + DESK.top - 7, 13, 10, 'honey', [0.3, 0.18, 0.08]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= PICTURE_MIN) {
    paintCertificate(p, ox + 38, oy - 15);
    paintTeamPhoto(p, ox + 66, oy - 16);
  }
  if (oy >= PLANNER_MIN) {
    if (ox + 3 >= 0) paintAirCon(p, ox + 3, oy - 40);
    paintPlanner(p, ox + 36, oy - 43);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'door') paintDoor(p, x + 8, oy + 14, floorTop);
    else if (kind === 'window') paintWindow(p, x + 5, winTop, 34, winH, ox);
    else if (kind === 'shelf') paintShelf(p, x + 7, oy + 12, 30, floorTop, x);
    else if (kind === 'photo') paintPhotoCorner(p, x, oy, floorTop);
    else paintCopierBay(p, x, oy, floorTop);
  }

  // The core: the cabinets behind you, the name plate, the notice board, the window.
  paintCabinet(p, ox + 3, oy + 32, floorTop);
  paintCabinet(p, ox + 18, oy + 32, floorTop);
  paintCabinetTops(p, ox + 3, oy + 32);
  paintClock(p, ox + 22, oy + 13);
  paintNamePlate(p, ox + 39, oy + 9);
  paintNoticeBoard(p, ox + 66, oy + 6);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintLamp(p, lx, cornice, oy);

  paintPlant(p, ox + 116, oy + 37);
  paintDesk(p, ox + DESK.x, oy + DESK.top, floorTop);
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
 * with a ribbon of high windows onto the morning sky.
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

/** One high window centred on `cx`: the sky growing light, long thin clouds, a last star. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 21, top - 1, 43, wh + 2, 'paper');
  ditherGradient(p, cx - 20, top, 41, wh, ['indigo', 'dusk', 'violet', 'mauve']);
  const glass = within(p, cx - 20, top, 41, wh);
  for (let i = 0; i < 4; i++) {
    const len = 7 + Math.floor(hash2(i, n, 131) * 9);
    const sx = cx - 22 + Math.floor(hash2(i, n, 137) * 38);
    const sy = top + Math.floor(wh / 3) + Math.floor(hash2(i, n, 139) * ((wh * 2) / 3 - 2));
    glass.rect(sx, sy, len, 1, 'rosy');
    glass.rect(sx + 2, sy - 1, len - 5, 1, 'mauve');
  }
  if (mod(n, 2) === 0) px(p, cx - 12 + mod(n * 7, 9), top + 3, 'paper');
  p.rect(cx, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; the scene repeats so every window shows a piece of it. */
const HARBOUR_P = 176;
/** Where the low sun sits in a period (in the core's window). */
const SUN_X = 108;

/**
 * The harbour with the sun low over the water, seen through a window: its
 * glass from (x, y), w x h. Positions count from the core's left edge `ox`,
 * so windows side by side show one continuous view.
 */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  // The horizon sits a fixed way up from the sill, so a taller window only shows more sky.
  const horizon = y + h - 9;
  const sky: PaletteName[] =
    h > 30
      ? ['indigo', 'dusk', 'violet', 'mauve', 'rosy', 'honey']
      : ['dusk', 'violet', 'mauve', 'rosy', 'honey'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  // long thin clouds, pink underneath
  for (let i = -8; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hx % 11 !== 0 || hash2(hx, 1, 61) > 0.55) continue;
    const len = 5 + Math.floor(hash2(hx, 2, 67) * 6);
    const cy = y + 2 + Math.floor(hash2(hx, 3, 71) * Math.max(2, horizon - y - 11));
    p.rect(x + i, cy, len, 1, 'rosy');
    p.rect(x + i + 1, cy - 1, len - 3, 1, 'mauve');
  }
  // the water, light near the horizon
  ditherGradient(p, x, horizon, w, y + h - horizon, ['mauve', 'violet', 'dusk']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hx % 7 === 0 && hash2(hx, 4, 73) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 5, 79) * 6);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 5 ? 'rosy' : 'mauve');
    }
  }
  const first = Math.floor((x - ox - 60) / HARBOUR_P);
  // the sun, half up, and its path on the water
  for (let k = first; ox + k * HARBOUR_P < x + w + 60; k++) {
    const sx = ox + k * HARBOUR_P + SUN_X;
    p.rect(sx - 1, horizon - 4, 3, 1, 'honey');
    p.rect(sx - 2, horizon - 3, 5, 1, 'paper');
    p.rect(sx - 3, horizon - 2, 7, 2, 'paper');
    px(p, sx - 3, horizon - 2, 'honey');
    px(p, sx + 3, horizon - 2, 'honey');
    p.rect(sx - 2, horizon + 1, 5, 1, 'honey');
    p.rect(sx - 1, horizon + 3, 3, 1, 'honey');
    p.rect(sx - 2, horizon + 5, 3, 1, 'honey');
    p.rect(sx, horizon + 7, 2, 1, 'lamp');
  }
  // the far shore: low hills, a few lights still on
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (Math.abs(hx - SUN_X) < 6) continue;
    const bump = Math.round(1.5 + Math.sin(hx / 9) + Math.sin(hx / 4.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 6, 89) < 0.08) px(p, x + i, horizon, 'lamp');
  }
  p.rect(x, horizon, w, 1, 'night');
  // what stands in the water, one period at a time
  for (let k = first; ox + k * HARBOUR_P < x + w + 60; k++) {
    const base = ox + k * HARBOUR_P;
    paintCrane(p, base + 122, horizon, 8);
    paintCrane(p, base + 150, horizon, 9);
    paintShip(p, base + 60, horizon + 5, 24);
    paintShip(p, base + 4, horizon + 4, 18);
    paintShip(p, base + 128, horizon + 6, 20);
  }
}

/** A container crane on the quay: a portal on two legs, a boom out over the water, an A-frame on top. */
function paintCrane(p: Painter, x: number, horizon: number, tall: number): void {
  const boom = horizon - tall;
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 5, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 6, 1, 'ink');
  p.rect(x - 9, boom, 18, 1, 'ink');
  p.rect(x + 2, boom - 4, 1, 4, 'ink');
  for (let i = 1; i < 10; i++) px(p, x + 2 - i, boom - 4 + Math.floor((i * 4) / 10), 'ink');
  for (let i = 1; i < 5; i++) px(p, x + 2 + i, boom - 4 + i, 'ink');
  px(p, x + 2, boom - 5, 'red');
  p.rect(x - 6, boom + 1, 2, 2, 'night');
  // the quay it stands on, with a few containers
  p.rect(x - 4, horizon - 1, 16, 2, 'ink');
  p.rect(x + 7, horizon - 3, 3, 2, 'maroon');
  p.rect(x - 3, horizon - 3, 3, 2, 'teal');
}

/** A moored ship, its bow to the left: dark hull, stacked containers, the bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number, len: number): void {
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  p.rect(x + 2, waterline - 2, len - 3, 1, 'maroon');
  const colours: readonly PaletteName[] = ['teal', 'ember', 'maroon', 'denim'];
  for (let c = 0, cx = x + 3; cx + 3 < x + len - 7; cx += 4, c++) {
    p.rect(cx, waterline - 6, 3, 2, colours[c % colours.length] ?? 'teal');
  }
  const bx = x + len - 7;
  p.rect(bx, waterline - 9, 5, 5, 'night');
  p.rect(bx, waterline - 9, 5, 1, 'stone');
  px(p, bx + 1, waterline - 7, 'honey');
  px(p, bx + 3, waterline - 7, 'honey');
  p.rect(bx + 2, waterline - 12, 2, 3, 'ink');
  px(p, bx + 2, waterline - 12, 'red');
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
// The HR office

/** A grey filing cabinet from `top` to the floor: drawers with a handle and a label card each. */
function paintCabinet(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 15;
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'concrete');
  p.rect(x, top, w, 1, 'fog');
  p.rect(x + w - 1, top + 1, 1, bottom - top - 1, 'stone');
  for (let dy = top + 1; dy + 6 <= bottom; dy += 6) {
    p.rect(x + 1, dy + 5, w - 2, 1, 'stone');
    p.rect(x + 5, dy + 3, 5, 1, 'night');
    p.rect(x + 6, dy + 1, 3, 1, 'paper');
  }
}

/** What stands on the two cabinets (their top at `top`): box files and a letter tray with forms. */
function paintCabinetTops(p: Painter, x: number, top: number): void {
  const files: readonly (readonly [PaletteName, PaletteName])[] = [
    ['denim', 'indigo'],
    ['red', 'maroon'],
    ['teal', 'moss'],
  ];
  files.forEach(([spine, shade], i) => {
    const fx = x + 2 + i * 4;
    const fh = i === 1 ? 7 : 8;
    p.rect(fx, top - fh, 4, fh, spine);
    p.rect(fx + 3, top - fh, 1, fh, shade);
    px(p, fx + 1, top - fh + 2, 'paper');
  });
  // the tray: two shelves of paper on thin legs
  const tx = x + 17;
  p.rect(tx, top - 1, 11, 1, 'night');
  p.rect(tx + 1, top - 2, 9, 1, 'paper');
  p.rect(tx, top - 4, 11, 1, 'night');
  p.rect(tx + 1, top - 5, 8, 1, 'paper');
  px(p, tx, top - 3, 'night');
  px(p, tx + 10, top - 3, 'night');
  px(p, tx, top - 2, 'night');
  px(p, tx + 10, top - 2, 'night');
}

/** A round wall clock at nine o'clock: the first morning starts on time. */
function paintClock(p: Painter, cx: number, cy: number): void {
  p.rect(cx - 2, cy - 4, 5, 9, 'ink');
  p.rect(cx - 4, cy - 2, 9, 5, 'ink');
  p.rect(cx - 3, cy - 3, 7, 7, 'ink');
  p.rect(cx - 2, cy - 3, 5, 7, 'paper');
  p.rect(cx - 3, cy - 2, 7, 5, 'paper');
  p.rect(cx, cy - 2, 1, 3, 'ink');
  p.rect(cx - 2, cy, 2, 1, 'ink');
  px(p, cx + 2, cy + 2, 'fog');
}

/**
 * The company's sign, a desk lamp: a wide shade, a pull chain, a stem and a
 * foot. `c` is its centre column and `y` the top of the shade.
 */
function paintLampSign(p: Painter, c: number, y: number, shade: PaletteName, rim: PaletteName) {
  p.rect(c - 1, y, 3, 1, shade);
  p.rect(c - 2, y + 1, 5, 2, shade);
  p.rect(c - 3, y + 3, 7, 1, shade);
  p.rect(c - 3, y + 4, 7, 1, rim);
  p.rect(c + 2, y + 5, 1, 2, rim);
  p.rect(c, y + 5, 1, 4, shade);
  p.rect(c - 2, y + 9, 5, 1, shade);
}

/** The company's name plate: a lit desk lamp on a navy plate in a brass frame, the name under it. */
function paintNamePlate(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 13, 15, 'amber');
  p.rect(x, y + 1, 15, 13, 'amber');
  p.rect(x + 1, y, 13, 1, 'lamp');
  p.rect(x, y + 1, 1, 6, 'lamp');
  p.rect(x + 2, y + 14, 11, 1, 'ember');
  p.rect(x + 1, y + 1, 13, 13, 'indigo');
  p.rect(x + 2, y + 2, 11, 11, 'deep');
  const c = x + 7;
  paintLampSign(p, c, y + 3, 'honey', 'lamp');
  p.rect(c - 1, y + 4, 1, 2, 'paper');
  // the name, too small to read
  p.rect(x + 1, y + 17, 5, 1, 'stone');
  p.rect(x + 7, y + 17, 7, 1, 'stone');
}

/**
 * The five people already in the office as [hair, clothes]. The sixth photo
 * card on the notice board is still empty: it is yours.
 */
const STAFF: readonly (readonly [PaletteName, PaletteName])[] = [
  ['fog', 'denim'],
  ['ink', 'concrete'],
  ['plum', 'teal'],
  ['ember', 'sky'],
  ['amber', 'rosy'],
];

/** The cork notice board: the organisation chart, the staff's photo cards, notes and a notice. */
function paintNoticeBoard(p: Painter, x: number, y: number): void {
  const w = 33;
  const h = 21;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'tan');
  for (let i = 0; i < 14; i++) {
    const sx = x + 1 + Math.floor(hash2(i, 3, 151) * (w - 2));
    const sy = y + 1 + Math.floor(hash2(i, 5, 157) * (h - 2));
    px(p, sx, sy, 'amber');
  }
  p.rect(x + 1, y + h, w - 1, 1, 'concrete');
  // the organisation chart: one box over three
  p.rect(x + 2, y + 2, 11, 10, 'paper');
  p.rect(x + 6, y + 3, 3, 2, 'ink');
  px(p, x + 7, y + 5, 'stone');
  p.rect(x + 4, y + 6, 7, 1, 'stone');
  p.rect(x + 3, y + 7, 2, 3, 'denim');
  p.rect(x + 6, y + 7, 3, 3, 'teal');
  p.rect(x + 10, y + 7, 2, 3, 'red');
  px(p, x + 7, y + 2, 'red');
  // six photo cards, three by two
  for (let i = 0; i < 6; i++) {
    const cx = x + 15 + (i % 3) * 5;
    const cy = y + 2 + Math.floor(i / 3) * 6;
    p.rect(cx, cy, 4, 5, 'paper');
    const person = STAFF[i];
    if (person) {
      p.rect(cx + 1, cy + 1, 2, 1, person[0]);
      p.rect(cx + 1, cy + 2, 2, 1, 'skin');
      p.rect(cx, cy + 3, 4, 2, person[1]);
    } else {
      p.rect(cx + 1, cy + 1, 2, 3, 'fog');
      px(p, cx + 3, cy, 'honey');
    }
  }
  // notes and a notice along the bottom
  p.rect(x + 2, y + 14, 4, 4, 'honey');
  px(p, x + 3, y + 15, 'amber');
  p.rect(x + 3, y + 16, 2, 1, 'amber');
  p.rect(x + 8, y + 14, 4, 4, 'rosy');
  p.rect(x + 9, y + 15, 2, 1, 'maroon');
  p.rect(x + 15, y + 14, 9, 5, 'paper');
  p.rect(x + 16, y + 15, 7, 1, 'red');
  p.rect(x + 16, y + 17, 6, 1, 'stone');
  p.rect(x + 26, y + 14, 4, 4, 'sky');
  px(p, x + 27, y + 15, 'denim');
  px(p, x + 19, y + 14, 'teal');
}

const LETTER_H = ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'] as const;
const LETTER_R = ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'] as const;

/** One 3x5 pixel letter. */
function paintLetter(p: Painter, rows: readonly string[], x: number, y: number): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === 'x') px(p, x + dx, y + dy, 'ink');
  });
}

/**
 * The HR desk seen from the front: a wooden top, a panelled front with a
 * small "HR" plate, and on the top the forms with a pen, the handbook, a
 * badge on its lanyard and, at the far end, one of the company's glass lamps.
 */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
  const bottom = floorTop + 6;
  // Ms. Reed's chair behind the desk: its back shows when she is away
  const chair = x + BEHIND_DESK.x - DESK.x + 3;
  p.rect(chair + 3, top - 10, 5, 1, 'stone');
  p.rect(chair + 1, top - 9, 9, 1, 'stone');
  p.rect(chair, top - 8, 11, 6, 'slate');
  p.rect(chair + 10, top - 8, 1, 6, 'night');
  p.rect(chair + 2, top - 7, 7, 1, 'stone');
  p.rect(chair + 4, top - 2, 3, 2, 'night');
  // its armrests
  p.rect(chair - 2, top - 4, 2, 1, 'stone');
  p.rect(chair + 11, top - 4, 2, 1, 'stone');
  p.rect(chair - 1, top - 3, 1, 3, 'night');
  p.rect(chair + 11, top - 3, 1, 3, 'night');
  // shadow on the carpet
  p.rect(x, bottom, w + 2, 1, 'night');
  // the front: boards between two posts, a kick board at the foot
  p.rect(x, top + 4, w, bottom - top - 4, 'ember');
  for (let bx = x + 8; bx < x + w - 4; bx += 8) p.rect(bx, top + 5, 1, bottom - top - 6, 'plum');
  p.rect(x, top + 4, 3, bottom - top - 4, 'amber');
  p.rect(x + w - 3, top + 4, 3, bottom - top - 4, 'amber');
  px(p, x + 2, top + 4, 'ember');
  p.rect(x + w - 1, top + 4, 1, bottom - top - 4, 'ember');
  p.rect(x + 3, bottom - 1, w - 6, 1, 'plum');
  // the top, a pixel proud of the front, and its shadow
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 2, 'amber');
  p.rect(x - 1, top + 3, w + 2, 1, 'ember');
  p.rect(x, top + 4, w, 1, 'plum');
  // the "HR" plate
  const sx = x + 23;
  p.rect(sx, top + 6, 11, 7, 'paper');
  p.rect(sx, top + 12, 11, 1, 'fog');
  paintLetter(p, LETTER_H, sx + 2, top + 7);
  paintLetter(p, LETTER_R, sx + 6, top + 7);
  // forms and a pen
  p.rect(x + 4, top - 1, 8, 1, 'paper');
  p.rect(x + 3, top, 10, 1, 'paper');
  px(p, x + 12, top, 'fog');
  p.rect(x + 14, top, 4, 1, 'ink');
  // the handbook, lying flat
  p.rect(x + 20, top - 2, 9, 1, 'denim');
  p.rect(x + 20, top - 1, 9, 1, 'paper');
  p.rect(x + 20, top, 9, 1, 'denim');
  px(p, x + 20, top - 1, 'denim');
  px(p, x + 22, top - 2, 'sky');
  // a badge and its lanyard
  px(p, x + 31, top, 'lamp');
  px(p, x + 32, top - 1, 'lamp');
  px(p, x + 33, top, 'lamp');
  p.rect(x + 34, top - 1, 3, 2, 'paper');
  px(p, x + 35, top - 1, 'sky');
  // the glass lamp at the far end, lit, and its light on the desk top
  const lx = x + 51;
  p.rect(lx - 6, top, 13, 1, 'paper');
  p.rect(lx - 2, top - 1, 6, 1, 'ember');
  p.rect(lx, top - 6, 2, 5, 'amber');
  px(p, lx, top - 5, 'lamp');
  p.rect(lx - 1, top - 10, 4, 1, 'honey');
  p.rect(lx - 2, top - 9, 6, 1, 'honey');
  p.rect(lx - 3, top - 8, 8, 1, 'honey');
  p.rect(lx - 3, top - 7, 8, 1, 'lamp');
  p.rect(lx - 1, top - 9, 2, 1, 'paper');
  p.rect(lx, top - 6, 2, 1, 'paper');
}

/** The office door, frosted glass with the company's lamp on it, and a brass handle. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 26;
  const h = floorTop - top;
  p.rect(x - 2, top - 2, w + 4, h + 2, 'paper');
  p.rect(x, top, w, h, 'amber');
  p.rect(x + w - 2, top, 2, h, 'ember');
  ditherGradient(p, x + 4, top + 4, w - 8, 18, ['fog', 'concrete']);
  paintLampSign(p, x + 12, top + 7, 'stone', 'stone');
  p.rect(x + 4, top + 25, w - 8, h - 30, 'ember');
  p.rect(x + 5, top + 26, w - 10, h - 32, 'amber');
  p.rect(x + w - 6, top + 22, 3, 1, 'honey');
  px(p, x + w - 5, top + 23, 'honey');
}

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

/** A wooden shelf unit of binders from `top` to the floor, cupboard doors at the bottom. */
function paintShelf(
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
    for (let bx = x + 2, i = 0; bx + 3 <= x + w - 2; bx += 3, i++) {
      if (hash2(i, seed + s * 7, 107) < 0.12) continue;
      const pick = Math.floor(hash2(i, seed + s * 7, 109) * BINDERS.length);
      const [spine, shade] = BINDERS[pick] ?? ['denim', 'indigo'];
      const bh = 8 + Math.floor(hash2(i, seed + s * 7, 113) * 2);
      p.rect(bx, sy - bh, 3, bh, spine);
      p.rect(bx + 2, sy - bh, 1, bh, shade);
      px(p, bx + 1, sy - bh + 2, spine === 'paper' ? 'stone' : 'paper');
    }
    p.rect(x + 2, sy, w - 4, 1, 'amber');
  }
  // the cupboard below
  const cy = bottom - 12;
  p.rect(x + 1, cy, w - 2, 1, 'amber');
  const half = Math.floor((w - 4) / 2);
  for (const dx of [2, 3 + half]) {
    p.rect(x + dx, cy + 2, half - 1, 8, 'amber');
    p.rect(x + dx + half - 2, cy + 2, 1, 8, 'ember');
  }
  px(p, x + 1 + half, cy + 5, 'honey');
  px(p, x + 4 + half, cy + 5, 'honey');
  // a box of new badges on top
  p.rect(x + w - 11, top - 4, 8, 4, 'tan');
  p.rect(x + w - 11, top - 4, 8, 1, 'skin');
  px(p, x + w - 8, top - 2, 'paper');
}

/** The corner where badge photos are taken: a pale blue screen, a stool, a camera on a tripod. */
function paintPhotoCorner(p: Painter, x: number, oy: number, floorTop: number): void {
  // the screen hanging from its roller
  p.rect(x + 4, oy + 15, 22, 2, 'stone');
  p.rect(x + 5, oy + 17, 20, floorTop - oy - 20, 'sky');
  p.rect(x + 23, oy + 17, 2, floorTop - oy - 20, 'denim');
  p.rect(x + 5, floorTop - 3, 20, 1, 'stone');
  // the stool
  p.rect(x + 10, floorTop - 6, 9, 2, 'ember');
  p.rect(x + 10, floorTop - 6, 9, 1, 'amber');
  p.rect(x + 11, floorTop - 4, 1, 6, 'night');
  p.rect(x + 17, floorTop - 4, 1, 6, 'night');
  // the camera, looking at the stool
  const cx = x + 33;
  p.rect(cx, oy + 38, 7, 5, 'night');
  p.rect(cx, oy + 38, 7, 1, 'stone');
  p.rect(cx - 2, oy + 39, 2, 3, 'ink');
  px(p, cx - 2, oy + 40, 'sky');
  p.rect(cx + 4, oy + 36, 2, 2, 'stone');
  px(p, cx + 5, oy + 40, 'red');
  p.rect(cx + 3, oy + 43, 1, 4, 'ink');
  for (let i = 0; i < floorTop + 3 - (oy + 47); i++) {
    px(p, cx + 3 - Math.floor(i / 3), oy + 47 + i, 'ink');
    px(p, cx + 3 + Math.floor(i / 3), oy + 47 + i, 'ink');
    if (i % 2 === 0) px(p, cx + 3, oy + 47 + i, 'ink');
  }
}

/** The copier with a tray of copies, beside the water cooler. */
function paintCopierBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const cx = x + 5;
  const top = oy + 34;
  const bottom = floorTop + 1;
  p.rect(cx, top + 4, 20, bottom - top - 4, 'concrete');
  p.rect(cx + 19, top + 4, 1, bottom - top - 4, 'stone');
  p.rect(cx - 1, top, 22, 4, 'paper');
  p.rect(cx - 1, top + 3, 22, 1, 'fog');
  p.rect(cx + 12, top + 1, 7, 1, 'stone');
  px(p, cx + 13, top + 1, 'leaf');
  px(p, cx + 17, top + 1, 'red');
  p.rect(cx + 2, top + 7, 16, 1, 'night');
  p.rect(cx + 20, top + 8, 5, 1, 'stone');
  p.rect(cx + 20, top + 7, 4, 1, 'paper');
  for (let dy = top + 11; dy + 5 < bottom; dy += 6) {
    p.rect(cx + 1, dy, 18, 1, 'stone');
    p.rect(cx + 8, dy + 2, 4, 1, 'night');
  }
  // the water cooler
  const wx = x + 31;
  p.rect(wx + 2, oy + 33, 7, 9, 'sky');
  p.rect(wx + 3, oy + 34, 1, 7, 'paper');
  p.rect(wx + 4, oy + 32, 3, 1, 'denim');
  p.rect(wx, oy + 42, 11, bottom - oy - 42, 'paper');
  p.rect(wx + 9, oy + 42, 2, bottom - oy - 42, 'fog');
  px(p, wx + 3, oy + 45, 'red');
  px(p, wx + 6, oy + 45, 'denim');
  p.rect(wx + 2, oy + 47, 7, 1, 'stone');
}

// ---------------------------------------------------------------------------
// Above the core

/** A framed certificate: lines of writing and a red seal. */
function paintCertificate(p: Painter, x: number, y: number): void {
  p.rect(x, y, 16, 12, 'ember');
  p.rect(x, y, 16, 1, 'amber');
  p.rect(x + 1, y + 1, 14, 10, 'paper');
  p.rect(x + 4, y + 3, 8, 1, 'denim');
  p.rect(x + 3, y + 5, 10, 1, 'fog');
  p.rect(x + 3, y + 7, 6, 1, 'fog');
  p.rect(x + 11, y + 7, 2, 2, 'red');
  p.rect(x + 1, y + 12, 15, 1, 'concrete');
}

/** The framed team photo: five people in a row in front of the harbour. */
function paintTeamPhoto(p: Painter, x: number, y: number): void {
  const w = 32;
  const h = 13;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['violet', 'rosy', 'honey']);
  p.rect(x + 1, y + 8, w - 2, 4, 'slate');
  STAFF.forEach(([hair, clothes], i) => {
    const hx = x + 4 + i * 5;
    p.rect(hx, y + 4, 3, 1, hair);
    p.rect(hx, y + 5, 3, 2, 'skin');
    px(p, hx + 2, y + 5, hair);
    p.rect(hx - 1, y + 7, 5, 5, clothes);
  });
  p.rect(x + 1, y + h, w, 1, 'concrete');
}

/** The year planner: twelve months across, coloured strips for holidays and trade fairs. */
function paintPlanner(p: Painter, x: number, y: number): void {
  const w = 64;
  const h = 20;
  p.rect(x, y, w, h, 'slate');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + 1, y + 1, w - 2, 3, 'denim');
  for (let m = 0; m < 12; m++) {
    const mx = x + 2 + m * 5;
    px(p, mx + 1, y + 2, 'paper');
    if (m > 0) p.rect(mx - 1, y + 4, 1, h - 5, 'fog');
    for (let r = 0; r < 4; r++) {
      const pick = hash2(m, r, 163);
      if (pick > 0.55) continue;
      const colour: PaletteName =
        pick < 0.15 ? 'red' : pick < 0.3 ? 'sky' : pick < 0.45 ? 'honey' : 'leaf';
      p.rect(mx, y + 6 + r * 3, 3, 2, colour);
    }
  }
  p.rect(x + 1, y + h, w, 1, 'concrete');
}

/** A wall air conditioner. */
function paintAirCon(p: Painter, x: number, y: number): void {
  p.rect(x, y, 28, 9, 'paper');
  p.rect(x, y + 6, 28, 3, 'fog');
  p.rect(x + 2, y + 7, 24, 1, 'stone');
  p.rect(x + 27, y, 1, 9, 'fog');
  px(p, x + 24, y + 3, 'leaf');
  p.rect(x + 1, y + 9, 27, 1, 'concrete');
}

export const ONBOARDING_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    hr: { sprite: HR_SPRITE, ...BEHIND_DESK, side: 'right', clipBottom: DESK.top },
    // Ms. Carter comes to the end of the desk, whether Ms. Reed is behind it or not.
    manager: { sprite: MANAGER_SPRITE, ...BY_DESK, side: 'right', beside: BY_DESK },
  },
  // One bubble place serves both of them: its tail ends between their heads.
  want: { left: { x: 30, y: 5 }, right: { x: 56, y: 3 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 89, y: 18 } },
  // The right-hand picture stops short of Ms. Reed's face.
  rest: { left: { x: DESK.x + 1, y: PROP_TOP }, right: { x: DESK.x + 12, y: PROP_TOP } },
};
