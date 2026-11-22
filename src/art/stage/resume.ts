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
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { COUNSELOR_SPRITE } from './jobCenter';
import { FRIEND_SPRITE } from './restaurant';

/**
 * The resume-workshop stage: the computer room of the job center on an
 * October evening, the same building as the job-center stage (its walls,
 * floor, ceiling lights and autumn dusk outside) but another room. From the
 * left: a workshop computer under a window, a whiteboard with a ticked
 * checklist behind you, then the long work table between you and the
 * counselor with a printed resume, the keyboard and your computer showing
 * the draft (handed-over things rest on the table). On the wall behind it,
 * sample resumes hang from a clip rail; on the right stands the big office
 * printer with fresh pages in its tray. Painted through the Painter
 * interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a roll-up projector screen, then a
 * sign, a poster and the clock, then an upper wall with high windows), and
 * the row of workshop computers continues sideways, with windows and a paper
 * shelf between them.
 */

/** The work table: left and right edges and the y of its top, in core pixels. */
const TABLE = { x: 38, x1: 84, top: 46 } as const;
/** 24x24 pictures stand on the table top with their shadow on it. */
const PROP_TOP = TABLE.top - 20;
/** The y in the core where the table's legs stand. */
const TABLE_FOOT = 60;

const FLOOR_TOP = 54;
/** Top of the painted lower wall. */
const DADO_TOP = 43;
/** Top of the workshop benches along the wall. */
const BENCH_TOP = 42;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The ceiling lights: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 30;
const LAMP_GAP = 64;
/** Wall above the core needed for the screen case, for the sign row, and for the upper wall. */
const SCREEN_MIN = 10;
const SIGN_MIN = 34;
const CORNICE_MIN = 56;
/** How far above the core the upper wall starts. */
const CORNICE_UP = 40;

/** Where Ms. Lopez stands, beside your computer; Mia stands here too when alone. */
const COUNSELOR_SPOT = { x: 82, y: 39 } as const;
/** Mia's place by the printer when the counselor is on stage too. */
const FRIEND_BESIDE = { x: 96, y: 39 } as const;

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

/** Paints the computer room to fill a w x h stage (at least the 128x64 core). */
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
  if (oy >= SIGN_MIN) {
    if (ox + 6 >= 0) paintPoster(p, ox + 8, oy - 31);
    paintSign(p, ox + 42, oy - 30);
    paintSpeaker(p, ox + 100, oy - 30);
  }
  if (oy >= SCREEN_MIN) paintScreenCase(p, ox + 34, oy - 7);

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: the row of workshop computers goes on both ways,
  // with windows and a paper shelf between them.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i % 3 === 1) paintWindowBay(p, x, oy, floorTop, i);
    else paintComputerBay(p, x, oy, floorTop, i);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    if (i === 0) paintPaperBay(p, x, oy, floorTop);
    else if (i % 2 === 1) paintComputerBay(p, x, oy, floorTop, 30 + i);
    else paintWindowBay(p, x, oy, floorTop, 50 + i);
  }

  // The core: a workshop computer under the window, the whiteboard, the
  // sample resumes, the printer and the clock.
  paintAutumnWindow(p, ox + 2, oy + 5, 18, 22, 0, true);
  paintWorkstation(p, ox - 2, oy, floorTop, 0);
  paintWhiteboard(p, ox + 24, oy + 5);
  paintResumeRail(p, ox + 59, oy + 6);
  paintClock(p, ox + 117, oy + 12);
  paintPrinter(p, ox + 107, floorTop + 3);
  for (const lx of lamps) paintLamp(p, lx, oy);

  // The work table and what stands on it.
  paintTable(p, ox + TABLE.x, ox + TABLE.x1, oy + TABLE.top, oy + TABLE_FOOT);
  paintPaperResume(p, ox + TABLE.x + 3, oy + TABLE.top);
  paintKeyboard(p, ox + 55, oy + TABLE.top);
  paintMonitor(p, ox + 70, oy + TABLE.top);
}

// ---------------------------------------------------------------------------
// Room (the same paint, tiles and lights as the job center's front office)

