import {
  ditherGradient,
  ditherRect,
  ellipse,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The job-center stage: a public employment office on an October evening.
 * From the left: a window onto the autumn dusk (a tree in orange leaf over
 * the rooftops) with a rack of leaflets under it, you, a visitor's chair,
 * then the counselor's desk: a wire tray of forms, a wooden top where
 * handed-over things rest, the keyboard and the computer, her chair pushed
 * back. On the wall behind: the big job board with rows of pinned ads and
 * tear-off tabs, and a wall calendar. Painted through the Painter interface,
 * palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a shelf of binders, a sign, a poster and
 * the clock, then an upper wall with high windows), the waiting chairs, more
 * windows and a water cooler to the left, filing cabinets and windows to the
 * right.
 */

/** The desk's left edge and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 46, top: 40 } as const;
/** 24x24 pictures stand on the desk top with their shadow on it. */
const PROP_TOP = DESK.top - 20;
/** The desk's right end, in core pixels. */
const DESK_END = 121;
/** The y in the core where the desk and the visitor's chair stand. */
const DESK_FOOT = 58;
const CHAIR_FOOT = 62;

const FLOOR_TOP = 54;
/** Top of the painted lower wall. */
const DADO_TOP = 43;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The ceiling lights: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 30;
const LAMP_GAP = 64;
/** Wall above the core needed for the binder shelf, for the sign row, and for the upper wall. */
const SHELF_MIN = 14;
const SIGN_MIN = 34;
const CORNICE_MIN = 56;
/** How far above the core the upper wall starts. */
const CORNICE_UP = 40;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside the box x0..x1, y0..y1 (end exclusive). */
function boxed(p: Painter, x0: number, y0: number, x1: number, y1: number): Painter {
  return {
    rect(x, y, rw, rh, color, alpha) {
      const a = Math.max(x0, x);
      const b = Math.max(y0, y);
      const c = Math.min(x1, x + rw);
      const d = Math.min(y1, y + rh);
      if (c > a && d > b) p.rect(a, b, c - a, d - b, color, alpha);
    },
  };
}

/** Paints the job center to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;

  const lamps: number[] = [];
  const firstLamp = ox + LAMP_X - Math.ceil((ox + LAMP_X + 10) / LAMP_GAP) * LAMP_GAP;
  for (let x = firstLamp; x < w + 10; x += LAMP_GAP) lamps.push(x);

  paintWall(p, w, ox, floorTop, cornice);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 14, 26, 20, [['paper', 0.38]], { y0: cornice + 3, y1: oy + DADO_TOP });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) paintHighWindows(p, w, ox, cornice);
  if (oy >= SHELF_MIN) paintBinderShelf(p, w, ox, oy - 4);
  if (oy >= SIGN_MIN) {
    if (ox + 6 >= 0) paintPoster(p, ox + 6, oy - 31);
    paintSign(p, ox + 42, oy - 30);
    paintClock(p, ox + 104, oy - 24);
  }

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: waiting chairs, windows and a water cooler to the
  // left; filing cabinets and windows to the right.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintWaitingBay(p, x, oy, floorTop);
    else if (i % 2 === 1) paintWindowBay(p, x, oy, floorTop, i);
    else paintCoolerBay(p, x, oy, floorTop);
  }
  for (let x = ox + CORE_W + 2, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintCabinetBay(p, x, oy, floorTop, i);
    else paintWindowBay(p, x, oy, floorTop, 50 + i);
  }

  // The core: the window and the leaflets, the job board and the calendar.
  paintAutumnWindow(p, ox + 3, oy + 6, 24, 24, 0, true);
  paintLeafletRack(p, ox + 4, oy + 35);
  paintJobBoard(p, ox + 31, oy + 3);
  paintCalendar(p, ox + 108, oy + 5);
  for (const lx of lamps) paintLamp(p, lx, oy);

  // Her chair behind the desk, then the desk and what stands on it.
  paintOfficeChair(p, ox + 116, oy + DESK.top);
  paintDesk(p, ox + DESK.x, ox + DESK_END, oy + DESK.top, oy + DESK_FOOT);
  paintFormTray(p, ox + DESK.x + 1, oy + DESK.top);
  paintKeyboard(p, ox + 80, oy + DESK.top);
  paintMonitor(p, ox + 103, oy + DESK.top);
  paintVisitorChair(p, ox + 37, oy + CHAIR_FOOT);
}

// ---------------------------------------------------------------------------
// Room

/**
 * The wall: pale grey-lilac paint. On a tall stage a rail runs at `cornice`
 * and the wall above it is a darker grey with a faint dot pattern.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'fog');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'slate');
    // dots, counted up from the rail so the pattern never shifts with the stage size
    for (let row = 0; cornice - 7 - row * 9 >= 5; row++) {
      const y = cornice - 7 - row * 9;
      for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) px(p, x, y, 'stone');
    }
    ditherRect(p, 0, 0, w, 3, 'night', 8);
    p.rect(0, cornice, w, 1, 'paper');
    p.rect(0, cornice + 1, w, 1, 'fog');
    p.rect(0, cornice + 2, w, 1, 'stone');
  } else {
    ditherRect(p, 0, 0, w, 3, 'concrete', 8);
  }
}

/** The lower wall: a darker painted band with a wooden rail and a skirting board. */
function paintDado(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'concrete');
  p.rect(0, top, w, 1, 'amber');
  p.rect(0, top + 1, w, 1, 'ember');
  ditherRect(p, 0, top + 2, w, 2, 'stone', 6);
  for (let x = mod(ox + 9, 32) - 32; x < w; x += 32)
    p.rect(x, top + 4, 1, floorTop - top - 6, 'stone');
  p.rect(0, floorTop - 2, w, 2, 'ember');
}

