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
import { REPORTER_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The media stage: Harbor Trading's conference room set up for the local
 * paper's interview, on an October afternoon turning to evening. From the
 * left: the glass wall onto the office (you stand in front of it), the
 * company's lamp emblem on the wall behind the table, a pendant lamp,
 * the clock and a window onto the harbour at dusk. On the long
 * table a Lantern desk lamp is lit at your end for the photographs; the
 * reporter's notebook and his tablet, propped up and recording, lie further
 * along; handed-over things rest on the tabletop. Ms. Carter stands at the
 * head of the table; Ryan Cole (or Dan) stands beside her by the camera on
 * its tripod in the corner.
 *
 * The coworker backdrop is your own desk out in the office a week later: a
 * small radio on the desk playing the paper's programme, the monitor and a
 * cork board, harbour windows on both sides; Dan leans on the desk's far end.
 *
 * Both fill any size: the 128x64 core sits centred near the bottom; extra
 * wall goes above (framed newspaper clippings, taller windows, then a darker
 * upper wall with high windows onto the night sky), and the room continues
 * to both sides. Painted through the Painter interface, palette colours only,
 * whole pixels.
 */

const FLOOR_TOP = 56;
/** The rail between the light upper wall and the darker lower wall. */
const RAIL_Y = 43;

/** The conference table: left edge, width and the y of its far edge, in core pixels. */
const TABLE = { x: 35, w: 46, top: 48 } as const;
/** Your desk in the office backdrop. */
const DESK = { x: 36, w: 52, top: 48 } as const;
/** 24x24 pictures stand on the top with their shadow on it. */
const PROP_TOP = 28;

/** The post where the glass wall ends; panes are counted leftwards from it. */
const GLASS_END = 32;
const GLASS_TOP = 5;
const PANE_W = 20;
/** One stretch of the office seen through the glass. */
const OFFICE_W = 40;
/** The harbour window in the core: its outer frame. */
const WINDOW = { x: 91, y: 4, w: 30, h: 28 } as const;
/** The camera's tripod: where its middle leg stands. */
const TRIPOD_X = 111;
/** The pendant lamp over the table. */
const LAMP_X = 70;

/** Where Ms. Carter stands at the head of the table (and whoever talks to you alone). */
const HEAD = { x: 76, y: 39 } as const;
/** Ryan, beside her by the camera, when both are there. */
const BY_CAMERA = { x: 94, y: 39 } as const;
/** Dan, beside her a step further along, when both are there. */
const FURTHER = { x: 96, y: 39 } as const;

/** Width of one bay beside the core. */
const BAY_W = 44;
type Bay = 'window' | 'shelf' | 'clippings';
const RIGHT_BAYS: readonly Bay[] = ['clippings', 'window', 'shelf', 'window'];
type DeskBay = 'desk' | 'window' | 'cabinet';
const OFFICE_LEFT: readonly DeskBay[] = ['desk', 'window', 'cabinet'];
const OFFICE_RIGHT: readonly DeskBay[] = ['desk', 'cabinet', 'window'];

/** Wall above the core needed for the clippings, and for the upper wall. */
const CLIPPINGS_MIN = 22;
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 24;
/** Gap between the high windows under the ceiling. */
const HIGH_GAP = 84;

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
// The conference room

/** Paints the conference room, set up for the interview, to fill a w x h stage. */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  const bays: [number, Bay][] = [];
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, RIGHT_BAYS[i % RIGHT_BAYS.length] ?? 'window']);
  }
  const lamps = [ox + LAMP_X];
  for (const [x, kind] of bays) if (kind === 'shelf') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it, warmer still round the Lantern on the table.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 14, 30, 22, 'honey', [0.2, 0.12, 0.06]);
  glowEllipse(p, ox + 40, oy + 36, 22, 14, 'honey', [0.24, 0.14, 0.07]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);

  // Framed clippings of the paper's stories, up the wall when there is room.
  if (oy >= CLIPPINGS_MIN) {
    for (let x = ox + 6, i = 0; x + 14 > 0; x -= OFFICE_W, i++) paintClipping(p, x, oy - 19, i);
    paintClipping(p, ox + 40, oy - 19, 7);
    paintClipping(p, ox + 55, oy - 17, 8);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  paintGlassWall(p, ox, oy, floorTop);
  for (const [x, kind] of bays) {
    if (kind === 'window') paintWindow(p, x + 7, winTop, WINDOW.w, winH, ox);
    else if (kind === 'shelf') paintSampleShelf(p, x, oy, floorTop);
    else paintClippingBoard(p, x + 6, oy + 8);
  }

  // The core: the emblem, the clock, the harbour window, the camera.
  paintEmblem(p, ox + 47, oy + 11);
  paintClock(p, ox + 83, oy + 13);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  for (const lx of lamps) paintPendant(p, lx, cornice, oy);
  paintPlant(p, ox + 118, oy + 36);
  paintTripod(p, ox + TRIPOD_X, oy + 26, floorTop);

  paintTable(p, ox + TABLE.x, oy + TABLE.top, TABLE.w, floorTop);
  // what lies on the table for the interview
  paintLantern(p, ox + TABLE.x + 2, oy + TABLE.top);
  paintNotebook(p, ox + 57, oy + TABLE.top + 1);
  paintTablet(p, ox + 67, oy + TABLE.top);
  for (const cx of [46, 62]) paintChair(p, ox + cx, oy + TABLE.top + 3);
}

