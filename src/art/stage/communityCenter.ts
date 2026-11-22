import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { VOLUNTEER_SPRITE } from './park';

/**
 * The community-center stage: the computer classroom on an early September
 * evening. From the left: a window onto the dusk with a potted plant under
 * it (you stand beside it), the whiteboard with a little drawing of a
 * computer, the teacher's desk with a monitor, a keyboard, a mouse and a pile
 * of sign-up forms (handed-over things rest on it), then the notice board
 * with pinned flyers over a low cupboard with the printer. Painted through
 * the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a string of paper bunting, then a
 * keyboard poster, the class timetable and a clock, then a darker upper wall
 * with high windows and ceiling lights), the classroom door, computer desks
 * and windows to the left, more computer desks and a bookcase to the right.
 */

/** The teacher's desk: left and right edges and the y of its top, in core pixels. */
const DESK = { x: 38, x1: 80, top: 46 } as const;
/** 24x24 pictures stand on the desktop with their shadow on it. */
const PROP_TOP = DESK.top - 20;

const FLOOR_TOP = 56;
/** Top of the painted lower wall. */
const DADO_TOP = 42;
/** Top of the desks along the side walls. */
const BAY_DESK_TOP = 44;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The ceiling lights: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 30;
const LAMP_GAP = 64;
/** Wall above the core needed for the lights, the bunting, the posters and the upper wall. */
const LIGHT_MIN = 6;
const BUNTING_MIN = 14;
const POSTER_MIN = 40;
const CORNICE_MIN = 62;
/** How far above the core the upper wall starts. */
const CORNICE_UP = 46;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Paints the classroom to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const lightY = oy >= POSTER_MIN ? oy - 42 : 1;

  const lamps: number[] = [];
  const firstLamp = ox + LAMP_X - Math.ceil((ox + LAMP_X + 10) / LAMP_GAP) * LAMP_GAP;
  for (let x = firstLamp; x < w + 10; x += LAMP_GAP) lamps.push(x);

  paintWall(p, w, ox, floorTop, cornice);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 12, 26, 24, [['fog', 0.22]], { y0: cornice + 3, y1: oy + DADO_TOP });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) paintHighWindows(p, w, ox, cornice);
  if (oy >= POSTER_MIN) {
    paintKeyboardPoster(p, ox + 34, oy - 34);
    paintTimetable(p, ox + 66, oy - 35);
    paintClock(p, ox + 106, oy - 25);
  }
  if (oy >= BUNTING_MIN) paintBunting(p, w, ox, oy - 10);

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: the door, desks and windows to the left; desks and
  // a bookcase to the right.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintDoor(p, x + 8, oy + 6, floorTop);
    else if (i % 2 === 1) paintDeskBay(p, x, oy, floorTop, i);
    else paintWindowBay(p, x, oy, floorTop, i);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    if (i % 3 === 2) paintBookcase(p, x + 6, oy + 8, floorTop, i);
    else paintDeskBay(p, x, oy, floorTop, i + 20);
  }

  // The core: window and plant, whiteboard, notice board and printer.
  paintClassWindow(p, ox + 1, oy + 6, 18, 30, 0);
  paintPlant(p, ox + 6, oy + 37);
  paintWhiteboard(p, ox + 36, oy + 5);
  paintNoticeBoard(p, ox + 98, oy + 8);
  paintCupboard(p, ox + 100, oy + DADO_TOP, floorTop, true);

  if (oy >= LIGHT_MIN) for (const lx of lamps) paintLight(p, lx, lightY);

  paintTeacherDesk(p, ox, oy, floorTop);
}

// ---------------------------------------------------------------------------
// Room

/** The wall: soft grey-violet. On a tall stage a rail runs at `cornice` with a darker wall above. */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'concrete');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'stone');
    // a faint dot pattern, counted up from the rail so it never shifts with the stage size
    for (let row = 0; cornice - 6 - row * 8 >= 5; row++) {
      const y = cornice - 6 - row * 8;
      for (let x = mod(ox + (row % 2) * 8, 16) - 16; x < w; x += 16) px(p, x, y, 'concrete');
    }
    ditherRect(p, 0, 0, w, 4, 'night', 8);
    p.rect(0, cornice, w, 1, 'fog');
    p.rect(0, cornice + 1, w, 1, 'paper');
    p.rect(0, cornice + 2, w, 1, 'stone');
  } else {
    ditherRect(p, 0, 0, w, 3, 'stone', 8);
  }
}