/** Square floor tiles: grey linoleum with darker joints. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'stone');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let y = floorTop + 4; y < h; y += 5) p.rect(0, y, w, 1, 'slate');
  for (let row = 0; floorTop + 1 + row * 5 < h; row++) {
    const y = floorTop + 1 + row * 5;
    for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) p.rect(x, y, 1, 3, 'slate');
  }
}

/** A long ceiling light on two cords: a metal box with a warm diffuser under it. */
function paintLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx - 6, 0, 1, oy + 1, 'ink');
  p.rect(cx + 6, 0, 1, oy + 1, 'ink');
  p.rect(cx - 9, oy + 1, 19, 1, 'concrete');
  p.rect(cx - 9, oy + 2, 19, 1, 'stone');
  p.rect(cx - 8, oy + 3, 17, 1, 'paper');
  p.rect(cx - 7, oy + 4, 15, 1, 'honey');
}

// ---------------------------------------------------------------------------
// Windows

/**
 * A window onto the autumn dusk, ww x wh: a sky going from indigo to amber,
 * far rooftops with lit windows, a tree in orange leaf, an aluminium frame
 * and a pale sill. With `blind`, a raised venetian blind at the top.
 */
function paintAutumnWindow(
  p: Painter,
  x: number,
  y: number,
  ww: number,
  wh: number,
  seed: number,
  blind: boolean,
): void {
  p.rect(x, y, ww, wh, 'stone');
  p.rect(x, y, ww, 1, 'concrete');
  const ix = x + 2;
  const iy = y + 2;
  const iw = ww - 4;
  const ih = wh - 4;
  ditherGradient(p, ix, iy, iw, ih, ['indigo', 'violet', 'mauve', 'rosy', 'lamp']);
  const q = boxed(p, ix, iy, ix + iw, iy + ih);
  // a star or two high up
  for (let i = 0; i < Math.max(1, Math.floor(iw / 10)); i++) {
    px(q, ix + 1 + Math.floor(hash2(i, seed, 3) * (iw - 2)), iy + 1 + (i % 3), 'paper');
  }
  // far rooftops with lit windows
  for (let bx = 0, i = 0; bx < iw; i++) {
    const bw = 4 + Math.floor(hash2(i, seed, 5) * 4);
    const bh = 3 + Math.floor(hash2(i, seed, 7) * Math.max(2, Math.floor(ih / 4)));
    q.rect(ix + bx, iy + ih - bh, bw, bh, 'night');
    if (hash2(i, seed, 9) > 0.35) px(q, ix + bx + 1 + (i % 2), iy + ih - bh + 2, 'honey');
    bx += bw;
  }
  // the tree, in orange leaf
  const tx = ix + 3 + Math.floor(hash2(seed, 1, 11) * Math.max(1, iw - 6));
  const cr = Math.max(3, Math.min(5, Math.floor(iw / 4)));
  const cy = iy + ih - cr - 5;
  q.rect(tx, cy, 2, iy + ih - cy, 'plum');
  px(q, tx - 1, cy + 2, 'plum');
  px(q, tx + 2, cy + 1, 'plum');
  // a ragged crown: a few overlapping clumps, lit from the low sun on the left
  const clumps: readonly (readonly [number, number, number])[] = [
    [0, -1, cr],
    [-cr + 1, 1, cr - 1],
    [cr - 1, 0, cr - 1],
    [-1, -cr + 1, cr - 2],
    [2, 2, cr - 2],
  ];
  for (const [dx, dy, r] of clumps) ellipse(q, tx + dx, cy + dy, r, Math.max(1, r - 1), 'ember');
  for (const [dx, dy, r] of clumps) {
    if (r >= 3) ellipse(q, tx + dx - 1, cy + dy - 1, r - 2, Math.max(1, r - 3), 'amber');
  }
  for (let i = 0; i < 9; i++) {
    const lx = tx - cr + Math.floor(hash2(i, seed, 13) * cr * 2);
    const ly = cy - cr + 1 + Math.floor(hash2(i, seed, 17) * (cr * 2 - 1));
    px(q, lx, ly, i % 3 === 0 ? 'red' : i % 3 === 1 ? 'lamp' : 'ember');
  }
  // a few leaves falling
  px(q, tx + cr + 2, cy + 2, 'amber');
  px(q, tx - cr - 2, cy + cr, 'lamp');
  // the frame and the blind
  p.rect(x + Math.floor(ww / 2), iy, 1, ih, 'stone');
  if (blind) {
    p.rect(ix, iy, iw, 4, 'paper');
    p.rect(ix, iy + 1, iw, 1, 'fog');
    p.rect(ix, iy + 3, iw, 1, 'fog');
    px(p, ix + iw - 3, iy + 4, 'stone');
    px(p, ix + iw - 3, iy + 5, 'stone');
  }
  p.rect(x - 1, y + wh, ww + 2, 1, 'paper');
  p.rect(x - 1, y + wh + 1, ww + 2, 1, 'concrete');
}

