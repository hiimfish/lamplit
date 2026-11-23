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
import { NEW_HIRE_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The recruiting stage: the open office of Harbor Trading on a March evening,
 * when the team decides it needs an assistant. From the left: your own desk,
 * set up and busy (a spreadsheet on the monitor, your Lantern lamp lit), then
 * the empty desk next to it, the subject of the whole location: a clean top
 * where the things handed over rest, a bare switched-off monitor and the
 * chair pushed in. To the right a low filing cabinet carries Ms. Reed's
 * folders of applications, and a job ad is pinned on the board above it. The
 * harbour at dusk shows through the wide window behind the desks.
 *
 * The second picture (`backdrops.new_hire`, the interview of t5) is the small
 * interview room: a table across the room with a résumé sheet and a glass of
 * water on it, two chairs behind it for the panel and one at its far end for
 * the applicant, a window onto the same harbour, a sideboard with a lamp.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom, wall goes
 * on above it, and the room goes on to both sides. Palette colours only,
 * whole pixels, the same picture every time.
 */

/** Width and top (core y) of an office desk; props rest on the desktop. */
const DESK_W = 48;
const DESK_TOP = 48;
/** Your desk starts left of the core; the empty one starts where yours ends. */
const MY_DESK_X = -12;
const VACANT_X = MY_DESK_X + DESK_W;
/** 24x24 pictures stand on the desktop (or the interview table) with their shadow on it. */
const PROP_TOP = DESK_TOP - 20;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall of the office. */
const RAIL_Y = 47;
/** The y of the top of the low partition behind the office desks. */
const PARTITION_TOP = 35;
/** The wide window in the core: its outer frame. */
const WINDOW = { x: 42, y: 4, w: 59, h: 27 } as const;
/** The two pendant lamps of the core. */
const LAMPS = [36, 106] as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the clock and the air conditioner, and for the poster and emblem. */
const CLOCK_MIN = 20;
const POSTER_MIN = 46;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

/**
 * Where people stand. Ms. Reed alone (and every NPC alone) stands at REED;
 * with Ms. Reed, Ms. Carter steps in to the left of her, in front of the empty
 * desk; at the interview Ms. Carter keeps that place beside you (the panel)
 * and Leo stands at the far end of the table.
 */
const REED = { x: 82, y: 39 } as const;
const CARTER_BESIDE = { x: 66, y: 39 } as const;
const LEO_BESIDE = { x: 96, y: 39 } as const;

/** The interview table: its left edge, width and top, in core pixels. */
const TABLE = { x: 30, w: 70, top: DESK_TOP } as const;
/** The rail of the interview room's lower wall. */
const ROOM_RAIL = 44;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a window's glass, a glass wall). */
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

// ---------------------------------------------------------------------------
// The office

/** Paints the office with the empty desk to fill a w x h stage (at least the core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;
  const rowStart = ox + MY_DESK_X;

  // Bays to the left of your desk: a window with the printer, then filing cabinets.
  const bays: [number, 'window' | 'cabinet'][] = [];
  for (let x = rowStart - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'cabinet']);
  }
  // To the right of the core the desks go on, one every DESK_W, a window over each.
  const desks: number[] = [];
  for (let x = ox + CORE_W + 3; x < w; x += DESK_W) desks.push(x);

  const lamps: number[] = LAMPS.map((x) => ox + x);
  for (const [x, kind] of bays) if (kind === 'cabinet') lamps.push(x + BAY_W / 2);
  for (const x of desks) lamps.push(x + DESK_W - 3);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  if (oy >= CLOCK_MIN) {
    paintClock(p, ox + 24, oy - 8);
    paintAircon(p, ox + 104, oy - 14);
  }
  if (oy >= POSTER_MIN) {
    paintPoster(p, ox + 14, oy - 40);
    paintEmblem(p, ox + 64, oy - 41);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') {
      paintWindow(p, x + 5, winTop, 34, winH, ox, 2);
      paintPrinterBay(p, x, oy, floorTop);
    } else paintCabinetBay(p, x, oy, floorTop);
  }

  // The back wall of the core: your shelf, the window, the pinboard with the job ad.
  paintShelf(p, ox + 1, oy + 17);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox, 3);
  paintPinboard(p, ox + 107, oy + 8);
  for (const x of desks) paintWindow(p, x + 5, winTop, 34, winH, ox, 2);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);

  paintPartition(p, rowStart, w, oy + PARTITION_TOP, floorTop);

  // The desks, far ones first, then the cabinet of applications, the empty desk and yours.
  desks.forEach((x, i) => {
    paintDesk(p, x, deskTop, floorTop);
    paintDeskKit(p, x, deskTop, floorTop, {
      screen: i % 3 === 1 ? 'off' : 'sheet',
      shade: SHADES[i % SHADES.length] ?? 'rosy',
      lit: i % 2 === 0,
    });
  });
  paintApplications(p, ox + 96, floorTop);
  paintPlant(p, ox + 121, floorTop - 18);
  paintDesk(p, ox + VACANT_X, deskTop, floorTop);
  paintVacantDesk(p, ox + VACANT_X, deskTop, floorTop);
  paintDesk(p, rowStart, deskTop, floorTop);
  paintMyDesk(p, rowStart, deskTop, floorTop);
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
  p.rect(cx, from, 1, oy + 3 - from, 'ink');
  p.rect(cx - 1, oy + 3, 3, 1, 'ember');
  p.rect(cx - 2, oy + 4, 5, 1, 'amber');
  p.rect(cx - 3, oy + 5, 7, 1, 'amber');
  p.rect(cx - 4, oy + 6, 9, 1, 'ember');
  p.rect(cx - 2, oy + 7, 5, 1, 'honey');
  px(p, cx - 2, oy + 5, 'lamp');
}

/** The low partition behind the desks, from x0 to the right edge: blue cloth panels with a pale cap. */
function paintPartition(p: Painter, x0: number, w: number, top: number, floorTop: number): void {
  p.rect(x0, top, w - x0, floorTop - top, 'denim');
  for (let x = x0 + 24; x < w; x += 24) p.rect(x, top + 2, 1, floorTop - top - 2, 'indigo');
  p.rect(x0, top, w - x0, 1, 'sky');
  p.rect(x0, floorTop - 1, w - x0, 1, 'night');
  p.rect(x0 - 1, top, 2, floorTop + 1 - top, 'indigo');
  px(p, x0 - 1, top, 'sky');
}

/** The wall above `cornice` on a tall stage: a darker band with high windows onto the night sky. */
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
  }
  p.rect(cx - 7, top, 1, wh, 'paper');
  p.rect(cx + 7, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The harbour outside (shared by both rooms)

/** One period of the harbour, in pixels; the scene repeats so every window shows a piece of it. */
const HARBOUR_P = 150;

/** The harbour at dusk seen through glass from (x, y), w x h; counted from the core's left edge `ox`. */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 8;
  const sky: PaletteName[] =
    h > 30 ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy'] : ['indigo', 'violet', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hash2(hx, 3, 211) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 223) * Math.max(3, horizon - y - 12)), 'fog');
    }
    const bump = Math.round(1.5 + Math.sin(hx / 8) + Math.sin(hx / 3.7) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 227) < 0.14) px(p, x + i, horizon, hash2(hx, 6, 229) < 0.5 ? 'honey' : 'lamp');
    if (hx % 6 === 0 && hash2(hx, 1, 233) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 239) * 5);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  const first = Math.floor((x - ox - 40) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 40; k++) {
    const base = ox + k * HARBOUR_P;
    paintCrane(p, base + 87, horizon, 6);
    paintCrane(p, base + 141, horizon, 7);
    paintShip(p, base + 48, horizon + 5, 22);
    paintShip(p, base + 4, horizon + 3, 14);
  }
}