/** The painted lower wall under a wooden rail. */
function paintDado(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'stone');
  p.rect(0, top, w, 1, 'honey');
  p.rect(0, top + 1, w, 1, 'amber');
  p.rect(0, top + 2, w, 1, 'ember');
  for (let x = mod(ox + 3, 16) - 16; x < w; x += 16)
    p.rect(x, top + 5, 1, floorTop - top - 7, 'slate');
  p.rect(0, floorTop - 2, w, 2, 'slate');
}

/** Lino tiles with a few flecks. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'slate');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 4 + row * 5 < h; row++) {
    const y = floorTop + 4 + row * 5;
    p.rect(0, y, w, 1, 'night');
    for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) p.rect(x, y - 4, 1, 4, 'night');
  }
  for (let y = floorTop + 1; y < h; y++) {
    for (let x = mod(ox, 7) - 7; x < w; x += 7) {
      if (hash2(x - ox, y - floorTop, 5) < 0.12) px(p, x, y, 'stone');
    }
  }
}

/** A long ceiling light hanging on two wires, its housing top at `y`. */
function paintLight(p: Painter, cx: number, y: number): void {
  if (y > 1) {
    p.rect(cx - 6, 0, 1, y, 'ink');
    p.rect(cx + 6, 0, 1, y, 'ink');
  }
  p.rect(cx - 9, y, 19, 1, 'fog');
  p.rect(cx - 9, y + 1, 19, 1, 'stone');
  p.rect(cx - 8, y + 2, 17, 1, 'honey');
  p.rect(cx - 6, y + 2, 13, 1, 'paper');
}

// ---------------------------------------------------------------------------
// The core

/** A window onto the September dusk, its blind pulled a third of the way down. */
function paintClassWindow(
  p: Painter,
  x: number,
  top: number,
  w: number,
  h: number,
  n: number,
): void {
  p.rect(x, top, w, h, 'fog');
  ditherGradient(p, x + 1, top + 1, w - 2, h - 2, ['indigo', 'violet', 'mauve', 'rosy']);
  // rooftops across the street, a lit window or two
  for (let i = 0; i * 5 < w - 2; i++) {
    const bh = 4 + Math.floor(hash2(i, n, 71) * 6);
    p.rect(x + 1 + i * 5, top + h - 1 - bh, Math.min(5, w - 2 - i * 5), bh, 'plum');
    if (hash2(i, n, 73) > 0.4) px(p, x + 2 + i * 5, top + h + 1 - bh, 'honey');
  }
  px(p, x + 3 + Math.floor(hash2(n, 1, 79) * (w - 6)), top + 12, 'paper');
  // the blind, then the frame
  const blind = Math.floor(h / 3);
  p.rect(x + 1, top + 1, w - 2, blind, 'paper');
  for (let y = top + 3; y < top + blind; y += 2) p.rect(x + 1, y, w - 2, 1, 'fog');
  p.rect(x + 1, top + blind, w - 2, 1, 'stone');
  px(p, x + Math.floor(w / 2), top + blind + 1, 'stone');
  px(p, x + Math.floor(w / 2), top + blind + 2, 'fog');
  p.rect(x + Math.floor(w / 2), top + blind + 3, 1, h - blind - 4, 'fog');
  p.rect(x - 1, top + h, w + 2, 1, 'paper');
  p.rect(x - 1, top + h + 1, w + 2, 1, 'stone');
}