/** The darker lower wall under a pale rail, with a skirting board. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'slate');
  p.rect(0, top, w, 1, 'paper');
  p.rect(0, top + 1, w, 1, 'concrete');
  for (let x = mod(ox + 3, 16) - 16; x < w; x += 16) {
    p.rect(x, top + 4, 1, floorTop - top - 7, 'night');
    px(p, x + 1, top + 4, 'stone');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Carpet: a plum weave with a short fleck, counted from the core so it never shifts. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'night');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 2 < h; row++) {
    const y = floorTop + 2 + row * 2;
    for (let x = mod(ox + row * 3, 8) - 8; x < w; x += 8) {
      p.rect(x, y, 2, 1, row % 2 === 0 ? 'plum' : 'slate');
    }
  }
}

/** A dark pendant lamp hanging from the ceiling (`from`) down to the core. */
function paintPendant(p: Painter, cx: number, from: number, oy: number): void {
  p.rect(cx, from, 1, oy + 5 - from, 'ink');
  p.rect(cx - 2, oy + 5, 5, 1, 'ink');
  p.rect(cx - 3, oy + 6, 7, 2, 'night');
  p.rect(cx - 4, oy + 8, 9, 1, 'ink');
  p.rect(cx - 2, oy + 9, 5, 1, 'honey');
  px(p, cx, oy + 10, 'lamp');
  px(p, cx - 2, oy + 6, 'stone');
}

