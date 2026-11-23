import { ditherRect, lightPool, paintSprite, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, paintFloor, paintPlant, paintWainscot, paintWindow } from '../stage/common';
import type { PictureFn } from './index';

/**
 * Pictures for the photo question of Act 4 (TOEIC Part 1: four sentences are heard, one
 * describes the picture), drawn like the Act 2 pictures: office people larger than on the
 * stage (a 12 pixel head), flat colours with one shade, an ink rim around each figure.
 * Each shows one clear situation in the Harbor Trading meeting room, with the details the
 * wrong sentences get wrong (who stands, who sits, what is on the table) easy to see.
 * Each fills the 96x64 frame.
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

/** Long hair down to the shoulders, seen from the side, facing right, talking. */
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
  'hhhhhhssoo..',
  'hhhhhh.sss..',
  'hhhhh.......',
  '.hhhh.......',
  '.hhh........',
];

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

/** Facing us, short hair. */
const FRONT_MAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhHHhhhhhh.',
  '.hhhhhhhhhh.',
  '.hhhhhhhhhh.',
  '.hssssssssh.',
  'tssessssesst',
  'tssessssesst',
  '.ssssssssss.',
  '.sssssttsss.',
  '..sssmmsss..',
  '...ssssss...',
  '....tttt....',
];

/** Facing us, short hair, mouth open: talking. */
const TALK_MAN_ROWS: readonly string[] = FRONT_MAN_ROWS.map((row, i) =>
  i === 10 ? '..sssoosss..' : i === 11 ? '...ssooss...' : row,
);

/** Facing us, hair down past the shoulders. */
const FRONT_WOMAN_ROWS: readonly string[] = [
  '...hhhhhh...',
  '..hhhhhhhh..',
  '.hhHHhhhhhh.',
  'hhhhhhhhhhhh',
  'hhhhhhhhhhhh',
  'hhsssssssshh',
  'hhsesssseshh',
  'hhsesssseshh',
  'hhrssssssrhh',
  'hhsssssssshh',
  'hhhssmmsshhh',
  'hhhhsssshhhh',
  'hhh.tttt.hhh',
  'hh........hh',
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

/** Office clothes: a jacket (top), trousers or a skirt (legs), and the shirt under it. */
interface Look {
  top: PaletteName;
  topShade: PaletteName;
  legs: PaletteName;
  legsShade: PaletteName;
  shirt: PaletteName;
  /** A tie, or none (a blouse). */
  tie?: PaletteName;
}

const GREY_SUIT: Look = {
  top: 'stone',
  topShade: 'slate',
  legs: 'slate',
  legsShade: 'night',
  shirt: 'paper',
  tie: 'red',
};
const NAVY_SUIT: Look = {
  top: 'denim',
  topShade: 'indigo',
  legs: 'indigo',
  legsShade: 'deep',
  shirt: 'paper',
  tie: 'honey',
};
const TEAL_JACKET: Look = {
  top: 'teal',
  topShade: 'moss',
  legs: 'slate',
  legsShade: 'night',
  shirt: 'paper',
};
const PLUM_JACKET: Look = {
  top: 'mauve',
  topShade: 'plum',
  legs: 'night',
  legsShade: 'ink',
  shirt: 'paper',
};

// ---------------------------------------------------------------------------
// Bodies. (hx, hy) is the top left of the 12 wide head; side figures face right.

/** A woman standing, seen from the side, in a jacket and a skirt. */
function standSideSkirt(s: Sheet, hx: number, hy: number, look: Look): void {
  const top = hy + 13;
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 4, top + 18, 2, 6, 'tan');
  s.rect(hx + 7, top + 18, 2, 6, 'skin');
  s.rect(hx + 3, top + 24, 3, 1, 'ink');
  s.rect(hx + 7, top + 24, 4, 1, 'ink');
  s.rect(hx + 2, top + 11, 9, 7, look.legs);
  s.rect(hx + 2, top + 11, 2, 7, look.legsShade);
  s.rect(hx + 1, top, 10, 12, look.top);
  s.rect(hx + 1, top, 2, 12, look.topShade);
  s.rect(hx + 8, top, 2, 3, look.shirt);
}

