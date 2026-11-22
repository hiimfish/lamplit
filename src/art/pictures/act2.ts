import {
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
  paintClock,
  paintFloor,
  paintLamp,
  paintWainscot,
  paintWindow,
} from '../stage/common';
import type { PictureFn } from './index';

/**
 * Pictures for the 看圖選句 questions of Act 2, drawn like the Act 1 pictures: the stage
 * characters larger (a 12 pixel head), flat colours with one shade, an ink rim around
 * each figure, and one clear action with its object large. Each fills the 96x64 frame.
 */

const W = 96;
const H = 64;

// ---------------------------------------------------------------------------
// A sheet: shapes are collected first, then painted with a rim around them, so
// a figure made of many parts gets one outline. With `flip`, x becomes flip - x.

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
// Heads: 12 wide. h hair, H hair light, s skin, t skin shade, e eye, m mouth,
// o open mouth, r blush.

type Legend = Record<string, PaletteName>;

/** Seen from the side, facing right. */
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

/** Long hair down to the shoulders, facing right. */
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

/** Hair pinned up (the bun is painted beside it), facing right. */
const LIBRARIAN_ROWS: readonly string[] = [
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

/** Facing us, hair pinned up, talking. */
const TEACHER_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhHHhhhhhh.',
  '.hhhhhhhhhh.',
  '.hhhhhhhhhh.',
  '.hhsssssshh.',
  '.hssssssssh.',
  '.hsessssesh.',
  '.hsessssesh.',
  '.hrssssssrh.',
  '..sssoosss..',
  '...ssooss...',
  '....tttt....',
];

/** Seen from behind: short hair, the ears, the nape. */
const BACK_MAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhHHhhhhhh.',
  '.hhhhhhhhhh.',
  '.hhhhhhhhhh.',
  'shhhhhhhhhhs',
  'thhhhhhhhhht',
  '.hhhhhhhhhh.',
  '..hhhhhhhh..',
  '..tsssssst..',
  '...tsssst...',
];

/** Seen from behind: long hair over the shoulders. */
const BACK_WOMAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhHHhhhhhh.',
  '.hhhhhhhhhh.',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  '.hhhhhhhhhh.',
  '.hhhhhhhhhh.',
  '..hhhhhhhh..',
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

interface Look {
  top: PaletteName;
  topShade: PaletteName;
  legs: PaletteName;
  legsShade: PaletteName;
}

// ---------------------------------------------------------------------------
// Bodies. (hx, hy) is the top left of the 12 wide head; side figures face right.

/** A person standing, seen from the side: neck, upper body, legs and shoes. */
function standBody(s: Sheet, hx: number, hy: number, look: Look): void {
  const top = hy + 13;
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 3, top + 12, 3, 11, look.legsShade);
  s.rect(hx + 6, top + 12, 3, 11, look.legs);
  s.rect(hx + 3, top + 23, 3, 2, 'ink');
  s.rect(hx + 6, top + 23, 5, 2, 'ink');
  s.rect(hx + 1, top, 10, 12, look.top);
  s.rect(hx + 1, top, 2, 12, look.topShade);
}

/** A person sitting, seen from the side: legs and upper body, and a wooden chair if asked. */
function sitBody(
  s: Sheet,
  hx: number,
  hy: number,
  look: Look,
  chair: boolean,
  skirt = false,
): void {
  const seat = hy + 31;
  if (chair) {
    s.rect(hx - 2, hy + 15, 2, 27, 'ember');
    s.rect(hx - 2, seat, 20, 2, 'amber');
    s.rect(hx + 13, seat + 2, 2, 9, 'ember');
  }
  s.rect(hx + 15, seat, 3, 9, skirt ? 'tan' : look.legsShade);
  s.rect(hx + 15, seat + 9, 5, 2, 'ink');
  s.rect(hx + 3, seat - 6, 19, 6, look.legs);
  s.rect(hx + 3, seat - 1, 15, 1, look.legsShade);
  s.rect(hx + 19, seat, 3, 9, skirt ? 'skin' : look.legs);
  s.rect(hx + 19, seat + 9, 5, 2, 'ink');
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 2, hy + 13, 9, 13, look.top);
  s.rect(hx + 2, hy + 13, 2, 13, look.topShade);
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
// Rooms and furniture