/**
 * The wall above `cornice` on a tall stage: a darker band under the ceiling
 * with a ribbon of high windows onto the night sky.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'concrete');
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  const wh = Math.min(56, cornice - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((cornice - wh) / 2));
    const first = Math.floor(-(ox + 64) / HIGH_GAP) - 1;
    for (let k = first; ox + 64 + k * HIGH_GAP - 20 < w; k++) {
      paintHighWindow(p, ox + 64 + k * HIGH_GAP, top, wh, k);
    }
  }
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'fog');
  p.rect(0, cornice + 2, w, 1, 'stone');
}

/** One high window centred on `cx`: the night sky with stars, a round moon in every third. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 20, top - 1, 41, wh + 2, 'paper');
  ditherGradient(p, cx - 19, top, 39, wh, ['deep', 'deep', 'indigo', 'dusk']);
  for (let i = 0; i < 7; i++) {
    const sx = cx - 18 + Math.floor(hash2(i, n, 311) * 37);
    const sy = top + 1 + Math.floor(hash2(i, n, 313) * (wh - 3));
    px(p, sx, sy, hash2(i, n, 317) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 2) {
    p.rect(cx + 8, top + 4, 4, 4, 'paper');
    p.rect(cx + 9, top + 3, 2, 6, 'paper');
    p.rect(cx + 7, top + 5, 6, 2, 'paper');
    px(p, cx + 10, top + 5, 'fog');
  }
  p.rect(cx - 7, top, 1, wh, 'paper');
  p.rect(cx + 6, top, 1, wh, 'paper');
  p.rect(cx - 20, top + wh + 1, 41, 1, 'stone');
}

/** A framed newspaper clipping: a pale page with a headline bar, a photo block and grey lines. */
function paintClipping(p: Painter, x: number, y: number, n: number): void {
  p.rect(x, y, 14, 17, 'ink');
  p.rect(x + 1, y + 1, 12, 15, 'paper');
  p.rect(x + 2, y + 2, 10, 2, 'stone');
  const photoLeft = mod(n, 2) === 0;
  const fx = photoLeft ? x + 2 : x + 7;
  p.rect(fx, y + 5, 5, 4, mod(n, 3) === 0 ? 'denim' : 'tan');
  px(p, fx + 2, y + 6, 'honey');
  const tx = photoLeft ? x + 8 : x + 2;
  for (let r = 0; r < 4; r++) p.rect(tx, y + 5 + r * 1, 4, 1, r % 2 === 0 ? 'fog' : 'paper');
  for (let r = 0; r < 3; r++) p.rect(x + 2, y + 10 + r * 2, r === 2 ? 6 : 10, 1, 'fog');
  p.rect(x + 1, y + 17, 13, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The glass wall and the office behind it

/**
 * The glass wall from the left edge of the stage to its end post: the office
 * behind it with the desk lamps on, posts, two frosted lines at eye level.
 */
function paintGlassWall(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x1 = ox + GLASS_END;
  const top = oy + GLASS_TOP;
  const bottom = floorTop - 2;
  if (x1 <= 0) return;

  const glass = within(p, 0, top, x1, bottom - top);
  ditherGradient(glass, 0, top, x1, bottom - top, ['dusk', 'dusk', 'indigo', 'indigo']);
  for (let k = -1; x1 + (k + 1) * OFFICE_W > 0; k--) {
    paintOfficeBeyond(glass, x1 + k * OFFICE_W, oy, bottom, k);
  }
  for (let x = x1 - PANE_W; x > -PANE_W; x -= PANE_W) {
    for (let i = 0; i < 5; i++) px(glass, x + 8 - i, top + 3 + i * 2, 'violet');
    for (let i = 0; i < 2; i++) px(glass, x + 12 - i, top + 4 + i * 2, 'violet');
  }
  for (const dy of [28, 30]) p.rect(0, oy + dy, x1, 1, 'sky');

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

/** One stretch of the office seen through the glass, from `ux`: a far window, a desk with its lamp on. */
function paintOfficeBeyond(p: Painter, ux: number, oy: number, bottom: number, n: number): void {
  p.rect(ux + 10, oy + 8, 12, 1, 'stone');
  p.rect(ux + 11, oy + 9, 10, 1, 'concrete');
  const top = oy + 45;
  // the far window, the sunset fading
  p.rect(ux + 24, oy + 12, 13, 15, 'night');
  ditherGradient(p, ux + 25, oy + 13, 11, 13, ['indigo', 'violet', 'mauve', 'rosy']);
  p.rect(ux + 30, oy + 13, 1, 13, 'night');
  px(p, ux + 27, oy + 23, 'honey');
  px(p, ux + 34, oy + 24, 'lamp');
  // a filing cabinet or a shelf of binders
  if (mod(n, 2) === 0) {
    p.rect(ux + 2, oy + 30, 8, bottom - oy - 30, 'slate');
    for (let d = 0; d < 3; d++) p.rect(ux + 3, oy + 33 + d * 7, 6, 1, 'night');
  } else {
    p.rect(ux + 2, oy + 24, 9, bottom - oy - 24, 'night');
    const binders: readonly PaletteName[] = ['maroon', 'moss', 'denim', 'stone'];
    for (let s = 0; s < 2; s++) {
      for (let b = 0; b < 4; b++) {
        const c = binders[Math.floor(hash2(b, s + n * 2, 331) * binders.length)] ?? 'stone';
        p.rect(ux + 3 + b * 2, oy + 26 + s * 9, 2, 6, c);
      }
    }
  }
  // the desk, the monitor and a desk lamp left on
  p.rect(ux + 12, top, 22, 1, 'stone');
  p.rect(ux + 13, top + 1, 20, bottom - top - 1, 'night');
  p.rect(ux + 25, top - 7, 8, 6, 'ink');
  p.rect(ux + 26, top - 6, 6, 4, mod(n, 3) === 0 ? 'teal' : 'denim');
  p.rect(ux + 28, top - 1, 2, 1, 'ink');
  glowEllipse(p, ux + 16, top - 3, 8, 6, 'honey', [0.32, 0.15]);
  p.rect(ux + 15, top - 7, 3, 1, 'ink');
  p.rect(ux + 15, top - 6, 3, 3, 'honey');
  p.rect(ux + 16, top - 3, 1, 2, 'ink');
  p.rect(ux + 14, top - 1, 5, 1, 'ink');
}

// ---------------------------------------------------------------------------
// The harbour outside

/** One period of the harbour, in pixels; windows side by side show one continuous view. */
const HARBOUR_P = 160;

/** The harbour at dusk through a window's glass at (x, y), w x h, counted from the core's left edge. */
function paintHarbour(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 8;
  const sky: PaletteName[] =
    h > 30
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, HARBOUR_P);
    if (hash2(hx, 3, 341) < 0.035) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 343) * Math.max(3, horizon - y - 12)), 'fog');
    }
    const bump = Math.round(1.5 + Math.sin(hx / 7) + Math.sin(hx / 3.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 347) < 0.12) px(p, x + i, horizon, hash2(hx, 6, 349) < 0.5 ? 'honey' : 'lamp');
    if (hx % 5 === 0 && hash2(hx, 1, 353) < 0.6) {
      const gy = horizon + 2 + Math.floor(hash2(hx, 2, 359) * 4);
      p.rect(x + i, gy, 2, 1, gy < horizon + 4 ? 'rosy' : 'violet');
    }
  }
  // a lighthouse on the far point and a crane at the quay, once a period
  const first = Math.floor((x - ox - 40) / HARBOUR_P);
  for (let k = first; ox + k * HARBOUR_P < x + w + 40; k++) {
    const base = ox + k * HARBOUR_P;
    paintLighthouse(p, base + 108, horizon);
    paintCrane(p, base + 40, horizon);
  }
}

