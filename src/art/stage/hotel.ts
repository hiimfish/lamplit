import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { COWORKER_SPRITE, HOTEL_CLERK_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W, paintPicture, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The hotel stage: the lobby of a business hotel in Chicago on a June evening.
 * From the left: a brass luggage cart, the elevator (you stand in front of
 * it), a wall lamp over a potted plant, then the front desk: a marble top on a
 * dark front with brass lines, a bell at its near end, a glass lamp at the far
 * end. Behind it: the "RECEPTION" plate over a rack of room keys, and three
 * clocks for three cities over the clerk's head. The carpet runs in front of
 * the desk, so Dan can stand there.
 *
 * The voicemail backdrop is your hotel room that night: the bed under a window
 * onto the lit towers, the room phone with its red message light on the
 * nightstand beside a lamp, and on the right a framed panel with a phone badge:
 * Ms. Carter in her office at Harbor Trading, the harbour at dusk in her window.
 *
 * Like the other stages both fill any size: the 128x64 core sits centred near
 * the bottom. Above the lobby come three brass stars, a painting and a
 * chandelier, then (on a tall stage) the galleries of the upper floors with
 * their room doors; the entrance, armchairs under windows and console tables
 * to both sides. Above the room come a taller window and a picture rail with
 * high windows; a closet, the bathroom, the door and a luggage rack to the
 * sides. Painted through the Painter interface, palette colours only, whole
 * pixels.
 */

/** The front desk's left edge and the y of its top, in core pixels (props rest on it). */
const DESK = { x: 56, top: 40 } as const;
/** 24x24 pictures stand on the desk with their shadow on the marble. */
const PROP_TOP = DESK.top - 20;
/** The desk's foot: the carpet runs on in front of it, so people can stand before the desk. */
const DESK_FOOT = 60;
/** Desk length past the core's right edge before it ends. */
const DESK_TAIL = 26;

const FLOOR_TOP = 56;
/** Top of the wooden panelling on the lobby's lower wall. */
const DADO_TOP = 46;
/** Width of one bay beside the core. */
const BAY_W = 48;

/** The clerk behind the desk; Dan before it (alone) or next to you (with the clerk there). */
const BEHIND_DESK = { x: 96, y: 19 } as const;
const BEFORE_DESK = { x: 96, y: 39 } as const;
const NEXT_TO_YOU = { x: 42, y: 39 } as const;

/** The wall lamp between the elevator and the desk, in core x. */
const SCONCE_X = 49;
/** Wall above the core needed for the ceiling line, the stars, the painting and the chandelier. */
const CEILING_MIN = 6;
const CEILING_H = 4;
const STARS_MIN = 9;
const PICTURE_MIN = 26;
const CHANDELIER_MIN = 22;
/** The chandeliers: one at this core x, then one every CHANDELIER_GAP both ways. */
const CHANDELIER_X = 50;
const CHANDELIER_GAP = 120;
/** From this much wall the upper floors show: the first gallery floor this far above the core. */
const GALLERY_MIN = 60;
const GALLERY_UP = 38;
/** One upper floor, the thickness of its floor slab, the least room for a railing and for doors. */
const FLOOR_H = 44;
const SLAB_H = 4;
const RAILING_MIN = 16;
const DOORS_MIN = 30;

/** The call panel in core pixels (its outer border), and where Ms. Carter stands inside it. */
const PANEL = { x: 62, y: 2, w: 50, h: 62 } as const;
const IN_PANEL = { x: 94, y: 39 } as const;
/** The room's window: its glass from (x, y), w x h; it grows upwards on a taller stage. */
const WINDOW = { x: 9, y: 8, w: 28, h: 23 } as const;
const WINDOW_GROW = 24;
/** Wall above the core needed for a painting over the call panel. */
const ROOM_PICTURE_MIN = 32;
/** Wall above the core needed for the room's picture rail, and how far up it runs. */
const ROOM_RAIL_MIN = 72;
const ROOM_RAIL_UP = 58;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle. */
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

/** Paints rows of '#' marks as single pixels. */
function stamp(p: Painter, rows: readonly string[], x: number, y: number, color: PaletteName) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') px(p, x + dx, y + dy, color);
  });
}

// ---------------------------------------------------------------------------
// The lobby

/** Paints the lobby to fill a w x h stage (at least the 128x64 core). */
function paintLobby(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const deskEnd = ox + CORE_W + DESK_TAIL;
  const slab = oy >= GALLERY_MIN ? oy - GALLERY_UP : -1;
  const wallTop = slab >= 0 ? slab + SLAB_H : oy >= CEILING_MIN ? CEILING_H : 0;
  /** Lobby wall between the ceiling (or the first gallery) and the core. */
  const spare = oy - wallTop;

  const chandeliers: number[] = [];
  if (spare >= CHANDELIER_MIN) {
    const first =
      ox + CHANDELIER_X - Math.ceil((ox + CHANDELIER_X + 10) / CHANDELIER_GAP) * CHANDELIER_GAP;
    for (let x = first; x < w + 10; x += CHANDELIER_GAP) chandeliers.push(x);
  }

  paintLobbyWall(p, w, ox, oy, wallTop);
  if (slab >= 0) paintGalleries(p, w, ox, slab);
  else if (wallTop > 0) paintCeiling(p, w);

  // Light on the wall: behind the clerk, and round every chandelier.
  glowEllipse(p, ox + 106, oy + 27, 24, 15, 'honey', [0.22, 0.12, 0.06]);
  for (const cx of chandeliers) glowEllipse(p, cx, oy - 12, 24, 13, 'honey', [0.3, 0.16, 0.07]);

  // Up the wall, when there is room above the core.
  if (spare >= STARS_MIN) paintStars(p, ox + 77, oy - 7);
  if (spare >= PICTURE_MIN) paintPicture(p, ox + 17, oy - 23);

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  // Bays beside the core: the entrance, then armchairs under windows and
  // console tables to the left; the same two past the end of the desk.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintEntrance(p, x, oy, floorTop);
    else if (i % 2 === 1) paintLounge(p, x, oy, floorTop, i);
    else paintConsole(p, x, oy, floorTop, i);
  }
  for (let x = deskEnd + 2, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintConsole(p, x, oy, floorTop, i + 7);
    else paintLounge(p, x, oy, floorTop, i + 7);
  }

  // Left of the desk.
  paintSconce(p, ox + SCONCE_X, oy + 20);
  paintCart(p, ox, floorTop);
  paintElevator(p, ox + 14, oy + 16, floorTop);
  paintPlant(p, ox + 46, floorTop - 20);

  // Behind the desk.
  paintSign(p, ox + 57, oy + 1);
  paintKeyRack(p, ox + 59, oy + 11);
  for (let i = 0; i < 3; i++) paintWorldClock(p, ox + 101 + i * 10, oy + 8, i);
  paintStaffDoor(p, ox + CORE_W + 6, oy + 9, oy + DESK.top);

  // The desk and what stands on it.
  const top = oy + DESK.top;
  paintDesk(p, ox + DESK.x, deskEnd, top, oy + DESK_FOOT, deskEnd < w);
  paintBell(p, ox + DESK.x + 1, top);
  paintKeyCards(p, ox + 89, top);
  paintDeskLamp(p, ox + 119, top);
  paintMonitor(p, ox + CORE_W + 5, top);

  for (const cx of chandeliers) paintChandelier(p, cx, oy - 19);
}