/** A person sitting, seen from the side, on an office chair. */
function sitSide(s: Sheet, hx: number, hy: number, look: Look): void {
  const seat = hy + 31;
  s.rect(hx - 2, hy + 15, 3, 15, 'slate');
  s.rect(hx - 2, seat, 18, 2, 'slate');
  s.rect(hx + 6, seat + 2, 2, 7, 'stone');
  s.rect(hx + 1, seat + 9, 12, 1, 'stone');
  s.rect(hx + 15, seat, 3, 9, look.legsShade);
  s.rect(hx + 15, seat + 9, 5, 2, 'ink');
  s.rect(hx + 3, seat - 6, 19, 6, look.legs);
  s.rect(hx + 3, seat - 1, 15, 1, look.legsShade);
  s.rect(hx + 19, seat, 3, 9, look.legs);
  s.rect(hx + 19, seat + 9, 5, 2, 'ink');
  s.rect(hx + 5, hy + 12, 3, 1, 'tan');
  s.rect(hx + 2, hy + 13, 9, 13, look.top);
  s.rect(hx + 2, hy + 13, 2, 13, look.topShade);
  s.rect(hx + 8, hy + 13, 2, 3, look.shirt);
}

/** The upper body facing us: jacket, the shirt collar and a tie. `rows` tall. */
function frontTorso(s: Sheet, hx: number, hy: number, look: Look, rows: number): void {
  const top = hy + 13;
  s.rect(hx - 1, top, 14, rows, look.top);
  s.rect(hx - 1, top, 2, rows, look.topShade);
  s.rect(hx + 11, top, 2, rows, look.topShade);
  s.rect(hx + 4, top, 4, 4, look.shirt);
  s.rect(hx + 5, top + 4, 2, 1, look.shirt);
  if (look.tie) {
    s.rect(hx + 5, top + 1, 2, 7, look.tie);
    s.rect(hx + 5, top + 8, 2, 1, look.topShade);
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

/** Someone in the audience seen from behind: head and shoulders, from `y` down. */
function backView(x: number, y: number, look: Look, woman: boolean): Sheet {
  const s = sheet();
  s.rect(x - 4, y + 11, 20, 14, look.top);
  s.rect(x - 4, y + 11, 4, 14, look.topShade);
  s.rect(x - 2, y + 10, 16, 1, look.top);
  paintSprite(
    s,
    head(woman ? BACK_WOMAN_ROWS : BACK_MAN_ROWS, woman ? BROWN_HAIR : DARK_HAIR),
    x,
    y,
  );
  return s;
}

// ---------------------------------------------------------------------------
// The meeting room

const FLOOR_TOP = 50;

/** The meeting room in the evening: lit wall, wooden boards on the lower wall, floor. */
function paintRoom(p: Painter, lightX: number): void {
  p.rect(0, 0, W, FLOOR_TOP, 'concrete');
  ditherRect(p, 0, 0, W, 3, 'stone', 8);
  lightPool(p, lightX, 18, 30, 20, [['fog', 0.6]], { y0: 3, y1: 38 });
  paintWainscot(p, W, 38, FLOOR_TOP);
  paintFloor(p, W, FLOOR_TOP, H);
}

/** Something flat lying on a table: each row sits half a pixel left of the one above. */
function flat(s: Painter, x: number, y: number, w: number, rows: number, color: PaletteName): void {
  for (let r = 0; r < rows; r++) s.rect(x + Math.floor((rows - 1 - r) / 2), y + r, w, 1, color);
}

/** A glass of water standing on a table, its foot at `y`. */
function glass(s: Painter, x: number, y: number): void {
  s.rect(x, y - 5, 3, 5, 'sky');
  s.rect(x, y - 3, 3, 3, 'cyan');
  s.rect(x, y - 5, 1, 5, 'paper');
}

// ---------------------------------------------------------------------------
// The pictures

/** She's pointing at the chart on the screen. */
const presenterChart: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 60);

  // the projection screen pulled down from its case, with a column chart on it
  const c = sheet();
  c.rect(30, 1, 64, 3, 'slate');
  c.rect(30, 1, 64, 1, 'stone');
  c.rect(32, 4, 60, 31, 'paper');
  c.rect(32, 34, 60, 1, 'fog');
  c.rect(60, 35, 4, 1, 'stone');
  c.flush(p);
  p.rect(38, 8, 1, 23, 'stone');
  p.rect(38, 30, 50, 1, 'stone');
  const bars: readonly (readonly [number, PaletteName])[] = [
    [8, 'teal'],
    [12, 'teal'],
    [10, 'teal'],
    [15, 'teal'],
    [20, 'lamp'],
  ];
  bars.forEach(([h, color], i) => {
    const x = 42 + i * 9;
    p.rect(x, 30 - h, 6, h, color);
    p.rect(x, 30 - h, 6, 1, color === 'lamp' ? 'honey' : 'cyan');
  });
  for (let y = 12; y < 30; y += 6) for (let x = 40; x < 88; x += 2) px(p, x, y, 'fog');

  // the presenter, beside the screen, pointing at it
  const look = TEAL_JACKET;
  const hx = 9;
  const hy = 17;
  const s = sheet();
  farArm(s, look, [hx + 5, hy + 16], [hx + 5, hy + 22], [hx + 8, hy + 26]);
  standSideSkirt(s, hx, hy, look);
  paintSprite(s, head(WOMAN_ROWS, DARK_HAIR, true), hx, hy);
  arm(s, look, [hx + 7, hy + 16], [hx + 16, hy + 11], [hx + 26, hy + 4]);
  s.part('ink', (q) => {
    q.rect(hx + 27, hy + 3, 3, 1, 'skin');
    q.rect(hx + 25, hy + 2, 1, 1, 'skin');
  });
  s.flush(p);

  // two people watching, seen from behind at the bottom edge
  backView(56, 45, NAVY_SUIT, false).flush(p);
  backView(78, 44, PLUM_JACKET, true).flush(p);
};

