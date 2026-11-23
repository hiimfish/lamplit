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
import { clipped, coreOrigin, paintClock, paintPicture, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The promotion stage, the last of the game: Harbor Trading on a December
 * evening. Two backgrounds share one floor line and one desk, so everyone
 * stands, and every prop rests, in the same place in both.
 *
 * - The office (`paint`): your desk against the low blue partition, under a
 *   wide window onto the harbour at dusk with a string of coloured lights
 *   along its top and a little snow falling. On the desk: your monitor, the
 *   portfolio folder, the printed self-review, a small potted plant and a lit
 *   Lantern lamp. A wreath and the coat stand to the left, a December
 *   calendar (one Friday ringed in red) to the right, Dan's desk beyond.
 *   Wider: a little lit tree with presents, windows, cabinets, more desks.
 *   Taller: a clock, the air conditioner, a garland of lights under the
 *   ceiling and high windows onto the night.
 * - Mr. Ellis's office (`backdrops.director`, the promotion interview): warm
 *   walls over dark panelling, a tall bookcase on the left, a framed photo of
 *   the first Lantern lamp, a curtained window, his big wooden desk (phone,
 *   your portfolio, a brass name plate, a Lantern lamp) with two leather
 *   visitor chairs pulled up to it, and a red rug. Wider: more bookcases, a
 *   sideboard with a globe, more windows. Taller: a clock, a picture, then a
 *   panelled ceiling with a pendant light.
 *
 * Palette colours only, whole pixels, the same picture every time.
 */

/** The desk in both rooms: its left edge, width and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 34, w: 50, top: 48 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;
const FLOOR_TOP = 56;

/** Ms. Carter in front of the near end of the desk; alone, Dan and Mr. Ellis stand here too. */
const CARTER = { x: 72, y: 39 } as const;
/** With Ms. Carter there: Mr. Ellis by his window, Dan by his own desk. */
const ELLIS_BESIDE = { x: 92, y: 39 } as const;
const DAN_BESIDE = { x: 96, y: 39 } as const;

/** The office: the rail of the dark lower wall, the partition and the wide window. */
const RAIL_Y = 47;
const PARTITION = { x: 32, top: 35 } as const;
const WINDOW = { x: 38, y: 4, w: 64, h: 28 } as const;
/** Dan's desk starts here (it runs on past the core's right edge). */
const DAN_DESK_X = 88;
const BAY_W = 44;

/** Mr. Ellis's office: the rail of the panelling, his window and the bookcase. */
const PANEL_Y = 38;
const ELLIS_WINDOW = { x: 92, y: 4, w: 30, h: 32 } as const;
const BOOKCASE = { x: 1, w: 30 } as const;
const ROOM_BAY = 40;

/** Wall above the core needed for the clock, for a picture, and for the ceiling band. */
const CLOCK_MIN = 20;
const POSTER_MIN = 50;
const CEILING_MIN = 64;
const CEILING_UP = 50;
/** How much taller windows and bookcases grow on a tall stage, at most. */
const GROW = 26;

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

/** How far windows reach up on a stage whose core starts at `oy`. */
function grow(oy: number): number {
  return Math.min(GROW, Math.max(0, oy - 24));
}

// ---------------------------------------------------------------------------
// Shared: the view, lights, lamps

/** One period of the harbour view, so windows side by side show one continuous scene. */
const VIEW_P = 150;
const BULBS: readonly PaletteName[] = ['honey', 'red', 'leaf', 'cyan', 'lamp', 'neon'];

/**
 * The harbour on a December evening through a window's glass (x, y, w, h):
 * a dusk sky, the far shore with its lights, a little snow on the air.
 */
function paintView(target: Painter, x: number, y: number, w: number, h: number, ox: number): void {
  const p = within(target, x, y, w, h);
  const horizon = y + h - 7;
  const sky: PaletteName[] =
    h > 34 ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy'] : ['indigo', 'violet', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, VIEW_P);
    // the far shore: snowy hills, the town's lights along the water
    const bump = Math.round(2 + Math.sin(hx / 9) + Math.sin(hx / 4.1) * 0.7);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    px(p, x + i, horizon - bump, hash2(hx, 8, 401) < 0.6 ? 'fog' : 'stone');
    if (hash2(hx, 5, 409) < 0.16) px(p, x + i, horizon, hash2(hx, 6, 419) < 0.5 ? 'honey' : 'lamp');
    // the afterglow on the water
    if (hx % 7 === 0 && hash2(hx, 1, 421) < 0.6) {
      p.rect(x + i, horizon + 2 + Math.floor(hash2(hx, 2, 431) * 4), 2, 1, 'violet');
    }
  }
  // a lighthouse on the point, once a period
  const first = Math.floor((x - ox) / VIEW_P) - 1;
  for (let k = first; ox + k * VIEW_P < x + w; k++) {
    const lx = ox + k * VIEW_P + 112;
    p.rect(lx, horizon - 9, 2, 7, 'paper');
    p.rect(lx, horizon - 7, 2, 1, 'red');
    p.rect(lx - 1, horizon - 10, 4, 1, 'night');
    px(p, lx, horizon - 11, 'honey');
    px(p, lx + 1, horizon - 11, 'lamp');
  }
  // snow, counted from the core so it never shifts
  for (let yy = y; yy < horizon; yy++) {
    for (let i = 0; i < w; i++) {
      const sx = x + i - ox;
      if (hash2(sx, yy - y, 433) < 0.018)
        px(p, x + i, yy, hash2(sx, yy, 439) < 0.5 ? 'paper' : 'fog');
    }
  }
}

/**
 * A string of coloured lights hanging between x0 and x1 from `y`, sagging
 * `sag` pixels between hooks `span` apart, a small glow round each bulb.
 */