/** A dockside crane against the sky, its boom out over the water to the left. */
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
  p.rect(x - 7, boom + 1, 2, 2, 'night');
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
}

/** A window with a white frame and sill: the harbour behind `panes` panes, a blind a little way down. */
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
  const blind = 3 + Math.max(0, Math.floor((h - WINDOW.h) / 3));
  for (let r = 0; r < blind; r++) p.rect(x + 2, y + 2 + r, w - 4, 1, r % 2 === 0 ? 'paper' : 'fog');
  p.rect(x + 2, y + 2 + blind, w - 4, 1, 'concrete');
  p.rect(x + w - 5, y + 3 + blind, 1, 4, 'fog');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// Things on the office wall

/** A box file standing on a shelf whose board is at `bottom`. */
function paintBoxFile(p: Painter, x: number, bottom: number, c: PaletteName, shade: PaletteName) {
  p.rect(x, bottom - 8, 3, 8, c);
  p.rect(x + 2, bottom - 8, 1, 8, shade);
  px(p, x + 1, bottom - 6, 'paper');
}

/**
 * The shelf over your desk, 30 wide: box files, a small framed photo and a
 * sample Lantern lamp shade waiting to be checked.
 */
function paintShelf(p: Painter, x: number, y: number): void {
  const w = 30;
  p.rect(x + 1, y + 2, w, 1, 'concrete');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  p.rect(x + 3, y + 2, 1, 2, 'ember');
  p.rect(x + w - 4, y + 2, 1, 2, 'ember');
  paintBoxFile(p, x + 1, y, 'denim', 'indigo');
  paintBoxFile(p, x + 5, y, 'red', 'maroon');
  paintBoxFile(p, x + 9, y, 'teal', 'moss');
  paintBoxFile(p, x + 13, y, 'lamp', 'amber');
  // the framed photo, leaning
  p.rect(x + 17, y - 6, 6, 6, 'ink');
  p.rect(x + 18, y - 5, 4, 4, 'sky');
  p.rect(x + 18, y - 3, 4, 2, 'leaf');
  // a glass shade, upside down
  p.rect(x + 24, y - 3, 5, 3, 'teal');
  p.rect(x + 25, y - 4, 3, 1, 'teal');
  px(p, x + 25, y - 3, 'cyan');
}