/**
 * The wall: pale grey-lilac paint. On a tall stage a rail runs at `cornice`
 * and the wall above it is a darker grey with a faint dot pattern.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'fog');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'slate');
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
  for (let i = 0; i < Math.max(1, Math.floor(iw / 10)); i++) {
    px(q, ix + 1 + Math.floor(hash2(i, seed, 3) * (iw - 2)), iy + 5 + (i % 3), 'paper');
  }
  // far rooftops with lit windows
  for (let bx = 0, i = 0; bx < iw; i++) {
    const bw = 4 + Math.floor(hash2(i, seed, 5) * 4);
    const bh = 3 + Math.floor(hash2(i, seed, 7) * Math.max(2, Math.floor(ih / 4)));
    q.rect(ix + bx, iy + ih - bh, bw, bh, 'night');
    if (hash2(i, seed, 9) > 0.35) px(q, ix + bx + 1 + (i % 2), iy + ih - bh + 2, 'honey');
    bx += bw;
  }
  // a tree in orange leaf, lit from the low sun on the left
  const tx = ix + 3 + Math.floor(hash2(seed, 1, 11) * Math.max(1, iw - 6));
  const cr = Math.max(3, Math.min(5, Math.floor(iw / 4)));
  const cy = iy + ih - cr - 5;
  q.rect(tx, cy, 2, iy + ih - cy, 'plum');
  px(q, tx - 1, cy + 2, 'plum');
  px(q, tx + 2, cy + 1, 'plum');
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
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 24) / LAMP_GAP);
  for (let k = first; centre + k * LAMP_GAP - 24 < w; k++) {
    paintAutumnWindow(p, centre + k * LAMP_GAP - 20, top, 41, wh, 300 + k, false);
  }
}

// ---------------------------------------------------------------------------
// The wall behind you and the counselor

/** The whiteboard: an aluminium frame, a title bar and a checklist of four lines, three ticked. */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  const w = 30;
  const h = 24;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'stone');
  p.rect(x, y, w, 1, 'fog');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  // a soft sheen across the top corner
  for (let i = 0; i < 5; i++) px(p, x + w - 4 - i, y + 2 + i, 'fog');
  // the heading, in teal marker
  p.rect(x + 4, y + 3, 14, 2, 'teal');
  p.rect(x + 4, y + 5, 10, 1, 'teal');
  // four lines: a box (ticked or not) and a stroke of writing
  const lengths = [16, 12, 18, 10];
  for (let i = 0; i < 4; i++) {
    const ry = y + 8 + i * 4;
    p.rect(x + 3, ry, 3, 3, 'stone');
    px(p, x + 4, ry + 1, 'paper');
    if (i < 3) {
      // the tick, in green marker, spilling out of the box
      px(p, x + 3, ry + 1, 'leaf');
      px(p, x + 4, ry + 2, 'leaf');
      px(p, x + 5, ry + 1, 'leaf');
      px(p, x + 6, ry, 'leaf');
      px(p, x + 7, ry - 1, 'leaf');
    }
    p.rect(x + 9, ry + 1, lengths[i] ?? 10, 1, i === 3 ? 'red' : 'denim');
  }
  // the marker tray with two pens and an eraser
  p.rect(x + 2, y + h, w - 4, 1, 'stone');
  p.rect(x + 2, y + h + 1, w - 4, 1, 'slate');
  p.rect(x + 6, y + h - 1, 4, 1, 'teal');
  p.rect(x + 12, y + h - 1, 4, 1, 'red');
  p.rect(x + 21, y + h - 2, 5, 2, 'denim');
  p.rect(x + 21, y + h - 2, 5, 1, 'sky');
}

/**
 * One sample resume, 11 x 14: a photo square in the top corner, a name bar,
 * and rows of unreadable lines in two sections.
 */
