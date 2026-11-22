import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The clinic stage: a small neighbourhood clinic with its pharmacy corner, in
 * the evening. From the left: a potted plant under the doctor's licence, the
 * eye chart (you stand in front of it), a window with its blinds half down
 * over the consulting desk where handed-over things rest, the wall clock, then
 * the medicine cabinet with a green cross on top. The doctor, the receptionist
 * and the pharmacist all stand on the floor between the desk and the cabinet.
 * Painted through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (an air conditioner, more certificates,
 * the queue number, then health posters and tall windows), the waiting room
 * to the left and the examination bed and more cabinets to the right.
 */

/** The consulting desk: left edge, width and the y of its top (props rest on it), in core pixels. */
const DESK = { x: 36, w: 38, top: 48 } as const;
/** 24x24 pictures stand on the desk with their shadow on it. */
const PROP_TOP = DESK.top - 20;
/** Where an NPC stands when alone: at the end of the desk. */
const BY_DESK = { x: 71, y: 39 } as const;

const FLOOR_TOP = 54;
/** The y of the rail between the pale upper wall and the painted lower wall. */
const RAIL = 35;
/** The two dome lamps of the core. */
const LAMPS = [37, 81] as const;
/** Width of one bay beside the core; lamps, posters and tall windows repeat at this step. */
const BAY_W = 44;
/** Wall above the core needed before the upper wall gets its own rail. */
const CORNICE_MIN = 34;
/** How far above the core that rail sits. */
const CORNICE_UP = 18;
/** The medicine cabinet: left edge, width and top in core pixels. */
const CABINET = { x: 92, w: 34, top: 12 } as const;

/** Paints the clinic to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;

  // Bays beside the core: the waiting room to the left, treatment rooms to the right.
  const waiting: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) waiting.push(x);
  const rooms: number[] = [];
  for (let x = ox + CORE_W; x < w; x += BAY_W) rooms.push(x);
  const lamps = [
    ...LAMPS.map((x) => ox + x),
    ...waiting.map((x) => x + 37),
    ...rooms.map((x) => x + 41),
  ];

  paintWall(p, w, oy, floorTop);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 17, 18, 14, [['paper', 0.3]], { y0: cornice + 2, y1: oy + RAIL });
  }
  if (cornice > 0) paintUpperWall(p, w, ox, cornice);

  // Just above the core, when there is room.
  if (oy >= 16) {
    paintCertificate(p, ox + 13, oy - 13);
    paintCertificate(p, ox + 25, oy - 13);
    paintQueueNumber(p, ox + 98, oy - 13);
  }
  if (oy >= 18) paintAirCon(p, ox + 42, oy - 14);

  // On the core's wall.
  paintCertificate(p, ox + 2, oy + 13);
  paintEyeChart(p, ox + 17, oy + 9);
  paintWindow(p, ox + 43, oy + 8, 28, 24, 0);
  paintClock(p, ox + 81, oy + 25);

  paintFloor(p, w, ox, floorTop, h);

  waiting.forEach((x, i) => paintWaitingBay(p, x, oy, floorTop, i));
  rooms.forEach((x, i) => {
    if (i % 2 === 0) paintBedBay(p, x, oy, floorTop);
    else paintCabinet(p, x + 5, oy + CABINET.top, floorTop, i);
  });

  paintPlant(p, ox + 2, floorTop - 18);
  paintCabinet(p, ox + CABINET.x, oy + CABINET.top, floorTop, 0);
  paintCabinetTop(p, ox + CABINET.x, oy + CABINET.top);
  for (const lx of lamps) paintDomeLamp(p, lx, oy);

  paintDesk(p, ox + DESK.x, oy + DESK.top, floorTop);
}

/** The wall: pale and clean above a white rail, painted a soft blue below it. */
function paintWall(p: Painter, w: number, oy: number, floorTop: number): void {
  const rail = oy + RAIL;
  p.rect(0, 0, w, floorTop, 'fog');
  ditherRect(p, 0, 0, w, 3, 'concrete', 8);
  p.rect(0, rail, w, 1, 'paper');
  p.rect(0, rail + 1, w, floorTop - rail - 1, 'sky');
  p.rect(0, rail + 1, w, 1, 'denim');
  p.rect(0, floorTop - 2, w, 2, 'stone');
}

