import {
  ditherGradient,
  ditherRect,
  ellipse,
  hash2,
  lightPool,
  paintSprite,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import {
  clipped,
  paintFloor,
  paintLamp,
  paintPicture,
  paintWainscot,
  paintWindow,
} from '../stage/common';
import type { PictureFn } from './index';

/**
 * Pictures for the 看圖選句 questions of Act 1: one or two people doing one thing, so
 * the sentence can be read off the picture. Each fills the 96x64 frame. The people are
 * the stage characters drawn larger (a 12 pixel head, about 38 pixels standing), seen
 * from the side, with an ink rim so they stand out from the room behind them.
 */

const W = 96;
const H = 64;

// ---------------------------------------------------------------------------
// A sheet: shapes are collected first, then painted with a rim around them, so
// a figure made of many parts gets one outline.

// With `flip`, everything is mirrored left to right: x becomes flip - x. A figure whose
// head starts at hx keeps its place and turns to face left with flip = 2 * hx + 11.

interface Sheet extends Painter {
  /** Paints a part on top; pixels already on the sheet that touch it turn to `edge`. */
  part(edge: PaletteName, draw: (p: Painter) => void): void;
  /** Paints the sheet with a one pixel rim around everything on it. */
  flush(p: Painter, rim?: PaletteName): void;
}

const NEAR: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function sheet(flip?: number): Sheet {
  const cells = new Map<number, PaletteName>();
  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
  const filler =
    (target: Map<number, PaletteName>): Painter['rect'] =>
    (x, y, w, h, color) => {
      const left = flip === undefined ? x : flip - (x + w - 1);
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = left; xx < left + w; xx++) {
          if (inside(xx, yy)) target.set(yy * W + xx, color);
        }
      }
    };
  /** Calls `visit` for every neighbour of a cell that is inside the frame. */
  const around = (key: number, visit: (neighbour: number) => void): void => {
    const x = key % W;
    const y = (key - x) / W;
    for (const [dx, dy] of NEAR) if (inside(x + dx, y + dy)) visit((y + dy) * W + x + dx);
  };
  return {
    rect: filler(cells),
    part(edge, draw) {
      const top = new Map<number, PaletteName>();
      draw({ rect: filler(top) });
      for (const key of top.keys()) {
        around(key, (n) => {
          if (!top.has(n) && cells.has(n)) cells.set(n, edge);
        });
      }
      for (const [key, color] of top) cells.set(key, color);
    },
    flush(p, rim = 'ink') {
      const edge = new Set<number>();
      for (const key of cells.keys()) {
        around(key, (n) => {
          if (!cells.has(n)) edge.add(n);
        });
      }
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const key = y * W + x;
          const color = cells.get(key) ?? (edge.has(key) ? rim : undefined);
          if (color) px(p, x, y, color);
        }
      }
    },
  };
}

/** A straight line of `t` x `t` dots from (x0, y0) to (x1, y1). */
function line(
  p: Painter,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: PaletteName,
  t = 1,
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  const back = Math.floor((t - 1) / 2);
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    p.rect(x - back, y - back, t, t, color);
    if (x === x1 && y === y1) return;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

// ---------------------------------------------------------------------------
// Heads: 12 wide, facing right. h hair, H hair light, s skin, t skin shade,
// e eye, m mouth, o open mouth, r blush.

type Legend = Record<string, PaletteName>;
type Point = readonly [x: number, y: number, ch: string];

function stamp(rows: readonly string[], points: readonly Point[]): string[] {
  const grid = rows.map((row) => [...row]);
  for (const [x, y, ch] of points) {
    const row = grid[y];
    if (row && x >= 0 && x < row.length) row[x] = ch;
  }
  return grid.map((row) => row.join(''));
}

const MAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhhh.',
  '.hhHHhhhhhh.',
  '.hhhhhhhhhh.',
  '.hhhhhsssss.',
  '.hhhsssssss.',
  '.hhtssssess.',
  '.hhtssssess.',
  '..hsssssssss',
  '...ssssssss.',
  '...tssssmm..',
  '....tssss...',
];

/** Long hair down to the shoulders. */
const WOMAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhhh.',
  '.hhHHhhhhhh.',
  'hhhhhhhhhhhh',
  'hhhhhhhhhssh',
  'hhhhhhsssss.',
  'hhhhhsssess.',
  'hhhhhsssess.',
  'hhhhhsssssss',
  'hhhhhsrssss.',
  'hhhhhhssmm..',
  'hhhhhh.sss..',
  'hhhhh.......',
  '.hhhh.......',
  '.hhh........',
];

/** Hair pinned up: the bun or the pigtail is painted beside it. */
const UPDO_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhhh.',
  '.hhHHhhhhhh.',
  'hhhhhhhhhhhh',
  'hhhhhhhhhssh',
  'hhhhhhsssss.',
  '.hhhhsssess.',
  '.hhhtsssess.',
  '..hhtsssssss',
  '...ssrsssss.',
  '...tssssmm..',
  '....tssss...',
];

