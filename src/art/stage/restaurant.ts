import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_W, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The restaurant stage: a small, cosy restaurant in the evening. Wine-red
 * walls over dark panelling, a tiled floor. From the left: a potted plant and
 * a window onto the night street with a lace half-curtain (you stand below
 * it); a table for two under a fringed hanging lamp, its white cloth where
 * handed-over things rest, a green chair at each end; then the waiter, in
 * front of a shelf of bottles and a sideboard. Your friend Mia stands at her
 * end of the table. Painted through the Painter interface, palette colours
 * only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; above it come wall plates, a specials board and pictures, then a
 * striped upper wall hung with more pictures under brass chandeliers; to the
 * left more windows, to the right more pictures, each with its own candle-lit
 * table for two.
 */

/** The dining table: left edge, width and the y of its top (props rest on it), in core pixels. */
const TABLE = { x: 42, w: 40, top: 47 } as const;
/** 24x24 pictures stand on the tablecloth with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 54;
/** Where the feet of people and furniture are: one past the last row of a table leg. */
const FEET = 63;
/** The chair rail: the top of the dark panelling. */
const RAIL_Y = 48;
/** The hanging lamp over the table. */
const LAMP_X = 62;
/** The wall lamp between the window and the table. */
const SCONCE = { x: 44, y: 15 } as const;
/** The bottle shelf behind the waiter: its box in core pixels and how far it runs past the core. */
const BAR = { x: 93, top: 8, bottom: 36, tail: 18 } as const;
/** Width of one window or picture bay beside the core. */
const BAY_W = 46;
/** Wall above the core needed before the upper wall gets its stripes and picture rail. */
const CORNICE_MIN = 32;
/** How far above the core that rail sits. */
const CORNICE_UP = 20;
/** Upper wall needed before the chandeliers hang in it. */
const CHANDELIER_MIN = 84;

type Pair = readonly [PaletteName, PaletteName];

/** Bottle glass: body and its lit edge. */
const BOTTLES: readonly Pair[] = [
  ['moss', 'leaf'],
  ['maroon', 'red'],
  ['amber', 'lamp'],
  ['teal', 'cyan'],
  ['fog', 'paper'],
  ['ember', 'amber'],
  ['moss', 'leaf'],
];

