import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W, paintClock, paintLamp, paintWindow } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The library stage: a small public library on a September evening. From the
 * left: a tall bookcase, the cork notice board with pinned notes above you, a
 * public computer on its little table, then the librarian's wooden desk with
 * a stack of books in front of her and a green reading lamp at its end.
 * Behind the desk: a window onto the dusk, a low cabinet with a globe, and
 * tall bookcases full of coloured spines. Painted through the Painter
 * interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; the bookcases and the window behind the desk rise higher on a
 * taller stage, with a clock, a framed print and then arched windows on the
 * wall above; to the sides come reading tables under windows, more bookcases
 * and the printer.
 */

/** The desk's left edge and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 54, top: 40 } as const;
/** 24x24 pictures stand on the desk top with their shadow on it. */
const PROP_TOP = DESK.top - 20;

const FLOOR_TOP = 56;
/** Top of the wooden panelling on the lower wall. */
const PANEL_TOP = 44;
/** Desk length past the core's right edge before it ends. */
const DESK_TAIL = 24;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The pendant lamps: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 44;
const LAMP_GAP = 56;
/** How far the bookcases may rise above the core on a tall stage. */
const CASE_RISE = 60;
/** One shelf of books: the board, then this many pixels up to the next board. */
const SHELF_GAP = 10;
/** Wall above the bookcases needed for arched windows. */
const ARCH_MIN = 44;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A book's colours: spine, shade, the band or title strip. */
type Binding = readonly [PaletteName, PaletteName, PaletteName];

const BINDINGS: readonly Binding[] = [
  ['red', 'maroon', 'honey'],
  ['teal', 'moss', 'paper'],
  ['denim', 'indigo', 'honey'],
  ['moss', 'night', 'lamp'],
  ['leaf', 'moss', 'paper'],
  ['honey', 'amber', 'ember'],
  ['paper', 'fog', 'red'],
  ['maroon', 'plum', 'lamp'],
  ['sky', 'denim', 'paper'],
  ['amber', 'ember', 'honey'],
  ['violet', 'plum', 'paper'],
  ['rosy', 'mauve', 'paper'],
  ['fog', 'stone', 'denim'],
];

function bindingAt(a: number, b: number): Binding {
  return BINDINGS[Math.floor(hash2(a, b, 23) * BINDINGS.length)] ?? ['red', 'maroon', 'honey'];
}

