import { ditherGradient, ditherRect, hash2, lightPool, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W, paintClock } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The post-office stage: a small town post office in the evening. From the
 * left: a red pillar box under the wall clock, a wall of brass P.O. boxes
 * (you stand in front of it), then the green counter with an envelope on its
 * front and a wooden top where handed-over things rest. Behind it: an airmail
 * poster, parcels waiting on the back counter, the sorting pigeonholes behind
 * the clerk and the parcel scale. Painted through the Painter interface,
 * palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a long shelf of parcels, two big
 * stamps, the "POST" sign and a route map, then a green upper wall with high
 * windows), the front door, writing desks and more P.O. boxes to the left,
 * shelves of parcels and mail trolleys to the right.
 */

/** The counter's left edge and the y of its top, in core pixels (props rest on it). */
const COUNTER = { x: 54, top: 40 } as const;
/** 24x24 pictures stand on the countertop with their shadow on it. */
const PROP_TOP = COUNTER.top - 20;

const FLOOR_TOP = 56;
/** Top of the green boards on the lower wall. */
const DADO_TOP = 44;
/** Top of the back counter behind the clerk. */
const BACK_TOP = 35;
/** Counter length past the core's right edge before it ends. */
const COUNTER_TAIL = 26;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The pendant lamps: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 32;
const LAMP_GAP = 48;
/** Wall above the core needed for the long shelf, for the sign, and for the green upper wall. */
const SHELF_MIN = 18;
const SIGN_MIN = 38;
const CORNICE_MIN = 56;
/** How far above the core the upper wall starts. */
const CORNICE_UP = 42;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A parcel's wrapping: body, shade, tape. */
type Wrap = readonly [PaletteName, PaletteName, PaletteName];

const WRAPS: readonly Wrap[] = [
  ['amber', 'ember', 'honey'],
  ['lamp', 'amber', 'paper'],
  ['paper', 'fog', 'sky'],
  ['amber', 'ember', 'paper'],
  ['sky', 'denim', 'paper'],
  ['lamp', 'amber', 'honey'],
  ['rosy', 'mauve', 'paper'],
];

function wrapAt(a: number, b: number): Wrap {
  return WRAPS[Math.floor(hash2(a, b, 23) * WRAPS.length)] ?? ['amber', 'ember', 'honey'];
}

