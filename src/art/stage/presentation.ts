import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { COWORKER_SPRITE, DIRECTOR_SPRITE } from './act3Cast';
import { clipped, coreOrigin, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The presentation stage: Harbor Trading's conference room on a December
 * evening, the lights turned down for the slides. From the left: the
 * projection screen at the front of the room (you stand under it) with the
 * Lantern plan's chart on it, a column chart and a pie with its orange slice;
 * then the long table with your laptop and the clicker at the near end, a
 * water jug and glasses, and two high-backed chairs; at the head of the table,
 * in front of the glass wall onto the office after hours, stand Ms. Carter
 * and Mr. Ellis (and Dan). Handed-over things rest on the tabletop.
 *
 * A second background (`backdrops.coworker`) is your own desk in the open
 * office, where Dan helps you rehearse and the team chats afterwards: a
 * monitor with your slides on it, printed pages, a lit Lantern lamp, a teal
 * partition with notes, and a wide window onto the snowy town at dusk.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom; extra
 * wall goes above (the ceiling projector, Lantern posters, then a dark
 * ceiling with downlights), the room carries on sideways (a whiteboard, the
 * door and a cabinet to the left of the conference room, the glass wall and
 * the office to its right; more windows and desks beside your own).
 * Painted through the Painter interface, palette colours only, whole pixels.
 */

const FLOOR_TOP = 56;
/** The rail between the upper wall and the wooden lower wall. */
const RAIL_Y = 42;
/** The projection screen's lit surface, in core pixels. */
const SCREEN = { x: 8, y: 4, w: 36, h: 24 } as const;
/** The glass wall onto the office runs from this post to the right edge of the stage. */
const GLASS_X = 72;
const GLASS_TOP = 3;
const PANE_W = 18;
/** One stretch of the office behind the glass repeats this often. */
const OFFICE_W = 36;
/** The conference table: its left edge, width, and the y of the far edge of its top. */
const TABLE = { x: 40, w: 54, top: 48 } as const;
const TABLE_DEPTH = 5;
/** 24x24 pictures stand on the far half of the top, their shadow on the wood. */
const PROP_TOP = TABLE.top + 2 - 24;
/** Where the people at the head of the table stand. */
const HEAD = { x: 80, y: 39 } as const;
/** Width of one bay to the left of the conference room, and what the bays hold, going left. */
const BAY_W = 44;
type Bay = 'board' | 'door' | 'cabinet';
const LEFT_BAYS: readonly Bay[] = ['board', 'door', 'cabinet', 'board'];
/** Wall above the core needed for the projector, the posters, and the ceiling. */
const PROJECTOR_MIN = 14;
const POSTER_MIN = 30;
const CEILING_MIN = 60;
const CEILING_UP = 50;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 64;

/** Your desk in the open office (the backdrop): left edge, width, top. */
const DESK = { x: 38, w: 50, top: 48 } as const;
/** The office window behind the desk, and one more each bay to the sides. */
const OFFICE_WINDOW = { x: 46, y: 6, w: 40, h: 22 } as const;
const DESK_BAY_W = 48;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a pane of glass, a window). */
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
// Shared by both rooms