function paintStringLights(
  p: Painter,
  x0: number,
  x1: number,
  y: number,
  span: number,
  sag: number,
  seed: number,
): void {
  const dip = (x: number): number => {
    const u = mod(x - x0, span) / span;
    return y + Math.round(sag * 4 * u * (1 - u));
  };
  for (let x = x0; x < x1; x++) px(p, x, dip(x), 'ink');
  for (let x = x0 + 3, n = 0; x < x1 - 1; x += 5, n++) {
    const by = dip(x) + 1;
    const c = BULBS[mod(n + seed, BULBS.length)] ?? 'honey';
    glowEllipse(p, x, by + 1, 3, 3, c === 'cyan' ? 'cyan' : 'honey', [0.3, 0.15]);
    px(p, x, by, 'ink');
    p.rect(x, by + 1, 1, 2, c);
  }
}

/**
 * One of the Lantern desk lamps, 7 wide, standing on `deskTop`: a brass foot
 * and stem under a teal glass dome, lit, its light on the desk.
 */
function paintLantern(p: Painter, x: number, deskTop: number): void {
  glowEllipse(p, x + 3, deskTop - 4, 12, 7, 'honey', [0.34, 0.2, 0.1]);
  p.rect(x + 1, deskTop - 1, 5, 1, 'amber');
  p.rect(x + 3, deskTop - 6, 1, 5, 'amber');
  p.rect(x + 2, deskTop - 11, 3, 1, 'teal');
  p.rect(x + 1, deskTop - 10, 5, 1, 'teal');
  p.rect(x, deskTop - 9, 7, 3, 'teal');
  px(p, x + 1, deskTop - 9, 'cyan');
  px(p, x + 2, deskTop - 10, 'cyan');
  p.rect(x + 1, deskTop - 6, 5, 1, 'honey');
  p.rect(x + 2, deskTop - 5, 3, 1, 'lamp');
}

/** A brass pendant lamp hanging from `from` down to y. */
function paintPendant(p: Painter, cx: number, from: number, y: number): void {
  p.rect(cx, from, 1, y - from, 'ink');
  p.rect(cx - 1, y, 3, 1, 'ember');
  p.rect(cx - 2, y + 1, 5, 1, 'amber');
  p.rect(cx - 3, y + 2, 7, 1, 'amber');
  p.rect(cx - 4, y + 3, 9, 1, 'ember');
  p.rect(cx - 2, y + 4, 5, 1, 'honey');
  px(p, cx - 2, y + 2, 'lamp');
}

// ---------------------------------------------------------------------------
// The office

/** Paints the office in December to fill a w x h stage (at least the 128x64 core). */
function paintOffice(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const ceiling = oy >= CEILING_MIN ? oy - CEILING_UP : 0;
  const winTop = oy + WINDOW.y - grow(oy);
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // Bays to the left of the core, nearest first: the tree, then windows and cabinets.
  const bays: [number, 'tree' | 'window' | 'cabinet'][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i === 0 ? 'tree' : i % 2 === 1 ? 'window' : 'cabinet']);
  }
  // To the right the desks go on past Dan's, one every DESK.w, a window over each.
  const desks: number[] = [];
  for (let x = ox + DAN_DESK_X + DESK.w; x < w; x += DESK.w) desks.push(x);
  const pendants = [ox + 30, ox + 110, ...desks.map((x) => x + DESK.w - 4)];
  const lamps = [...pendants];
  for (const [x, kind] of bays) if (kind !== 'tree') lamps.push(x + BAY_W / 2);

  // The wall, warm where the lamps light it.
  p.rect(0, 0, w, floorTop, 'fog');
  for (const lx of lamps) glowEllipse(p, lx, oy + 12, 30, 24, 'honey', [0.22, 0.14, 0.07]);
  if (ceiling > 0) paintUpperWall(p, w, ox, ceiling);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);
  // a garland of lights under the ceiling, when there is wall for it
  if (oy >= 8) paintStringLights(p, mod(ox, 18) - 18, w, ceiling + 3, 18, 3, 0);

  if (oy >= CLOCK_MIN) {
    paintClock(p, ox + 24, oy - 9);
    paintAircon(p, ox + 112, oy - 13);
  }
  if (oy >= POSTER_MIN) paintLampPoster(p, ox + 6, oy - 38);

  paintLowerWall(p, w, ox, oy + RAIL_Y, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'tree') paintTreeBay(p, x, oy, floorTop);
    else if (kind === 'window') {
      paintOfficeWindow(p, x + 5, winTop, 34, winH, ox);
      paintPrinterBay(p, x, oy, floorTop);
    } else paintCabinetBay(p, x, oy, floorTop);
  }

  // The back wall of the core: the wreath, the window with its lights, the calendar.
  paintWreath(p, ox + 12, oy + 8);
  paintOfficeWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintStringLights(p, ox + WINDOW.x - 2, ox + WINDOW.x + WINDOW.w + 2, winTop + 1, 17, 3, 2);
  paintCalendar(p, ox + 107, oy + 9);
  for (const x of desks) paintOfficeWindow(p, x + 8, winTop, 34, winH, ox);
  for (const lx of pendants) paintPendant(p, lx, ceiling, oy + 2);

  paintPartition(p, ox + PARTITION.x, w, oy + PARTITION.top, floorTop);
  paintCoatStand(p, ox + 3, floorTop);

  // The desks, far ones first.
  desks.forEach((x, i) => paintWorkDesk(p, x, deskTop, floorTop, i));
  paintWorkDesk(p, ox + DAN_DESK_X, deskTop, floorTop, -1);
  paintMyDesk(p, ox + DESK.x, deskTop, floorTop);
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

