import {
  ditherGradient,
  ditherRect,
  ellipse,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { CLIENT_SPRITE } from './act3Cast';
import { BRANCH_MANAGER_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_W, paintLamp, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The overseas-branch stage: two weeks in August at Harbor Trading's new
 * little sales office in London. Four pictures.
 *
 * The London office (`paint`): a room in an old building. A shelf with the
 * kettle and mugs and a stack of boxes not yet unpacked on the left (you stand
 * in front of them), a white sash window onto London rooftops and chimney pots
 * at dusk with a dome far off, an old oak desk in front of it (things rest on
 * it, an open box underneath), and at the back a second desk with a monitor
 * and a lit Lantern lamp under a pendant light. Ms. Wright stands at the
 * desk's far end.
 *
 * The arrivals hall (`backdrops.officer`): a yellow arrivals sign, queue posts
 * with a red rope and a yellow line on the floor where you wait, then the
 * passport booth: a long ledge (things rest on it) and a glass enclosure with
 * a numbered roof, the border officer behind the glass.
 *
 * Mr. Hughes's store (`backdrops.client`): a dark green home-and-garden shop,
 * plants and a hanging basket on the left, a wooden counter with the till,
 * and on the right a display of lit Lantern desk lamps over teal cupboards
 * under a maroon banner. Ms. Wright stands by the counter; Mr. Hughes beside
 * her.
 *
 * The weekly meeting (`backdrops.manager`): the London office on the left and
 * a video-call panel on the right with a camera badge: Ms. Carter in the
 * American office, morning over the harbour in her window (nine in the
 * morning there, two in the afternoon here). The desk stays in front.
 *
 * All four have a surface with its top at the same height in the same place
 * (the desk, the booth ledge, the counter), so bubbles and props share one
 * set of spots. Like the other stages they fill any size: the 128x64 core
 * sits centred near the bottom, the walls go up (taller windows, a cornice,
 * pictures, ceiling lights) and the rooms go on to both sides (more windows,
 * shelves and boxes; more booths and queue posts; more lamps and plants).
 * Painted through the Painter interface, palette colours only, whole pixels.
 */

/** The y of the desk top, the booth ledge and the store counter, in core pixels. */
const SURFACE_TOP = 46;
/** 24x24 pictures stand on that surface with their shadow on it. */
const PROP_TOP = SURFACE_TOP - 20;
/** The left edge of the desk, the ledge and the counter. */
const SURFACE_X = 38;
/** The office desk's width (it ends where Ms. Wright stands). */
const DESK_W = 44;
/** Where the floor starts in every picture. */
const FLOOR_TOP = 56;
/** Width of one bay beside the core. */
const BAY_W = 40;

/** Ms. Wright, at the desk's (or the counter's) far end. */
const WRIGHT = { x: 80, y: 39 } as const;
/** Mr. Hughes beside her in his store. */
const HUGHES = { x: 96, y: 39 } as const;
/** The border officer behind the booth's glass, cut off at the ledge. */
const OFFICER = { x: 88, y: 31 } as const;
/** Ms. Carter inside the video panel, on her office's floor. */
const CARTER = { x: 94, y: 37 } as const;

// The London office
/** The dado rail between the pale wall and the panelling. */
const RAIL_Y = 38;
/** The sash window's glass in core pixels (it grows upward on a tall stage). */
const SASH = { x: 58, y: 6, w: 24, h: 28 } as const;
/** How much taller the sash windows grow on a tall stage, at most. */
const SASH_GROW = 34;
/** The second desk at the back: its left edge and top. */
const BACK_DESK = { x: 96, top: 42 } as const;
/** The video panel: its outer border, in core pixels. */
const PANEL = { x: 62, y: 2, w: 62, h: 62 } as const;

// The arrivals hall
/** The passport booth's glass enclosure: posts at x and x + w - 2, roof at y. */
const BOOTH = { x: 62, w: 58, roof: 11 } as const;
/** The ledge runs from SURFACE_X to here. */
const LEDGE_END = 120;
/** The purple stripe along the hall wall. */
const STRIPE_Y = 34;

// The store
/** The counter's right end. */
const COUNTER_END = 86;
/** The lamp display: its left edge, the top of the cupboards below the shelves. */
const DISPLAY = { x: 88, cupboards: 34 } as const;
/** The wainscot rail of the store. */
const STORE_RAIL = 40;

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

/** Paints a tiny bitmap; each character maps to a colour, '.' is left alone. */
function bitmap(
  p: Painter,
  x: number,
  y: number,
  rows: readonly string[],
  colours: Readonly<Record<string, PaletteName>>,
): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = colours[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
}

/** The x of every bay left of the core (from the nearest outwards), then right of it. */
function bays(w: number, ox: number): { left: number[]; right: number[] } {
  const left: number[] = [];
  for (let x = ox - BAY_W; x + BAY_W > 0; x -= BAY_W) left.push(x);
  const right: number[] = [];
  for (let x = ox + CORE_W; x < w; x += BAY_W) right.push(x);
  return { left, right };
}

// ---------------------------------------------------------------------------
// The officer

/** The UK border officer: cropped ginger hair and beard, a dark uniform shirt with white epaulettes. */
const OFFICER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhh......',
    '....hhhhhhhh....',
    '....hHhhhhhhh...',
    '....sssshhhhh...',
    '...ssesssshhh...',
    '....sssssssh....',
    '....rbbsssbb....',
    '.....bbbbbb.....',
    '.....cctccc.....',
    '....cccTcccooc..',
    '....cCcTcccCcc..',
    '....cCcTcgcCcc..',
    '....cCcccccCcc..',
    '....cCcccccCss..',
    '....cccccccCss..',
    '....cccccccc....',
    '.....dddydd.....',
    '.....pppppp.....',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '....kkkkk.......',
  ],
  legend: {
    h: 'amber',
    H: 'honey',
    s: 'skin',
    e: 'ink',
    r: 'tan',
    b: 'ember',
    c: 'slate',
    C: 'night',
    t: 'stone',
    T: 'ink',
    o: 'fog',
    g: 'honey',
    d: 'ink',
    y: 'concrete',
    p: 'night',
    q: 'ink',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// Things more than one picture uses

/** A Lantern desk lamp, 7 wide and 10 tall from (x, y): a little lantern-shaped shade on a stem. */
const LANTERN: readonly string[] = [
  '...k...',
  '..kkk..',
  '.kkkkk.',
  '.kYyYk.',
  '.kyYyk.',
  '.kYyYk.',
  '.kkkkk.',
  '...k...',
  '..kkk..',
  '.kkkkk.',
];

/** A lit Lantern with its warm glow; `metal` is the frame colour. */
function paintLantern(
  p: Painter,
  x: number,
  y: number,
  metal: PaletteName = 'ink',
  glow: readonly number[] = [0.3, 0.16, 0.07],
): void {
  glowEllipse(p, x + 3, y + 4, 3 + glow.length * 2, 2 + glow.length * 2, 'honey', glow);
  bitmap(p, x, y, LANTERN, { k: metal, Y: 'honey', y: 'lamp' });
  px(p, x + 3, y + 1, 'stone');
}

/** A cardboard box, taped across the top; `open` shows its flaps up and packing inside. */
function paintBox(p: Painter, x: number, y: number, w: number, h: number, open = false): void {
  p.rect(x, y, w, h, 'amber');
  p.rect(x + w - 3, y, 3, h, 'ember');
  p.rect(x, y + h - 1, w, 1, 'ember');
  if (open) {
    p.rect(x + 1, y - 1, w - 2, 1, 'paper');
    px(p, x + 3, y - 2, 'paper');
    px(p, x + w - 5, y - 2, 'fog');
    p.rect(x - 2, y - 3, 3, 1, 'amber');
    px(p, x - 1, y - 2, 'amber');
    p.rect(x + w - 1, y - 3, 3, 1, 'ember');
    px(p, x + w, y - 2, 'ember');
  } else {
    p.rect(x, y, w, 1, 'honey');
    p.rect(x + Math.floor(w / 2) - 1, y, 2, Math.min(4, h), 'lamp');
  }
  // a small lamp printed on the side: it holds Lanterns
  if (w >= 10 && h >= 7) {
    const lx = x + 2;
    const ly = y + h - 6;
    p.rect(lx, ly, 3, 3, 'ember');
    px(p, lx + 1, ly + 3, 'ember');
    p.rect(lx, ly + 4, 3, 1, 'ember');
  }
}

/** Old oak floorboards, counted from the core so they never shift. */
function paintBoards(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'ember');
  p.rect(0, floorTop, w, 1, 'plum');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'plum');
    for (let x = mod(ox + row * 13, 22); x < w; x += 22) px(p, x, y - 1, 'plum');
    for (let x = mod(ox + 7 + row * 9, 26); x < w; x += 26) p.rect(x, y - 2, 4, 1, 'amber');
  }
}