/** Dark carpet with a woven fleck, counted from the core so it never shifts. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'night');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 2 < h; row++) {
    const y = floorTop + 2 + row * 2;
    for (let x = mod(ox + row * 3, 8) - 8; x < w; x += 8) {
      p.rect(x, y, 2, 1, row % 2 === 0 ? 'slate' : 'plum');
    }
  }
}

/** Wooden panels on the lower wall, under a pale rail, with a dark skirting. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'fog');
  p.rect(0, top + 1, w, 1, 'stone');
  for (let x = mod(ox + 4, 16) - 16; x < w; x += 16) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'plum');
    p.rect(x + 1, top + 3, 1, floorTop - top - 5, 'amber');
  }
  p.rect(0, floorTop - 2, w, 2, 'plum');
}

/**
 * The wall above `cornice` on a tall stage: a darker upper wall with a row of
 * high windows onto the snowy night, and downlights (dimmed for the slides)
 * along the cornice.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'slate');
  ditherRect(p, 0, 0, w, 3, 'night', 8);
  const wh = Math.min(64, cornice - 16);
  if (wh >= 12) {
    const top = Math.max(5, Math.floor((cornice - wh) / 2));
    for (let k = Math.floor(-(ox + 40) / HIGH_GAP) - 1; ox + 40 + k * HIGH_GAP - 14 < w; k++) {
      paintHighWindow(p, ox + 40 + k * HIGH_GAP, top, wh, k);
    }
  }
  for (let x = mod(ox + 18, 48) - 48; x < w; x += 48) {
    glowEllipse(p, x + 2, cornice + 3, 9, 5, 'honey', [0.22, 0.1]);
  }
  p.rect(0, cornice, w, 1, 'fog');
  p.rect(0, cornice + 1, w, 1, 'concrete');
  for (let x = mod(ox + 18, 48) - 48; x < w; x += 48) {
    p.rect(x, cornice + 2, 5, 1, 'night');
    p.rect(x + 1, cornice + 3, 3, 1, 'honey');
  }
}

/** One high window centred on `cx`: the night sky, falling snow, a thin moon in every third. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 14, top - 1, 29, wh + 2, 'stone');
  ditherGradient(p, cx - 13, top, 27, wh, ['deep', 'deep', 'indigo', 'dusk']);
  for (let i = 0; i < 9; i++) {
    const sx = cx - 12 + Math.floor(hash2(i, n, 401) * 25);
    const sy = top + 1 + Math.floor(hash2(i, n, 409) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 419) > 0.6 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 1) {
    p.rect(cx - 8, top + 3, 2, 5, 'paper');
    px(p, cx - 6, top + 3, 'paper');
    px(p, cx - 6, top + 7, 'paper');
  }
  p.rect(cx, top, 1, wh, 'stone');
  p.rect(cx - 14, top + wh + 1, 29, 1, 'night');
}

/** A framed poster of a Lantern lamp: a warm shade on a wooden stem, two colourways. */
function paintLanternPoster(p: Painter, x: number, y: number, variant: number): void {
  p.rect(x + 1, y + 20, 16, 1, 'stone');
  p.rect(x, y, 16, 20, 'ink');
  p.rect(x + 1, y + 1, 14, 18, variant % 2 === 0 ? 'deep' : 'maroon');
  glowEllipse(p, x + 8, y + 8, 6, 5, 'honey', [0.4, 0.2]);
  paintLantern(p, x + 5, y + 4);
  p.rect(x + 3, y + 16, 10, 1, 'fog');
}

/**
 * A Lantern desk lamp, 7 wide and 10 high from (x, y): a warm cylinder
 * shade, a wooden stem and a round wooden foot.
 */
function paintLantern(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 5, 1, 'amber');
  p.rect(x, y + 1, 7, 3, 'honey');
  p.rect(x, y + 1, 1, 3, 'lamp');
  p.rect(x + 1, y + 4, 5, 1, 'lamp');
  p.rect(x + 3, y + 5, 1, 4, 'ember');
  p.rect(x + 1, y + 9, 5, 1, 'amber');
  px(p, x + 5, y + 9, 'ember');
}

// ---------------------------------------------------------------------------
// The conference room

/** Paints the conference room to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const ceiling = oy >= CEILING_MIN ? oy - CEILING_UP : 0;

  // The wall, dim for the slides, pale where the screen lights it.
  p.rect(0, 0, w, floorTop, 'stone');
  glowEllipse(p, ox + SCREEN.x + 18, oy + 16, 46, 30, 'fog', [0.5, 0.32, 0.16]);
  if (ceiling > 0) paintUpperWall(p, w, ox, ceiling);

  // Up the wall, when there is room above the core.
  if (oy >= POSTER_MIN) {
    for (let x = ox + 84, i = 0; x - 16 < w; x += BAY_W, i++) {
      paintLanternPoster(p, x, oy - 26, i);
    }
    for (let x = ox + 26, i = 1; x + 16 > 0; x -= BAY_W, i++) {
      paintLanternPoster(p, x, oy - 26, i);
    }
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  // The bays to the left of the core.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    const kind = LEFT_BAYS[i % LEFT_BAYS.length] ?? 'board';
    if (kind === 'board') paintWhiteboard(p, x + 6, oy + 8);
    else if (kind === 'door') paintDoor(p, x + 10, oy + 6, floorTop);
    else paintCabinet(p, x + 4, oy, floorTop);
  }

  paintGlassWall(p, w, ox, oy, floorTop);
  paintScreen(p, ox + SCREEN.x, oy + SCREEN.y);
  if (oy >= PROJECTOR_MIN) paintProjector(p, ox + 60, ceiling, oy - 10);
  paintClock(p, ox + 57, oy + 11);
  paintPlant(p, ox + 117, oy + 37);

  paintTable(p, ox + TABLE.x, oy + TABLE.top, floorTop);
  paintLaptop(p, ox + TABLE.x + 2, oy + TABLE.top + 1);
  paintClicker(p, ox + TABLE.x + 13, oy + TABLE.top + 3);
  paintJug(p, ox + 66, oy + TABLE.top + 1);
  for (const cx of [53, 70]) paintChair(p, ox + cx, oy + TABLE.top + 3, floorTop);
}

/** A whiteboard from (x, y): last week's notes, boxes and an arrow, pens on the tray. */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 22, 'stone');
  p.rect(x + 1, y + 1, 30, 20, 'fog');
  for (let i = 0; i < 3; i++) {
    px(p, x + 3, y + 4 + i * 4, i === 0 ? 'leaf' : 'denim');
    p.rect(x + 5, y + 4 + i * 4, [8, 6, 9][i] ?? 6, 1, 'denim');
  }
  p.rect(x + 18, y + 4, 9, 6, 'red');
  p.rect(x + 19, y + 5, 7, 4, 'fog');
  p.rect(x + 21, y + 12, 1, 4, 'red');
  px(p, x + 20, y + 15, 'red');
  px(p, x + 22, y + 15, 'red');
  p.rect(x + 17, y + 17, 10, 1, 'slate');
  p.rect(x + 2, y + 22, 28, 1, 'concrete');
  p.rect(x + 5, y + 21, 3, 1, 'red');
  p.rect(x + 9, y + 21, 3, 1, 'denim');
  p.rect(x + 1, y + 23, 31, 1, 'stone');
}