/** Paints the post office to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const counterEnd = ox + CORE_W + COUNTER_TAIL;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;

  const lamps: number[] = [];
  const firstLamp = ox + LAMP_X - Math.ceil((ox + LAMP_X + 8) / LAMP_GAP) * LAMP_GAP;
  for (let x = firstLamp; x < w + 8; x += LAMP_GAP) lamps.push(x);

  paintWall(p, w, ox, floorTop, cornice);
  for (const lx of lamps) {
    lightPool(p, lx, oy + 15, 22, 20, [['skin', 0.45]], {
      y0: cornice + 3,
      y1: oy + DADO_TOP,
    });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) paintHighWindows(p, w, ox, cornice);
  if (oy >= SHELF_MIN) paintHighShelf(p, w, ox, oy - 5);
  if (oy >= SIGN_MIN) {
    // the first stamp only when the stage shows the whole of it
    if (ox >= 0) paintStamp(p, ox, oy - 35, 1);
    paintStamp(p, ox + 16, oy - 35, 0);
    paintSign(p, ox + 38, oy - 34);
    paintMap(p, ox + 84, oy - 34);
  }

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: the front door, writing desks and P.O. boxes to the
  // left; shelves of parcels and mail trolleys to the right.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintDoor(p, x + 7, oy + 10, floorTop);
    else if (i % 2 === 1) paintWindowDesk(p, x + 5, oy, i);
    else paintBoxBank(p, x + 5, oy + 12, 5, 4, i);
  }
  for (let x = ox + CORE_W + 4, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintParcelUnit(p, x, oy + 8, floorTop, i);
    else paintTrolleyBay(p, x, oy, floorTop);
  }

  if (ox + 2 >= 0) paintClock(p, ox + 6, oy + 21);
  paintMailbox(p, ox + 1, floorTop + 3);
  paintBoxBank(p, ox + 15, oy + 12, 5, 4, 0);

  // Behind the counter.
  paintAirmailPoster(p, ox + 59, oy + 11);
  paintBackCounter(p, ox + COUNTER.x, ox + CORE_W + 4, oy + BACK_TOP, oy + COUNTER.top);
  paintPigeonholes(p, ox + 95, oy + 6, 5, 3);
  for (const lx of lamps) paintLamp(p, lx, oy);

  paintCounter(p, ox + COUNTER.x, counterEnd, oy + COUNTER.top, oy + CORE_H, counterEnd < w);
  paintScale(p, ox + 114, oy + COUNTER.top);
  paintStampStand(p, ox + 131, oy + COUNTER.top);
  paintTape(p, ox + 143, oy + COUNTER.top, 'lamp', 'amber');
  paintTape(p, ox + 148, oy + COUNTER.top, 'paper', 'fog');
}

// ---------------------------------------------------------------------------
// Room

/**
 * The wall: warm plaster. On a tall stage a rail runs at `cornice` and the
 * wall above it is dark green with a small dot pattern.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'tan');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'moss');
    // dots, counted up from the rail so the pattern never shifts with the stage size
    for (let row = 0; cornice - 7 - row * 9 >= 5; row++) {
      const y = cornice - 7 - row * 9;
      for (let x = mod(ox + (row % 2) * 6, 12) - 12; x < w; x += 12) px(p, x, y, 'leaf');
    }
    ditherRect(p, 0, 0, w, 3, 'night', 8);
    p.rect(0, cornice, w, 1, 'honey');
    p.rect(0, cornice + 1, w, 1, 'amber');
    p.rect(0, cornice + 2, w, 1, 'ember');
  } else {
    ditherRect(p, 0, 0, w, 3, 'ember', 8);
  }
}

/** Green boards on the lower wall. */
function paintDado(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'leaf');
  p.rect(0, top, w, 1, 'moss');
  for (let x = mod(ox + 2, 6) - 6; x < w; x += 6) p.rect(x, top + 2, 1, floorTop - top - 4, 'moss');
  p.rect(0, floorTop - 2, w, 2, 'moss');
}

/** Chequered floor tiles. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'stone');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 1 + row * 4 < h; row++) {
    const y = floorTop + 1 + row * 4;
    for (let x = mod(ox + (row % 2) * 8, 16) - 16; x < w; x += 16) p.rect(x, y, 8, 4, 'slate');
  }
}

/** A pendant lamp with a green enamel shade, hanging from the ceiling (y 0) down to the core. */
function paintLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 1, 'ink');
  p.rect(cx - 1, oy + 1, 3, 1, 'moss');
  p.rect(cx - 3, oy + 2, 7, 1, 'leaf');
  p.rect(cx - 5, oy + 3, 11, 1, 'leaf');
  p.rect(cx - 6, oy + 4, 13, 1, 'moss');
  p.rect(cx - 2, oy + 5, 5, 1, 'honey');
  p.rect(cx - 1, oy + 6, 3, 1, 'lamp');
  px(p, cx - 2, oy + 2, 'honey');
}

// ---------------------------------------------------------------------------
// The lobby side

/** A red pillar box, 12 wide, standing at `foot`. */
function paintMailbox(p: Painter, x: number, foot: number): void {
  const top = foot - 27;
  p.rect(x + 3, top, 6, 1, 'red');
  p.rect(x + 1, top + 1, 10, 1, 'red');
  p.rect(x, top + 2, 12, 2, 'maroon');
  p.rect(x + 1, top + 4, 10, foot - top - 6, 'red');
  p.rect(x + 9, top + 4, 2, foot - top - 6, 'maroon');
  p.rect(x + 2, top + 5, 1, foot - top - 9, 'neon');
  // the slot under its hood
  p.rect(x + 2, top + 6, 8, 1, 'maroon');
  p.rect(x + 3, top + 7, 6, 2, 'ink');
  // collection times
  p.rect(x + 3, top + 11, 5, 5, 'paper');
  p.rect(x + 4, top + 12, 3, 1, 'stone');
  p.rect(x + 4, top + 14, 2, 1, 'stone');
  p.rect(x + 1, top + 19, 10, 1, 'maroon');
  p.rect(x, foot - 2, 12, 2, 'night');
}