function paintSheet(p: Painter, x: number, y: number, n: number): void {
  const w = 11;
  const h = 14;
  p.rect(x + 1, y + 1, w, h, 'concrete');
  p.rect(x, y, w, h, 'paper');
  // the photo: a face on a blue ground
  const hair: PaletteName = n === 1 ? 'amber' : n === 2 ? 'ember' : 'night';
  p.rect(x + 1, y + 1, 4, 5, 'sky');
  p.rect(x + 2, y + 2, 2, 2, 'skin');
  p.rect(x + 2, y + 1, 2, 1, hair);
  px(p, x + 1, y + 2, hair);
  p.rect(x + 1, y + 4, 4, 2, n === 2 ? 'teal' : 'denim');
  // the name bar and a line under it
  p.rect(x + 6, y + 2, 4, 1, 'ink');
  p.rect(x + 6, y + 4, 3, 1, 'fog');
  // a section rule and lines
  p.rect(x + 1, y + 7, w - 2, 1, n === 1 ? 'red' : 'teal');
  p.rect(x + 1, y + 9, w - 3 - (n % 2), 1, 'fog');
  p.rect(x + 1, y + 11, w - 4 + (n % 2), 1, 'fog');
  p.rect(x + 1, y + 12, w - 6, 1, 'fog');
}

/** A clip rail on the wall with sample resumes hanging from bulldog clips. */
function paintResumeRail(p: Painter, x: number, y: number): void {
  const w = 42;
  p.rect(x, y, w, 2, 'amber');
  p.rect(x, y + 1, w, 1, 'ember');
  p.rect(x + 1, y + 2, w - 2, 1, 'concrete');
  px(p, x + 1, y, 'honey');
  px(p, x + w - 2, y, 'honey');
  const spots = [2, 16, 29];
  spots.forEach((sx, n) => {
    const sy = y + 3 + (n === 1 ? 1 : 0);
    paintSheet(p, x + sx, sy, n);
    // the clip
    p.rect(x + sx + 4, y + 1, 3, 3, 'ink');
    px(p, x + sx + 5, y + 1, 'stone');
  });
  // a little star sticker on the good example
  px(p, x + 26, y + 13, 'lamp');
  p.rect(x + 25, y + 14, 3, 1, 'lamp');
  px(p, x + 26, y + 15, 'lamp');
}

// ---------------------------------------------------------------------------
// The work table and what stands on it

/**
 * The work table from x0 to x1: a pale laminate top on grey steel legs with a
 * crossbar, and a computer tower standing under the right end.
 */
function paintTable(p: Painter, x0: number, x1: number, top: number, foot: number): void {
  // the shadow under the top
  ditherRect(p, x0 + 2, top + 3, x1 - x0 - 4, 2, 'stone', 8);
  // the legs and the crossbar
  for (const lx of [x0 + 1, x1 - 3]) {
    p.rect(lx, top + 3, 2, foot - top - 3, 'slate');
    px(p, lx, top + 3, 'stone');
    p.rect(lx - 1, foot - 1, 4, 1, 'ink');
  }
  p.rect(x0 + 3, foot - 7, x1 - x0 - 6, 1, 'slate');
  // a cable tray under the top
  p.rect(x0 + 6, top + 3, x1 - x0 - 14, 2, 'night');
  // the computer tower under the right end
  const tx = x1 - 13;
  p.rect(tx, foot - 13, 8, 13, 'ink');
  p.rect(tx + 1, foot - 12, 6, 11, 'slate');
  p.rect(tx + 2, foot - 11, 4, 1, 'stone');
  p.rect(tx + 2, foot - 9, 4, 1, 'stone');
  px(p, tx + 5, foot - 5, 'cyan');
  // its shadow on the floor
  ditherRect(p, x0, foot, x1 - x0, 1, 'ink', 8);
  // the top: a pale edge, a lit surface and a darker lip
  p.rect(x0 - 1, top, x1 - x0 + 2, 1, 'paper');
  p.rect(x0 - 1, top + 1, x1 - x0 + 2, 1, 'fog');
  p.rect(x0 - 1, top + 2, x1 - x0 + 2, 1, 'concrete');
  p.rect(x0 - 1, top + 3, x1 - x0 + 2, 1, 'stone');
}