/** The conference room door from (x, y), a little light from the corridor under it. */
function paintDoor(p: Painter, x: number, y: number, floorTop: number): void {
  p.rect(x - 2, y - 2, 26, floorTop - y + 2, 'fog');
  p.rect(x, y, 22, floorTop - y, 'ember');
  p.rect(x + 2, y + 3, 18, 14, 'amber');
  p.rect(x + 3, y + 4, 16, 12, 'ember');
  p.rect(x + 2, y + 21, 18, 18, 'amber');
  p.rect(x + 3, y + 22, 16, 16, 'ember');
  // the narrow glass strip and the handle
  p.rect(x + 9, y + 5, 4, 10, 'indigo');
  px(p, x + 9, y + 5, 'sky');
  p.rect(x + 18, y + 26, 2, 1, 'honey');
  px(p, x + 18, y + 27, 'amber');
  p.rect(x + 1, floorTop - 1, 20, 1, 'honey', 0.5);
}

/** A low cabinet with binders, a lit Lantern lamp on top and a framed picture above. */
function paintCabinet(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 38;
  p.rect(x, top, 36, floorTop - top, 'ember');
  p.rect(x - 1, top, 38, 1, 'honey');
  p.rect(x - 1, top + 1, 38, 1, 'amber');
  for (const dx of [2, 19]) {
    p.rect(x + dx, top + 4, 15, floorTop - top - 6, 'amber');
    p.rect(x + dx + 14, top + 4, 1, floorTop - top - 6, 'plum');
  }
  glowEllipse(p, x + 28, top - 8, 10, 9, 'honey', [0.3, 0.14]);
  paintLantern(p, x + 25, top - 10);
  const binders: readonly PaletteName[] = ['denim', 'maroon', 'moss', 'stone', 'teal'];
  binders.forEach((c, i) => p.rect(x + 3 + i * 3, top - 7, 2, 7, c));
  // a framed photo of the Taoyuan plant: a long low building under a pink sky
  p.rect(x + 4, oy + 12, 24, 16, 'ink');
  ditherGradient(p, x + 5, oy + 13, 22, 14, ['violet', 'mauve', 'rosy']);
  p.rect(x + 6, oy + 21, 20, 6, 'stone');
  p.rect(x + 6, oy + 21, 20, 1, 'fog');
  for (let i = 0; i < 4; i++) p.rect(x + 8 + i * 5, oy + 23, 2, 2, 'honey');
  p.rect(x + 22, oy + 16, 2, 5, 'stone');
}

/**
 * The projection screen on the front wall: a thin dark frame around the lit
 * surface from (x, y), and the Lantern plan's slide: a title bar, a column
 * chart rising to an orange column, and a pie whose biggest slice is teal and
 * whose orange slice is the online sales.
 */