/** The lobby wall: deep teal with a small woven motif, counted from the core. */
function paintLobbyWall(p: Painter, w: number, ox: number, oy: number, wallTop: number): void {
  const bottom = oy + DADO_TOP;
  p.rect(0, 0, w, bottom, 'teal');
  // dimmer up under the ceiling, away from the lamps
  ditherRect(p, 0, wallTop, w, 4, 'moss', 8);
  ditherRect(p, 0, wallTop + 4, w, 4, 'moss', 4);
  for (let y = mod(oy + 4, 7) - 7; y < bottom; y += 7) {
    const row = Math.round((y - oy - 4) / 7);
    for (let x = mod(ox + mod(row, 2) * 6, 12) - 12; x < w; x += 12) p.rect(x, y, 1, 2, 'moss');
  }
}

/** The ceiling line across the top of the stage. */
function paintCeiling(p: Painter, w: number): void {
  p.rect(0, 0, w, CEILING_H - 1, 'night');
  p.rect(0, CEILING_H - 1, w, 1, 'lamp');
}

/** Dark wooden panelling on the lower wall. */
function paintDado(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'amber');
  p.rect(0, top + 1, w, 1, 'plum');
  for (let x = mod(ox + 5, 10) - 10; x < w; x += 10) {
    p.rect(x, top + 3, 1, floorTop - top - 4, 'plum');
  }
  p.rect(0, floorTop - 1, w, 1, 'night');
}

/** The lobby carpet: wine red with a lattice of small diamonds. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'maroon');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 4 < h; row++) {
    const y = floorTop + 2 + row * 4;
    for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) {
      px(p, x, y, 'red');
      px(p, x - 1, y + 1, 'red');
      px(p, x + 1, y + 1, 'red');
      px(p, x, y + 2, 'red');
    }
  }
}

/** A brass wall lamp with a glass shade, and its light on the wall. */
function paintSconce(p: Painter, cx: number, y: number): void {
  glowEllipse(p, cx, y + 2, 13, 12, 'honey', [0.34, 0.2, 0.1]);
  p.rect(cx - 1, y - 1, 3, 1, 'paper');
  p.rect(cx - 2, y, 5, 3, 'honey');
  p.rect(cx - 1, y + 3, 3, 1, 'lamp');
  p.rect(cx, y + 4, 1, 3, 'amber');
  p.rect(cx - 1, y + 7, 3, 1, 'amber');
}

/** A brass luggage cart with three cases, 14 wide, its wheels on the carpet. */
function paintCart(p: Painter, x: number, floorTop: number): void {
  const deck = floorTop - 1;
  // the cases: a big leather one, a blue one, a small red bag
  p.rect(x + 2, deck - 9, 10, 9, 'tan');
  p.rect(x + 2, deck - 9, 10, 1, 'skin');
  p.rect(x + 4, deck - 9, 1, 9, 'ember');
  p.rect(x + 9, deck - 9, 1, 9, 'ember');
  p.rect(x + 3, deck - 14, 8, 5, 'denim');
  p.rect(x + 3, deck - 14, 8, 1, 'sky');
  px(p, x + 6, deck - 12, 'honey');
  p.rect(x + 4, deck - 18, 6, 4, 'red');
  p.rect(x + 4, deck - 15, 6, 1, 'maroon');
  p.rect(x + 6, deck - 19, 2, 1, 'ink');
  // the brass frame: two posts under an arch, a rail to hang coats from
  p.rect(x + 1, deck - 25, 1, 25, 'lamp');
  p.rect(x + 12, deck - 25, 1, 25, 'lamp');
  p.rect(x + 2, deck - 26, 10, 1, 'lamp');
  p.rect(x + 3, deck - 27, 8, 1, 'honey');
  p.rect(x + 2, deck - 23, 10, 1, 'amber');
  // the deck and the wheels
  p.rect(x, deck, 14, 1, 'lamp');
  p.rect(x, deck + 1, 14, 1, 'night');
  p.rect(x + 1, deck + 2, 2, 2, 'ink');
  p.rect(x + 11, deck + 2, 2, 2, 'ink');
}

/** The floor the elevator is at, in lit dots. */
const THREE: readonly string[] = ['###', '..#', '.##', '..#', '###'];

/** The elevator: steel doors in a brass frame, the floor lights above, the call button beside. */
function paintElevator(p: Painter, x: number, top: number, floorTop: number): void {
  const dh = floorTop - top;
  p.rect(x, top - 2, 28, dh + 2, 'lamp');
  p.rect(x, top - 2, 28, 1, 'honey');
  p.rect(x + 27, top - 1, 1, dh + 1, 'amber');
  p.rect(x + 2, top, 24, dh, 'stone');
  p.rect(x + 2, top, 24, 1, 'slate');
  // two leaves, each with a sunk panel and a lit edge
  for (const lx of [x + 2, x + 14]) {
    p.rect(lx, top + 1, 1, dh - 1, 'concrete');
    p.rect(lx + 2, top + 4, 8, dh - 8, 'slate');
    p.rect(lx + 3, top + 5, 6, dh - 10, 'stone');
    for (let i = 0; i < 3; i++) px(p, lx + 4 + i, top + 13 - i, 'fog');
  }
  p.rect(x + 13, top, 1, dh, 'night');
  p.rect(x + 2, floorTop - 1, 24, 1, 'night');
  p.rect(x + 1, floorTop, 26, 1, 'amber');
  // the floor lights: an arrow going up, passing the third floor
  p.rect(x + 6, top - 11, 16, 7, 'lamp');
  p.rect(x + 7, top - 10, 14, 5, 'ink');
  p.rect(x + 10, top - 10, 1, 5, 'honey');
  p.rect(x + 9, top - 9, 3, 1, 'honey');
  px(p, x + 8, top - 8, 'honey');
  px(p, x + 12, top - 8, 'honey');
  stamp(p, THREE, x + 15, top - 10, 'honey');
  // the call button
  p.rect(x + 30, top + 20, 3, 6, 'fog');
  px(p, x + 31, top + 21, 'lamp');
  px(p, x + 31, top + 24, 'stone');
}

/** 3x5 pixel letters for the plate over the desk (the word is taught in this unit). */
const LETTERS: Readonly<Record<string, readonly string[]>> = {
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
};

/** The "RECEPTION" plate: brass letters on a dark plate in a brass rim, 40 x 9. */
function paintSign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 40, 9, 'lamp');
  p.rect(x + 1, y + 1, 38, 7, 'night');
  let cx = x + 2;
  for (const ch of 'RECEPTION') {
    const rows = LETTERS[ch];
    if (!rows) continue;
    stamp(p, rows, cx, y + 2, 'honey');
    cx += (rows[0]?.length ?? 3) + 1;
  }
}

