import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { CLIENT_SPRITE, COWORKER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_H, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The trade fair stage: the Harbor Trading booth at the home and office fair
 * in Chicago, in June. A shell booth with white posts and a white name board
 * (the company's anchor, its name and the booth number), navy walls washed by
 * spotlights so the glass desk lamps glow. From the left: a roll-up banner
 * with a lamp on it (you stand next to it), a wall shelf of desk lamps, some
 * lit, over a white display counter (brochures, a sample tray and one lit
 * lamp on it; handed-over things rest on its top), a screen playing the
 * product video, and a tall showcase. The visitor, or Dan, stands at the
 * counter's far end; Dan steps back under the screen when Mr. Hughes is there
 * too. Painted through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom. Above the booth is the hall: hanging lamps, then the fair's
 * flags, a roof truss, a painted band of home and office signs and, on a very
 * tall stage, a wall of windows onto the city at dusk. To both sides the row
 * of booths goes on (plants, clocks, office furniture, ceramics), and the
 * aisle carpet runs along the front.
 */

/** The display counter's left edge, width and the y of its top, in core pixels (props rest on it). */
const COUNTER = { x: 34, w: 49, top: 48 } as const;
/** 24x24 pictures stand on the countertop with their shadow on it. */
const PROP_TOP = COUNTER.top - 20;

const FLOOR_TOP = 56;
/** Our booth: its outer edges in core x (the posts stand just inside them). */
const BOOTH = { x0: 2, x1: 126 } as const;
/** The name board across the top of every booth: its top and height, from the core's top. */
const FASCIA = { top: 1, h: 9 } as const;
/** Where the booth walls start, under the name board. */
const WALL_TOP = FASCIA.top + FASCIA.h;
/** The spotlights under our name board, in core x (one per wall panel). */
const SPOTS = [17, 48, 79, 110] as const;
/** The wall shelf of lamps over the counter. */
const SHELF = { x: 37, w: 43, y: 27 } as const;
/** Where the person at the counter's far end stands, and where Dan steps back to. */
const BY_COUNTER = { x: 80, y: 39 } as const;
const UNDER_SCREEN = { x: 96, y: 39 } as const;
/** Width of one neighbouring booth. */
const NEIGHBOUR_W = 62;
/** The hall's lamps and flags hang this far apart. */
const HALL_GAP = 64;
/** Hall above the core needed for the lamps, the flags, the truss, the sign band and the windows. */
const LIGHTS_MIN = 12;
const FLAGS_MIN = 38;
const TRUSS_MIN = 48;
const BAND_MIN = 76;
const WINDOWS_MIN = 100;
/** The roof truss: its top and bottom chords, from the ceiling. */
const TRUSS = { top: 3, bottom: 11 } as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Paints the '#' cells of a small bitmap in one colour. */
function stamp(
  p: Painter,
  x: number,
  y: number,
  rows: readonly string[],
  color: PaletteName,
): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') px(p, x + dx, y + dy, color);
  });
}