const FLOOR_TOP = 50;
const TABLE_TOP = 31;

/** A room in the evening: lit wall, wooden boards on the lower wall, plank floor. */
function paintRoom(p: Painter, lightX: number): void {
  p.rect(0, 0, W, FLOOR_TOP, 'concrete');
  ditherRect(p, 0, 0, W, 3, 'stone', 8);
  lightPool(p, lightX, 18, 30, 20, [['fog', 0.6]], { y0: 3, y1: 38 });
  paintWainscot(p, W, 38, FLOOR_TOP);
  paintFloor(p, W, FLOOR_TOP, H);
}

/** A desk seen a little from above: its top from `y` to the front edge, then legs. */
function paintDesk(s: Painter, x0: number, x1: number, y = TABLE_TOP): void {
  s.rect(x0, y, x1 - x0, TABLE_TOP + 9 - y, 'amber');
  s.rect(x0, y, x1 - x0, 1, 'honey');
  s.rect(x0, TABLE_TOP + 9, x1 - x0, 2, 'ember');
  s.rect(x0 + 2, TABLE_TOP + 11, 2, 17, 'ember');
  s.rect(x1 - 4, TABLE_TOP + 11, 2, 17, 'ember');
}

/** Something flat lying on a table: each row sits half a pixel left of the one above. */
function flat(s: Painter, x: number, y: number, w: number, rows: number, color: PaletteName): void {
  for (let r = 0; r < rows; r++) s.rect(x + Math.floor((rows - 1 - r) / 2), y + r, w, 1, color);
}

const SPINES: readonly PaletteName[] = [
  'red',
  'teal',
  'honey',
  'sky',
  'leaf',
  'mauve',
  'paper',
  'denim',
];

/** A bookcase full of books: a wooden frame, shelves every 10 pixels, coloured spines. */
function paintShelves(p: Painter, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'ember');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'plum');
  for (let sy = y + 1; sy + 9 < y + h; sy += 10) {
    let bx = x + 2;
    let i = 0;
    while (bx < x + w - 3) {
      const r = hash2(bx, sy, 5);
      const bw = r > 0.7 ? 3 : 2;
      const bh = 6 + Math.floor(hash2(bx, sy, 9) * 3);
      if (bx + bw > x + w - 2) break;
      if (hash2(bx, sy, 13) > 0.9) {
        bx += 2;
        continue;
      }
      const color = SPINES[Math.floor(hash2(bx, sy, i) * SPINES.length)] ?? 'red';
      p.rect(bx, sy + 9 - bh, bw, bh, color);
      p.rect(bx, sy + 9 - bh + 1, bw, 1, 'night');
      bx += bw + (hash2(bx, sy, 17) > 0.8 ? 1 : 0);
      i++;
    }
    p.rect(x + 1, sy + 9, w - 2, 1, 'amber');
  }
}

// ---------------------------------------------------------------------------
// The pictures