/** The whiteboard: a sketch of a computer with an arrow to its mouse, and a few lines of notes. */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  const w = 54;
  const h = 24;
  p.rect(x, y, w, h, 'fog');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  p.rect(x + w - 1, y + 1, 1, h - 1, 'stone');
  p.rect(x, y + h - 1, w, 1, 'stone');
  // the sketch: a screen on a stand, a keyboard, a mouse
  const sx = x + 6;
  const sy = y + 4;
  p.rect(sx, sy, 13, 1, 'denim');
  p.rect(sx, sy + 8, 13, 1, 'denim');
  p.rect(sx, sy, 1, 9, 'denim');
  p.rect(sx + 12, sy, 1, 9, 'denim');
  p.rect(sx + 6, sy + 9, 1, 2, 'denim');
  p.rect(sx + 3, sy + 11, 7, 1, 'denim');
  p.rect(sx - 1, sy + 14, 13, 1, 'denim');
  p.rect(sx - 1, sy + 15, 1, 1, 'denim');
  p.rect(sx + 11, sy + 15, 1, 1, 'denim');
  p.rect(sx + 15, sy + 13, 2, 3, 'denim');
  // an arrow in red to the mouse
  p.rect(sx + 18, sy + 7, 1, 5, 'red');
  px(p, sx + 17, sy + 11, 'red');
  px(p, sx + 16, sy + 12, 'red');
  px(p, sx + 18, sy + 12, 'red');
  // notes: grey lines, no words
  p.rect(x + 28, y + 5, 17, 1, 'sky');
  p.rect(x + 28, y + 8, 21, 1, 'fog');
  p.rect(x + 28, y + 11, 14, 1, 'fog');
  p.rect(x + 28, y + 14, 19, 1, 'fog');
  p.rect(x + 28, y + 17, 10, 1, 'fog');
  // the tray and its markers
  p.rect(x + 2, y + h, w - 4, 1, 'concrete');
  p.rect(x + 2, y + h + 1, w - 4, 1, 'slate');
  p.rect(x + 8, y + h - 1, 3, 1, 'red');
  p.rect(x + 13, y + h - 1, 3, 1, 'denim');
  p.rect(x + 18, y + h - 1, 3, 1, 'leaf');
  p.rect(x + 40, y + h - 1, 5, 1, 'ink');
}

/** Flyers on the notice board: [dx, dy, w, h, colour, pin]. */
const FLYERS: readonly (readonly [number, number, number, number, PaletteName, PaletteName])[] = [
  [2, 2, 7, 9, 'paper', 'red'],
  [10, 1, 6, 6, 'sky', 'lamp'],
  [17, 3, 7, 8, 'honey', 'teal'],
  [3, 12, 6, 6, 'rosy', 'denim'],
  [11, 9, 7, 10, 'paper', 'leaf'],
  [19, 13, 5, 5, 'leaf', 'red'],
];

/** The cork notice board with a few pinned flyers (no readable text). */
function paintNoticeBoard(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 21;
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'amber');
  for (let i = 0; i < 9; i++) {
    px(
      p,
      x + 2 + Math.floor(hash2(i, 3, 83) * (w - 4)),
      y + 2 + Math.floor(hash2(i, 4, 83) * (h - 4)),
      'ember',
    );
  }
  for (const [dx, dy, fw, fh, color, pin] of FLYERS) {
    p.rect(x + dx, y + dy, fw, fh, color);
    p.rect(x + dx + 1, y + dy + fh, fw, 1, 'ember');
    if (fh >= 8) {
      p.rect(x + dx + 1, y + dy + 3, fw - 2, 1, color === 'paper' ? 'stone' : 'paper');
      p.rect(x + dx + 1, y + dy + 5, fw - 3, 1, color === 'paper' ? 'fog' : 'paper');
    } else {
      p.rect(x + dx + 1, y + dy + 2, fw - 2, 2, color === 'paper' ? 'teal' : 'paper');
    }
    px(p, x + dx + Math.floor(fw / 2), y + dy, pin);
  }
  p.rect(x + 1, y + h, w, 1, 'slate');
}