/** Paints the fair to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const front = oy + CORE_H; // where the booths end and the aisle begins

  paintHall(p, w, ox, oy, floorTop);
  paintAisle(p, w, ox, floorTop, h);

  // The row of booths goes on to both sides.
  for (let x = ox + BOOTH.x0 - NEIGHBOUR_W, i = 0; x + NEIGHBOUR_W > 0; x -= NEIGHBOUR_W, i++) {
    paintNeighbour(p, x, oy, front, LEFT_KINDS[i % LEFT_KINDS.length] ?? 'plants', true, i);
  }
  for (let x = ox + BOOTH.x1 + 1, i = 0; x < w; x += NEIGHBOUR_W, i++) {
    paintNeighbour(p, x, oy, front, RIGHT_KINDS[i % RIGHT_KINDS.length] ?? 'clocks', false, i + 7);
  }

  paintBoothShell(p, ox, oy, floorTop, front);
  paintBanner(p, ox + 5, oy);
  paintLampShelf(p, ox, oy);
  paintScreen(p, ox + 95, oy + 13);
  paintShowcase(p, ox + 116, oy + 18, floorTop);
  paintCounter(p, ox + COUNTER.x, oy + COUNTER.top, front);
}

// ---------------------------------------------------------------------------
// The hall

const HOUSE = [
  '...#...',
  '..###..',
  '.#####.',
  '#######',
  '.##.##.',
  '.##.##.',
  '.##.##.',
] as const;
const LAMP_SIGN = [
  '..###..',
  '.#####.',
  '#######',
  '...#...',
  '...#...',
  '..###..',
  '.#####.',
] as const;
const CHAIR = [
  '#......',
  '#......',
  '#......',
  '######.',
  '#....#.',
  '#....#.',
  '#....#.',
] as const;
const CLOCK = [
  '.#####.',
  '#..#..#',
  '#..#..#',
  '#..##.#',
  '#.....#',
  '#.....#',
  '.#####.',
] as const;
const POT = ['.#...#.', '.##.##.', '..###..', '...#...', '#######', '.#####.', '.#####.'] as const;
const VASE = ['..###..', '...#...', '..###..', '.#####.', '.#####.', '.#####.', '..###..'] as const;

/** The exhibition hall behind and above the booths: a dark far wall and whatever hangs from the roof. */
function paintHall(p: Painter, w: number, ox: number, oy: number, floorTop: number): void {
  p.rect(0, 0, w, floorTop, 'night');
  ditherRect(p, 0, 0, w, 3, 'ink', 8);
  const truss = oy >= TRUSS_MIN;
  const hangFrom = truss ? TRUSS.bottom + 1 : 0;

  if (oy >= WINDOWS_MIN) paintHighWindows(p, w, ox, TRUSS.bottom + 5, oy - 66);
  if (oy >= BAND_MIN) paintSignBand(p, w, ox, oy - 60);
  if (truss) paintTruss(p, w, ox);

  if (oy >= FLAGS_MIN) {
    const first = Math.floor(-(ox + 8) / HALL_GAP);
    for (let k = first; ox + k * HALL_GAP - 8 < w; k++) {
      paintFlag(p, ox + k * HALL_GAP, oy - 36, hangFrom, k);
    }
  }
  if (oy >= LIGHTS_MIN) {
    const first = Math.floor(-(ox + HALL_GAP / 2 + 12) / HALL_GAP);
    for (let k = first; ox + HALL_GAP / 2 + k * HALL_GAP - 12 < w; k++) {
      paintHallLight(p, ox + HALL_GAP / 2 + k * HALL_GAP, oy - 9, hangFrom);
    }
  }
}

/** A steel roof truss under the ceiling: two chords, posts and diagonals. */
function paintTruss(p: Painter, w: number, ox: number): void {
  const { top, bottom } = TRUSS;
  for (let x = mod(ox, 16) - 16; x < w; x += 16) {
    p.rect(x, top, 1, bottom - top, 'stone');
    for (let i = 1; i < 8; i++) {
      px(p, x + i, top + i, 'slate');
      px(p, x + 16 - i, top + i, 'slate');
    }
  }
  p.rect(0, top, w, 1, 'stone');
  p.rect(0, bottom, w, 1, 'slate');
}

/** A wall of high windows from y0 to y1: the city at dusk behind steel glazing bars. */
function paintHighWindows(p: Painter, w: number, ox: number, y0: number, y1: number): void {
  ditherGradient(p, 0, y0, w, y1 - y0, ['deep', 'indigo', 'dusk', 'violet', 'mauve', 'rosy']);
  // a few early stars
  for (let k = Math.floor(-ox / 9) - 1; ox + k * 9 < w; k++) {
    if (hash2(k, 1, 223) < 0.3) {
      const sy = y0 + 2 + Math.floor(hash2(k, 2, 227) * Math.max(1, (y1 - y0) / 3));
      px(p, ox + k * 9 + Math.floor(hash2(k, 3, 229) * 9), sy, 'fog');
    }
  }
  // the skyline: towers of the city, a few windows lit
  for (let k = Math.floor(-ox / 7) - 1; ox + k * 7 < w; k++) {
    const tall = hash2(k, 4, 211) < 0.25;
    const bh = (tall ? 14 : 4) + Math.floor(hash2(k, 5, 213) * (tall ? 14 : 8));
    const bx = ox + k * 7;
    p.rect(bx, y1 - bh, tall ? 5 : 7, bh, 'night');
    if (tall) px(p, bx + 2, y1 - bh - 1, 'night');
    for (let i = 0; i < 3; i++) {
      if (hash2(k, i, 217) < 0.5) {
        const wy = y1 - 2 - Math.floor(hash2(k, i, 219) * (bh - 2));
        px(p, bx + 1 + i, wy, hash2(k, i, 221) < 0.5 ? 'honey' : 'lamp');
      }
    }
  }
  // glazing bars, a transom, and a column every eighth bar
  for (let x = mod(ox, 12) - 12, i = Math.floor((x - ox) / 12); x < w; x += 12, i++) {
    if (mod(i, 8) === 0) p.rect(x - 1, y0, 3, y1 - y0, 'slate');
    else p.rect(x, y0, 1, y1 - y0, 'night');
  }
  p.rect(0, y0 + Math.floor((y1 - y0) / 3), w, 1, 'night');
  p.rect(0, y0 - 1, w, 1, 'slate');
  p.rect(0, y1, w, 1, 'stone');
  p.rect(0, y1 + 1, w, 1, 'slate');
}

