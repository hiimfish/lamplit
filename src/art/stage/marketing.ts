import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { AGENCY_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The marketing stage: the meeting table in the Harbor Trading office on a
 * February evening, in the middle of planning the Lantern launch. From the
 * left: poster mock-ups of the new desk lamp leaning on the wall, a long
 * whiteboard covered in sticky notes with a calendar grid of the weeks up to
 * the May launch, and a window onto the harbour at dusk. A light bar hangs low
 * over the wooden table, where survey printouts, coloured markers and a
 * laptop showing the lamp lie between you and Nina Ortiz (Ms. Carter stands
 * a step behind her, under the window, when both are there). Handed-over
 * things rest on the tabletop. Painted through the Painter interface, palette
 * colours only, whole pixels.
 *
 * It fills any size: the 128x64 core sits centred near the bottom; extra wall
 * goes above (a shelf of Lantern samples, the clock, a mood board and the air
 * vent, then a darker band with high windows under the ceiling) and the room
 * runs on to both sides in bays (more posters, windows, a bookcase of
 * catalogues and a cabinet with a plant).
 */

/** The table's left edge and width, and the y of the far edge of its top, in core pixels. */
const TABLE = { x: 37, w: 43, top: 49 } as const;
const TABLE_DEPTH = 6;
/** 24x24 pictures stand on the far half of the top. */
const TABLE_FAR = 3;
const PROP_TOP = TABLE.top + TABLE_FAR - 24;

const FLOOR_TOP = 56;
/** The rail between the upper wall and the wooden lower wall. */
const RAIL_Y = 44;
/** The whiteboard in the core: its outer frame. */
const BOARD = { x: 38, y: 7, w: 55, h: 27 } as const;
/** The window in the core: its outer frame. */
const WINDOW = { x: 98, y: 5, w: 27, h: 28 } as const;
/** The light bar over the table: its left end and width, and the y of the bar. */
const BAR = { x: 42, w: 34, y: 2 } as const;
/** Nina stands across the table from you; Ms. Carter a step behind her. */
const ACROSS = { x: 79, y: 39 } as const;
const BEHIND = { x: 96, y: 39 } as const;

/** Width of one bay beside the core, and what the bays hold in turn going outwards. */
const BAY_W = 40;
type Bay = 'posters' | 'window' | 'bookcase' | 'cabinet';
const LEFT_BAYS: readonly Bay[] = ['window', 'bookcase', 'posters', 'window'];
const RIGHT_BAYS: readonly Bay[] = ['cabinet', 'window', 'posters', 'bookcase'];

/** Wall above the core needed for the sample shelf, the clock, and the mood board with the vent. */
const SHELF_MIN = 20;
const CLOCK_MIN = 26;
const MOOD_MIN = 50;
/** Wall above the core needed for the upper band, and how far above the core it starts. */
const CORNICE_MIN = 70;
const CORNICE_UP = 58;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 24;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 80;

/** The lamp mock-ups' colourways: background, and the lantern shade. */
const POSTER_WAYS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['deep', 'red'],
  ['teal', 'lamp'],
  ['maroon', 'honey'],
  ['indigo', 'amber'],
];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a pane of glass). */
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