/** Four people are sitting around a meeting table. */
const meetingTable: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 48);
  paintWindow(p, 34, 3);

  // the two on the far side, facing us
  const back = sheet();
  frontTorso(back, 28, 13, NAVY_SUIT, 14);
  back.rect(25, 30, 3, 8, NAVY_SUIT.topShade);
  paintSprite(back, head(FRONT_MAN_ROWS, DARK_HAIR), 28, 13);
  frontTorso(back, 56, 13, PLUM_JACKET, 14);
  back.rect(68, 30, 3, 8, PLUM_JACKET.topShade);
  paintSprite(back, head(FRONT_WOMAN_ROWS, BROWN_HAIR, true), 56, 13);
  back.flush(p);

  // the one at the left end and the one at the right end, sitting sideways
  const leftLook = GREY_SUIT;
  const l = sheet();
  sitSide(l, 1, 13, leftLook);
  paintSprite(l, head(MAN_ROWS, DARK_HAIR), 1, 13);
  l.flush(p);
  const rightLook = TEAL_JACKET;
  const r = sheet(95);
  sitSide(r, 0, 13, rightLook);
  paintSprite(
    r,
    head(
      WOMAN_ROWS.map((row) => row.replace('oo', 'mm')),
      GREY_HAIR,
      true,
    ),
    0,
    13,
  );
  r.flush(p);

  // the table, seen a little from above, and what is on it
  const t = sheet();
  t.rect(14, 37, 68, 9, 'amber');
  t.rect(14, 37, 68, 1, 'honey');
  t.rect(14, 46, 68, 2, 'ember');
  t.rect(18, 48, 2, 10, 'ember');
  t.rect(76, 48, 2, 10, 'ember');
  // laptops of the two facing us: the backs of their lids
  for (const x of [27, 55]) {
    t.part('ink', (q) => {
      q.rect(x, 29, 14, 9, 'fog');
      q.rect(x, 29, 14, 1, 'paper');
      q.rect(x + 6, 32, 2, 2, 'paper');
      q.rect(x - 1, 38, 16, 1, 'stone');
    });
  }
  // the laptop of the man at the left end, its screen toward him
  t.part('ink', (q) => {
    q.rect(17, 42, 10, 2, 'stone');
    q.rect(26, 33, 2, 10, 'slate');
    q.rect(25, 34, 1, 8, 'cyan');
  });
  // papers in front of the woman at the right end
  t.part('ember', (q) => {
    q.rect(67, 41, 10, 3, 'paper');
    q.rect(68, 42, 7, 1, 'fog');
  });
  for (const [x, y] of [
    [44, 41],
    [50, 44],
    [35, 45],
    [80, 40],
  ] as const) {
    t.part('ink', (q) => glass(q, x, y));
  }
  t.flush(p);

  // the near arms of the two at the ends, resting on the table
  const la = sheet();
  arm(la, leftLook, [8, 30], [14, 37], [19, 41]);
  la.flush(p);
  const ra = sheet(95);
  arm(ra, rightLook, [7, 30], [13, 37], [22, 40]);
  ra.flush(p);
};