/** Paints the restaurant to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const feet = oy + FEET;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  const barEnd = ox + CORE_W + BAR.tail;

  // Bays beside the core: windows to the left, pictures to the right.
  const windows: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) windows.push(x);
  const pictures: number[] = [];
  for (let x = barEnd + 2; x < w; x += BAY_W) pictures.push(x);
  const sconces = [
    ox + SCONCE.x,
    ...windows.map((x) => x + BAY_W - 3),
    ...pictures.map((x) => x + 6),
  ];
  const chandeliers: number[] = [];
  if (cornice >= CHANDELIER_MIN) {
    chandeliers.push(ox + 16, ox + 108);
    for (let x = ox + 16 - 92; x + 14 > 0; x -= 92) chandeliers.push(x);
    for (let x = ox + 108 + 92; x - 14 < w; x += 92) chandeliers.push(x);
  }
  const chandelierY = Math.min(46, Math.floor(cornice / 3));

  paintWall(p, w, ox, oy, floorTop, cornice);

  // Warm light on the wall: the hanging lamp, the wall lamps, the chandeliers.
  const wallLight = { y0: cornice + 3, y1: oy + RAIL_Y };
  lightPool(p, ox + LAMP_X, oy + 20, 30, 22, [['ember', 0.45]], wallLight);
  lightPool(p, ox + LAMP_X, oy + 20, 11, 7, [['amber', 0.4]], wallLight);
  lightPool(p, ox + 115, oy + 39, 9, 7, [['ember', 0.5]], wallLight);
  for (const sx of sconces) {
    lightPool(p, sx, oy + SCONCE.y + 2, 15, 14, [['ember', 0.5]], wallLight);
    lightPool(p, sx, oy + SCONCE.y + 1, 6, 5, [['amber', 0.45]], wallLight);
  }
  for (const cx of chandeliers) {
    lightPool(p, cx, chandelierY - 2, 30, 24, [['maroon', 0.7]], { y0: 4, y1: cornice });
    lightPool(p, cx, chandelierY - 3, 15, 10, [['ember', 0.5]], { y0: 4, y1: cornice });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) paintSalon(p, w, ox, cornice, chandeliers.length > 0 ? chandelierY + 16 : 5);
  for (const cx of chandeliers) paintChandelier(p, cx, chandelierY);
  if (oy >= 12) {
    for (let i = 0; i < 4; i++) paintPlate(p, ox + 98 + i * 11, oy - 7, i);
  }
  if (oy >= 18) {
    paintPicture(p, ox + 5, oy - 15, 12, 12, 3, 'plum');
    paintPicture(p, ox + 20, oy - 14, 14, 10, 0, 'plum');
    paintBoard(p, ox + 38, oy - 16);
    paintPicture(p, ox + 67, oy - 15, 20, 12, 4, 'plum');
  }

  // On the wall of the core.
  paintWindow(p, ox + 4, oy + 8, 0);
  paintSconce(p, ox + SCONCE.x, oy + SCONCE.y);
  paintPicture(p, ox + 72, oy + 11, 15, 12, 1, 'plum');
  paintBar(p, ox + BAR.x, barEnd, oy);
  windows.forEach((x, i) => {
    paintWindow(p, x + 8, oy + 8, i + 1);
    paintSconce(p, x + BAY_W - 3, oy + SCONCE.y);
  });
  pictures.forEach((x, i) => {
    paintSconce(p, x + 6, oy + SCONCE.y);
    paintPicture(p, x + 15, oy + 10, 22, 16, VIEWS[i % 2] ?? 0, 'plum');
  });

  paintFloor(p, w, ox, floorTop, h);

  paintPlant(p, ox + 3, oy + 37);
  paintSideboard(p, ox + 110, barEnd, oy, floorTop);
  windows.forEach((x, i) => paintSideTable(p, x + 13, oy, i * 2 + 1));
  pictures.forEach((x, i) => paintSideTable(p, x + 16, oy, i * 2));

  // Both chairs are pushed in: Mia stands in front of hers, and only the
  // front leg under the cloth shows past her.
  paintChair(p, ox + TABLE.x - 7, feet, 1);
  paintChair(p, ox + TABLE.x + TABLE.w + 5, feet, -1);
  paintTable(p, ox + TABLE.x, oy + TABLE.top, TABLE.w, feet);
  paintPendant(p, ox + LAMP_X, oy);
}

/**
 * The wall: wine red over dark panelling. On a tall stage a brass picture
 * rail runs at `cornice` and the wall above it is striped.
 */
function paintWall(
  p: Painter,
  w: number,
  ox: number,
  oy: number,
  floorTop: number,
  cornice: number,
): void {
  const railY = oy + RAIL_Y;
  p.rect(0, 0, w, railY, 'maroon');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'plum');
    // stripes counted from the core, so they never shift with the stage size
    const start = (((ox + 3) % 8) + 8) % 8;
    for (let x = start - 8; x < w; x += 8) p.rect(x, 0, 3, cornice, 'maroon');
    p.rect(0, cornice, w, 1, 'amber');
    p.rect(0, cornice + 1, w, 1, 'ember');
    p.rect(0, cornice + 2, w, 1, 'plum');
    p.rect(0, 0, w, 2, 'night');
    ditherRect(p, 0, 2, w, 3, 'night', 8);
  } else {
    ditherRect(p, 0, 0, w, 3, 'plum', 8);
  }
  // the panelling below the chair rail
  p.rect(0, railY, w, floorTop - railY, 'plum');
  p.rect(0, railY, w, 1, 'ember');
  const start = (((ox + 2) % 10) + 10) % 10;
  for (let x = start - 10; x < w; x += 10) p.rect(x, railY + 2, 1, floorTop - railY - 4, 'night');
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** Terracotta tiles laid as a chequerboard, the rows deeper towards the front. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  const tile = 8;
  p.rect(0, floorTop, w, h - floorTop, 'tan');
  let y = floorTop;
  for (let row = 0; y < h; row++) {
    const rowH = Math.min(2 + row, 5);
    const start = (((ox + (row % 2) * tile) % (tile * 2)) + tile * 2) % (tile * 2);
    for (let x = start - tile * 2; x < w; x += tile * 2) p.rect(x, y, tile, rowH, 'ember');
    y += rowH;
  }
  p.rect(0, floorTop, w, 1, 'plum');
}