/** The wall above `ceiling` on a tall stage: a darker band with high windows onto the night. */
function paintUpperWall(p: Painter, w: number, ox: number, ceiling: number): void {
  p.rect(0, 0, w, ceiling, 'concrete');
  ditherRect(p, 0, 0, w, 3, 'stone', 8);
  const wh = Math.min(60, ceiling - 14);
  if (wh >= 12) {
    const top = Math.max(4, Math.floor((ceiling - wh) / 2));
    for (let k = Math.floor(-(ox + 70) / 88) - 1; ox + 70 + k * 88 - 22 < w; k++) {
      const cx = ox + 70 + k * 88;
      p.rect(cx - 21, top - 1, 43, wh + 2, 'paper');
      ditherGradient(p, cx - 20, top, 41, wh, ['deep', 'deep', 'indigo', 'dusk']);
      for (let i = 0; i < 9; i++) {
        const sx = cx - 19 + Math.floor(hash2(i, k, 331) * 39);
        const sy = top + 1 + Math.floor(hash2(i, k, 337) * (wh - 3));
        px(p, sx, sy, hash2(i, k, 347) > 0.6 ? 'paper' : 'fog');
      }
      p.rect(cx - 7, top, 1, wh, 'paper');
      p.rect(cx + 7, top, 1, wh, 'paper');
      p.rect(cx - 21, top + wh + 1, 43, 1, 'stone');
    }
  }
  p.rect(0, ceiling, w, 1, 'paper');
  p.rect(0, ceiling + 1, w, 1, 'fog');
  p.rect(0, ceiling + 2, w, 1, 'stone');
}

/** A white-framed office window onto the harbour, a pane bar every 22 or so, snow on the sill. */
function paintOfficeWindow(p: Painter, x: number, y: number, w: number, h: number, ox: number) {
  p.rect(x, y, w, h, 'paper');
  paintView(p, x + 2, y + 2, w - 4, h - 4, ox);
  const panes = Math.max(2, Math.round(w / 22));
  for (let i = 1; i < panes; i++) {
    p.rect(x + 2 + Math.floor(((w - 4) * i) / panes), y + 2, 1, h - 4, 'paper');
  }
  // snow piled along the bottom of the glass
  p.rect(x + 2, y + h - 3, w - 4, 1, 'fog');
  for (let i = 0; i < w - 4; i += 3) {
    if (hash2(x + i - ox, 0, 449) < 0.5) px(p, x + 2 + i, y + h - 4, 'paper');
  }
  p.rect(x - 1, y + h, w + 2, 1, 'paper');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'concrete');
}

/**
 * The low partition behind the desks, from x0 to the right edge: blue cloth
 * panels with a pale cap, the calm ground the props are seen against.
 */
function paintPartition(p: Painter, x0: number, w: number, top: number, floorTop: number): void {
  p.rect(x0, top, w - x0, floorTop - top, 'denim');
  for (let x = x0 + 24; x < w; x += 24) p.rect(x, top + 2, 1, floorTop - top - 2, 'indigo');
  p.rect(x0, top, w - x0, 1, 'sky');
  p.rect(x0, floorTop - 1, w - x0, 1, 'night');
  p.rect(x0 - 1, top, 2, floorTop + 1 - top, 'indigo');
  px(p, x0 - 1, top, 'sky');
}

/** A holiday wreath, 13 across: a ring of greenery, red berries, a red bow at the bottom. */
function paintWreath(p: Painter, x: number, y: number): void {
  p.rect(x + 6, y - 3, 1, 3, 'ink');
  p.rect(x + 4, y, 5, 2, 'leaf');
  p.rect(x + 2, y + 1, 9, 2, 'moss');
  p.rect(x + 3, y + 1, 7, 1, 'leaf');
  p.rect(x + 1, y + 3, 3, 6, 'leaf');
  p.rect(x + 9, y + 3, 3, 6, 'leaf');
  p.rect(x + 1, y + 6, 1, 3, 'moss');
  p.rect(x + 11, y + 4, 1, 5, 'moss');
  p.rect(x + 2, y + 9, 9, 2, 'moss');
  p.rect(x + 3, y + 9, 7, 1, 'leaf');
  p.rect(x + 4, y + 11, 5, 1, 'moss');
  const berries: readonly [number, number][] = [
    [3, 1],
    [10, 4],
    [2, 7],
    [9, 9],
    [6, 0],
  ];
  for (const [dx, dy] of berries) px(p, x + dx, y + dy, 'red');
  // the bow
  p.rect(x + 4, y + 10, 2, 2, 'red');
  p.rect(x + 7, y + 10, 2, 2, 'red');
  px(p, x + 6, y + 11, 'maroon');
  px(p, x + 5, y + 12, 'red');
  px(p, x + 7, y + 12, 'red');
  px(p, x + 4, y + 13, 'maroon');
  px(p, x + 8, y + 13, 'maroon');
}