/** A bank of brass P.O. boxes: `cols` x `rows` little doors, its top left door at (x, y). */
function paintBoxBank(
  p: Painter,
  x: number,
  y: number,
  cols: number,
  rows: number,
  seed: number,
): void {
  const w = cols * 7 + 1;
  const h = rows * 7 + 1;
  p.rect(x - 1, y - 1, w + 2, h + 2, 'ember');
  p.rect(x - 1, y - 1, w + 2, 1, 'amber');
  p.rect(x, y, w, h, 'plum');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = x + 1 + c * 7;
      const dy = y + 1 + r * 7;
      p.rect(dx, dy, 6, 6, 'amber');
      p.rect(dx, dy, 6, 1, 'lamp');
      p.rect(dx + 5, dy + 1, 1, 5, 'ember');
      p.rect(dx, dy + 5, 6, 1, 'ember');
      if (hash2(c + seed * 5, r, 7) < 0.3) {
        // a little window with a letter waiting behind it
        p.rect(dx + 1, dy + 2, 3, 2, 'night');
        px(p, dx + 2, dy + 3, 'paper');
      } else {
        p.rect(dx + 1, dy + 2, 2, 1, 'honey'); // the number plate
      }
      px(p, dx + 4, dy + 3, 'ink'); // the keyhole
    }
  }
  p.rect(x, y + h + 1, w + 1, 1, 'ember');
}

// ---------------------------------------------------------------------------
// Behind the counter

/** An envelope seen from the back: paper, a V flap and (on the sign) a red seal. */
function paintEnvelope(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  seal: boolean,
): void {
  p.rect(x, y, w, h, 'paper');
  p.rect(x, y + h - 1, w, 1, 'fog');
  for (let i = 1; i < w - 1; i++) {
    const d = Math.min(i, w - 1 - i);
    px(p, x + i, y + 1 + Math.floor((d - 1) / 2), 'stone');
  }
  const mid = Math.floor(w / 2);
  if (seal) px(p, x + mid, y + 2 + Math.floor((mid - 1) / 2), 'red');
}

/** An airmail poster: red and blue dashes round the edge, a plane on blue. */
function paintAirmailPoster(p: Painter, x: number, y: number): void {
  const w = 13;
  const h = 17;
  p.rect(x, y, w, h, 'paper');
  for (let i = 0; i < w; i += 2) {
    const c: PaletteName = i % 4 === 0 ? 'red' : 'denim';
    px(p, x + i, y, c);
    px(p, x + i, y + h - 1, c);
  }
  for (let j = 0; j < h; j += 2) {
    const c: PaletteName = j % 4 === 0 ? 'red' : 'denim';
    px(p, x, y + j, c);
    px(p, x + w - 1, y + j, c);
  }
  p.rect(x + 2, y + 2, 9, 9, 'sky');
  p.rect(x + 3, y + 6, 7, 1, 'paper');
  p.rect(x + 6, y + 4, 1, 5, 'paper');
  p.rect(x + 7, y + 5, 1, 3, 'paper');
  px(p, x + 3, y + 5, 'paper');
  p.rect(x + 3, y + 12, 7, 1, 'stone');
  p.rect(x + 3, y + 14, 5, 1, 'fog');
  p.rect(x + 1, y + h, w, 1, 'ember');
}

/** One parcel standing on `bottom`: taped across the lid, or tied both ways when it is big. */
function paintParcel(
  p: Painter,
  x: number,
  bottom: number,
  w: number,
  h: number,
  [body, shade, tape]: Wrap,
): void {
  const top = bottom - h;
  p.rect(x, top, w, h, body);
  p.rect(x + w - 1, top, 1, h, shade);
  p.rect(x, bottom - 1, w, 1, shade);
  if (w < 7) {
    p.rect(x, top, w - 1, 1, tape);
    return;
  }
  p.rect(x + Math.floor(w / 2), top, 1, h - 1, tape);
  if (h >= 6) p.rect(x, top + Math.floor(h / 2) - 1, w - 1, 1, tape);
  else if (h >= 4) px(p, x + 1, top + 1, body === 'paper' ? 'stone' : 'paper');
}