/**
 * The cork pinboard, 18 x 18: the draft job ad in the middle (a teal heading
 * bar, lines of text, a little lamp), notes around it.
 */
function paintPinboard(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 18, 18, 1, 'concrete');
  p.rect(x, y, 18, 18, 'ember');
  p.rect(x + 1, y + 1, 16, 16, 'tan');
  // the job ad
  p.rect(x + 5, y + 2, 9, 13, 'paper');
  p.rect(x + 5, y + 2, 9, 2, 'teal');
  px(p, x + 9, y + 1, 'red');
  p.rect(x + 6, y + 5, 3, 3, 'lamp');
  px(p, x + 7, y + 4, 'teal');
  p.rect(x + 10, y + 6, 3, 1, 'stone');
  p.rect(x + 6, y + 9, 7, 1, 'stone');
  p.rect(x + 6, y + 11, 6, 1, 'stone');
  p.rect(x + 6, y + 13, 4, 1, 'stone');
  // notes
  p.rect(x + 2, y + 3, 3, 3, 'honey');
  p.rect(x + 2, y + 10, 3, 4, 'rosy');
  p.rect(x + 14, y + 4, 3, 5, 'paper');
  px(p, x + 15, y + 3, 'denim');
  p.rect(x + 14, y + 11, 3, 3, 'sky');
}

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
  p.rect(x + 3, y + 14, 9, 1, 'ember');
  const c = x + 7;
  p.rect(c - 1, y + 2, 3, 1, 'honey');
  px(p, c - 1, y + 3, 'honey');
  px(p, c + 1, y + 3, 'honey');
  p.rect(c - 2, y + 4, 5, 1, 'honey');
  p.rect(c, y + 5, 1, 6, 'honey');
  p.rect(c - 3, y + 9, 1, 2, 'honey');
  p.rect(c + 3, y + 9, 1, 2, 'honey');
  p.rect(c - 2, y + 11, 5, 1, 'honey');
}

// ---------------------------------------------------------------------------
// The desks

/** Glass shades of the desk lamps down the row. */
const SHADES: readonly PaletteName[] = ['rosy', 'lamp', 'leaf', 'red'];