const EYES_SHUT: readonly Point[] = [
  [8, 6, 's'],
  [7, 7, 'e'],
];
const MOUTH_OPEN: readonly Point[] = [
  [8, 9, 'o'],
  [9, 9, 'o'],
  [8, 10, 'o'],
  [9, 10, 'o'],
];

const DARK_HAIR: Legend = {
  h: 'ink',
  H: 'stone',
  s: 'skin',
  t: 'tan',
  e: 'ink',
  m: 'ember',
  o: 'maroon',
  r: 'rosy',
};
const BROWN_HAIR: Legend = { ...DARK_HAIR, h: 'ember', H: 'amber' };
const GREY_HAIR: Legend = { ...DARK_HAIR, h: 'fog', H: 'paper' };

function head(rows: readonly string[], legend: Legend, woman = false): PixelSprite {
  return { rows, legend: woman ? { ...legend, m: 'red' } : legend };
}

/** A head lying on its back: the crown to the left, the nose up. */
function lying(rows: readonly string[]): string[] {
  return Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: rows.length }, (_, c) => rows[c]?.[11 - r] ?? '.').join(''),
  );
}

interface Look {
  top: PaletteName;
  topShade: PaletteName;
  legs: PaletteName;
  legsShade: PaletteName;
}

// ---------------------------------------------------------------------------
// Bodies. (hx, hy) is the top left of the 12 wide head; the figure faces right.

/**
 * A person standing: neck, upper body, legs and shoes (arms and head come after).
 * `coat` lengthens the upper body below the waist; `wide` gives broader shoulders.
 */
function standBody(
  s: Sheet,
  hx: number,
  hy: number,
  look: Look,
  opts: { coat?: number; wide?: boolean } = {},
): void {
  const top = hy + 13;
  const coat = opts.coat ?? 0;
  const x0 = opts.wide ? hx + 1 : hx + 2;
  const w = opts.wide ? 10 : 9;
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 3, top + 12, 3, 11, look.legsShade);
  s.rect(hx + 6, top + 12, 3, 11, look.legs);
  s.rect(hx + 3, top + 23, 3, 2, 'ink');
  s.rect(hx + 6, top + 23, 5, 2, 'ink');
  s.rect(x0, top, w, 12 + coat, look.top);
  s.rect(x0, top, 2, 12 + coat, look.topShade);
  if (coat > 0) {
    s.rect(x0 - 1, top + 9, 1, 3 + coat, look.topShade);
    s.rect(x0 + w, top + 9, 1, 3 + coat, look.top);
  }
}

/** A person sitting on a wooden chair: chair, legs, upper body. */
function sitBody(s: Sheet, hx: number, hy: number, look: Look, skirt = false): void {
  const seat = hy + 31;
  // chair
  s.rect(hx - 2, hy + 15, 2, 27, 'ember');
  s.rect(hx - 2, seat, 20, 2, 'amber');
  s.rect(hx + 13, seat + 2, 2, 9, 'ember');
  // legs: the far one a step behind
  s.rect(hx + 15, seat, 3, 9, skirt ? 'tan' : look.legsShade);
  s.rect(hx + 15, seat + 9, 5, 2, 'ink');
  s.rect(hx + 3, seat - 6, 19, 6, look.legs);
  s.rect(hx + 3, seat - 1, 15, 1, look.legsShade);
  s.rect(hx + 19, seat, 3, 9, skirt ? 'skin' : look.legs);
  s.rect(hx + 19, seat + 9, 5, 2, 'ink');
  // upper body
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 2, hy + 13, 9, 13, look.top);
  s.rect(hx + 2, hy + 13, 2, 13, look.topShade);
}

/** A child standing: a short body under the same big head. */
function kidBody(s: Sheet, hx: number, hy: number, look: Look, dress = false): void {
  const top = hy + 13;
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 3, top + 8, 2, 6, 'tan');
  s.rect(hx + 7, top + 8, 2, 6, 'skin');
  s.rect(hx + 3, top + 14, 3, 2, 'ink');
  s.rect(hx + 7, top + 14, 4, 2, 'ink');
  s.rect(hx + 2, top, 8, 8, look.top);
  s.rect(hx + 2, top, 2, 8, look.topShade);
  if (dress) {
    s.rect(hx + 1, top + 6, 10, 4, look.top);
    s.rect(hx + 1, top + 6, 2, 4, look.topShade);
  } else {
    s.rect(hx + 2, top + 7, 8, 3, look.legs);
    s.rect(hx + 2, top + 7, 2, 3, look.legsShade);
  }
}

type Spot = readonly [x: number, y: number];

/** An arm from shoulder to elbow to hand, with a skin hand at the end. */
function arm(s: Sheet, look: Look, shoulder: Spot, elbow: Spot, hand: Spot): void {
  s.part(look.topShade, (p) => {
    line(p, shoulder[0], shoulder[1], elbow[0], elbow[1], look.top, 3);
    line(p, elbow[0], elbow[1], hand[0], hand[1], look.top, 3);
    p.rect(hand[0] - 1, hand[1] - 1, 3, 3, 'skin');
  });
}

