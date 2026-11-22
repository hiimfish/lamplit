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
import { clipped, coreOrigin, CORE_W, paintClock, paintPicture, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The meeting stage: the small conference room on the second floor of the
 * Harbor Trading building, on a February evening. From the left: the glass
 * wall onto the office (you stand in front of it; desk lamps glow at the desks
 * beyond), the booking calendar by the door post, a pulled-down projector
 * screen with this month's chart, the wall clock and a window onto the harbour
 * at dusk. A long wooden table with three teal chairs runs between you and the
 * head of the table, where Ms. Carter (or Dan) stands; the conference phone
 * sits at that end, and handed-over things rest on the tabletop. Painted
 * through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (the ceiling projector, a lamp poster, a
 * picture and the air conditioner, taller windows, then a darker upper wall
 * with high windows onto the night sky), the glass wall and its door run on to
 * the left, and a whiteboard, more windows and a sideboard with the
 * refreshments stand to the right.
 */

/** The table's left edge and width, and the y of the far edge of its top, in core pixels. */
const TABLE = { x: 37, w: 47, top: 49 } as const;
/** The tabletop shows this many rows; the chairs' backs hide the near ones. */
const TABLE_DEPTH = 6;
/** 24x24 pictures stand on the far half of the top, clear of the chairs. */
const TABLE_FAR = 3;
const PROP_TOP = TABLE.top + TABLE_FAR - 24;

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the dark lower wall. */
const RAIL_Y = 44;
/** The post where the glass wall ends, in core pixels; panes are counted leftwards from it. */
const GLASS_END = 34;
const GLASS_TOP = 4;
const PANE_W = 22;
/** One desk and its far window behind the glass repeat this often. */
const OFFICE_W = 44;
/** The projector screen: its housing's left end, and the lit surface. */
const SCREEN = { x: 45, y: 3, w: 39, h: 23 } as const;
/** The window in the core: its outer frame. */
const WINDOW = { x: 98, y: 4, w: 27, h: 28 } as const;
/** The pendant lamp between the glass wall and the screen. */
const LAMP_X = 40;
/** Where the people at the head of the table stand. */
const HEAD_OF_TABLE = { x: 81, y: 39 } as const;
/** Width of one bay to the right of the core, and what the bays hold in turn. */
const BAY_W = 44;
type Bay = 'board' | 'window' | 'sideboard';
const RIGHT_BAYS: readonly Bay[] = ['board', 'window', 'sideboard', 'window'];
/** Wall above the core needed for the projector, the poster, and the picture with the air conditioner. */
const PROJECTOR_MIN = 12;
const POSTER_MIN = 28;
const PICTURE_MIN = 48;
/** Wall above the core needed for the upper wall, and how far above the core it starts. */
const CORNICE_MIN = 64;
const CORNICE_UP = 52;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 26;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 88;

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

/** Paints the conference room to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up, towards the ceiling.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The wall bays to the right of the core. Lamps hang over the ones without a window.
  const bays: [number, Bay][] = [];
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  const lamps = [ox + LAMP_X];
  for (const [x, kind] of bays) if (kind !== 'window') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it and pale around the lit screen.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  glowEllipse(p, ox + SCREEN.x + 19, oy + 14, 27, 19, 'paper', [0.2, 0.1]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Up the wall, when there is room above the core.
  if (oy >= POSTER_MIN) {
    // a row of the company's lamp posters over the glass wall
    for (let x = ox + 17, i = 0; x + 16 > 0; x -= BAY_W, i++) {
      paintLampPoster(p, x, oy - 25, i % 2 === 0 ? 0 : 1);
    }
  }
  if (oy >= PICTURE_MIN) {
    paintPicture(p, ox + 16, oy - 46);
    paintAirConditioner(p, ox + 70, oy - 44);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  paintGlassWall(p, ox, oy, floorTop);
  for (const [x, kind] of bays) {
    if (kind === 'board') paintWhiteboard(p, x + 6, oy + 9);
    else if (kind === 'window') paintWindow(p, x + 8, winTop, WINDOW.w, winH, ox);
    else paintSideboard(p, x, oy, floorTop);
  }

  // The core: the calendar by the door post, the screen, the clock, the harbour window.
  paintCalendar(p, ox + 37, oy + 21);
  paintScreen(p, ox + SCREEN.x, oy + SCREEN.y);
  if (oy >= PROJECTOR_MIN) paintProjector(p, ox + SCREEN.x + 19, cornice, oy - 9);
  paintClock(p, ox + 91, oy + 10);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintLamp(p, lx, cornice, oy);

  paintPlant(p, ox + 116, oy + 38);
  paintTable(p, ox + TABLE.x, oy + TABLE.top, floorTop);
  for (const cx of [42, 55, 68]) paintChair(p, ox + cx, oy + TABLE.top + TABLE_FAR);
  paintPhone(p, ox + TABLE.x + TABLE.w - 8, oy + TABLE.top + 2);
}

// ---------------------------------------------------------------------------
// Room

/** The dark lower wall under a pale rail, with a skirting board. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top + 2, w, floorTop - top - 2, 'plum');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'concrete');
  // panels: a thin seam every so often
  for (let x = mod(ox + 6, 20) - 20; x < w; x += 20) {
    p.rect(x, top + 4, 1, floorTop - top - 7, 'night');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Carpet tiles: slate with a short woven fleck, counted from the core so it never shifts. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 2 < h; row++) {
    const y = floorTop + 2 + row * 2;
    for (let x = mod(ox + row * 5, 10) - 10; x < w; x += 10) {
      p.rect(x, y, 2, 1, row % 2 === 0 ? 'stone' : 'night');
    }
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
    const sx = cx - 19 + Math.floor(hash2(i, n, 211) * 39);
    const sy = top + 1 + Math.floor(hash2(i, n, 223) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 227) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 1) {
    p.rect(cx - 12, top + 3, 2, 5, 'paper');
    px(p, cx - 10, top + 3, 'paper');
    px(p, cx - 10, top + 7, 'paper');
    px(p, cx - 13, top + 4, 'honey');
    px(p, cx - 13, top + 6, 'honey');
  }
  p.rect(cx - 7, top, 1, wh, 'paper');
  p.rect(cx + 7, top, 1, wh, 'paper');
  p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The glass wall and the office behind it

/**
 * The glass wall from the left edge of the stage to its end post: the office
 * after hours behind it, aluminium posts, three frosted lines at eye level and
 * the door two panes along.
 */
function paintGlassWall(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x1 = ox + GLASS_END;
  const top = oy + GLASS_TOP;
  const bottom = floorTop - 2;
  if (x1 <= 0) return;

  const glass = within(p, 0, top, x1, bottom - top);
  ditherGradient(glass, 0, top, x1, bottom - top, ['dusk', 'dusk', 'dusk', 'indigo']);
  for (let k = -1; x1 + (k + 1) * OFFICE_W > 0; k--) {
    paintOfficeBeyond(glass, x1 + k * OFFICE_W, oy, bottom, k);
  }
  // a glint slanting down each pane
  for (let x = x1 - PANE_W; x > -PANE_W; x -= PANE_W) {
    for (let i = 0; i < 5; i++) px(glass, x + 9 - i, top + 3 + i * 2, 'violet');
    for (let i = 0; i < 3; i++) px(glass, x + 13 - i, top + 4 + i * 2, 'violet');
  }
  // the frosted lines
  for (const dy of [29, 31, 33]) p.rect(0, oy + dy, x1, 1, 'sky');

  // the door, two panes along: a heavier frame, a push plate and a long handle
  const door = x1 - PANE_W * 3;
  p.rect(door + 1, top, PANE_W - 1, 1, 'stone');
  p.rect(door + 1, top, 1, bottom - top, 'stone');
  p.rect(door + PANE_W - 1, top, 1, bottom - top, 'stone');
  p.rect(door + 4, oy + 27, 2, 9, 'honey');
  px(p, door + 4, oy + 27, 'lamp');
  px(p, door + 4, oy + 35, 'amber');
  p.rect(door + 2, bottom - 4, PANE_W - 3, 4, 'stone');
  p.rect(door + 2, bottom - 4, PANE_W - 3, 1, 'concrete');

  // posts, the beam above and the track on the floor
  for (let x = x1 - PANE_W; x > -2; x -= PANE_W) {
    p.rect(x, top, 1, bottom - top, 'concrete');
    p.rect(x + 1, top, 1, bottom - top, 'night');
  }
  p.rect(0, top - 2, x1, 1, 'paper');
  p.rect(0, top - 1, x1, 1, 'stone');
  p.rect(0, bottom, x1, 2, 'stone');
  p.rect(0, bottom, x1, 1, 'concrete');
  p.rect(x1, top - 2, 2, floorTop - top + 2, 'concrete');
  p.rect(x1, top - 2, 1, floorTop - top + 2, 'paper');
  p.rect(x1 + 2, top, 1, floorTop - top, 'stone');
}

/**
 * One stretch of the office seen through the glass, from `ux`: a ceiling
 * light, a far window with the last of the sunset, and a desk with a monitor
 * and one of the company's glass desk lamps left on.
 */
function paintOfficeBeyond(p: Painter, ux: number, oy: number, bottom: number, n: number): void {
  // the ceiling light, far away
  p.rect(ux + 11, oy + 7, 11, 1, 'stone');
  p.rect(ux + 12, oy + 8, 9, 1, 'concrete');
  const top = oy + 46;

  if (mod(n, 2) === 0) {
    // the storage corner: a shelf of binders, a plant, the copier
    p.rect(ux + 3, oy + 22, 17, bottom - oy - 22, 'night');
    const binders: readonly PaletteName[] = ['stone', 'maroon', 'moss', 'denim', 'stone', 'slate'];
    for (let s = 0; s < 3; s++) {
      const sy = oy + 31 + s * 9;
      for (let b = 0; b < 6; b++) {
        if (hash2(b, s + n * 3, 233) < 0.2) continue;
        const colour = binders[Math.floor(hash2(b, s + n * 3, 239) * binders.length)] ?? 'stone';
        p.rect(ux + 5 + b * 2, sy - 6, 2, 6, colour);
      }
      p.rect(ux + 4, sy, 15, 1, 'slate');
    }
    p.rect(ux + 24, top + 2, 5, bottom - top - 2, 'night');
    p.rect(ux + 23, top - 2, 3, 4, 'moss');
    p.rect(ux + 27, top - 4, 3, 6, 'moss');
    p.rect(ux + 25, top - 6, 2, 5, 'moss');
    px(p, ux + 25, top - 6, 'leaf');
    px(p, ux + 28, top - 4, 'leaf');
    p.rect(ux + 32, top - 5, 10, bottom - top + 5, 'slate');
    p.rect(ux + 32, top - 5, 10, 1, 'stone');
    p.rect(ux + 33, top - 2, 8, 1, 'night');
    px(p, ux + 40, top - 4, 'cyan');
    p.rect(ux + 33, top + 3, 8, 1, 'night');
    return;
  }

  // the far window, the last of the sunset in it
  p.rect(ux + 26, oy + 11, 13, 14, 'night');
  ditherGradient(p, ux + 27, oy + 12, 11, 12, ['indigo', 'violet', 'mauve', 'rosy']);
  p.rect(ux + 32, oy + 12, 1, 12, 'night');
  p.rect(ux + 27, oy + 21, 11, 1, 'night');
  px(p, ux + 29, oy + 20, 'honey');
  px(p, ux + 35, oy + 20, 'lamp');
  p.rect(ux + 25, oy + 25, 15, 1, 'slate');
  // the desk
  p.rect(ux + 10, top, 23, 1, 'stone');
  p.rect(ux + 11, top + 1, 21, bottom - top - 1, 'night');
  p.rect(ux + 13, top + 3, 17, bottom - top - 3, 'deep');
  // the monitor, still on
  p.rect(ux + 22, top - 7, 8, 6, 'ink');
  p.rect(ux + 23, top - 6, 6, 4, mod(n, 4) === 1 ? 'teal' : 'denim');
  p.rect(ux + 24, top - 5, 3, 1, 'sky');
  p.rect(ux + 25, top - 1, 2, 1, 'ink');
  // the glass desk lamp, left on, and its pool of light
  glowEllipse(p, ux + 15, top - 3, 8, 6, 'honey', [0.34, 0.16]);
  p.rect(ux + 14, top - 7, 3, 1, 'lamp');
  p.rect(ux + 13, top - 6, 5, 2, 'honey');
  p.rect(ux + 15, top - 4, 1, 3, 'sky');
  p.rect(ux + 14, top - 1, 3, 1, 'fog');
  // the chair, pushed in at the desk's end
  p.rect(ux + 2, top - 3, 6, 6, 'night');
  p.rect(ux + 3, top - 4, 4, 1, 'night');
  p.rect(ux + 4, top + 3, 1, bottom - top - 4, 'night');
  p.rect(ux + 2, bottom - 1, 6, 1, 'night');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; the scene repeats so every window shows a piece of it. */
const HARBOUR_P = 176;

/**
 * The harbour at dusk from the second floor, through a window: its glass from
 * (x, y), w x h. Positions count from the core's left edge `ox`, so windows
 * side by side show one continuous view.
 */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  // The horizon sits a fixed way up from the sill, so a taller window only shows more sky.
  const horizon = y + h - 9;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    // a few early stars
    if (hash2(hx, 3, 179) < 0.04) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 181) * Math.max(3, horizon - y - 12)), 'fog');
    }
    // the far shore and its lights
    const bump = Math.round(1.5 + Math.sin(hx / 8) + Math.sin(hx / 3.7) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 191) < 0.12) px(p, x + i, horizon, hash2(hx, 6, 193) < 0.5 ? 'honey' : 'lamp');
    // glints of the afterglow on the water
    if (hx % 6 === 0 && hash2(hx, 1, 197) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 199) * 5);
      p.rect(x + i, gy, 2 + (hx % 3), 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 60) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 60; k++) {
    const base = ox + k * HARBOUR_P;
    paintCrane(p, base + 114, horizon, 9);
    paintShip(p, base + 99, horizon + 5, 24);
    paintShip(p, base + 9, horizon + 4, 18);
    paintCrane(p, base + 62, horizon, 8);
  }
}