/** Terrazzo: grey with small chips of stone, split into big squares by thin strips. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  for (let y = floorTop + 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = hash2(x - ox, y - floorTop, 31);
      if (r < 0.045) px(p, x, y, 'fog');
      else if (r < 0.075) px(p, x, y, 'stone');
      else if (r < 0.081) px(p, x, y, 'rosy');
    }
  }
  p.rect(0, floorTop, w, 1, 'slate');
  const start = (((ox + 20) % 36) + 36) % 36;
  for (let x = start - 36; x < w; x += 36) p.rect(x, floorTop + 1, 1, h - floorTop - 1, 'stone');
  if (floorTop + 11 < h) p.rect(0, floorTop + 11, w, 1, 'stone');
}

/**
 * A window in a white frame, its blind drawn a third of the way down: the dusk
 * sky, a few stars and the roofs across the street.
 */
function paintWindow(p: Painter, x: number, top: number, ww: number, wh: number, n: number): void {
  p.rect(x, top, ww, wh, 'paper');
  p.rect(x, top + wh - 1, ww, 1, 'fog');
  ditherGradient(p, x + 1, top + 1, ww - 2, wh - 2, ['deep', 'indigo', 'dusk', 'violet', 'mauve']);
  const blind = Math.floor(wh / 6) * 2;
  // stars
  const stars = Math.max(3, Math.floor(wh / 6));
  for (let i = 0; i < stars; i++) {
    const sx = x + 2 + Math.floor(hash2(i, 5 + n, 131) * (ww - 4));
    const sy = top + blind + 2 + Math.floor(hash2(i, 9 + n, 131) * Math.max(1, wh - blind - 12));
    px(p, sx, sy, hash2(i, 2 + n, 131) > 0.6 ? 'honey' : 'fog');
  }
  // roofs at the bottom of the view, a few windows lit
  for (let bx = x + 1, i = 0; bx < x + ww - 1; bx += 7, i++) {
    const bw = Math.min(7, x + ww - 1 - bx);
    const bh = 3 + Math.floor(hash2(i, 3 + n, 137) * 5);
    p.rect(bx, top + wh - 1 - bh, bw, bh, 'night');
    if (hash2(i, 4 + n, 137) > 0.3) px(p, bx + 1 + (i % 3), top + wh - bh + 1, 'honey');
  }
  // the blind, its bottom bar and its cord
  for (let sy = top + 1; sy < top + 1 + blind; sy += 2) {
    p.rect(x + 1, sy, ww - 2, 1, 'paper');
    p.rect(x + 1, sy + 1, ww - 2, 1, 'fog');
  }
  p.rect(x + 1, top + 1 + blind, ww - 2, 1, 'concrete');
  p.rect(x + ww - 4, top + 2 + blind, 1, Math.floor(wh / 4), 'fog');
  // glazing bar and sill
  const mid = x + Math.floor(ww / 2);
  p.rect(mid, top + 2 + blind, 1, wh - blind - 3, 'paper');
  p.rect(x - 1, top + wh, ww + 2, 1, 'paper');
  p.rect(x - 1, top + wh + 1, ww + 2, 1, 'concrete');
}

/** The eye chart: tumbling letters, smaller on every line. */
function paintEyeChart(p: Painter, x: number, y: number): void {
  const w = 13;
  const h = 23;
  p.rect(x + 1, y + 1, w, h, 'concrete'); // its shadow on the wall
  p.rect(x, y, w, h, 'paper');
  p.rect(x, y, w, 1, 'stone');
  p.rect(x, y + h - 1, w, 1, 'stone');
  // one big E
  p.rect(x + 4, y + 3, 1, 5, 'ink');
  p.rect(x + 4, y + 3, 5, 1, 'ink');
  p.rect(x + 4, y + 5, 4, 1, 'ink');
  p.rect(x + 4, y + 7, 5, 1, 'ink');
  // two, turned
  p.rect(x + 2, y + 10, 3, 3, 'ink');
  p.rect(x + 3, y + 11, 2, 1, 'paper');
  p.rect(x + 8, y + 10, 3, 3, 'ink');
  p.rect(x + 9, y + 11, 1, 2, 'paper');
  // three, then lines too small to read
  for (let i = 0; i < 3; i++) {
    p.rect(x + 2 + i * 4, y + 15, 2, 2, 'stone');
    px(p, x + 3 + i * 4, y + 15 + (i % 2), 'paper');
  }
  for (let dx = 2; dx < w - 2; dx += 2) px(p, x + dx, y + 19, 'concrete');
  p.rect(x + 2, y + 21, w - 4, 1, 'red');
}