/** A fringed lamp hanging from the ceiling (y 0) low over the table. */
function paintPendant(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 15, 'ink');
  p.rect(cx - 1, oy + 15, 3, 1, 'lamp');
  p.rect(cx - 3, oy + 16, 7, 1, 'honey');
  p.rect(cx - 4, oy + 17, 9, 2, 'honey');
  p.rect(cx - 5, oy + 19, 11, 2, 'honey');
  p.rect(cx - 2, oy + 17, 4, 3, 'paper');
  p.rect(cx + 3, oy + 18, 2, 3, 'lamp');
  p.rect(cx - 5, oy + 21, 11, 1, 'lamp');
  for (let fx = cx - 5; fx <= cx + 5; fx += 2) px(p, fx, oy + 22, 'amber');
}

/** A wall lamp: a small lit shade on a brass arm, its top at `y`. */
function paintSconce(p: Painter, cx: number, y: number): void {
  p.rect(cx - 1, y, 3, 1, 'honey');
  p.rect(cx - 2, y + 1, 5, 3, 'honey');
  p.rect(cx - 1, y + 1, 2, 2, 'paper');
  p.rect(cx - 2, y + 4, 5, 1, 'lamp');
  p.rect(cx, y + 5, 1, 3, 'amber');
  p.rect(cx - 1, y + 8, 3, 2, 'amber');
  px(p, cx, y + 8, 'lamp');
}

/**
 * A window onto the night street, 30 wide: the sky and rooftops above a brass
 * rod with a lace half-curtain.
 */
function paintWindow(p: Painter, x: number, y: number, n: number): void {
  const w = 30;
  const h = 27;
  const rod = y + 14;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  ditherGradient(p, x + 2, y + 2, w - 4, rod - y - 2, ['deep', 'indigo', 'dusk']);
  // stars, a thin moon in the first window
  for (let i = 0; i < 4; i++) {
    const sx = x + 3 + Math.floor(hash2(n, i, 29) * (w - 6));
    const sy = y + 3 + Math.floor(hash2(n, i, 31) * 5);
    px(p, sx, sy, hash2(n, i, 37) > 0.5 ? 'paper' : 'fog');
  }
  if (n === 0) {
    p.rect(x + 21, y + 4, 1, 3, 'paper');
    px(p, x + 20, y + 3, 'paper');
    px(p, x + 20, y + 7, 'paper');
  }
  // rooftops across the street, a few lit windows
  for (let b = 0; b < 4; b++) {
    const bh = 3 + Math.floor(hash2(n, b, 41) * 6);
    const bx = x + 2 + b * 7;
    p.rect(bx, rod - bh, b === 3 ? 5 : 7, bh, 'night');
    if (hash2(n, b, 43) > 0.3) px(p, bx + 2, rod - bh + 2, 'honey');
    if (hash2(n, b, 47) > 0.55) px(p, bx + 4, rod - bh + 1, 'lamp');
  }
  // the half-curtain on its rod
  p.rect(x + 2, rod + 1, w - 4, y + h - rod - 3, 'paper');
  for (let fx = x + 3; fx < x + w - 2; fx += 3) p.rect(fx, rod + 2, 1, y + h - rod - 5, 'fog');
  for (let fx = x + 2; fx < x + w - 2; fx += 2) px(p, fx, y + h - 3, 'fog');
  p.rect(x + 1, rod, w - 2, 1, 'lamp');
  p.rect(x + w / 2, y + 2, 1, rod - y - 2, 'ember');
  // the sill
  p.rect(x - 1, y + h - 1, w + 2, 1, 'amber');
  p.rect(x - 1, y + h, w + 2, 1, 'plum');
}

/** Picture kinds that fill a wide frame, and the ones for small frames. */
const VIEWS = [0, 4] as const;
const SMALLS = [1, 3, 2] as const;

/**
 * A small picture in a gilt frame. Kinds: 0 a sunset at sea, 1 a bottle and
 * fruit, 2 a portrait, 3 flowers in a vase, 4 hills with cypresses.
 */