function paintLighthouse(p: Painter, x: number, horizon: number): void {
  p.rect(x - 3, horizon - 2, 8, 2, 'ink');
  p.rect(x, horizon - 9, 2, 7, 'paper');
  p.rect(x, horizon - 6, 2, 1, 'red');
  p.rect(x - 1, horizon - 11, 4, 2, 'ink');
  px(p, x, horizon - 11, 'honey');
  px(p, x + 1, horizon - 11, 'lamp');
  p.rect(x + 3, horizon - 11, 4, 1, 'honey', 0.5);
}

function paintCrane(p: Painter, x: number, horizon: number): void {
  const boom = horizon - 8;
  p.rect(x - 2, horizon - 1, 11, 2, 'ink');
  p.rect(x, boom, 1, 8, 'ink');
  p.rect(x + 4, boom, 1, 8, 'ink');
  p.rect(x, boom + 3, 5, 1, 'ink');
  p.rect(x - 10, boom, 18, 1, 'ink');
  p.rect(x + 2, boom - 4, 1, 4, 'ink');
  for (let i = 1; i < 11; i++) px(p, x + 2 - i, boom - 4 + Math.floor((i * 4) / 11), 'ink');
  px(p, x + 2, boom - 5, 'red');
}

/** A window with a white frame and sill: the harbour behind the glass, the blind rolled up. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  p.rect(x, y, w, h, 'paper');
  paintHarbour(p, x + 2, y + 2, w - 4, h - 4, ox);
  p.rect(x + Math.floor(w / 2), y + 2, 1, h - 4, 'paper');
  p.rect(x + 2, y + 2, w - 4, 2, 'fog');
  p.rect(x + 2, y + 4, w - 4, 1, 'concrete');
  p.rect(x + 4, y + 5, 1, 6, 'fog');
  px(p, x + 4, y + 11, 'paper');
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The room's furniture

/**
 * The company's emblem on the wall behind the table, for the photographs: a
 * dark rounded plaque with a lit lamp shape and a short line under it.
 */
function paintEmblem(p: Painter, x: number, y: number): void {
  const w = 18;
  const h = 14;
  p.rect(x + 1, y, w - 2, h, 'night');
  p.rect(x, y + 1, w, h - 2, 'night');
  p.rect(x + 1, y + h, w - 2, 1, 'concrete');
  p.rect(x + 2, y + 1, w - 4, 1, 'slate');
  // the lamp: a glowing shade on a stem
  const cx = x + 8;
  p.rect(cx - 2, y + 3, 6, 1, 'amber');
  p.rect(cx - 3, y + 4, 8, 2, 'honey');
  p.rect(cx - 3, y + 6, 8, 1, 'amber');
  p.rect(cx, y + 7, 2, 3, 'paper');
  p.rect(cx - 2, y + 10, 6, 1, 'paper');
  px(p, cx - 2, y + 4, 'paper');
  // the name, as a short line
  p.rect(x + 4, y + 12, 10, 1, 'fog');
}