// ---------------------------------------------------------------------------
// The London office

/** The office with Ms. Wright. */
function paintBranch(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h, false);
  const { ox, oy } = coreOrigin(w, h);
  paintDesk(p, ox + SURFACE_X, oy + SURFACE_TOP, oy + FLOOR_TOP);
}

/** The office on the left, Ms. Carter in a video panel on the right, the desk in front. */
function paintVideo(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h, true);
  const { ox, oy } = coreOrigin(w, h);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y, ox);
  paintDesk(p, ox + SURFACE_X, oy + SURFACE_TOP, oy + FLOOR_TOP);
}

/** Everything of the office but the front desk. With `call` the core's right half is left to the panel. */
function paintRoom(p: Painter, w: number, h: number, call: boolean): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const railY = oy + RAIL_Y;
  const grow = Math.min(SASH_GROW, Math.max(0, oy - 4));
  const sashTop = oy + SASH.y - grow;
  const sashH = SASH.h + grow;
  const { left, right } = bays(w, ox);

  // The wall: warm white paint, a faint stripe, lamp light on it.
  p.rect(0, 0, w, railY, 'fog');
  for (let x = mod(ox + 3, 10); x < w; x += 10) p.rect(x, 0, 1, railY, 'paper');
  glowEllipse(p, ox + 104, oy + 14, 40, 26, 'honey', [0.22, 0.12, 0.06]);
  glowEllipse(p, ox + 16, oy + 20, 26, 20, 'honey', [0.16, 0.08]);
  // a picture rail over the windows on a taller stage, arched high windows above it
  const rail = sashTop - 8;
  if (rail >= 16) {
    p.rect(0, 0, w, rail, 'concrete');
    for (let x = mod(ox + 1, 10); x < w; x += 10) p.rect(x, 0, 1, rail, 'fog');
    p.rect(0, rail, w, 2, 'paper');
    p.rect(0, rail + 2, w, 1, 'stone');
    const archH = Math.min(64, rail - 14);
    if (archH >= 12) {
      for (let cx = mod(ox + SASH.x, BAY_W * 2) - BAY_W * 2; cx < w; cx += BAY_W * 2) {
        paintArch(p, cx, rail - 6 - archH, SASH.w, archH, cx - ox, 'paper');
      }
    }
  }
  p.rect(0, 0, w, 2, 'paper');
  p.rect(0, 2, w, 1, 'fog');
  p.rect(0, 3, w, 1, 'concrete');

  // Up the wall, beside the window, when there is room above the core.
  if (oy >= 20) {
    paintMapFrame(p, ox + 22, oy - 18);
    if (!call) paintPoster(p, ox + 96, oy - 17);
  }

  // The lower wall: a white dado rail over panelling, a white skirting board.
  p.rect(0, railY, w, floorTop - railY, 'concrete');
  for (let x = mod(ox + 2, 16); x < w; x += 16) {
    p.rect(x, railY + 4, 12, floorTop - railY - 9, 'stone');
    p.rect(x + 1, railY + 5, 11, floorTop - railY - 11, 'concrete');
    p.rect(x, railY + 4, 12, 1, 'fog');
  }
  p.rect(0, railY, w, 1, 'paper');
  p.rect(0, railY + 1, w, 1, 'stone');
  p.rect(0, floorTop - 2, w, 2, 'paper');
  paintBoards(p, w, ox, floorTop, h);

  // The bays to both sides.
  left.forEach((x, i) => {
    const kind = i % 3;
    if (kind === 0) paintSash(p, x + 8, sashTop, sashH, x, floorTop);
    else if (kind === 1) paintShelves(p, x + 6, oy + 18, floorTop, x);
    else {
      paintBox(p, x + 4, floorTop - 12, 16, 12);
      paintBox(p, x + 6, floorTop - 20, 12, 8);
      paintPlant(p, x + 26, floorTop - 20);
    }
  });
  right.forEach((x, i) => {
    const kind = i % 3;
    if (kind === 0) paintShelves(p, x + 6, oy + 18, floorTop, x);
    else if (kind === 1) paintSash(p, x + 8, sashTop, sashH, x, floorTop);
    else {
      paintPlant(p, x + 4, floorTop - 20);
      paintBox(p, x + 18, floorTop - 10, 18, 10, true);
    }
  });

  // The core: the kettle shelf and boxes on the left.
  paintKettleShelf(p, ox + 3, oy + 24);
  paintBox(p, ox + 1, floorTop - 13, 18, 13);
  paintBox(p, ox + 3, floorTop - 22, 13, 9);
  paintBox(p, ox + 6, floorTop - 27, 8, 5, true);
  if (!call) {
    paintSash(p, ox + SASH.x, sashTop, sashH, ox, floorTop);
    paintLamp(p, ox + 110, oy);
    paintBackDesk(p, ox + BACK_DESK.x, oy + BACK_DESK.top, floorTop);
  }
}