/** Paints the library to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskEnd = ox + CORE_W + DESK_TAIL;
  const caseTop = oy + 3 - Math.min(CASE_RISE, Math.max(0, oy - 8));

  const lamps: number[] = [];
  const firstLamp = ox + LAMP_X - Math.ceil((ox + LAMP_X + 8) / LAMP_GAP) * LAMP_GAP;
  for (let x = firstLamp; x < w + 8; x += LAMP_GAP) lamps.push(x);

  paintWall(p, w, ox, floorTop, caseTop);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 10, 13, 9, [['ember', 0.8]], { y0: caseTop, y1: oy + PANEL_TOP });
  }
  if (caseTop >= ARCH_MIN) paintArchedWindows(p, w, ox, caseTop);
  if (oy >= 22) paintClock(p, ox + 30, oy - 9);
  if (oy >= 44) paintFramedPrint(p, ox + 19, oy - 38);

  paintPanelling(p, w, ox, oy + PANEL_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: reading tables, bookcases and the printer.
  for (let x = ox - 14 - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i % 3 === 0) paintReadingBay(p, x, oy, floorTop, i);
    else if (i % 3 === 1) paintBookcase(p, x + 4, BAY_W - 8, caseTop, floorTop, 40 + i);
    else paintPrinterBay(p, x, oy, floorTop);
  }
  for (let x = deskEnd + 4, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintBookcase(p, x, BAY_W - 8, caseTop, floorTop, 80 + i);
    else paintReadingBay(p, x - 4, oy, floorTop, 81 + i);
  }

  // The core: a bookcase at the left edge, the notice board, the computer.
  paintBookcase(p, ox - 14, 28, caseTop, floorTop, 1);
  paintNoticeBoard(p, ox + 15, oy + 8);
  paintComputer(p, ox + 37, floorTop);

  // Behind the desk.
  paintTallWindow(p, ox + 55, Math.max(caseTop + 4, oy - 34), oy + 30);
  paintCabinet(p, ox + DESK.x, ox + 85, oy + 34, oy + DESK.top);
  paintBookcase(p, ox + 85, deskEnd - ox - 85, caseTop, floorTop, 2);
  for (const lx of lamps) paintLamp(p, lx, oy);

  paintDesk(p, ox + DESK.x, deskEnd, oy + DESK.top, oy + CORE_H, deskEnd < w);
  paintBookStack(p, ox + 99, oy + DESK.top);
  paintBankerLamp(p, ox + 114, oy + DESK.top);
  paintBookStack(p, ox + 133, oy + DESK.top, 1);
}

// ---------------------------------------------------------------------------
// Room

/**
 * The wall: deep red paper with fine stripes. Above the bookcases on a tall
 * stage it is the same paper under a dark ceiling edge.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, caseTop: number): void {
  p.rect(0, 0, w, floorTop, 'maroon');
  for (let x = mod(ox + 1, 6) - 6; x < w; x += 6) p.rect(x, 0, 1, floorTop, 'plum');
  ditherRect(p, 0, 0, w, 3, 'night', 8);
  if (caseTop > 8) {
    // a picture rail a little above the bookcases
    p.rect(0, caseTop - 5, w, 1, 'amber');
    p.rect(0, caseTop - 4, w, 1, 'ember');
  }
}

/** Dark wooden panels on the lower wall. */
function paintPanelling(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'honey');
  p.rect(0, top + 1, w, 1, 'amber');
  for (let x = mod(ox + 3, 12) - 12; x < w; x += 12) {
    p.rect(x, top + 3, 9, 1, 'amber');
    p.rect(x, top + 3, 1, floorTop - top - 6, 'amber');
    p.rect(x, floorTop - 3, 9, 1, 'plum');
    p.rect(x + 8, top + 4, 1, floorTop - top - 7, 'plum');
  }
  p.rect(0, floorTop - 2, w, 2, 'plum');
}

/** A teal carpet with a small diamond pattern. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'teal');
  p.rect(0, floorTop, w, 1, 'ink');
  p.rect(0, floorTop + 1, w, 1, 'moss');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    for (let x = mod(ox + (row % 2) * 4, 8) - 8; x < w; x += 8) {
      px(p, x + 1, y, 'moss');
      px(p, x, y + 1, 'moss');
      px(p, x + 2, y + 1, 'moss');
    }
  }
}

// ---------------------------------------------------------------------------
// Bookcases

/**
 * Books standing side by side on a shelf from x0 to x1, their feet on `base`.
 * Now and then a gap, a book leaning, or a few lying flat.
 */
function paintBookRow(p: Painter, x0: number, x1: number, base: number, seed: number): void {
  let x = x0;
  for (let i = 0; x < x1; i++) {
    const kind = hash2(i, seed, 5);
    if (kind < 0.05) {
      x += 2 + Math.floor(hash2(i, seed, 9) * 3);
      continue;
    }
    if (kind > 0.94 && x1 - x >= 7) {
      // a few books lying flat
      const n = 1 + Math.floor(hash2(i, seed, 13) * 3);
      for (let k = 0; k < n; k++) {
        const [body, shade] = bindingAt(i * 7 + k, seed);
        const bw = 6 - (k % 2);
        p.rect(x, base - 2 - k * 2, bw, 1, body);
        p.rect(x, base - 1 - k * 2, bw, 1, shade);
        px(p, x + bw - 1, base - 2 - k * 2, 'paper');
      }
      x += 7;
      continue;
    }
    const r = hash2(i, seed, 3);
    const bw = r < 0.2 ? 1 : r < 0.75 ? 2 : 3;
    if (x + bw > x1) break;
    const bh = 5 + Math.floor(hash2(i, seed, 7) * 4);
    const [body, shade, band] = bindingAt(i, seed);
    const top = base - bh;
    p.rect(x, top, bw, bh, body);
    if (bw === 3) p.rect(x + 2, top, 1, bh, shade);
    else px(p, x, top, shade);
    if (bw >= 2 && hash2(i, seed, 11) > 0.4) p.rect(x, top + 2, bw - (bw === 3 ? 1 : 0), 1, band);
    if (bw >= 2 && hash2(i, seed, 17) > 0.6) p.rect(x, base - 2, bw, 1, band);
    x += bw;
  }
}