/** Parcels of mixed sizes side by side on a shelf, from x0 to x1, at most maxH tall. */
function paintParcelRow(
  p: Painter,
  x0: number,
  x1: number,
  bottom: number,
  maxH: number,
  seed: number,
): void {
  let x = x0;
  for (let i = 0; x + 5 <= x1; i++) {
    const pw = Math.min(x1 - x, 6 + Math.floor(hash2(i, seed, 11) * 6));
    const ph = 3 + Math.floor(hash2(i, seed, 13) * (Math.min(maxH, pw) - 2));
    if (hash2(i, seed, 17) > 0.18) {
      paintParcel(p, x, bottom, pw, ph, wrapAt(i, seed));
      // sometimes a flat one on top
      if (pw >= 8 && ph + 3 <= maxH && hash2(i, seed, 41) > 0.5) {
        paintParcel(p, x + 1, bottom - ph, pw - 3, 3, wrapAt(i + 50, seed));
      }
    }
    x += pw + 1 + Math.floor(hash2(i, seed, 19) * 3);
  }
}

/** The parcels waiting on the back counter: [dx, width, height, wrapping]. */
const WAITING: readonly (readonly [number, number, number, number])[] = [
  [3, 8, 5, 0],
  [12, 6, 4, 2],
  [21, 9, 6, 3],
  [31, 7, 7, 4],
];

/** The back counter behind the clerk, from x0 to x1, with parcels waiting on it. */
function paintBackCounter(p: Painter, x0: number, x1: number, top: number, bottom: number): void {
  for (const [dx, pw, ph, wrap] of WAITING) {
    paintParcel(p, x0 + dx, top, pw, ph, WRAPS[wrap] ?? ['amber', 'ember', 'honey']);
  }
  p.rect(x0, top, x1 - x0, 1, 'amber');
  p.rect(x0, top + 1, x1 - x0, bottom - top - 1, 'ember');
}

/** Colours of the letters in the pigeonholes. */
const LETTERS: readonly PaletteName[] = ['paper', 'fog', 'paper', 'honey', 'paper', 'sky', 'rosy'];

/** The sorting pigeonholes: a wooden grid with letters lying in the holes. */
function paintPigeonholes(p: Painter, x: number, y: number, cols: number, rows: number): void {
  const w = cols * 6 + 1;
  const h = rows * 7 + 1;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hx = x + 1 + c * 6;
      const hy = y + 1 + r * 7;
      p.rect(hx, hy, 5, 6, 'plum');
      const n = Math.floor(hash2(c, r, 29) * 4);
      for (let k = 0; k < n; k++) {
        const lw = 3 + Math.floor(hash2(c * 7 + k, r, 31) * 3);
        const color = LETTERS[Math.floor(hash2(c * 7 + k, r, 37) * LETTERS.length)] ?? 'paper';
        p.rect(hx, hy + 5 - k, lw, 1, color);
      }
    }
  }
  p.rect(x + 1, y + h, w, 1, 'ember');
}

// ---------------------------------------------------------------------------
// The counter and what stands on it

/** The serving counter from x0 to x1: a wooden top, green panels and an envelope on the front. */
function paintCounter(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top + 4, w, bottom - top - 4, 'moss');
  const panelTop = top + 7;
  const panelH = bottom - 6 - panelTop;
  const panel = (x: number, pw: number): void => {
    p.rect(x, panelTop, pw, 1, 'leaf');
    p.rect(x, panelTop, 1, panelH, 'leaf');
    p.rect(x, panelTop + panelH - 1, pw, 1, 'night');
    p.rect(x + pw - 1, panelTop, 1, panelH, 'night');
  };
  panel(x0 + 3, 14);
  panel(x0 + 19, 21);
  paintEnvelope(p, x0 + 22, panelTop + 2, 15, panelH - 4, false);
  p.rect(x0 + 23, panelTop + panelH - 2, 15, 1, 'night');
  for (let x = x0 + 42; x + 14 <= x1 - 2; x += 16) panel(x, 14);
  if (endsInView) p.rect(x1 - 1, top + 4, 1, bottom - top - 4, 'night');
  // a brass kick rail and a dark plinth
  p.rect(x0, bottom - 4, w, 1, 'lamp');
  p.rect(x0, bottom - 3, w, 3, 'night');
  // the wooden top, a pixel proud of the front
  p.rect(x0 - 1, top, w + 1, 1, 'honey');
  p.rect(x0 - 1, top + 1, w + 1, 2, 'amber');
  p.rect(x0 - 1, top + 3, w + 1, 1, 'ember');
  p.rect(x0, bottom, w, 1, 'ink'); // its shadow on a deeper floor
}