/** The printed resume lying on the table, seen at a slant, with a pen across it. */
function paintPaperResume(p: Painter, x: number, base: number): void {
  p.rect(x + 1, base - 2, 11, 2, 'paper');
  p.rect(x, base - 1, 11, 1, 'paper');
  px(p, x + 2, base - 2, 'sky');
  p.rect(x + 4, base - 2, 4, 1, 'stone');
  p.rect(x + 2, base - 1, 7, 1, 'fog');
  p.rect(x, base, 11, 1, 'concrete');
  // the pen
  p.rect(x + 7, base - 3, 5, 1, 'red');
  px(p, x + 12, base - 3, 'ink');
}

/** The keyboard and the mouse, flat on the table. */
function paintKeyboard(p: Painter, x: number, base: number): void {
  p.rect(x, base - 2, 12, 2, 'stone');
  for (let i = 1; i < 11; i += 2) px(p, x + i, base - 2, 'fog');
  p.rect(x, base - 1, 12, 1, 'slate');
  p.rect(x + 14, base - 2, 2, 2, 'fog');
  px(p, x + 14, base - 2, 'paper');
}

/** Your computer at the table's right end, the resume draft open on the screen. */
function paintMonitor(p: Painter, x: number, base: number): void {
  p.rect(x + 3, base - 1, 8, 1, 'slate');
  p.rect(x + 6, base - 4, 2, 3, 'slate');
  p.rect(x, base - 16, 13, 12, 'ink');
  p.rect(x + 1, base - 15, 11, 10, 'denim');
  // the page of the draft
  p.rect(x + 3, base - 14, 7, 9, 'paper');
  p.rect(x + 4, base - 13, 2, 2, 'sky');
  p.rect(x + 7, base - 13, 2, 1, 'ink');
  p.rect(x + 4, base - 10, 5, 1, 'teal');
  p.rect(x + 4, base - 8, 4, 1, 'fog');
  p.rect(x + 4, base - 7, 5, 1, 'fog');
  // the text cursor
  px(p, x + 9, base - 8, 'denim');
}

// ---------------------------------------------------------------------------
// Workshop computers and the printer

/** One workshop computer on a bench against the wall: a screen, a keyboard and a chair. */
function paintWorkstation(p: Painter, x: number, oy: number, floorTop: number, n: number): void {
  const top = oy + BENCH_TOP;
  // the bench
  p.rect(x, top, 22, 2, 'fog');
  p.rect(x, top, 22, 1, 'paper');
  p.rect(x, top + 2, 22, 1, 'stone');
  p.rect(x + 2, top + 3, 2, floorTop - top - 1, 'slate');
  p.rect(x + 18, top + 3, 2, floorTop - top - 1, 'slate');
  // the screen, with a blue page or a resume on it
  const sx = x + 5;
  p.rect(sx + 5, top - 3, 2, 3, 'slate');
  p.rect(sx + 3, top - 1, 6, 1, 'slate');
  p.rect(sx, top - 13, 12, 10, 'ink');
  p.rect(sx + 1, top - 12, 10, 8, n % 2 === 0 ? 'teal' : 'denim');
  p.rect(sx + 3, top - 11, 5, 7, 'paper');
  p.rect(sx + 4, top - 10, 1, 2, 'sky');
  p.rect(sx + 4, top - 7, 3, 1, 'fog');
  p.rect(sx + 4, top - 6, 2, 1, 'fog');
  px(p, sx + 9, top - 11, 'cyan');
  // the keyboard
  p.rect(x + 4, top - 1, 10, 1, 'stone');
  // the chair, tucked in, its back to the room
  const cx = x + 7;
  p.rect(cx, top + 1, 9, 8, 'slate');
  p.rect(cx, top + 1, 9, 1, 'stone');
  p.rect(cx + 1, top + 3, 7, 1, 'night');
  p.rect(cx + 4, top + 9, 1, floorTop - top - 7, 'ink');
  p.rect(cx + 1, floorTop + 2, 7, 1, 'ink');
}

/**
 * The big office printer standing on the floor at `foot`: a scanner lid, an
 * output tray of fresh pages, a little control panel and paper drawers.
 */