/** A container crane on the quay: two legs, a boom out over the water to the left, stays from the top. */
function paintCrane(p: Painter, x: number, horizon: number, tall: number): void {
  const boom = horizon - tall;
  const apex = boom - 5;
  p.rect(x - 3, horizon - 1, 13, 2, 'ink'); // the quay under it
  p.rect(x, boom, 1, tall, 'ink');
  p.rect(x + 5, boom, 1, tall, 'ink');
  p.rect(x, boom + 3, 6, 1, 'ink');
  p.rect(x - 12, boom, 21, 1, 'ink');
  p.rect(x + 2, apex, 1, 5, 'ink');
  for (let i = 1; i < 14; i++) px(p, x + 2 - i, apex + Math.floor((i * 5) / 14), 'ink');
  for (let i = 1; i < 5; i++) px(p, x + 2 + i, apex + i, 'ink');
  px(p, x + 2, apex - 1, 'red'); // the warning light
  p.rect(x - 7, boom + 1, 3, 2, 'night'); // the trolley
  px(p, x - 6, boom + 1, 'honey');
  p.rect(x - 6, boom + 3, 1, 2, 'night');
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
  p.rect(bx, waterline - 8, 4, 1, 'stone');
  px(p, bx + 1, waterline - 6, 'honey');
  p.rect(bx + 2, waterline - 10, 1, 2, 'ink');
  px(p, x + 2, waterline - 5, 'lamp');
  px(p, bx + 1, waterline + 1, 'lamp');
  px(p, bx + 1, waterline + 3, 'amber');
}