/** A December calendar, 16 x 19: a red band, rows of days, one Friday ringed in red. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 19, 16, 1, 'concrete');
  p.rect(x, y, 16, 19, 'paper');
  p.rect(x, y, 16, 4, 'red');
  p.rect(x + 3, y + 1, 10, 1, 'maroon');
  px(p, x + 4, y - 1, 'ink');
  px(p, x + 11, y - 1, 'ink');
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) px(p, x + 1 + c * 2, y + 6 + r * 3, c === 0 ? 'rosy' : 'stone');
  }
  // the Friday the interview moved to
  const fx = x + 11;
  const fy = y + 12;
  p.rect(fx - 1, fy - 1, 3, 1, 'red');
  p.rect(fx - 1, fy + 1, 3, 1, 'red');
  px(p, fx - 2, fy, 'red');
  px(p, fx + 2, fy, 'red');
  px(p, fx, fy, 'ink');
}

/** The coat stand by the wall: a winter coat and a red scarf on its hooks. */
function paintCoatStand(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 36;
  p.rect(x + 5, top, 1, 36, 'ember');
  p.rect(x + 2, floorTop + 2, 8, 1, 'night');
  p.rect(x + 3, floorTop, 5, 2, 'ember');
  p.rect(x + 3, top + 1, 5, 1, 'ember');
  px(p, x + 2, top, 'amber');
  px(p, x + 8, top, 'amber');
  // the coat
  p.rect(x + 1, top + 2, 6, 17, 'denim');
  p.rect(x + 2, top + 2, 2, 17, 'indigo');
  p.rect(x + 1, top + 18, 6, 1, 'indigo');
  // the scarf
  p.rect(x + 6, top + 2, 3, 2, 'red');
  p.rect(x + 7, top + 4, 2, 9, 'red');
  p.rect(x + 7, top + 6, 2, 1, 'maroon');
  p.rect(x + 7, top + 10, 2, 1, 'maroon');
  px(p, x + 7, top + 13, 'paper');
  px(p, x + 8, top + 13, 'paper');
}

// ---------------------------------------------------------------------------
// The office desks

/** A bare desk, DESK.w wide: a wooden top on two legs, its shadow on the carpet. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
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

/** A flat monitor, 10 wide, on its stand: off, a spreadsheet, or a page being written. */
function paintMonitor(p: Painter, x: number, deskTop: number, screen: 'off' | 'sheet' | 'page') {
  const y = deskTop - 11;
  p.rect(x, y, 10, 8, 'ink');
  if (screen === 'off') {
    p.rect(x + 1, y + 1, 8, 6, 'night');
    px(p, x + 2, y + 2, 'stone');
    px(p, x + 3, y + 2, 'stone');
  } else if (screen === 'sheet') {
    p.rect(x + 1, y + 1, 8, 6, 'sky');
    p.rect(x + 1, y + 1, 8, 1, 'denim');
    p.rect(x + 2, y + 3, 6, 1, 'paper');
    p.rect(x + 2, y + 5, 6, 1, 'paper');
    p.rect(x + 4, y + 3, 1, 3, 'sky');
  } else {
    p.rect(x + 1, y + 1, 8, 6, 'stone');
    p.rect(x + 2, y + 1, 6, 6, 'paper');
    p.rect(x + 3, y + 2, 4, 1, 'denim');
    p.rect(x + 3, y + 4, 4, 1, 'fog');
    p.rect(x + 3, y + 5, 2, 1, 'fog');
    px(p, x + 5, y + 5, 'ink');
  }
  p.rect(x + 4, y + 8, 2, 2, 'stone');
  p.rect(x + 2, y + 10, 6, 1, 'slate');
}

/** An office chair seen from the side, facing left, 12 wide. */
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

/** A glass desk lamp, 7 wide, unlit or lit, in one of a few shade colours. */
function paintGlassLamp(p: Painter, x: number, deskTop: number, shade: PaletteName, lit: boolean) {
  if (lit) glowEllipse(p, x + 3, deskTop - 5, 10, 7, 'honey', [0.3, 0.18, 0.08]);
  p.rect(x + 1, deskTop - 1, 5, 1, 'amber');
  p.rect(x + 3, deskTop - 6, 1, 5, 'amber');
  p.rect(x + 1, deskTop - 10, 5, 1, shade);
  p.rect(x, deskTop - 9, 7, 3, shade);
  px(p, x + 1, deskTop - 9, lit ? 'paper' : 'fog');
  if (lit) {
    p.rect(x + 1, deskTop - 6, 5, 1, 'honey');
    p.rect(x + 2, deskTop - 5, 3, 1, 'lamp');
  }
}

const SHADES: readonly PaletteName[] = ['rosy', 'lamp', 'leaf', 'red'];

/**
 * Someone else's desk, left edge x: monitor, lamp, drawers, chair. `n` -1 is
 * Dan's, by the core (a spreadsheet up, his lamp lit, a mug, a little gift
 * box on top of the partition); the others vary down the row.
 */
function paintWorkDesk(p: Painter, x: number, deskTop: number, floorTop: number, n: number) {
  paintDesk(p, x, deskTop, floorTop);
  paintDrawers(p, x + 37, deskTop, floorTop);
  paintMonitor(p, x + 24, deskTop, n === -1 || n % 3 === 1 ? 'sheet' : 'off');
  paintGlassLamp(
    p,
    x + 39,
    deskTop,
    n === -1 ? 'leaf' : (SHADES[n % SHADES.length] ?? 'rosy'),
    n % 2 !== 0,
  );
  p.rect(x + 35, deskTop - 1, 3, 1, 'concrete');
  paintChair(p, x + 12, floorTop);
  if (n === -1) {
    // the mug and a gift box waiting on the partition
    p.rect(x + 18, deskTop - 3, 3, 3, 'paper');
    px(p, x + 21, deskTop - 2, 'paper');
    px(p, x + 19, deskTop - 3, 'red');
    p.rect(x + 28, deskTop - 17, 6, 4, 'red');
    p.rect(x + 30, deskTop - 17, 2, 4, 'honey');
    p.rect(x + 28, deskTop - 16, 6, 1, 'honey');
    px(p, x + 30, deskTop - 18, 'honey');
    px(p, x + 32, deskTop - 18, 'honey');
  }
}

/**
 * Your desk at the end of the year, from the near end: a lit Lantern lamp, a
 * little potted plant, the monitor with your self-review open, the portfolio
 * folder standing up, the printed self-review with a clip and a red pen, the
 * drawers at the far end. Nothing tall stands at the far end, behind Ms.
 * Carter's head.
 */