/** A framed certificate with a red seal. */
function paintCertificate(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 9, 10, 1, 'concrete');
  p.rect(x, y, 11, 9, 'amber');
  p.rect(x + 1, y + 1, 9, 7, 'paper');
  p.rect(x + 3, y + 2, 5, 1, 'stone');
  p.rect(x + 2, y + 4, 7, 1, 'fog');
  p.rect(x + 2, y + 6, 4, 1, 'fog');
  px(p, x + 8, y + 6, 'red');
}

/** A pendant lamp with a white glass dome, on a rod from the ceiling (y 0). */
function paintDomeLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 4, 'stone');
  p.rect(cx - 1, oy + 4, 3, 1, 'stone');
  p.rect(cx - 3, oy + 5, 7, 1, 'paper');
  p.rect(cx - 4, oy + 6, 9, 2, 'paper');
  p.rect(cx - 4, oy + 8, 9, 1, 'honey');
  p.rect(cx - 2, oy + 9, 5, 1, 'lamp');
  px(p, cx - 3, oy + 6, 'honey');
}

/**
 * The medicine cabinet: glass doors over shelves of bottles and boxes, a
 * ledge, then closed teal doors down to the floor.
 */
function paintCabinet(p: Painter, x: number, top: number, floorTop: number, seed: number): void {
  const { w } = CABINET;
  const glassTop = top + 4;
  const ledge = top + 26;
  const bottom = floorTop + 2;
  p.rect(x, top, w, ledge - top, 'paper');
  p.rect(x, top + 1, w, 2, 'leaf');
  p.rect(x + w - 1, top + 3, 1, ledge - top - 3, 'fog');
  [1, 18].forEach((dx, door) => {
    p.rect(x + dx, glassTop, 15, 22, 'slate');
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = glassTop + 7 + shelf * 7;
      paintMedicines(p, x + dx + 1, sy, 13, seed * 7 + door * 3 + shelf);
      p.rect(x + dx, sy, 15, 1, shelf === 2 ? 'fog' : 'concrete');
    }
    // a glint on the glass
    px(p, x + dx + 1, glassTop, 'sky');
    px(p, x + dx, glassTop + 1, 'sky');
  });
  p.rect(x + 16, glassTop + 9, 1, 5, 'fog'); // the handles, on the stile between the doors
  // the ledge and the closed doors under it
  p.rect(x - 1, ledge, w + 2, 1, 'paper');
  p.rect(x - 1, ledge + 1, w + 2, 1, 'fog');
  p.rect(x, ledge + 2, w, bottom - ledge - 2, 'teal');
  p.rect(x, ledge + 2, w, 1, 'moss');
  p.rect(x + 16, ledge + 3, 2, bottom - ledge - 4, 'moss');
  p.rect(x + w - 1, ledge + 3, 1, bottom - ledge - 4, 'moss');
  px(p, x + 14, ledge + 8, 'paper');
  px(p, x + 19, ledge + 8, 'paper');
  p.rect(x, bottom - 1, w, 1, 'moss');
  p.rect(x, bottom, w, 1, 'stone'); // its shadow on the floor
}