/** A window with a white frame and sill: the harbour behind the glass, a rolled-up blind at the top. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  // the blind, rolled up for the evening, and its cord
  p.rect(x + 2, y + 2, w - 4, 2, 'fog');
  p.rect(x + 2, y + 4, w - 4, 1, 'concrete');
  p.rect(x + w - 5, y + 5, 1, 7, 'fog');
  px(p, x + w - 5, y + 12, 'paper');
  // the sill and its shadow
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The conference room

/**
 * The projector screen, pulled down from its case: the lit surface from
 * (x, y), with this month's chart on it: five rising bars and a trend line.
 */
function paintScreen(p: Painter, x: number, y: number): void {
  const { w, h } = SCREEN;
  // the case on the wall, and the bar that weighs the screen down
  p.rect(x - 2, y - 2, w + 4, 2, 'stone');
  p.rect(x - 2, y - 2, w + 4, 1, 'concrete');
  p.rect(x - 1, y, w + 2, h + 1, 'slate');
  p.rect(x, y, w, h, 'paper');
  p.rect(x - 1, y + h, w + 2, 1, 'stone');
  p.rect(x + 19, y + h + 1, 1, 2, 'stone');
  px(p, x + 19, y + h + 3, 'ink');
  // the heading
  p.rect(x + 3, y + 2, 11, 1, 'slate');
  p.rect(x + 3, y + 4, 6, 1, 'fog');
  // the axes
  p.rect(x + 4, y + 7, 1, 13, 'stone');
  p.rect(x + 4, y + 19, 32, 1, 'stone');
  // the bars, the last one this month's
  const bars: readonly number[] = [3, 5, 4, 8, 10];
  bars.forEach((bh, i) => {
    const bx = x + 7 + i * 6;
    p.rect(bx, y + 19 - bh, 4, bh, i === bars.length - 1 ? 'amber' : 'teal');
    p.rect(bx + 3, y + 19 - bh, 1, bh, i === bars.length - 1 ? 'ember' : 'moss');
  });
  // the trend line climbing over them
  const line: readonly [number, number][] = [
    [8, 13],
    [14, 11],
    [20, 12],
    [26, 8],
    [32, 5],
  ];
  for (let i = 0; i + 1 < line.length; i++) {
    const [ax, ay] = line[i] ?? [0, 0];
    const [bx, by] = line[i + 1] ?? [0, 0];
    for (let s = 0; s <= bx - ax; s++) {
      px(p, x + ax + s, y + ay + Math.round(((by - ay) * s) / (bx - ax)), 'red');
    }
  }
  p.rect(x + 31, y + 4, 3, 1, 'red');
  px(p, x + 33, y + 5, 'red');
  px(p, x + 33, y + 6, 'red');
}