/** A bare desk, DESK_W wide: a wooden top on two legs, its shadow on the carpet. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK_W;
  const foot = floorTop + 6;
  p.rect(x + 1, foot, w - 1, 1, 'night');
  for (const lx of [x + 1, x + w - 3]) {
    p.rect(lx, top + 2, 2, foot - top - 2, 'ember');
    p.rect(lx + 1, top + 2, 1, foot - top - 2, 'plum');
  }
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

/** A flat monitor, 10 wide, on its stand on the desk: switched off or showing a spreadsheet. */
function paintMonitor(p: Painter, x: number, deskTop: number, screen: 'off' | 'sheet') {
  const y = deskTop - 11;
  p.rect(x, y, 10, 8, 'ink');
  if (screen === 'off') {
    p.rect(x + 1, y + 1, 8, 6, 'night');
    px(p, x + 2, y + 2, 'stone');
    px(p, x + 3, y + 2, 'stone');
    px(p, x + 2, y + 3, 'stone');
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

/** One of the company's glass desk lamps, 7 wide; lit, it throws warm light around it. */
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

/** An office chair seen from the side, facing left, pulled out from its desk: 12 wide. */
function paintChair(p: Painter, x: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x, foot, 12, 1, 'night');
  p.rect(x + 1, foot - 2, 9, 1, 'ink');
  px(p, x + 1, foot - 1, 'ink');
  px(p, x + 5, foot - 1, 'ink');
  px(p, x + 9, foot - 1, 'ink');
  p.rect(x + 5, foot - 6, 1, 4, 'concrete');
  p.rect(x, foot - 8, 10, 2, 'maroon');
  p.rect(x, foot - 7, 10, 1, 'plum');
  p.rect(x + 9, foot - 17, 2, 10, 'maroon');
  p.rect(x + 10, foot - 16, 1, 9, 'plum');
  px(p, x + 9, foot - 17, 'red');
  p.rect(x + 4, foot - 11, 5, 1, 'ink');
  px(p, x + 4, foot - 10, 'ink');
  px(p, x + 4, foot - 9, 'ink');
}

/**
 * An office chair pushed right in under a desk, seen from behind, 9 wide: its
 * padded back just shows over the desktop, the post and the star base below.
 */
function paintTuckedChair(p: Painter, x: number, deskTop: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x - 1, foot, 11, 1, 'night');
  p.rect(x, foot - 2, 9, 1, 'ink');
  px(p, x, foot - 1, 'ink');
  px(p, x + 4, foot - 1, 'ink');
  px(p, x + 8, foot - 1, 'ink');
  p.rect(x + 4, deskTop + 8, 1, foot - 2 - deskTop - 8, 'concrete');
  // the seat's edge, then the back from behind, rounded at the top
  p.rect(x, deskTop + 7, 9, 1, 'plum');
  p.rect(x + 1, deskTop - 3, 7, 1, 'maroon');
  p.rect(x, deskTop - 2, 9, 9, 'maroon');
  p.rect(x + 1, deskTop - 2, 7, 1, 'red');
  p.rect(x + 8, deskTop - 2, 1, 9, 'plum');
  p.rect(x + 2, deskTop + 1, 5, 1, 'plum');
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
  p.rect(x + 26, deskTop - 1, 5, 1, 'concrete');
  p.rect(x + 28, deskTop - 10, 3, 3, kit.lit ? 'honey' : 'fog');
  paintChair(p, x + 19, floorTop);
}

/**
 * Your desk, three months on: the spreadsheet open, your teal Lantern lamp
 * lit, a mug, notes stuck on the partition, the chair pulled out.
 */
function paintMyDesk(p: Painter, x: number, deskTop: number, floorTop: number): void {
  paintDrawers(p, x + 35, deskTop, floorTop);
  paintMonitor(p, x + 9, deskTop, 'sheet');
  p.rect(x + 20, deskTop - 1, 6, 1, 'concrete');
  paintDeskLamp(p, x + 27, deskTop, 'teal', true);
  // the mug
  p.rect(x + 4, deskTop - 4, 3, 4, 'red');
  px(p, x + 7, deskTop - 3, 'red');
  px(p, x + 4, deskTop - 4, 'paper');
  // notes on the partition
  p.rect(x + 21, deskTop - 11, 3, 3, 'honey');
  p.rect(x + 2, deskTop - 11, 3, 3, 'rosy');
  paintChair(p, x + 13, floorTop);
}

/**
 * The empty desk next to yours: nothing on its top but a bare monitor,
 * switched off; the chair pushed in; a drawer unit; the partition behind it
 * clear of notes.
 */
function paintVacantDesk(p: Painter, x: number, deskTop: number, floorTop: number): void {
  paintDrawers(p, x + 2, deskTop, floorTop);
  paintMonitor(p, x + 34, deskTop, 'off');
  // the cable hangs down the back, not yet plugged in
  p.rect(x + 38, deskTop + 5, 1, 4, 'ink');
  px(p, x + 38, deskTop + 9, 'stone');
  paintTuckedChair(p, x + 18, deskTop, floorTop);
}

/**
 * Ms. Reed's applications on a low two-drawer cabinet, 24 wide: a tall stack
 * of buff folders with sheets sticking out, a wire tray of coloured folders,
 * a box file marked with a person.
 */