/** A low cupboard (its top at `top`), with the class printer on it when `printer` is set. */
function paintCupboard(
  p: Painter,
  x: number,
  top: number,
  floorTop: number,
  printer: boolean,
): void {
  const w = 28;
  const foot = floorTop + 2;
  p.rect(x, top, w, foot - top, 'ember');
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 1, 'amber');
  const half = Math.floor((w - 3) / 2);
  p.rect(x + 1, top + 3, half, foot - top - 5, 'amber');
  p.rect(x + 2 + half, top + 3, half, foot - top - 5, 'amber');
  px(p, x + half - 1, top + 7, 'honey');
  px(p, x + half + 4, top + 7, 'honey');
  p.rect(x, foot - 1, w, 1, 'plum');
  if (!printer) return;
  // the printer, a sheet just out
  const px0 = x + 5;
  p.rect(px0 + 2, top - 9, 11, 2, 'paper');
  p.rect(px0, top - 7, 16, 7, 'fog');
  p.rect(px0, top - 7, 16, 1, 'paper');
  p.rect(px0 + 15, top - 6, 1, 6, 'concrete');
  p.rect(px0 + 2, top - 4, 11, 1, 'slate');
  p.rect(px0 + 3, top - 3, 9, 1, 'paper');
  px(p, px0 + 13, top - 6, 'leaf');
  p.rect(px0, top - 1, 16, 1, 'stone');
}

/** A desktop computer's monitor, 16 wide, its stand standing on `base`. */
function paintMonitor(p: Painter, x: number, base: number, kind: number): void {
  const top = base - 14;
  p.rect(x, top, 16, 11, 'ink');
  const sx = x + 1;
  const sy = top + 1;
  if (kind === 0) {
    // a blue desktop with an open window
    ditherGradient(p, sx, sy, 14, 9, ['denim', 'sky']);
    p.rect(sx + 2, sy + 1, 9, 6, 'paper');
    p.rect(sx + 2, sy + 1, 9, 1, 'teal');
    p.rect(sx + 3, sy + 3, 5, 1, 'fog');
    p.rect(sx + 3, sy + 5, 6, 1, 'fog');
    px(p, sx + 12, sy + 2, 'honey');
  } else if (kind === 1) {
    // a teal desktop with icons
    p.rect(sx, sy, 14, 9, 'teal');
    for (let i = 0; i < 3; i++) p.rect(sx + 1, sy + 1 + i * 3, 2, 2, i === 1 ? 'honey' : 'paper');
    p.rect(sx, sy + 8, 14, 1, 'night');
    px(p, sx + 9, sy + 4, 'paper');
  } else {
    // switched off: a dark screen with a soft reflection
    p.rect(sx, sy, 14, 9, 'night');
    px(p, sx + 2, sy + 1, 'slate');
    p.rect(sx + 2, sy + 2, 1, 2, 'slate');
    px(p, sx + 13, sy + 8, 'leaf');
  }
  p.rect(x + 1, top + 11, 14, 1, 'slate');
  p.rect(x + 7, top + 12, 2, 1, 'stone');
  p.rect(x + 4, base - 1, 8, 1, 'stone');
}

/** A keyboard lying on a desk at `base`, `w` wide. */
function paintKeyboard(p: Painter, x: number, base: number, w: number): void {
  p.rect(x, base - 2, w, 2, 'stone');
  for (let i = 1; i < w - 1; i += 2) px(p, x + i, base - 2, 'fog');
  p.rect(x + 3, base - 1, w - 6, 1, 'concrete');
}

/** A mouse on a desk at `base`, with its cable trailing back. */
function paintMouse(p: Painter, x: number, base: number): void {
  p.rect(x, base - 2, 3, 2, 'fog');
  px(p, x + 2, base - 1, 'concrete');
  px(p, x - 1, base - 1, 'slate');
}

/** A computer tower standing on the floor at `foot`. */
function paintTower(p: Painter, x: number, foot: number): void {
  p.rect(x, foot - 10, 6, 10, 'fog');
  p.rect(x + 5, foot - 10, 1, 10, 'concrete');
  p.rect(x + 1, foot - 8, 3, 1, 'stone');
  p.rect(x + 1, foot - 6, 3, 1, 'stone');
  px(p, x + 2, foot - 3, 'cyan');
}