/** The projector hanging from the ceiling (`from`) on a pole, its box from `y`, its lens lit. */
function paintProjector(p: Painter, cx: number, from: number, y: number): void {
  p.rect(cx, from, 2, y - from, 'stone');
  p.rect(cx - 2, y - 1, 6, 1, 'slate');
  p.rect(cx - 6, y, 14, 5, 'paper');
  p.rect(cx - 6, y + 4, 14, 1, 'concrete');
  p.rect(cx + 7, y, 1, 5, 'concrete');
  p.rect(cx - 4, y + 1, 3, 3, 'ink');
  px(p, cx - 3, y + 2, 'cyan');
  p.rect(cx + 1, y + 1, 4, 1, 'concrete');
  p.rect(cx + 1, y + 3, 4, 1, 'concrete');
  px(p, cx + 6, y + 2, 'leaf');
}

/** The booking calendar by the door post: a red head, the days, one of them ringed. */
function paintCalendar(p: Painter, x: number, y: number): void {
  px(p, x + 3, y - 1, 'ink');
  p.rect(x + 1, y + 9, 7, 1, 'concrete');
  p.rect(x, y, 7, 9, 'paper');
  p.rect(x, y, 7, 2, 'red');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) px(p, x + 1 + c * 2, y + 3 + r * 2, 'stone');
  }
  px(p, x + 5, y + 5, 'red');
}