function paintScreen(p: Painter, x: number, y: number): void {
  const { w, h } = SCREEN;
  p.rect(x - 2, y - 2, w + 4, h + 4, 'ink');
  p.rect(x - 1, y - 1, w + 2, h + 2, 'slate');
  p.rect(x, y, w, h, 'paper');
  // its shadow on the wall below
  p.rect(x - 1, y + h + 2, w + 2, 1, 'stone');
  // the title bar and the company's little lamp mark
  p.rect(x + 2, y + 2, w - 4, 3, 'teal');
  p.rect(x + 4, y + 3, 10, 1, 'paper');
  p.rect(x + w - 6, y + 2, 2, 1, 'honey');
  p.rect(x + w - 7, y + 3, 4, 1, 'honey');
  // the column chart: axes and four columns, the last one this year's plan
  p.rect(x + 3, y + 8, 1, 13, 'stone');
  p.rect(x + 3, y + 20, 17, 1, 'stone');
  const cols: readonly number[] = [4, 6, 7, 11];
  cols.forEach((ch, i) => {
    const last = i === cols.length - 1;
    const cx = x + 5 + i * 4;
    p.rect(cx, y + 20 - ch, 3, ch, last ? 'amber' : 'denim');
    p.rect(cx + 2, y + 20 - ch, 1, ch, last ? 'ember' : 'indigo');
  });
  // the pie: teal for the office stores, orange for online, red for the rest
  const pcx = x + 27;
  const pcy = y + 14;
  const r = 6;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 2) continue;
      // angle clockwise from straight up, 0..1
      const a = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
      const colour: PaletteName = a < 0.6 ? 'teal' : a < 0.85 ? 'amber' : 'rosy';
      px(p, pcx + dx, pcy + dy, colour);
    }
  }
  // its shadow on the slide
  p.rect(pcx - r + 2, pcy + r + 1, 2 * r - 3, 1, 'fog');
  // the legend under the column chart
  px(p, x + 5, y + 22, 'teal');
  p.rect(x + 7, y + 22, 4, 1, 'concrete');
  px(p, x + 13, y + 22, 'amber');
  p.rect(x + 15, y + 22, 4, 1, 'concrete');
}

/** The projector hanging from the ceiling (`from`) on a pole, its lens turned to the screen. */
function paintProjector(p: Painter, cx: number, from: number, y: number): void {
  p.rect(cx, from, 2, y - from, 'stone');
  p.rect(cx - 3, y - 1, 8, 1, 'slate');
  p.rect(cx - 7, y, 16, 6, 'fog');
  p.rect(cx - 7, y + 5, 16, 1, 'stone');
  p.rect(cx + 8, y, 1, 6, 'concrete');
  p.rect(cx - 8, y + 1, 2, 4, 'ink');
  px(p, cx - 8, y + 2, 'cyan');
  p.rect(cx - 3, y + 2, 9, 1, 'concrete');
  px(p, cx + 6, y + 4, 'leaf');
}

/**
 * The glass wall from its post at GLASS_X to the right edge of the stage:
 * the office after hours behind it, aluminium posts, a frosted band at eye
 * level, the header above and the track along the floor.
 */
function paintGlassWall(p: Painter, w: number, ox: number, oy: number, floorTop: number): void {
  const x0 = ox + GLASS_X;
  const top = oy + GLASS_TOP;
  const bottom = floorTop - 2;
  if (x0 >= w) return;
  const glass = within(p, x0, top, w - x0, bottom - top);
  ditherGradient(glass, x0, top, w - x0, bottom - top, ['slate', 'night', 'night', 'deep']);
  // the far wall's windows: the last of the dusk, a little snow falling
  const winTop = top + 6;
  ditherGradient(glass, x0, winTop, w - x0, 14, ['indigo', 'violet', 'mauve', 'rosy']);
  for (let x = x0; x < w; x++) {
    const k = x - ox;
    if (hash2(k, 7, 311) < 0.12)
      px(glass, x, winTop + 1 + Math.floor(hash2(k, 8, 313) * 11), 'fog');
    if (mod(k, 12) === 0) p.rect(x, winTop, 1, 14, 'night');
  }
  p.rect(x0, winTop + 14, w - x0, 1, 'stone');
  for (let k = Math.floor((x0 - ox - GLASS_X) / OFFICE_W); ox + GLASS_X + k * OFFICE_W < w; k++) {
    paintOfficeBeyond(glass, ox + GLASS_X + k * OFFICE_W, oy, bottom, k);
  }
  // glints slanting down each pane, and the frosted band
  for (let x = x0 + 2; x < w; x += PANE_W) {
    for (let i = 0; i < 4; i++) px(glass, x + 8 - i, top + 3 + i * 2, 'sky');
  }
  for (const dy of [28, 30]) p.rect(x0, oy + dy, w - x0, 1, 'concrete');
  // posts, header and track
  for (let x = x0 + PANE_W; x < w; x += PANE_W) {
    p.rect(x, top, 1, bottom - top, 'concrete');
    p.rect(x + 1, top, 1, bottom - top, 'night');
  }
  p.rect(x0, top - 2, w - x0, 1, 'fog');
  p.rect(x0, top - 1, w - x0, 1, 'stone');
  p.rect(x0, bottom, w - x0, 2, 'stone');
  p.rect(x0, bottom, w - x0, 1, 'concrete');
  p.rect(x0 - 2, top - 2, 2, floorTop - top + 2, 'fog');
  p.rect(x0 - 2, top - 2, 1, floorTop - top + 2, 'paper');
}