/** The fair's painted band along the far wall: home and office signs, one after another. */
function paintSignBand(p: Painter, w: number, ox: number, y: number): void {
  const signs = [HOUSE, LAMP_SIGN, CHAIR, CLOCK] as const;
  p.rect(0, y, w, 12, 'teal');
  p.rect(0, y, w, 1, 'slate');
  p.rect(0, y + 11, w, 1, 'deep');
  for (let k = Math.floor(-ox / 24) - 1; ox + k * 24 < w; k++) {
    stamp(p, ox + k * 24 + 9, y + 2, signs[mod(k, signs.length)] ?? HOUSE, 'fog');
    px(p, ox + k * 24 + 21, y + 5, 'cyan');
  }
}

/** One of the fair's flags hanging on two wires: a house on a coloured field, a forked tail. */
function paintFlag(p: Painter, cx: number, y: number, from: number, n: number): void {
  const color = (['teal', 'maroon', 'denim'] as const)[mod(n, 3)] ?? 'teal';
  p.rect(cx - 5, from, 1, y - from, 'slate');
  p.rect(cx + 5, from, 1, y - from, 'slate');
  p.rect(cx - 7, y, 15, 1, 'fog');
  p.rect(cx - 6, y + 1, 13, 18, color);
  for (let i = 0; i < 3; i++) {
    p.rect(cx - 6, y + 19 + i, 5 - i * 2, 1, color);
    p.rect(cx + 2 + i * 2, y + 19 + i, 5 - i * 2, 1, color);
  }
  stamp(p, cx - 3, y + 4, HOUSE, 'paper');
  p.rect(cx - 4, y + 13, 9, 1, 'fog');
  p.rect(cx - 3, y + 15, 7, 1, 'fog');
}

/** A hall lamp hanging from the roof: a wide shade, a warm bulb and its glow in the air. */
function paintHallLight(p: Painter, cx: number, y: number, from: number): void {
  p.rect(cx, from, 1, y - from, 'slate');
  glowEllipse(p, cx, y + 3, 12, 7, 'lamp', [0.3, 0.17, 0.08]);
  p.rect(cx - 1, y, 3, 1, 'stone');
  p.rect(cx - 3, y + 1, 7, 1, 'stone');
  p.rect(cx - 4, y + 2, 9, 1, 'slate');
  p.rect(cx - 3, y + 3, 7, 1, 'honey');
  p.rect(cx - 1, y + 3, 3, 1, 'paper');
}

/** The aisle carpet in front of the booths: plum with a small woven pattern. */
function paintAisle(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'plum');
  for (let row = 0; floorTop + 1 + row * 2 < h; row++) {
    const y = floorTop + 1 + row * 2;
    for (let x = mod(ox + (row % 2) * 3, 6) - 6; x < w; x += 6) px(p, x, y, 'maroon');
  }
}

// ---------------------------------------------------------------------------
// The other booths

type Kind = 'plants' | 'clocks' | 'office' | 'ceramics';

const LEFT_KINDS: readonly Kind[] = ['plants', 'ceramics', 'office', 'clocks'];
const RIGHT_KINDS: readonly Kind[] = ['clocks', 'office', 'plants', 'ceramics'];

/** Each kind of booth: its wall, the block behind its sign, its carpet and its sign. */
const KINDS: Record<
  Kind,
  { wall: PaletteName; block: PaletteName; carpet: PaletteName; sign: readonly string[] }
> = {
  plants: { wall: 'slate', block: 'moss', carpet: 'stone', sign: POT },
  clocks: { wall: 'plum', block: 'maroon', carpet: 'slate', sign: CLOCK },
  office: { wall: 'teal', block: 'denim', carpet: 'night', sign: CHAIR },
  ceramics: { wall: 'stone', block: 'neonDeep', carpet: 'maroon', sign: VASE },
};

/** A small spotlight on an arm under a name board. */
function paintSpot(p: Painter, x: number, y: number): void {
  px(p, x, y, 'ink');
  p.rect(x - 1, y + 1, 3, 2, 'ink');
  p.rect(x - 1, y + 3, 3, 1, 'honey');
}

/** A white post of the booth frame from `top` down to the floor. */
function paintPost(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top, 2, floorTop - top, 'fog');
  p.rect(x + 1, top, 1, floorTop - top, 'concrete');
}

/**
 * A neighbouring booth from `bx`, NEIGHBOUR_W wide: its own wall, name board,
 * carpet and goods, and a post at its far end (`postLeft`: at its left).
 */