/** He is using a computer. */
const usingComputer: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 40);
  paintClock(p, 36, 11);

  // the desk with the computer: monitor, keyboard, mouse
  const d = sheet();
  paintDesk(d, 30, 95);
  d.rect(70, 30, 15, 2, 'slate');
  d.rect(76, 25, 3, 5, 'stone');
  d.rect(62, 5, 30, 21, 'slate');
  d.rect(62, 24, 30, 2, 'stone');
  d.rect(64, 7, 26, 16, 'cyan');
  d.rect(64, 7, 26, 1, 'sky');
  // a window on the screen: a title bar and a picture of a hill
  d.rect(69, 9, 18, 12, 'paper');
  d.rect(69, 9, 18, 2, 'denim');
  d.rect(71, 13, 14, 6, 'sky');
  d.rect(71, 16, 14, 3, 'leaf');
  d.rect(75, 15, 6, 1, 'leaf');
  d.rect(81, 13, 2, 2, 'honey');
  d.rect(65, 9, 2, 2, 'paper');
  d.rect(65, 13, 2, 2, 'honey');
  d.rect(65, 17, 2, 2, 'paper');
  d.part('ember', (q) => {
    flat(q, 41, 33, 25, 5, 'slate');
    for (let r = 0; r < 4; r++) {
      const x = 41 + Math.floor((4 - r) / 2);
      for (let k = 1 + (r % 2); k < 24; k += 2) q.rect(x + k, 33 + r, 1, 1, 'fog');
    }
    q.rect(41, 37, 25, 1, 'night');
  });
  d.part('ember', (q) => {
    q.rect(70, 34, 4, 3, 'paper');
    q.rect(70, 36, 4, 1, 'fog');
    q.rect(71, 34, 1, 1, 'concrete');
  });
  d.rect(72, 32, 1, 2, 'stone');
  d.flush(p);

  const look: Look = { top: 'leaf', topShade: 'moss', legs: 'denim', legsShade: 'indigo' };
  const hx = 17;
  const hy = 17;
  const s = sheet();
  farArm(s, look, [hx + 6, hy + 16], [hx + 17, hy + 23], [hx + 37, hy + 17]);
  sitBody(s, hx, hy, look, true);
  paintSprite(s, head(MAN_ROWS, DARK_HAIR), hx, hy);
  arm(s, look, [hx + 7, hy + 16], [hx + 15, hy + 25], [hx + 29, hy + 20]);
  s.flush(p);
};

/** They are listening to the teacher. */
const listeningTeacher: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 36);
  paintWindow(p, 66, 4);
  // the blackboard, with chalk shapes on it
  p.rect(5, 3, 56, 26, 'ember');
  p.rect(6, 4, 54, 24, 'moss');
  ditherRect(p, 6, 4, 54, 24, 'leaf', 2);
  p.rect(4, 28, 58, 2, 'amber');
  p.rect(10, 27, 3, 1, 'paper');
  // a circle, a triangle and a square in chalk
  for (const [dx, dy] of [
    [2, 0],
    [3, 0],
    [1, 1],
    [4, 1],
    [0, 2],
    [5, 2],
    [0, 3],
    [5, 3],
    [1, 4],
    [4, 4],
    [2, 5],
    [3, 5],
  ] as const) {
    px(p, 11 + dx, 9 + dy, 'paper');
  }
  line(p, 13, 24, 17, 17, 'paper');
  line(p, 17, 17, 21, 24, 'paper');
  p.rect(13, 24, 9, 1, 'paper');
  p.rect(22, 10, 6, 1, 'fog');
  p.rect(22, 15, 6, 1, 'fog');
  p.rect(22, 10, 1, 6, 'fog');
  p.rect(27, 10, 1, 6, 'fog');

  // the teacher at the front, facing the class, one hand raised as she talks
  const look: Look = { top: 'teal', topShade: 'moss', legs: 'plum', legsShade: 'maroon' };
  const tx = 36;
  const ty = 9;
  const t = sheet();
  t.rect(tx + 4, ty + 12, 4, 1, 'tan');
  t.rect(tx + 1, ty + 13, 10, 14, look.top);
  t.rect(tx + 1, ty + 13, 2, 14, look.topShade);
  t.rect(tx + 5, ty + 13, 2, 3, 'paper');
  t.rect(tx, ty + 27, 12, 6, look.legs);
  t.rect(tx, ty + 27, 3, 6, look.legsShade);
  t.rect(tx + 3, ty + 33, 2, 6, 'tan');
  t.rect(tx + 7, ty + 33, 2, 6, 'skin');
  t.rect(tx + 2, ty + 39, 3, 2, 'ink');
  t.rect(tx + 7, ty + 39, 3, 2, 'ink');
  ellipse(t, tx + 6, ty - 1, 2, 1, 'ink');
  paintSprite(t, head(TEACHER_ROWS, DARK_HAIR, true), tx, ty);
  arm(t, look, [tx, ty + 15], [tx - 2, ty + 20], [tx - 1, ty + 26]);
  t.part(look.topShade, (q) => {
    line(q, tx + 11, ty + 15, tx + 15, ty + 12, look.top, 3);
    line(q, tx + 15, ty + 12, tx + 17, ty + 5, look.top, 3);
    q.rect(tx + 16, ty + 1, 3, 4, 'skin');
    q.rect(tx + 15, ty + 3, 1, 2, 'skin');
    q.rect(tx + 19, ty + 4, 1, 1, 'skin');
  });
  t.flush(p);

  // two students at their desks, seen from behind, facing her
  const desk = (x0: number, x1: number): void => {
    const d = sheet();
    d.rect(x0, 55, x1 - x0, 3, 'amber');
    d.rect(x0, 55, x1 - x0, 1, 'honey');
    d.rect(x0, 58, x1 - x0, 6, 'ember');
    d.rect(x0, 58, x1 - x0, 1, 'plum');
    d.flush(p);
  };
  const a: Look = { top: 'red', topShade: 'maroon', legs: 'denim', legsShade: 'indigo' };
  const s1 = sheet();
  s1.rect(4, 45, 20, 12, a.top);
  s1.rect(4, 45, 4, 12, a.topShade);
  s1.rect(6, 44, 16, 1, a.top);
  paintSprite(s1, head(BACK_MAN_ROWS, DARK_HAIR), 8, 34);
  s1.flush(p);
  desk(0, 32);

  const b: Look = { top: 'sky', topShade: 'denim', legs: 'denim', legsShade: 'indigo' };
  const s2 = sheet();
  s2.rect(66, 45, 20, 12, b.top);
  s2.rect(66, 45, 4, 12, b.topShade);
  s2.rect(68, 44, 16, 1, b.top);
  paintSprite(s2, head(BACK_WOMAN_ROWS, BROWN_HAIR), 70, 33);
  s2.flush(p);
  desk(60, 96);
};