/** The key rack: fifteen pigeonholes, most with a room key on its hook, a few with a note. */
function paintKeyRack(p: Painter, x: number, y: number): void {
  p.rect(x, y, 36, 22, 'ember');
  p.rect(x, y, 36, 1, 'amber');
  p.rect(x + 1, y + 22, 36, 1, 'moss');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const cx = x + 1 + c * 7;
      const cy = y + 1 + r * 7;
      p.rect(cx, cy, 6, 6, 'plum');
      p.rect(cx, cy, 6, 1, 'night');
      if (hash2(c, r, 211) < 0.66) {
        // a key: its ring on the hook, the bit below
        px(p, cx + 2, cy + 1, 'honey');
        px(p, cx + 1, cy + 2, 'honey');
        px(p, cx + 3, cy + 2, 'honey');
        p.rect(cx + 2, cy + 3, 1, 3, 'lamp');
        px(p, cx + 3, cy + 5, 'lamp');
      } else if (hash2(c, r, 217) < 0.6) {
        // the key is out; a note waits for the guest
        p.rect(cx + 1, cy + 3, 4, 2, 'fog');
        px(p, cx + 2, cy + 3, 'paper');
      }
    }
  }
}

/** A small brass clock; three of them show the time in three cities. */
function paintWorldClock(p: Painter, cx: number, cy: number, n: number): void {
  p.rect(cx - 2, cy - 3, 5, 7, 'lamp');
  p.rect(cx - 3, cy - 2, 7, 5, 'lamp');
  p.rect(cx - 1, cy - 2, 3, 5, 'paper');
  p.rect(cx - 2, cy - 1, 5, 3, 'paper');
  px(p, cx, cy, 'ink');
  px(p, cx, cy - 1, 'ink');
  const hour: readonly (readonly [number, number])[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
  ];
  const [hx, hy] = hour[n % hour.length] ?? [1, 0];
  px(p, cx + hx, cy + hy, 'ink');
  p.rect(cx - 2, cy + 5, 5, 1, 'night');
}

/** The door to the back office, behind the far end of the desk. */
function paintStaffDoor(p: Painter, x: number, top: number, bottom: number): void {
  p.rect(x - 1, top - 1, 18, bottom - top + 1, 'night');
  p.rect(x, top, 16, bottom - top, 'ember');
  p.rect(x + 2, top + 2, 12, 11, 'plum');
  p.rect(x + 2, top + 15, 12, bottom - top - 15, 'plum');
  p.rect(x + 6, top + 5, 4, 2, 'honey');
  p.rect(x + 1, top + 16, 1, 3, 'lamp');
}

/** The front desk from x0 to x1: a marble top, a dark front with brass lines and plum panels. */
function paintDesk(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  foot: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top + 3, w, foot - top - 3, 'night');
  p.rect(x0, top + 4, w, 1, 'lamp');
  const panelTop = top + 7;
  const panelH = foot - 4 - panelTop;
  for (let x = x0 + 4, i = 0; x + 14 <= x1 - 2; x += 18, i++) {
    p.rect(x, panelTop, 14, panelH, 'plum');
    p.rect(x, panelTop, 14, 1, 'ink');
    p.rect(x, panelTop, 1, panelH, 'ink');
    p.rect(x + 13, panelTop + 1, 1, panelH - 1, 'maroon');
    p.rect(x + 1, panelTop + panelH - 1, 13, 1, 'maroon');
    // the hotel's brass diamond on every second panel
    if (i % 2 === 1) {
      const cy = panelTop + Math.floor(panelH / 2);
      p.rect(x + 6, cy - 2, 2, 5, 'lamp');
      p.rect(x + 5, cy - 1, 4, 3, 'lamp');
      p.rect(x + 4, cy, 6, 1, 'lamp');
      p.rect(x + 6, cy - 1, 2, 2, 'honey');
    }
  }
  p.rect(x0, top + 3, 1, foot - top - 3, 'slate');
  if (endsInView) p.rect(x1 - 1, top + 3, 1, foot - top - 3, 'ink');
  // a brass kick rail on a dark plinth
  p.rect(x0, foot - 3, w, 1, 'lamp');
  p.rect(x0, foot - 2, w, 2, 'ink');
  // the marble top, a pixel proud of the front, with a few veins
  p.rect(x0 - 1, top, w + 1, 1, 'paper');
  p.rect(x0 - 1, top + 1, w + 1, 1, 'fog');
  p.rect(x0 - 1, top + 2, w + 1, 1, 'concrete');
  for (let x = x0 + 5; x < x1 - 3; x += 9) {
    const dx = Math.floor(hash2(x - x0, 0, 223) * 4);
    p.rect(x + dx, top, 2, 1, 'fog');
    px(p, x + dx + 2, top + 1, 'concrete');
  }
  // its shadow on the carpet
  p.rect(x0, foot, w, 1, 'ink', 0.5);
}

/** The bell on the desk: a brass dome with a button on top. */
function paintBell(p: Painter, x: number, top: number): void {
  p.rect(x, top - 1, 5, 1, 'amber');
  p.rect(x, top - 3, 5, 2, 'lamp');
  p.rect(x + 1, top - 4, 3, 1, 'lamp');
  px(p, x + 1, top - 4, 'honey');
  px(p, x + 1, top - 3, 'honey');
  px(p, x + 2, top - 5, 'amber');
}

/** Two key cards left on the desk. */
function paintKeyCards(p: Painter, x: number, top: number): void {
  p.rect(x, top - 1, 5, 1, 'fog');
  p.rect(x + 1, top - 2, 5, 1, 'paper');
  px(p, x + 2, top - 2, 'teal');
  px(p, x + 1, top - 1, 'teal');
}

/** A desk lamp with a lit glass shade on a brass stem, its base on the desk at `top`. */
function paintDeskLamp(p: Painter, cx: number, top: number): void {
  glowEllipse(p, cx, top - 6, 10, 7, 'honey', [0.36, 0.18]);
  p.rect(cx - 2, top - 1, 5, 1, 'amber');
  p.rect(cx, top - 6, 1, 5, 'lamp');
  p.rect(cx - 3, top - 11, 7, 1, 'lamp');
  p.rect(cx - 4, top - 10, 9, 3, 'honey');
  p.rect(cx - 3, top - 10, 2, 1, 'paper');
  p.rect(cx - 4, top - 7, 9, 1, 'lamp');
  px(p, cx + 2, top - 6, 'amber');
  px(p, cx + 2, top - 5, 'amber');
}

/** The clerk's computer screen, seen from behind, on the far end of the desk. */
function paintMonitor(p: Painter, x: number, top: number): void {
  p.rect(x, top - 11, 12, 8, 'night');
  p.rect(x + 1, top - 10, 10, 6, 'slate');
  p.rect(x + 1, top - 10, 10, 1, 'stone');
  px(p, x + 10, top - 5, 'leaf');
  p.rect(x + 5, top - 3, 2, 2, 'slate');
  p.rect(x + 3, top - 1, 6, 1, 'night');
}

// ---------------------------------------------------------------------------
// Above the lobby

const STAR: readonly string[] = ['..#..', '..#..', '#####', '.###.', '.#.#.'];

/** Three brass stars over the reception plate, a thin brass line either side. */
function paintStars(p: Painter, cx: number, y: number): void {
  for (const dx of [-10, 0, 10]) stamp(p, STAR, cx + dx - 2, y, 'honey');
  p.rect(cx - 24, y + 2, 9, 1, 'lamp');
  p.rect(cx + 16, y + 2, 9, 1, 'lamp');
}

