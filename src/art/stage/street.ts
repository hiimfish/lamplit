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
import { clipped, coreOrigin } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The street stage: a bus stop on a town street in the evening. You stand on
 * the near pavement under a street lamp; between you and the person you talk
 * to is the bus shelter with its bench (maps, tickets and coins rest on it).
 * Behind runs the road, with a bus pulled up at the right, and across it a row
 * of shops with lit windows under the dusk sky. Painted through the Painter
 * interface, palette colours only, whole pixels; partial alpha only for light.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; above it come upper floors, rooftops, wires and the sky; to the
 * sides the street goes on (more shop fronts, the rest of the bus, lamps and
 * street trees); spare height below is more pavement.
 */

/** The bench in the shelter: left edge, width and the y of its seat (props rest on it), in core pixels. */
const BENCH = { x: 39, w: 43, top: 50 } as const;
/** The shelter: the x of its left post, its right post, and the y of its roof. */
const SHELTER = { x0: 36, x1: 83, roof: 23, foot: 58 } as const;

/** Where the far shop fronts meet the far pavement. */
const FAR_BASE = 40;
const ROAD_TOP = 44;
/** The near kerb: one pale line, the pavement you stand on starts right below it. */
const KERB_Y = 53;
const PAVE_TOP = 54;

/** Far buildings: the top of the ground-floor shop, the height of a floor above it, bay width. */
const SHOP_TOP = 18;
const FLOOR_H = 16;
const BAY_W = 44;
/** The first bay starts this far left of the core. */
const BAY_X = -2;
/** The sky's colours are measured upward from this line, a little above the lowest roofs. */
const HORIZON = -8;

/** The bus on the road: its front (it faces left) in core pixels, and its length. */
const BUS = { x: 113, w: 84 } as const;
/** Utility poles stand every this many pixels along the far pavement. */
const POLE_STEP = BAY_W * 4;
const POLE_X = 42;
/** Street lamps and trees on the near pavement repeat with this step outside the core. */
const LAMP_X = 17;
const STREET_STEP = 132;

/** Largest value of the form `anchor - k * step` that is not above zero: where a repeating row starts. */
function firstAt(anchor: number, step: number): number {
  return anchor - step * Math.ceil(anchor / step);
}

function pick<T>(list: readonly T[], t: number, fallback: T): T {
  return list[Math.floor(t * list.length)] ?? fallback;
}

/** Paints the street to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const horizon = oy + HORIZON;

  paintSky(p, w, ox, horizon);
  paintSkyline(p, w, ox, oy + 2);
  paintGround(p, w, h, ox, oy);

  const firstBay = Math.floor(-(ox + BAY_X) / BAY_W);
  for (let k = firstBay; ox + BAY_X + k * BAY_W < w; k++) {
    paintBay(p, ox + BAY_X + k * BAY_W, oy, k);
  }
  for (let x = firstAt(ox + POLE_X, POLE_STEP) - POLE_STEP; x < w; x += POLE_STEP) {
    paintPole(p, x, oy);
  }

  // Street trees outside the core, on both sides.
  for (let x = ox - 36; x + 16 > 0; x -= STREET_STEP) paintTree(p, x, oy);
  for (let x = ox + 270; x - 16 < w; x += STREET_STEP) paintTree(p, x, oy);

  paintBus(p, ox + BUS.x, oy);
  paintShelter(p, ox, oy);
  paintStopSign(p, ox + 101, oy);

  for (let x = ox + LAMP_X; x + 24 > 0; x -= STREET_STEP) paintStreetLamp(p, x, oy);
  for (let x = ox + 224; x - 4 < w; x += STREET_STEP) paintStreetLamp(p, x, oy);
}

// ---------------------------------------------------------------------------
// Sky

/** Sky colours by height above the horizon: rosy at the roofs, deep blue overhead. */
const SKY: readonly (readonly [number, PaletteName])[] = [
  [0, 'rosy'],
  [12, 'mauve'],
  [28, 'violet'],
  [50, 'dusk'],
  [80, 'indigo'],
  [120, 'deep'],
];