/** The arm on the far side, painted before the body so the body covers its shoulder. */
function farArm(s: Sheet, look: Look, shoulder: Spot, elbow: Spot, hand: Spot): void {
  line(s, shoulder[0], shoulder[1], elbow[0], elbow[1], look.topShade, 3);
  line(s, elbow[0], elbow[1], hand[0], hand[1], look.topShade, 3);
  s.rect(hand[0] - 1, hand[1] - 1, 3, 3, 'tan');
}

// ---------------------------------------------------------------------------
// Rooms and streets

const FLOOR_TOP = 50;

/** A room in the evening: lit wall, wooden boards on the lower wall, plank floor. */
function paintRoom(p: Painter, lightX: number): void {
  p.rect(0, 0, W, FLOOR_TOP, 'concrete');
  ditherRect(p, 0, 0, W, 3, 'stone', 8);
  lightPool(p, lightX, 18, 30, 20, [['fog', 0.6]], { y0: 3, y1: 38 });
  paintWainscot(p, W, 38, FLOOR_TOP);
  paintFloor(p, W, FLOOR_TOP, H);
}

/** The street at dusk: sky, far roofs, pavement, and a strip of road when asked. */
function paintStreet(p: Painter, pavementTop: number, road = false): void {
  ditherGradient(p, 0, 0, W, pavementTop, ['indigo', 'dusk', 'violet', 'mauve', 'rosy']);
  const roofs: readonly (readonly [number, number, number])[] = [
    [0, 14, 20],
    [14, 22, 13],
    [36, 12, 9],
    [48, 20, 16],
    [68, 10, 8],
    [78, 18, 14],
  ];
  for (const [x, w, h] of roofs) {
    p.rect(x, pavementTop - h, w, h, 'violet');
    p.rect(x, pavementTop - h, w, 1, 'dusk');
    for (let i = 0; i < 3; i++) {
      const wx = x + 2 + ((i * 5 + x) % Math.max(1, w - 4));
      const wy = pavementTop - h + 3 + ((i * 7 + x) % Math.max(1, h - 5));
      p.rect(wx, wy, 2, 2, i === 1 ? 'honey' : 'dusk');
    }
  }
  const roadTop = road ? H - 6 : H;
  p.rect(0, pavementTop, W, roadTop - pavementTop, 'concrete');
  p.rect(0, pavementTop, W, 1, 'fog');
  for (let x = 7; x < W; x += 18) p.rect(x, pavementTop + 1, 1, roadTop - pavementTop - 1, 'stone');
  p.rect(0, pavementTop + 7, W, 1, 'stone');
  if (road) {
    p.rect(0, roadTop - 1, W, 1, 'fog');
    p.rect(0, roadTop, W, 6, 'slate');
    p.rect(0, roadTop, W, 1, 'night');
    for (let x = 4; x < W; x += 20) p.rect(x, roadTop + 3, 9, 1, 'fog');
  }
}

// ---------------------------------------------------------------------------
// Things

/** An open book held up, its pages toward us: (cx, top) is the top of the fold. */
function openBook(s: Painter, cx: number, top: number): void {
  for (let dx = -8; dx <= 8; dx++) {
    const far = Math.abs(dx);
    const x = cx + dx;
    const y = top - Math.floor(far / 3);
    s.rect(x, y, 1, 11, far === 8 ? 'red' : 'paper');
    s.rect(x, y + 11, 1, 1, 'red');
    if (dx === 0) s.rect(x, y, 1, 11, 'fog');
    else if (far > 1 && far < 7) {
      for (let row = 2; row < 10; row += 2) s.rect(x, y + row, 1, 1, 'concrete');
    }
  }
}

const TABLE_TOP = 31;

/**
 * A table seen a little from above: its top from `y` down to the front edge (always at
 * the same height), then legs to the floor.
 */
function paintTable(
  s: Painter,
  x0: number,
  x1: number,
  top: PaletteName,
  light: PaletteName,
  edge: PaletteName,
  y = TABLE_TOP,
): void {
  s.rect(x0, y, x1 - x0, TABLE_TOP + 9 - y, top);
  s.rect(x0, y, x1 - x0, 1, light);
  s.rect(x0, TABLE_TOP + 9, x1 - x0, 2, edge);
  s.rect(x0 + 2, TABLE_TOP + 11, 2, 17, edge);
  s.rect(x1 - 4, TABLE_TOP + 11, 2, 17, edge);
}

/** Something flat lying on a table: each row sits half a pixel left of the one above. */
function flat(s: Painter, x: number, y: number, w: number, rows: number, color: PaletteName): void {
  for (let r = 0; r < rows; r++) s.rect(x + Math.floor((rows - 1 - r) / 2), y + r, w, 1, color);
}