/** A brass chandelier on a long cord from the ceiling (y 0), its top ring at `top`. */
function paintChandelier(p: Painter, cx: number, top: number): void {
  p.rect(cx, 0, 1, top, 'ink');
  p.rect(cx - 1, top, 3, 1, 'amber');
  p.rect(cx, top + 1, 1, 9, 'amber');
  // the upper ring and its three candles
  p.rect(cx - 3, top + 3, 7, 1, 'lamp');
  for (const dx of [-3, 0, 3]) {
    px(p, cx + dx, top + 2, 'honey');
    px(p, cx + dx, top + 1, 'paper');
  }
  // the lower ring and its four candles
  p.rect(cx - 8, top + 8, 17, 1, 'lamp');
  for (const dx of [-8, -4, 4, 8]) {
    p.rect(cx + dx, top + 6, 1, 2, 'honey');
    px(p, cx + dx, top + 5, 'paper');
  }
  // glass drops
  for (let dx = -7; dx <= 7; dx += 2) px(p, cx + dx, top + 9, mod(dx, 4) === 1 ? 'paper' : 'honey');
  p.rect(cx - 1, top + 10, 3, 1, 'lamp');
  px(p, cx, top + 11, 'paper');
}

/**
 * The upper floors over the lobby: gallery after gallery from the slab at
 * `slab` up to the ceiling, as many as fit.
 */
function paintGalleries(p: Painter, w: number, ox: number, slab: number): void {
  for (let y = slab, k = 0; ; k++) {
    const next = y - FLOOR_H;
    const last = next - CEILING_H < RAILING_MIN;
    paintGallery(p, w, ox, last ? CEILING_H : next + SLAB_H, y, k);
    if (last) break;
    y = next;
  }
  paintCeiling(p, w);
}

/** One upper floor from `top` down to its slab at `y`: room doors, wall lamps, a brass railing. */
function paintGallery(p: Painter, w: number, ox: number, top: number, y: number, k: number): void {
  const gap = 44;
  p.rect(0, top, w, y - top, 'plum');
  for (let yy = y - 4, row = 0; yy > top; yy -= 6, row++) {
    for (let x = mod(ox + (row % 2) * 5, 10) - 10; x < w; x += 10) px(p, x, yy, 'maroon');
  }
  for (let x = mod(ox + 12 + k * 16, gap) - gap; x < w; x += gap) {
    if (y - top >= DOORS_MIN) {
      p.rect(x - 1, y - 25, 14, 25, 'night');
      p.rect(x, y - 24, 12, 24, 'ember');
      p.rect(x + 2, y - 22, 8, 9, 'maroon');
      p.rect(x + 2, y - 11, 8, 9, 'maroon');
      px(p, x + 1, y - 12, 'lamp');
      p.rect(x + 5, y - 28, 3, 2, 'honey');
    }
    // a wall lamp between two doors
    const lx = x + 12 + Math.floor((gap - 12) / 2);
    glowEllipse(p, lx, y - 19, 9, 8, 'honey', [0.28, 0.12]);
    p.rect(lx - 1, y - 21, 3, 2, 'honey');
    px(p, lx, y - 19, 'lamp');
    px(p, lx, y - 18, 'amber');
  }
  // the railing
  for (let x = mod(ox, 4) - 4; x < w; x += 4) p.rect(x, y - 8, 1, 8, 'ember');
  for (let x = mod(ox + 2, gap) - gap; x < w; x += gap) {
    p.rect(x, y - 11, 2, 11, 'lamp');
    p.rect(x, y - 12, 2, 1, 'honey');
  }
  p.rect(0, y - 10, w, 1, 'lamp');
  p.rect(0, y - 9, w, 1, 'amber');
  // the slab, and its shadow on the wall below
  p.rect(0, y, w, 1, 'honey');
  p.rect(0, y + 1, w, 2, 'ember');
  p.rect(0, y + 3, w, 1, 'night');
  p.rect(0, y + SLAB_H, w, 1, 'moss');
}

// ---------------------------------------------------------------------------
// Beside the lobby's core

/**
 * The city through a window: a row of towers with lit windows under the last
 * light of the day, or under the night sky. Paint it through `within`.
 */
function paintSkyline(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  night: boolean,
): void {
  const sky: readonly PaletteName[] = night
    ? ['deep', 'deep', 'indigo', 'dusk']
    : ['indigo', 'dusk', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, h, sky);
  for (let i = 0; i * 6 < w; i++) {
    const sx = x + Math.floor(hash2(seed, i, 17) * w);
    const sy = y + Math.floor(hash2(seed, i, 19) * h * 0.35);
    px(p, sx, sy, hash2(seed, i, 23) > 0.6 ? 'paper' : 'fog');
  }
  const tower: PaletteName = night ? 'night' : 'plum';
  for (let i = 0; i < w;) {
    const bw = 3 + Math.floor(hash2(seed, i, 29) * 5);
    const bh = Math.floor(h * (0.22 + hash2(seed, i, 31) * 0.5));
    const top = y + h - bh;
    p.rect(x + i, top, bw, bh, tower);
    p.rect(x + i, top, 1, bh, night ? 'slate' : 'night');
    if (bh > h * 0.55) {
      // a mast with a red light on the tallest towers
      p.rect(x + i + Math.floor(bw / 2), top - 3, 1, 3, tower);
      px(p, x + i + Math.floor(bw / 2), top - 4, 'red');
    }
    for (let wy = top + 2; wy < y + h - 1; wy += 2) {
      for (let wx = i + 1; wx < i + bw - 1; wx += 2) {
        if (hash2(wx + seed * 31, wy - y, 41) < 0.42) {
          px(p, x + wx, wy, hash2(wx, wy - y, 43) < 0.5 ? 'honey' : 'lamp');
        }
      }
    }
    i += bw + (hash2(seed, i, 47) < 0.3 ? 1 : 0);
  }
}

/** A window onto the city: the glass from (x, y), w x h, in a frame with a sill. */
function paintWindow(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  night: boolean,
  frame: PaletteName,
  sill: PaletteName,
): void {
  p.rect(x - 2, y - 2, w + 4, h + 4, frame);
  paintSkyline(within(p, x, y, w, h), x, y, w, h, seed, night);
  p.rect(x + Math.floor(w / 2), y, 1, h, frame);
  p.rect(x, y + Math.floor(h / 3), w, 1, frame);
  p.rect(x - 3, y + h + 2, w + 6, 1, sill);
}

/** The entrance: two glass doors in a brass frame onto the evening street, a mat before them. */
function paintEntrance(p: Painter, x: number, oy: number, floorTop: number): void {
  paintSconce(p, x + 44, oy + 20);
  const fx = x + 6;
  const top = oy + 8;
  const dh = floorTop - top;
  p.rect(fx - 1, top - 2, 34, dh + 2, 'lamp');
  p.rect(fx - 1, top - 2, 34, 1, 'honey');
  p.rect(fx, top, 32, dh, 'amber');
  for (const dx of [1, 17]) {
    const gx = fx + dx;
    const gh = dh - 2;
    paintSkyline(within(p, gx, top + 1, 14, gh), gx, top + 1, 14, gh, 3 + dx, false);
    // the street: a dark road, a pair of headlights, a street lamp
    p.rect(gx, top + gh - 5, 14, 6, 'night');
    p.rect(gx, top + gh - 2, 14, 1, 'slate');
    px(p, gx + (dx === 1 ? 9 : 3), top + gh - 4, 'honey');
    px(p, gx + (dx === 1 ? 11 : 5), top + gh - 4, 'honey');
    for (let i = 0; i < 4; i++) px(p, gx + 2 + i, top + 9 - i, 'fog');
    p.rect(gx + 1, top + 24, 12, 1, 'honey');
    p.rect(gx + 1, top + 25, 12, 1, 'lamp');
  }
  p.rect(fx + 2, floorTop + 1, 28, 2, 'moss');
  p.rect(fx + 2, floorTop + 1, 28, 1, 'leaf');
}