function paintPicture(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: number,
  shadow: PaletteName,
): void {
  p.rect(x + 1, y + h, w - 1, 1, shadow);
  p.rect(x, y, w, h, 'amber');
  p.rect(x, y, w, 1, 'lamp');
  const ix = x + 1;
  const iy = y + 1;
  const iw = w - 2;
  const ih = h - 2;
  const cx = ix + Math.floor(iw / 2);
  const base = iy + ih;
  if (kind === 0) {
    const sea = Math.max(2, Math.floor(ih / 3));
    ditherGradient(p, ix, iy, iw, ih - sea, ['violet', 'rosy', 'honey']);
    p.rect(ix, base - sea, iw, sea, 'teal');
    p.rect(cx - 1, base - sea - 1, 2, 1, 'paper');
    p.rect(cx - 1, base - sea + 1, 3, 1, 'honey');
    px(p, ix + 2, base - sea, 'ink');
  } else if (kind === 1) {
    p.rect(ix, iy, iw, ih, 'tan');
    p.rect(ix, base - 2, iw, 2, 'ember');
    p.rect(cx - 2, base - 7, 2, 5, 'moss');
    px(p, cx - 2, base - 8, 'moss');
    px(p, cx - 2, base - 5, 'paper');
    p.rect(cx + 1, base - 4, 2, 2, 'red');
    p.rect(cx + 3, base - 3, 2, 1, 'lamp');
  } else if (kind === 2) {
    p.rect(ix, iy, iw, ih, 'slate');
    p.rect(cx - 3, base - 3, 6, 3, 'teal');
    p.rect(cx - 1, base - 6, 3, 3, 'skin');
    p.rect(cx - 2, base - 7, 4, 2, 'ink');
    px(p, cx + 1, base - 5, 'ink');
  } else if (kind === 3) {
    p.rect(ix, iy, iw, ih, 'indigo');
    p.rect(cx - 1, base - 3, 3, 3, 'paper');
    px(p, cx + 1, base - 2, 'fog');
    p.rect(cx, base - 5, 1, 2, 'leaf');
    px(p, cx - 2, base - 5, 'leaf');
    px(p, cx + 2, base - 6, 'leaf');
    px(p, cx, base - 7, 'neon');
    px(p, cx - 2, base - 6, 'honey');
    px(p, cx + 2, base - 7, 'rosy');
    px(p, cx - 1, base - 8, 'rosy');
    px(p, cx + 1, base - 8, 'honey');
  } else {
    const land = Math.max(3, Math.floor(ih / 2));
    ditherGradient(p, ix, iy, iw, ih - land, ['dusk', 'mauve', 'rosy']);
    p.rect(ix, base - land, iw, land, 'leaf');
    p.rect(ix, base - land + 2, iw, land - 2, 'moss');
    p.rect(ix + 2, base - land - 1, Math.max(2, iw - 9), 1, 'leaf');
    p.rect(ix + iw - 4, base - land - 3, 1, 4, 'moss');
    p.rect(ix + iw - 6, base - land - 1, 1, 2, 'moss');
    px(p, ix + 3, base - 2, 'honey');
  }
}

/** A painted plate hung on the wall, 7 across, centred on (cx, cy). */
function paintPlate(p: Painter, cx: number, cy: number, n: number): void {
  const ring: PaletteName = n % 2 === 0 ? 'sky' : 'rosy';
  p.rect(cx - 1, cy - 3, 3, 7, 'paper');
  p.rect(cx - 2, cy - 2, 5, 5, 'paper');
  p.rect(cx - 3, cy - 1, 7, 3, 'paper');
  p.rect(cx - 1, cy - 2, 3, 5, ring);
  p.rect(cx - 2, cy - 1, 5, 3, ring);
  p.rect(cx - 1, cy - 1, 3, 3, 'paper');
  px(p, cx, cy, n % 2 === 0 ? 'denim' : 'red');
  p.rect(cx - 1, cy + 4, 3, 1, 'plum');
}

/** The specials board: a dark slate in a wooden frame, a few chalk lines, a fork and a knife. */
function paintBoard(p: Painter, x: number, y: number): void {
  const w = 20;
  const h = 13;
  p.rect(x + 1, y + h, w - 1, 1, 'plum');
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'night');
  // a fork and a knife
  p.rect(x + 3, y + 3, 1, 7, 'fog');
  px(p, x + 2, y + 3, 'fog');
  px(p, x + 4, y + 3, 'fog');
  p.rect(x + 2, y + 4, 3, 1, 'fog');
  p.rect(x + 6, y + 3, 1, 7, 'fog');
  px(p, x + 7, y + 4, 'fog');
  px(p, x + 7, y + 5, 'fog');
  // chalk lines
  p.rect(x + 10, y + 3, 7, 1, 'honey');
  p.rect(x + 10, y + 5, 5, 1, 'fog');
  p.rect(x + 10, y + 7, 7, 1, 'fog');
  p.rect(x + 10, y + 9, 4, 1, 'fog');
  px(p, x + 17, y + 9, 'rosy');
}