/**
 * One stretch of the office through the glass, from `ux`: a far ceiling
 * light, a low partition and a desk with a monitor and a Lantern lamp left on.
 */
function paintOfficeBeyond(p: Painter, ux: number, oy: number, bottom: number, n: number): void {
  p.rect(ux + 10, oy + 5, 12, 1, 'stone');
  const top = oy + 44;
  if (mod(n, 3) === 2) {
    // the copier and a tall plant
    p.rect(ux + 6, top - 6, 14, bottom - top + 6, 'stone');
    p.rect(ux + 6, top - 6, 14, 1, 'fog');
    p.rect(ux + 8, top - 3, 10, 1, 'night');
    px(p, ux + 17, top - 5, 'cyan');
    p.rect(ux + 7, top + 3, 12, 1, 'slate');
    p.rect(ux + 26, top + 2, 6, bottom - top - 2, 'ember');
    p.rect(ux + 25, top - 6, 3, 8, 'moss');
    p.rect(ux + 29, top - 9, 3, 11, 'moss');
    p.rect(ux + 27, top - 12, 2, 8, 'moss');
    px(p, ux + 27, top - 12, 'leaf');
    px(p, ux + 30, top - 9, 'leaf');
    return;
  }
  // the partition behind the desk
  p.rect(ux + 4, top - 9, 30, 9, 'moss');
  p.rect(ux + 4, top - 9, 30, 1, 'teal');
  // the desk and the dark under it
  p.rect(ux + 3, top, 32, 1, 'stone');
  p.rect(ux + 4, top + 1, 30, bottom - top - 1, 'ink');
  p.rect(ux + 6, top + 2, 1, bottom - top - 2, 'night');
  p.rect(ux + 31, top + 2, 1, bottom - top - 2, 'night');
  // the monitor
  p.rect(ux + 18, top - 8, 9, 6, 'ink');
  p.rect(ux + 19, top - 7, 7, 4, mod(n, 3) === 1 ? 'teal' : 'denim');
  p.rect(ux + 20, top - 6, 3, 1, 'sky');
  p.rect(ux + 22, top - 2, 1, 2, 'ink');
  // a Lantern lamp left on, and its pool of light; the other desk just has a mug
  if (mod(n, 3) === 0) {
    glowEllipse(p, ux + 10, top - 2, 9, 6, 'honey', [0.36, 0.16]);
    paintLantern(p, ux + 7, top - 10);
  } else {
    p.rect(ux + 9, top - 3, 3, 3, 'paper');
    p.rect(ux + 28, top - 2, 4, 2, 'fog');
  }
}

/** The long conference table: a wooden top seen a little from above, on two legs. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  const edge = top + TABLE_DEPTH;
  p.rect(x + 2, edge + 1, w - 4, floorTop - edge - 1, 'ink');
  ditherRect(p, x + 1, floorTop + 1, w - 2, 5, 'ink', 8);
  for (const lx of [x + 2, x + w - 4]) {
    p.rect(lx, edge + 1, 2, floorTop + 6 - edge - 1, 'ember');
    p.rect(lx + 1, edge + 1, 1, floorTop + 6 - edge - 1, 'plum');
  }
  p.rect(x, top, w, TABLE_DEPTH, 'amber');
  p.rect(x + 1, top, w - 2, 1, 'honey');
  p.rect(x + 20, top + 3, 14, 1, 'ember');
  p.rect(x + 38, top + 2, 9, 1, 'ember');
  p.rect(x, edge, w, 1, 'plum');
  p.rect(x + 1, edge + 1, w - 2, 1, 'ink');
  // the screen's cool light along the near end of the wood
  p.rect(x + 1, top + 1, 9, 1, 'fog');
  p.rect(x + 12, top + 1, 4, 1, 'tan');
}

/** Your laptop at the near end, open and turned to you: its lid's back, the base, a lit edge. */
function paintLaptop(p: Painter, x: number, y: number): void {
  // the lid, leaning back a little, seen from behind
  p.rect(x + 1, y - 7, 8, 7, 'concrete');
  p.rect(x + 1, y - 7, 8, 1, 'fog');
  p.rect(x + 8, y - 6, 1, 6, 'stone');
  px(p, x + 4, y - 4, 'paper');
  // the glow of its screen spilling to your side
  px(p, x, y - 6, 'cyan');
  p.rect(x, y - 5, 1, 5, 'sky');
  // the base on the table, and the cable off the far side
  p.rect(x, y, 10, 1, 'slate');
  p.rect(x + 10, y, 3, 1, 'ink');
}

/** The remote clicker lying on the table: a small dark oblong with a red laser key. */
function paintClicker(p: Painter, x: number, y: number): void {
  p.rect(x, y, 4, 1, 'ink');
  px(p, x + 1, y, 'red');
  p.rect(x, y + 1, 4, 1, 'plum');
}