/** A tall arched window high on the wall: only the evening sky, a few stars, glazing bars. */
function paintArch(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  frame: PaletteName,
): void {
  const r = Math.floor(w / 2);
  const shape = (painter: Painter, grow: number, color: PaletteName): void => {
    for (let dy = 0; dy < h + grow * 2; dy++) {
      const yy = y - grow + dy;
      const fromTop = yy - (y - grow);
      let half = r + grow;
      if (fromTop < r + grow) {
        const k = r + grow - fromTop;
        half = Math.floor(Math.sqrt(Math.max(0, (r + grow) ** 2 - k * k)));
      }
      painter.rect(x + r - half, yy, half * 2, 1, color);
    }
  };
  shape(p, 2, frame);
  shape(p, 0, 'deep');
  const glass: Painter = {
    rect(rx, ry, rw, rh, color, alpha) {
      for (let yy = ry; yy < ry + rh; yy++) {
        const fromTop = yy - y;
        if (fromTop < 0 || fromTop >= h) continue;
        let half = r;
        if (fromTop < r) half = Math.floor(Math.sqrt(Math.max(0, r * r - (r - fromTop) ** 2)));
        const x0 = Math.max(rx, x + r - half);
        const x1 = Math.min(rx + rw, x + r + half);
        if (x1 > x0) p.rect(x0, yy, x1 - x0, 1, color, alpha);
      }
    },
  };
  ditherGradient(glass, x, y, w, h, ['deep', 'deep', 'indigo', 'dusk', 'violet']);
  for (let i = 0; i < 5; i++) {
    const sx = x + 2 + Math.floor(hash2(seed, i, 151) * (w - 4));
    const sy = y + r + Math.floor(hash2(seed, i, 157) * Math.max(1, h - r - 2));
    glass.rect(sx, sy, 1, 1, hash2(seed, i, 163) > 0.6 ? 'paper' : 'fog');
  }
  glass.rect(x + r, y, 1, h, frame);
  for (let yy = y + r + 2; yy < y + h - 2; yy += 12) glass.rect(x, yy, w, 1, frame);
  p.rect(x - 3, y + h + 2, w + 6, 1, frame);
}

/**
 * A white sash window: a top and a bottom sash of six panes each, London
 * outside at dusk, a radiator under the sill.
 */
function paintSash(
  p: Painter,
  x: number,
  y: number,
  h: number,
  seed: number,
  floorTop: number,
): void {
  const w = SASH.w;
  // the radiator under the sill
  const ry = y + h + 5;
  if (floorTop - 3 - ry >= 4) {
    p.rect(x + 2, ry, w - 4, floorTop - 3 - ry, 'paper');
    for (let fx = x + 3; fx < x + w - 3; fx += 2) p.rect(fx, ry + 1, 1, floorTop - 5 - ry, 'fog');
    p.rect(x + 2, floorTop - 4, w - 4, 1, 'stone');
  }
  // the frame and the view
  p.rect(x - 2, y - 2, w + 4, h + 4, 'paper');
  p.rect(x + w + 1, y - 2, 1, h + 4, 'fog');
  paintLondon(within(p, x, y, w, h), x, y, w, h, seed);
  // glazing bars: two columns, three rows in each sash, a thicker meeting rail
  const meet = y + Math.floor(h / 2);
  p.rect(x + Math.floor(w / 2), y, 1, h, 'paper');
  for (const [top, bottom] of [
    [y, meet],
    [meet + 2, y + h],
  ] as const) {
    const third = Math.floor((bottom - top) / 3);
    p.rect(x, top + third, w, 1, 'paper');
    p.rect(x, top + third * 2, w, 1, 'paper');
  }
  p.rect(x - 1, meet, w + 2, 2, 'paper');
  p.rect(x, meet + 2, w, 1, 'fog');
  px(p, x + Math.floor(w / 2) - 2, meet + 1, 'honey'); // the brass catch
  // the sill
  p.rect(x - 3, y + h + 2, w + 6, 1, 'paper');
  p.rect(x - 3, y + h + 3, w + 6, 1, 'concrete');
}

/** London at dusk: a rosy sky, a far dome, terraced roofs with chimney pots, lit windows. */
function paintLondon(p: Painter, x: number, y: number, w: number, h: number, seed: number): void {
  const roofs = y + h - 9;
  ditherGradient(p, x, y, w, roofs - y + 3, ['deep', 'indigo', 'violet', 'mauve', 'rosy']);
  for (let i = 0; i < 4; i++) {
    const sx = x + 1 + Math.floor(hash2(seed, i, 17) * (w - 2));
    const sy = y + 1 + Math.floor(hash2(seed, i, 19) * Math.max(1, roofs - y - 12));
    px(p, sx, sy, hash2(seed, i, 23) > 0.6 ? 'paper' : 'fog');
  }
  // a dome far off, in every other window
  if (mod(seed, 80) < 40) {
    const dx = x + 6 + mod(seed, 7);
    ellipse(p, dx, roofs - 3, 3, 3, 'violet');
    p.rect(dx - 4, roofs - 1, 9, 3, 'violet');
    p.rect(dx, roofs - 8, 1, 3, 'violet');
    px(p, dx, roofs - 9, 'rosy');
  }
  // terraced houses across the road: slate roofs, chimney stacks with pots, lit windows
  for (let i = 0; i < w;) {
    const bw = 6 + Math.floor(hash2(seed + i, 1, 29) * 5);
    const bh = 2 + Math.floor(hash2(seed + i, 2, 31) * 3);
    const top = roofs - bh + 3;
    p.rect(x + i, top, bw, y + h - top, 'night');
    p.rect(x + i, top, bw, 1, 'slate');
    if (hash2(seed + i, 3, 37) < 0.7) {
      const cx = x + i + 1 + Math.floor(hash2(seed + i, 4, 41) * (bw - 3));
      p.rect(cx, top - 3, 3, 3, 'night');
      px(p, cx, top - 4, 'ember');
      px(p, cx + 2, top - 4, 'ember');
    }
    for (let wy = top + 2; wy < y + h - 1; wy += 3) {
      for (let wx = x + i + 1; wx < x + i + bw - 1; wx += 2) {
        if (hash2(wx, wy, 43) < 0.32) px(p, wx, wy, hash2(wx, wy, 47) < 0.5 ? 'honey' : 'lamp');
      }
    }
    i += bw;
  }
}

/** A wall shelf on two brackets: the electric kettle, a tea caddy and three mugs. */
function paintKettleShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 21, 2, 'amber');
  p.rect(x, y, 21, 1, 'honey');
  p.rect(x + 2, y + 2, 1, 3, 'ember');
  p.rect(x + 18, y + 2, 1, 3, 'ember');
  // the kettle: a white jug with a dark handle and base
  p.rect(x + 1, y - 7, 6, 7, 'paper');
  p.rect(x + 5, y - 7, 2, 7, 'fog');
  p.rect(x + 1, y - 1, 6, 1, 'slate');
  p.rect(x + 2, y - 8, 4, 1, 'paper');
  px(p, x, y - 6, 'paper'); // the spout
  p.rect(x + 7, y - 6, 1, 4, 'ink'); // the handle
  px(p, x + 3, y - 4, 'cyan'); // the light on its switch
  // the tea caddy
  p.rect(x + 9, y - 5, 3, 5, 'red');
  p.rect(x + 9, y - 5, 3, 1, 'honey');
  // three mugs
  const mugs: readonly PaletteName[] = ['denim', 'paper', 'leaf'];
  mugs.forEach((c, i) => {
    const mx = x + 13 + i * 3;
    p.rect(mx, y - 3, 2, 3, c);
    px(p, mx + 2, y - 2, c);
  });
}

/** A low bookcase of binders and folders, a box on top. */
function paintShelves(p: Painter, x: number, top: number, floorTop: number, seed: number): void {
  const w = 26;
  const bottom = floorTop;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, bottom - top - 3, 'plum');
  const colours: readonly PaletteName[] = ['denim', 'red', 'teal', 'paper', 'leaf', 'maroon'];
  for (let s = 0, sy = top + 12; sy < bottom - 2; sy += 11, s++) {
    for (let bx = x + 2, i = 0; bx + 2 <= x + w - 2; i++) {
      const bw = 2 + Math.floor(hash2(i, seed + s, 53) * 2);
      if (bx + bw > x + w - 2) break;
      const bh = 6 + Math.floor(hash2(i, seed + s, 59) * 4);
      const c = colours[Math.floor(hash2(i, seed + s, 61) * colours.length)] ?? 'denim';
      if (hash2(i, seed + s, 67) > 0.15) p.rect(bx, sy - bh, bw, bh, c);
      bx += bw;
    }
    p.rect(x + 2, sy, w - 4, 1, 'amber');
  }
  paintBox(p, x + 3, top - 7, 12, 7);
}