function paintApplications(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 15;
  const foot = floorTop + 3;
  p.rect(x, foot, 25, 1, 'night');
  p.rect(x, top, 24, foot - top, 'concrete');
  p.rect(x, top, 24, 1, 'fog');
  p.rect(x + 23, top, 1, foot - top, 'stone');
  for (const dy of [top + 2, top + 10]) {
    p.rect(x + 1, dy + 6, 22, 1, 'stone');
    p.rect(x + 9, dy + 2, 6, 1, 'night');
    p.rect(x + 10, dy + 3, 4, 1, 'paper');
  }
  // the stack of folders
  const folders: readonly PaletteName[] = ['tan', 'skin', 'tan', 'skin', 'tan', 'skin'];
  folders.forEach((c, i) => {
    const fy = top - 2 - i * 2;
    const shift = Math.floor(hash2(i, 4, 71) * 3) - 1;
    p.rect(x + 2 + shift, fy, 11, 2, c);
    px(p, x + 2 + shift, fy + 1, 'ember');
    if (i % 2 === 0) p.rect(x + 4 + shift, fy, 5, 1, 'paper');
  });
  p.rect(x + 9, top - 9, 4, 1, 'paper');
  // the wire tray of coloured folders
  p.rect(x + 14, top - 6, 9, 1, 'stone');
  p.rect(x + 14, top - 1, 9, 1, 'stone');
  p.rect(x + 14, top - 6, 1, 6, 'stone');
  p.rect(x + 22, top - 6, 1, 6, 'stone');
  p.rect(x + 15, top - 5, 7, 1, 'red');
  p.rect(x + 15, top - 4, 7, 1, 'teal');
  p.rect(x + 15, top - 3, 7, 1, 'lamp');
  p.rect(x + 15, top - 2, 7, 1, 'denim');
  p.rect(x + 16, top - 7, 4, 1, 'paper');
}

// ---------------------------------------------------------------------------
// Beside the office core

/** Under a window to the left: a low cupboard with the printer on it, and the water cooler. */
function paintPrinterBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const cx = x + 5;
  const top = oy + 41;
  p.rect(cx, top, 20, floorTop + 1 - top, 'concrete');
  p.rect(cx, top, 20, 1, 'fog');
  p.rect(cx + 19, top, 1, floorTop + 1 - top, 'stone');
  p.rect(cx + 9, top + 2, 1, floorTop - top - 2, 'stone');
  p.rect(cx + 6, top - 9, 7, 3, 'paper');
  p.rect(cx + 3, top - 6, 13, 6, 'slate');
  p.rect(cx + 3, top - 6, 13, 1, 'stone');
  p.rect(cx + 5, top - 3, 9, 1, 'ink');
  p.rect(cx + 6, top - 2, 7, 2, 'paper');
  px(p, cx + 14, top - 4, 'leaf');
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

/** Two tall filing cabinets, a box and a plant on top. */
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
// The interview room (t5)

/** Wall above the core needed for the prints, the picture rail and the panels of the interview room. */
const ROOM_CEILING_MIN = 40;

/** Paints the small interview room to fill a w x h stage (at least the core). */
function paintInterviewRoom(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const tableTop = oy + TABLE.top;
  const winTop = oy + 6 - Math.min(18, Math.max(0, oy - 20));
  const winH = oy + 32 - winTop;

  // The wall, warm around the lamp over the table and the lamp on the sideboard.
  p.rect(0, 0, w, floorTop, 'concrete');
  glowEllipse(p, ox + 64, oy + 14, 46, 30, 'honey', [0.2, 0.12, 0.06]);
  glowEllipse(p, ox + 114, oy + 36, 20, 14, 'honey', [0.22, 0.12]);
  const ceiling = oy >= ROOM_CEILING_MIN ? paintRoomUpper(p, w, ox, oy) : 0;
  if (ceiling === 0) ditherRect(p, 0, 0, w, 2, 'stone', 8);

  // Lower wall: dark green panels under a pale rail.
  const rail = oy + ROOM_RAIL;
  p.rect(0, rail, w, floorTop - rail, 'moss');
  p.rect(0, rail, w, 1, 'paper');
  p.rect(0, rail + 1, w, 1, 'fog');
  for (let x = mod(ox + 7, 16) - 16; x < w; x += 16) {
    p.rect(x, rail + 3, 12, floorTop - rail - 6, 'teal');
    p.rect(x + 1, rail + 4, 10, floorTop - rail - 8, 'moss');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
  paintRoomFloor(p, w, ox, floorTop, h);

  // Beside the core: a glass wall onto the open office on the left, shelves and plants on the right.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    paintGlassWall(p, x, oy, floorTop, i);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintBookcase(p, x + 6, oy, floorTop, i);
    else paintPlantCorner(p, x, oy, floorTop);
  }

  // The core: the door, the window and the clock, the sideboard with its lamp and the poster.
  paintDoor(p, ox + 1, oy, floorTop);
  paintWindow(p, ox + 40, winTop, 46, winH, ox, 2);
  if (oy >= CLOCK_MIN) paintClock(p, ox + 96, oy - 8);
  else paintClock(p, ox + 96, oy + 10);
  paintFramedLamp(p, ox + 104, oy + 4);
  paintSideboard(p, ox + 100, oy, floorTop);
  paintPendant(p, ox + 64, ceiling, oy);

  // The table and its three chairs: the panel's two behind it, the applicant's at the far end.
  paintPanelChair(p, ox + 40, tableTop);
  paintPanelChair(p, ox + 54, tableTop);
  paintTable(p, ox + TABLE.x, tableTop, floorTop);
  paintApplicantChair(p, ox + 86, tableTop, floorTop);
  paintResume(p, ox + 47, tableTop);
  paintWaterGlass(p, ox + 83, tableTop);
}