function paintNeighbour(
  p: Painter,
  bx: number,
  oy: number,
  front: number,
  kind: Kind,
  postLeft: boolean,
  seed: number,
): void {
  const { wall, block, carpet, sign } = KINDS[kind];
  const top = oy + WALL_TOP;
  const floorTop = oy + FLOOR_TOP;
  p.rect(bx, top, NEIGHBOUR_W, floorTop - top, wall);
  for (const sx of [bx + 16, bx + 46]) glowEllipse(p, sx, oy + 28, 13, 17, 'honey', [0.14, 0.07]);
  p.rect(bx, floorTop - 2, NEIGHBOUR_W, 2, 'night');

  // the carpet, with a pale strip along its front edge
  p.rect(bx, floorTop, NEIGHBOUR_W, front - floorTop, carpet);
  p.rect(bx, floorTop, NEIGHBOUR_W, 1, 'ink');
  p.rect(bx, front - 1, NEIGHBOUR_W, 1, 'concrete');

  if (kind === 'plants') paintPlantBooth(p, bx, top, floorTop);
  else if (kind === 'clocks') paintClockBooth(p, bx, oy, floorTop);
  else if (kind === 'office') paintOfficeBooth(p, bx, oy, floorTop);
  else paintCeramicsBooth(p, bx, oy, seed);

  // the name board: the booth's sign on a coloured block, its name as two bars
  p.rect(bx, oy + FASCIA.top, NEIGHBOUR_W, FASCIA.h, 'paper');
  p.rect(bx, oy + FASCIA.top, NEIGHBOUR_W, 1, 'fog');
  p.rect(bx, oy + FASCIA.top + FASCIA.h - 1, NEIGHBOUR_W, 1, 'fog');
  p.rect(bx + 18, oy + FASCIA.top + 1, 9, 7, block);
  stamp(p, bx + 19, oy + FASCIA.top + 1, sign, 'paper');
  p.rect(bx + 30, oy + FASCIA.top + 3, 13, 1, 'slate');
  p.rect(bx + 30, oy + FASCIA.top + 5, 9, 1, 'concrete');
  p.rect(bx, top, NEIGHBOUR_W, 1, 'night');
  paintSpot(p, bx + 16, top);
  paintSpot(p, bx + 46, top);
  paintPost(p, postLeft ? bx : bx + NEIGHBOUR_W - 2, oy + FASCIA.top, floorTop);
}

/** House plants on a bench and on the floor, one hanging from the name board. */
function paintPlantBooth(p: Painter, bx: number, top: number, floorTop: number): void {
  const bench = floorTop - 9;
  p.rect(bx + 6, bench + 3, 2, 7, 'ember');
  p.rect(bx + 34, bench + 3, 2, 7, 'ember');
  paintPlant(p, bx + 8, bench - 20);
  paintPlant(p, bx + 23, bench - 20);
  p.rect(bx + 4, bench, 34, 2, 'tan');
  p.rect(bx + 4, bench + 2, 34, 1, 'ember');
  paintPlant(p, bx + 44, floorTop - 18);
  // a hanging pot with a trailing vine
  p.rect(bx + 50, top, 1, 7, 'ink');
  p.rect(bx + 47, top + 5, 7, 2, 'leaf');
  p.rect(bx + 48, top + 7, 5, 3, 'amber');
  p.rect(bx + 52, top + 7, 1, 3, 'ember');
  p.rect(bx + 46, top + 6, 1, 5, 'leaf');
  p.rect(bx + 54, top + 6, 1, 3, 'moss');
  // watering cans on the wall shelf
  p.rect(bx + 6, top + 9, 12, 1, 'tan');
  p.rect(bx + 8, top + 5, 4, 4, 'teal');
  px(p, bx + 12, top + 6, 'teal');
  p.rect(bx + 14, top + 6, 3, 3, 'rosy');
}