/**
 * A tall bookcase `w` wide from `top` down to the floor: shelves counted up
 * from the floor so they never shift with the stage size, uprights every
 * section, books on every shelf.
 */
function paintBookcase(
  p: Painter,
  x: number,
  w: number,
  top: number,
  floorTop: number,
  seed: number,
): void {
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x + 2, top + 4, w - 4, bottom - top - 7, 'night');
  // the cornice
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
  p.rect(x, top + 2, w, 1, 'plum');
  p.rect(x, top + 3, 1, bottom - top - 3, 'amber');
  p.rect(x + w - 1, top + 3, 1, bottom - top - 3, 'plum');
  // sections between uprights
  const sections = Math.max(1, Math.round((w - 4) / 22));
  const edges: number[] = [];
  for (let s = 0; s <= sections; s++) edges.push(x + 2 + Math.round(((w - 4) * s) / sections));
  for (let k = 0; ; k++) {
    const board = floorTop - 3 - k * SHELF_GAP;
    if (board - 8 < top + 4) break;
    for (let s = 0; s < sections; s++) {
      const a = (edges[s] ?? x) + (s > 0 ? 1 : 0);
      const b = edges[s + 1] ?? x + w - 2;
      paintBookRow(p, a, b, board, seed * 97 + k * 7 + s);
    }
    p.rect(x + 2, board, w - 4, 1, 'amber');
    p.rect(x + 2, board + 1, w - 4, 1, 'ember');
  }
  for (let s = 1; s < sections; s++) {
    const ux = edges[s] ?? x;
    p.rect(ux - 1, top + 3, 2, bottom - top - 3, 'ember');
    px(p, ux - 1, top + 3, 'amber');
  }
  // the plinth
  p.rect(x, bottom - 3, w, 3, 'ember');
  p.rect(x, bottom - 3, w, 1, 'amber');
}

// ---------------------------------------------------------------------------
// The near side of the room

/** Colours of the pinned notes: paper, colour of a stripe or none. */
const NOTES: readonly (readonly [number, number, number, number, PaletteName, PaletteName])[] = [
  [2, 2, 6, 7, 'paper', 'stone'],
  [9, 1, 5, 4, 'sky', 'sky'],
  [9, 6, 6, 6, 'honey', 'red'],
  [3, 10, 5, 3, 'rosy', 'rosy'],
  [11, 13, 3, 0, 'leaf', 'leaf'],
];

/** The cork notice board: pinned notes in a wooden frame (the job fair flyer is the yellow one). */
function paintNoticeBoard(p: Painter, x: number, y: number): void {
  const w = 17;
  const h = 15;
  p.rect(x + 1, y + h, w, 1, 'plum');
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'amber');
  ditherRect(p, x + 1, y + 1, w - 2, h - 2, 'ember', 3);
  for (const [dx, dy, nw, nh, color, mark] of NOTES) {
    if (nh === 0) continue;
    p.rect(x + dx, y + dy, nw, nh, color);
    if (mark !== color) {
      p.rect(x + dx + 1, y + dy + 2, nw - 2, 1, mark);
      if (nh > 4) p.rect(x + dx + 1, y + dy + 4, nw - 3, 1, color === 'paper' ? 'fog' : mark);
    }
    p.rect(x + dx + 1, y + dy + nh, nw, 1, 'ember');
  }
  px(p, x + 4, y + 2, 'red');
  px(p, x + 11, y + 1, 'teal');
  px(p, x + 12, y + 6, 'red');
  px(p, x + 5, y + 10, 'teal');
}