/** The old oak desk you and Ms. Wright share: things rest on its top, an open box under it. */
function paintDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = DESK_W;
  // its shadow on the floor
  p.rect(x + 1, floorTop + 2, w, 1, 'plum');
  // a box under it, opened, a lamp's shade peeking out
  paintBox(p, x + 9, floorTop - 6, 14, 7, true);
  p.rect(x + 14, floorTop - 9, 4, 2, 'honey');
  px(p, x + 15, floorTop - 10, 'ink');
  // the legs and the drawer
  for (const lx of [x + 1, x + w - 4]) p.rect(lx, top + 5, 3, floorTop + 2 - top - 5, 'ember');
  p.rect(x + w - 16, top + 4, 12, 5, 'ember');
  p.rect(x + w - 15, top + 5, 10, 3, 'amber');
  p.rect(x + w - 11, top + 6, 2, 1, 'honey');
  // the top, a pixel proud of the apron
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 2, 'amber');
  p.rect(x + 1, top + 3, w - 2, 1, 'ember');
  p.rect(x + 1, top + 4, w - 2, 1, 'plum');
  // the cable for a laptop, hanging down the side
  p.rect(x + 4, top + 3, 1, 3, 'ink');
}

/** The second desk at the back: a monitor, a lit Lantern lamp, a chair pushed in, a box on the floor. */
function paintBackDesk(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 30;
  // the box beside it
  paintBox(p, x + 20, floorTop - 9, 12, 9);
  // a pot of pens and a notepad
  p.rect(x + 11, top - 4, 3, 4, 'red');
  px(p, x + 11, top - 6, 'denim');
  p.rect(x + 12, top - 5, 1, 1, 'ink');
  // the lamp and the monitor
  paintLantern(p, x + 2, top - 10);
  p.rect(x + 16, top - 11, 12, 8, 'ink');
  p.rect(x + 17, top - 10, 10, 6, 'denim');
  ditherRect(p, x + 17, top - 10, 10, 2, 'sky', 6);
  p.rect(x + 21, top - 3, 2, 3, 'ink');
  p.rect(x + 19, top - 1, 6, 1, 'ink');
  // the desk itself, pale wood on white legs
  p.rect(x, top, w, 1, 'paper');
  p.rect(x, top + 1, w, 2, 'fog');
  p.rect(x, top + 3, w, 1, 'concrete');
  for (const lx of [x + 1, x + w - 3]) p.rect(lx, top + 4, 2, floorTop - top - 4, 'fog');
}

/** A framed old map of London on the wall: a winding river through pale streets. */
function paintMapFrame(p: Painter, x: number, y: number): void {
  p.rect(x, y, 20, 15, 'ink');
  p.rect(x + 1, y + 1, 18, 13, 'paper');
  for (let i = 0; i < 18; i++) {
    const ry = y + 7 + Math.round(Math.sin(i / 3) * 2);
    p.rect(x + 1 + i, ry, 1, 2, 'sky');
  }
  for (let i = 0; i < 5; i++) {
    p.rect(x + 3 + i * 3, y + 2, 1, 4, 'fog');
    p.rect(x + 2 + i * 3, y + 10, 1, 3, 'fog');
  }
  px(p, x + 9, y + 4, 'red');
  p.rect(x + 1, y + 15, 19, 1, 'concrete');
}