/** A red apple, 5x5: a dip at the top with the stalk in it and a leaf beside. */
function apple(s: Painter, x: number, y: number): void {
  s.rect(x + 1, y, 3, 5, 'red');
  s.rect(x, y + 1, 5, 3, 'red');
  s.rect(x + 1, y + 1, 1, 1, 'honey');
  s.rect(x + 3, y + 3, 1, 1, 'maroon');
  s.rect(x + 2, y + 4, 2, 1, 'maroon');
  s.rect(x + 2, y - 1, 1, 2, 'ember');
  s.rect(x + 3, y - 1, 1, 1, 'leaf');
}

const NOTE: PixelSprite = {
  rows: ['..nnn', '..n.n', '..n..', '..n..', 'nnn..', 'nnn..'],
  legend: { n: 'honey' },
};
const NOTE_PAIR: PixelSprite = {
  rows: ['..nnnnnn', '..n....n', '..n....n', '..n....n', 'nnn..nnn', 'nnn..nnn'],
  legend: { n: 'cyan' },
};

/** A letter z, `size` pixels wide and tall. */
function zed(s: Painter, x: number, y: number, size: number): void {
  s.rect(x, y, size, 1, 'paper');
  s.rect(x, y + size - 1, size, 1, 'paper');
  for (let i = 1; i < size - 1; i++) s.rect(x + size - 1 - i, y + i, 1, 1, 'paper');
}

// ---------------------------------------------------------------------------
// The pictures

/** She is reading a book. */
const readingBook: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 40);
  paintWindow(p, 64, 5);
  paintLamp(p, 14, 0);

  const look: Look = { top: 'teal', topShade: 'moss', legs: 'mauve', legsShade: 'violet' };
  const hx = 22;
  const hy = 15;
  const s = sheet();
  sitBody(s, hx, hy, look, true);
  paintSprite(s, head(WOMAN_ROWS, DARK_HAIR, true), hx, hy);
  openBook(s, hx + 32, hy + 13);
  arm(s, look, [hx + 7, hy + 16], [hx + 13, hy + 24], [hx + 23, hy + 22]);
  s.flush(p);
};

/** He is drinking coffee. */
const drinkingCoffee: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 66);
  paintWindow(p, 64, 4);
  paintLamp(p, 50, 0);
  // a chalk board with a cup on it
  p.rect(3, 6, 16, 14, 'ember');
  p.rect(4, 7, 14, 12, 'moss');
  p.rect(4, 20, 14, 1, 'stone');
  p.rect(8, 12, 5, 4, 'paper');
  p.rect(13, 13, 2, 1, 'paper');
  p.rect(14, 14, 1, 1, 'paper');
  p.rect(13, 15, 1, 1, 'paper');
  p.rect(7, 17, 7, 1, 'paper');
  p.rect(9, 9, 1, 2, 'fog');
  p.rect(11, 9, 1, 2, 'fog');

  // a small round table with the saucer on it
  const t = sheet();
  ellipse(t, 64, 38, 15, 4, 'ember');
  ellipse(t, 64, 36, 15, 4, 'amber');
  t.rect(52, 33, 24, 1, 'honey');
  t.rect(63, 43, 3, 13, 'ember');
  t.rect(57, 56, 15, 2, 'ember');
  t.part('ember', (q) => {
    ellipse(q, 58, 36, 5, 1, 'paper');
    q.rect(55, 37, 7, 1, 'fog');
  });
  t.flush(p);

  const look: Look = { top: 'red', topShade: 'maroon', legs: 'denim', legsShade: 'indigo' };
  const hx = 18;
  const hy = 17;
  const s = sheet();
  sitBody(s, hx, hy, look);
  paintSprite(s, head(MAN_ROWS, BROWN_HAIR), hx, hy);
  // the cup at his lips
  s.part('ink', (q) => {
    q.rect(hx + 10, hy + 8, 6, 5, 'paper');
    q.rect(hx + 11, hy + 13, 4, 1, 'fog');
    q.rect(hx + 15, hy + 9, 1, 4, 'fog');
  });
  arm(s, look, [hx + 7, hy + 16], [hx + 15, hy + 21], [hx + 17, hy + 11]);
  s.flush(p);
  // steam
  for (const [x, y] of [
    [hx + 11, hy + 4],
    [hx + 12, hy + 3],
    [hx + 11, hy + 2],
    [hx + 12, hy + 1],
    [hx + 14, hy + 5],
    [hx + 15, hy + 4],
    [hx + 14, hy + 3],
  ] as const) {
    px(p, x, y, 'paper');
  }
};