/** Wall clocks, a tall case clock and a table of mantel clocks. */
function paintClockBooth(p: Painter, bx: number, oy: number, floorTop: number): void {
  paintClock(p, bx + 12, oy + 24);
  paintClock(p, bx + 28, oy + 18);
  // a square clock in a wooden frame
  p.rect(bx + 36, oy + 24, 9, 9, 'amber');
  p.rect(bx + 37, oy + 25, 7, 7, 'paper');
  p.rect(bx + 40, oy + 26, 1, 3, 'ink');
  p.rect(bx + 40, oy + 28, 3, 1, 'ink');
  // the tall case clock
  const cx = bx + 49;
  p.rect(cx, oy + 20, 9, floorTop + 1 - oy - 20, 'ember');
  p.rect(cx, oy + 20, 9, 1, 'amber');
  p.rect(cx + 8, oy + 21, 1, floorTop - oy - 20, 'plum');
  p.rect(cx + 2, oy + 22, 5, 5, 'paper');
  p.rect(cx + 4, oy + 23, 1, 2, 'ink');
  px(p, cx + 5, oy + 24, 'ink');
  p.rect(cx + 2, oy + 30, 5, 14, 'night');
  p.rect(cx + 4, oy + 30, 1, 9, 'lamp');
  p.rect(cx + 3, oy + 39, 3, 2, 'honey');
  // the table
  const t = floorTop - 11;
  p.rect(bx + 7, t + 3, 2, 9, 'ember');
  p.rect(bx + 37, t + 3, 2, 9, 'ember');
  p.rect(bx + 5, t, 36, 2, 'amber');
  p.rect(bx + 5, t + 2, 36, 1, 'ember');
  p.rect(bx + 9, t - 6, 7, 6, 'ember');
  p.rect(bx + 11, t - 5, 3, 3, 'paper');
  px(p, bx + 12, t - 4, 'ink');
  p.rect(bx + 21, t - 5, 5, 5, 'teal');
  p.rect(bx + 22, t - 4, 3, 3, 'paper');
  px(p, bx + 23, t - 3, 'ink');
  p.rect(bx + 31, t - 4, 6, 4, 'rosy');
  p.rect(bx + 33, t - 3, 2, 2, 'paper');
}

/** A desk with a screen, a set of drawers, an office chair and a chart on the wall. */
function paintOfficeBooth(p: Painter, bx: number, oy: number, floorTop: number): void {
  // the chart
  p.rect(bx + 36, oy + 17, 16, 13, 'paper');
  p.rect(bx + 38, oy + 25, 2, 3, 'denim');
  p.rect(bx + 41, oy + 22, 2, 6, 'lamp');
  p.rect(bx + 44, oy + 20, 2, 8, 'neon');
  p.rect(bx + 47, oy + 23, 2, 5, 'denim');
  p.rect(bx + 37, oy + 30, 16, 1, 'deep');
  // the desk
  const t = floorTop - 12;
  p.rect(bx + 7, t + 2, 1, 11, 'concrete');
  p.rect(bx + 24, t + 2, 10, 11, 'fog');
  p.rect(bx + 24, t + 5, 10, 1, 'concrete');
  p.rect(bx + 24, t + 9, 10, 1, 'concrete');
  px(p, bx + 29, t + 3, 'stone');
  px(p, bx + 29, t + 7, 'stone');
  p.rect(bx + 5, t, 31, 1, 'paper');
  p.rect(bx + 5, t + 1, 31, 1, 'concrete');
  // the screen and a pen pot
  p.rect(bx + 9, t - 10, 13, 8, 'ink');
  p.rect(bx + 10, t - 9, 11, 6, 'deep');
  p.rect(bx + 11, t - 8, 6, 1, 'cyan');
  p.rect(bx + 11, t - 6, 8, 1, 'sky');
  p.rect(bx + 14, t - 2, 3, 2, 'ink');
  p.rect(bx + 26, t - 3, 3, 3, 'rosy');
  px(p, bx + 27, t - 4, 'ink');
  // the chair
  p.rect(bx + 49, t - 7, 3, 11, 'maroon');
  p.rect(bx + 49, t - 7, 1, 11, 'red');
  p.rect(bx + 41, t + 3, 11, 2, 'maroon');
  p.rect(bx + 45, t + 5, 2, 5, 'stone');
  p.rect(bx + 41, t + 10, 10, 1, 'ink');
  px(p, bx + 41, t + 11, 'ink');
  px(p, bx + 50, t + 11, 'ink');
}

/** Three shelves of vases, pots, mugs and bowls. */
function paintCeramicsBooth(p: Painter, bx: number, oy: number, seed: number): void {
  const glazes: readonly PaletteName[] = ['rosy', 'paper', 'teal', 'lamp', 'mauve', 'sky', 'red'];
  for (let s = 0; s < 3; s++) {
    const y = oy + 24 + s * 12;
    for (let j = 0; j < 6; j++) {
      const x = bx + 7 + j * 8;
      const r = hash2(j, s + seed * 5, 233);
      const glaze = glazes[Math.floor(hash2(j, s + seed * 5, 239) * glazes.length)] ?? 'rosy';
      if (r < 0.3) {
        // a tall vase
        p.rect(x + 1, y - 8, 3, 2, glaze);
        p.rect(x, y - 6, 5, 6, glaze);
        px(p, x + 1, y - 5, 'paper');
      } else if (r < 0.55) {
        // a round pot
        p.rect(x + 1, y - 5, 4, 1, glaze);
        p.rect(x, y - 4, 6, 4, glaze);
        p.rect(x + 1, y - 2, 4, 1, 'night');
      } else if (r < 0.8) {
        // a mug
        p.rect(x, y - 4, 4, 4, glaze);
        px(p, x + 4, y - 3, glaze);
        px(p, x + 4, y - 2, glaze);
      } else {
        // a bowl
        p.rect(x, y - 3, 6, 2, glaze);
        p.rect(x + 1, y - 1, 4, 1, glaze);
      }
    }
    p.rect(bx + 5, y, 50, 1, 'tan');
    p.rect(bx + 5, y + 1, 50, 1, 'ember');
  }
}