/** The parcel scale on the counter (its base at `base`): a pan with a parcel on it, a round dial. */
function paintScale(p: Painter, x: number, base: number): void {
  p.rect(x, base - 2, 14, 2, 'slate');
  p.rect(x, base - 2, 14, 1, 'stone');
  p.rect(x + 4, base - 3, 2, 1, 'stone');
  p.rect(x, base - 4, 10, 1, 'fog');
  paintParcel(p, x + 1, base - 4, 8, 6, ['amber', 'ember', 'honey']);
  // the dial on its post
  p.rect(x + 11, base - 7, 1, 5, 'stone');
  p.rect(x + 10, base - 12, 3, 5, 'ink');
  p.rect(x + 9, base - 11, 5, 3, 'ink');
  p.rect(x + 10, base - 11, 3, 3, 'paper');
  px(p, x + 11, base - 10, 'red');
  px(p, x + 11, base - 11, 'red');
}

/** Stamps on the card: nine little pictures. */
const STAMP_COLOURS: readonly PaletteName[] = [
  'red',
  'teal',
  'lamp',
  'violet',
  'leaf',
  'neon',
  'sky',
  'maroon',
  'amber',
];

/** A card of stamps for sale on a little stand, on the counter at `base`. */
function paintStampStand(p: Painter, x: number, base: number): void {
  p.rect(x, base - 12, 10, 11, 'paper');
  p.rect(x + 9, base - 12, 1, 11, 'fog');
  STAMP_COLOURS.forEach((color, i) => {
    p.rect(x + 1 + (i % 3) * 3, base - 11 + Math.floor(i / 3) * 3, 2, 2, color);
  });
  p.rect(x + 2, base - 1, 6, 1, 'stone');
}

/** A roll of packing tape standing on the counter at `base`. */
function paintTape(
  p: Painter,
  x: number,
  base: number,
  color: PaletteName,
  shade: PaletteName,
): void {
  p.rect(x + 1, base - 5, 3, 5, color);
  p.rect(x, base - 4, 5, 3, color);
  p.rect(x + 1, base - 1, 3, 1, shade);
  px(p, x + 4, base - 2, shade);
  px(p, x + 2, base - 3, 'ink');
}

// ---------------------------------------------------------------------------
// Above the core

/** A long shelf of parcels along the wall, its top at `y`; the lamp cords hang between the piles. */
function paintHighShelf(p: Painter, w: number, ox: number, y: number): void {
  const first = Math.floor(-(ox + LAMP_X) / LAMP_GAP) - 1;
  for (let k = first; ox + LAMP_X + k * LAMP_GAP < w; k++) {
    const x = ox + LAMP_X + k * LAMP_GAP;
    paintParcelRow(p, x + 3, x + LAMP_GAP - 2, y, 11, 100 + k);
  }
  p.rect(0, y, w, 1, 'amber');
  p.rect(0, y + 1, w, 1, 'ember');
  for (let x = mod(ox + 8, 24) - 24; x < w; x += 24) p.rect(x, y + 2, 1, 2, 'ember');
}

/** "POST" in 3x5 pixel letters. */
const POST: readonly (readonly string[])[] = [
  ['###', '#.#', '###', '#..', '#..'],
  ['###', '#.#', '#.#', '#.#', '###'],
  ['###', '#..', '###', '..#', '###'],
  ['###', '.#.', '.#.', '.#.', '.#.'],
];

/** The office's sign: a red board with an envelope and "POST". */
function paintSign(p: Painter, x: number, y: number): void {
  const w = 36;
  const h = 13;
  p.rect(x, y, w, h, 'maroon');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'red');
  p.rect(x + 1, y + h, w, 1, 'ember');
  paintEnvelope(p, x + 3, y + 3, 11, 7, true);
  POST.forEach((rows, i) => {
    rows.forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        if (row[xx] === '#') px(p, x + 17 + i * 4 + xx, y + 4 + yy, 'paper');
      }
    });
  });
}