/** One bottle standing on a shelf whose top row is `base`. */
function paintBottle(p: Painter, x: number, base: number, i: number, j: number): void {
  const [body, light] = BOTTLES[Math.floor(hash2(i, j, 17) * BOTTLES.length)] ?? ['moss', 'leaf'];
  const bh = 4 + Math.floor(hash2(i, j, 19) * 3);
  p.rect(x, base - bh, 3, bh, body);
  p.rect(x, base - bh + 1, 1, bh - 1, light);
  p.rect(x + 1, base - bh - 3, 1, 3, body);
  px(p, x + 1, base - bh - 3, hash2(i, j, 23) > 0.5 ? 'lamp' : 'paper');
  if (hash2(i, j, 27) > 0.45) p.rect(x, base - 3, 3, 2, 'paper');
}

/** The bottle shelf on the wall behind the waiter: a lit wooden case with two rows of bottles. */
function paintBar(p: Painter, x0: number, x1: number, oy: number): void {
  const top = oy + BAR.top;
  const bottom = oy + BAR.bottom;
  const len = x1 - x0;
  p.rect(x0 + 1, bottom, len - 1, 1, 'plum');
  p.rect(x0, top, len, bottom - top, 'ember');
  p.rect(x0, top, len, 1, 'amber');
  p.rect(x0 + 2, top + 2, len - 4, bottom - top - 4, 'night');
  // a strip light under the top
  p.rect(x0 + 2, top + 2, len - 4, 1, 'honey');
  ditherRect(p, x0 + 2, top + 3, len - 4, 2, 'ember', 6);
  const shelves = [top + 14, bottom - 2];
  shelves.forEach((sy, j) => {
    let i = 0;
    for (let bx = x0 + 4; bx + 3 <= x1 - 3; bx += 4, i++) {
      if (hash2(i, j, 13) > 0.12) paintBottle(p, bx, sy, i, j);
    }
    p.rect(x0 + 2, sy, len - 4, 1, 'amber');
  });
  p.rect(x0 + 2, top + 15, len - 4, 1, 'ink');
}

/** The waiter's sideboard under the shelf: a small lamp, a pile of plates, a bottle on ice. */
function paintSideboard(p: Painter, x0: number, x1: number, oy: number, floorTop: number): void {
  const top = oy + 42;
  const len = x1 - x0;
  p.rect(x0, top + 2, len, floorTop - top - 2, 'ember');
  for (let dx = x0 + 1; dx + 11 <= x1; dx += 12) {
    p.rect(dx, top + 4, 11, floorTop - top - 6, 'plum');
    p.rect(dx + 1, top + 5, 9, floorTop - top - 8, 'ember');
    px(p, dx + 9, top + 7, 'lamp');
  }
  p.rect(x0 - 1, top, len + 2, 1, 'lamp');
  p.rect(x0 - 1, top + 1, len + 2, 1, 'amber');
  // the lamp
  const cx = x0 + 5;
  p.rect(cx - 2, top - 6, 5, 1, 'honey');
  p.rect(cx - 3, top - 5, 7, 2, 'honey');
  p.rect(cx - 1, top - 5, 2, 1, 'paper');
  p.rect(cx - 3, top - 3, 7, 1, 'lamp');
  p.rect(cx, top - 2, 1, 1, 'amber');
  p.rect(cx - 1, top - 1, 3, 1, 'amber');
  // plates
  for (let i = 0; i < 4; i++) p.rect(x0 + 12, top - 1 - i, 7, 1, i % 2 === 0 ? 'fog' : 'paper');
  // a bottle in an ice bucket
  p.rect(x0 + 25, top - 6, 2, 3, 'moss');
  px(p, x0 + 25, top - 6, 'honey');
  p.rect(x0 + 23, top - 4, 6, 4, 'fog');
  p.rect(x0 + 23, top - 4, 6, 1, 'paper');
  p.rect(x0 + 28, top - 3, 1, 3, 'concrete');
}

/**
 * A bistro chair seen from the side, green with a red seat, 7 wide. `x` is
 * the outer edge of its back; the seat runs the way it `faces` (1 right, -1 left).
 */