/** A poster of the Lantern lamp: a lit lamp on a deep blue ground. */
function paintPoster(p: Painter, x: number, y: number): void {
  p.rect(x, y, 14, 16, 'paper');
  p.rect(x + 1, y + 1, 12, 14, 'deep');
  bitmap(p, x + 4, y + 3, LANTERN, { k: 'paper', Y: 'honey', y: 'lamp' });
  p.rect(x + 3, y + 13, 8, 1, 'honey');
  p.rect(x + 1, y + 16, 14, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The video panel: Ms. Carter in the American office

/** The panel with its rounded, inked border, the office inside and a camera badge on top. */
function paintPanel(p: Painter, x: number, y: number, ox: number): void {
  const { w, h } = PANEL;
  p.rect(x + 2, y + 2, w, h, 'ink', 0.35);
  p.rect(x + 2, y, w - 4, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ink');
  p.rect(x, y + 2, w, h - 4, 'ink');
  p.rect(x + 2, y + 1, w - 4, h - 2, 'paper');
  p.rect(x + 1, y + 2, w - 2, h - 4, 'paper');
  const ix = x + 3;
  const iy = y + 3;
  const iw = w - 6;
  const ih = h - 5;
  p.rect(ix - 1, iy - 1, iw + 2, ih + 2, 'ink');
  paintUsOffice(within(p, ix, iy, iw, ih), ix, iy, iw, ih, x - ox);
  bitmap(p, x + 33, y - 2, CAMERA_BADGE, BADGE_COLOURS);
  p.rect(x + 34, y + 11, 15, 1, 'ink', 0.35);
}

/** Inside the panel: a morning harbour in the window, a whiteboard, the plum lower wall, a lit Lantern. */
function paintUsOffice(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  coreX: number,
): void {
  const bottom = y + h;
  const carpet = bottom - 5;
  const lower = carpet - 12;
  p.rect(x, y, w, lower - y, 'fog');
  glowEllipse(p, x + w - 14, y + 18, 28, 20, 'paper', [0.2, 0.1]);
  // the whiteboard with this week's agenda
  p.rect(x + 3, y + 7, 20, 15, 'concrete');
  p.rect(x + 4, y + 8, 18, 13, 'paper');
  for (let i = 0; i < 4; i++) {
    px(p, x + 6, y + 10 + i * 3, 'red');
    p.rect(x + 8, y + 10 + i * 3, 6 + ((i * 5) % 9), 1, i === 0 ? 'denim' : 'stone');
  }
  p.rect(x + 6, y + 22, 14, 1, 'stone');
  // the window onto the harbour in the morning
  const wx = x + 27;
  const wy = y + 3;
  const ww = w - 30;
  const wh = 26;
  p.rect(wx - 1, wy - 1, ww + 2, wh + 2, 'paper');
  paintMorningHarbour(within(p, wx, wy, ww, wh), wx, wy, ww, wh);
  p.rect(wx + Math.floor(ww / 2), wy, 1, wh, 'paper');
  p.rect(wx - 2, wy + wh + 1, ww + 4, 1, 'paper');
  p.rect(wx - 2, wy + wh + 2, ww + 4, 1, 'concrete');
  // the plum lower wall under a pale rail, then slate carpet
  p.rect(x, lower, w, carpet - lower, 'plum');
  p.rect(x, lower, w, 1, 'paper');
  p.rect(x, lower + 1, w, 1, 'concrete');
  for (let lx = x + mod(5 - coreX, 12); lx < x + w; lx += 12) {
    p.rect(lx, lower + 3, 1, carpet - lower - 5, 'maroon');
  }
  p.rect(x, carpet - 2, w, 2, 'night');
  p.rect(x, carpet, w, bottom - carpet, 'slate');
  p.rect(x, carpet, w, 1, 'ink');
  for (let row = 0; carpet + 2 + row * 3 < bottom; row++) {
    for (let cx = x + (row % 2) * 4; cx < x + w; cx += 8) px(p, cx, carpet + 2 + row * 3, 'stone');
  }
  // a side table by the window with a lit Lantern and a mug
  const tx = x + w - 11;
  const ttop = lower - 4;
  paintLantern(p, tx + 1, ttop - 10);
  p.rect(tx, ttop, 10, 2, 'amber');
  p.rect(tx, ttop, 10, 1, 'honey');
  p.rect(tx + 4, ttop + 2, 2, carpet - ttop - 2, 'ember');
  p.rect(tx + 2, carpet - 1, 6, 1, 'ember');
}

/** The harbour at nine in the morning: a pale sky, the sun up, blue water, the far shore and a crane. */
function paintMorningHarbour(p: Painter, x: number, y: number, w: number, h: number): void {
  const horizon = y + h - 8;
  ditherGradient(p, x, y, w, horizon - y, ['sky', 'sky', 'fog', 'rosy', 'honey']);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['teal', 'denim', 'indigo']);
  // the sun, low in the east
  ellipse(p, x + 6, horizon - 6, 2, 2, 'paper');
  glowEllipse(p, x + 6, horizon - 6, 6, 5, 'paper', [0.35, 0.15]);
  for (let i = 0; i < w; i += 4) px(p, x + i + 1, horizon + 2 + (i % 3), 'sky');
  p.rect(x + 3, horizon + 1, 6, 1, 'honey');
  // the far shore
  for (let i = 0; i < w; i++) {
    const bump = Math.round(1.5 + Math.sin(i / 5) + Math.sin(i / 2.7) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'stone');
  }
  // a crane on the quay and a ship
  const cr = x + w - 8;
  p.rect(cr, horizon - 11, 1, 10, 'slate');
  p.rect(cr - 8, horizon - 11, 12, 1, 'slate');
  p.rect(cr - 6, horizon - 10, 1, 3, 'slate');
  px(p, cr, horizon - 12, 'red');
  p.rect(x + 12, horizon + 1, 12, 2, 'slate');
  p.rect(x + 14, horizon - 1, 3, 2, 'maroon');
  p.rect(x + 17, horizon - 1, 3, 2, 'teal');
  p.rect(x + 20, horizon - 3, 3, 4, 'paper');
}

/**
 * The camera badge on the panel's top edge: a rounded paper tag in an ink
 * rim, a video camera with its red recording light. O rim, w paper, k camera,
 * r light.
 */
const CAMERA_BADGE: readonly string[] = [
  '.OOOOOOOOOOOOOO.',
  'OwwwwwwwwwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  'OwwkkkkkkkwwwwwO',
  'OwwkrkkkkkwwwkwO',
  'OwwkkkkkkkwwkkwO',
  'OwwkkkkkkkwkkkwO',
  'OwwkkkkkkkwwkkwO',
  'OwwkkkkkkkwwwkwO',
  'OwwkkkkkkkwwwwwO',
  'OwwwwwwwwwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  '.OOOOOOOOOOOOOO.',
];
const BADGE_COLOURS: Readonly<Record<string, PaletteName>> = {
  O: 'ink',
  w: 'paper',
  k: 'ink',
  r: 'red',
};

// ---------------------------------------------------------------------------
// The arrivals hall

/** The arrivals hall with the passport booth and the officer. */
function paintBorder(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const stripe = oy + STRIPE_Y;
  const { left } = bays(w, ox);

  // The hall wall: pale grey panels, cool light from above.
  p.rect(0, 0, w, floorTop, 'concrete');
  for (let x = mod(ox + 6, 20); x < w; x += 20) p.rect(x, 0, 1, stripe, 'stone');
  // a ceiling with strip lights and a band of high glass, when there is room
  const ceiling = oy >= 30 ? Math.min(16, Math.floor(oy / 4)) : 0;
  if (ceiling > 0) {
    const glassTop = ceiling + 6;
    const glassBottom = oy - 10;
    if (glassBottom - glassTop >= 10) paintHighGlass(p, w, ox, glassTop, glassBottom);
    p.rect(0, 0, w, ceiling, 'slate');
    for (let y = 3, k = 0; y < ceiling - 1; y += 5, k++) {
      for (let x = mod(ox + 4 + k * 9, 30); x < w; x += 30) p.rect(x, y, 14, 1, 'paper');
    }
    p.rect(0, ceiling, w, 1, 'night');
    p.rect(0, ceiling + 1, w, 1, 'stone');
  }
  // the purple stripe and the dark cladding below it
  p.rect(0, stripe, w, 2, 'violet');
  p.rect(0, stripe + 2, w, 1, 'mauve');
  p.rect(0, stripe + 3, w, floorTop - stripe - 3, 'stone');
  for (let x = mod(ox + 6, 20); x < w; x += 20)
    p.rect(x, stripe + 3, 1, floorTop - stripe - 3, 'slate');
  p.rect(0, floorTop - 2, w, 2, 'slate');
  paintHallFloor(p, w, ox, floorTop, h);

  // The bays: queue lanes and posters to the left, more booths to the right.
  left.forEach((x, i) => {
    if (i % 2 === 0) paintLightBox(p, x + 8, oy + 8, x);
    else paintArrivalsSign(p, x + 7, oy + 4, ceiling);
  });
  for (let x = ox + LEDGE_END + 6, n = 4; x < w; x += BOOTH.w + 8, n++) {
    paintBooth(p, x, oy, floorTop, n);
  }

  // The core: the arrivals sign, the queue posts and rope, the booth.
  paintArrivalsSign(p, ox + 3, oy + 4, ceiling);
  paintQueue(p, w, ox, floorTop);
  p.rect(ox + 4, floorTop + 2, 30, 1, 'lamp'); // the yellow line: wait here
  paintBooth(p, ox + BOOTH.x, oy, floorTop, 3);
  paintLedge(p, ox + SURFACE_X, oy + SURFACE_TOP, ox + LEDGE_END, floorTop);
}

/** High glass along the hall: the evening sky, a plane's lights far off, steel mullions. */
function paintHighGlass(p: Painter, w: number, ox: number, top: number, bottom: number): void {
  const h = bottom - top;
  p.rect(0, top - 2, w, h + 4, 'slate');
  ditherGradient(p, 0, top, w, h, ['deep', 'indigo', 'dusk', 'violet', 'mauve']);
  for (let i = 0; i < Math.floor(w / 9); i++) {
    const sx = mod(ox + Math.floor(hash2(i, 3, 173) * 997), w);
    const sy = top + 1 + Math.floor(hash2(i, 5, 179) * Math.max(1, h - 4));
    px(p, sx, sy, hash2(i, 7, 181) > 0.7 ? 'paper' : 'fog');
  }
  // a plane coming in to land, its lights on
  const plx = ox + 40;
  const ply = top + Math.floor(h / 2);
  p.rect(plx, ply, 7, 1, 'night');
  p.rect(plx + 2, ply - 1, 2, 1, 'night');
  p.rect(plx + 3, ply + 1, 2, 1, 'night');
  px(p, plx + 7, ply, 'honey');
  px(p, plx, ply - 1, 'red');
  for (let x = mod(ox + 10, 20); x < w; x += 20) p.rect(x, top, 2, h, 'slate');
  p.rect(0, top + Math.floor(h / 2) + 6, w, 1, 'slate');
  p.rect(0, bottom, w, 2, 'stone');
  p.rect(0, bottom + 2, w, 1, 'night');
}

/** Grey terrazzo with a tile grid, counted from the core. */
function paintHallFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'stone');
  p.rect(0, floorTop, w, 1, 'night');
  for (let y = floorTop + 4; y < h; y += 4) p.rect(0, y, w, 1, 'slate');
  for (let y = floorTop + 1; y < h; y++) {
    for (let x = mod(ox + 3 + (y - floorTop) * 2, 24); x < w; x += 24) px(p, x, y, 'slate');
  }
  for (let y = floorTop + 1; y < h; y++) {
    for (let x = mod(ox + y * 7, 11); x < w; x += 11) {
      if (hash2(x - ox, y - floorTop, 71) < 0.3) px(p, x, y, 'concrete');
    }
  }
}