/** A man is speaking into a microphone. */
const speakerMicrophone: PictureFn = (target) => {
  const p = clipped(target, W, H);
  paintRoom(p, 46);
  paintWindow(p, 64, 4);
  paintPlant(p, 4, 26);

  // the speaker at the front, facing the room, a microphone at his mouth
  const look = GREY_SUIT;
  const hx = 40;
  const hy = 8;
  const top = hy + 13;
  const s = sheet();
  s.rect(hx + 1, top + 13, 4, 13, look.legsShade);
  s.rect(hx + 7, top + 13, 4, 13, look.legs);
  s.rect(hx, top + 26, 5, 2, 'ink');
  s.rect(hx + 7, top + 26, 5, 2, 'ink');
  frontTorso(s, hx, hy, look, 14);
  paintSprite(s, head(TALK_MAN_ROWS, DARK_HAIR), hx, hy);
  // the open hand, as he talks
  arm(s, look, [hx + 12, hy + 15], [hx + 16, hy + 21], [hx + 19, hy + 18]);
  // the hand holding the microphone up to his mouth
  arm(s, look, [hx - 1, hy + 15], [hx - 5, hy + 23], [hx + 2, hy + 20]);
  s.part('ink', (q) => {
    q.rect(hx + 2, hy + 15, 2, 4, 'slate');
    q.rect(hx + 2, hy + 11, 3, 1, 'fog');
    q.rect(hx + 1, hy + 12, 5, 2, 'fog');
    q.rect(hx + 2, hy + 14, 3, 1, 'stone');
    px(q, hx + 2, hy + 12, 'paper');
    px(q, hx + 3, hy + 13, 'stone');
    px(q, hx + 5, hy + 12, 'stone');
  });
  s.flush(p);

  // the front row: two people at a desk, seen from behind, writing in notebooks
  const row = (x: number, look: Look, woman: boolean): void => {
    const b = backView(x, 37, look, woman);
    b.flush(p);
  };
  row(8, NAVY_SUIT, false);
  row(66, PLUM_JACKET, true);
  const desk = sheet();
  desk.rect(0, 56, W, 4, 'amber');
  desk.rect(0, 56, W, 1, 'honey');
  desk.rect(0, 60, W, 4, 'ember');
  desk.rect(0, 60, W, 1, 'plum');
  desk.flush(p);
  // an open notebook beside each, the writing hand on it, a pen in the hand
  for (const x of [25, 81]) {
    const n = sheet();
    n.part('ink', (q) => {
      flat(q, x, 55, 13, 4, 'paper');
      q.rect(x + 7, 55, 1, 4, 'fog');
      q.rect(x + 2, 56, 4, 1, 'fog');
      q.rect(x + 9, 57, 3, 1, 'fog');
    });
    n.part('ink', (q) => {
      line(q, x - 2, 48, x + 3, 54, 'stone', 3);
      q.rect(x + 2, 53, 3, 3, 'skin');
      line(q, x + 4, 56, x + 7, 50, 'lamp');
    });
    n.flush(p);
  }
};

export const ACT4_PICTURES: Readonly<Record<string, PictureFn>> = {
  presenter_chart: presenterChart,
  meeting_table: meetingTable,
  speaker_microphone: speakerMicrophone,
};