function paintMyDesk(p: Painter, x: number, deskTop: number, floorTop: number): void {
  paintDesk(p, x, deskTop, floorTop);
  paintDrawers(p, x + 37, deskTop, floorTop);
  paintLantern(p, x + 1, deskTop);
  paintMonitor(p, x + 14, deskTop, 'page');
  // the portfolio folder: dark leather, brass clasp, pages showing at the top
  const f = x + 26;
  p.rect(f, deskTop - 10, 9, 10, 'maroon');
  p.rect(f + 1, deskTop - 11, 7, 1, 'paper');
  p.rect(f, deskTop - 10, 1, 10, 'red');
  p.rect(f + 3, deskTop - 6, 3, 2, 'amber');
  px(p, f + 4, deskTop - 6, 'honey');
  // the printed self-review: a short stack, a black clip, a red pen on top
  const s = x + 36;
  p.rect(s, deskTop - 2, 10, 2, 'paper');
  p.rect(s, deskTop - 1, 10, 1, 'fog');
  p.rect(s + 1, deskTop - 3, 9, 1, 'paper');
  p.rect(s + 2, deskTop - 4, 2, 2, 'ink');
  p.rect(s + 5, deskTop - 4, 4, 1, 'red');
  px(p, s + 9, deskTop - 4, 'paper');
  // the little plant
  const pl = x + 9;
  p.rect(pl, deskTop - 3, 4, 3, 'amber');
  p.rect(pl + 2, deskTop - 3, 2, 3, 'ember');
  p.rect(pl, deskTop - 5, 1, 2, 'leaf');
  p.rect(pl + 1, deskTop - 7, 2, 4, 'leaf');
  p.rect(pl + 3, deskTop - 6, 1, 3, 'moss');
  px(p, pl - 1, deskTop - 6, 'moss');
  px(p, pl + 4, deskTop - 7, 'leaf');
}

// ---------------------------------------------------------------------------
// Beside and above the office core

/** The bay next to the coat stand: a little potted fir with lights and a star, presents under it. */
function paintTreeBay(p: Painter, bx: number, oy: number, floorTop: number): void {
  const cx = bx + 22;
  const top = oy + 22;
  glowEllipse(p, cx, top + 16, 18, 18, 'honey', [0.18, 0.1]);
  // the tiers of the tree
  for (let r = 0; r < 26; r++) {
    const half = 1 + Math.floor(r * 0.42) - (r % 8 === 7 ? 2 : 0);
    p.rect(cx - half, top + r, half * 2 + 1, 1, r % 8 > 4 ? 'moss' : 'leaf');
    px(p, cx + half, top + r, 'moss');
  }
  // the lights on it
  for (let i = 0; i < 14; i++) {
    const r = 3 + Math.floor(hash2(i, 0, 457) * 22);
    const half = 1 + Math.floor(r * 0.42);
    const dx = Math.floor((hash2(i, 1, 461) * 2 - 1) * half);
    px(p, cx + dx, top + r, BULBS[i % BULBS.length] ?? 'honey');
  }
  // the star
  p.rect(cx - 1, top - 2, 3, 1, 'honey');
  p.rect(cx, top - 3, 1, 3, 'honey');
  px(p, cx, top - 2, 'paper');
  // the pot and the presents
  p.rect(cx - 4, floorTop - 7, 9, 7, 'red');
  p.rect(cx - 4, floorTop - 7, 9, 1, 'maroon');
  p.rect(cx - 15, floorTop - 6, 8, 6, 'teal');
  p.rect(cx - 12, floorTop - 6, 2, 6, 'paper');
  p.rect(cx + 7, floorTop - 5, 7, 5, 'lamp');
  p.rect(cx + 7, floorTop - 3, 7, 1, 'red');
  p.rect(cx - 16, floorTop, 32, 1, 'night');
}

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
    }
  }
  p.rect(x + 7, top - 6, 9, 6, 'tan');
  p.rect(x + 7, top - 6, 9, 1, 'skin');
  paintPlant(p, x + 25, top - 20);
}

/** The air conditioner on the wall, 19 wide. */
function paintAircon(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 7, 19, 1, 'concrete');
  p.rect(x, y, 19, 7, 'paper');
  p.rect(x, y + 5, 19, 2, 'fog');
  p.rect(x + 2, y + 5, 15, 1, 'stone');
  px(p, x + 16, y + 2, 'leaf');
}

/** A framed poster of the Lantern lamp glowing in the dark, 20 x 22. */
function paintLampPoster(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 22, 20, 1, 'concrete');
  p.rect(x, y, 20, 22, 'ink');
  p.rect(x + 1, y + 1, 18, 20, 'deep');
  glowEllipse(p, x + 10, y + 12, 7, 5, 'honey', [0.3, 0.15]);
  paintLantern(p, x + 7, y + 16);
  p.rect(x + 4, y + 18, 12, 1, 'paper');
}

// ---------------------------------------------------------------------------
// Mr. Ellis's office