/** A red velvet armchair, 20 wide, seen from the front: a rounded back, two fat arms. */
function paintArmchair(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 18;
  // the back, buttoned
  p.rect(x + 5, top, 10, 1, 'red');
  p.rect(x + 4, top + 1, 12, 10, 'red');
  p.rect(x + 5, top + 1, 10, 1, 'rosy');
  for (const [dx, dy] of [
    [7, 4],
    [12, 4],
    [7, 7],
    [12, 7],
  ] as const) {
    px(p, x + dx, top + dy, 'maroon');
  }
  // the cushion and the front under it
  p.rect(x + 4, top + 10, 12, 3, 'red');
  p.rect(x + 4, top + 10, 12, 1, 'rosy');
  p.rect(x + 4, top + 13, 12, 4, 'maroon');
  // the arms
  for (const ax of [x, x + 16]) {
    p.rect(ax + 1, top + 5, 2, 1, 'rosy');
    p.rect(ax, top + 6, 4, 11, 'red');
    p.rect(ax, top + 6, 4, 1, 'rosy');
    p.rect(ax, top + 14, 4, 3, 'maroon');
  }
  p.rect(x + 4, top + 5, 1, 8, 'maroon');
  p.rect(x + 15, top + 5, 1, 8, 'maroon');
  p.rect(x + 1, floorTop - 1, 2, 3, 'ink');
  p.rect(x + 17, floorTop - 1, 2, 3, 'ink');
}

/** A small table lamp with a lit shade, its base on a surface at `top`, and its light. */
function paintTableLamp(p: Painter, cx: number, top: number): void {
  glowEllipse(p, cx, top - 8, 11, 10, 'honey', [0.34, 0.18, 0.08]);
  p.rect(cx - 1, top - 1, 3, 1, 'amber');
  p.rect(cx, top - 5, 1, 4, 'lamp');
  p.rect(cx - 2, top - 11, 5, 1, 'paper');
  p.rect(cx - 3, top - 10, 7, 4, 'paper');
  p.rect(cx - 3, top - 6, 7, 1, 'honey');
  p.rect(cx + 2, top - 10, 1, 4, 'fog');
}

/** A seat by a window: the city at dusk, a leather armchair, a lamp on a round table. */
function paintLounge(p: Painter, x: number, oy: number, floorTop: number, seed: number): void {
  paintWindow(p, x + 7, oy + 8, 24, 23, seed, false, 'ember', 'honey');
  const tx = x + 32;
  paintTableLamp(p, tx + 5, floorTop - 10);
  p.rect(tx, floorTop - 10, 10, 1, 'honey');
  p.rect(tx, floorTop - 9, 10, 1, 'amber');
  p.rect(tx + 4, floorTop - 8, 2, 8, 'night');
  p.rect(tx + 2, floorTop, 6, 1, 'night');
  paintArmchair(p, x + 9, floorTop);
}

/** A mirror in a brass frame, 16 x 22. */
function paintMirror(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 14, 22, 'lamp');
  p.rect(x, y + 1, 16, 20, 'lamp');
  p.rect(x + 2, y + 2, 12, 18, 'fog');
  p.rect(x + 2, y + 13, 12, 7, 'concrete');
  for (let i = 0; i < 5; i++) px(p, x + 4 + i, y + 9 - i, 'paper');
  for (let i = 0; i < 3; i++) px(p, x + 8 + i, y + 11 - i, 'paper');
}

/** A console table under a painting or a mirror: flowers in a vase, a few leaflets, a wall lamp. */
function paintConsole(p: Painter, x: number, oy: number, floorTop: number, seed: number): void {
  paintSconce(p, x + 42, oy + 20);
  if ((seed >> 1) % 2 === 1) paintMirror(p, x + 15, oy + 9);
  else paintPicture(p, x + 12, oy + 13);
  const top = oy + 43;
  p.rect(x + 8, top + 4, 2, floorTop - top - 3, 'night');
  p.rect(x + 34, top + 4, 2, floorTop - top - 3, 'night');
  p.rect(x + 6, top, 32, 1, 'lamp');
  p.rect(x + 7, top + 1, 30, 3, 'night');
  // leaflets, and flowers in a white vase
  p.rect(x + 10, top - 2, 6, 2, 'paper');
  p.rect(x + 10, top - 1, 6, 1, 'fog');
  p.rect(x + 24, top - 10, 1, 4, 'moss');
  p.rect(x + 25, top - 11, 1, 5, 'leaf');
  p.rect(x + 23, top - 6, 4, 6, 'paper');
  p.rect(x + 26, top - 5, 1, 5, 'fog');
  const heads: readonly [number, number, PaletteName][] = [
    [21, -12, 'neon'],
    [24, -14, 'honey'],
    [27, -12, 'rosy'],
    [23, -10, 'paper'],
    [26, -9, 'neon'],
  ];
  for (const [dx, dy, c] of heads) p.rect(x + dx, top + dy, 2, 2, c);
}

// ---------------------------------------------------------------------------
// The hotel room, with Ms. Carter's voicemail

/** Your room that night on the left, Ms. Carter's office in a call panel on the right. */
function paintVoicemail(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintRoom(p, w, h);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y);
}

/** Everything of the room: wall, carpet, the bays beside the core, the bed and the nightstand. */
function paintRoom(p: Painter, w: number, h: number): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const rail = oy >= ROOM_RAIL_MIN ? oy - ROOM_RAIL_UP : -1;
  // On a taller stage the window reaches further up.
  const grow = Math.min(WINDOW_GROW, Math.max(0, oy - 10));
  const winTop = oy + WINDOW.y - grow;

  // The wall: striped paper, warm where the bedside lamp lights it.
  p.rect(0, 0, w, floorTop, 'mauve');
  for (let x = mod(ox + 2, 8) - 8; x < w; x += 8) p.rect(x, 0, 1, floorTop, 'rosy');
  if (rail >= 0) paintRoomUpperWall(p, w, ox, rail);
  else if (oy >= CEILING_MIN) {
    p.rect(0, 0, w, 2, 'fog');
    p.rect(0, 2, w, 1, 'plum');
  }
  p.rect(0, floorTop - 2, w, 2, 'plum');
  paintRoomCarpet(p, w, ox, floorTop, h);

  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintBedside(p, x, oy, floorTop);
    else if (i === 2) paintBathroom(p, x, oy, floorTop);
    else if (i % 2 === 1) paintCloset(p, x, oy, floorTop);
    else paintLuggage(p, x, oy, floorTop);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    if (i === 0) paintRoomDoor(p, x, oy, floorTop);
    else if (i % 2 === 1) paintLuggage(p, x, oy, floorTop);
    else paintCloset(p, x, oy, floorTop);
  }

  // The core.
  paintDrapes(p, ox + WINDOW.x, winTop, WINDOW.w, WINDOW.h + grow);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, WINDOW.h + grow, 5, true, 'paper', 'fog');
  paintAirConditioner(p, ox + 45, oy + 2);
  if (oy >= ROOM_PICTURE_MIN) paintPicture(p, ox + 70, oy - 24);
  paintFloorLamp(p, ox + 120, oy + 20, floorTop);
  const standTop = oy + 46;
  paintTableLamp(p, ox + 55, standTop);
  paintBed(p, ox, floorTop);
  paintNightstand(p, ox + 45, standTop, floorTop);
  paintPhone(p, ox + 45, standTop);
}