/** She is reading a magazine. */
const readingMagazine: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 46);
  paintShelves(p, 0, 2, 19, 48);
  paintShelves(p, 75, 2, 21, 48);
  paintLamp(p, 47, 0);

  const look: Look = { top: 'paper', topShade: 'fog', legs: 'denim', legsShade: 'indigo' };
  const hx = 25;
  const hy = 15;
  const seat = hy + 31;

  // the armchair behind her
  const c = sheet();
  c.rect(hx - 7, hy + 6, 9, 36, 'red');
  c.rect(hx - 7, hy + 6, 9, 2, 'rosy');
  c.rect(hx - 7, hy + 6, 2, 36, 'maroon');
  c.rect(hx - 7, seat, 30, 6, 'red');
  c.rect(hx - 7, seat, 30, 1, 'rosy');
  c.rect(hx - 7, seat + 6, 30, 3, 'maroon');
  c.rect(hx - 6, seat + 9, 2, 3, 'ember');
  c.rect(hx + 19, seat + 9, 2, 3, 'ember');
  c.flush(p);

  const s = sheet();
  farArm(s, look, [hx + 5, hy + 16], [hx + 15, hy + 22], [hx + 36, hy + 15]);
  sitBody(s, hx, hy, look, false, true);
  paintSprite(s, head(WOMAN_ROWS, DARK_HAIR, true), hx, hy);
  // the magazine, open, its glossy cover toward us
  s.part('ink', (q) => {
    const mx = hx + 15;
    const my = hy + 6;
    // back cover: an advert
    q.rect(mx, my + 1, 13, 20, 'lamp');
    q.rect(mx, my + 13, 13, 8, 'amber');
    ellipse(q, mx + 6, my + 8, 3, 3, 'neon');
    q.rect(mx + 5, my + 6, 2, 1, 'paper');
    // front cover: the title band and a photo of a face
    q.rect(mx + 13, my, 14, 21, 'cyan');
    q.rect(mx + 13, my, 14, 4, 'neon');
    q.rect(mx + 15, my + 1, 3, 2, 'paper');
    q.rect(mx + 19, my + 1, 2, 2, 'paper');
    q.rect(mx + 22, my + 1, 3, 2, 'paper');
    ellipse(q, mx + 20, my + 10, 3, 3, 'ember');
    q.rect(mx + 18, my + 10, 5, 4, 'skin');
    q.rect(mx + 19, my + 11, 1, 1, 'ink');
    q.rect(mx + 21, my + 11, 1, 1, 'ink');
    q.rect(mx + 20, my + 13, 1, 1, 'red');
    q.rect(mx + 16, my + 15, 9, 6, 'neonDeep');
    q.rect(mx + 19, my + 14, 3, 1, 'skin');
    q.rect(mx + 14, my + 18, 3, 1, 'honey');
    q.rect(mx + 23, my + 6, 3, 1, 'honey');
    // the fold and the thin edge of the pages
    q.rect(mx + 12, my + 1, 1, 21, 'fog');
    q.rect(mx + 13, my + 21, 14, 1, 'paper');
    q.rect(mx, my + 21, 12, 1, 'paper');
  });
  arm(s, look, [hx + 7, hy + 16], [hx + 11, hy + 25], [hx + 15, hy + 23]);
  s.flush(p);
};