/** A row of bottles, jars and boxes standing on a shelf line at `base`, `w` wide from x. */
function paintMedicines(p: Painter, x: number, base: number, w: number, seed: number): void {
  for (let bx = x, i = 0; bx + 2 <= x + w; i++) {
    const kind = Math.floor(hash2(i, seed, 151) * 6);
    if (kind === 0) {
      // brown glass bottle with a label
      p.rect(bx, base - 4, 2, 4, 'amber');
      px(p, bx, base - 5, 'paper');
      px(p, bx, base - 2, 'paper');
      bx += 3;
    } else if (kind === 1) {
      // pill bottle with a red cap
      p.rect(bx, base - 3, 2, 3, 'paper');
      p.rect(bx, base - 4, 2, 1, 'red');
      bx += 3;
    } else if (kind === 2 && bx + 3 <= x + w) {
      // a box with a green cross
      p.rect(bx, base - 4, 3, 4, 'paper');
      px(p, bx + 1, base - 3, 'leaf');
      p.rect(bx, base - 2, 3, 1, 'leaf');
      bx += 4;
    } else if (kind === 3) {
      // syrup
      p.rect(bx, base - 4, 2, 4, 'maroon');
      px(p, bx, base - 5, 'fog');
      px(p, bx, base - 3, 'rosy');
      bx += 3;
    } else if (kind === 4 && bx + 3 <= x + w) {
      p.rect(bx, base - 3, 3, 3, 'teal');
      p.rect(bx, base - 2, 3, 1, 'cyan');
      bx += 4;
    } else {
      // a tall blue bottle
      p.rect(bx, base - 5, 2, 5, 'sky');
      px(p, bx, base - 6, 'paper');
      bx += 3;
    }
  }
}

/** On top of the core's cabinet: the lit green cross, a carton and a first-aid case. */
function paintCabinetTop(p: Painter, x: number, top: number): void {
  // carton
  p.rect(x + 1, top - 6, 9, 6, 'tan');
  p.rect(x + 1, top - 6, 9, 1, 'skin');
  p.rect(x + 5, top - 6, 1, 3, 'ember');
  // the green cross
  p.rect(x + 11, top - 11, 13, 11, 'moss');
  p.rect(x + 12, top - 10, 11, 9, 'paper');
  p.rect(x + 16, top - 9, 3, 7, 'leaf');
  p.rect(x + 14, top - 7, 7, 3, 'leaf');
  // first-aid case
  p.rect(x + 25, top - 5, 8, 5, 'red');
  p.rect(x + 25, top - 5, 8, 1, 'rosy');
  p.rect(x + 28, top - 6, 2, 1, 'maroon');
  p.rect(x + 28, top - 4, 2, 3, 'paper');
  p.rect(x + 27, top - 3, 4, 1, 'paper');
}

/** The consulting desk: a clear wooden top, drawers on the left, a door on the right. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const { w } = DESK;
  const base = floorTop + 6;
  p.rect(x + 2, base, w - 4, 1, 'stone'); // its shadow on the floor
  // the dark knee space, then the two pedestals
  p.rect(x + 13, top + 3, w - 26, base - top - 6, 'plum');
  p.rect(x + 13, top + 3, w - 26, 1, 'night');
  for (const dx of [1, w - 13]) {
    p.rect(x + dx, top + 3, 12, base - top - 3, 'amber');
    p.rect(x + dx, top + 3, 1, base - top - 3, 'ember');
    p.rect(x + dx + 11, top + 3, 1, base - top - 3, 'ember');
    p.rect(x + dx, base - 1, 12, 1, 'ember');
  }
  // drawers
  p.rect(x + 2, top + 6, 10, 1, 'ember');
  p.rect(x + 2, top + 9, 10, 1, 'ember');
  p.rect(x + 6, top + 4, 2, 1, 'honey');
  p.rect(x + 6, top + 7, 2, 1, 'honey');
  px(p, x + w - 4, top + 7, 'honey');
  // the top
  p.rect(x - 1, top, w + 2, 1, 'skin');
  p.rect(x - 1, top + 1, w + 2, 1, 'tan');
  p.rect(x, top + 2, w, 1, 'ember');
}

// ---------------------------------------------------------------------------
// Above the core

/** A wall air conditioner, its little light on. */
function paintAirCon(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 9, 29, 1, 'concrete');
  p.rect(x, y, 30, 9, 'paper');
  p.rect(x, y + 8, 30, 1, 'fog');
  p.rect(x + 2, y + 3, 20, 1, 'fog');
  p.rect(x + 2, y + 6, 26, 1, 'stone');
  px(p, x + 26, y + 3, 'cyan');
}

/** The queue number over the pharmacy: red digits on a dark box. */
function paintQueueNumber(p: Painter, x: number, y: number): void {
  p.rect(x, y, 23, 10, 'ink');
  p.rect(x + 1, y + 1, 21, 8, 'night');
  // "0"
  p.rect(x + 6, y + 2, 3, 6, 'red');
  p.rect(x + 7, y + 3, 1, 4, 'night');
  // "7"
  p.rect(x + 11, y + 2, 3, 1, 'red');
  p.rect(x + 13, y + 3, 1, 5, 'red');
  px(p, x + 18, y + 6, 'leaf');
  p.rect(x + 1, y + 10, 22, 1, 'concrete');
}