/** A glass water jug and two glasses, catching the light. */
function paintJug(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y - 8, 4, 1, 'fog');
  p.rect(x, y - 7, 6, 7, 'sky');
  p.rect(x + 1, y - 4, 4, 4, 'denim');
  px(p, x + 1, y - 6, 'paper');
  p.rect(x + 6, y - 6, 1, 4, 'fog');
  p.rect(x, y, 6, 1, 'ember');
  for (const gx of [x - 5, x + 9]) {
    p.rect(gx, y - 3, 3, 3, 'sky');
    p.rect(gx, y - 1, 3, 1, 'denim');
    px(p, gx, y - 3, 'paper');
  }
}

/** A high-backed mesh chair pushed in on the near side, seen from behind. */
function paintChair(p: Painter, x: number, y: number, floorTop: number): void {
  p.rect(x + 1, y - 4, 8, 1, 'stone');
  p.rect(x, y - 3, 10, 9, 'night');
  p.rect(x + 1, y - 2, 8, 6, 'slate');
  p.rect(x + 1, y - 2, 3, 1, 'stone');
  p.rect(x + 9, y - 3, 1, 9, 'night');
  // the arms, the seat's edge, the stem and the castors
  p.rect(x - 1, y + 3, 1, 3, 'ink');
  p.rect(x + 10, y + 3, 1, 3, 'ink');
  p.rect(x + 1, y + 6, 8, 1, 'ink');
  p.rect(x + 4, y + 7, 2, floorTop - y - 6, 'stone');
  p.rect(x + 1, floorTop + 1, 8, 1, 'ink');
  px(p, x + 1, floorTop + 2, 'stone');
  px(p, x + 8, floorTop + 2, 'stone');
}

// ---------------------------------------------------------------------------
// Your desk in the open office (backdrops.coworker)