/** The camera on its tripod in the corner, lens towards the table; the middle leg stands at x. */
function paintTripod(p: Painter, x: number, top: number, floorTop: number): void {
  const head = top + 8;
  const foot = floorTop + 2;
  // three legs, splayed
  for (let yy = head; yy < foot; yy++) {
    const t = (yy - head) / (foot - head);
    const spread = Math.round(t * 7);
    px(p, x - spread, yy, 'ink');
    px(p, x + spread, yy, 'ink');
    if (yy % 2 === 0) px(p, x - spread + 1, yy, 'stone');
  }
  p.rect(x, head, 1, foot - head - 4, 'stone');
  p.rect(x - 7, foot, 2, 1, 'ink');
  p.rect(x + 6, foot, 2, 1, 'ink');
  p.rect(x - 2, head + 6, 5, 1, 'stone');
  // the head and the camera, the lens to the left
  p.rect(x - 1, head - 1, 3, 1, 'ink');
  p.rect(x - 4, top + 1, 10, 6, 'ink');
  p.rect(x - 3, top + 2, 8, 4, 'night');
  p.rect(x - 1, top, 4, 1, 'ink');
  px(p, x + 4, top + 2, 'red');
  p.rect(x - 8, top + 2, 4, 4, 'ink');
  p.rect(x - 9, top + 3, 1, 2, 'slate');
  px(p, x - 7, top + 3, 'sky');
  p.rect(x + 2, top + 3, 2, 2, 'stone');
}

/**
 * The long table: a wooden top seen from a little above, its far edge at y,
 * the front edge and two legs down to the floor.
 */
function paintTable(p: Painter, x: number, y: number, w: number, floorTop: number): void {
  p.rect(x, floorTop, w, 2, 'ink', 0.45);
  p.rect(x + 2, y + 6, 2, floorTop - y - 4, 'ember');
  p.rect(x + w - 4, y + 6, 2, floorTop - y - 4, 'ember');
  p.rect(x + 2, y + 6, 1, floorTop - y - 4, 'plum');
  p.rect(x, y, w, 4, 'amber');
  p.rect(x, y, w, 1, 'ember');
  for (let i = 3; i < w - 2; i += 9) p.rect(x + i, y + 2, 5, 1, 'ember');
  p.rect(x, y + 4, w, 2, 'ember');
  p.rect(x, y + 4, w, 1, 'honey', 0.35);
  p.rect(x, y + 6, w, 1, 'plum');
}

/** A teal chair pushed in at the near side of the table, its back hiding the edge. */
function paintChair(p: Painter, cx: number, y: number): void {
  p.rect(cx - 4, y, 9, 5, 'teal');
  p.rect(cx - 4, y, 9, 1, 'cyan');
  p.rect(cx - 4, y + 4, 9, 1, 'moss');
  p.rect(cx - 5, y + 1, 1, 3, 'ink');
  p.rect(cx + 5, y + 1, 1, 3, 'ink');
  p.rect(cx, y + 5, 1, 2, 'ink');
  p.rect(cx - 3, y + 7, 7, 1, 'ink');
}

/**
 * A Lantern desk lamp lit for the photographs, standing on the top at
 * (x, surface): a square base, a slim stem and the glowing lantern shade
 * with a dark cap, and the warm pool it throws on the table.
 */
function paintLantern(p: Painter, x: number, surface: number): void {
  glowEllipse(p, x + 3, surface - 6, 11, 9, 'honey', [0.36, 0.2, 0.1]);
  p.rect(x - 2, surface + 1, 11, 2, 'honey', 0.45);
  p.rect(x, surface - 1, 7, 1, 'ink');
  p.rect(x + 1, surface - 2, 5, 1, 'slate');
  p.rect(x + 3, surface - 7, 1, 5, 'ink');
  p.rect(x + 1, surface - 13, 5, 1, 'ink');
  p.rect(x + 2, surface - 14, 3, 1, 'ink');
  p.rect(x + 1, surface - 12, 5, 5, 'honey');
  p.rect(x + 2, surface - 11, 3, 3, 'paper');
  p.rect(x + 1, surface - 7, 5, 1, 'amber');
  px(p, x + 1, surface - 12, 'lamp');
  px(p, x + 5, surface - 8, 'lamp');
}