/** Paints Mr. Ellis's office to fill a w x h stage (at least the 128x64 core). */
function paintDirector(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskTop = oy + DESK.top;
  const ceiling = oy >= CEILING_MIN ? oy - CEILING_UP : 0;
  const tallTop = oy + 2 - grow(oy);
  const winTop = oy + ELLIS_WINDOW.y - grow(oy);
  const winH = oy + ELLIS_WINDOW.y + ELLIS_WINDOW.h - winTop;

  // Bays either side of the core: bookcases and sideboards to the left, windows and sideboards to the right.
  // Every other sideboard carries a globe instead of a plant.
  const bays: [number, 'shelf' | 'sideboard' | 'window', boolean][] = [];
  for (let x = ox - ROOM_BAY, i = 0; x + ROOM_BAY > 0; x -= ROOM_BAY, i++) {
    bays.push([x, i % 2 === 0 ? 'sideboard' : 'shelf', i % 4 === 2]);
  }
  for (let x = ox + 128, i = 0; x < w; x += ROOM_BAY, i++) {
    bays.push([x, i % 2 === 0 ? 'sideboard' : 'window', i % 4 === 0]);
  }

  // Warm walls, lit by the lamps.
  p.rect(0, 0, w, floorTop, 'tan');
  const glows = [ox + 60, ox + 104, ...bays.map(([x]) => x + ROOM_BAY / 2)];
  for (const gx of glows) glowEllipse(p, gx, oy + 14, 30, 26, 'skin', [0.3, 0.18, 0.08]);
  glowEllipse(p, ox + DESK.x + 4, deskTop - 6, 22, 14, 'honey', [0.22, 0.12]);
  paintCeiling(p, w, ox, ceiling);

  if (oy >= 16) paintPendant(p, ox + 60, ceiling, oy - 10);
  if (oy >= CLOCK_MIN) paintClock(p, ox + 80, oy - 10);
  if (oy >= POSTER_MIN) paintPicture(p, ox + 30, oy - 30);

  paintPanelling(p, w, ox, oy + PANEL_Y, floorTop);
  paintBoards(p, w, ox, floorTop, h);
  paintRug(p, ox + 24, floorTop + 2, 96, h);

  for (const [x, kind, globe] of bays) {
    if (kind === 'shelf') paintBookcase(p, x + 5, 30, tallTop, floorTop, x - ox);
    else if (kind === 'window') paintEllisWindow(p, x + 7, winTop, 26, winH, ox);
    else paintSideboard(p, x, oy, floorTop, globe);
  }

  // The core: the bookcase, the photo of the first Lantern, a certificate, the window.
  paintBookcase(p, ox + BOOKCASE.x, BOOKCASE.w, tallTop, floorTop, 0);
  paintLanternPhoto(p, ox + 44, oy + 6);
  paintCertificate(p, ox + 71, oy + 11);
  paintEllisWindow(p, ox + ELLIS_WINDOW.x, winTop, ELLIS_WINDOW.w, winH, ox);

  // His desk, and the two visitor chairs pulled up to it.
  paintBigDesk(p, ox + DESK.x, deskTop, floorTop);
  paintVisitorChair(p, ox + DESK.x + 5, deskTop, floorTop);
  paintVisitorChair(p, ox + DESK.x + 25, deskTop, floorTop);
}

/**
 * A crown moulding at `ceiling`. On a tall stage the wall above it is striped
 * paper under a beamed ceiling, with high wooden-framed windows onto the night.
 */
function paintCeiling(p: Painter, w: number, ox: number, ceiling: number): void {
  if (ceiling > 0) {
    for (let x = mod(ox, 8) - 8; x < w; x += 8) ditherRect(p, x, 0, 3, ceiling, 'skin', 6);
    p.rect(0, 0, w, 6, 'ember');
    p.rect(0, 6, w, 1, 'amber');
    p.rect(0, 7, w, 1, 'plum');
    for (let x = mod(ox + 12, 32) - 32; x < w; x += 32) p.rect(x, 0, 3, 6, 'plum');
    const wh = Math.min(56, ceiling - 22);
    if (wh >= 12) {
      const top = 8 + Math.max(4, Math.floor((ceiling - 8 - wh) / 2));
      for (let k = Math.floor(-(ox + 64) / 88) - 1; ox + 64 + k * 88 - 18 < w; k++) {
        const cx = ox + 64 + k * 88;
        p.rect(cx - 15, top - 1, 31, wh + 2, 'ember');
        p.rect(cx - 13, top - 3, 27, 2, 'ember');
        ditherGradient(p, cx - 13, top, 27, wh, ['deep', 'deep', 'indigo', 'dusk']);
        for (let i = 0; i < 8; i++) {
          const sx = cx - 12 + Math.floor(hash2(i, k, 503) * 25);
          const sy = top + 1 + Math.floor(hash2(i, k, 509) * (wh - 3));
          px(p, sx, sy, hash2(i, k, 521) > 0.6 ? 'paper' : 'fog');
        }
        p.rect(cx, top, 1, wh, 'ember');
        p.rect(cx - 13, top + Math.floor(wh / 2), 27, 1, 'ember');
        p.rect(cx - 16, top + wh + 1, 33, 1, 'amber');
      }
    }
  }
  p.rect(0, ceiling, w, 2, 'ember');
  p.rect(0, ceiling + 2, w, 1, 'amber');
  p.rect(0, ceiling + 3, w, 1, 'honey');
  ditherRect(p, 0, ceiling + 4, w, 2, 'ember', 6);
}

/** Dark wooden panelling under a brass-coloured rail, framed panels, a skirting board. */
function paintPanelling(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'plum');
  p.rect(0, top, w, 1, 'honey');
  p.rect(0, top + 1, w, 1, 'amber');
  p.rect(0, top + 2, w, 1, 'ember');
  for (let x = mod(ox, 14) - 14; x < w; x += 14) {
    p.rect(x + 2, top + 5, 10, floorTop - top - 9, 'maroon');
    p.rect(x + 3, top + 6, 8, floorTop - top - 11, 'plum');
    p.rect(x + 2, top + 5, 10, 1, 'ember');
  }
  p.rect(0, floorTop - 2, w, 2, 'ember');
  p.rect(0, floorTop - 2, w, 1, 'amber');
}

/** Polished boards: dark plum with long seams, counted from the core so they never shift. */
function paintBoards(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'plum');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 2 < h; row++) {
    const y = floorTop + 2 + row * 2;
    for (let x = mod(ox + row * 13, 24) - 24; x < w; x += 24) {
      p.rect(x, y, 1, 2, 'maroon');
      p.rect(x + 2, y, 9, 1, 'ember');
    }
  }
}