/** The public computer on a small wooden table, 15 wide, its legs on the floor. */
function paintComputer(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 10;
  const my = top - 11;
  lightPool(p, x + 7, my + 4, 10, 8, [['ember', 0.5]]);
  // the monitor
  p.rect(x + 2, my, 11, 9, 'slate');
  p.rect(x + 2, my, 11, 1, 'stone');
  p.rect(x + 3, my + 1, 9, 6, 'teal');
  p.rect(x + 4, my + 2, 4, 1, 'cyan');
  p.rect(x + 4, my + 4, 6, 1, 'sky');
  p.rect(x + 4, my + 5, 3, 1, 'sky');
  px(p, x + 10, my + 2, 'honey');
  px(p, x + 11, my + 7, 'leaf');
  p.rect(x + 6, my + 9, 3, 1, 'stone');
  p.rect(x + 5, top - 1, 5, 1, 'stone');
  // keyboard and mouse
  p.rect(x + 1, top - 1, 4, 1, 'fog');
  px(p, x + 12, top - 1, 'fog');
  // the table
  p.rect(x, top, 15, 1, 'honey');
  p.rect(x, top + 1, 15, 1, 'amber');
  p.rect(x, top + 2, 15, 1, 'ember');
  p.rect(x + 1, top + 3, 1, floorTop - top, 'ember');
  p.rect(x + 13, top + 3, 1, floorTop - top, 'ember');
  p.rect(x + 2, top + 6, 11, 1, 'plum');
}

// ---------------------------------------------------------------------------
// Behind the desk

/** A low cabinet under the window, from x0 to x1, with a globe and a few books on it. */
function paintCabinet(p: Painter, x0: number, x1: number, top: number, bottom: number): void {
  // books lying flat
  p.rect(x0 + 4, top - 2, 9, 1, 'denim');
  p.rect(x0 + 4, top - 1, 9, 1, 'indigo');
  p.rect(x0 + 5, top - 4, 7, 1, 'red');
  p.rect(x0 + 5, top - 3, 7, 1, 'maroon');
  px(p, x0 + 12, top - 2, 'paper');
  // the globe on its stand
  const gx = x0 + 22;
  p.rect(gx + 1, top - 9, 5, 7, 'sky');
  p.rect(gx, top - 8, 7, 5, 'sky');
  p.rect(gx + 1, top - 7, 3, 2, 'leaf');
  p.rect(gx + 4, top - 5, 2, 2, 'leaf');
  px(p, gx + 2, top - 8, 'paper');
  p.rect(gx + 7, top - 8, 1, 6, 'lamp');
  p.rect(gx + 3, top - 2, 1, 1, 'lamp');
  p.rect(gx + 1, top - 1, 6, 1, 'ember');
  // the cabinet
  p.rect(x0, top, x1 - x0, 1, 'amber');
  p.rect(x0, top + 1, x1 - x0, bottom - top - 1, 'ember');
  p.rect(x0, top + 1, x1 - x0, 1, 'plum');
}

/** The librarian's desk from x0 to x1: a wooden top and panelled front. */
function paintDesk(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top + 3, w, bottom - top - 3, 'ember');
  const panelTop = top + 6;
  const panelH = bottom - 5 - panelTop;
  for (let x = x0 + 3; x + 14 <= x1 - 2; x += 17) {
    p.rect(x, panelTop, 14, 1, 'amber');
    p.rect(x, panelTop, 1, panelH, 'amber');
    p.rect(x, panelTop + panelH - 1, 14, 1, 'plum');
    p.rect(x + 13, panelTop, 1, panelH, 'plum');
  }
  // the book return slot on the front
  p.rect(x0 + 6, panelTop + 3, 9, 2, 'ink');
  p.rect(x0 + 6, panelTop + 5, 9, 1, 'lamp');
  if (endsInView) p.rect(x1 - 1, top + 3, 1, bottom - top - 3, 'plum');
  p.rect(x0, bottom - 3, w, 3, 'plum');
  p.rect(x0, bottom - 3, w, 1, 'ember');
  // the top, a pixel proud of the front
  p.rect(x0 - 1, top, w + 1, 1, 'honey');
  p.rect(x0 - 1, top + 1, w + 1, 1, 'amber');
  p.rect(x0 - 1, top + 2, w + 1, 1, 'ember');
  p.rect(x0, bottom, w, 1, 'ink');
}