/** A grey classroom desk from x0 to x1 (its top at `top`, legs down to `foot`). */
function paintDesk(p: Painter, x0: number, x1: number, top: number, foot: number): void {
  const w = x1 - x0;
  p.rect(x0 + 3, top + 3, w - 6, 2, 'slate');
  p.rect(x0 + 3, top + 5, w - 6, 1, 'night');
  p.rect(x0 + 1, top + 3, 2, foot - top - 3, 'stone');
  p.rect(x1 - 3, top + 3, 2, foot - top - 3, 'stone');
  px(p, x0 + 1, foot - 1, 'ink');
  px(p, x1 - 2, foot - 1, 'ink');
  p.rect(x0, top, w, 1, 'paper');
  p.rect(x0, top + 1, w, 1, 'fog');
  p.rect(x0, top + 2, w, 1, 'concrete');
}

/** The teacher's desk between you: sign-up forms, the keyboard, the monitor and the mouse. */
function paintTeacherDesk(p: Painter, ox: number, oy: number, floorTop: number): void {
  const x0 = ox + DESK.x;
  const x1 = ox + DESK.x1;
  const top = oy + DESK.top;
  const foot = floorTop + 3;
  paintTower(p, x1 - 11, foot);
  paintDesk(p, x0, x1, top, foot);
  // a pile of sign-up forms and a pen
  p.rect(x0 + 3, top - 2, 9, 1, 'fog');
  p.rect(x0 + 2, top - 1, 9, 1, 'paper');
  p.rect(x0 + 4, top - 3, 8, 1, 'paper');
  p.rect(x0 + 13, top - 1, 4, 1, 'denim');
  paintKeyboard(p, x0 + 17, top, 14);
  paintMonitor(p, x0 + 20, top, 0);
  paintMouse(p, x0 + 34, top);
}

// ---------------------------------------------------------------------------
// Beside the core

/** An office chair seen from behind, its wheels on `foot`. */
function paintChair(p: Painter, x: number, foot: number, color: PaletteName): void {
  p.rect(x + 1, foot - 15, 8, 7, color);
  p.rect(x + 1, foot - 15, 8, 1, 'sky');
  p.rect(x + 8, foot - 14, 1, 6, 'night');
  p.rect(x, foot - 8, 10, 2, 'night');
  p.rect(x + 4, foot - 6, 2, 3, 'slate');
  p.rect(x + 1, foot - 3, 8, 1, 'slate');
  px(p, x + 1, foot - 2, 'ink');
  px(p, x + 8, foot - 2, 'ink');
  px(p, x + 4, foot - 2, 'ink');
}

const CHAIRS: readonly PaletteName[] = ['denim', 'teal', 'maroon'];

/** A bay with a window above a computer desk and a chair pushed up to it. */
function paintDeskBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  const foot = floorTop + 3;
  const top = oy + BAY_DESK_TOP;
  paintClassWindow(p, x + 10, oy + 6, 24, 24, i);
  paintTower(p, x + 33, foot);
  paintDesk(p, x + 2, x + 42, top, foot);
  paintMonitor(p, x + 14, top, i % 3);
  paintKeyboard(p, x + 13, top, 14);
  paintMouse(p, x + 30, top);
  if (hash2(i, 2, 89) > 0.5) {
    p.rect(x + 4, top - 1, 6, 1, 'paper');
    p.rect(x + 5, top - 2, 5, 1, 'fog');
  }
  paintChair(p, x + 15, foot + 1, CHAIRS[i % CHAIRS.length] ?? 'denim');
}

/** A bay with a tall window over a radiator. */
function paintWindowBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  paintClassWindow(p, x + 9, oy + 6, 26, 32, i);
  const top = oy + DADO_TOP + 3;
  p.rect(x + 10, top, 24, 8, 'fog');
  for (let rx = x + 11; rx < x + 34; rx += 3) p.rect(rx, top + 1, 1, 6, 'concrete');
  p.rect(x + 10, top + 8, 24, 1, 'slate');
  p.rect(x + 12, top + 9, 1, floorTop - top - 8, 'stone');
  p.rect(x + 31, top + 9, 1, floorTop - top - 8, 'stone');
}