/** He is borrowing two books. */
const borrowingBooks: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 72);
  paintShelves(p, 0, 2, 9, 36);
  paintShelves(p, 40, 2, 19, 33);
  paintShelves(p, 85, 2, 11, 33);

  // the librarian behind the desk, facing him
  const vx = 66;
  const vy = 12;
  const staff: Look = { top: 'leaf', topShade: 'moss', legs: 'slate', legsShade: 'night' };
  const v = sheet(2 * vx + 11);
  v.rect(vx + 5, vy + 12, 3, 1, 'tan');
  v.rect(vx + 2, vy + 13, 9, 14, staff.top);
  v.rect(vx + 2, vy + 13, 2, 14, staff.topShade);
  v.rect(vx + 6, vy + 13, 2, 2, 'paper');
  ellipse(v, vx - 1, vy + 4, 2, 2, 'fog');
  paintSprite(v, head(LIBRARIAN_ROWS, GREY_HAIR, true), vx, vy);
  arm(v, staff, [vx + 6, vy + 16], [vx + 12, vy + 21], [vx + 24, vy + 18]);
  v.flush(p);

  // the desk, with his library card on it
  const d = sheet();
  d.rect(48, 34, 48, 4, 'amber');
  d.rect(48, 34, 48, 1, 'honey');
  d.rect(48, 38, 48, 20, 'ember');
  d.rect(48, 38, 48, 1, 'plum');
  for (let x = 56; x < W; x += 10) d.rect(x, 40, 1, 16, 'plum');
  d.part('ember', (q) => {
    flat(q, 70, 34, 9, 4, 'cyan');
    q.rect(71, 35, 7, 1, 'denim');
    q.rect(70, 37, 2, 1, 'paper');
  });
  d.flush(p);

  // the man handing over two books
  const look: Look = { top: 'honey', topShade: 'amber', legs: 'slate', legsShade: 'night' };
  const hx = 10;
  const hy = 19;
  const s = sheet();
  farArm(s, look, [hx + 5, hy + 16], [hx + 14, hy + 20], [hx + 30, hy + 12]);
  standBody(s, hx, hy, look);
  paintSprite(s, head(MAN_ROWS, DARK_HAIR), hx, hy);
  s.part('ink', (q) => {
    q.rect(hx + 22, hy + 5, 16, 4, 'red');
    q.rect(hx + 22, hy + 8, 16, 1, 'maroon');
    q.rect(hx + 35, hy + 5, 3, 4, 'paper');
    q.rect(hx + 35, hy + 6, 3, 1, 'fog');
    q.rect(hx + 25, hy + 6, 4, 1, 'honey');
  });
  s.part('ink', (q) => {
    q.rect(hx + 21, hy + 10, 17, 4, 'teal');
    q.rect(hx + 21, hy + 13, 17, 1, 'moss');
    q.rect(hx + 35, hy + 10, 3, 4, 'paper');
    q.rect(hx + 35, hy + 11, 3, 1, 'fog');
    q.rect(hx + 24, hy + 11, 4, 1, 'cyan');
  });
  arm(s, look, [hx + 6, hy + 16], [hx + 12, hy + 21], [hx + 22, hy + 15]);
  s.flush(p);
};

export const ACT2_PICTURES: Readonly<Record<string, PictureFn>> = {
  using_computer: usingComputer,
  listening_teacher: listeningTeacher,
  reading_magazine: readingMagazine,
  borrowing_books: borrowingBooks,
};