/** Paints the planning meeting to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The bays on both sides of the core.
  const bays: [number, Bay][] = [];
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, LEFT_BAYS[i % LEFT_BAYS.length] ?? 'window']);
  }

  // The wall: a warm grey, lit from the light bar and the lamps in the bays.
  p.rect(0, 0, w, floorTop, 'concrete');
  glowEllipse(p, ox + BAR.x + BAR.w / 2, oy + 14, 52, 22, 'honey', [0.2, 0.12, 0.06]);
  for (const [x, kind] of bays) {
    if (kind !== 'window') glowEllipse(p, x + BAY_W / 2, oy + 12, 22, 18, 'honey', [0.14, 0.07]);
  }
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'stone', 8);

  // Up the wall, when there is room above the core.
  if (oy >= MOOD_MIN) {
    paintMoodBoard(p, ox + 30, oy - 44);
    paintVent(p, ox + 74, oy - 40);
  }
  if (oy >= CLOCK_MIN) paintClock(p, ox + 111, oy - 12);
  if (oy >= SHELF_MIN) paintSampleShelf(p, ox + 40, oy - 10);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') paintWindow(p, x + 7, winTop, WINDOW.w, winH, ox);
    else if (kind === 'posters') paintPosterStack(p, x + 6, floorTop, mod(x - ox, 7));
    else if (kind === 'bookcase') paintBookcase(p, x + 6, oy, floorTop);
    else paintCabinet(p, x + 4, oy, floorTop);
  }

  // The core: posters by the door, the whiteboard, the harbour window.
  paintPosterStack(p, ox + 1, floorTop, 0);
  paintWhiteboard(p, ox + BOARD.x, oy + BOARD.y);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintLightBar(p, ox + BAR.x, cornice, oy + BAR.y);
  paintPoster(p, ox + 113, floorTop - 19, 14, 19, 3);

  // The table and what is spread on it.
  paintTable(p, ox + TABLE.x, oy + TABLE.top, floorTop);
  paintSurveys(p, ox + TABLE.x + 3, oy + TABLE.top + 1);
  paintMarkers(p, ox + TABLE.x + 15, oy + TABLE.top + 2);
  paintLaptop(p, ox + TABLE.x + 28, oy + TABLE.top + 1);
}

// ---------------------------------------------------------------------------
// Room

/** The wooden lower wall under a pale rail, with a skirting board. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top + 2, w, floorTop - top - 2, 'ember');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'amber');
  for (let x = mod(ox + 3, 9) - 9; x < w; x += 9) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'plum');
  }
  p.rect(0, floorTop - 2, w, 2, 'plum');
}

/** Wooden floorboards, counted from the core so they never shift. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'night');
    for (let x = mod(ox + row * 13, 22) - 22; x < w; x += 22) px(p, x, y - 1, 'night');
    for (let x = mod(ox + row * 7, 31) - 31; x < w; x += 31) p.rect(x + 5, y - 2, 6, 1, 'stone');
  }
}

/**
 * The wall above `cornice` on a tall stage: a darker band under the ceiling
 * with a row of high windows onto the night sky.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'stone');
  ditherRect(p, 0, 0, w, 3, 'slate', 8);
  const wh = Math.min(56, cornice - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((cornice - wh) / 2));
    const first = Math.floor(-(ox + 64) / HIGH_GAP) - 1;
    for (let k = first; ox + 64 + k * HIGH_GAP - 18 < w; k++) {
      paintHighWindow(p, ox + 64 + k * HIGH_GAP, top, wh, k);
    }
  }
  p.rect(0, cornice, w, 1, 'fog');
  p.rect(0, cornice + 1, w, 1, 'paper');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

/** One high window centred on `cx`: the night sky with a few stars. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 18, top - 1, 37, wh + 2, 'paper');
  ditherGradient(p, cx - 17, top, 35, wh, ['deep', 'deep', 'indigo', 'dusk']);
  for (let i = 0; i < 6; i++) {
    const sx = cx - 16 + Math.floor(hash2(i, n, 311) * 33);
    const sy = top + 1 + Math.floor(hash2(i, n, 313) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 317) > 0.7 ? 'paper' : 'fog');
  }
  p.rect(cx, top, 1, wh, 'paper');
  p.rect(cx - 18, top + wh + 1, 37, 1, 'concrete');
}

/**
 * The long light bar hanging low over the table on two cables from the
 * ceiling (`from`): a dark housing from (x, y) with a warm strip under it.
 */