function paintSky(p: Painter, w: number, ox: number, horizon: number): void {
  p.rect(0, 0, w, Math.max(0, horizon), 'deep');
  for (let i = 0; i + 1 < SKY.length; i++) {
    const [d0, lower] = SKY[i] ?? [0, 'rosy'];
    const [d1, upper] = SKY[i + 1] ?? [0, 'deep'];
    if (horizon - d0 <= 0) break;
    ditherGradient(p, 0, horizon - d1, w, d1 - d0, [upper, lower]);
  }
  p.rect(0, horizon, w, FAR_BASE - HORIZON, 'rosy');

  // Thin evening clouds, lit from below.
  if (horizon >= 30) {
    for (let x = firstAt(ox + 20, 84) - 84; x < w; x += 84) {
      const seed = x - ox;
      const up = 8 + Math.floor(hash2(seed, 1, 61) * 50);
      const color: PaletteName =
        up < 14 ? 'honey' : up < 30 ? 'rosy' : up < 50 ? 'mauve' : 'violet';
      const y = horizon - up;
      const dx = Math.floor(hash2(seed, 2, 61) * 30);
      p.rect(x + dx + 6, y, 22, 1, color);
      p.rect(x + dx, y + 1, 40, 1, color);
      p.rect(x + dx + 14, y + 2, 18, 1, color);
    }
  }

  // Stars high up, a thin moon over the low roof in the middle.
  for (let cy = horizon - 56; cy > -10; cy -= 10) {
    for (let cx = firstAt(ox, 14); cx < w; cx += 14) {
      const sx = cx - ox;
      const sy = cy - horizon;
      const t = hash2(sx, sy, 5);
      if (t > 0.34) continue;
      const x = cx + Math.floor(hash2(sx, sy, 7) * 14);
      const y = cy + Math.floor(hash2(sx, sy, 9) * 10);
      if (y >= horizon - 52) continue;
      px(p, x, y, t < 0.08 ? 'paper' : t < 0.2 ? 'fog' : 'sky');
    }
  }
  if (horizon >= 44) paintMoon(p, ox + 58, horizon - Math.min(104, horizon - 8));
}

/** A thin crescent, its top left at (x, y). */
function paintMoon(p: Painter, x: number, y: number): void {
  const rows: readonly (readonly [number, number])[] = [
    [3, 3],
    [1, 3],
    [1, 2],
    [0, 3],
    [0, 3],
    [0, 3],
    [1, 2],
    [1, 3],
    [3, 3],
  ];
  glowEllipse(p, x + 3, y + 4, 8, 8, 'paper', [0.1, 0.05]);
  rows.forEach(([dx, len], dy) => p.rect(x + dx, y + dy, len, 1, 'paper'));
  px(p, x + 1, y + 4, 'honey');
}