function paintPrinter(p: Painter, x: number, foot: number): void {
  const w = 20;
  const top = foot - 26;
  // its shadow on the floor
  p.rect(x - 1, foot, w + 2, 1, 'ink');
  // the base with two paper drawers
  p.rect(x, top + 10, w, 16, 'paper');
  p.rect(x + w - 2, top + 10, 2, 16, 'fog');
  for (let d = 0; d < 2; d++) {
    const dy = top + 13 + d * 6;
    p.rect(x + 1, dy + 5, w - 3, 1, 'fog');
    p.rect(x + 6, dy + 1, 6, 1, 'stone');
  }
  p.rect(x, foot - 2, w, 2, 'stone');
  // the body and the output slot with fresh pages
  p.rect(x, top + 3, w, 7, 'fog');
  p.rect(x, top + 3, w, 1, 'paper');
  p.rect(x + 2, top + 6, 13, 2, 'night');
  p.rect(x + 1, top + 5, 12, 2, 'paper');
  p.rect(x + 2, top + 6, 10, 1, 'fog');
  px(p, x + 4, top + 5, 'stone');
  p.rect(x + 6, top + 5, 4, 1, 'stone');
  // the control panel with a green light
  p.rect(x + 14, top + 4, 5, 3, 'slate');
  px(p, x + 15, top + 5, 'leaf');
  px(p, x + 17, top + 5, 'cyan');
  // the scanner lid
  p.rect(x + 1, top, w - 2, 3, 'concrete');
  p.rect(x + 1, top, w - 2, 1, 'fog');
  // a stack of printed pages waiting on the lid
  p.rect(x + 4, top - 3, 10, 3, 'paper');
  p.rect(x + 4, top - 2, 10, 1, 'fog');
  p.rect(x + 5, top - 4, 9, 1, 'paper');
  px(p, x + 6, top - 4, 'sky');
  p.rect(x + 8, top - 4, 4, 1, 'stone');
}

// ---------------------------------------------------------------------------
// Above the core

/** A roll-up projector screen in its long case, with the pull cord hanging down. */
function paintScreenCase(p: Painter, x: number, y: number): void {
  const w = 60;
  p.rect(x - 2, y - 1, 2, 3, 'stone');
  p.rect(x + w, y - 1, 2, 3, 'stone');
  p.rect(x, y - 2, w, 4, 'paper');
  p.rect(x, y + 1, w, 1, 'fog');
  p.rect(x, y + 2, w, 1, 'stone');
  p.rect(x + 29, y + 3, 1, 3, 'ink');
  p.rect(x + 28, y + 6, 3, 1, 'ink');
}

/** The room sign: a teal board with a page icon and two bars of (unreadable) lettering. */
function paintSign(p: Painter, x: number, y: number): void {
  const w = 44;
  const h = 14;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'paper');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'teal');
  // a page with a photo square and lines
  p.rect(x + 5, y + 3, 8, 9, 'paper');
  p.rect(x + 6, y + 4, 2, 2, 'lamp');
  p.rect(x + 9, y + 4, 3, 1, 'teal');
  p.rect(x + 6, y + 7, 6, 1, 'stone');
  p.rect(x + 6, y + 9, 5, 1, 'stone');
  px(p, x + 12, y + 3, 'teal');
  // lettering
  p.rect(x + 16, y + 4, 24, 2, 'paper');
  p.rect(x + 16, y + 8, 15, 2, 'cyan');
}

/** A small wall speaker on a bracket. */
function paintSpeaker(p: Painter, x: number, y: number): void {
  p.rect(x + 3, y - 2, 3, 2, 'stone');
  p.rect(x + 1, y + 13, 9, 1, 'concrete');
  p.rect(x, y, 9, 13, 'slate');
  p.rect(x, y, 9, 1, 'stone');
  ellipse(p, x + 4, y + 8, 2, 2, 'night');
  px(p, x + 4, y + 8, 'stone');
  px(p, x + 4, y + 3, 'night');
  px(p, x + 7, y + 11, 'leaf');
}