/** The classroom door: a wooden door with a small glass panel, ajar onto the lit corridor. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 26;
  const foot = floorTop + 1;
  p.rect(x - 2, top - 2, w + 4, foot - top + 2, 'fog');
  p.rect(x, top, w, foot - top, 'honey');
  p.rect(x + 2, top, w - 2, foot - top, 'amber');
  p.rect(x + w - 2, top, 2, foot - top, 'ember');
  // the glass panel onto the corridor
  p.rect(x + 7, top + 5, 10, 14, 'ember');
  p.rect(x + 8, top + 6, 8, 12, 'honey');
  ditherRect(p, x + 8, top + 6, 8, 12, 'lamp', 6);
  p.rect(x + 8, top + 11, 8, 1, 'ember');
  // handle and kick plate
  p.rect(x + 18, top + 24, 4, 1, 'fog');
  px(p, x + 21, top + 25, 'stone');
  p.rect(x + 3, foot - 5, w - 6, 3, 'concrete');
  // a little flyer taped on
  p.rect(x + 9, top + 21, 6, 7, 'paper');
  p.rect(x + 10, top + 23, 4, 1, 'red');
  p.rect(x + 10, top + 25, 3, 1, 'fog');
}

/** Binder colours on the bookcase. */
const BINDERS: readonly PaletteName[] = [
  'red',
  'denim',
  'leaf',
  'lamp',
  'teal',
  'paper',
  'mauve',
  'sky',
];

/** A wooden bookcase of binders and manuals, 32 wide. */
function paintBookcase(p: Painter, x: number, top: number, floorTop: number, i: number): void {
  const w = 32;
  const foot = floorTop + 2;
  p.rect(x, top, w, foot - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, foot - top - 4, 'plum');
  for (let sy = top + 12, r = 0; sy < foot - 3; sy += 11, r++) {
    let bx = x + 3;
    for (let k = 0; bx < x + w - 4; k++) {
      const bw = 2 + Math.floor(hash2(k, r + i * 7, 97) * 2);
      const bh = 6 + Math.floor(hash2(k, r + i * 7, 101) * 4);
      if (hash2(k, r + i * 7, 103) > 0.15) {
        const color = BINDERS[Math.floor(hash2(k, r + i * 7, 107) * BINDERS.length)] ?? 'red';
        p.rect(bx, sy - bh, Math.min(bw, x + w - 3 - bx), bh, color);
        px(p, bx, sy - bh + 2, 'paper');
      }
      bx += bw + 1;
    }
    p.rect(x + 2, sy, w - 4, 1, 'amber');
  }
  paintPlant(p, x + 11, top - 20);
}

// ---------------------------------------------------------------------------
// Above the core

const FLAGS: readonly PaletteName[] = ['red', 'lamp', 'teal', 'paper', 'leaf', 'rosy', 'sky'];

/** A string of paper bunting across the wall, sagging between pins every 32 px. */
function paintBunting(p: Painter, w: number, ox: number, y: number): void {
  const sagAt = (x: number): number => Math.round(4 * Math.sin((Math.PI * mod(x - ox, 32)) / 32));
  for (let x = 0; x < w; x++) px(p, x, y + sagAt(x), 'ink');
  for (let x = mod(ox + 3, 6) - 6; x < w; x += 6) {
    if (mod(x - ox, 32) < 2 || mod(x - ox, 32) > 29) continue;
    const fy = y + sagAt(x) + 1;
    const color = FLAGS[mod(Math.floor((x - ox) / 6), FLAGS.length)] ?? 'red';
    p.rect(x - 2, fy, 5, 1, color);
    p.rect(x - 1, fy + 1, 3, 1, color);
    px(p, x, fy + 2, color);
  }
  for (let x = mod(ox, 32) - 32; x < w + 32; x += 32) px(p, x, y - 1, 'red');
}