/** Books lying in a stack on the desk at `base`: [dx, width, binding]. */
const STACKS: readonly (readonly (readonly [number, number, number])[])[] = [
  [
    [0, 12, 1],
    [1, 10, 0],
    [0, 11, 5],
    [2, 8, 2],
  ],
  [
    [0, 9, 7],
    [1, 8, 8],
  ],
];

/** A stack of books lying flat on the desk, their page edges to you. */
function paintBookStack(p: Painter, x: number, base: number, which = 0): void {
  (STACKS[which] ?? []).forEach(([dx, bw, b], k) => {
    const [body, shade] = BINDINGS[b] ?? ['red', 'maroon', 'honey'];
    const y = base - 2 - k * 2;
    p.rect(x + dx, y, bw, 1, body);
    p.rect(x + dx, y + 1, bw, 1, shade);
    p.rect(x + dx + 1, y + 1, bw - 3, 1, 'paper');
  });
}

/** A brass reading lamp with a green glass shade, on the desk at `base`. */
function paintBankerLamp(p: Painter, x: number, base: number): void {
  lightPool(p, x + 5, base, 10, 4, [['honey', 0.5]], { y0: base - 4, y1: base + 1 });
  p.rect(x + 2, base - 1, 7, 1, 'lamp');
  p.rect(x + 3, base - 2, 5, 1, 'amber');
  p.rect(x + 5, base - 6, 1, 4, 'lamp');
  p.rect(x + 1, base - 9, 9, 1, 'leaf');
  p.rect(x, base - 8, 11, 2, 'leaf');
  p.rect(x, base - 7, 11, 1, 'moss');
  p.rect(x + 2, base - 10, 7, 1, 'leaf');
  px(p, x + 3, base - 9, 'cyan');
  p.rect(x + 1, base - 6, 9, 1, 'honey');
}

// ---------------------------------------------------------------------------
// Beside the core

/** A reading table under a window: two green lamps, an open book, chairs. */
function paintReadingBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  paintWindow(p, x + 8, oy + 8);
  const top = floorTop - 8;
  // the chairs' backs
  for (const cx of [x + 3, x + 38]) {
    p.rect(cx, top - 9, 3, 1, 'amber');
    p.rect(cx, top - 8, 1, 17, 'ember');
    p.rect(cx + 2, top - 8, 1, 17, 'ember');
    p.rect(cx, top - 5, 3, 1, 'ember');
  }
  paintBankerLamp(p, x + 9, top);
  paintBankerLamp(p, x + 24, top);
  // an open book
  const bx = x + 18;
  p.rect(bx, top - 1, 7, 1, 'paper');
  px(p, bx + 3, top - 1, 'fog');
  p.rect(bx, top - 2, 3, 1, 'paper');
  p.rect(bx + 4, top - 2, 3, 1, 'paper');
  if (hash2(i, 3, 71) > 0.5) paintBookStack(p, x + 31, top, 1);
  p.rect(x + 5, top, 34, 1, 'honey');
  p.rect(x + 5, top + 1, 34, 1, 'amber');
  p.rect(x + 5, top + 2, 34, 1, 'ember');
  p.rect(x + 7, top + 3, 2, floorTop - top, 'ember');
  p.rect(x + 35, top + 3, 2, floorTop - top, 'ember');
}

/** A gilt-framed print of moorland at dusk, 20x15. */
function paintFramedPrint(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 15, 20, 1, 'plum');
  p.rect(x, y, 20, 15, 'lamp');
  p.rect(x, y + 14, 20, 1, 'amber');
  p.rect(x + 1, y + 1, 18, 13, 'ember');
  ditherGradient(p, x + 2, y + 2, 16, 11, ['indigo', 'violet', 'rosy']);
  p.rect(x + 2, y + 9, 16, 4, 'moss');
  p.rect(x + 6, y + 8, 7, 1, 'moss');
  p.rect(x + 13, y + 4, 2, 2, 'paper');
}