/** The yellow arrivals sign: a plane landing, an arrow. Hung from the ceiling when there is one. */
function paintArrivalsSign(p: Painter, x: number, y: number, ceiling: number): void {
  if (ceiling > 0) {
    p.rect(x + 4, ceiling, 1, y - ceiling, 'ink');
    p.rect(x + 20, ceiling, 1, y - ceiling, 'ink');
  }
  p.rect(x, y, 25, 11, 'ink');
  p.rect(x + 1, y + 1, 23, 9, 'lamp');
  p.rect(x + 1, y + 1, 23, 1, 'honey');
  bitmap(p, x + 2, y + 2, PLANE_LANDING, { '#': 'ink' });
  bitmap(p, x + 14, y + 3, ARROW_RIGHT, { '#': 'ink' });
  p.rect(x + 1, y + 11, 24, 1, 'ink', 0.4);
}

/** A plane coming down to land on a runway line. */
const PLANE_LANDING: readonly string[] = [
  '#........',
  '##....#..',
  '.##...##.',
  '..#######',
  '...######',
  '.....##..',
  '.....#...',
  '.........',
  '#########',
];
const ARROW_RIGHT: readonly string[] = ['...#...', '...##..', '#######', '...##..', '...#...'];

/** A lit advert box on the wall: a red double-decker bus and a clock tower at dusk. */
function paintLightBox(p: Painter, x: number, y: number, seed: number): void {
  p.rect(x - 1, y - 1, 26, 20, 'ink');
  ditherGradient(p, x, y, 24, 18, ['indigo', 'violet', 'mauve', 'rosy']);
  // the clock tower
  p.rect(x + 3, y + 3, 4, 15, 'night');
  p.rect(x + 4, y + 1, 2, 2, 'night');
  p.rect(x + 4, y + 5, 2, 2, 'honey');
  // the bus
  p.rect(x + 9, y + 8, 13, 9, 'red');
  p.rect(x + 9, y + 8, 13, 1, 'neon');
  for (let i = 0; i < 4; i++) {
    p.rect(x + 10 + i * 3, y + 10, 2, 2, 'honey');
    p.rect(x + 10 + i * 3, y + 13, 2, 2, 'honey');
  }
  p.rect(x + 9, y + 12, 13, 1, 'maroon');
  p.rect(x + 11, y + 17, 2, 1, 'ink');
  p.rect(x + 18, y + 17, 2, 1, 'ink');
  if (mod(seed, 3) === 0) px(p, x + 20, y + 2, 'paper');
  p.rect(x, y + 19, 25, 1, 'ink', 0.4);
}

/** Queue posts with a red rope sagging between them, from the left edge to just past you. */
function paintQueue(p: Painter, w: number, ox: number, floorTop: number): void {
  const postTop = floorTop - 12;
  const last = ox + 32;
  const first = last - 14 * Math.ceil(last / 14);
  // the rope first, so the posts stand over it
  for (let x = first; x < last; x++) {
    const t = mod(x - first, 14);
    const sag = Math.round(Math.sin((t / 14) * Math.PI) * 3);
    p.rect(x, postTop + 2 + sag, 1, 2, 'red');
    px(p, x, postTop + 3 + sag, 'maroon');
  }
  for (let x = first; x <= last && x < w; x += 14) {
    p.rect(x - 1, postTop, 3, 1, 'fog');
    p.rect(x, postTop + 1, 1, floorTop - postTop + 1, 'fog');
    px(p, x + 1, postTop + 1, 'stone');
    p.rect(x - 2, floorTop + 2, 5, 1, 'ink');
  }
}

/**
 * A passport booth from `x`: two posts and a roof with a number box, glass
 * panes to either side of the opening, a lit interior. Booth 3 is the
 * officer's; the empty ones beside the core get their own ledge and an empty
 * chair.
 */
function paintBooth(p: Painter, x: number, oy: number, floorTop: number, num: number): void {
  const empty = num !== 3;
  const w = BOOTH.w;
  const roof = oy + BOOTH.roof;
  const ledge = oy + SURFACE_TOP;
  const inner = { x: x + 2, w: w - 4 };
  // the lit interior
  p.rect(inner.x, roof + 3, inner.w, ledge - roof - 3, 'fog');
  p.rect(inner.x, roof + 4, inner.w, 3, 'paper', 0.4);
  p.rect(inner.x, ledge - 6, inner.w, 6, 'concrete');
  // the monitor's back, on the right of the opening
  p.rect(x + 44, ledge - 10, 10, 8, 'slate');
  p.rect(x + 44, ledge - 10, 10, 1, 'stone');
  p.rect(x + 48, ledge - 2, 2, 2, 'slate');
  if (empty) {
    p.rect(x + 24, ledge - 12, 9, 12, 'night');
    p.rect(x + 24, ledge - 12, 9, 1, 'slate');
  }
  // the glass to both sides of the opening: a faint tint and a diagonal shine
  for (const [gx, gw] of [
    [inner.x, 22],
    [x + w - 12, 10],
  ] as const) {
    p.rect(gx, roof + 3, gw, ledge - roof - 3, 'sky', 0.28);
    for (let i = 0; i < gw; i += 7) {
      for (let d = 0; d < 6; d++) {
        const sy = roof + 6 + d + i;
        if (sy < ledge - 1) px(p, gx + gw - 2 - i - d, sy, 'paper');
      }
    }
    p.rect(gx + gw, roof + 3, 1, ledge - roof - 3, 'stone');
  }
  // the posts and the roof
  p.rect(x, roof, 2, ledge - roof, 'slate');
  p.rect(x + w - 2, roof, 2, ledge - roof, 'slate');
  px(p, x, roof, 'stone');
  p.rect(x - 2, roof - 3, w + 4, 3, 'slate');
  p.rect(x - 2, roof - 3, w + 4, 1, 'stone');
  p.rect(x - 2, roof, w + 4, 1, 'night');
  p.rect(x, roof + 1, w, 2, 'violet');
  // the strip light under the roof
  p.rect(x + 4, roof + 3, w - 8, 1, 'paper');
  // the number box on the roof
  const nx = x + 38;
  p.rect(nx, roof - 10, 9, 7, 'ink');
  p.rect(nx + 1, roof - 9, 7, 5, 'night');
  bitmap(p, nx + 3, roof - 9, DIGITS[mod(num, DIGITS.length)] ?? [], { '#': 'lamp' });
  if (empty) paintLedge(p, x - 4, ledge, x + w, floorTop);
}