function paintLightBar(p: Painter, x: number, from: number, y: number): void {
  const { w } = BAR;
  for (const cx of [x + 4, x + w - 5]) p.rect(cx, from, 1, y - from, 'ink');
  p.rect(x, y, w, 2, 'ink');
  p.rect(x + 1, y, w - 2, 1, 'slate');
  p.rect(x + 1, y + 2, w - 2, 1, 'honey');
  p.rect(x + 3, y + 2, w - 6, 1, 'paper');
  glowEllipse(p, x + w / 2, y + 4, w / 2 + 4, 4, 'honey', [0.32, 0.16]);
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; windows side by side show one view. */
const HARBOUR_P = 160;

/** The harbour at dusk through a window's glass from (x, y), w x h. */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 8;
  ditherGradient(p, x, y, w, horizon - y, ['deep', 'indigo', 'violet', 'mauve', 'rosy']);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hash2(hx, 3, 331) < 0.05) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 337) * Math.max(3, horizon - y - 12)), 'fog');
    }
    const bump = Math.round(1.5 + Math.sin(hx / 7) + Math.sin(hx / 3.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 347) < 0.14) px(p, x + i, horizon, hash2(hx, 6, 349) < 0.5 ? 'honey' : 'lamp');
    if (hx % 5 === 0 && hash2(hx, 1, 353) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 359) * 4);
      p.rect(x + i, gy, 2, 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // a crane on the quay and a moored ship, once per period
  const first = Math.floor((x - ox - 40) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 40; k++) {
    const base = ox + k * HARBOUR_P;
    paintCrane(p, base + 118, horizon);
    paintShip(p, base + 100, horizon + 4);
    paintCrane(p, base + 40, horizon);
  }
}

/** A container crane: two legs, a boom to the left, a red light on top. */
function paintCrane(p: Painter, x: number, horizon: number): void {
  const boom = horizon - 8;
  p.rect(x, boom, 1, 8, 'ink');
  p.rect(x + 4, boom, 1, 8, 'ink');
  p.rect(x, boom + 3, 5, 1, 'ink');
  p.rect(x - 10, boom, 17, 1, 'ink');
  p.rect(x + 2, boom - 4, 1, 4, 'ink');
  for (let i = 1; i < 11; i++) px(p, x + 2 - i, boom - 4 + Math.floor((i * 4) / 11), 'ink');
  px(p, x + 2, boom - 5, 'red');
}

/** A moored ship with containers on deck, its bridge at the stern. */
function paintShip(p: Painter, x: number, waterline: number): void {
  const len = 20;
  p.rect(x + 1, waterline - 3, len - 1, 3, 'ink');
  p.rect(x, waterline - 4, len, 1, 'night');
  const colours: readonly PaletteName[] = ['ember', 'teal', 'denim'];
  for (let c = 0; c < 3; c++) p.rect(x + 3 + c * 4, waterline - 6, 3, 2, colours[c] ?? 'teal');
  p.rect(x + len - 5, waterline - 8, 4, 4, 'night');
  px(p, x + len - 4, waterline - 6, 'honey');
  px(p, x + len - 4, waterline + 1, 'lamp');
}

/** A window with a white frame and sill: the harbour behind the glass. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  p.rect(x + 2, y + 2, w - 4, 1, 'fog');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The planning wall

/**
 * The whiteboard from (x, y): columns of sticky notes on the left, a quiet
 * middle with one circled idea, and the calendar grid of the weeks to the
 * launch on the right, the launch day ringed in red.
 */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  const { w, h } = BOARD;
  p.rect(x + 1, y + h, w - 1, 1, 'stone');
  p.rect(x, y, w, h, 'fog');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + w - 2, y + 1, 1, h - 2, 'fog');

  // three columns of sticky notes under short headings
  const notes: readonly PaletteName[] = ['honey', 'rosy', 'cyan', 'leaf', 'lamp'];
  for (let c = 0; c < 3; c++) {
    const cx = x + 3 + c * 7;
    p.rect(cx, y + 3, 5, 1, 'denim');
    const count = 3 - (c === 2 ? 1 : 0);
    for (let r = 0; r < count; r++) {
      const ny = y + 6 + r * 6 + (hash2(c, r, 401) < 0.4 ? 1 : 0);
      const colour = notes[Math.floor(hash2(c, r, 409) * notes.length)] ?? 'honey';
      p.rect(cx, ny, 5, 5, colour);
      p.rect(cx, ny + 4, 5, 1, colour === 'cyan' ? 'teal' : colour === 'leaf' ? 'moss' : 'amber');
      p.rect(cx + 1, ny + 1, 3, 1, 'stone');
      if (hash2(c, r, 419) < 0.6) p.rect(cx + 1, ny + 3, 2, 1, 'stone');
    }
  }
  // an arrow from the notes to the calendar
  p.rect(x + 24, y + 13, 5, 1, 'red');
  px(p, x + 28, y + 12, 'red');
  px(p, x + 28, y + 14, 'red');

  // the calendar grid: a heading, then four rows of five weekdays
  const gx = x + 31;
  const gy = y + 3;
  p.rect(gx, gy, 21, 2, 'teal');
  p.rect(gx + 1, gy, 6, 1, 'cyan');
  for (let r = 0; r <= 4; r++) p.rect(gx, gy + 3 + r * 5, 21, 1, 'concrete');
  for (let c = 0; c <= 5; c++) p.rect(gx + c * 4, gy + 3, 1, 20, 'concrete');
  // the campaign weeks marked in colour, and the launch day ringed
  p.rect(gx + 5, gy + 9, 11, 2, 'leaf');
  p.rect(gx + 1, gy + 14, 15, 2, 'amber');
  p.rect(gx + 12, gy + 19, 3, 2, 'red');
  p.rect(gx + 11, gy + 18, 5, 1, 'red');
  p.rect(gx + 11, gy + 22, 5, 1, 'red');
  p.rect(gx + 10, gy + 19, 1, 3, 'red');
  p.rect(gx + 16, gy + 19, 1, 3, 'red');
  // a sticky note slapped on the grid's corner
  p.rect(gx + 17, gy + 18, 5, 5, 'honey');
  p.rect(gx + 17, gy + 22, 5, 1, 'amber');

  // the tray, with an eraser and a cap
  p.rect(x + 2, y + h, w - 4, 1, 'concrete');
  p.rect(x + 6, y + h - 1, 4, 1, 'ink');
  px(p, x + 13, y + h - 1, 'red');
}