// ---------------------------------------------------------------------------
// Our booth

const LETTERS = {
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
} as const;

/** A few pixel letters, 3x5 each, one pixel apart. */
function paintWord(p: Painter, x: number, y: number, word: string, color: PaletteName): void {
  [...word].forEach((ch, i) => {
    const rows = LETTERS[ch as keyof typeof LETTERS];
    if (rows) stamp(p, x + i * 4, y, rows, color);
  });
}

/** The company's anchor, 5x5. */
const ANCHOR = ['..#..', '.###.', '..#..', '#.#.#', '.###.'] as const;

/**
 * The booth itself: navy walls washed by the spotlights, the wooden platform,
 * the white posts and the name board with the anchor, the name and the number.
 */
function paintBoothShell(p: Painter, ox: number, oy: number, floorTop: number, front: number) {
  const x0 = ox + BOOTH.x0;
  const bw = BOOTH.x1 - BOOTH.x0 + 1;
  const top = oy + WALL_TOP;

  // the back wall: panels, light from the spots, a dark skirting
  p.rect(x0, top, bw, floorTop - top, 'indigo');
  for (let x = x0 + 31; x < x0 + bw - 2; x += 31) p.rect(x, top, 1, floorTop - top, 'deep');
  for (const sx of SPOTS) {
    glowEllipse(p, ox + sx, oy + 29, 15, 20, 'honey', [0.2, 0.13, 0.06]);
  }
  p.rect(x0, floorTop - 2, bw, 2, 'deep');

  // the platform: wooden boards, a pale nosing along the front when the aisle shows
  p.rect(x0, floorTop, bw, front - floorTop, 'ember');
  p.rect(x0, floorTop, bw, 1, 'plum');
  for (let row = 0; floorTop + 3 + row * 3 < front; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(x0, y, bw, 1, 'plum');
    // long boards: a butt joint now and then, a streak of grain
    for (let x = x0 + 9 + ((row * 23) % 44); x < x0 + bw; x += 44) {
      p.rect(x, y - 2, 1, 2, 'plum');
      if (x + 20 < x0 + bw) p.rect(x + 12, y - 1, 8, 1, 'amber');
    }
  }
  p.rect(x0, front, bw, 1, 'amber');
  p.rect(x0, front + 1, bw, 2, 'ink');

  // the name board
  const fy = oy + FASCIA.top;
  p.rect(x0, fy, bw, FASCIA.h, 'paper');
  p.rect(x0, fy, bw, 1, 'fog');
  p.rect(x0, fy + FASCIA.h - 1, bw, 1, 'fog');
  stamp(p, ox + 19, fy + 1, LAMP_SIGN, 'amber'); // what the booth sells
  p.rect(ox + 61, fy + 1, 7, 7, 'denim');
  stamp(p, ox + 62, fy + 2, ANCHOR, 'honey');
  paintWord(p, ox + 70, fy + 2, 'HARBOR', 'denim');
  p.rect(ox + 107, fy + 1, 15, 7, 'teal');
  paintWord(p, ox + 109, fy + 2, 'A14', 'paper');
  p.rect(x0, top, bw, 1, 'deep'); // the board's shadow on the wall

  for (const sx of SPOTS) paintSpot(p, ox + sx, top);
  paintPost(p, x0, fy, floorTop);
  paintPost(p, x0 + bw - 2, fy, floorTop);
}

type Shade = 'dome' | 'cone' | 'globe';

/** The rows of each glass shade, top to bottom: [offset from the lamp's left, width]. */
const SHADES: Record<Shade, readonly (readonly [number, number])[]> = {
  dome: [
    [2, 3],
    [1, 5],
    [0, 7],
    [0, 7],
  ],
  cone: [
    [2, 3],
    [2, 3],
    [1, 5],
    [1, 5],
    [0, 7],
  ],
  globe: [
    [2, 3],
    [1, 5],
    [1, 5],
    [1, 5],
    [2, 3],
  ],
};

/**
 * A glass desk lamp, 7 wide and 11 tall, standing on the surface at `foot`:
 * a glass shade on a brass stem. A lit one glows.
 */