/** Tiny 3x5 digits for the booth numbers. */
const DIGITS: readonly (readonly string[])[] = [
  ['###', '#.#', '#.#', '#.#', '###'],
  ['.#.', '##.', '.#.', '.#.', '###'],
  ['##.', '..#', '.#.', '#..', '###'],
  ['##.', '..#', '.#.', '..#', '##.'],
  ['#.#', '#.#', '###', '..#', '..#'],
  ['###', '#..', '##.', '..#', '##.'],
  ['.##', '#..', '###', '#.#', '###'],
  ['###', '..#', '.#.', '.#.', '.#.'],
];

/** The booth's ledge from x to end: a steel top (things rest on it) over a purple-striped front. */
function paintLedge(p: Painter, x: number, top: number, end: number, floorTop: number): void {
  const w = end - x;
  p.rect(x + 1, floorTop + 1, w, 2, 'night');
  p.rect(x, top + 2, w, floorTop + 1 - top - 2, 'indigo');
  p.rect(x, top + 6, w, 1, 'violet');
  p.rect(x, top + 7, w, 1, 'mauve');
  for (let sx = x + 10; sx < end - 4; sx += 20) p.rect(sx, top + 9, 1, floorTop - top - 10, 'deep');
  p.rect(x, top, w, 1, 'paper');
  p.rect(x, top + 1, w, 1, 'fog');
  p.rect(x, top + 2, w, 1, 'stone');
}

// ---------------------------------------------------------------------------
// Mr. Hughes's store

/** Hughes Home and Garden: the counter, the lamp display, plants. */
function paintStore(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const rail = oy + STORE_RAIL;
  const { left, right } = bays(w, ox);

  // Dark green walls over white panelling, warm light all along.
  p.rect(0, 0, w, rail, 'moss');
  for (let x = mod(ox + 4, 8); x < w; x += 8) ditherRect(p, x, 0, 1, rail, 'leaf', 3);
  glowEllipse(p, ox + 60, oy + 14, 50, 26, 'honey', [0.18, 0.1, 0.05]);
  p.rect(0, rail, w, floorTop - rail, 'paper');
  for (let x = mod(ox + 3, 10); x < w; x += 10) p.rect(x, rail + 3, 1, floorTop - rail - 5, 'fog');
  p.rect(0, rail, w, 2, 'amber');
  p.rect(0, rail + 2, w, 1, 'ember');
  p.rect(0, floorTop - 2, w, 2, 'fog');
  // high arched windows and a cornice on a tall stage
  const archH = Math.min(60, oy - 20);
  if (archH >= 12) {
    for (let cx = mod(ox + 4, BAY_W) - BAY_W; cx < w; cx += BAY_W) {
      paintArch(p, cx + 8, oy - 8 - archH, SASH.w, archH, cx - ox, 'amber');
    }
    p.rect(0, oy - 4, w, 2, 'ember');
    p.rect(0, oy - 4, w, 1, 'amber');
  }
  p.rect(0, 0, w, 3, 'ember');
  p.rect(0, 3, w, 1, 'plum');
  paintFlagstones(p, w, ox, floorTop, h);

  // The bays: more lamp displays to the right, plants and pots to the left.
  left.forEach((x, i) => {
    if (i % 2 === 0) paintPlantStand(p, x + 4, floorTop, x);
    else paintDisplay(p, x + 4, oy, floorTop, 32, x);
    paintLamp(p, x + 20, oy - 2);
  });
  right.forEach((x, i) => {
    if (i % 2 === 0) paintDisplay(p, x + 4, oy, floorTop, 32, x);
    else paintPlantStand(p, x + 4, floorTop, x);
    paintLamp(p, x + 20, oy - 2);
  });

  // The core: plants on the left, the counter with its till, the Lantern display on the right.
  paintShopSign(p, ox + 36, oy + 8);
  paintWallShelf(p, ox + 40, oy + 24);
  paintBasket(p, ox + 12, oy + 2);
  paintPlantStand(p, ox + 1, floorTop, ox);
  paintLamp(p, ox + 60, oy - 2);
  paintDisplay(p, ox + DISPLAY.x, oy, floorTop, CORE_W - DISPLAY.x + 4, ox);
  paintBanner(p, ox + DISPLAY.x + 4, oy + 1);
  paintCounter(p, ox + SURFACE_X, oy + SURFACE_TOP, ox + COUNTER_END, floorTop);
}

/** Pale stone flags in a running bond, counted from the core. */
function paintFlagstones(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  p.rect(0, floorTop, w, 1, 'stone');
  for (let row = 0, y = floorTop + 3; y < h; y += 3, row++) {
    p.rect(0, y, w, 1, 'stone');
    for (let x = mod(ox + row * 7, 14); x < w; x += 14) p.rect(x, y - 2, 1, 2, 'stone');
  }
  ditherRect(p, 0, floorTop + 1, w, 2, 'fog', 4);
}

/** A display of lit Lantern lamps from x, w wide: open shelves above teal cupboards. */
function paintDisplay(
  p: Painter,
  x: number,
  oy: number,
  floorTop: number,
  w: number,
  seed: number,
): void {
  const top = oy + 9;
  const cupboards = oy + DISPLAY.cupboards;
  // the back and the frame
  p.rect(x, top, w, cupboards - top, 'plum');
  p.rect(x - 1, top - 1, w + 2, 1, 'ember');
  p.rect(x - 1, top, 1, floorTop - top, 'ember');
  p.rect(x + w, top, 1, floorTop - top, 'ember');
  // two shelves of lamps, every one lit
  for (const sy of [oy + 21, cupboards - 1]) {
    for (let lx = x + 2; lx + 7 <= x + w - 1; lx += 10) {
      paintLantern(p, lx, sy - 10, 'ink', [0.22]);
      p.rect(lx, sy - 1, 7, 1, 'honey', 0.35);
    }
    p.rect(x, sy, w, 1, 'amber');
    p.rect(x, sy + 1, w, 1, 'ember');
  }
  // a small plant at one end of the top shelf
  if (mod(seed, 2) === 0 && w >= 24) {
    p.rect(x + w - 5, oy + 18, 3, 3, 'amber');
    p.rect(x + w - 6, oy + 15, 2, 3, 'leaf');
    p.rect(x + w - 4, oy + 14, 2, 4, 'moss');
  }
  // the teal cupboards with brass knobs
  p.rect(x, cupboards + 1, w, floorTop - cupboards - 1, 'teal');
  p.rect(x, cupboards + 1, w, 1, 'cyan');
  for (let dx = x + 2; dx + 8 <= x + w; dx += 10) {
    p.rect(dx, cupboards + 3, 8, floorTop - cupboards - 6, 'moss');
    p.rect(dx + 1, cupboards + 4, 6, floorTop - cupboards - 8, 'teal');
    px(p, dx + 6, cupboards + 9, 'honey');
  }
}

/** The maroon banner over the display, with three little gold lanterns. */
function paintBanner(p: Painter, x: number, y: number): void {
  p.rect(x, y, 30, 7, 'maroon');
  p.rect(x, y, 30, 1, 'red');
  p.rect(x, y + 7, 30, 1, 'ink', 0.4);
  for (let i = 0; i < 3; i++) {
    const lx = x + 6 + i * 8;
    p.rect(lx, y + 2, 3, 3, 'honey');
    px(p, lx + 1, y + 1, 'lamp');
    px(p, lx + 1, y + 5, 'lamp');
  }
}