/** The red rug under the desk: a border of brass dots, a darker field, fringe at the ends. */
function paintRug(p: Painter, x: number, y: number, rw: number, h: number): void {
  const rh = h - y;
  if (rh < 2) return;
  p.rect(x, y, rw, rh, 'red');
  p.rect(x + 2, y + 1, rw - 4, rh - 1, 'maroon');
  for (let i = x + 3; i < x + rw - 3; i += 3) px(p, i, y + 1, 'amber');
  if (rh > 5) {
    for (let i = x + 6; i < x + rw - 6; i += 6) {
      for (let r = y + 4; r < h; r += 4) px(p, i + (((r - y) / 4) % 2) * 3, r, 'red');
    }
  }
  for (let r = y; r < h; r += 2) {
    px(p, x - 1, r, 'paper');
    px(p, x + rw, r, 'paper');
  }
}

/** A tall bookcase from `top` to the floor: dark frame, shelves of coloured spines, a few keepsakes. */
function paintBookcase(
  p: Painter,
  x: number,
  bw: number,
  top: number,
  floorTop: number,
  seed: number,
): void {
  const bottom = floorTop + 2;
  p.rect(x + 1, bottom, bw, 1, 'night');
  p.rect(x, top, bw, bottom - top, 'ember');
  p.rect(x, top, bw, 1, 'amber');
  p.rect(x + 2, top + 2, bw - 4, bottom - top - 4, 'plum');
  const spines: readonly PaletteName[] = [
    'red',
    'denim',
    'teal',
    'lamp',
    'moss',
    'paper',
    'maroon',
    'sky',
  ];
  for (let shelf = bottom - 3, s = 0; shelf - 9 > top + 1; shelf -= 11, s++) {
    p.rect(x + 2, shelf, bw - 4, 1, 'amber');
    p.rect(x + 2, shelf + 1, bw - 4, 1, 'ember');
    const keep = Math.floor(hash2(seed, s, 467) * 3);
    for (let bx = x + 3; bx < x + bw - 4;) {
      const bwid = 2 + Math.floor(hash2(bx - x + seed, s, 479) * 2);
      if (bx + bwid > x + bw - 3) break;
      const bh = 6 + Math.floor(hash2(bx - x + seed, s, 487) * 4);
      if (keep === 0 && bx - x > bw - 12 && bx - x < bw - 8) {
        // a little brass trophy
        p.rect(bx, shelf - 5, 4, 3, 'lamp');
        p.rect(bx + 1, shelf - 2, 2, 1, 'amber');
        p.rect(bx, shelf - 1, 4, 1, 'ember');
        px(p, bx + 1, shelf - 5, 'honey');
        bx += 6;
        continue;
      }
      const c = spines[Math.floor(hash2(bx - x + seed, s, 491) * spines.length)] ?? 'red';
      p.rect(bx, shelf - bh, bwid, bh, c);
      px(p, bx, shelf - bh + 2, c === 'paper' ? 'fog' : 'honey');
      bx += bwid + (hash2(bx - x + seed, s, 499) < 0.15 ? 2 : 0);
    }
  }
}

/** A framed photo of the first Lantern lamp, 20 x 18: brass frame, a pale mat, the lamp glowing. */
function paintLanternPhoto(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 18, 20, 1, 'ember');
  p.rect(x, y, 20, 18, 'lamp');
  p.rect(x + 1, y + 1, 18, 16, 'amber');
  p.rect(x + 2, y + 2, 16, 14, 'paper');
  p.rect(x + 4, y + 4, 12, 10, 'night');
  glowEllipse(p, x + 10, y + 9, 5, 4, 'honey', [0.35, 0.18]);
  // the lamp on a table in the photo
  p.rect(x + 8, y + 5, 4, 1, 'teal');
  p.rect(x + 7, y + 6, 6, 2, 'teal');
  px(p, x + 8, y + 6, 'cyan');
  p.rect(x + 8, y + 8, 4, 1, 'honey');
  p.rect(x + 10, y + 9, 1, 3, 'amber');
  p.rect(x + 8, y + 12, 5, 1, 'amber');
  p.rect(x + 4, y + 13, 12, 1, 'ember');
  // a small plaque under it
  p.rect(x + 7, y + 19, 6, 2, 'amber');
  px(p, x + 9, y + 19, 'honey');
}

/** A small framed certificate with a red seal. */
function paintCertificate(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 11, 12, 1, 'ember');
  p.rect(x, y, 12, 11, 'ink');
  p.rect(x + 1, y + 1, 10, 9, 'paper');
  p.rect(x + 3, y + 3, 6, 1, 'stone');
  p.rect(x + 3, y + 5, 6, 1, 'fog');
  px(p, x + 8, y + 7, 'red');
  px(p, x + 9, y + 8, 'red');
}

/** A tall wooden window onto the harbour, red curtains drawn back on a brass rod, snow on the sill. */
function paintEllisWindow(p: Painter, x: number, y: number, ww: number, wh: number, ox: number) {
  p.rect(x, y, ww, wh, 'ember');
  paintView(p, x + 2, y + 2, ww - 4, wh - 4, ox);
  p.rect(x + Math.floor(ww / 2), y + 2, 1, wh - 4, 'ember');
  p.rect(x + 2, y + Math.floor(wh / 2), ww - 4, 1, 'ember');
  p.rect(x + 2, y + wh - 3, ww - 4, 1, 'paper');
  // the sill
  p.rect(x - 2, y + wh, ww + 4, 1, 'amber');
  p.rect(x - 2, y + wh + 1, ww + 4, 1, 'ember');
  // the rod and the curtains
  p.rect(x - 5, y - 3, ww + 10, 1, 'amber');
  px(p, x - 6, y - 3, 'honey');
  px(p, x + ww + 5, y - 3, 'honey');
  for (const cx of [x - 4, x + ww - 1]) {
    p.rect(cx, y - 2, 5, wh + 6, 'maroon');
    p.rect(cx + 1, y - 2, 1, wh + 6, 'red');
    p.rect(cx + 3, y - 2, 1, wh + 6, 'red');
    // the tie-back
    p.rect(cx, y + Math.floor(wh * 0.6), 5, 1, 'lamp');
  }
}