/** High windows in the upper wall, one in every other gap between the lamp cords. */
function paintHighWindows(p: Painter, w: number, ox: number, cornice: number): void {
  const wh = Math.min(64, cornice - 14);
  if (wh < 26) return;
  const top = Math.floor((cornice - wh) / 2);
  const step = LAMP_GAP;
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 24) / step);
  for (let k = first; centre + k * step - 24 < w; k++) {
    paintAutumnWindow(p, centre + k * step - 20, top, 41, wh, 200 + k, false);
  }
}

// ---------------------------------------------------------------------------
// The wall behind the desk

/** "JOBS" in 3x5 pixel letters. */
const JOBS: readonly (readonly string[])[] = [
  ['..#', '..#', '..#', '#.#', '###'],
  ['###', '#.#', '#.#', '#.#', '###'],
  ['##.', '#.#', '##.', '#.#', '##.'],
  ['###', '#..', '###', '..#', '###'],
];

function paintLetters(
  p: Painter,
  letters: readonly (readonly string[])[],
  x: number,
  y: number,
  color: PaletteName,
): void {
  letters.forEach((rows, i) => {
    rows.forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        if (row[xx] === '#') px(p, x + i * 4 + xx, y + yy, color);
      }
    });
  });
}

/** The three kinds of job ad: paper, ruled lines, title bar. */
const ADS: readonly (readonly [PaletteName, PaletteName, PaletteName])[] = [
  ['paper', 'fog', 'teal'],
  ['honey', 'amber', 'red'],
  ['sky', 'denim', 'paper'],
];

const PINS: readonly PaletteName[] = ['red', 'teal', 'neon', 'denim'];

/** One pinned ad, aw x ah, with unreadable lines and sometimes tear-off tabs. */
function paintAd(p: Painter, x: number, y: number, aw: number, ah: number, n: number): void {
  const [body, line, title] = ADS[Math.floor(hash2(n, 3, 71) * ADS.length)] ?? [
    'paper',
    'fog',
    'teal',
  ];
  p.rect(x + 1, y + ah, aw, 1, 'ember');
  p.rect(x + aw, y + 1, 1, ah, 'ember');
  p.rect(x, y, aw, ah, body);
  p.rect(x + 1, y + 1, aw - 2, 1, title);
  p.rect(x + 1, y + 3, aw - 2 - (n % 2), 1, line);
  if (ah >= 6 && hash2(n, 5, 73) > 0.45) {
    // tear-off tabs along the bottom
    for (let i = 1; i < aw; i += 2) px(p, x + i, y + ah - 1, line);
  } else if (ah >= 6) {
    p.rect(x + 1, y + 4, aw - 3, 1, line);
  }
  px(p, x + Math.floor(aw / 2), y, PINS[Math.floor(hash2(n, 7, 79) * PINS.length)] ?? 'red');
}