/** The shop's sign on the wall: a cream board with a sprig of leaves and a lit lantern. */
function paintShopSign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 22, 10, 'ember');
  p.rect(x + 1, y + 1, 20, 8, 'paper');
  p.rect(x + 4, y + 3, 1, 5, 'moss');
  p.rect(x + 2, y + 4, 2, 1, 'leaf');
  p.rect(x + 5, y + 3, 2, 1, 'leaf');
  p.rect(x + 2, y + 6, 2, 1, 'leaf');
  p.rect(x + 5, y + 5, 2, 1, 'leaf');
  for (let i = 0; i < 3; i++) p.rect(x + 9, y + 3 + i * 2, 9 - i * 3, 1, 'moss');
  p.rect(x + 1, y + 10, 21, 1, 'ink', 0.35);
}

/** A wall shelf of homeware for sale: a vase, a candle in a jar, stacked bowls, a cushion. */
function paintWallShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 44, 2, 'amber');
  p.rect(x, y, 44, 1, 'honey');
  p.rect(x + 2, y + 2, 1, 2, 'ember');
  p.rect(x + 41, y + 2, 1, 2, 'ember');
  p.rect(x + 2, y - 6, 3, 6, 'sky');
  p.rect(x + 3, y - 8, 1, 2, 'sky');
  px(p, x + 3, y - 9, 'neon');
  p.rect(x + 8, y - 4, 4, 4, 'paper');
  px(p, x + 9, y - 5, 'lamp');
  p.rect(x + 15, y - 2, 7, 2, 'rosy');
  p.rect(x + 16, y - 3, 5, 1, 'mauve');
  p.rect(x + 25, y - 5, 8, 5, 'honey');
  p.rect(x + 25, y - 5, 8, 1, 'lamp');
  px(p, x + 28, y - 3, 'amber');
  p.rect(x + 36, y - 3, 4, 3, 'teal');
  p.rect(x + 36, y - 5, 1, 2, 'leaf');
  p.rect(x + 38, y - 6, 1, 3, 'leaf');
}

/** A hanging basket of trailing leaves and flowers on a chain. */
function paintBasket(p: Painter, x: number, y: number): void {
  p.rect(x + 4, 0, 1, y + 3, 'ink');
  p.rect(x, y + 3, 9, 4, 'ember');
  p.rect(x + 1, y + 7, 7, 1, 'ember');
  p.rect(x - 1, y + 1, 11, 3, 'leaf');
  p.rect(x, y, 9, 1, 'moss');
  for (const [dx, len] of [
    [-1, 6],
    [2, 9],
    [7, 7],
    [9, 4],
  ] as const) {
    p.rect(x + dx, y + 4, 1, len, 'leaf');
    px(p, x + dx, y + 4 + len, 'moss');
  }
  const flowers: readonly [number, number, PaletteName][] = [
    [0, 1, 'neon'],
    [3, 0, 'paper'],
    [6, 1, 'rosy'],
    [8, 2, 'neon'],
  ];
  for (const [dx, dy, c] of flowers) px(p, x + dx, y + dy, c);
}

/** A tiered stand of potted plants from x, standing on the floor. */
function paintPlantStand(p: Painter, x: number, floorTop: number, seed: number): void {
  p.rect(x, floorTop - 8, 26, 2, 'amber');
  p.rect(x + 3, floorTop - 16, 18, 2, 'amber');
  for (const lx of [x + 1, x + 23]) p.rect(lx, floorTop - 6, 2, 6, 'ember');
  for (const lx of [x + 4, x + 19]) p.rect(lx, floorTop - 14, 1, 6, 'ember');
  paintPlant(p, x + 8, floorTop - 36);
  const pots: readonly [number, number, PaletteName][] = [
    [x + 1, floorTop - 8, mod(seed, 2) === 0 ? 'neon' : 'rosy'],
    [x + 17, floorTop - 8, 'honey'],
    [x + 4, floorTop, 'leaf'],
  ];
  for (const [px0, base, bloom] of pots) {
    p.rect(px0, base - 4, 6, 4, 'amber');
    p.rect(px0 + 4, base - 4, 2, 4, 'ember');
    p.rect(px0 - 1, base - 8, 8, 4, 'leaf');
    p.rect(px0, base - 9, 6, 1, 'moss');
    px(p, px0 + 1, base - 7, bloom);
    px(p, px0 + 4, base - 8, bloom);
  }
  // a watering can on the floor
  p.rect(x + 14, floorTop - 4, 6, 4, 'teal');
  p.rect(x + 20, floorTop - 4, 3, 1, 'teal');
  px(p, x + 23, floorTop - 5, 'teal');
  p.rect(x + 15, floorTop - 6, 4, 1, 'moss');
}

/** The shop counter: a waxed wooden top (things rest on it), panelled front, the till at its end. */
function paintCounter(p: Painter, x: number, top: number, end: number, floorTop: number): void {
  const w = end - x;
  p.rect(x + 1, floorTop + 1, w, 2, 'stone');
  p.rect(x, top + 3, w, floorTop + 1 - top - 3, 'ember');
  for (let dx = x + 3; dx + 10 <= end - 2; dx += 13) {
    p.rect(dx, top + 6, 10, floorTop - top - 8, 'plum');
    p.rect(dx + 1, top + 7, 8, floorTop - top - 10, 'ember');
    p.rect(dx + 1, top + 7, 8, 1, 'amber');
  }
  p.rect(x - 1, top, w + 2, 1, 'honey');
  p.rect(x - 1, top + 1, w + 2, 2, 'amber');
  p.rect(x, top + 3, w, 1, 'plum');
  // the till, its screen on a stalk, a curl of receipt
  const tx = end - 9;
  p.rect(tx, top - 4, 8, 4, 'slate');
  p.rect(tx, top - 4, 8, 1, 'stone');
  p.rect(tx + 1, top - 2, 6, 1, 'night');
  p.rect(tx + 5, top - 6, 1, 2, 'ink');
  p.rect(tx + 2, top - 11, 7, 5, 'ink');
  p.rect(tx + 3, top - 10, 5, 3, 'cyan');
  px(p, tx + 4, top - 9, 'paper');
  p.rect(tx + 1, top - 6, 2, 2, 'paper');
}

// ---------------------------------------------------------------------------

export const BRANCH_STAGE: StageConfig = {
  paint: paintBranch,
  backdrops: { officer: paintBorder, client: paintStore, manager: paintVideo },
  cast: {
    guide: GUIDE_ACTOR,
    branch_manager: { sprite: BRANCH_MANAGER_SPRITE, ...WRIGHT, side: 'right' },
    // Alone he would stand where Ms. Wright does; in his store with her (t8) he stands
    // beside her, right of the counter.
    client: { sprite: CLIENT_SPRITE, ...WRIGHT, side: 'right', beside: { ...HUGHES } },
    // Only ever alone, behind the booth's glass; the same place if anyone joins him.
    officer: {
      sprite: OFFICER_SPRITE,
      ...OFFICER,
      side: 'right',
      clipBottom: SURFACE_TOP,
      beside: { ...OFFICER },
    },
    // Only ever alone, inside the video panel; the same place if anyone joins her.
    manager: { sprite: MANAGER_SPRITE, ...CARTER, side: 'right', beside: { ...CARTER } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 98, y: 18 } },
  rest: {
    left: { x: SURFACE_X, y: PROP_TOP },
    right: { x: SURFACE_X + 15, y: PROP_TOP },
  },
};