/** A standing lamp with a fabric shade, lit, between the call panel and the door. */
function paintFloorLamp(p: Painter, cx: number, top: number, floorTop: number): void {
  glowEllipse(p, cx, top + 5, 13, 12, 'honey', [0.34, 0.2, 0.1]);
  p.rect(cx - 2, top, 5, 1, 'paper');
  p.rect(cx - 3, top + 1, 7, 2, 'paper');
  p.rect(cx - 4, top + 3, 9, 3, 'paper');
  p.rect(cx + 2, top + 1, 1, 5, 'fog');
  p.rect(cx - 4, top + 6, 9, 1, 'honey');
  p.rect(cx, top + 7, 1, floorTop - top - 6, 'ink');
  p.rect(cx - 2, floorTop + 1, 5, 1, 'ink');
}

/** The room's carpet: dark blue with small dots, counted from the core. */
function paintRoomCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'indigo');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = mod(ox + (row % 2) * 4, 8) - 8; x < w; x += 8) px(p, x, y, 'dusk');
  }
}

/** The wall above `rail` on a tall stage: darker paper, high windows onto the towers, a cornice. */
function paintRoomUpperWall(p: Painter, w: number, ox: number, rail: number): void {
  const gap = 96;
  p.rect(0, 0, w, rail, 'violet');
  for (let row = 0, y = 9; y < rail - 2; y += 5, row++) {
    for (let x = mod(ox + (row % 2) * 5, 10) - 10; x < w; x += 10) px(p, x, y, 'mauve');
  }
  const wh = Math.min(40, rail - 18);
  if (wh >= 14) {
    const top = Math.max(8, Math.floor((rail - wh) / 2) + 2);
    const first = Math.floor(-(ox + 64 + 20) / gap);
    for (let k = first; ox + 64 + k * gap - 20 < w; k++) {
      paintWindow(p, ox + 64 + k * gap - 17, top, 34, wh, 40 + mod(k, 6), true, 'paper', 'fog');
    }
  }
  p.rect(0, 0, w, 3, 'paper');
  p.rect(0, 3, w, 1, 'fog');
  p.rect(0, 4, w, 1, 'plum');
  p.rect(0, rail, w, 1, 'paper');
  p.rect(0, rail + 1, w, 1, 'fog');
  p.rect(0, rail + 2, w, 1, 'plum');
}

/** Two long blue drapes on a rod, either side of the window. */
function paintDrapes(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x - 8, y - 5, w + 16, 1, 'ember');
  for (const dx of [x - 7, x + w + 2]) {
    p.rect(dx, y - 4, 5, h + 10, 'denim');
    p.rect(dx + 1, y - 4, 1, h + 10, 'indigo');
    p.rect(dx + 3, y - 4, 1, h + 10, 'indigo');
    p.rect(dx, y - 4, 5, 1, 'sky');
  }
}

/** The air conditioner on the wall, a little cold light on it. */
function paintAirConditioner(p: Painter, x: number, y: number): void {
  p.rect(x, y, 17, 6, 'paper');
  p.rect(x, y + 4, 17, 1, 'fog');
  p.rect(x + 2, y + 5, 13, 1, 'stone');
  px(p, x + 14, y + 2, 'cyan');
  p.rect(x + 1, y + 6, 16, 1, 'violet');
}

/** The bed along the wall, its headboard at x: pillow, turned-down sheet, a teal cover. */
function paintBed(p: Painter, x: number, floorTop: number): void {
  // the base and its legs
  p.rect(x + 3, floorTop - 4, 40, 3, 'ember');
  p.rect(x + 4, floorTop - 1, 2, 3, 'plum');
  p.rect(x + 40, floorTop - 1, 2, 3, 'plum');
  // the mattress and the pillow
  p.rect(x + 4, floorTop - 10, 39, 6, 'fog');
  p.rect(x + 4, floorTop - 11, 39, 1, 'paper');
  p.rect(x + 5, floorTop - 16, 9, 5, 'paper');
  p.rect(x + 5, floorTop - 12, 9, 1, 'fog');
  px(p, x + 5, floorTop - 16, 'mauve');
  px(p, x + 13, floorTop - 16, 'mauve');
  // the cover, quilted, hanging over the side; the sheet turned down over it
  p.rect(x + 17, floorTop - 12, 26, 9, 'teal');
  p.rect(x + 17, floorTop - 12, 26, 1, 'cyan');
  p.rect(x + 17, floorTop - 4, 26, 1, 'moss');
  for (let row = 0; row < 2; row++) {
    for (let dx = 20 + row * 3; dx < 42; dx += 6) px(p, x + dx, floorTop - 9 + row * 3, 'moss');
  }
  p.rect(x + 15, floorTop - 12, 3, 4, 'paper');
  p.rect(x + 15, floorTop - 9, 3, 1, 'fog');
  // the headboard and the footboard
  p.rect(x, floorTop - 24, 4, 24, 'ember');
  p.rect(x, floorTop - 24, 4, 1, 'amber');
  p.rect(x + 3, floorTop - 23, 1, 23, 'plum');
  p.rect(x + 42, floorTop - 14, 2, 14, 'ember');
  p.rect(x + 42, floorTop - 14, 2, 1, 'amber');
}

/** A nightstand, 14 wide: a wooden top, one drawer, short legs. */
function paintNightstand(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top + 2, 13, floorTop - top - 3, 'ember');
  p.rect(x + 1, top + 3, 11, 4, 'plum');
  px(p, x + 6, top + 5, 'lamp');
  p.rect(x + 1, floorTop - 1, 2, 2, 'plum');
  p.rect(x + 10, floorTop - 1, 2, 2, 'plum');
  p.rect(x - 1, top, 15, 1, 'honey');
  p.rect(x - 1, top + 1, 15, 1, 'amber');
}

/** The room phone on the nightstand: the receiver on its cradle, the red message light on. */
function paintPhone(p: Painter, x: number, top: number): void {
  p.rect(x, top - 3, 8, 3, 'ink');
  p.rect(x + 1, top - 4, 6, 1, 'night');
  p.rect(x, top - 6, 8, 2, 'ink');
  p.rect(x + 2, top - 6, 4, 1, 'slate');
  px(p, x, top - 4, 'ink');
  px(p, x + 7, top - 4, 'ink');
  px(p, x + 1, top - 2, 'stone');
  px(p, x + 3, top - 2, 'stone');
  p.rect(x + 5, top - 2, 2, 1, 'red');
  p.rect(x + 4, top - 3, 4, 3, 'neon', 0.35);
  // the cord, curling down the side
  for (let i = 0; i < 5; i++) px(p, x - 1 - (i % 2), top - 2 + i, 'ink');
}

/** The other side of the bed: a second nightstand with its lamp, a mirror on the wall. */
function paintBedside(p: Painter, x: number, oy: number, floorTop: number): void {
  paintMirror(p, x + 9, oy + 10);
  paintTableLamp(p, x + 40, oy + 46);
  paintNightstand(p, x + 33, oy + 46, floorTop);
  p.rect(x + 34, oy + 44, 5, 2, 'denim');
  p.rect(x + 34, oy + 44, 5, 1, 'sky');
}