/** She is waiting for the bus. */
const waitingBus: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintStreet(p, 44, true);

  // the bus stop: a sign with a bus on it and a timetable on the pole
  const sign = sheet();
  sign.rect(67, 18, 2, 39, 'fog');
  sign.rect(68, 18, 1, 39, 'concrete');
  sign.rect(59, 3, 18, 16, 'teal');
  sign.rect(60, 4, 16, 14, 'paper');
  sign.rect(61, 5, 14, 12, 'teal');
  sign.rect(64, 6, 8, 1, 'paper');
  sign.rect(63, 7, 10, 7, 'paper');
  sign.rect(64, 8, 4, 3, 'teal');
  sign.rect(69, 8, 3, 3, 'teal');
  sign.rect(64, 12, 1, 1, 'honey');
  sign.rect(71, 12, 1, 1, 'honey');
  sign.rect(64, 14, 2, 2, 'ink');
  sign.rect(70, 14, 2, 2, 'ink');
  sign.rect(64, 25, 8, 10, 'paper');
  for (let y = 27; y < 34; y += 2) sign.rect(65, y, 6, 1, 'concrete');
  sign.flush(p);

  const look: Look = { top: 'amber', topShade: 'ember', legs: 'denim', legsShade: 'indigo' };
  const hx = 32;
  const hy = 18;
  const s = sheet();
  standBody(s, hx, hy, look, { coat: 5 });
  s.rect(hx + 3, hy + 12, 7, 2, 'paper');
  s.rect(hx + 2, hy + 14, 2, 5, 'paper');
  paintSprite(s, head(WOMAN_ROWS.slice(0, 12), DARK_HAIR, true), hx, hy);
  // a handbag held in front
  s.part('ink', (q) => {
    q.rect(hx + 8, hy + 27, 1, 3, 'moss');
    q.rect(hx + 11, hy + 27, 1, 3, 'moss');
    q.rect(hx + 6, hy + 30, 8, 6, 'teal');
    q.rect(hx + 6, hy + 30, 8, 1, 'moss');
    q.rect(hx + 9, hy + 32, 2, 1, 'honey');
  });
  arm(s, look, [hx + 6, hy + 15], [hx + 7, hy + 21], [hx + 9, hy + 26]);
  s.flush(p);
};

/** He is wearing a hat. */
const wearingHat: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintStreet(p, 46);
  // a street lamp
  lightPool(p, 78, 12, 12, 10, [['honey', 0.7]]);
  const lamp = sheet();
  lamp.rect(82, 10, 2, 48, 'slate');
  lamp.rect(76, 9, 8, 2, 'slate');
  lamp.rect(75, 11, 5, 2, 'honey');
  lamp.flush(p);

  const look: Look = { top: 'denim', topShade: 'indigo', legs: 'slate', legsShade: 'night' };
  const hx = 40;
  const hy = 20;
  const s = sheet();
  standBody(s, hx, hy, look, { coat: 5, wide: true });
  s.rect(hx + 8, hy + 13, 3, 2, 'sky');
  s.rect(hx + 9, hy + 18, 1, 1, 'honey');
  s.rect(hx + 9, hy + 22, 1, 1, 'honey');
  paintSprite(s, head(MAN_ROWS, DARK_HAIR), hx, hy);
  // the hat: a tall crown with a band and a wide brim
  s.rect(hx + 2, hy - 6, 8, 1, 'amber');
  s.rect(hx + 1, hy - 5, 10, 6, 'amber');
  s.rect(hx + 2, hy - 5, 3, 1, 'honey');
  s.rect(hx + 1, hy, 10, 1, 'maroon');
  s.rect(hx - 3, hy + 1, 18, 2, 'amber');
  s.rect(hx - 3, hy + 2, 18, 1, 'ember');
  arm(s, look, [hx + 5, hy + 15], [hx + 5, hy + 21], [hx + 6, hy + 27]);
  s.flush(p);
};

/** She is eating pizza. */
const eatingPizza: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 30);
  paintLamp(p, 44, 0);
  paintPicture(p, 66, 5);

  // the table: a red cloth with a checked hem, the rest of the pizza on a plate
  const t = sheet();
  paintTable(t, 34, 100, 'red', 'neon', 'maroon', 27);
  t.rect(36, 46, 2, 12, 'ember');
  t.rect(34, 40, 66, 6, 'paper');
  for (let x = 34; x < W; x += 3) t.rect(x, ((x - 34) / 3) % 2 === 0 ? 40 : 43, 3, 3, 'red');
  t.part('maroon', (q) => {
    ellipse(q, 64, 33, 19, 6, 'paper');
    q.rect(57, 39, 15, 1, 'fog');
  });
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -15; dx <= 15; dx++) {
      const d = (dx / 15.5) ** 2 + (dy / 4.5) ** 2;
      if (d >= 1) continue;
      // the missing slice: a wedge toward her
      const turn = (Math.atan2(dy * 3.4, dx) * 180) / Math.PI;
      if (Math.abs(turn) > 136) continue;
      t.rect(64 + dx, 33 + dy, 1, 1, d > 0.7 ? 'amber' : 'honey');
    }
  }
  t.rect(65, 33, 13, 1, 'amber');
  for (const [x, y] of [
    [58, 30],
    [66, 30],
    [73, 31],
    [60, 35],
    [68, 35],
    [74, 34],
  ] as const) {
    t.rect(x, y, 2, 2, 'red');
  }
  t.flush(p);

  const look: Look = { top: 'leaf', topShade: 'moss', legs: 'denim', legsShade: 'indigo' };
  const hx = 10;
  const hy = 17;
  const s = sheet();
  sitBody(s, hx, hy, look);
  ellipse(s, hx - 1, hy + 4, 2, 2, 'ember');
  paintSprite(s, head(stamp(UPDO_ROWS, MOUTH_OPEN), BROWN_HAIR, true), hx, hy);
  // the slice, its point at her mouth
  s.part('ink', (q) => {
    for (let i = 0; i < 10; i++) {
      const half = Math.floor((i * 4) / 9);
      q.rect(hx + 10 + i, hy + 10 - half, 1, half * 2 + 1, 'honey');
    }
    q.rect(hx + 20, hy + 6, 2, 9, 'amber');
    q.rect(hx + 15, hy + 10, 2, 1, 'red');
    q.rect(hx + 17, hy + 8, 2, 1, 'red');
    q.rect(hx + 18, hy + 12, 2, 1, 'red');
  });
  arm(s, look, [hx + 7, hy + 16], [hx + 16, hy + 22], [hx + 22, hy + 14]);
  s.flush(p);
};