/**
 * The wall above the rail at `cornice`: health posters, and tall windows above
 * them when there is room, one of each wherever a whole one fits between the
 * lamp rods.
 */
function paintUpperWall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, cornice, w, 1, 'paper');
  p.rect(0, cornice + 1, w, 1, 'concrete');
  const posters = cornice >= 26;
  const windowTop = Math.max(14, cornice - 116);
  const windowBottom = cornice - 32;
  const windows = windowBottom - windowTop >= 36;
  const first = Math.floor((-ox - 15) / BAY_W);
  for (let n = first; ox + 15 + n * BAY_W - 15 < w; n++) {
    const cx = ox + 15 + n * BAY_W;
    if (posters && cx - 8 >= 0 && cx + 9 <= w) paintPoster(p, cx - 8, cornice - 23, n);
    if (windows && cx - 15 >= 0 && cx + 16 <= w) {
      paintWindow(p, cx - 14, windowTop, 29, windowBottom - windowTop, n + 1);
    }
  }
}

/** A health poster, 16x20: a heart, a tooth, a drop of water or an apple. */
function paintPoster(p: Painter, x: number, y: number, n: number): void {
  const kind = ((n % 4) + 4) % 4;
  const band: PaletteName = (['red', 'denim', 'teal', 'leaf'] as const)[kind] ?? 'red';
  p.rect(x + 1, y + 1, 16, 20, 'concrete');
  p.rect(x, y, 16, 20, 'paper');
  p.rect(x, y, 16, 3, band);
  p.rect(x + 3, y + 16, 10, 1, 'fog');
  p.rect(x + 5, y + 18, 6, 1, 'fog');
  if (kind === 0) {
    p.rect(x + 4, y + 6, 3, 1, 'red');
    p.rect(x + 9, y + 6, 3, 1, 'red');
    p.rect(x + 3, y + 7, 10, 3, 'red');
    p.rect(x + 4, y + 10, 8, 1, 'red');
    p.rect(x + 5, y + 11, 6, 1, 'red');
    p.rect(x + 6, y + 12, 4, 1, 'red');
    p.rect(x + 7, y + 13, 2, 1, 'red');
    px(p, x + 5, y + 7, 'rosy');
  } else if (kind === 1) {
    p.rect(x + 3, y + 5, 10, 10, 'sky');
    p.rect(x + 5, y + 6, 6, 4, 'paper');
    p.rect(x + 4, y + 7, 8, 2, 'paper');
    p.rect(x + 5, y + 10, 2, 4, 'paper');
    p.rect(x + 9, y + 10, 2, 4, 'paper');
    px(p, x + 6, y + 7, 'fog');
  } else if (kind === 2) {
    px(p, x + 8, y + 5, 'teal');
    p.rect(x + 7, y + 6, 3, 2, 'teal');
    p.rect(x + 6, y + 8, 5, 4, 'teal');
    p.rect(x + 7, y + 12, 3, 1, 'teal');
    p.rect(x + 7, y + 9, 1, 2, 'cyan');
  } else {
    p.rect(x + 5, y + 7, 6, 7, 'red');
    p.rect(x + 4, y + 8, 8, 5, 'red');
    px(p, x + 8, y + 6, 'ember');
    p.rect(x + 9, y + 5, 2, 1, 'leaf');
    px(p, x + 5, y + 8, 'rosy');
  }
}

// ---------------------------------------------------------------------------
// Beside the core

/** Colours of the waiting-room seats: seat and its lit edge. */
const SEATS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['teal', 'cyan'],
  ['teal', 'cyan'],
  ['rosy', 'paper'],
];

/**
 * One bay of the waiting room, BAY_W wide from x: a window, a row of three
 * seats under it, and a water cooler or a plant by the next lamp.
 */