/** The closet, one door open: a shirt and a jacket on hangers, spare towels, the laundry bag. */
function paintCloset(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 6;
  const hh = floorTop - top;
  p.rect(x + 6, top, 36, hh, 'ember');
  p.rect(x + 6, top, 36, 1, 'amber');
  // the closed door
  p.rect(x + 8, top + 3, 15, hh - 5, 'amber');
  p.rect(x + 9, top + 4, 13, hh - 7, 'ember');
  p.rect(x + 20, top + 22, 1, 4, 'honey');
  // inside the open half
  p.rect(x + 25, top + 3, 15, hh - 5, 'night');
  p.rect(x + 25, top + 6, 15, 1, 'lamp');
  p.rect(x + 27, top + 8, 5, 13, 'paper');
  p.rect(x + 29, top + 8, 1, 13, 'fog');
  px(p, x + 29, top + 7, 'ink');
  p.rect(x + 33, top + 8, 5, 15, 'denim');
  p.rect(x + 35, top + 8, 1, 6, 'paper');
  px(p, x + 35, top + 7, 'ink');
  p.rect(x + 25, floorTop - 14, 15, 1, 'ember');
  p.rect(x + 33, floorTop - 18, 6, 4, 'paper');
  p.rect(x + 33, floorTop - 16, 6, 1, 'sky');
  p.rect(x + 27, floorTop - 11, 7, 9, 'fog');
  p.rect(x + 29, floorTop - 12, 3, 1, 'concrete');
  px(p, x + 30, floorTop - 7, 'stone');
}

/** The bathroom door, ajar: pale tiles and a towel on its rail inside. */
function paintBathroom(p: Painter, x: number, oy: number, floorTop: number): void {
  const top = oy + 10;
  const hh = floorTop - top;
  p.rect(x + 12, top - 2, 24, hh + 2, 'paper');
  p.rect(x + 14, top, 20, hh, 'sky');
  for (let y = top + 3; y < floorTop; y += 4) p.rect(x + 14, y, 20, 1, 'fog');
  for (let dx = 18; dx < 34; dx += 5) p.rect(x + dx, top, 1, hh, 'fog');
  p.rect(x + 17, top + 13, 9, 1, 'stone');
  p.rect(x + 18, top + 14, 7, 9, 'paper');
  p.rect(x + 18, top + 20, 7, 1, 'cyan');
  // the door leaf, seen edge on
  p.rect(x + 28, top, 6, hh, 'fog');
  p.rect(x + 28, top, 1, hh, 'concrete');
  px(p, x + 29, top + 22, 'lamp');
}

/** A suitcase on a folding rack under a mirror. */
function paintLuggage(p: Painter, x: number, oy: number, floorTop: number): void {
  paintMirror(p, x + 16, oy + 9);
  p.rect(x + 12, floorTop - 8, 2, 9, 'ember');
  p.rect(x + 34, floorTop - 8, 2, 9, 'ember');
  p.rect(x + 10, floorTop - 9, 28, 1, 'amber');
  p.rect(x + 12, floorTop - 20, 24, 11, 'teal');
  p.rect(x + 12, floorTop - 20, 24, 1, 'cyan');
  p.rect(x + 17, floorTop - 20, 2, 11, 'moss');
  p.rect(x + 29, floorTop - 20, 2, 11, 'moss');
  p.rect(x + 21, floorTop - 22, 6, 2, 'ink');
  p.rect(x + 22, floorTop - 21, 4, 1, 'teal');
  p.rect(x + 33, floorTop - 17, 2, 3, 'paper');
}

/** The door of the room: the fire plan on it, a "do not disturb" tag on the handle. */
function paintRoomDoor(p: Painter, x: number, oy: number, floorTop: number): void {
  const dx = x + 12;
  const top = oy + 9;
  const hh = floorTop - top;
  p.rect(dx - 2, top - 2, 24, hh + 2, 'paper');
  p.rect(dx, top, 20, hh, 'ember');
  p.rect(dx + 18, top, 2, hh, 'plum');
  p.rect(dx + 3, top + 3, 13, 17, 'amber');
  p.rect(dx + 4, top + 4, 11, 15, 'ember');
  p.rect(dx + 3, top + 23, 13, hh - 26, 'amber');
  p.rect(dx + 4, top + 24, 11, hh - 28, 'ember');
  px(p, dx + 9, top + 2, 'ink');
  // the fire plan
  p.rect(dx + 6, top + 6, 7, 9, 'paper');
  p.rect(dx + 7, top + 8, 5, 1, 'stone');
  p.rect(dx + 7, top + 10, 3, 1, 'stone');
  px(p, dx + 10, top + 12, 'red');
  // the handle and the tag
  p.rect(dx + 1, top + 21, 3, 1, 'honey');
  p.rect(dx + 1, top + 22, 3, 6, 'red');
  px(p, dx + 2, top + 23, 'paper');
}

// ---------------------------------------------------------------------------
// The call panel: Ms. Carter's office at Harbor Trading