/** A framed map with a dotted route across the sea: where the parcels go. */
function paintMap(p: Painter, x: number, y: number): void {
  const w = 28;
  const h = 13;
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'sky');
  p.rect(x + 1, y + h, w, 1, 'ember');
  // land
  p.rect(x + 3, y + 3, 5, 3, 'leaf');
  p.rect(x + 5, y + 6, 3, 4, 'leaf');
  p.rect(x + 12, y + 2, 4, 3, 'leaf');
  p.rect(x + 13, y + 5, 3, 5, 'leaf');
  p.rect(x + 17, y + 2, 8, 4, 'leaf');
  p.rect(x + 19, y + 6, 3, 1, 'leaf');
  p.rect(x + 22, y + 9, 3, 2, 'leaf');
  // the route
  px(p, x + 6, y + 4, 'paper');
  for (let i = 0; i < 8; i++)
    px(p, x + 8 + i * 2, y + 7 - Math.floor(Math.abs(i - 3.5) / 2), 'red');
  px(p, x + 24, y + 7, 'paper');
}

/** A big stamp as a poster: a toothed paper edge round a little picture. */
function paintStamp(p: Painter, x: number, y: number, kind: number): void {
  const w = 14;
  const h = 16;
  p.rect(x + 1, y + h, w, 1, 'ember');
  p.rect(x, y, w, h, 'paper');
  for (let i = 1; i < w; i += 2) {
    px(p, x + i, y, 'tan');
    px(p, x + i, y + h - 1, 'tan');
  }
  for (let j = 1; j < h; j += 2) {
    px(p, x, y + j, 'tan');
    px(p, x + w - 1, y + j, 'tan');
  }
  if (kind === 0) {
    // a hill at sunset
    ditherGradient(p, x + 2, y + 2, w - 4, 9, ['violet', 'rosy', 'honey']);
    p.rect(x + 2, y + 9, w - 4, 2, 'moss');
    p.rect(x + 5, y + 8, 5, 1, 'moss');
    px(p, x + 9, y + 4, 'paper');
  } else {
    // a red flower on blue
    p.rect(x + 2, y + 2, w - 4, 9, 'teal');
    p.rect(x + 6, y + 3, 2, 5, 'red');
    p.rect(x + 5, y + 4, 4, 3, 'red');
    px(p, x + 6, y + 5, 'honey');
    p.rect(x + 7, y + 8, 1, 3, 'leaf');
    px(p, x + 8, y + 9, 'leaf');
  }
  p.rect(x + 2, y + 12, 4, 1, 'stone');
  p.rect(x + 9, y + 12, 3, 2, 'red');
}

/** High windows in the green upper wall, one in every other gap between the lamp cords. */
function paintHighWindows(p: Painter, w: number, ox: number, cornice: number): void {
  const wh = Math.min(60, cornice - 14);
  if (wh < 26) return;
  const top = Math.floor((cornice - wh) / 2);
  const step = LAMP_GAP * 2;
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 20) / step);
  for (let k = first; centre + k * step - 20 < w; k++) {
    paintHighWindow(p, centre + k * step, top, wh, k);
  }
}