/** The reporter's notebook lying open on the top, a pen across it. */
function paintNotebook(p: Painter, x: number, y: number): void {
  p.rect(x, y, 8, 2, 'paper');
  p.rect(x + 4, y, 1, 2, 'fog');
  p.rect(x + 1, y, 2, 1, 'fog');
  p.rect(x + 5, y + 1, 2, 1, 'fog');
  p.rect(x, y + 2, 8, 1, 'ember');
  p.rect(x + 2, y - 1, 5, 1, 'denim');
  px(p, x + 7, y - 1, 'ink');
}

/** His tablet, propped up on its case and recording: a waveform and a red dot on the screen. */
function paintTablet(p: Painter, x: number, surface: number): void {
  p.rect(x, surface - 5, 8, 6, 'ink');
  p.rect(x + 1, surface - 4, 6, 4, 'deep');
  p.rect(x + 2, surface - 2, 1, 1, 'cyan');
  p.rect(x + 3, surface - 3, 1, 2, 'cyan');
  p.rect(x + 4, surface - 2, 1, 1, 'cyan');
  px(p, x + 5, surface - 3, 'cyan');
  px(p, x + 6, surface - 4, 'red');
  p.rect(x + 1, surface + 1, 7, 1, 'slate');
  p.rect(x + 7, surface - 3, 1, 4, 'slate');
}

// ---------------------------------------------------------------------------
// Bays beside the core

/** A low shelf of the company's sample lamps under a pendant, two of them lit. */
function paintSampleShelf(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 40;
  p.rect(x + 6, top, 32, floorTop - top, 'ember');
  p.rect(x + 6, top, 32, 1, 'amber');
  p.rect(x + 7, top + 3, 30, 1, 'plum');
  p.rect(x + 21, top + 3, 1, floorTop - top - 3, 'plum');
  px(p, x + 18, top + 8, 'honey');
  px(p, x + 24, top + 8, 'honey');
  paintLantern(p, x + 9, top);
  // a plain grey lamp of the old range
  p.rect(x + 20, top - 1, 5, 1, 'ink');
  p.rect(x + 22, top - 7, 1, 6, 'stone');
  p.rect(x + 20, top - 9, 5, 2, 'concrete');
  paintLantern(p, x + 28, top);
}

/** A cork board pinned with the paper's past stories about local firms. */
function paintClippingBoard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 24, 'ember');
  p.rect(x + 1, y + 1, 30, 22, 'amber');
  ditherRect(p, x + 1, y + 1, 30, 22, 'ember', 4);
  const notes: readonly [number, number, PaletteName][] = [
    [3, 3, 'paper'],
    [13, 2, 'paper'],
    [23, 4, 'fog'],
    [5, 13, 'fog'],
    [17, 12, 'paper'],
  ];
  for (const [dx, dy, c] of notes) {
    p.rect(x + dx, y + dy, 7, 8, c);
    p.rect(x + dx + 1, y + dy + 1, 5, 1, 'stone');
    p.rect(x + dx + 1, y + dy + 3, 5, 1, 'fog');
    p.rect(x + dx + 1, y + dy + 5, 3, 1, 'fog');
    px(p, x + dx + 3, y + dy, 'red');
  }
  p.rect(x, y + 24, 32, 1, 'stone');
}

// ---------------------------------------------------------------------------
// The office backdrop: your desk, the radio on