function paintDeskLamp(
  p: Painter,
  x: number,
  foot: number,
  shade: Shade,
  glass: PaletteName,
  shine: PaletteName,
  lit: boolean,
): void {
  const top = foot - 11;
  const rows = SHADES[shade];
  if (lit) glowEllipse(p, x + 3, top + 3, 9, 8, 'honey', [0.34, 0.2, 0.09]);
  rows.forEach(([dx, rw], i) => p.rect(x + dx, top + i, rw, 1, glass));
  px(p, x + 2, top + 1, shine);
  if (lit) {
    if (shade === 'globe') p.rect(x + 2, top + 2, 3, 2, 'paper');
    else p.rect(x + 1, top + rows.length - 1, 5, 1, 'paper');
  }
  p.rect(x + 3, top + rows.length, 1, 9 - rows.length, 'lamp');
  p.rect(x + 2, top + 9, 3, 1, 'lamp');
  p.rect(x + 1, top + 10, 5, 1, 'amber');
}

/** The roll-up banner, 15 wide, from x: a lit lamp over a few lines, the anchor at its foot. */
function paintBanner(p: Painter, x: number, oy: number): void {
  p.rect(x - 1, oy + 13, 17, 1, 'fog');
  p.rect(x, oy + 14, 15, 40, 'plum');
  p.rect(x + 14, oy + 14, 1, 40, 'night');
  // the lamp and its light
  glowEllipse(p, x + 7, oy + 22, 6, 6, 'honey', [0.36, 0.2, 0.1]);
  p.rect(x + 6, oy + 18, 3, 1, 'honey');
  p.rect(x + 5, oy + 19, 5, 1, 'honey');
  p.rect(x + 4, oy + 20, 7, 2, 'honey');
  p.rect(x + 5, oy + 21, 5, 1, 'paper');
  px(p, x + 6, oy + 19, 'paper');
  p.rect(x + 7, oy + 22, 1, 6, 'lamp');
  p.rect(x + 5, oy + 28, 5, 1, 'lamp');
  px(p, x + 3, oy + 23, 'honey');
  px(p, x + 11, oy + 23, 'honey');
  px(p, x + 2, oy + 25, 'lamp');
  px(p, x + 12, oy + 25, 'lamp');
  // a few lines of print
  p.rect(x + 2, oy + 33, 11, 1, 'paper');
  p.rect(x + 2, oy + 36, 9, 1, 'rosy');
  p.rect(x + 2, oy + 38, 10, 1, 'rosy');
  p.rect(x + 2, oy + 40, 6, 1, 'rosy');
  // the anchor and a brass stripe
  stamp(p, x + 5, oy + 44, ANCHOR, 'honey');
  p.rect(x, oy + 51, 15, 1, 'lamp');
  // the case it rolls into
  p.rect(x - 2, oy + 54, 19, 1, 'fog');
  p.rect(x - 2, oy + 55, 19, 1, 'concrete');
}

/** The wall shelf over the counter: four glass desk lamps, two of them lit. */
function paintLampShelf(p: Painter, ox: number, oy: number): void {
  const x = ox + SHELF.x;
  const y = oy + SHELF.y;
  paintDeskLamp(p, x + 2, y, 'dome', 'honey', 'paper', true);
  paintDeskLamp(p, x + 13, y, 'cone', 'teal', 'cyan', false);
  paintDeskLamp(p, x + 24, y, 'globe', 'honey', 'paper', true);
  paintDeskLamp(p, x + 35, y, 'dome', 'rosy', 'paper', false);
  p.rect(x, y, SHELF.w, 1, 'fog');
  p.rect(x + 1, y + 1, SHELF.w - 2, 1, 'stone');
  p.rect(x + 3, y + 2, 1, 2, 'stone');
  p.rect(x + SHELF.w - 4, y + 2, 1, 2, 'stone');
  // the lit lamps shine on the shelf
  p.rect(x + 3, y, 5, 1, 'honey');
  p.rect(x + 25, y, 5, 1, 'honey');
}

/** The screen on the wall, 20x16, playing the product video: a lamp, a few words, a progress bar. */
function paintScreen(p: Painter, x: number, y: number): void {
  glowEllipse(p, x + 10, y + 8, 14, 11, 'cyan', [0.14, 0.07]);
  p.rect(x, y, 20, 16, 'ink');
  p.rect(x + 1, y + 1, 18, 13, 'teal');
  p.rect(x + 1, y + 1, 18, 1, 'cyan');
  // the lamp in the video
  p.rect(x + 4, y + 4, 3, 1, 'honey');
  p.rect(x + 3, y + 5, 5, 2, 'honey');
  p.rect(x + 4, y + 6, 3, 1, 'paper');
  p.rect(x + 5, y + 7, 1, 3, 'paper');
  p.rect(x + 4, y + 10, 3, 1, 'paper');
  // words beside it
  p.rect(x + 10, y + 4, 7, 1, 'paper');
  p.rect(x + 10, y + 6, 5, 1, 'cyan');
  p.rect(x + 10, y + 8, 6, 1, 'cyan');
  // the progress bar
  p.rect(x + 2, y + 12, 16, 1, 'deep');
  p.rect(x + 2, y + 12, 7, 1, 'neon');
  px(p, x + 9, y + 12, 'paper');
  px(p, x + 17, y + 15, 'leaf'); // the power light
}