/** The conference table: a long wooden top seen a little from above, on two legs. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  const edge = top + TABLE_DEPTH;
  // the dark under it, and its shadow on the carpet
  p.rect(x + 2, edge + 1, w - 4, floorTop - edge - 1, 'night');
  ditherRect(p, x + 2, floorTop + 1, w - 4, 5, 'night', 8);
  p.rect(x + 1, floorTop + 6, w - 1, 1, 'night');
  // the legs
  for (const lx of [x + 1, x + w - 3]) {
    p.rect(lx, edge + 1, 2, floorTop + 6 - edge - 1, 'ember');
    p.rect(lx + 1, edge + 1, 1, floorTop + 6 - edge - 1, 'plum');
  }
  // the top: the far edge catches the light, the near edge shows its thickness
  p.rect(x, top, w, TABLE_DEPTH, 'amber');
  p.rect(x + 1, top, w - 2, 1, 'honey');
  p.rect(x, edge, w, 1, 'ember');
  p.rect(x + 1, edge + 1, w - 2, 1, 'plum');
  // the screen's light along the wood
  p.rect(x + 9, top + 2, 6, 1, 'honey');
  p.rect(x + 18, top + 2, 2, 1, 'honey');
  p.rect(x + 25, top + 1, 9, 1, 'honey');
}

/**
 * A conference chair pushed in on the near side, seen from behind: its teal
 * back from (x, y), 9 wide and standing a little above the table's edge, arm
 * rests, a stem and a base on castors.
 */