function paintWaitingBay(p: Painter, x: number, oy: number, floorTop: number, i: number): void {
  paintWindow(p, x + 3, oy + 8, 28, 24, 7 + i);
  for (let s = 0; s < 3; s++) {
    const [seat, edge] = SEATS[(s + i) % SEATS.length] ?? ['teal', 'cyan'];
    const sx = x + 1 + s * 11;
    p.rect(sx, floorTop - 12, 9, 6, seat);
    p.rect(sx, floorTop - 12, 9, 1, edge);
    p.rect(sx + 4, floorTop - 6, 1, 3, 'stone');
    p.rect(sx, floorTop - 3, 9, 2, seat);
    p.rect(sx, floorTop - 3, 9, 1, edge);
  }
  p.rect(x + 1, floorTop - 1, 31, 1, 'stone');
  p.rect(x + 3, floorTop, 1, 4, 'slate');
  p.rect(x + 29, floorTop, 1, 4, 'slate');
  p.rect(x + 2, floorTop + 4, 3, 1, 'slate');
  p.rect(x + 28, floorTop + 4, 3, 1, 'slate');
  if (i % 2 === 0) paintWaterCooler(p, x + 34, floorTop);
  else paintPlant(p, x + 33, floorTop - 18);
}

/** A water cooler: a blue bottle upside down on a white stand. */
function paintWaterCooler(p: Painter, x: number, floorTop: number): void {
  const base = floorTop + 2;
  p.rect(x + 1, base - 22, 6, 7, 'sky');
  p.rect(x + 2, base - 23, 4, 1, 'sky');
  p.rect(x + 1, base - 22, 1, 6, 'fog');
  p.rect(x + 1, base - 18, 6, 1, 'denim');
  p.rect(x, base - 15, 8, 15, 'paper');
  p.rect(x + 6, base - 15, 2, 15, 'fog');
  p.rect(x + 1, base - 12, 5, 4, 'concrete');
  px(p, x + 2, base - 12, 'red');
  px(p, x + 4, base - 12, 'denim');
  p.rect(x, base, 8, 1, 'stone');
}

/**
 * A treatment bay, BAY_W wide from x: a blue curtain pushed back on its rail,
 * the examination bed, a wall box with a red cross and a round stool.
 */
function paintBedBay(p: Painter, x: number, oy: number, floorTop: number): void {
  // the wall box
  p.rect(x + 21, oy + 14, 11, 9, 'paper');
  p.rect(x + 21, oy + 22, 11, 1, 'fog');
  p.rect(x + 25, oy + 16, 3, 5, 'red');
  p.rect(x + 24, oy + 17, 5, 3, 'red');
  p.rect(x + 22, oy + 23, 10, 1, 'concrete');
  // the curtain on its rail
  p.rect(x + 2, oy + 8, 40, 1, 'stone');
  const curtainBottom = floorTop - 3;
  for (let cx = x + 3; cx < x + 12; cx += 3) {
    px(p, cx + 1, oy + 9, 'stone');
    p.rect(cx, oy + 10, 3, curtainBottom - oy - 10, 'denim');
    p.rect(cx, oy + 10, 1, curtainBottom - oy - 10, 'sky');
  }
  // the bed: a pillow, a white sheet on a padded top, thin metal legs
  const top = floorTop - 9;
  p.rect(x + 16, floorTop + 3, 24, 1, 'stone');
  p.rect(x + 15, top + 5, 1, floorTop + 3 - top - 5, 'slate');
  p.rect(x + 40, top + 5, 1, floorTop + 3 - top - 5, 'slate');
  p.rect(x + 15, floorTop, 26, 1, 'slate');
  p.rect(x + 14, top, 28, 3, 'paper');
  p.rect(x + 14, top + 2, 28, 1, 'fog');
  p.rect(x + 14, top + 3, 28, 2, 'teal');
  p.rect(x + 14, top + 4, 28, 1, 'moss');
  p.rect(x + 35, top - 2, 6, 2, 'paper');
  p.rect(x + 35, top - 1, 6, 1, 'fog');
  // the stool
  p.rect(x + 4, floorTop - 2, 7, 2, 'teal');
  p.rect(x + 4, floorTop - 2, 7, 1, 'cyan');
  p.rect(x + 7, floorTop, 1, 4, 'slate');
  p.rect(x + 5, floorTop + 4, 5, 1, 'slate');
}