/** The Lantern desk lamp, lit, standing on (cx, foot): a lantern-round shade, a stem and a foot. */
function paintLantern(p: Painter, cx: number, foot: number, shade: PaletteName, glow: boolean) {
  if (glow) glowEllipse(p, cx, foot - 6, 5, 4, 'honey', [0.36, 0.18]);
  p.rect(cx - 1, foot - 9, 3, 1, shade);
  p.rect(cx - 2, foot - 8, 5, 3, shade);
  p.rect(cx - 1, foot - 5, 3, 1, shade);
  px(p, cx - 1, foot - 8, 'paper');
  p.rect(cx - 2, foot - 6, 5, 1, 'honey');
  px(p, cx, foot - 4, 'ink');
  p.rect(cx, foot - 3, 1, 2, 'ink');
  p.rect(cx - 2, foot - 1, 5, 1, 'ink');
}

/**
 * A poster mock-up of the lamp from (x, y), w x h: a frame, a coloured
 * ground, the lamp glowing in the middle and a band of colour at the foot
 * (no text). `way` picks the colourway.
 */
function paintPoster(p: Painter, x: number, y: number, w: number, h: number, way: number) {
  const [ground, shade] = POSTER_WAYS[mod(way, POSTER_WAYS.length)] ?? ['deep', 'red'];
  // its shadow on the wall where the top leans
  p.rect(x + w, y + 2, 1, h - 2, 'stone');
  p.rect(x, y, w, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, ground);
  ditherRect(p, x + 1, y + 1, w - 2, 4, 'night', 6);
  paintLantern(p, x + Math.floor(w / 2), y + h - 6, shade, true);
  p.rect(x + 2, y + h - 4, w - 4, 1, shade);
  p.rect(x + 1, y + h - 2, w - 2, 1, 'paper');
}

/** Two or three poster mock-ups leaning on the wall, standing on the floor at `floorTop`. */
function paintPosterStack(p: Painter, x: number, floorTop: number, n: number): void {
  paintPoster(p, x, floorTop - 21, 15, 21, n);
  paintPoster(p, x + 6, floorTop - 17, 13, 17, n + 1);
  if (n % 2 === 1) paintPoster(p, x + 16, floorTop - 14, 11, 14, n + 2);
  p.rect(x, floorTop, 28, 1, 'night');
}

// ---------------------------------------------------------------------------
// The table