/**
 * Mr. Ellis's big wooden desk, DESK.w wide: a thick top over a panelled front
 * down to the floor. On it, from the near end: a lit Lantern lamp, a pen cup,
 * his phone, your portfolio lying closed and a low brass name plate (nothing
 * tall behind Ms. Carter's head).
 */
function paintBigDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK.w;
  const foot = floorTop + 4;
  p.rect(x, foot, w + 1, 1, 'night');
  p.rect(x + 1, top + 3, w - 2, foot - top - 3, 'ember');
  for (const [px0, pw] of [
    [x + 3, 14],
    [x + 19, 12],
    [x + 33, 14],
  ] as const) {
    p.rect(px0, top + 5, pw, foot - top - 8, 'maroon');
    p.rect(px0 + 1, top + 6, pw - 2, foot - top - 10, 'ember');
    p.rect(px0, top + 5, pw, 1, 'plum');
  }
  p.rect(x + 1, foot - 2, w - 2, 2, 'plum');
  // the top
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
  p.rect(x, top + 2, w, 1, 'plum');
  paintLantern(p, x + 1, top);
  // the pen cup
  p.rect(x + 10, top - 4, 3, 4, 'ink');
  px(p, x + 10, top - 6, 'red');
  px(p, x + 11, top - 5, 'paper');
  // the phone
  p.rect(x + 15, top - 3, 7, 3, 'night');
  p.rect(x + 15, top - 4, 7, 1, 'ink');
  px(p, x + 16, top - 5, 'ink');
  px(p, x + 20, top - 5, 'ink');
  px(p, x + 19, top - 2, 'red');
  // your portfolio, lying closed
  p.rect(x + 24, top - 2, 13, 2, 'maroon');
  p.rect(x + 25, top - 1, 11, 1, 'paper');
  px(p, x + 30, top - 2, 'honey');
  // the brass name plate
  p.rect(x + 39, top - 3, 9, 3, 'amber');
  p.rect(x + 39, top - 3, 9, 1, 'honey');
  p.rect(x + 41, top - 2, 5, 1, 'ember');
}

/** A leather visitor's chair seen from behind, pulled up to the desk: buttoned back, brass studs. */
function paintVisitorChair(p: Painter, x: number, deskTop: number, floorTop: number): void {
  const top = deskTop + 2;
  const foot = floorTop + 6;
  p.rect(x, foot, 13, 1, 'night');
  p.rect(x + 1, top + 8, 1, foot - top - 8, 'ember');
  p.rect(x + 10, top + 8, 1, foot - top - 8, 'ember');
  p.rect(x + 1, top, 10, 1, 'maroon');
  p.rect(x, top + 1, 12, 8, 'maroon');
  p.rect(x + 1, top + 1, 1, 7, 'red');
  p.rect(x + 2, top, 8, 1, 'red');
  for (let i = 0; i < 12; i += 2) px(p, x + i, top + 8, 'lamp');
  px(p, x + 4, top + 4, 'plum');
  px(p, x + 8, top + 4, 'plum');
}

/** A low sideboard with a globe or a plant and a lamp on it, a framed picture above. */
function paintSideboard(p: Painter, x: number, oy: number, floorTop: number, globe: boolean): void {
  const top = oy + 41;
  p.rect(x + 3, floorTop + 2, 34, 1, 'night');
  p.rect(x + 3, top, 34, floorTop + 2 - top, 'ember');
  p.rect(x + 2, top, 36, 1, 'amber');
  p.rect(x + 5, top + 3, 14, floorTop - top - 3, 'maroon');
  p.rect(x + 21, top + 3, 14, floorTop - top - 3, 'maroon');
  px(p, x + 17, top + 7, 'honey');
  px(p, x + 23, top + 7, 'honey');
  if (globe) {
    // the globe on its stand
    p.rect(x + 9, top - 2, 5, 2, 'amber');
    p.rect(x + 7, top - 11, 9, 9, 'teal');
    p.rect(x + 6, top - 9, 11, 5, 'teal');
    p.rect(x + 9, top - 10, 3, 3, 'leaf');
    p.rect(x + 12, top - 6, 3, 2, 'leaf');
    p.rect(x + 6, top - 12, 1, 10, 'amber');
  } else {
    paintPlant(p, x + 8, top - 20);
  }
  // a reading lamp at the far end
  paintLantern(p, x + 27, top);
  paintPicture(p, x + 9, oy + 10);
}

export const PROMOTION_STAGE: StageConfig = {
  paint: paintOffice,
  backdrops: { director: paintDirector },
  cast: {
    guide: GUIDE_ACTOR,
    // Ms. Carter stands in front of the far end of the desk in both rooms.
    manager: { sprite: MANAGER_SPRITE, ...CARTER, side: 'right' },
    // Alone (the decision, t7) he stands where she does; with her there he
    // stands by his window.
    director: { sprite: DIRECTOR_SPRITE, ...CARTER, side: 'right', beside: { ...ELLIS_BESIDE } },
    // Alone (t2) Dan comes over to your desk; with Ms. Carter there (t8) he
    // stands by his own desk.
    coworker: { sprite: COWORKER_SPRITE, ...CARTER, side: 'right', beside: { ...DAN_BESIDE } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 88, y: 23 } },
  rest: {
    left: { x: DESK.x + 3, y: PROP_TOP },
    right: { x: DESK.x + 15, y: PROP_TOP },
  },
};