function paintChair(p: Painter, x: number, feet: number, faces: 1 | -1): void {
  const seat = feet - 8;
  const left = faces === 1 ? x : x - 6;
  const front = faces === 1 ? x + 6 : x - 6;
  // the back: two bent rods, lit on the table side
  p.rect(x, feet - 17, 1, 17, 'moss');
  p.rect(x + faces, feet - 18, 1, 10, 'leaf');
  px(p, x + faces * 2, feet - 18, 'leaf');
  px(p, x + faces * 2, feet - 13, 'moss');
  p.rect(left, seat, 7, 1, 'red');
  p.rect(left, seat + 1, 7, 1, 'leaf');
  p.rect(front, seat + 2, 1, 6, 'leaf');
  p.rect(left + 1, feet - 3, 5, 1, 'moss');
}

/** A table under a white cloth with a red band near the hem; `top` is the tabletop. */
function paintTable(p: Painter, x: number, top: number, w: number, feet: number): void {
  p.rect(x + 2, feet - 1, w - 4, 1, 'maroon');
  p.rect(x + 3, top + 9, 2, feet - top - 9, 'ink');
  p.rect(x + w - 5, top + 9, 2, feet - top - 9, 'ink');
  p.rect(x - 1, top, w + 2, 9, 'paper');
  p.rect(x - 1, top + 2, w + 2, 1, 'fog');
  for (let fx = x + 2; fx < x + w; fx += 5) p.rect(fx, top + 3, 1, 6, 'fog');
  p.rect(x + w - 1, top + 3, 2, 6, 'fog');
  p.rect(x - 1, top + 7, w + 2, 1, 'red');
  for (let fx = x; fx <= x + w; fx += 2) px(p, fx, top + 9, 'paper');
}

/** A table for two at the side: a candle, a bottle and two glasses on some. */
function paintSideTable(p: Painter, x: number, oy: number, n: number): void {
  const w = 20;
  const top = oy + TABLE.top;
  const feet = oy + FEET;
  const cx = x + 10;
  lightPool(p, cx, top - 5, 8, 7, [['ember', 0.6]], { y0: top - 12, y1: top });
  paintChair(p, x - 8, feet, 1);
  paintChair(p, x + w + 7, feet, -1);
  paintTable(p, x, top, w, feet);
  // the candle in a brass holder
  p.rect(cx, top - 4, 1, 3, 'paper');
  px(p, cx, top - 5, 'honey');
  px(p, cx, top - 6, 'lamp');
  p.rect(cx - 1, top - 1, 3, 1, 'lamp');
  if (n % 2 === 0) {
    p.rect(x + 4, top - 5, 2, 5, 'moss');
    px(p, x + 4, top - 6, 'moss');
    px(p, x + 4, top - 3, 'paper');
  }
  for (const gx of [x + 6 + (n % 2) * -3, x + 15]) {
    p.rect(gx, top - 4, 2, 2, 'fog');
    px(p, gx, top - 2, 'fog');
    p.rect(gx, top - 1, 2, 1, 'fog');
  }
}

// ---------------------------------------------------------------------------
// Above the core

/** A brass chandelier on a chain from the ceiling: a ring of candles at `y`. */
function paintChandelier(p: Painter, cx: number, y: number): void {
  p.rect(cx, 0, 1, y - 9, 'ink');
  p.rect(cx - 1, y - 9, 3, 2, 'lamp');
  for (let i = 1; i <= 6; i++) {
    px(p, cx - i * 2, y - 8 + i, 'amber');
    px(p, cx + i * 2, y - 8 + i, 'amber');
  }
  for (const dx of [-13, -7, 0, 7, 13]) {
    p.rect(cx + dx, y - 4, 1, 4, 'paper');
    px(p, cx + dx, y - 5, 'honey');
    px(p, cx + dx, y - 6, 'lamp');
  }
  p.rect(cx - 14, y, 29, 1, 'honey');
  p.rect(cx - 13, y + 1, 27, 1, 'lamp');
  p.rect(cx - 9, y + 2, 19, 1, 'amber');
  p.rect(cx - 1, y + 3, 3, 2, 'amber');
  px(p, cx, y + 5, 'honey');
}