/** Hazy far blocks of the town behind the street, a few windows lit. */
function paintSkyline(p: Painter, w: number, ox: number, horizon: number): void {
  if (horizon < 12) return;
  const step = 19;
  for (let x = firstAt(ox, step) - step; x < w; x += step) {
    const seed = x - ox;
    if (hash2(seed, 0, 71) < 0.25) continue;
    const bw = 13 + Math.floor(hash2(seed, 1, 71) * 12);
    const bh = 8 + Math.floor(hash2(seed, 2, 71) * 26);
    const top = horizon - bh;
    p.rect(x, top, bw, bh, 'dusk');
    p.rect(x + bw - 3, top, 3, bh, 'indigo');
    if (hash2(seed, 3, 71) > 0.5) p.rect(x + 2, top - 2, 5, 2, 'dusk');
    for (let wy = top + 3; wy < horizon - 2; wy += 4) {
      for (let wx = x + 2; wx < x + bw - 4; wx += 3) {
        const t = hash2(wx - ox, wy - horizon, 73);
        if (t < 0.16) px(p, wx, wy, t < 0.1 ? 'honey' : 'lamp');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Ground: far pavement, road, kerb, the pavement you stand on.

function paintGround(p: Painter, w: number, h: number, ox: number, oy: number): void {
  const farTop = oy + FAR_BASE;
  p.rect(0, farTop, w, 3, 'stone');
  p.rect(0, farTop + 3, w, 1, 'night');

  const roadTop = oy + ROAD_TOP;
  p.rect(0, roadTop, w, KERB_Y - ROAD_TOP, 'slate');
  ditherRect(p, 0, roadTop, w, 2, 'night', 5);
  for (let x = firstAt(ox + 3, 14); x < w; x += 14) p.rect(x, roadTop + 3, 7, 1, 'stone');
  // the gutter, and a yellow line along the bus bay
  p.rect(0, oy + KERB_Y - 1, w, 1, 'night');
  p.rect(0, oy + KERB_Y - 2, w, 1, 'amber');

  const paveTop = oy + PAVE_TOP;
  p.rect(0, oy + KERB_Y, w, 1, 'fog');
  p.rect(0, paveTop, w, h - paveTop, 'concrete');
  // paving slabs: long joints, short ones staggered row by row
  for (let row = 0; paveTop + row * 4 < h; row++) {
    const y = paveTop + row * 4;
    if (row > 0) p.rect(0, y - 1, w, 1, 'stone');
    for (let x = firstAt(ox + (row % 2) * 7, 14); x < w; x += 14) {
      p.rect(x, y, 1, Math.min(3, h - y), 'stone');
    }
  }
}

// ---------------------------------------------------------------------------
// The far side of the street: shop fronts with one to three floors above.

type Front = 'shop' | 'shutter' | 'dark';

interface Bay {
  floors: number;
  /** Wall colour, its shadow and its trim. */
  wall: PaletteName;
  shade: PaletteName;
  trim: PaletteName;
  /** Colour of the signboard and awning. */
  sign: PaletteName;
  front: Front;
  /** Which upstairs windows are lit, one string per floor from the lowest ('x' is lit); by chance when absent. */
  lit?: readonly string[];
}

const WALLS: readonly (readonly [PaletteName, PaletteName, PaletteName])[] = [
  ['stone', 'slate', 'concrete'],
  ['concrete', 'stone', 'fog'],
  ['plum', 'night', 'mauve'],
  ['slate', 'night', 'stone'],
  ['dusk', 'indigo', 'sky'],
];
const SIGNS: readonly PaletteName[] = ['red', 'teal', 'moss', 'neonDeep', 'denim', 'amber'];
const FRONTS: readonly Front[] = ['shop', 'shutter', 'dark', 'shop'];

/** The three bays behind the core are chosen by hand; the rest follow from their number. */
const CORE_BAYS: readonly Bay[] = [
  {
    floors: 2,
    wall: 'stone',
    shade: 'slate',
    trim: 'concrete',
    sign: 'red',
    front: 'shop',
    // dark behind the street lamp's head
    lit: ['x..', '.xx'],
  },
  {
    floors: 1,
    wall: 'plum',
    shade: 'night',
    trim: 'mauve',
    sign: 'teal',
    front: 'shutter',
    lit: ['.x.'],
  },
  {
    floors: 3,
    wall: 'slate',
    shade: 'night',
    trim: 'stone',
    sign: 'amber',
    front: 'shop',
    // dark behind the bus stop sign
    lit: ['..x', 'xx.', '.x.'],
  },
];

function bayAt(k: number): Bay {
  const core = CORE_BAYS[k];
  if (core) return core;
  const [wall, shade, trim] = pick(WALLS, hash2(k, 1, 41), ['stone', 'slate', 'concrete'] as const);
  return {
    floors: 1 + Math.floor(hash2(k, 2, 41) * 3),
    wall,
    shade,
    trim,
    sign: pick(SIGNS, hash2(k, 3, 41), 'red'),
    front: pick(FRONTS, hash2(k, 4, 41), 'shop'),
  };
}

function paintBay(p: Painter, x: number, oy: number, k: number): void {
  const bay = bayAt(k);
  const base = oy + FAR_BASE;
  const shopTop = oy + SHOP_TOP;
  const top = shopTop - bay.floors * FLOOR_H - 2;
  const inner = BAY_W - 1;

  p.rect(x, top, BAY_W, base - top, bay.wall);
  p.rect(x + inner, top + 1, 1, base - top - 1, bay.shade); // the gap to the next house
  p.rect(x, top, inner, 1, bay.trim);
  p.rect(x, top + 1, inner, 1, bay.shade);
  paintRoof(p, x, top, k);

  for (let f = 0; f < bay.floors; f++) {
    const fy = shopTop - (f + 1) * FLOOR_H;
    for (let i = 0; i < 3; i++) {
      const seed = k * 16 + f * 4 + i;
      const mark = bay.lit?.[f]?.[i];
      const lit = mark === undefined ? hash2(seed, 0, 11) < 0.4 : mark === 'x';
      paintWindow(p, x + 4 + i * 14, fy + 3, bay, lit, seed);
    }
    p.rect(x, fy + FLOOR_H - 1, inner, 1, bay.shade);
  }

  // signboard: a lit strip with a few blocks for letters
  p.rect(x + 1, shopTop, inner - 2, 4, bay.sign);
  p.rect(x + 1, shopTop + 3, inner - 2, 1, 'night');
  for (let i = 0; i < 4; i++) {
    const lw = 2 + Math.floor(hash2(k, i, 43) * 4);
    p.rect(x + 6 + i * 8, shopTop + 1, lw, 1, 'paper');
  }

  p.rect(x, shopTop + 4, inner, base - shopTop - 4, bay.shade);
  if (bay.front === 'shop') paintShopFront(p, x, oy, bay.sign, k);
  else if (bay.front === 'shutter') paintShutter(p, x, oy, k);
  else paintDarkFront(p, x, oy, k);
}

/** One upstairs window: lit or dark, some with bars, some with an air conditioner under them. */
function paintWindow(p: Painter, x: number, y: number, bay: Bay, lit: boolean, seed: number): void {
  const t = hash2(seed, 1, 11);
  if (!lit) {
    p.rect(x, y, 8, 9, 'night');
    p.rect(x, y, 8, 1, 'indigo');
    px(p, x + 1, y + 2, 'dusk');
    px(p, x + 2, y + 1, 'dusk');
  } else if (t < 0.12) {
    // someone watching television
    p.rect(x, y, 8, 9, 'denim');
    p.rect(x + 2, y + 5, 4, 3, 'sky');
    px(p, x + 3, y + 6, 'cyan');
  } else {
    p.rect(x, y, 8, 9, t < 0.65 ? 'honey' : 'lamp');
    p.rect(x, y + 6, 8, 3, t < 0.65 ? 'lamp' : 'amber');
    if (hash2(seed, 2, 11) < 0.5) p.rect(x, y, 3, 6, 'paper'); // a curtain
  }
  p.rect(x + 4, y, 1, 9, bay.shade);
  if (hash2(seed, 3, 11) < 0.35) {
    for (let gx = x; gx < x + 8; gx += 2) p.rect(gx, y + 5, 1, 4, 'ink');
    p.rect(x, y + 5, 8, 1, 'ink');
  }
  p.rect(x - 1, y + 9, 10, 1, bay.trim);
  if (hash2(seed, 4, 11) < 0.3) {
    p.rect(x + 1, y + 10, 6, 3, 'fog');
    p.rect(x + 1, y + 12, 6, 1, 'stone');
    p.rect(x + 2, y + 11, 3, 1, 'concrete');
  }
}

/** Things on the roof: a steel water tank or an aerial. */
function paintRoof(p: Painter, x: number, top: number, k: number): void {
  const t = hash2(k, 5, 41);
  if (t < 0.45) {
    const tx = x + 5 + Math.floor(hash2(k, 6, 41) * 22);
    p.rect(tx + 1, top - 3, 1, 3, 'night');
    p.rect(tx + 7, top - 3, 1, 3, 'night');
    p.rect(tx, top - 10, 9, 7, 'concrete');
    p.rect(tx, top - 10, 2, 7, 'fog');
    p.rect(tx + 7, top - 10, 2, 7, 'stone');
    p.rect(tx + 1, top - 11, 7, 1, 'fog');
    p.rect(tx, top - 6, 9, 1, 'stone');
  } else if (t < 0.8) {
    const ax = x + 8 + Math.floor(hash2(k, 7, 41) * 26);
    p.rect(ax, top - 11, 1, 11, 'night');
    p.rect(ax - 3, top - 10, 7, 1, 'night');
    p.rect(ax - 2, top - 7, 5, 1, 'night');
  }
}

/** A lit shop: striped awning, a big warm window with goods on a shelf, a glass door. */
function paintShopFront(p: Painter, x: number, oy: number, color: PaletteName, k: number): void {
  const top = oy + SHOP_TOP + 4;
  const base = oy + FAR_BASE;
  // window
  p.rect(x + 3, top + 5, 24, 11, 'honey');
  p.rect(x + 3, top + 5, 24, 2, 'paper');
  p.rect(x + 3, top + 12, 24, 4, 'lamp');
  for (let i = 0; i < 6; i++) {
    const gh = 2 + Math.floor(hash2(k, i, 47) * 3);
    const c = pick<PaletteName>(['ember', 'amber', 'red', 'teal'], hash2(k, i, 49), 'ember');
    p.rect(x + 5 + i * 4 - (i > 2 ? 0 : 1), top + 12 - gh, 2, gh, c);
  }
  p.rect(x + 3, top + 12, 24, 1, 'amber');
  p.rect(x + 15, top + 5, 1, 11, 'ember');
  // door
  p.rect(x + 30, top + 4, 10, base - top - 4, 'ember');
  p.rect(x + 31, top + 5, 8, 9, 'honey');
  p.rect(x + 31, top + 14, 8, 1, 'amber');
  p.rect(x + 31, top + 15, 8, base - top - 15, 'lamp');
  px(p, x + 32, top + 11, 'paper');
  // awning: stripes, a scalloped edge
  for (let sx = 0; sx < BAY_W - 3; sx += 4) {
    const c: PaletteName = (sx / 4) % 2 === 0 ? color : 'paper';
    const sw = Math.min(4, BAY_W - 3 - sx);
    p.rect(x + 1 + sx, top, sw, 3, c);
    p.rect(x + 1 + sx, top + 3, Math.min(3, sw), 1, c);
  }
  p.rect(x + 1, top, BAY_W - 3, 1, 'night');
  // light spilling onto the far pavement
  p.rect(x + 3, base, 24, 2, 'tan');
  p.rect(x + 31, base, 8, 3, 'tan');
  p.rect(x + 32, base, 6, 1, 'lamp');
}

/** A closed shop: a rolled-down shutter with a notice on it. */
function paintShutter(p: Painter, x: number, oy: number, k: number): void {
  const top = oy + SHOP_TOP + 6;
  const base = oy + FAR_BASE;
  p.rect(x + 3, top, BAY_W - 7, base - top, 'stone');
  for (let y = top + 1; y < base; y += 2) p.rect(x + 3, y, BAY_W - 7, 1, 'slate');
  p.rect(x + 3, top, BAY_W - 7, 1, 'concrete');
  const nx = x + 8 + Math.floor(hash2(k, 1, 53) * 20);
  p.rect(nx, top + 4, 6, 7, 'fog');
  p.rect(nx, top + 4, 6, 2, 'red');
  p.rect(nx + 1, top + 8, 4, 1, 'stone');
  p.rect(x + 20, base - 2, 4, 1, 'fog');
}

/** A bar or studio with dark glass and a small neon sign in the window. */
function paintDarkFront(p: Painter, x: number, oy: number, k: number): void {
  const top = oy + SHOP_TOP + 6;
  const base = oy + FAR_BASE;
  p.rect(x + 3, top, 24, base - top - 2, 'night');
  ditherRect(p, x + 3, top, 24, 4, 'indigo', 8);
  p.rect(x + 15, top, 1, base - top - 2, 'slate');
  p.rect(x + 30, top, 10, base - top, 'night');
  p.rect(x + 31, top + 1, 8, 8, 'indigo');
  px(p, x + 32, top + 11, 'fog');
  const neon: PaletteName = hash2(k, 1, 59) < 0.5 ? 'neon' : 'cyan';
  p.rect(x + 6, top + 4, 7, 1, neon);
  p.rect(x + 6, top + 5, 1, 3, neon);
  p.rect(x + 12, top + 5, 1, 3, neon);
  p.rect(x + 6, top + 8, 7, 1, neon);
  p.rect(x + 8, top + 6, 3, 1, 'paper');
  glowEllipse(p, x + 9, top + 6, 8, 5, neon, [0.18, 0.08]);
}

/** A utility pole on the far pavement, its wires sagging to the next pole on the right. */
function paintPole(p: Painter, x: number, oy: number): void {
  const top = oy - 20;
  const next = x + POLE_STEP;
  paintWire(p, x - 4, next - 4, top + 3, 5);
  paintWire(p, x + 4, next + 4, top + 9, 7);
  p.rect(x, top, 2, oy + FAR_BASE + 2 - top, 'night');
  p.rect(x - 4, top + 3, 10, 1, 'night');
  p.rect(x - 3, top + 9, 8, 1, 'night');
  px(p, x - 4, top + 2, 'fog');
  px(p, x + 5, top + 2, 'fog');
  p.rect(x - 4, top + 13, 4, 7, 'stone');
  p.rect(x - 4, top + 13, 4, 1, 'fog');
  p.rect(x - 1, top + 14, 1, 6, 'slate');
}

/** One wire from (x0, y) to (x1, y), hanging `sag` pixels low in the middle. */
function paintWire(p: Painter, x0: number, x1: number, y: number, sag: number): void {
  const span = x1 - x0;
  let runStart = x0;
  let runY = y;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / span;
    const wy = y + Math.round(4 * sag * t * (1 - t));
    if (wy !== runY) {
      p.rect(runStart, runY, x - runStart, 1, 'ink');
      runStart = x;
      runY = wy;
    }
  }
  p.rect(runStart, runY, x1 - runStart + 1, 1, 'ink');
}

// ---------------------------------------------------------------------------
// The near pavement: the bus, the shelter, the stop sign, lamps and trees.

/** The bus pulled up at the kerb, facing left: its front at x. Lit inside. */
function paintBus(p: Painter, x: number, oy: number): void {
  const top = oy + 10;
  const bottom = oy + 50;
  const bandTop = top + 4;
  const bandH = 14;
  const { w } = BUS;
  p.rect(x + 2, oy + 50, w - 2, 2, 'night'); // its shadow on the road

  // roof and the cooler on top
  p.rect(x + 26, top - 3, 32, 3, 'stone');
  p.rect(x + 26, top - 3, 32, 1, 'concrete');
  p.rect(x + 3, top, w - 4, 1, 'paper');
  p.rect(x + 1, top + 1, w - 1, 3, 'fog');
  p.rect(x, top + 2, 1, 2, 'fog');
  // window band
  p.rect(x, bandTop, w, bandH, 'ink');
  // body: teal with a cream and orange stripe, a dark skirt
  p.rect(x, bandTop + bandH, w, bottom - bandTop - bandH, 'teal');
  p.rect(x, bandTop + bandH + 3, w, 2, 'paper');
  p.rect(x, bandTop + bandH + 5, w, 1, 'lamp');
  p.rect(x, bottom - 4, w, 4, 'moss');

  // the route display over the door
  p.rect(x + 4, top + 1, 13, 3, 'ink');
  p.rect(x + 5, top + 2, 2, 1, 'lamp');
  p.rect(x + 8, top + 2, 4, 1, 'lamp');
  p.rect(x + 13, top + 2, 3, 1, 'honey');

  // windscreen seen from the side, then the folding door
  p.rect(x + 1, bandTop + 1, 2, bandH - 2, 'sky');
  p.rect(x + 1, bandTop + 1, 1, 3, 'paper');
  p.rect(x + 4, bandTop, 13, bottom - bandTop - 2, 'ink');
  for (const dx of [5, 11]) {
    p.rect(x + dx, bandTop + 1, 5, 19, 'honey');
    p.rect(x + dx, bandTop + 1, 5, 2, 'paper');
    p.rect(x + dx, bandTop + 20, 5, 1, 'ink');
    p.rect(x + dx, bandTop + 21, 5, 11, 'lamp');
    p.rect(x + dx, bandTop + 30, 5, 2, 'amber');
  }
  px(p, x + 10, bandTop + 17, 'fog');

  // passenger windows, a few heads
  for (let i = 0; i < 5; i++) {
    const wx = x + 20 + i * 12;
    p.rect(wx, bandTop + 1, 10, bandH - 2, 'honey');
    p.rect(wx, bandTop + 1, 10, 1, 'paper');
    p.rect(wx, bandTop + bandH - 5, 10, 4, 'lamp');
    if (hash2(i, 3, 83) < 0.6) {
      const hx = wx + 2 + Math.floor(hash2(i, 4, 83) * 4);
      p.rect(hx, bandTop + 5, 3, 3, 'plum');
      p.rect(hx - 1, bandTop + 8, 5, 5, 'plum');
    }
  }
  p.rect(x + w - 4, bandTop + 1, 3, bandH - 2, 'lamp');

  // lights, bumper, mirror
  p.rect(x, bottom - 10, 2, 3, 'paper');
  px(p, x, bottom - 7, 'lamp');
  p.rect(x - 1, bottom - 4, 4, 3, 'stone');
  p.rect(x - 2, bandTop + 2, 2, 1, 'ink');
  p.rect(x - 2, bandTop + 3, 1, 4, 'ink');
  p.rect(x + w - 1, bottom - 11, 1, 3, 'red');

  for (const cx of [x + 25, x + 66]) {
    p.rect(cx - 6, bottom - 7, 13, 7, 'night');
    p.rect(cx - 5, bottom - 8, 11, 1, 'night');
    ellipse(p, cx, bottom - 3, 5, 5, 'ink');
    p.rect(cx - 2, bottom - 4, 5, 3, 'stone');
    p.rect(cx - 1, bottom - 5, 3, 5, 'stone');
    px(p, cx, bottom - 3, 'fog');
  }

  // headlights on the road in front of it
  glowEllipse(p, x - 10, oy + 49, 14, 3, 'honey', [0.34, 0.2, 0.09]);
}

/** The bus shelter with its bench: a calm back wall for the things handed over. */
function paintShelter(p: Painter, ox: number, oy: number): void {
  const x0 = ox + SHELTER.x0;
  const x1 = ox + SHELTER.x1;
  const roof = oy + SHELTER.roof;
  const foot = oy + SHELTER.foot;
  const panelTop = roof + 4;
  const panelBottom = oy + KERB_Y;

  // back wall: three panels, lit from the tube under the roof
  p.rect(x0 + 2, panelTop, x1 - x0 - 2, panelBottom - panelTop, 'slate');
  ditherGradient(p, x0 + 2, panelTop, x1 - x0 - 2, 5, ['stone', 'slate']);
  for (const mx of [x0 + 16, x0 + 31]) p.rect(mx, panelTop, 1, panelBottom - panelTop, 'night');
  p.rect(x0 + 2, panelBottom - 1, x1 - x0 - 2, 1, 'night');

  // roof with a route sign on its edge, the light tube under it
  p.rect(x0 - 3, roof, x1 - x0 + 8, 1, 'fog');
  p.rect(x0 - 3, roof + 1, x1 - x0 + 8, 1, 'stone');
  p.rect(x0 - 2, roof + 2, x1 - x0 + 6, 1, 'ink');
  p.rect(x0 + 5, roof + 3, x1 - x0 - 8, 1, 'paper');
  p.rect(x0 + 4, roof + 3, 1, 1, 'stone');
  p.rect(x1 - 3, roof + 3, 1, 1, 'stone');
  glowEllipse(p, ox + 60, roof + 5, 22, 5, 'honey', [0.22, 0.1]);

  // posts
  for (const px0 of [x0, x1]) {
    p.rect(px0, roof + 3, 2, foot - roof - 3, 'ink');
    p.rect(px0, roof + 3, 1, foot - roof - 4, 'stone');
    p.rect(px0 - 1, foot - 1, 4, 1, 'ink');
  }

  // bench: warm wooden slats on dark legs, its shadow on the pavement
  const bx = ox + BENCH.x;
  const top = oy + BENCH.top;
  p.rect(bx + 1, foot, BENCH.w - 2, 1, 'stone');
  for (const lx of [bx + 3, bx + BENCH.w - 5]) p.rect(lx, top + 5, 2, foot - top - 5, 'ink');
  p.rect(bx, top, BENCH.w, 3, 'amber');
  p.rect(bx, top, BENCH.w, 1, 'lamp');
  p.rect(bx, top + 3, BENCH.w, 2, 'ember');
  for (let sx = bx + 10; sx < bx + BENCH.w - 2; sx += 11) p.rect(sx, top + 1, 1, 2, 'ember');
  glowEllipse(p, ox + 60, foot + 2, 24, 3, 'honey', [0.2, 0.1]);
}

/** 3x5 pixel letters for the stop sign. */
const LETTERS: readonly (readonly string[])[] = [
  ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
  ['x.x', 'x.x', 'x.x', 'x.x', 'xxx'],
  ['.xx', 'x..', '.x.', '..x', 'xx.'],
];

/** The bus stop sign on its pole (the pole at x), with the timetable below it. */
function paintStopSign(p: Painter, x: number, oy: number): void {
  p.rect(x, oy + 13, 1, 46, 'fog');
  p.rect(x + 1, oy + 13, 1, 46, 'stone');
  p.rect(x - 1, oy + 58, 4, 1, 'ink');
  // the sign: a blue plate that says BUS
  p.rect(x - 7, oy + 4, 15, 9, 'paper');
  p.rect(x - 6, oy + 5, 13, 7, 'denim');
  LETTERS.forEach((rows, i) => {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] === 'x') px(p, x - 5 + i * 4 + dx, oy + 6 + dy, 'paper');
      }
    });
  });
  // timetable
  p.rect(x - 3, oy + 17, 8, 10, 'paper');
  p.rect(x - 3, oy + 17, 8, 2, 'red');
  for (let ty = 20; ty < 26; ty += 2) p.rect(x - 2, oy + ty, ty === 22 ? 4 : 6, 1, 'stone');
  p.rect(x - 3, oy + 27, 8, 1, 'stone');
}