/** The big job board: a wooden frame round cork, a "JOBS" plate and three rows of ads. */
function paintJobBoard(p: Painter, x: number, y: number): void {
  const bw = 56;
  const bh = 31;
  p.rect(x + 1, y + bh, bw, 1, 'concrete');
  p.rect(x, y, bw, bh, 'ember');
  p.rect(x, y, bw, 1, 'amber');
  p.rect(x + 2, y + 2, bw - 4, bh - 4, 'amber');
  for (let i = 0; i < 40; i++) {
    const cx = x + 2 + Math.floor(hash2(i, 1, 61) * (bw - 4));
    const cy = y + 2 + Math.floor(hash2(i, 2, 61) * (bh - 4));
    px(p, cx, cy, i % 3 === 0 ? 'lamp' : 'ember');
  }
  // the plate at the top
  const plateX = x + Math.floor((bw - 21) / 2);
  p.rect(plateX + 1, y + 10, 21, 1, 'ember');
  p.rect(plateX, y + 2, 21, 8, 'teal');
  p.rect(plateX, y + 2, 21, 1, 'cyan');
  paintLetters(p, JOBS, plateX + 3, y + 4, 'paper');
  // rows of ads; the top row leaves room for the plate
  const rows: readonly [number, number][] = [
    [y + 3, 6],
    [y + 12, 6],
    [y + 20, 6],
  ];
  let n = 0;
  rows.forEach(([ry, maxH], r) => {
    let ax = x + 3 + (r % 2);
    for (let i = 0; ax + 5 <= x + bw - 3; i++, n++) {
      const aw = Math.min(x + bw - 3 - ax, 5 + Math.floor(hash2(i, r, 83) * 3));
      const ah = maxH - Math.floor(hash2(i, r, 89) * 2);
      const dy = Math.floor(hash2(i, r, 97) * 2);
      const underPlate = r === 0 && ax + aw > plateX - 1 && ax < plateX + 22;
      if (!underPlate && aw >= 5 && hash2(i, r, 101) > 0.1) paintAd(p, ax, ry + dy, aw, ah, n);
      ax += aw + 2 + Math.floor(hash2(i, r, 103) * 2);
    }
  });
  // a last row along the bottom, smaller cards
  for (let ax = x + 4, i = 0; ax + 4 <= x + bw - 3; i++, n++) {
    if (hash2(i, 9, 107) > 0.25) paintAd(p, ax, y + bh - 5, 4 + (i % 2), 3, n);
    ax += 6 + (i % 3);
  }
}

/** A wall calendar: an autumn picture over a month grid with one day ringed in red. */
function paintCalendar(p: Painter, x: number, y: number): void {
  const w = 13;
  const h = 17;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x + w, y + 1, 1, h, 'concrete');
  p.rect(x, y, w, h, 'paper');
  ditherGradient(p, x + 1, y + 2, w - 2, 6, ['mauve', 'rosy', 'lamp']);
  p.rect(x + 1, y + 6, w - 2, 2, 'ember');
  ellipse(p, x + 4, y + 5, 2, 1, 'amber');
  px(p, x + 4, y + 7, 'plum');
  px(p, x + 9, y + 5, 'red');
  p.rect(x + 1, y + 9, w - 2, 1, 'red');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) px(p, x + 2 + c * 2, y + 11 + r * 2, 'stone');
  }
  // the ringed day
  p.rect(x + 7, y + 12, 3, 1, 'red');
  p.rect(x + 7, y + 14, 3, 1, 'red');
  px(p, x + 6, y + 13, 'red');
  px(p, x + 10, y + 13, 'red');
  // the binding and the nail
  px(p, x + 3, y, 'ink');
  px(p, x + 9, y, 'ink');
  px(p, x + 6, y - 1, 'ink');
}