/** He is buying apples. */
const buyingApples: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintStreet(p, 44);

  // the seller behind the stall, facing him
  const vx = 50;
  const vy = 13;
  const seller: Look = { top: 'rosy', topShade: 'mauve', legs: 'dusk', legsShade: 'indigo' };
  const v = sheet(2 * vx + 11);
  v.rect(vx + 5, vy + 12, 3, 1, 'tan');
  v.rect(vx + 2, vy + 13, 9, 14, seller.top);
  v.rect(vx + 2, vy + 13, 2, 14, seller.topShade);
  v.rect(vx + 6, vy + 16, 5, 11, 'moss');
  ellipse(v, vx - 1, vy + 4, 2, 2, 'fog');
  paintSprite(v, head(UPDO_ROWS, GREY_HAIR, true), vx, vy);
  v.flush(p);

  // the stall: a striped awning, a counter, a crate of apples
  const st = sheet();
  for (let x = 42; x < W; x++) {
    const i = x - 42;
    const stripe: PaletteName = Math.floor(i / 6) % 2 === 0 ? 'red' : 'paper';
    st.rect(x, 2, 1, 8, stripe);
    st.rect(x, 10, 1, i % 6 === 0 || i % 6 === 5 ? 1 : 2, stripe);
  }
  st.rect(44, 12, 2, 24, 'ember');
  st.rect(44, 36, 52, 3, 'amber');
  st.rect(44, 36, 52, 1, 'honey');
  st.rect(44, 39, 52, 19, 'ember');
  st.rect(44, 39, 52, 1, 'plum');
  for (let x = 51; x < W; x += 9) st.rect(x, 40, 1, 18, 'plum');
  st.rect(65, 19, 31, 17, 'ember');
  st.rect(66, 20, 30, 13, 'plum');
  st.rect(65, 34, 31, 1, 'amber');
  for (const x of [67, 73, 79, 85, 91]) apple(st, x, 22);
  for (const x of [70, 76, 82, 88]) apple(st, x, 28);
  st.flush(p);

  // the bag of apples she holds out
  const bag = sheet();
  bag.rect(37, 31, 1, 2, 'fog');
  bag.rect(42, 31, 1, 2, 'fog');
  bag.rect(35, 33, 10, 10, 'paper');
  bag.rect(36, 43, 8, 1, 'fog');
  bag.rect(44, 34, 1, 9, 'fog');
  apple(bag, 36, 35);
  apple(bag, 40, 34);
  apple(bag, 38, 38);
  bag.flush(p);
  const hand = sheet(2 * vx + 11);
  arm(hand, seller, [vx + 6, vy + 16], [vx + 12, vy + 21], [vx + 21, vy + 16]);
  hand.flush(p);

  // the buyer, money in his hand
  const look: Look = { top: 'paper', topShade: 'fog', legs: 'denim', legsShade: 'indigo' };
  const hx = 8;
  const hy = 20;
  const s = sheet();
  standBody(s, hx, hy, look, { wide: true });
  paintSprite(s, head(MAN_ROWS, DARK_HAIR), hx, hy);
  s.part('ink', (q) => {
    q.rect(hx + 20, hy + 16, 6, 4, 'leaf');
    q.rect(hx + 22, hy + 17, 2, 2, 'moss');
  });
  arm(s, look, [hx + 6, hy + 16], [hx + 11, hy + 21], [hx + 19, hy + 18]);
  s.flush(p);
};