/** Paints your desk in the open office to fill a w x h stage. */
function paintDeskScene(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const ceiling = oy >= CEILING_MIN ? oy - CEILING_UP : 0;

  // The office wall, warm under the lamps.
  p.rect(0, 0, w, floorTop, 'fog');
  glowEllipse(p, ox + DESK.x + 33, oy + 36, 30, 20, 'honey', [0.2, 0.1, 0.05]);
  if (ceiling > 0) paintUpperWall(p, w, ox, ceiling);

  // Windows onto the town: one behind your desk, more each bay to the sides.
  const winTop = oy + OFFICE_WINDOW.y - Math.min(22, Math.max(0, oy - 20));
  const winH = oy + OFFICE_WINDOW.y + OFFICE_WINDOW.h - winTop;
  for (let k = -8; k <= 8; k++) {
    const x = ox + OFFICE_WINDOW.x + k * DESK_BAY_W * 2;
    if (x + OFFICE_WINDOW.w < 0 || x >= w) continue;
    paintTownWindow(p, x, winTop, OFFICE_WINDOW.w, winH, ox);
  }
  // Between them, sideways: a bookcase or a calendar.
  for (let k = -8; k <= 8; k++) {
    if (k === 0) continue;
    const x = ox + OFFICE_WINDOW.x + k * DESK_BAY_W * 2 - DESK_BAY_W;
    if (x + 30 < 0 || x - 10 >= w) continue;
    paintBookcase(p, x + 4, oy + 18, floorTop, k);
  }
  // Lantern posters over the spaces between the windows.
  if (oy >= POSTER_MIN) {
    for (let k = -8; k <= 8; k++) {
      const x = ox + OFFICE_WINDOW.x + k * DESK_BAY_W * 2 - DESK_BAY_W + 9;
      if (x + 18 > 0 && x < w) paintLanternPoster(p, x, oy - 26, mod(k, 2));
    }
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  // Other people's desks along the room, left on for the evening.
  for (let k = -6; k <= 6; k++) {
    if (k === 0) continue;
    const x = ox + DESK.x + k * DESK_BAY_W * 2;
    if (x + DESK.w + 10 < 0 || x - 10 >= w) continue;
    paintPartition(p, x - 2, oy + 34, DESK.w + 4, k);
    paintDesk(p, x, oy + DESK.top, floorTop);
    paintScreenOff(p, x + 8, oy + DESK.top);
    if (mod(k, 2) === 1) {
      glowEllipse(p, x + 40, oy + DESK.top - 4, 10, 7, 'honey', [0.34, 0.14]);
      paintLantern(p, x + 37, oy + DESK.top - 10);
    } else {
      p.rect(x + 30, oy + DESK.top - 2, 8, 2, 'paper');
      p.rect(x + 31, oy + DESK.top - 3, 6, 1, 'fog');
    }
  }

  // The core: the shelf behind you, your partition and desk.
  paintWallShelf(p, ox + 4, oy + 24);
  paintPartition(p, ox + DESK.x - 2, oy + 34, DESK.w + 4, 0);
  paintDesk(p, ox + DESK.x, oy + DESK.top, floorTop);
  paintMonitor(p, ox + DESK.x + 4, oy + DESK.top);
  paintPages(p, ox + DESK.x + 20, oy + DESK.top + 1);
  glowEllipse(p, ox + DESK.x + 33, oy + DESK.top - 4, 12, 8, 'honey', [0.36, 0.18]);
  paintLantern(p, ox + DESK.x + 30, oy + DESK.top - 10);
  paintMug(p, ox + DESK.x + 41, oy + DESK.top);
  paintDeskChair(p, ox + DESK.x + 6, oy + DESK.top + 1, floorTop);
  paintPlant(p, ox + 114, oy + 37);
}

/** A window onto the town at dusk in December: roofs with snow, lit windows, a few flakes. */
function paintTownWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number) {
  p.rect(x, y, w, h, 'paper');
  const gx = x + 2;
  const gy = y + 2;
  const gw = w - 4;
  const gh = h - 4;
  const glass = within(p, gx, gy, gw, gh);
  ditherGradient(glass, gx, gy, gw, gh, ['deep', 'indigo', 'violet', 'mauve']);
  // the roofs, a fixed way up from the sill
  for (let i = 0; i < gw; i++) {
    const k = gx + i - ox;
    const roof = 4 + Math.floor(hash2(Math.floor(k / 7), 1, 331) * 5);
    const ry = gy + gh - roof;
    glass.rect(gx + i, ry, 1, roof, 'night');
    px(glass, gx + i, ry, 'paper');
    if (mod(k, 7) === 3 && hash2(Math.floor(k / 7), 2, 337) < 0.7) {
      px(glass, gx + i, ry + 2, hash2(k, 3, 347) < 0.5 ? 'honey' : 'lamp');
    }
    if (hash2(k, 4, 349) < 0.1) {
      px(glass, gx + i, gy + 1 + Math.floor(hash2(k, 5, 353) * Math.max(1, gh - 8)), 'fog');
    }
  }
  p.rect(x + Math.floor(w / 2), gy, 1, gh, 'paper');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

/** A bookcase between windows, its top shelf at `y`. */
function paintBookcase(p: Painter, x: number, y: number, floorTop: number, seed: number): void {
  p.rect(x, y, 26, floorTop - y, 'ember');
  p.rect(x + 1, y + 1, 24, floorTop - y - 2, 'plum');
  const colours: readonly PaletteName[] = ['denim', 'maroon', 'moss', 'stone', 'teal', 'amber'];
  for (let sy = y + 9; sy < floorTop - 2; sy += 9) {
    for (let b = 0; b < 11; b++) {
      if (hash2(b, sy + seed * 13, 359) < 0.2) continue;
      const c = colours[Math.floor(hash2(b, sy + seed * 13, 367) * colours.length)] ?? 'stone';
      p.rect(x + 2 + b * 2, sy - 7, 2, 7, c);
    }
    p.rect(x + 1, sy, 24, 1, 'amber');
  }
}

/** The shelf behind you: binders and a little box of business cards. */
function paintWallShelf(p: Painter, x: number, y: number): void {
  const colours: readonly PaletteName[] = ['denim', 'maroon', 'stone', 'teal', 'moss'];
  colours.forEach((c, i) => p.rect(x + 2 + i * 3, y - 8, 2, 8, c));
  p.rect(x + 18, y - 3, 5, 3, 'paper');
  p.rect(x, y, 24, 1, 'amber');
  p.rect(x, y + 1, 24, 1, 'ember');
  p.rect(x + 2, y + 2, 1, 2, 'ember');
  p.rect(x + 21, y + 2, 1, 2, 'ember');
}

/** A monitor switched off for the night on someone else's desk. */
function paintScreenOff(p: Painter, x: number, top: number): void {
  p.rect(x, top - 11, 14, 9, 'ink');
  p.rect(x + 1, top - 10, 12, 7, 'night');
  px(p, x + 2, top - 9, 'slate');
  p.rect(x + 6, top - 2, 2, 2, 'ink');
  p.rect(x + 3, top - 1, 8, 1, 'slate');
}

/** A low teal partition behind a desk, with sticky notes on it. */
function paintPartition(p: Painter, x: number, y: number, w: number, seed: number): void {
  p.rect(x, y, w, 15, 'teal');
  p.rect(x, y, w, 1, 'cyan');
  p.rect(x, y + 1, w, 1, 'moss');
  p.rect(x, y + 12, w, 3, 'moss');
  const notes: readonly PaletteName[] = ['honey', 'rosy', 'honey', 'sky'];
  for (let i = 0; i < 3; i++) {
    if (seed !== 0 && i > 0) break;
    const nx = x + 6 + i * 5 + Math.floor(hash2(i, seed, 373) * 2);
    p.rect(nx, y + 3 + (i % 2), 3, 3, notes[(i + mod(seed, 4)) % notes.length] ?? 'honey');
  }
}

/** A desk from (x, top): a light wooden top and a dark drawer pedestal. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
  p.rect(x + 2, top + 3, w - 4, floorTop - top - 3, 'ink');
  p.rect(x + w - 14, top + 3, 12, floorTop - top - 3, 'slate');
  p.rect(x + w - 13, top + 6, 10, 1, 'night');
  p.rect(x + w - 13, top + 11, 10, 1, 'night');
  px(p, x + w - 8, top + 4, 'fog');
  p.rect(x + 2, top + 3, 2, floorTop - top - 3, 'slate');
  p.rect(x, top, w, 3, 'amber');
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 3, w, 1, 'ember');
  ditherRect(p, x + 1, floorTop + 1, w - 2, 3, 'ink', 8);
}

/** Your monitor, the Lantern slides on it: a teal title bar and a little pie. */
function paintMonitor(p: Painter, x: number, top: number): void {
  p.rect(x, top - 13, 16, 11, 'ink');
  p.rect(x + 1, top - 12, 14, 9, 'paper');
  p.rect(x + 2, top - 11, 12, 2, 'teal');
  // a little column chart and pie
  p.rect(x + 3, top - 6, 1, 2, 'denim');
  p.rect(x + 5, top - 7, 1, 3, 'denim');
  p.rect(x + 7, top - 8, 1, 4, 'amber');
  p.rect(x + 10, top - 8, 3, 4, 'teal');
  px(p, x + 12, top - 8, 'amber');
  px(p, x + 12, top - 7, 'amber');
  p.rect(x + 7, top - 2, 2, 2, 'ink');
  p.rect(x + 4, top - 1, 8, 1, 'slate');
  glowEllipse(p, x + 8, top - 7, 10, 8, 'paper', [0.12]);
}

/** Printed slides, a little fanned out, and a pen. */
function paintPages(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y - 1, 7, 1, 'fog');
  p.rect(x, y, 8, 1, 'paper');
  p.rect(x + 2, y - 2, 6, 1, 'paper');
  px(p, x + 4, y - 2, 'teal');
  p.rect(x + 8, y, 3, 1, 'red');
}