/** One high window centred on `cx`: the dusk sky over dark rooftops. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  p.rect(cx - 16, top, 33, wh, 'tan');
  ditherGradient(p, cx - 14, top + 2, 29, wh - 4, ['deep', 'indigo', 'dusk', 'violet']);
  for (let i = 0; i < 6; i++) {
    const sx = cx - 13 + Math.floor(hash2(i, n, 41) * 27);
    const sy = top + 3 + Math.floor(hash2(i, n, 43) * Math.max(1, wh - 18));
    px(p, sx, sy, hash2(i, n, 47) > 0.6 ? 'honey' : 'fog');
  }
  for (let i = 0; i < 4; i++) {
    const bh = 3 + Math.floor(hash2(i, n, 53) * 6);
    const bx = cx - 14 + i * 7;
    p.rect(bx, top + wh - 2 - bh, i === 3 ? 8 : 7, bh, 'night');
    if (hash2(i, n, 59) > 0.35) px(p, bx + 2 + (i % 3), top + wh - bh, 'honey');
  }
  p.rect(cx - 5, top + 2, 1, wh - 4, 'tan');
  p.rect(cx + 5, top + 2, 1, wh - 4, 'tan');
  p.rect(cx - 14, top + 2 + Math.floor((wh - 4) / 3), 29, 1, 'tan');
  p.rect(cx - 18, top + wh, 37, 1, 'skin');
  p.rect(cx - 17, top + wh + 1, 35, 1, 'night');
}

// ---------------------------------------------------------------------------
// Beside the core

/** The front door: two glazed leaves onto the evening street, brass handles and kick plates. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 30;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'ember');
  p.rect(x, top, w, 1, 'amber');
  for (const dx of [2, 16]) {
    ditherGradient(p, x + dx, top + 3, 12, h - 12, ['deep', 'indigo', 'dusk']);
    p.rect(x + dx, floorTop - 14, 12, 1, 'night'); // the far kerb
    p.rect(x + dx + 1, floorTop - 7, 10, 4, 'lamp');
    p.rect(x + dx + 1, floorTop - 4, 10, 1, 'amber');
  }
  px(p, x + 5, top + 12, 'honey');
  px(p, x + 10, top + 19, 'lamp');
  px(p, x + 21, top + 9, 'honey');
  px(p, x + 25, top + 22, 'honey');
  p.rect(x + 12, top + 20, 1, 6, 'honey');
  p.rect(x + 17, top + 20, 1, 6, 'honey');
  // the opening hours card
  p.rect(x + 19, top + 5, 6, 4, 'paper');
  p.rect(x + 20, top + 6, 4, 1, 'red');
}

/** A window onto the street with a writing desk under it: forms and a pen pot. */
function paintWindowDesk(p: Painter, x: number, oy: number, i: number): void {
  const top = oy + 11;
  const w = 34;
  const h = 24;
  p.rect(x, top, w, h, 'ember');
  ditherGradient(p, x + 2, top + 2, w - 4, h - 4, ['deep', 'indigo', 'dusk', 'violet']);
  for (let b = 0; b < 5; b++) {
    const bh = 3 + Math.floor(hash2(i, b, 61) * 6);
    p.rect(x + 2 + b * 6, top + h - 2 - bh, 6, bh, 'night');
    if (hash2(i, b, 67) > 0.3) px(p, x + 4 + b * 6, top + h - bh, 'honey');
  }
  px(p, x + 6, top + 5, 'fog');
  px(p, x + 24, top + 4, 'fog');
  p.rect(x + 17, top + 2, 1, h - 4, 'ember');
  p.rect(x - 1, top + h, w + 2, 1, 'amber');
  p.rect(x - 1, top + h + 1, w + 2, 1, 'ember');
  // the desk
  const dy = oy + 41;
  p.rect(x + 6, dy - 1, 6, 1, 'paper');
  p.rect(x + 14, dy - 1, 5, 1, 'paper');
  p.rect(x + 25, dy - 3, 3, 3, 'teal');
  px(p, x + 26, dy - 5, 'ink');
  px(p, x + 26, dy - 4, 'ink');
  px(p, x + 27, dy - 4, 'red');
  p.rect(x + 1, dy, 32, 1, 'honey');
  p.rect(x + 1, dy + 1, 32, 1, 'amber');
  p.rect(x + 1, dy + 2, 32, 1, 'ember');
  p.rect(x + 4, dy + 3, 1, 3, 'ember');
  p.rect(x + 29, dy + 3, 1, 3, 'ember');
}

/** A wooden shelf unit full of parcels, 38 wide. */
function paintParcelUnit(p: Painter, x: number, top: number, floorTop: number, i: number): void {
  const w = 38;
  p.rect(x, top, w, floorTop - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, floorTop - top - 4, 'plum');
  for (let sy = top + 12, r = 0; sy <= floorTop - 3; sy += 11, r++) {
    paintParcelRow(p, x + 3, x + w - 3, sy, 8, i * 16 + r + 1);
    p.rect(x + 2, sy, w - 4, 1, 'amber');
    if (sy + 1 < floorTop - 2) p.rect(x + 2, sy + 1, w - 4, 1, 'night');
  }
}