/** A tall window behind the desk from `top` down to its sill at `sill`: the dusk over rooftops. */
function paintTallWindow(p: Painter, x: number, top: number, sill: number): void {
  const w = 28;
  const h = sill - top;
  p.rect(x, top, w, h, 'ember');
  ditherGradient(p, x + 1, top + 1, w - 2, h - 2, ['deep', 'indigo', 'dusk', 'violet']);
  for (let i = 0; i < Math.max(3, Math.floor(h / 5)); i++) {
    const sx = x + 2 + Math.floor(hash2(x, i, 7) * (w - 4));
    const sy = top + 2 + Math.floor(hash2(x, i, 11) * Math.max(1, h - 12));
    px(p, sx, sy, hash2(x, i, 3) > 0.5 ? 'honey' : 'fog');
  }
  for (let i = 0; i < 4; i++) {
    const bh = 2 + Math.floor(hash2(i, 5, 53) * 6);
    p.rect(x + 1 + i * 7, sill - 1 - bh, i === 3 ? 5 : 7, bh, 'night');
    if (hash2(i, 5, 59) > 0.3) px(p, x + 3 + i * 7, sill - bh + 1, 'honey');
  }
  p.rect(x + w / 2, top + 1, 1, h - 2, 'ember');
  for (let y = sill - 11; y > top + 3; y -= 12) p.rect(x + 1, y, w - 2, 1, 'ember');
  p.rect(x - 1, sill, w + 2, 1, 'amber');
  p.rect(x - 1, sill + 1, w + 2, 1, 'plum');
}

/** The printer on a low cabinet, a paper stack beside it, a framed print above. */
function paintPrinterBay(p: Painter, x: number, oy: number, floorTop: number): void {
  paintFramedPrint(p, x + 12, oy + 10);
  const top = floorTop - 14;
  // the printer
  p.rect(x + 9, top - 9, 18, 9, 'fog');
  p.rect(x + 9, top - 9, 18, 1, 'paper');
  p.rect(x + 9, top - 1, 18, 1, 'stone');
  p.rect(x + 11, top - 6, 12, 2, 'slate');
  p.rect(x + 12, top - 11, 10, 2, 'paper');
  p.rect(x + 12, top - 5, 10, 1, 'paper');
  px(p, x + 25, top - 7, 'leaf');
  px(p, x + 25, top - 5, 'concrete');
  // paper waiting
  p.rect(x + 29, top - 4, 7, 4, 'paper');
  p.rect(x + 29, top - 1, 7, 1, 'fog');
  // the cabinet
  p.rect(x + 6, top, 32, 1, 'honey');
  p.rect(x + 6, top + 1, 32, floorTop - top + 1, 'ember');
  p.rect(x + 8, top + 3, 13, floorTop - top - 3, 'plum');
  p.rect(x + 23, top + 3, 13, floorTop - top - 3, 'plum');
  p.rect(x + 9, top + 4, 11, floorTop - top - 5, 'ember');
  p.rect(x + 24, top + 4, 11, floorTop - top - 5, 'ember');
  px(p, x + 19, top + 7, 'lamp');
  px(p, x + 25, top + 7, 'lamp');
}

/** Tall arched windows on the wall above the bookcases, between the lamp cords. */
function paintArchedWindows(p: Painter, w: number, ox: number, caseTop: number): void {
  const wh = Math.min(64, caseTop - 18);
  const top = Math.floor((caseTop - 5 - wh) / 2) + 2;
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 20) / LAMP_GAP);
  for (let k = first; centre + k * LAMP_GAP - 20 < w; k++) {
    paintArch(p, centre + k * LAMP_GAP, top, wh, k);
  }
}