// ---------------------------------------------------------------------------
// The doctor: 16x24, facing left. A calm man in his forties: short dark hair
// going grey at the temple, a long white coat over a teal shirt, a stethoscope
// round his neck, dark trousers. He stands on the floor at the end of the desk.

const DOCTOR_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhhhh.....',
    '.....hHhhhhhh...',
    '....hhhhhhhhh...',
    '....ssshhhhhh...',
    '...ssessgghhh...',
    '....ssssssh.....',
    '....ssssss......',
    '......sss.......',
    '.....wttww......',
    '....wwktkwwwo...',
    '....wwkwkwwwo...',
    '....wwwkwwawo...',
    '....wwwkwwawo...',
    '....wwmmwwawo...',
    '....wwwwwwswo...',
    '....wwwwwwwwo...',
    '....wbbwwwwwo...',
    '....wwwwwwwwo...',
    '.....wwwwwwo....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'slate',
    H: 'concrete',
    g: 'fog',
    s: 'skin',
    e: 'ink',
    w: 'paper',
    o: 'fog',
    a: 'fog',
    b: 'fog',
    t: 'teal',
    k: 'ink',
    m: 'stone',
    p: 'slate',
    q: 'night',
  },
};

// ---------------------------------------------------------------------------
// The receptionist: 16x24, facing left. A friendly woman with brown hair in a
// low bun and red glasses, a rose cardigan open over a white blouse, a teal
// lanyard with her card, a plum skirt and dark tights.

const RECEPTIONIST_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhHhhhhhh...',
    '....hhhhhhhhh...',
    '....sshhhhhhh...',
    '...sseGGhhhhh...',
    '....sssshhhhhh..',
    '....rssshh.hhh..',
    '......sss...h...',
    '.....cwwcc......',
    '....ccwlcccc....',
    '....ccwlccccc...',
    '....ccwlccacc...',
    '....ccwnccacc...',
    '....ccwnccacc...',
    '....ccwcccscc...',
    '.....cccccc.....',
    '.....dddddd.....',
    '....ddddddd.....',
    '....ddddddd.....',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '.....kkkkk......',
  ],
  legend: {
    h: 'ember',
    H: 'amber',
    s: 'skin',
    e: 'ink',
    G: 'maroon',
    r: 'rosy',
    w: 'paper',
    c: 'rosy',
    a: 'mauve',
    l: 'teal',
    n: 'honey',
    d: 'plum',
    g: 'slate',
    q: 'night',
    k: 'maroon',
  },
};

// ---------------------------------------------------------------------------
// The pharmacist: 16x24, facing left. A young woman with long straight black
// hair down her back, a short white pharmacy coat over a green top with a
// green name badge, jeans and white shoes.

const PHARMACIST_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhHhhhhhh...',
    '....hhhhhhhhh...',
    '....sshhhhhhh...',
    '...ssesshhhhh...',
    '....sssshhhhh...',
    '....rssshhhhh...',
    '......ssshhhh...',
    '.....wggwhhhh...',
    '....wwggwwhhh...',
    '....wwwgwwwhh...',
    '....wnwwwwaww...',
    '....wwwwwwaww...',
    '....wwwwwwaww...',
    '....wwwwwwsww...',
    '....wwwwwwwww...',
    '.....pppppp.....',
    '.....pppppp.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'ink',
    H: 'stone',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    w: 'paper',
    a: 'fog',
    g: 'leaf',
    n: 'leaf',
    p: 'denim',
    q: 'indigo',
    k: 'paper',
  },
};

export const CLINIC_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    doctor: { sprite: DOCTOR_SPRITE, ...BY_DESK, side: 'right' },
    // Alone, the receptionist and the pharmacist stand where the doctor stands.
    // With someone else there too, the receptionist steps back from the desk
    // and the pharmacist stands in front of her medicine cabinet.
    receptionist: {
      sprite: RECEPTIONIST_SPRITE,
      ...BY_DESK,
      side: 'right',
      beside: { x: 84, y: BY_DESK.y },
    },
    pharmacist: {
      sprite: PHARMACIST_SPRITE,
      ...BY_DESK,
      side: 'right',
      beside: { x: 96, y: BY_DESK.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 61, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 76, y: 25 } },
  rest: {
    left: { x: DESK.x + 1, y: PROP_TOP },
    right: { x: DESK.x + 13, y: PROP_TOP },
  },
};