/** A canvas mail trolley under a notice board. */
function paintTrolleyBay(p: Painter, x: number, oy: number, floorTop: number): void {
  // the notice board: cork, pinned notes
  p.rect(x + 6, oy + 12, 26, 18, 'ember');
  p.rect(x + 7, oy + 13, 24, 16, 'amber');
  p.rect(x + 9, oy + 15, 7, 9, 'paper');
  p.rect(x + 10, oy + 17, 5, 1, 'stone');
  p.rect(x + 10, oy + 19, 4, 1, 'fog');
  p.rect(x + 18, oy + 14, 6, 5, 'sky');
  p.rect(x + 25, oy + 16, 5, 7, 'honey');
  p.rect(x + 18, oy + 21, 6, 6, 'rosy');
  for (const [nx, ny] of [
    [12, 15],
    [21, 14],
    [27, 16],
    [20, 21],
  ] as const) {
    px(p, x + nx, oy + ny, 'red');
  }
  // the trolley
  const foot = floorTop + 3;
  paintParcel(p, x + 8, foot - 16, 8, 5, ['amber', 'ember', 'honey']);
  p.rect(x + 18, foot - 19, 7, 3, 'paper');
  p.rect(x + 18, foot - 17, 7, 1, 'fog');
  p.rect(x + 24, foot - 18, 6, 2, 'sky');
  p.rect(x + 5, foot - 15, 28, 12, 'fog');
  p.rect(x + 4, foot - 16, 30, 1, 'stone');
  p.rect(x + 31, foot - 15, 2, 12, 'concrete');
  p.rect(x + 5, foot - 4, 28, 1, 'concrete');
  p.rect(x + 5, foot - 11, 28, 2, 'red');
  p.rect(x + 34, foot - 20, 1, 5, 'stone');
  p.rect(x + 33, foot - 20, 1, 1, 'stone');
  p.rect(x + 8, foot - 3, 3, 3, 'ink');
  p.rect(x + 27, foot - 3, 3, 3, 'ink');
}

// ---------------------------------------------------------------------------
// The postal clerk: 16x24, facing left. A tidy man in his forties: short dark
// grey hair going thin at the front, glasses, a mustard uniform shirt with a
// maroon tie and a name badge, dark trousers. Only the top part shows above
// the counter; the legs are there so the sprite can bob without a gap at the
// counter line.

const POSTAL_CLERK_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......sshhh.....',
    '.....ssshHhhh...',
    '....ssshhhhhh...',
    '....sssshhhhh...',
    '...sLeLggshhh...',
    '....mmssssh.....',
    '....ssssss......',
    '......sss.......',
    '.....wwyyyyy....',
    '....yytyyyyyy...',
    '...yyytyynnyya..',
    '...yyytyyyyyya..',
    '...aaytyyyyyya..',
    '...ssytyyyyyya..',
    '...ssyyyyyyyya..',
    '...ssyyyyyyyya..',
    '...ssyyyyyyyya..',
    '....yyyyyyyyya..',
    '....bbbbbbbbbb..',
    '....dddddddddd..',
    '.....ddd..qqq...',
    '.....ddd..qqq...',
    '....kkkk..kkk...',
  ],
  legend: {
    h: 'slate',
    H: 'concrete',
    s: 'skin',
    e: 'ink',
    L: 'paper',
    g: 'stone',
    m: 'slate',
    w: 'paper',
    y: 'honey',
    a: 'lamp',
    t: 'maroon',
    n: 'paper',
    b: 'ink',
    d: 'slate',
    q: 'night',
    k: 'ink',
  },
};

export const POST_OFFICE_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    postal_clerk: {
      sprite: POSTAL_CLERK_SPRITE,
      x: 96,
      y: 19,
      side: 'right',
      clipBottom: COUNTER.top,
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: {
    left: { x: COUNTER.x, y: PROP_TOP },
    // Stops short of the clerk, so a prop stays clear of his face and his arm.
    right: { x: COUNTER.x + 21, y: PROP_TOP },
  },
};