/** The tall showcase at the booth's end, 9 wide: two lit shelves of lamps over a cupboard. */
function paintShowcase(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top, 9, floorTop - top, 'fog');
  p.rect(x + 8, top, 1, floorTop - top, 'concrete');
  p.rect(x + 1, top + 1, 7, 11, 'night');
  p.rect(x + 1, top + 13, 7, 11, 'night');
  paintDeskLamp(p, x + 1, top + 12, 'globe', 'honey', 'paper', true);
  paintDeskLamp(p, x + 1, top + 24, 'cone', 'mauve', 'rosy', false);
  p.rect(x + 1, top + 26, 7, floorTop - top - 28, 'paper');
  p.rect(x + 4, top + 26, 1, floorTop - top - 28, 'concrete');
  px(p, x + 3, top + 31, 'lamp');
  px(p, x + 5, top + 31, 'lamp');
}

/**
 * The display counter: a white top and front with the company's anchor on it.
 * On the top: a brochure stand, a pile of brochures, a tray of glass samples,
 * business cards and, at the visitor's end, a lit lamp.
 */
function paintCounter(p: Painter, x: number, top: number, front: number): void {
  const w = COUNTER.w;
  const base = front - 1; // the counter stands a pixel behind the people's feet
  p.rect(x + 1, base, w, 1, 'plum'); // its shadow on the boards
  p.rect(x, top + 2, w, base - top - 4, 'fog');
  p.rect(x + w - 1, top + 2, 1, base - top - 4, 'concrete');
  p.rect(x + 16, top + 3, 1, base - top - 6, 'concrete');
  p.rect(x + 32, top + 3, 1, base - top - 6, 'concrete');
  p.rect(x + 1, base - 2, w - 2, 2, 'stone');
  // the anchor on a navy roundel
  const cx = x + 24;
  const cy = top + 7;
  p.rect(cx - 2, cy - 3, 5, 7, 'denim');
  p.rect(cx - 3, cy - 2, 7, 5, 'denim');
  stamp(p, cx - 2, cy - 2, ANCHOR, 'honey');

  // what is on the top
  // a brochure standing in a clear holder
  p.rect(x + 3, top - 7, 5, 6, 'paper');
  p.rect(x + 3, top - 7, 5, 2, 'denim');
  px(p, x + 5, top - 4, 'lamp');
  p.rect(x + 4, top - 2, 3, 1, 'concrete');
  p.rect(x + 2, top - 1, 7, 1, 'stone');
  // a pile of brochures
  p.rect(x + 11, top - 2, 7, 1, 'paper');
  p.rect(x + 12, top - 1, 7, 1, 'paper');
  px(p, x + 11, top - 2, 'denim');
  px(p, x + 12, top - 1, 'denim');
  // the sample tray: little pieces of coloured glass
  p.rect(x + 22, top - 1, 14, 1, 'stone');
  p.rect(x + 23, top - 3, 2, 2, 'teal');
  p.rect(x + 26, top - 3, 2, 2, 'rosy');
  p.rect(x + 29, top - 3, 2, 2, 'honey');
  p.rect(x + 32, top - 3, 2, 2, 'mauve');
  // business cards
  p.rect(x + 37, top - 1, 3, 1, 'paper');
  // the lit lamp at the visitor's end
  paintDeskLamp(p, x + 41, top, 'cone', 'honey', 'paper', true);

  // the top itself, a pixel proud of the front on your side
  p.rect(x - 1, top, w + 1, 1, 'paper');
  p.rect(x - 1, top + 1, w + 1, 1, 'concrete');
  p.rect(x + 40, top, 9, 1, 'honey'); // the lamp's light on it
}

export const TRADE_FAIR_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    // Mr. Hughes, the visitor, always stands at the counter's far end.
    client: { sprite: CLIENT_SPRITE, ...BY_COUNTER, side: 'right' },
    // Alone (setting up, minding the booth) Dan stands there too; with Mr.
    // Hughes at the counter he steps back under the screen.
    coworker: { sprite: COWORKER_SPRITE, ...BY_COUNTER, side: 'right', beside: UNDER_SCREEN },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 56, y: 10 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 83, y: 24 } },
  rest: {
    left: { x: COUNTER.x + 2, y: PROP_TOP },
    // Stops short of the lamp at the visitor's end.
    right: { x: COUNTER.x + 16, y: PROP_TOP },
  },
};