/** A wall rack of leaflets in three pockets. */
function paintLeafletRack(p: Painter, x: number, y: number): void {
  const colours: readonly (readonly [PaletteName, PaletteName])[] = [
    ['honey', 'lamp'],
    ['sky', 'paper'],
    ['rosy', 'paper'],
  ];
  colours.forEach(([a, b], i) => {
    const ry = y + i * 5;
    p.rect(x + 1, ry, 4, 4, a);
    p.rect(x + 6, ry + 1, 4, 3, b);
    p.rect(x + 1, ry + 1, 3, 1, 'stone');
    p.rect(x, ry + 3, 11, 2, 'stone');
    p.rect(x, ry + 3, 11, 1, 'fog');
  });
  p.rect(x, y - 1, 1, 15, 'stone');
  p.rect(x + 10, y - 1, 1, 15, 'stone');
}

// ---------------------------------------------------------------------------
// The desk and what stands on it

/** The desk from x0 to x1: a wooden top, a modesty panel, a steel leg and a drawer pedestal. */
function paintDesk(p: Painter, x0: number, x1: number, top: number, foot: number): void {
  const pedX = x0 + 52;
  // the space under the desk, in shadow
  p.rect(x0 + 3, top + 4, pedX - x0 - 3, foot - top - 4, 'night');
  p.rect(x0 + 3, top + 4, pedX - x0 - 3, 8, 'slate');
  p.rect(x0 + 3, top + 11, pedX - x0 - 3, 1, 'night');
  // the leg at the left end
  p.rect(x0, top + 4, 3, foot - top - 4, 'concrete');
  p.rect(x0, top + 4, 1, foot - top - 4, 'fog');
  // the drawer pedestal
  p.rect(pedX, top + 4, x1 - pedX, foot - top - 4, 'concrete');
  p.rect(pedX, top + 4, 1, foot - top - 4, 'fog');
  const dh = Math.floor((foot - top - 5) / 3);
  for (let i = 0; i < 3; i++) {
    const dy = top + 5 + i * dh;
    p.rect(pedX + 2, dy + dh - 1, x1 - pedX - 3, 1, 'stone');
    p.rect(pedX + Math.floor((x1 - pedX) / 2) - 2, dy + 1, 5, 1, 'paper');
    p.rect(pedX + Math.floor((x1 - pedX) / 2) - 2, dy + 2, 5, 1, 'stone');
  }
  // its shadow on the floor
  p.rect(x0, foot, x1 - x0, 1, 'ink');
  ditherRect(p, x0 - 1, foot + 1, x1 - x0 + 2, 1, 'ink', 8);
  // the wooden top
  p.rect(x0 - 1, top, x1 - x0 + 2, 1, 'honey');
  p.rect(x0 - 1, top + 1, x1 - x0 + 2, 2, 'amber');
  p.rect(x0 - 1, top + 3, x1 - x0 + 2, 1, 'ember');
}

/** A two-tier wire tray of forms at the desk's left end, standing on `base`. */
function paintFormTray(p: Painter, x: number, base: number): void {
  // lower tier
  p.rect(x + 1, base - 3, 9, 2, 'paper');
  p.rect(x + 1, base - 2, 9, 1, 'fog');
  p.rect(x, base - 1, 11, 1, 'stone');
  // the posts and the upper tier
  p.rect(x, base - 7, 1, 7, 'stone');
  p.rect(x + 10, base - 7, 1, 7, 'stone');
  p.rect(x + 1, base - 7, 9, 1, 'paper');
  p.rect(x + 2, base - 6, 8, 1, 'honey');
  p.rect(x, base - 5, 11, 1, 'stone');
  // a pen lying in front
  p.rect(x + 12, base - 1, 4, 1, 'denim');
  px(p, x + 15, base - 1, 'ink');
}

/** The keyboard, flat on the desk. */
function paintKeyboard(p: Painter, x: number, base: number): void {
  p.rect(x, base - 2, 12, 2, 'stone');
  for (let i = 1; i < 11; i += 2) px(p, x + i, base - 2, 'fog');
  p.rect(x, base - 1, 12, 1, 'slate');
}