/** The panel with its rounded, inked border, the office inside and a phone badge on top. */
function paintPanel(p: Painter, x: number, y: number): void {
  const { w, h } = PANEL;
  // a soft shadow on the room behind it
  p.rect(x + 2, y + 2, w, h, 'ink', 0.35);
  // the border: ink outside, paper inside, the corners rounded
  p.rect(x + 2, y, w - 4, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ink');
  p.rect(x, y + 2, w, h - 4, 'ink');
  p.rect(x + 2, y + 1, w - 4, h - 2, 'paper');
  p.rect(x + 1, y + 2, w - 2, h - 4, 'paper');
  const ix = x + 2;
  const iy = y + 2;
  const iw = w - 4;
  const ih = h - 4;
  p.rect(ix + 1, iy, iw - 2, ih, 'ink');
  p.rect(ix, iy + 1, iw, ih - 2, 'ink');
  paintOffice(within(p, ix + 1, iy + 1, iw - 2, ih - 2), ix + 1, iy + 1, iw - 2, ih - 2);
  paintBadge(p, x + 30, y - 2);
}

/** Inside the panel: the office wall, the harbour window, her desk with its phone and a glass lamp. */
function paintOffice(p: Painter, x: number, y: number, w: number, h: number): void {
  const bottom = y + h;
  const carpet = bottom - 6;
  const lower = carpet - 9;
  p.rect(x, y, w, lower - y, 'fog');
  glowEllipse(p, x + 12, y + 33, 20, 14, 'honey', [0.26, 0.14]);
  // the harbour window
  const wx = x + 2;
  const wy = y + 2;
  const ww = w - 4;
  const wh = 24;
  p.rect(wx, wy, ww, wh, 'paper');
  paintHarbour(within(p, wx + 2, wy + 2, ww - 4, wh - 4), wx + 2, wy + 2, ww - 4, wh - 4);
  p.rect(wx + Math.floor(ww / 2), wy + 2, 1, wh - 4, 'paper');
  p.rect(wx - 1, wy + wh, ww + 2, 1, 'paper');
  p.rect(wx - 1, wy + wh + 1, ww + 2, 1, 'concrete');
  // the plum lower wall under a pale rail, then the grey carpet
  p.rect(x, lower, w, carpet - lower, 'plum');
  p.rect(x, lower, w, 1, 'paper');
  p.rect(x, lower + 1, w, 1, 'concrete');
  for (let lx = x + 5; lx < x + w; lx += 12) p.rect(lx, lower + 3, 1, carpet - lower - 5, 'maroon');
  p.rect(x, carpet - 2, w, 2, 'night');
  p.rect(x, carpet, w, bottom - carpet, 'slate');
  p.rect(x, carpet, w, 1, 'ink');
  for (let row = 0; carpet + 2 + row * 3 < bottom; row++) {
    for (let cx = x + (row % 2) * 4; cx < x + w; cx += 8) px(p, cx, carpet + 2 + row * 3, 'stone');
  }
  // her desk, before her this time
  const dx = x + 1;
  const dtop = carpet - 12;
  p.rect(dx + 1, dtop + 4, 7, carpet + 3 - dtop - 4, 'ember');
  p.rect(dx + 2, dtop + 6, 5, 1, 'amber');
  p.rect(dx + 2, dtop + 10, 5, 1, 'amber');
  p.rect(dx + 18, dtop + 4, 2, carpet + 3 - dtop - 4, 'ember');
  p.rect(dx, dtop, 22, 1, 'honey');
  p.rect(dx, dtop + 1, 22, 2, 'amber');
  p.rect(dx, dtop + 3, 21, 1, 'ember');
  // one of the company's glass desk lamps, lit
  p.rect(dx + 2, dtop - 1, 4, 1, 'amber');
  p.rect(dx + 3, dtop - 6, 1, 5, 'lamp');
  p.rect(dx + 1, dtop - 9, 6, 3, 'cyan');
  p.rect(dx + 2, dtop - 10, 4, 1, 'cyan');
  p.rect(dx + 1, dtop - 6, 6, 1, 'honey');
  px(p, dx + 2, dtop - 9, 'paper');
  // papers, and the phone's base with its cradle empty: she has the receiver
  p.rect(dx + 8, dtop - 2, 5, 2, 'paper');
  p.rect(dx + 8, dtop - 1, 5, 1, 'fog');
  p.rect(dx + 14, dtop - 3, 7, 3, 'ink');
  p.rect(dx + 15, dtop - 4, 5, 1, 'night');
  px(p, dx + 16, dtop - 2, 'red');
  px(p, dx + 18, dtop - 2, 'stone');
  for (let i = 0; i < 5; i++) px(p, dx + 21 + (i % 2), dtop - 2 + i, 'ink');
}

/** The harbour at dusk: a rosy sky, the far shore and its lights, a crane, a moored ship. */
function paintHarbour(p: Painter, x: number, y: number, w: number, h: number): void {
  const horizon = y + h - 7;
  ditherGradient(p, x, y, w, horizon - y, ['deep', 'indigo', 'violet', 'mauve', 'rosy']);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  px(p, x + 4, y + 2, 'fog');
  px(p, x + 22, y + 1, 'paper');
  px(p, x + 31, y + 3, 'fog');
  for (let i = 0; i < w; i++) {
    const bump = 2 + Math.round(Math.sin(i / 5) + Math.sin(i / 2.3) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(i, 3, 151) < 0.15) px(p, x + i, horizon, hash2(i, 4, 157) < 0.5 ? 'honey' : 'lamp');
    if (i % 5 === 2) px(p, x + i, horizon + 2 + (i % 3), i % 2 === 0 ? 'rosy' : 'violet');
  }
  // the quay with its containers and a crane
  const boxes: readonly PaletteName[] = ['maroon', 'teal', 'ember', 'denim'];
  const qx = x + 1;
  p.rect(qx, horizon - 1, 14, 2, 'ink');
  for (let i = 0; i < 3; i++) p.rect(qx + 1 + i * 4, horizon - 3, 3, 2, boxes[i] ?? 'teal');
  const cr = qx + 4;
  const boom = horizon - 9;
  p.rect(cr, boom, 1, 8, 'ink');
  p.rect(cr + 4, boom, 1, 8, 'ink');
  p.rect(cr - 3, boom, 16, 1, 'ink');
  p.rect(cr + 2, boom - 3, 1, 3, 'ink');
  px(p, cr + 2, boom - 4, 'red');
  p.rect(cr + 10, boom + 1, 1, 3, 'night');
  // a ship, its bridge at the stern
  const sx = x + w - 19;
  const wl = horizon + 4;
  p.rect(sx, wl - 3, 17, 3, 'ink');
  p.rect(sx, wl - 4, 18, 1, 'night');
  for (let i = 0; i < 3; i++) p.rect(sx + 6 + i * 4, wl - 6, 3, 2, boxes[(i + 1) % 4] ?? 'teal');
  p.rect(sx + 1, wl - 8, 4, 4, 'night');
  px(p, sx + 2, wl - 7, 'honey');
  p.rect(sx + 3, wl - 10, 1, 2, 'ink');
  px(p, sx + 11, wl + 1, 'lamp');
}

/**
 * The badge on the panel's top edge: a rounded paper tag in an ink rim, a
 * handset and the two joined loops of a recorded message. O rim, w paper,
 * k handset, r loops.
 */
const BADGE: readonly string[] = [
  '.OOOOOOOOOOOOOO.',
  'OwwwwwwwwwwwwwwO',
  'OwwkkwwwwwwwwwwO',
  'OwkkkkwwwwwwwwwO',
  'OwkkkwwwrrwwrrwO',
  'OwwkkwwrwwrrwwrO',
  'OwwkkwwrwwrrwwrO',
  'OwwwkkwwrrrrrrwO',
  'OwwwwkkwwwwkwwwO',
  'OwwwwwkkkkkkwwwO',
  'OwwwwwwkkkkwwwwO',
  'OwwwwwwwwwwwwwwO',
  '.OOOOOOOOOOOOOO.',
];
const BADGE_COLOURS: Readonly<Record<string, PaletteName>> = {
  O: 'ink',
  w: 'paper',
  k: 'ink',
  r: 'red',
};

function paintBadge(p: Painter, x: number, y: number): void {
  BADGE.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = BADGE_COLOURS[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
  p.rect(x + 1, y + BADGE.length, 15, 1, 'ink', 0.35);
}

export const HOTEL_STAGE: StageConfig = {
  paint: paintLobby,
  backdrops: { manager: paintVoicemail },
  cast: {
    guide: GUIDE_ACTOR,
    hotel_clerk: {
      sprite: HOTEL_CLERK_SPRITE,
      ...BEHIND_DESK,
      side: 'right',
      clipBottom: DESK.top,
    },
    // Alone he stands before the desk, on the carpet. With the clerk (or Ms.
    // Carter's panel) there too he stands next to you, at the desk's near end.
    coworker: {
      sprite: COWORKER_SPRITE,
      ...BEFORE_DESK,
      side: 'right',
      beside: NEXT_TO_YOU,
    },
    // Only heard: her voicemail plays in your room, and she shows in its call panel.
    manager: { sprite: MANAGER_SPRITE, ...IN_PANEL, side: 'right' },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: {
    // Past the bell, and short of the clerk, so a prop stays clear of her face and her hands.
    left: { x: DESK.x + 6, y: PROP_TOP },
    right: { x: DESK.x + 18, y: PROP_TOP },
  },
};