/** One arched window centred on `cx`: the dusk sky over dark rooftops. */
function paintArch(p: Painter, cx: number, top: number, wh: number, n: number): void {
  const half = 13;
  // the frame and its rounded head
  p.rect(cx - half + 3, top, half * 2 - 5, 1, 'ember');
  p.rect(cx - half + 1, top + 1, half * 2 - 1, 2, 'ember');
  p.rect(cx - half, top + 3, half * 2 + 1, wh - 3, 'ember');
  const gt = top + 2;
  p.rect(cx - half + 4, gt, half * 2 - 7, 1, 'deep');
  p.rect(cx - half + 2, gt + 1, half * 2 - 3, 2, 'deep');
  ditherGradient(p, cx - half + 2, gt + 3, half * 2 - 3, wh - 7, [
    'deep',
    'indigo',
    'dusk',
    'violet',
  ]);
  for (let i = 0; i < 6; i++) {
    const sx = cx - half + 3 + Math.floor(hash2(i, n, 41) * (half * 2 - 5));
    const sy = gt + 3 + Math.floor(hash2(i, n, 43) * Math.max(1, wh - 20));
    px(p, sx, sy, hash2(i, n, 47) > 0.6 ? 'honey' : 'fog');
  }
  for (let i = 0; i < 4; i++) {
    const bh = 3 + Math.floor(hash2(i, n, 53) * 7);
    const bx = cx - half + 2 + i * 6;
    p.rect(bx, top + wh - 2 - bh, i === 3 ? 5 : 6, bh, 'night');
    if (hash2(i, n, 59) > 0.35) px(p, bx + 2, top + wh - bh, 'honey');
  }
  p.rect(cx, gt + 1, 1, wh - 5, 'ember');
  p.rect(cx - half + 2, gt + Math.floor(wh / 3), half * 2 - 3, 1, 'ember');
  p.rect(cx - half - 1, top + wh, half * 2 + 3, 1, 'amber');
  p.rect(cx - half, top + wh + 1, half * 2 + 1, 1, 'plum');
}

// ---------------------------------------------------------------------------
// The librarian: 16x24, facing left. A neat woman in her fifties: a grey bob
// with a straight fringe, reading glasses on a thin gold chain, a heather
// cardigan buttoned over a white blouse with a round collar, a tan tweed
// skirt, grey tights and brown shoes. Only the top part shows above the
// desk; the legs are there so the sprite can bob without a gap at the desk.

const LIBRARIAN_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hHHhhhhhh...',
    '...hHhhhhhhhhh..',
    '...hsshhhhhhhh..',
    '...sLeLishhhhh..',
    '....ssssgohhhh..',
    '....rssssohhho..',
    '......ssg..oo...',
    '.....vwwvvv.....',
    '....vvwgvvvvv...',
    '....vvvnvvvvvv..',
    '....vvvvvvavvv..',
    '....vvvnvvavvv..',
    '....vvvvvvavvv..',
    '....vvvnvvsvv...',
    '.....vvvvvvv....',
    '.....kkkkkkk....',
    '....kkkkkkkk....',
    '....kKkkkKkk....',
    '......ttqq......',
    '......ttqq......',
    '......ttqq......',
    '.....ffff.ff....',
  ],
  legend: {
    h: 'fog',
    H: 'paper',
    o: 'concrete',
    s: 'skin',
    e: 'ink',
    i: 'ink',
    L: 'paper',
    g: 'lamp',
    r: 'rosy',
    w: 'paper',
    v: 'violet',
    a: 'plum',
    n: 'paper',
    k: 'tan',
    K: 'ember',
    t: 'stone',
    q: 'slate',
    f: 'ember',
  },
};

export const LIBRARY_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    librarian: {
      sprite: LIBRARIAN_SPRITE,
      x: 96,
      y: 19,
      side: 'right',
      clipBottom: DESK.top,
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: {
    left: { x: DESK.x, y: PROP_TOP },
    // Stops short of the librarian, so a prop stays clear of her face and her books.
    right: { x: DESK.x + 21, y: PROP_TOP },
  },
};