/** A mug of coffee, a little steam over it. */
function paintMug(p: Painter, x: number, top: number): void {
  p.rect(x, top - 4, 4, 4, 'red');
  p.rect(x, top - 4, 4, 1, 'maroon');
  p.rect(x + 4, top - 3, 1, 2, 'red');
  px(p, x + 1, top - 6, 'fog');
  px(p, x + 2, top - 7, 'fog');
}

/** Your office chair, pushed back from the desk while you rehearse. */
function paintDeskChair(p: Painter, x: number, y: number, floorTop: number): void {
  p.rect(x, y - 2, 10, 8, 'denim');
  p.rect(x + 1, y - 3, 8, 1, 'denim');
  p.rect(x + 1, y - 2, 3, 1, 'sky');
  p.rect(x + 9, y - 2, 1, 8, 'indigo');
  p.rect(x + 1, y + 6, 8, 1, 'ink');
  p.rect(x + 4, y + 7, 2, floorTop - y - 6, 'stone');
  p.rect(x + 1, floorTop + 1, 8, 1, 'ink');
  px(p, x + 1, floorTop + 2, 'stone');
  px(p, x + 8, floorTop + 2, 'stone');
}

export const PRESENTATION_STAGE: StageConfig = {
  paint,
  backdrops: { coworker: paintDeskScene },
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...HEAD, side: 'right' },
    // Alone, Mr. Ellis stands at the head of the table too; with someone else
    // there he stands at the corner of the glass wall, right of them.
    director: { sprite: DIRECTOR_SPRITE, ...HEAD, side: 'right', beside: { x: 96, y: HEAD.y } },
    // Dan alone stands at the head of the table; with Ms. Carter or Mr. Ellis
    // there he stands along the near side of the table, left of them.
    coworker: { sprite: COWORKER_SPRITE, ...HEAD, side: 'right', beside: { x: 63, y: HEAD.y } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 6 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 87, y: 24 } },
  rest: {
    left: { x: TABLE.x - 1, y: PROP_TOP },
    right: { x: TABLE.x + 7, y: PROP_TOP },
  },
};