/** She is writing a letter. */
const writingLetter: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 44);
  paintPicture(p, 50, 6);

  // the desk: the letter, an envelope, a lamp
  const d = sheet();
  paintTable(d, 25, 94, 'amber', 'honey', 'ember');
  d.rect(72, 42, 18, 9, 'ember');
  d.rect(73, 43, 16, 7, 'amber');
  d.rect(80, 46, 2, 1, 'honey');
  d.part('ember', (q) => {
    flat(q, 36, 32, 16, 7, 'paper');
    q.rect(41, 33, 11, 1, 'concrete');
    q.rect(40, 35, 11, 1, 'concrete');
    q.rect(46, 37, 5, 1, 'concrete');
  });
  d.part('ember', (q) => {
    flat(q, 60, 33, 13, 6, 'paper');
    for (let i = 0; i < 6; i++) {
      const x = 60 + Math.floor((5 - i) / 2);
      q.rect(x + i, 33 + i, 1, 1, 'concrete');
      q.rect(x + 12 - i, 33 + i, 1, 1, 'concrete');
    }
  });
  d.rect(81, 35, 9, 2, 'slate');
  d.rect(85, 22, 1, 13, 'slate');
  d.rect(81, 15, 9, 1, 'amber');
  d.rect(80, 16, 11, 2, 'amber');
  d.rect(79, 18, 13, 3, 'honey');
  d.flush(p);

  const look: Look = { top: 'rosy', topShade: 'mauve', legs: 'denim', legsShade: 'indigo' };
  const hx = 10;
  const hy = 17;
  const s = sheet();
  sitBody(s, hx, hy, look, true);
  paintSprite(s, head(WOMAN_ROWS, DARK_HAIR, true), hx, hy);
  arm(s, look, [hx + 7, hy + 16], [hx + 18, hy + 23], [hx + 32, hy + 19]);
  // the pen, its tip at the end of the line she is writing
  s.part('ember', (q) => {
    line(q, hx + 33, hy + 20, hx + 38, hy + 12, 'red');
    line(q, hx + 34, hy + 20, hx + 39, hy + 12, 'red');
    q.rect(hx + 32, hy + 21, 2, 1, 'ink');
  });
  s.flush(p);
};

/** He is singing. */
const singing: PictureFn = (target) => {
  const p = clipped(target, W, H);
  // a stage: the curtain, a spotlight, the boards
  p.rect(0, 0, W, 48, 'maroon');
  for (let x = 0; x < W; x += 8) {
    p.rect(x, 0, 3, 48, 'plum');
    p.rect(x + 5, 0, 1, 48, 'neonDeep');
  }
  lightPool(p, 46, 28, 28, 24, [['red', 0.7]], { y0: 0, y1: 48 });
  p.rect(0, 0, W, 4, 'plum');
  for (let x = 0; x < W; x++) px(p, x, x % 8 < 4 ? 4 : 5, 'lamp');
  p.rect(0, 48, W, 16, 'ember');
  p.rect(0, 48, W, 1, 'amber');
  p.rect(0, 54, W, 1, 'plum');
  p.rect(0, 60, W, 1, 'plum');
  lightPool(p, 46, 57, 26, 6, [['amber', 0.9]], { y0: 49, y1: H });

  const hx = 34;
  const hy = 18;
  // the microphone on its stand
  const mic = sheet();
  mic.rect(hx + 20, hy + 13, 1, 26, 'fog');
  mic.rect(hx + 15, hy + 38, 11, 2, 'fog');
  line(mic, hx + 15, hy + 10, hx + 20, hy + 13, 'slate');
  line(mic, hx + 15, hy + 11, hx + 20, hy + 14, 'slate');
  mic.rect(hx + 12, hy + 8, 3, 3, 'fog');
  mic.rect(hx + 13, hy + 9, 2, 2, 'concrete');
  mic.flush(p);

  const look: Look = { top: 'paper', topShade: 'fog', legs: 'denim', legsShade: 'indigo' };
  const s = sheet();
  farArm(s, look, [hx + 4, hy + 16], [hx - 3, hy + 17], [hx - 8, hy + 10]);
  standBody(s, hx, hy, look, { wide: true });
  s.rect(hx + 7, hy + 13, 3, 2, 'red');
  paintSprite(s, head(stamp(MAN_ROWS, [...EYES_SHUT, ...MOUTH_OPEN]), DARK_HAIR), hx, hy);
  arm(s, look, [hx + 6, hy + 16], [hx + 12, hy + 20], [hx + 17, hy + 13]);
  s.flush(p);

  // music in the air
  const notes = sheet();
  paintSprite(notes, NOTE, 62, 6);
  paintSprite(notes, NOTE_PAIR, 74, 14);
  paintSprite(notes, { ...NOTE, legend: { n: 'paper' } }, 66, 24);
  paintSprite(notes, { ...NOTE, legend: { n: 'cyan' } }, 12, 10);
  notes.flush(p);
};