/** Paints your desk out in the office, the radio playing the paper's programme. */
function paintOffice(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const winTop = oy + 4 - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + 32 - winTop;

  const left: [number, DeskBay][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    left.push([x, OFFICE_LEFT[i % OFFICE_LEFT.length] ?? 'window']);
  }
  const right: [number, DeskBay][] = [];
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    right.push([x, OFFICE_RIGHT[i % OFFICE_RIGHT.length] ?? 'window']);
  }
  const bays = [...left, ...right];
  const lights = [ox + 62];
  for (const [x, kind] of bays) if (kind !== 'window') lights.push(x + BAY_W / 2);

  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lights) glowEllipse(p, lx, oy + 10, 30, 20, 'paper', [0.16, 0.08]);
  glowEllipse(p, ox + 41, oy + 40, 18, 12, 'honey', [0.22, 0.12, 0.06]);
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);
  if (oy >= CLIPPINGS_MIN) {
    paintClock(p, ox + 62, oy - 10);
    for (const [x, kind] of bays) if (kind === 'cabinet') paintClipping(p, x + 15, oy - 18, x);
  }

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintTiles(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') paintWindow(p, x + 7, winTop, WINDOW.w, winH, ox);
    else if (kind === 'cabinet') paintCabinet(p, x + 12, oy, floorTop);
    else paintOtherDesk(p, x, oy, floorTop);
  }
  for (const lx of lights) paintPanelLight(p, lx, cornice, oy);

  // The core: a harbour window behind you, the cork board, another window, the plant.
  paintWindow(p, ox + 3, winTop, 28, winH, ox);
  paintCorkBoard(p, ox + 46, oy + 7);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintPlant(p, ox + 115, oy + 36);

  paintDesk(p, ox + DESK.x, oy + DESK.top, DESK.w, floorTop);
  paintMonitor(p, ox + 62, oy + DESK.top);
  paintRadio(p, ox + DESK.x + 1, oy + DESK.top);
  paintMug(p, ox + 54, oy + DESK.top);
}

/** Office floor: grey tiles with dark joints, counted from the core. */
function paintTiles(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let y = floorTop + 4; y < h; y += 5) p.rect(0, y, w, 1, 'night');
  for (let row = 0; floorTop + 1 + row * 5 < h; row++) {
    const y = floorTop + 1 + row * 5;
    for (let x = mod(ox + row * 8, 16) - 16; x < w; x += 16) p.rect(x, y, 1, 3, 'night');
  }
}

/** A flat ceiling light: a pale panel on short rods from `from`. */
function paintPanelLight(p: Painter, cx: number, from: number, oy: number): void {
  if (oy + 1 > from) {
    p.rect(cx - 6, from, 1, oy + 1 - from, 'stone');
    p.rect(cx + 6, from, 1, oy + 1 - from, 'stone');
  }
  p.rect(cx - 8, oy + 1, 17, 2, 'paper');
  p.rect(cx - 8, oy + 3, 17, 1, 'concrete');
}

/** Your desk: a light top seen from a little above and a drawer pedestal at the near end. */
function paintDesk(p: Painter, x: number, y: number, w: number, floorTop: number): void {
  p.rect(x, floorTop, w, 2, 'ink', 0.45);
  p.rect(x + 2, y + 5, 2, floorTop - y - 3, 'stone');
  p.rect(x + w - 14, y + 5, 12, floorTop - y - 3, 'stone');
  p.rect(x + w - 13, y + 7, 10, 1, 'slate');
  p.rect(x + w - 13, y + 11, 10, 1, 'slate');
  p.rect(x + w - 9, y + 9, 2, 1, 'fog');
  p.rect(x, y, w, 3, 'tan');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x, y + 3, w, 2, 'ember');
  p.rect(x, y + 5, w, 1, 'plum');
}

/**
 * The small radio playing the paper's programme: a maroon cabinet with a
 * speaker grille, a lit dial, a telescopic aerial and the sound going out.
 */
function paintRadio(p: Painter, x: number, surface: number): void {
  glowEllipse(p, x + 5, surface - 4, 9, 6, 'honey', [0.22, 0.1]);
  p.rect(x, surface - 7, 11, 7, 'maroon');
  p.rect(x, surface - 7, 11, 1, 'red');
  p.rect(x, surface - 1, 11, 1, 'ink');
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 3; gx++) px(p, x + 1 + gx * 2, surface - 5 + gy * 2, 'ink');
  }
  p.rect(x + 7, surface - 5, 3, 2, 'honey');
  px(p, x + 8, surface - 5, 'ember');
  px(p, x + 8, surface - 2, 'fog');
  for (let i = 0; i < 6; i++) px(p, x + 9 + Math.floor(i / 2), surface - 8 - i, 'concrete');
  // sound waves, to the right
  px(p, x + 13, surface - 6, 'honey');
  p.rect(x + 14, surface - 5, 1, 2, 'honey');
  px(p, x + 13, surface - 2, 'honey');
}