/**
 * The wall above the core on a tall stage: two framed prints over the
 * window, then a picture rail, and above it, up to the ceiling, the soft
 * sound-absorbing panels of a quiet room with downlights along its foot.
 * Returns the y of the picture rail (where the pendant lamp hangs from).
 */
function paintRoomUpper(p: Painter, w: number, ox: number, oy: number): number {
  const rail = oy - ROOM_CEILING_MIN + 4;
  paintPictureFrame(p, ox + 14, oy - 30);
  paintPictureFrame(p, ox + 92, oy - 30);
  // the panels, counted from the core so they never shift
  p.rect(0, 0, w, rail, 'stone');
  const panelW = 30;
  const panelH = 20;
  for (let row = 0; rail - (row + 1) * (panelH + 1) > -panelH; row++) {
    const y = rail - (row + 1) * (panelH + 1);
    const shift = (row % 2) * (panelW / 2);
    for (let x = mod(ox + shift, panelW + 1) - (panelW + 1); x < w; x += panelW + 1) {
      p.rect(x, y, panelW, 1, 'concrete');
      p.rect(x + panelW, y, 1, panelH + 1, 'slate');
      p.rect(x, y + panelH, panelW, 1, 'slate');
    }
  }
  p.rect(0, rail, w, 1, 'paper');
  p.rect(0, rail + 1, w, 1, 'fog');
  p.rect(0, rail + 2, w, 1, 'stone');
  for (let x = mod(ox + 32, 64) - 64; x < w + 64; x += 64) {
    p.rect(x - 2, rail + 3, 5, 1, 'paper');
    glowEllipse(p, x, rail + 8, 10, 6, 'honey', [0.14, 0.07]);
  }
  return rail;
}

/** A framed print of a lamp sketch, 16 x 14: a shade, a stem and a foot on pale paper. */
function paintPictureFrame(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 14, 16, 1, 'stone');
  p.rect(x, y, 16, 14, 'ink');
  p.rect(x + 1, y + 1, 14, 12, 'paper');
  p.rect(x + 6, y + 3, 4, 1, 'amber');
  p.rect(x + 5, y + 4, 6, 1, 'amber');
  p.rect(x + 4, y + 5, 8, 1, 'ember');
  p.rect(x + 7, y + 6, 1, 4, 'stone');
  p.rect(x + 5, y + 10, 6, 1, 'stone');
}

/** The interview room's floor: a dark wooden floor with a warm rug under the table. */
function paintRoomFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'night');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = mod(ox + row * 11, 16) - 16; x < w; x += 16) p.rect(x, y, 9, 1, 'slate');
  }
  // the rug, seen flat
  const rx = ox + 26;
  const rw = 80;
  p.rect(rx, floorTop + 2, rw, 6, 'maroon');
  p.rect(rx, floorTop + 2, rw, 1, 'red');
  p.rect(rx + 2, floorTop + 4, rw - 4, 1, 'plum');
  p.rect(rx, floorTop + 7, rw, 1, 'plum');
}

/** The door of the room, 15 wide: a frosted pane lit by the office beyond, a brass handle. */
function paintDoor(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 14;
  p.rect(x, top, 15, floorTop - top, 'ember');
  p.rect(x, top, 15, 1, 'amber');
  p.rect(x + 1, top + 1, 13, floorTop - top - 1, 'amber');
  p.rect(x + 3, top + 3, 9, 16, 'fog');
  ditherRect(p, x + 3, top + 3, 9, 16, 'paper', 3);
  p.rect(x + 3, top + 3, 9, 1, 'honey');
  p.rect(x + 7, top + 3, 1, 16, 'concrete');
  p.rect(x + 3, top + 22, 9, floorTop - top - 25, 'ember');
  p.rect(x + 12, top + 21, 2, 1, 'honey');
}