function paintChair(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 7, 1, 'teal');
  p.rect(x, y + 1, 9, 6, 'teal');
  p.rect(x + 2, y + 1, 4, 1, 'cyan');
  p.rect(x + 8, y + 1, 1, 6, 'moss');
  p.rect(x + 1, y + 6, 8, 1, 'moss');
  // arm rests
  p.rect(x - 1, y + 4, 1, 3, 'ink');
  p.rect(x + 9, y + 4, 1, 3, 'ink');
  // the seat's edge, the stem, the base and castors
  p.rect(x + 1, y + 7, 7, 1, 'ink');
  p.rect(x + 4, y + 8, 1, 1, 'stone');
  p.rect(x + 1, y + 9, 7, 1, 'ink');
  px(p, x + 1, y + 10, 'stone');
  px(p, x + 4, y + 10, 'stone');
  px(p, x + 7, y + 10, 'stone');
}

/** The conference phone at the head of the table: a low dark wedge with a lit key, on (x, y) 8 wide. */
function paintPhone(p: Painter, x: number, y: number): void {
  p.rect(x + 2, y - 2, 4, 1, 'stone');
  p.rect(x + 1, y - 1, 6, 1, 'slate');
  p.rect(x, y, 8, 1, 'ink');
  px(p, x + 3, y - 1, 'cyan');
  px(p, x + 1, y, 'fog');
  px(p, x + 6, y, 'fog');
  // its shadow on the wood
  p.rect(x + 1, y + 1, 7, 1, 'ember');
}

// ---------------------------------------------------------------------------
// To the right of the core

/** A whiteboard from (x, y), 32x22: points on the left, a little flow of boxes, pens on the tray. */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 22, 'concrete');
  p.rect(x + 1, y + 1, 30, 20, 'paper');
  // three points, the first ticked
  for (let i = 0; i < 3; i++) {
    px(p, x + 3, y + 4 + i * 4, i === 0 ? 'leaf' : 'denim');
    p.rect(x + 5, y + 4 + i * 4, [8, 6, 9][i] ?? 6, 1, 'denim');
  }
  // two boxes joined by an arrow, and a circled note under them
  p.rect(x + 17, y + 3, 5, 4, 'teal');
  p.rect(x + 18, y + 4, 3, 2, 'paper');
  p.rect(x + 23, y + 5, 2, 1, 'red');
  p.rect(x + 25, y + 3, 5, 4, 'teal');
  p.rect(x + 26, y + 4, 3, 2, 'paper');
  p.rect(x + 18, y + 11, 10, 1, 'red');
  p.rect(x + 18, y + 16, 10, 1, 'red');
  p.rect(x + 17, y + 12, 1, 4, 'red');
  p.rect(x + 28, y + 12, 1, 4, 'red');
  p.rect(x + 20, y + 13, 6, 1, 'slate');
  p.rect(x + 20, y + 15, 4, 1, 'slate');
  // the tray: pens and the eraser
  p.rect(x + 2, y + 22, 28, 1, 'stone');
  p.rect(x + 5, y + 21, 3, 1, 'red');
  p.rect(x + 9, y + 21, 3, 1, 'denim');
  p.rect(x + 22, y + 20, 4, 2, 'ink');
  p.rect(x + 1, y + 23, 31, 1, 'concrete');
}