/** The monitor at the back of the desk, a keyboard in front of it. */
function paintMonitor(p: Painter, x: number, surface: number): void {
  p.rect(x, surface - 12, 14, 9, 'ink');
  p.rect(x + 1, surface - 11, 12, 7, 'denim');
  p.rect(x + 2, surface - 10, 7, 1, 'sky');
  p.rect(x + 2, surface - 8, 9, 1, 'stone');
  p.rect(x + 2, surface - 6, 5, 1, 'stone');
  p.rect(x + 6, surface - 3, 2, 2, 'ink');
  p.rect(x + 4, surface - 1, 6, 1, 'ink');
  p.rect(x - 2, surface + 1, 12, 1, 'concrete');
}

function paintMug(p: Painter, x: number, surface: number): void {
  p.rect(x, surface - 3, 3, 4, 'paper');
  px(p, x + 3, surface - 2, 'paper');
  p.rect(x, surface - 3, 3, 1, 'ember');
}

/** The cork board over your desk: notes, a launch photo, the clipping of a story pinned up. */
function paintCorkBoard(p: Painter, x: number, y: number): void {
  p.rect(x, y, 34, 22, 'ember');
  p.rect(x + 1, y + 1, 32, 20, 'amber');
  ditherRect(p, x + 1, y + 1, 32, 20, 'ember', 3);
  p.rect(x + 3, y + 3, 9, 7, 'paper');
  p.rect(x + 4, y + 4, 7, 4, 'denim');
  px(p, x + 7, y + 5, 'honey');
  px(p, x + 7, y + 3, 'red');
  p.rect(x + 15, y + 3, 7, 7, 'honey');
  p.rect(x + 16, y + 5, 5, 1, 'ember');
  p.rect(x + 16, y + 7, 4, 1, 'ember');
  px(p, x + 18, y + 3, 'cyan');
  p.rect(x + 25, y + 4, 6, 8, 'paper');
  p.rect(x + 26, y + 6, 4, 1, 'fog');
  p.rect(x + 26, y + 8, 4, 1, 'fog');
  px(p, x + 27, y + 4, 'red');
  p.rect(x + 4, y + 13, 12, 6, 'fog');
  p.rect(x + 5, y + 14, 10, 1, 'stone');
  p.rect(x + 5, y + 16, 7, 1, 'stone');
  px(p, x + 9, y + 13, 'cyan');
  p.rect(x + 20, y + 13, 7, 6, 'paper');
  p.rect(x + 21, y + 15, 5, 1, 'fog');
  px(p, x + 23, y + 13, 'red');
  p.rect(x, y + 22, 34, 1, 'stone');
}

/** A colleague's desk beside the core: a monitor, a desk lamp on, the chair pushed in. */
function paintOtherDesk(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 46;
  paintDesk(p, x + 6, top, 32, floorTop);
  paintMonitor(p, x + 22, top);
  paintLantern(p, x + 9, top);
  p.rect(x + 12, top + 4, 8, 6, 'night');
  p.rect(x + 13, top + 3, 6, 1, 'night');
  p.rect(x + 15, top + 10, 2, floorTop - top - 10, 'ink');
  p.rect(x + 12, floorTop, 8, 1, 'ink');
}

/** A grey filing cabinet with a plant on top. */
function paintCabinet(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 34;
  p.rect(x, top, 18, floorTop - top, 'stone');
  p.rect(x, top, 18, 1, 'concrete');
  for (let d = 0; d < 3; d++) {
    const dy = top + 3 + d * 7;
    p.rect(x + 1, dy + 5, 16, 1, 'slate');
    p.rect(x + 7, dy + 1, 4, 1, 'fog');
  }
  paintPlant(p, x + 4, top - 20);
}

export const MEDIA_STAGE: StageConfig = {
  paint,
  backdrops: { coworker: paintOffice },
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...HEAD, side: 'right' },
    // Alone he stands at the head of the table; with Ms. Carter there, by the camera.
    reporter: { sprite: REPORTER_SPRITE, ...HEAD, side: 'right', beside: BY_CAMERA },
    // Alone he stands at the desk's end; with Ms. Carter there, a step further along.
    coworker: { sprite: COWORKER_SPRITE, ...HEAD, side: 'right', beside: FURTHER },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 5 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 89, y: 25 } },
  rest: {
    left: { x: 44, y: PROP_TOP },
    right: { x: 54, y: PROP_TOP },
  },
};