/** The meeting table: a long wooden top seen a little from above, on two legs. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  const edge = top + TABLE_DEPTH;
  p.rect(x + 2, edge + 1, w - 4, floorTop - edge - 1, 'night');
  ditherRect(p, x + 2, floorTop + 1, w - 4, 5, 'night', 8);
  p.rect(x + 1, floorTop + 6, w - 1, 1, 'night');
  for (const lx of [x + 1, x + w - 3]) {
    p.rect(lx, edge + 1, 2, floorTop + 6 - edge - 1, 'ember');
    p.rect(lx + 1, edge + 1, 1, floorTop + 6 - edge - 1, 'plum');
  }
  p.rect(x, top, w, TABLE_DEPTH, 'amber');
  p.rect(x + 1, top, w - 2, 1, 'honey');
  p.rect(x, edge, w, 1, 'ember');
  p.rect(x + 1, edge + 1, w - 2, 1, 'plum');
  // the light bar's glow along the wood
  p.rect(x + 6, top + 3, 8, 1, 'honey');
  p.rect(x + 20, top + 4, 3, 1, 'honey');
}

/** The printed survey sheets: a loose stack and one fanned out, lines of answers and tick boxes. */
function paintSurveys(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 3, 9, 1, 'ember');
  p.rect(x, y, 9, 3, 'paper');
  p.rect(x, y + 2, 9, 1, 'fog');
  p.rect(x + 4, y + 1, 8, 3, 'paper');
  p.rect(x + 5, y + 2, 4, 1, 'stone');
  px(p, x + 10, y + 2, 'leaf');
  px(p, x + 1, y + 1, 'denim');
  p.rect(x + 2, y + 1, 2, 1, 'concrete');
}

/** A cup of coloured markers lying out: four caps in a row and one marker uncapped. */
function paintMarkers(p: Painter, x: number, y: number): void {
  const caps: readonly PaletteName[] = ['red', 'teal', 'leaf', 'denim'];
  caps.forEach((c, i) => {
    p.rect(x + i * 2, y, 1, 2, c);
    px(p, x + i * 2, y + 2, 'paper');
  });
  p.rect(x + 9, y + 2, 4, 1, 'paper');
  px(p, x + 13, y + 2, 'red');
  p.rect(x, y + 3, 13, 1, 'ember');
}

/** The open laptop facing you from (x, y): the lamp on its screen, a cyan glow, the keyboard. */
function paintLaptop(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 6, y - 4, 9, 6, 'cyan', [0.14, 0.07]);
  p.rect(x, y - 8, 13, 8, 'ink');
  p.rect(x + 1, y - 7, 11, 6, 'deep');
  p.rect(x + 1, y - 7, 11, 1, 'indigo');
  // the lamp mock-up on screen
  p.rect(x + 5, y - 6, 3, 2, 'red');
  px(p, x + 6, y - 4, 'honey');
  p.rect(x + 5, y - 3, 3, 1, 'fog');
  px(p, x + 9, y - 6, 'cyan');
  p.rect(x + 9, y - 4, 2, 1, 'sky');
  // the base and keyboard
  p.rect(x - 1, y, 15, 1, 'concrete');
  p.rect(x, y + 1, 13, 1, 'stone');
  p.rect(x, y + 2, 13, 1, 'ember');
}

// ---------------------------------------------------------------------------
// Above the core

/** A shelf of Lantern samples above the whiteboard: lamps in four colours, a box. */
function paintSampleShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 50, 1, 'amber');
  p.rect(x, y + 1, 50, 1, 'ember');
  p.rect(x + 3, y + 2, 1, 2, 'ember');
  p.rect(x + 46, y + 2, 1, 2, 'ember');
  // the lamps stand clear of the light bar's cables
  const shades: readonly PaletteName[] = ['red', 'lamp', 'teal'];
  shades.forEach((s, i) => paintLantern(p, x + 10 + i * 7, y, s, i === 0));
  p.rect(x + 36, y - 7, 9, 7, 'tan');
  p.rect(x + 36, y - 7, 9, 1, 'amber');
  p.rect(x + 39, y - 5, 3, 3, 'paper');
}