/** The open office seen through the glass wall left of the room: dim desks, lamps and mullions. */
function paintGlassWall(p: Painter, x: number, oy: number, floorTop: number, n: number): void {
  const top = oy + 4;
  const gh = floorTop - 6 - top;
  p.rect(x, top - 1, BAY_W, gh + 2, 'fog');
  const q = within(p, x + 2, top, BAY_W - 4, gh);
  ditherGradient(q, x + 2, top, BAY_W - 4, gh, ['slate', 'stone', 'stone']);
  // a far desk with its lamp lit and a monitor
  const deskY = top + gh - 12;
  glowEllipse(q, x + 30, deskY - 4, 10, 7, 'honey', [0.3, 0.16]);
  q.rect(x + 6, deskY, 34, 2, 'ember');
  q.rect(x + 8, deskY + 2, 1, 10, 'plum');
  q.rect(x + 37, deskY + 2, 1, 10, 'plum');
  q.rect(x + 12, deskY - 7, 9, 6, 'night');
  q.rect(x + 13, deskY - 6, 7, 4, n % 2 === 0 ? 'sky' : 'denim');
  q.rect(x + 28, deskY - 5, 5, 2, n % 3 === 0 ? 'rosy' : 'lamp');
  q.rect(x + 30, deskY - 3, 1, 3, 'amber');
  // the partition behind it
  q.rect(x + 2, deskY - 12, BAY_W - 4, 1, 'sky');
  // a frosted band at eye height
  ditherRect(p, x + 2, top + 10, BAY_W - 4, 4, 'fog', 6);
  p.rect(x + BAY_W / 2, top, 1, gh, 'fog');
  p.rect(x, top + gh + 1, BAY_W, 1, 'concrete');
}

/** A low bookcase with binders and a plant on it. */
function paintBookcase(p: Painter, x: number, oy: number, floorTop: number, n: number): void {
  const top = oy + 30;
  p.rect(x, top, 32, floorTop + 1 - top, 'ember');
  p.rect(x, top, 32, 1, 'amber');
  for (const sy of [top + 10, top + 20]) p.rect(x + 1, sy, 30, 1, 'amber');
  const colours: readonly PaletteName[] = ['denim', 'red', 'teal', 'lamp', 'paper', 'leaf'];
  for (const sy of [top + 10, top + 20]) {
    for (let i = 0; i < 7; i++) {
      if (hash2(i, sy, n + 41) < 0.25) continue;
      const c = colours[Math.floor(hash2(i, sy, n + 43) * colours.length)] ?? 'denim';
      p.rect(x + 2 + i * 4, sy - 8, 3, 8, c);
    }
  }
  paintPlant(p, x + 20, top - 20);
  p.rect(x + 3, top - 4, 9, 4, 'paper');
  p.rect(x + 3, top - 4, 9, 1, 'fog');
}

/** A tall plant by the wall with a framed print over it. */
function paintPlantCorner(p: Painter, x: number, oy: number, floorTop: number): void {
  paintPictureFrame(p, x + 14, oy + 8);
  paintPlant(p, x + 17, floorTop - 18);
}

/** The Lantern lamp poster in a thin frame, 14 x 16, above the sideboard. */
function paintFramedLamp(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 16, 14, 1, 'stone');
  p.rect(x, y, 14, 16, 'ink');
  p.rect(x + 1, y + 1, 12, 14, 'deep');
  p.rect(x + 4, y + 3, 6, 3, 'teal');
  px(p, x + 5, y + 3, 'cyan');
  p.rect(x + 5, y + 6, 4, 1, 'honey');
  p.rect(x + 7, y + 7, 1, 5, 'amber');
  p.rect(x + 5, y + 12, 5, 1, 'amber');
}