/** He is sleeping on the sofa. */
const sleepingSofa: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 70);
  paintWindow(p, 62, 3);
  // a thin moon in the window
  p.rect(82, 7, 3, 1, 'paper');
  p.rect(84, 8, 2, 3, 'paper');
  p.rect(82, 11, 3, 1, 'paper');

  const sofa = sheet();
  sofa.rect(11, 25, 72, 1, 'rosy');
  sofa.rect(10, 26, 74, 18, 'mauve');
  sofa.rect(47, 28, 1, 15, 'violet');
  sofa.rect(16, 43, 62, 1, 'rosy');
  sofa.rect(16, 44, 62, 5, 'mauve');
  sofa.rect(16, 49, 62, 6, 'violet');
  for (const x of [6, 78]) {
    sofa.rect(x + 1, 32, 8, 1, 'rosy');
    sofa.rect(x, 33, 10, 22, 'mauve');
    sofa.rect(x, 51, 10, 4, 'violet');
  }
  sofa.rect(8, 55, 3, 2, 'ink');
  sofa.rect(83, 55, 3, 2, 'ink');
  sofa.flush(p);

  // the sleeper: head on a pillow at the left, feet to the right
  const look: Look = { top: 'amber', topShade: 'ember', legs: 'denim', legsShade: 'indigo' };
  const lx = 20;
  const ly = 31;
  const s = sheet();
  s.rect(17, 38, 14, 5, 'paper');
  s.rect(18, 37, 12, 1, 'paper');
  s.rect(17, 42, 14, 1, 'fog');
  s.rect(lx + 12, ly + 4, 1, 3, 'tan');
  s.rect(lx + 13, ly + 1, 13, 9, look.top);
  s.rect(lx + 13, ly + 8, 13, 2, look.topShade);
  s.rect(lx + 26, ly + 3, 20, 3, look.legsShade);
  s.rect(lx + 26, ly + 6, 20, 4, look.legs);
  s.rect(lx + 46, ly + 1, 3, 9, 'paper');
  s.rect(lx + 46, ly + 9, 3, 1, 'fog');
  paintSprite(s, head(lying(stamp(MAN_ROWS, EYES_SHUT)), BROWN_HAIR), lx, ly);
  // one arm hangs down over the seat
  arm(s, look, [lx + 16, ly + 6], [lx + 17, ly + 12], [lx + 18, ly + 18]);
  s.flush(p);

  const zs = sheet();
  zed(zs, 32, 22, 4);
  zed(zs, 38, 14, 5);
  zed(zs, 46, 5, 6);
  zs.flush(p);
};

/** The kids are playing with a ball. */
const playingBall: PictureFn = (target) => {
  const p = clipped(target, W, H);
  // the park: evening sky, far trees, grass
  ditherGradient(p, 0, 0, W, 40, ['dusk', 'violet', 'mauve', 'rosy', 'honey']);
  for (const [x, r] of [
    [6, 9],
    [24, 6],
    [40, 8],
    [58, 6],
    [74, 9],
    [92, 7],
  ] as const) {
    ellipse(p, x, 39, r + 3, r, 'moss');
  }
  p.rect(0, 40, W, 24, 'leaf');
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(hash2(i, 3, 5) * (W - 2));
    const y = 42 + Math.floor(hash2(i, 9, 5) * 21);
    p.rect(x, y, 2, 1, 'moss');
    px(p, x, y - 1, 'moss');
  }
  for (const [x, y] of [
    [8, 60],
    [44, 51],
    [88, 47],
    [60, 60],
  ] as const) {
    px(p, x, y, 'honey');
  }

  // the boy has just thrown the ball
  const boy: Look = { top: 'red', topShade: 'maroon', legs: 'denim', legsShade: 'indigo' };
  const bx = 14;
  const by = 27;
  const b = sheet();
  kidBody(b, bx, by, boy);
  paintSprite(b, head(MAN_ROWS, BROWN_HAIR), bx, by);
  arm(b, boy, [bx + 6, by + 16], [bx + 13, by + 13], [bx + 18, by + 7]);
  b.flush(p);

  // the girl reaches up to catch it
  const girl: Look = { top: 'honey', topShade: 'amber', legs: 'honey', legsShade: 'amber' };
  const gx = 70;
  const g = sheet(2 * gx + 11);
  farArm(g, girl, [gx + 6, by + 15], [gx + 12, by + 10], [gx + 15, by + 2]);
  kidBody(g, gx, by, girl, true);
  g.rect(gx - 2, by + 4, 3, 7, 'ink');
  g.rect(gx - 1, by + 4, 2, 1, 'neon');
  paintSprite(g, head(UPDO_ROWS, DARK_HAIR, true), gx, by);
  arm(g, girl, [gx + 6, by + 16], [gx + 13, by + 13], [gx + 17, by + 5]);
  g.flush(p);

  // the ball in the air between them
  for (const [x, y] of [
    [35, 30],
    [38, 25],
    [41, 21],
  ] as const) {
    px(p, x, y, 'paper');
  }
  const ball = sheet();
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if (dx * dx + dy * dy > 27) continue;
      const band = dx + Math.floor(dy / 2);
      ball.rect(48 + dx, 15 + dy, 1, 1, band < -2 ? 'red' : band > 1 ? 'cyan' : 'paper');
    }
  }
  ball.flush(p);
};

export const ACT1_PICTURES: Readonly<Record<string, PictureFn>> = {
  reading_book: readingBook,
  drinking_coffee: drinkingCoffee,
  waiting_bus: waitingBus,
  wearing_hat: wearingHat,
  eating_pizza: eatingPizza,
  buying_apples: buyingApples,
  writing_letter: writingLetter,
  singing,
  sleeping_sofa: sleepingSofa,
  playing_ball: playingBall,
};