/** A framed poster: steps going up to a star. */
function paintPoster(p: Painter, x: number, y: number): void {
  const w = 20;
  const h = 18;
  p.rect(x + 1, y + h, w, 1, 'concrete');
  p.rect(x, y, w, h, 'ink');
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['indigo', 'violet', 'mauve']);
  for (let i = 0; i < 4; i++) {
    p.rect(x + 2 + i * 4, y + h - 4 - i * 3, w - 3 - (2 + i * 4), 1, 'paper');
    p.rect(x + 2 + i * 4, y + h - 3 - i * 3, w - 3 - (2 + i * 4), 2 + i * 3, 'teal');
  }
  px(p, x + 15, y + 2, 'honey');
  p.rect(x + 14, y + 3, 3, 1, 'honey');
  px(p, x + 15, y + 4, 'honey');
  p.rect(x + 2, y + h - 1, w - 4, 1, 'paper');
}

// ---------------------------------------------------------------------------
// Beside the core

/** One more workshop computer, under a small framed notice. */
function paintComputerBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  paintWorkstation(p, x + 11, oy, floorTop, i);
  p.rect(x + 14, oy + 10, 16, 13, 'stone');
  p.rect(x + 15, oy + 11, 14, 11, 'paper');
  p.rect(x + 17, oy + 13, 10, 1, hash2(i, 2, 7) > 0.5 ? 'teal' : 'red');
  p.rect(x + 17, oy + 16, 8, 1, 'fog');
  p.rect(x + 17, oy + 18, 9, 1, 'fog');
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

const FOLDERS: readonly PaletteName[] = ['denim', 'red', 'teal', 'honey', 'plum', 'sky'];

/** Open shelves of paper reams and folders, with a plant beside them. */
function paintPaperBay(p: Painter, x: number, oy: number, floorTop: number): void {
  const x0 = x + 4;
  const top = oy + 16;
  const foot = floorTop + 2;
  p.rect(x0, top, 26, foot - top, 'ember');
  p.rect(x0 + 1, top + 1, 24, foot - top - 2, 'night');
  const shelves = [top + 12, top + 24, foot - 2];
  for (const sy of shelves) {
    p.rect(x0, sy, 26, 2, 'amber');
    p.rect(x0, sy, 26, 1, 'honey');
  }
  // reams of paper on the top shelf
  for (let r = 0; r < 3; r++) {
    p.rect(x0 + 2, shelves[0]! - 3 - r * 3, 10, 3, 'paper');
    p.rect(x0 + 2, shelves[0]! - 2 - r * 3, 10, 1, r === 1 ? 'sky' : 'fog');
  }
  p.rect(x0 + 15, shelves[0]! - 5, 8, 5, 'paper');
  p.rect(x0 + 15, shelves[0]! - 3, 8, 1, 'lamp');
  // folders and box files below
  for (let b = 0; b < 6; b++) {
    const c = FOLDERS[Math.floor(hash2(b, 1, 151) * FOLDERS.length)] ?? 'denim';
    const bh = 8 + (b % 2);
    p.rect(x0 + 2 + b * 4, shelves[1]! - bh, 3, bh, c);
    p.rect(x0 + 2 + b * 4, shelves[1]! - bh + 2, 3, 2, 'paper');
  }
  for (let b = 0; b < 3; b++) {
    p.rect(x0 + 2 + b * 8, shelves[2]! - 8, 7, 8, 'concrete');
    p.rect(x0 + 2 + b * 8, shelves[2]! - 8, 7, 1, 'fog');
    p.rect(x0 + 4 + b * 8, shelves[2]! - 5, 3, 1, 'stone');
  }
  paintPlant(p, x + 32, floorTop - 14);
}

export const RESUME_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    // Ms. Lopez stands in the open beside your computer.
    counselor: { sprite: COUNSELOR_SPRITE, ...COUNSELOR_SPOT, side: 'right' },
    // Mia reads the draft from the same spot when alone; with the counselor
    // there too she stands by the printer.
    friend: { sprite: FRIEND_SPRITE, ...COUNSELOR_SPOT, side: 'right', beside: FRIEND_BESIDE },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 60, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 88, y: 25 } },
  rest: {
    left: { x: TABLE.x + 2, y: PROP_TOP },
    // Stops short of the screen, so a picture stays clear of it and of her.
    right: { x: TABLE.x + 8, y: PROP_TOP },
  },
};