/** A poster of a keyboard and a mouse, as a learner would see them. */
function paintKeyboardPoster(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 20;
  p.rect(x, y, w, h, 'paper');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'sky');
  p.rect(x + 3, y + 3, 14, 6, 'paper');
  p.rect(x + 3, y + 3, 14, 1, 'teal');
  // the keyboard: three rows of keys
  p.rect(x + 2, y + 11, 18, 6, 'night');
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 8; k++)
      px(p, x + 3 + k * 2 + (r % 2), y + 12 + r * 2 - (r === 2 ? 1 : 0), 'paper');
  }
  p.rect(x + 7, y + 15, 8, 1, 'fog');
  // the mouse
  p.rect(x + 21, y + 13, 3, 4, 'paper');
  px(p, x + 22, y + 13, 'night');
  p.rect(x + 22, y + 10, 1, 3, 'night');
  p.rect(x + 1, y + h, w, 1, 'stone');
}

/** The class timetable: a grid of days with some classes coloured in. */
function paintTimetable(p: Painter, x: number, y: number): void {
  const w = 30;
  const h = 22;
  p.rect(x, y, w, h, 'paper');
  p.rect(x, y, w, 3, 'teal');
  p.rect(x + 2, y + 1, 10, 1, 'paper');
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 4; r++) {
      const cx = x + 2 + c * 5 + Math.floor(c / 5);
      const cy = y + 5 + r * 4;
      const v = hash2(c, r, 109);
      const color: PaletteName = v < 0.3 ? 'honey' : v < 0.5 ? 'sky' : v < 0.62 ? 'rosy' : 'fog';
      p.rect(cx, cy, 4, 3, color);
    }
  }
  px(p, x + 15, y, 'red');
  p.rect(x + 1, y + h, w, 1, 'stone');
}

/** High windows in the upper wall, one between every pair of ceiling lights. */
function paintHighWindows(p: Painter, w: number, ox: number, cornice: number): void {
  const wh = Math.min(48, cornice - 16);
  if (wh < 20) return;
  const top = Math.floor((cornice - wh) / 2) + 2;
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 24) / LAMP_GAP);
  for (let k = first; centre + k * LAMP_GAP - 24 < w; k++) {
    const cx = centre + k * LAMP_GAP;
    paintClassWindow(p, cx - 15, top, 31, wh, 50 + k);
  }
}

// ---------------------------------------------------------------------------
// The computer-class teacher: 16x24, facing left. A friendly man in his
// forties: short brown hair with a side part, round glasses, a green
// cardigan with honey buttons over a pale blue shirt, dark trousers and
// brown shoes.

const INSTRUCTOR_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhhhHhhh....',
    '...hhhhhhhhhh...',
    '...hssssshhhh...',
    '...gLegsssEhhh..',
    '...ssssssssh....',
    '....stssssh.....',
    '......sss.......',
    '.....ccwwcccc...',
    '....ccwwwcccCC..',
    '...cccwbccccCC..',
    '...cccwwccccCC..',
    '...cccwbccccCC..',
    '...cccwwccccCC..',
    '...ssswbccccCC..',
    '...ssccwccccCC..',
    '....ccccccccC...',
    '.....dddddDD....',
    '.....ddd.DDD....',
    '.....ddd.DDD....',
    '.....ddd.DDD....',
    '.....ddd.DDD....',
    '....kkkk.kkk....',
  ],
  legend: {
    h: 'ember',
    H: 'amber',
    s: 'skin',
    E: 'tan',
    g: 'ink',
    L: 'sky',
    e: 'ink',
    t: 'tan',
    w: 'sky',
    c: 'leaf',
    C: 'moss',
    b: 'honey',
    d: 'slate',
    D: 'night',
    k: 'ember',
  },
};

export const COMMUNITY_CENTER_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    instructor: { sprite: INSTRUCTOR_SPRITE, x: 80, y: CORE_H - 25, side: 'right' },
    // Ben from the park: alone he stands where the teacher does; with the
    // teacher on stage he waits by the notice board.
    volunteer: {
      sprite: VOLUNTEER_SPRITE,
      x: 80,
      y: CORE_H - 25,
      side: 'right',
      beside: { x: 96, y: CORE_H - 25 },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 5 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 84, y: 25 } },
  rest: {
    left: { x: DESK.x, y: PROP_TOP },
    // Stops short of the teacher, so a picture stays clear of his hands.
    right: { x: DESK.x + 18, y: PROP_TOP },
  },
};