/** The computer: a screen on a stand, turned a little towards the room, with a list on it. */
function paintMonitor(p: Painter, x: number, base: number): void {
  p.rect(x + 3, base - 1, 9, 1, 'slate');
  p.rect(x + 6, base - 4, 3, 3, 'slate');
  p.rect(x, base - 16, 14, 12, 'ink');
  p.rect(x + 13, base - 15, 1, 10, 'slate');
  p.rect(x + 1, base - 15, 11, 9, 'denim');
  p.rect(x + 1, base - 15, 11, 2, 'teal');
  for (let i = 0; i < 3; i++) {
    px(p, x + 2, base - 12 + i * 2, 'cyan');
    p.rect(x + 4, base - 12 + i * 2, 6 - (i % 2) * 2, 1, 'sky');
  }
  px(p, x + 10, base - 14, 'paper');
}

/** Her office chair, pushed back behind the desk: a tall dark back. */
function paintOfficeChair(p: Painter, x: number, deskTop: number): void {
  p.rect(x + 1, deskTop - 14, 9, 1, 'slate');
  p.rect(x, deskTop - 13, 11, 13, 'slate');
  p.rect(x + 1, deskTop - 13, 1, 12, 'stone');
  p.rect(x + 3, deskTop - 10, 6, 1, 'night');
}

/** The visitor's chair in front of the desk, its back to you, standing at `foot`. */
function paintVisitorChair(p: Painter, x: number, foot: number): void {
  // the back pad on its post
  p.rect(x, foot - 22, 3, 11, 'teal');
  p.rect(x, foot - 22, 3, 1, 'cyan');
  p.rect(x + 2, foot - 21, 1, 10, 'moss');
  p.rect(x + 1, foot - 11, 1, 3, 'slate');
  // the seat
  p.rect(x, foot - 9, 12, 2, 'teal');
  p.rect(x + 1, foot - 9, 11, 1, 'cyan');
  p.rect(x, foot - 7, 12, 1, 'moss');
  // the legs
  p.rect(x + 1, foot - 6, 1, 6, 'slate');
  p.rect(x + 10, foot - 6, 1, 6, 'slate');
  p.rect(x + 1, foot - 3, 10, 1, 'slate');
  px(p, x + 1, foot - 1, 'ink');
  px(p, x + 10, foot - 1, 'ink');
}

// ---------------------------------------------------------------------------
// Above the core

const BINDERS: readonly PaletteName[] = ['denim', 'red', 'teal', 'honey', 'plum', 'leaf', 'sky'];

/** A long shelf of ring binders along the wall, its top at `y`; the lamp cords hang between them. */
function paintBinderShelf(p: Painter, w: number, ox: number, y: number): void {
  const first = Math.floor(-(ox + LAMP_X) / LAMP_GAP) - 1;
  for (let k = first; ox + LAMP_X + k * LAMP_GAP < w; k++) {
    const x0 = ox + LAMP_X + k * LAMP_GAP + 9;
    const x1 = x0 + LAMP_GAP - 18;
    for (let x = x0, i = 0; x + 3 <= x1; i++) {
      const bw = 3 + Math.floor(hash2(i, k, 113) * 2);
      const bh = 7 + Math.floor(hash2(i, k, 127) * 3);
      if (hash2(i, k, 131) > 0.12) {
        const c = BINDERS[Math.floor(hash2(i, k, 137) * BINDERS.length)] ?? 'denim';
        p.rect(x, y - bh, bw, bh, c);
        p.rect(x + bw - 1, y - bh, 1, bh, 'night');
        p.rect(x, y - bh + 2, bw - 1, 2, 'paper');
        px(p, x + 1, y - 3, 'ink');
      }
      x += bw + (hash2(i, k, 139) > 0.8 ? 2 : 0);
    }
  }
  p.rect(0, y, w, 1, 'amber');
  p.rect(0, y + 1, w, 1, 'ember');
  for (let x = mod(ox + 12, 32) - 32; x < w; x += 32) p.rect(x, y + 2, 1, 2, 'stone');
}

/** The office sign: a teal board with a briefcase and two bars of (unreadable) lettering. */
function paintSign(p: Painter, x: number, y: number): void {
  const w = 44;
  const h = 14;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'paper');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'teal');
  // the briefcase
  p.rect(x + 6, y + 3, 5, 2, 'lamp');
  p.rect(x + 7, y + 4, 3, 1, 'teal');
  p.rect(x + 4, y + 5, 9, 6, 'lamp');
  p.rect(x + 4, y + 7, 9, 1, 'amber');
  px(p, x + 8, y + 7, 'honey');
  // lettering
  p.rect(x + 16, y + 4, 24, 2, 'paper');
  p.rect(x + 16, y + 8, 17, 2, 'cyan');
}