/** A street lamp on the near pavement, its arm reaching right, a pool of light under it. */
function paintStreetLamp(p: Painter, x: number, oy: number): void {
  const head = oy + 5;
  const foot = oy + 61;
  p.rect(x, head + 1, 2, foot - head - 1, 'ink');
  p.rect(x, head + 14, 1, foot - head - 18, 'stone');
  p.rect(x - 1, foot - 4, 4, 4, 'ink');
  p.rect(x - 2, foot, 6, 1, 'night');
  p.rect(x + 1, head, 6, 1, 'ink');
  p.rect(x + 6, head - 1, 8, 2, 'ink');
  p.rect(x + 7, head + 1, 6, 1, 'paper');
  p.rect(x + 8, head + 2, 4, 1, 'honey');
  glowEllipse(p, x + 10, head + 3, 10, 7, 'honey', [0.34, 0.2, 0.1]);
  glowEllipse(p, x + 12, foot, 22, 5, 'honey', [0.26, 0.15, 0.07]);
}

/** A street tree in a square of earth, its leaves lit from the lamps below. */
function paintTree(p: Painter, cx: number, oy: number): void {
  const foot = oy + 59;
  p.rect(cx - 5, foot, 11, 2, 'stone');
  p.rect(cx - 4, foot, 9, 1, 'plum');
  p.rect(cx - 1, oy + 26, 3, foot - oy - 26, 'ember');
  p.rect(cx + 1, oy + 26, 1, foot - oy - 26, 'plum');
  p.rect(cx - 3, oy + 28, 2, 1, 'ember');
  ellipse(p, cx, oy + 17, 14, 10, 'moss');
  ellipse(p, cx - 7, oy + 22, 7, 5, 'moss');
  ellipse(p, cx + 8, oy + 21, 6, 5, 'moss');
  ellipse(p, cx - 4, oy + 13, 7, 4, 'leaf');
  ellipse(p, cx + 6, oy + 17, 4, 2, 'leaf');
  ellipse(p, cx - 8, oy + 21, 3, 2, 'leaf');
  for (let i = 0; i < 9; i++) {
    const lx = cx - 11 + Math.floor(hash2(i, 1, 91) * 22);
    const ly = oy + 10 + Math.floor(hash2(i, 2, 91) * 14);
    px(p, lx, ly, hash2(i, 3, 91) < 0.5 ? 'leaf' : 'moss');
  }
}