/** A mood board of pinned photos: rooms, a desk, a lit lamp. */
function paintMoodBoard(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 21, 33, 1, 'stone');
  p.rect(x, y, 34, 21, 'ember');
  p.rect(x + 1, y + 1, 32, 19, 'tan');
  ditherRect(p, x + 1, y + 1, 32, 19, 'amber', 3);
  const pics: readonly [number, number, PaletteName, PaletteName][] = [
    [3, 3, 'denim', 'honey'],
    [13, 2, 'moss', 'paper'],
    [23, 4, 'plum', 'lamp'],
    [5, 11, 'teal', 'paper'],
    [16, 11, 'indigo', 'honey'],
  ];
  for (const [dx, dy, bg, accent] of pics) {
    p.rect(x + dx, y + dy, 8, 7, 'paper');
    p.rect(x + dx + 1, y + dy + 1, 6, 4, bg);
    p.rect(x + dx + 2, y + dy + 3, 2, 2, accent);
    px(p, x + dx + 3, y + dy, 'red');
  }
  p.rect(x + 26, y + 13, 5, 5, 'honey');
  p.rect(x + 26, y + 17, 5, 1, 'amber');
}

/** A slatted air vent high on the wall. */
function paintVent(p: Painter, x: number, y: number): void {
  p.rect(x, y, 22, 10, 'fog');
  p.rect(x + 1, y + 1, 20, 8, 'stone');
  for (let r = 0; r < 4; r++) p.rect(x + 1, y + 2 + r * 2, 20, 1, 'paper');
  p.rect(x, y + 10, 22, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The bays

/** A bookcase of catalogues and binders, a lamp sample on top. */
function paintBookcase(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 18;
  p.rect(x, top, 28, floorTop - top, 'ember');
  p.rect(x, top, 28, 1, 'amber');
  p.rect(x + 2, top + 2, 24, floorTop - top - 4, 'plum');
  const spines: readonly PaletteName[] = ['denim', 'maroon', 'moss', 'paper', 'teal', 'stone'];
  for (let s = 0; s < 4; s++) {
    const sy = top + 3 + s * 9;
    if (sy + 7 > floorTop - 2) break;
    for (let b = 0; b < 11; b++) {
      if (hash2(b, s + oy, 431) < 0.18) continue;
      const colour = spines[Math.floor(hash2(b, s, 433) * spines.length)] ?? 'stone';
      const bh = 5 + (hash2(b, s, 439) < 0.5 ? 1 : 0);
      p.rect(x + 2 + b * 2, sy + 7 - bh, 2, bh, colour);
    }
    p.rect(x + 2, sy + 7, 24, 1, 'amber');
  }
  paintLantern(p, x + 9, top, 'lamp', true);
}

/** A low cabinet with a plant and a box of brochures, a lamp poster on the wall above. */
function paintCabinet(p: Painter, x: number, oy: number, floorTop: number): void {
  paintPoster(p, x + 3, oy + 10, 14, 18, 1);
  const top = oy + 42;
  p.rect(x, top, 32, floorTop - top + 1, 'ember');
  p.rect(x - 1, top, 34, 1, 'honey');
  p.rect(x - 1, top + 1, 34, 1, 'amber');
  for (const dx of [2, 17]) {
    p.rect(x + dx, top + 4, 13, floorTop - top - 5, 'amber');
    p.rect(x + dx + 12, top + 4, 1, floorTop - top - 5, 'plum');
    px(p, x + dx + 6, top + 7, 'honey');
  }
  paintPlant(p, x + 21, top - 20);
  p.rect(x + 3, top - 5, 10, 5, 'tan');
  p.rect(x + 3, top - 5, 10, 1, 'amber');
  p.rect(x + 5, top - 6, 6, 1, 'paper');
}

export const MARKETING_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    agency: { sprite: AGENCY_SPRITE, ...ACROSS, side: 'right' },
    // Alone, Ms. Carter stands across the table too; with Nina there she
    // stands a step behind, under the window.
    manager: { sprite: MANAGER_SPRITE, ...ACROSS, side: 'right', beside: BEHIND },
  },
  want: { left: { x: 30, y: 4 }, right: { x: 64, y: 6 } },
  ask: { left: { x: 25, y: 24 }, right: { x: 96, y: 23 } },
  rest: {
    left: { x: TABLE.x + 2, y: PROP_TOP },
    right: { x: TABLE.x + 16, y: PROP_TOP },
  },
};