/** A framed poster: a little figure planting a flag on a mountain top. */
function paintPoster(p: Painter, x: number, y: number): void {
  const w = 20;
  const h = 18;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'ink');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['violet', 'rosy', 'honey']);
  for (let i = 0; i < 9; i++)
    p.rect(x + 1 + i, y + h - 2 - i, w - 2 - i * 2, 1, i < 3 ? 'stone' : 'concrete');
  p.rect(x + 7, y + 9, 5, 1, 'paper');
  p.rect(x + 10, y + 3, 1, 5, 'ink');
  p.rect(x + 11, y + 3, 3, 2, 'red');
  p.rect(x + 2, y + h - 1, w - 4, 1, 'paper');
}

// ---------------------------------------------------------------------------
// Beside the core

/** Linked waiting chairs under a queue-number display. */
function paintWaitingBay(p: Painter, x: number, oy: number, floorTop: number): void {
  // the number display: "07" in red on black
  p.rect(x + 13, oy + 10, 19, 11, 'slate');
  p.rect(x + 14, oy + 11, 17, 9, 'ink');
  paintLetters(
    p,
    [
      ['###', '#.#', '#.#', '#.#', '###'],
      ['###', '..#', '.#.', '.#.', '.#.'],
    ],
    x + 19,
    oy + 13,
    'red',
  );
  px(p, x + 16, oy + 13, 'neon');
  // three seats on a beam
  const foot = floorTop + 6;
  for (let i = 0; i < 3; i++) {
    const sx = x + 5 + i * 12;
    p.rect(sx, foot - 18, 10, 8, 'teal');
    p.rect(sx, foot - 18, 10, 1, 'cyan');
    p.rect(sx + 9, foot - 17, 1, 7, 'moss');
    p.rect(sx, foot - 9, 10, 2, 'teal');
    p.rect(sx, foot - 9, 10, 1, 'cyan');
  }
  p.rect(x + 4, foot - 7, 36, 1, 'slate');
  p.rect(x + 8, foot - 6, 1, 6, 'slate');
  p.rect(x + 36, foot - 6, 1, 6, 'slate');
  p.rect(x + 6, foot - 1, 5, 1, 'ink');
  p.rect(x + 34, foot - 1, 5, 1, 'ink');
  // a leaflet left on a seat
  p.rect(x + 19, foot - 10, 4, 1, 'honey');
}

/** A window onto the autumn dusk with a radiator under it. */
function paintWindowBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  paintAutumnWindow(p, x + 7, oy + 6, 30, 26, 100 + i, true);
  const top = oy + 38;
  p.rect(x + 9, top, 26, floorTop - top - 3, 'paper');
  for (let rx = x + 10; rx < x + 34; rx += 3) p.rect(rx, top + 1, 1, floorTop - top - 5, 'fog');
  p.rect(x + 9, floorTop - 3, 26, 1, 'concrete');
  p.rect(x + 11, floorTop - 2, 1, 2, 'stone');
  p.rect(x + 32, floorTop - 2, 1, 2, 'stone');
}

/** A water cooler and a potted plant. */
function paintCoolerBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const foot = floorTop + 4;
  // the bottle
  p.rect(x + 9, foot - 32, 8, 2, 'sky');
  p.rect(x + 8, foot - 30, 10, 8, 'sky');
  p.rect(x + 9, foot - 29, 2, 6, 'paper');
  p.rect(x + 16, foot - 30, 2, 8, 'denim');
  // the stand
  p.rect(x + 7, foot - 22, 12, 22, 'paper');
  p.rect(x + 17, foot - 22, 2, 22, 'fog');
  p.rect(x + 10, foot - 17, 2, 2, 'red');
  p.rect(x + 14, foot - 17, 2, 2, 'denim');
  p.rect(x + 9, foot - 13, 8, 1, 'stone');
  p.rect(x + 7, foot - 1, 12, 1, 'stone');
  // a cup on the stand's side shelf
  p.rect(x + 3, foot - 10, 3, 3, 'paper');
  p.rect(x + 2, foot - 7, 5, 1, 'stone');
  paintPlant(p, x + 27, foot - 20);
  // a small framed notice
  p.rect(x + 25, oy + 12, 12, 14, 'ember');
  p.rect(x + 26, oy + 13, 10, 12, 'paper');
  p.rect(x + 27, oy + 15, 8, 1, 'teal');
  p.rect(x + 27, oy + 18, 7, 1, 'fog');
  p.rect(x + 27, oy + 20, 6, 1, 'fog');
}