/** The sideboard at the right of the room: a lit Lantern lamp and a water jug on it. */
function paintSideboard(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 40;
  const foot = floorTop + 3;
  p.rect(x, foot, 27, 1, 'night');
  p.rect(x, top, 26, foot - top, 'ember');
  p.rect(x, top, 26, 1, 'honey');
  p.rect(x, top + 1, 26, 1, 'amber');
  p.rect(x + 13, top + 3, 1, foot - top - 4, 'plum');
  px(p, x + 11, top + 8, 'honey');
  px(p, x + 15, top + 8, 'honey');
  // the water jug and two glasses on a tray
  p.rect(x + 2, top - 1, 10, 1, 'stone');
  p.rect(x + 3, top - 7, 4, 6, 'sky');
  p.rect(x + 3, top - 7, 4, 1, 'paper');
  px(p, x + 7, top - 6, 'sky');
  p.rect(x + 4, top - 4, 2, 3, 'cyan');
  p.rect(x + 8, top - 4, 2, 3, 'sky');
  p.rect(x + 8, top - 4, 2, 1, 'paper');
  // the lamp, lit
  paintDeskLamp(p, x + 17, top, 'lamp', true);
}

/** The interview table, TABLE.w wide: a pale top seen a little from above, legs at both ends. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  const foot = floorTop + 5;
  p.rect(x + 1, foot, w - 1, 1, 'night');
  for (const lx of [x + 2, x + w - 4]) {
    p.rect(lx, top + 3, 2, foot - top - 3, 'ember');
    p.rect(lx + 1, top + 3, 1, foot - top - 3, 'plum');
  }
  // the top: a strip of surface, the front edge, the apron
  p.rect(x + 1, top - 2, w - 2, 2, 'amber');
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 2, 'ember');
  p.rect(x + 1, top + 4, w - 2, 1, 'plum');
}

/** A chair behind the table, facing right (the panel's side): only its back shows over the top. */
function paintPanelChair(p: Painter, x: number, tableTop: number): void {
  p.rect(x, tableTop - 10, 3, 10, 'maroon');
  p.rect(x, tableTop - 10, 3, 1, 'red');
  p.rect(x + 2, tableTop - 9, 1, 9, 'plum');
  p.rect(x + 3, tableTop - 3, 6, 1, 'maroon');
  p.rect(x + 3, tableTop - 2, 6, 1, 'plum');
}

/** The applicant's chair at the far end of the table, facing left towards the panel. */
function paintApplicantChair(p: Painter, x: number, tableTop: number, floorTop: number): void {
  const foot = floorTop + 6;
  p.rect(x, foot, 10, 1, 'night');
  // four legs, a seat and a back on the right
  p.rect(x + 1, tableTop + 4, 1, foot - tableTop - 4, 'ink');
  p.rect(x + 7, tableTop + 4, 1, foot - tableTop - 4, 'ink');
  p.rect(x, tableTop + 2, 9, 2, 'maroon');
  p.rect(x, tableTop + 3, 9, 1, 'plum');
  p.rect(x + 7, tableTop - 8, 2, 10, 'maroon');
  px(p, x + 7, tableTop - 8, 'red');
  p.rect(x + 8, tableTop - 7, 1, 9, 'plum');
}

/** The résumé lying on the table: a sheet with a photo corner and lines, a pen beside it. */
function paintResume(p: Painter, x: number, tableTop: number): void {
  p.rect(x, tableTop - 2, 9, 2, 'paper');
  px(p, x + 1, tableTop - 2, 'sky');
  p.rect(x + 3, tableTop - 2, 5, 1, 'stone');
  p.rect(x + 3, tableTop - 1, 4, 1, 'fog');
  p.rect(x + 10, tableTop - 1, 4, 1, 'denim');
}

/** A glass of water standing on the table. */
function paintWaterGlass(p: Painter, x: number, tableTop: number): void {
  p.rect(x, tableTop - 5, 3, 5, 'sky');
  p.rect(x, tableTop - 3, 3, 3, 'cyan');
  px(p, x, tableTop - 5, 'paper');
  p.rect(x, tableTop, 3, 1, 'amber');
}

export const RECRUITING_STAGE: StageConfig = {
  paint,
  backdrops: { new_hire: paintInterviewRoom },
  cast: {
    guide: GUIDE_ACTOR,
    // Ms. Reed stands in front of the cabinet with her folders, the empty desk to her left.
    hr: { sprite: HR_SPRITE, ...REED, side: 'right' },
    manager: { sprite: MANAGER_SPRITE, ...REED, side: 'right', beside: CARTER_BESIDE },
    new_hire: { sprite: NEW_HIRE_SPRITE, ...REED, side: 'right', beside: LEO_BESIDE },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 76, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 97, y: 24 } },
  rest: {
    left: { x: 36, y: PROP_TOP },
    right: { x: 44, y: PROP_TOP },
  },
};