/** One or two rows of pictures on the striped upper wall, from the rail up to `ceiling`. */
function paintSalon(p: Painter, w: number, ox: number, cornice: number, ceiling: number): void {
  const cell = 28;
  for (let row = 0; row < 2; row++) {
    const bottom = cornice - 6 - row * 22;
    const room = bottom - ceiling;
    if (room < 12) break;
    for (let c = Math.floor(-ox / cell) - 1; ox + c * cell < w; c++) {
      const big = (((c + row) % 2) + 2) % 2 === 0;
      const fw = (big ? 18 : 11) + Math.floor(hash2(c, row, 93) * (big ? 5 : 4));
      const fh = Math.min(room, (big ? 13 : 10) + Math.floor(hash2(c, row, 95) * 3));
      const fx = ox + c * cell + Math.floor((cell - fw) / 2);
      const fy = bottom - fh - (big ? 0 : Math.floor(hash2(c, row, 99) * 3));
      // keep clear of the hanging lamp's cord
      if (fx <= ox + LAMP_X + 2 && fx + fw >= ox + LAMP_X - 2) continue;
      // wide frames hold a view, small ones a still life, a portrait or flowers
      const turn = Math.floor((c - row) / 2);
      const kind = big ? VIEWS[((turn % 2) + 2) % 2] : SMALLS[((turn % 3) + 3) % 3];
      paintPicture(p, fx, fy, fw, fh, kind ?? 0, 'night');
    }
  }
}

// ---------------------------------------------------------------------------
// The waiter: 16x24, facing left. A neat man with short dark hair and a small
// moustache: a white shirt with a red bow tie, a black waistcoat, black
// trousers, a white cloth over his forearm.

const SERVER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhhhh.....',
    '.....hhhhhhh....',
    '.....sshhhhhh...',
    '....ssssshhhh...',
    '...ssesssshhh...',
    '....sssssssh....',
    '....mmssss......',
    '......sss.......',
    '.....rwvvvww....',
    '....wwvvvvwww...',
    '....wvvvvvwww...',
    '....wvvvvvwww...',
    '...swwwwwwwww...',
    '....vcccvvv.....',
    '....vcccvvv.....',
    '.....cfcppp.....',
    '.....cccppq.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'ink',
    s: 'skin',
    e: 'ink',
    m: 'ink',
    r: 'red',
    w: 'paper',
    v: 'ink',
    c: 'paper',
    f: 'fog',
    p: 'night',
    q: 'ink',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// The friend, Mia: 16x24, facing left. Out for the evening in casual clothes:
// wavy golden hair to her shoulders, a pale blue denim jacket over a white top,
// a dark blue skirt, grey tights and white trainers.

export const FRIEND_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhhh...',
    '....hhhhhhhhHH..',
    '....shhhhhhhhH..',
    '...ssesshhhhHH..',
    '....sssshhhhHH..',
    '....rssshhhHH...',
    '......sss.hHHH..',
    '.....wwjjjjHH...',
    '....jwwjjjjjj...',
    '....jwwjjjjjj...',
    '....jjwjjjajj...',
    '....jjwjjjajj...',
    '....jjjjjjajj...',
    '....wwwwwwsw....',
    '.....dddddd.....',
    '....ddddddd.....',
    '....ddddddDD....',
    '....ddddddDD....',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '.....kkkkk......',
  ],
  legend: {
    h: 'honey',
    H: 'lamp',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    w: 'paper',
    j: 'sky',
    a: 'denim',
    d: 'indigo',
    D: 'deep',
    g: 'stone',
    q: 'slate',
    k: 'paper',
  },
};

/** Where the waiter stands, a step back from the table. */
const SERVER_SPOT = { x: 96, y: 39 } as const;
/** Mia's place at her end of the table, alone or with the waiter there too. */
const FRIEND_SPOT = { x: 79, y: 39 } as const;

export const RESTAURANT_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    server: { sprite: SERVER_SPRITE, ...SERVER_SPOT, side: 'right' },
    friend: { sprite: FRIEND_SPRITE, ...FRIEND_SPOT, side: 'right', beside: FRIEND_SPOT },
  },
  // One bubble place serves both of them: its tail ends between their heads.
  want: { left: { x: 30, y: 5 }, right: { x: 61, y: 9 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 91, y: 25 } },
  // The right-hand picture stops short of Mia's face.
  rest: { left: { x: TABLE.x, y: PROP_TOP }, right: { x: TABLE.x + 14, y: PROP_TOP } },
};