// ---------------------------------------------------------------------------
// The passerby: 16x24, facing left. A woman on her way home: long dark plum
// hair down her back, a rosy knee-length coat with a teal scarf, a maroon
// handbag in her hand, dark tights and boots.

const PASSERBY_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '....hhhhhhhhh...',
    '....shhhhhhhh...',
    '...ssesshhhhh...',
    '....sssshhhhh...',
    '....tssshhhhh...',
    '......sshhhhh...',
    '....wwwwwhhhh...',
    '....cwwccchhh...',
    '....cwccccchh...',
    '....ccccccach...',
    '....ccccccacc...',
    '....ccccccacc...',
    '....ccccccscc...',
    '....cccccbbbc...',
    '....ccccbbgbb...',
    '....ddddbbbbb...',
    '......ppqq......',
    '......ppqq......',
    '......ppqq......',
    '......kkkk......',
    '....kkkkkk......',
  ],
  legend: {
    h: 'plum',
    s: 'skin',
    e: 'ink',
    t: 'rosy',
    g: 'honey',
    w: 'teal',
    c: 'rosy',
    a: 'mauve',
    d: 'mauve',
    b: 'maroon',
    p: 'slate',
    q: 'night',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// The driver: 16x24, facing left. A broad, friendly bus driver with greying
// hair: a dark blue peaked cap with a brass badge, a sky-blue uniform shirt
// with a dark tie, white gloves, navy trousers.

const DRIVER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....cccccc.....',
    '....clccccccc...',
    '..vvvvccccccc...',
    '....sssshhhhh...',
    '...ssesssshhh...',
    '....sssssss.....',
    '....sssssss.....',
    '......ssss......',
    '.....wwuuuuu....',
    '...uuwtuuuuuu...',
    '...uuutuuuuuuu..',
    '...uuutuuuuauu..',
    '...uuuuuuuuauu..',
    '...uuuuuuuuauu..',
    '...uuuuuuuuguu..',
    '....bbbbbbbgb...',
    '....ddddddddd...',
    '.....ddd.qqq....',
    '.....ddd.qqq....',
    '.....ddd.qqq....',
    '.....ddd.qqq....',
    '.....ddd.qqq....',
    '...kkkkk.kkk....',
  ],
  legend: {
    c: 'indigo',
    l: 'lamp',
    v: 'ink',
    h: 'fog',
    s: 'skin',
    e: 'ink',
    w: 'paper',
    t: 'indigo',
    u: 'sky',
    a: 'denim',
    g: 'paper',
    b: 'ink',
    d: 'indigo',
    q: 'deep',
    k: 'ink',
  },
};

/** Props stand on the bench seat, their shadow on it, like the pictures on the café counter. */
const PROP_TOP = BENCH.top - 20;

export const STREET_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    passerby: { sprite: PASSERBY_SPRITE, x: 80, y: 39, side: 'right' },
    // Alone he stands where the passerby stands; with her there too, by his bus.
    driver: { sprite: DRIVER_SPRITE, x: 80, y: 39, side: 'right', beside: { x: 96, y: 39 } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 5 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 84, y: 25 } },
  rest: { left: { x: 38, y: PROP_TOP }, right: { x: 58, y: PROP_TOP } },
};