/** A sideboard with the refreshments on it (a coffee pot, cups, a plate), a lamp poster above. */
function paintSideboard(p: Painter, x: number, oy: number, floorTop: number): void {
  paintLampPoster(p, x + 14, oy + 11, 1);
  const cx = x + 5;
  const top = oy + 40;
  const bottom = floorTop + 1;
  p.rect(cx, top, 34, bottom - top, 'ember');
  p.rect(cx - 1, top, 36, 1, 'honey');
  p.rect(cx - 1, top + 1, 36, 1, 'amber');
  for (const dx of [2, 18]) {
    p.rect(cx + dx, top + 4, 14, bottom - top - 6, 'amber');
    p.rect(cx + dx + 13, top + 4, 1, bottom - top - 6, 'plum');
    p.rect(cx + dx, bottom - 3, 14, 1, 'plum');
  }
  px(p, cx + 14, top + 9, 'honey');
  px(p, cx + 19, top + 9, 'honey');
  // the coffee pot
  p.rect(cx + 4, top - 8, 5, 8, 'stone');
  p.rect(cx + 4, top - 8, 1, 8, 'fog');
  p.rect(cx + 4, top - 9, 5, 1, 'ink');
  p.rect(cx + 5, top - 10, 3, 1, 'ink');
  px(p, cx + 3, top - 7, 'ink');
  p.rect(cx + 9, top - 6, 1, 4, 'ink');
  px(p, cx + 6, top - 3, 'red');
  // a stack of cups and two set out
  p.rect(cx + 12, top - 5, 3, 5, 'paper');
  p.rect(cx + 12, top - 3, 3, 1, 'fog');
  p.rect(cx + 12, top - 1, 3, 1, 'fog');
  p.rect(cx + 17, top - 2, 3, 2, 'paper');
  px(p, cx + 20, top - 2, 'fog');
  // a plate of biscuits
  p.rect(cx + 23, top - 1, 8, 1, 'fog');
  p.rect(cx + 24, top - 2, 2, 1, 'tan');
  p.rect(cx + 27, top - 2, 2, 1, 'amber');
  px(p, cx + 26, top - 3, 'tan');
}

// ---------------------------------------------------------------------------
// Above the core

/** A framed poster of one of the company's glass desk lamps, lit; two colourways. */
function paintLampPoster(p: Painter, x: number, y: number, variant: 0 | 1): void {
  p.rect(x + 1, y + 20, 16, 1, 'concrete');
  p.rect(x, y, 16, 20, 'slate');
  p.rect(x + 1, y + 1, 14, 18, variant === 0 ? 'deep' : 'maroon');
  glowEllipse(p, x + 8, y + 7, 6, 5, 'honey', [0.4, 0.2]);
  // the shade
  p.rect(x + 6, y + 4, 4, 1, 'lamp');
  p.rect(x + 5, y + 5, 6, 2, 'honey');
  p.rect(x + 4, y + 7, 8, 1, 'lamp');
  // the glass body and its foot
  p.rect(x + 7, y + 8, 2, 2, 'sky');
  p.rect(x + 6, y + 10, 4, 3, variant === 0 ? 'cyan' : 'sky');
  px(p, x + 6, y + 10, 'paper');
  p.rect(x + 5, y + 13, 6, 1, 'fog');
  p.rect(x + 2, y + 14, 12, 1, 'amber');
  // the line of print under it
  p.rect(x + 4, y + 16, 8, 1, 'fog');
}

/** The air conditioner high on the wall. */
function paintAirConditioner(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 9, 27, 1, 'concrete');
  p.rect(x, y, 28, 9, 'paper');
  p.rect(x, y + 8, 28, 1, 'stone');
  p.rect(x + 27, y, 1, 9, 'concrete');
  p.rect(x + 2, y + 5, 23, 1, 'concrete');
  p.rect(x + 2, y + 7, 23, 1, 'slate');
  px(p, x + 24, y + 2, 'leaf');
}

export const MEETING_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...HEAD_OF_TABLE, side: 'right' },
    // Alone, Dan stands at the head of the table too; with Ms. Carter there he
    // stands a step behind her, under the window.
    coworker: {
      sprite: COWORKER_SPRITE,
      ...HEAD_OF_TABLE,
      side: 'right',
      beside: { x: 96, y: HEAD_OF_TABLE.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 86, y: 25 } },
  rest: {
    left: { x: TABLE.x + 2, y: PROP_TOP },
    right: { x: TABLE.x + 14, y: PROP_TOP },
  },
};