/** Grey filing cabinets with a printer on one and box files on the other. */
function paintCabinetBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  const foot = floorTop + 2;
  for (let c = 0; c < 2; c++) {
    const cx = x + 4 + c * 18;
    const top = foot - 26;
    p.rect(cx, top, 16, 26, 'concrete');
    p.rect(cx, top, 16, 1, 'fog');
    p.rect(cx + 15, top, 1, 26, 'stone');
    for (let d = 0; d < 4; d++) {
      const dy = top + 2 + d * 6;
      p.rect(cx + 1, dy + 5, 14, 1, 'stone');
      p.rect(cx + 5, dy + 2, 6, 1, 'paper');
      p.rect(cx + 6, dy + 1, 4, 1, 'stone');
    }
    p.rect(cx, foot, 16, 1, 'ink');
  }
  // the printer
  const pt = foot - 26;
  p.rect(x + 5, pt - 7, 14, 7, 'paper');
  p.rect(x + 5, pt - 7, 14, 1, 'fog');
  p.rect(x + 7, pt - 9, 10, 2, 'fog');
  p.rect(x + 7, pt - 4, 10, 1, 'ink');
  px(p, x + 16, pt - 6, 'leaf');
  p.rect(x + 8, pt - 3, 8, 1, 'paper');
  // box files on the other cabinet
  for (let b = 0; b < 3; b++) {
    const c = BINDERS[Math.floor(hash2(b, i, 149) * BINDERS.length)] ?? 'denim';
    p.rect(x + 24 + b * 4, pt - 9, 3, 9, c);
    p.rect(x + 24 + b * 4, pt - 7, 3, 2, 'paper');
  }
  // a framed certificate above
  p.rect(x + 10, oy + 6, 18, 14, 'amber');
  p.rect(x + 11, oy + 7, 16, 12, 'paper');
  p.rect(x + 13, oy + 9, 12, 1, 'stone');
  p.rect(x + 14, oy + 12, 10, 1, 'fog');
  p.rect(x + 14, oy + 14, 8, 1, 'fog');
  p.rect(x + 22, oy + 15, 3, 3, 'red');
}

// ---------------------------------------------------------------------------
// The counselor, Ms. Lopez: 16x24, facing left. A woman in her forties with
// dark shoulder-length hair, a navy blazer over a white blouse, a red lanyard
// with her badge, grey trousers. Kind and practical. She stands behind her
// desk (only the top part shows); the legs are there so the sprite can bob
// without a gap at the desk line. The resume workshop uses her too.

export const COUNSELOR_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhhhh.....',
    '.....hhHHhhhh...',
    '....hhhhhhhhhh..',
    '....shhhhhhhhh..',
    '...ssesshhhhhh..',
    '....sssshhhhhh..',
    '....rssshhhhhhh.',
    '......sshhhhhh..',
    '.....wwbbhhhhh..',
    '....bwlbbbbbbb..',
    '....bwlbbbbbbb..',
    '....bblbbbbabb..',
    '....bnnbbbbabb..',
    '....bnNbbbbabb..',
    '....bbbbbbbsbb..',
    '....bbbbbbbbbb..',
    '.....tttttttt...',
    '.....tttttt.....',
    '......ttqq......',
    '......ttqq......',
    '......ttqq......',
    '......ttqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'night',
    H: 'stone',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    w: 'paper',
    b: 'denim',
    a: 'indigo',
    l: 'red',
    n: 'paper',
    N: 'sky',
    t: 'slate',
    q: 'night',
    k: 'ink',
  },
};

export const JOB_CENTER_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    counselor: {
      sprite: COUNSELOR_SPRITE,
      x: 90,
      y: 19,
      side: 'right',
      clipBottom: DESK.top,
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 96, y: 5 } },
  rest: {
    left: { x: DESK.x + 10, y: PROP_TOP },
    // Stops short of the counselor, so a prop stays clear of her face.
    right: { x: DESK.x + 22, y: PROP_TOP },
  },
};
