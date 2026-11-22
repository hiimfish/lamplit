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
import { clipped, coreOrigin, CORE_H } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { NEIGHBOR_SPRITE } from './moveIn';

/**
 * The park stage: the town park in the golden hour before dusk. You stand on
 * the sandy path under the first lit lamp; between you and the person you talk
 * to is a park bench (a ball, a basket, a camera rest on it). Behind lies the
 * lawn, then the pond with the low sun on it, the trees of the far bank and
 * hazy hills. A notice board with the event poster stands at the right, and
 * two old trees lean in from the sides. Painted through the Painter interface,
 * palette colours only, whole pixels; partial alpha only for light.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; above it the trees rise into a sunset sky; to the sides the path
 * goes on with more benches, lamps, flower beds and trees along the pond;
 * spare height below is more path and then the grass in front of it.
 */

/** The bench: left edge, width and the y of its seat (props rest on it), in core pixels. */
const BENCH = { x: 38, w: 44, top: 50 } as const;
/** The notice board: the left edge of its panel, the panel's width, top and height. */
const BOARD = { x: 97, w: 23, top: 15, h: 21 } as const;

/** Where the sky meets the far bank of the pond. */
const HORIZON = 19;
const POND_TOP = 20;
const LAWN_TOP = 29;
/** The path you stand on starts here; the flower beds end on this line. */
const PATH_TOP = 54;
/** With enough spare height below the core, grass begins this far under the path's top. */
const PATH_H = 14;

/** The low sun, in core pixels. */
const SUN = { x: 70, y: 7 } as const;
/** Lamps, benches and beds repeat with this step outside the core. */
const STEP = 132;
const LAMP_X = 16;
/** The old tree on the left and the slimmer one on the right: the x of the trunk's middle. */
const LEFT_TREE_X = 2;
const RIGHT_TREE_X = 125;
/** A pavilion on the far bank, outside the core. */
const PAVILION_X = 160;

/** Largest value of the form `anchor - k * step` that is not above zero: where a repeating row starts. */
function firstAt(anchor: number, step: number): number {
  return anchor - step * Math.ceil(anchor / step);
}

function pick<T>(list: readonly T[], t: number, fallback: T): T {
  return list[Math.floor(t * list.length)] ?? fallback;
}

/** Paints the park to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);

  paintSky(p, w, ox, oy + HORIZON);
  paintFarBank(p, w, ox, oy);
  paintPond(p, w, ox, oy);
  paintLawn(p, w, ox, oy);
  paintPath(p, w, h, ox, oy);

  // Trees standing back on the lawn: one right of the core, more beyond on both sides.
  for (let x = ox + RIGHT_TREE_X; x - 30 < w; x += STEP * 2) paintTree(p, x, oy, 'slim', -1);
  for (let x = ox + LEFT_TREE_X - STEP; x + 30 > 0; x -= STEP * 2) paintTree(p, x, oy, 'slim', 1);
  // Flower beds along the path, open where a bench stands.
  for (let x = firstAt(ox, STEP) - STEP; x < w; x += STEP) {
    paintFlowerBed(p, x + BENCH.x + BENCH.w + 3, x + STEP + BENCH.x - 3, ox, oy);
  }
  for (let x = firstAt(ox + BENCH.x, STEP) - STEP; x < w; x += STEP) paintBench(p, x, oy);
  // Old trees at the path's edge: one left of the core, more beyond on both sides.
  for (let x = ox + LEFT_TREE_X; x + 50 > 0; x -= STEP * 2) paintTree(p, x, oy, 'old', 1);
  for (let x = ox + RIGHT_TREE_X + STEP; x - 50 < w; x += STEP * 2) paintTree(p, x, oy, 'old', -1);

  paintBoard(p, ox, oy);
  for (let x = firstAt(ox + LAMP_X, STEP) - STEP; x < w; x += STEP) paintLamp(p, x, oy);

  paintVerge(p, w, h, ox, oy);
}

// ---------------------------------------------------------------------------
// Sky

/** Sky colours by height above the horizon: gold at the hills, dusk blue overhead. */
const SKY: readonly (readonly [number, PaletteName])[] = [
  [4, 'honey'],
  [24, 'rosy'],
  [50, 'mauve'],
  [84, 'violet'],
  [122, 'dusk'],
  [168, 'indigo'],
  [224, 'deep'],
];

function paintSky(p: Painter, w: number, ox: number, horizon: number): void {
  p.rect(0, 0, w, Math.max(0, horizon), 'deep');
  for (let i = 0; i + 1 < SKY.length; i++) {
    const [d0, lower] = SKY[i] ?? [0, 'honey'];
    const [d1, upper] = SKY[i + 1] ?? [0, 'deep'];
    if (horizon - d0 <= 0) break;
    ditherGradient(p, 0, horizon - d1, w, d1 - d0, [upper, lower]);
  }
  p.rect(0, horizon - 4, w, 6, 'honey');

  // The first stars, only very high up.
  for (let cy = horizon - 150; cy > -12; cy -= 12) {
    for (let cx = firstAt(ox, 18); cx < w; cx += 18) {
      const sx = cx - ox;
      const sy = cy - horizon;
      const t = hash2(sx, sy, 5);
      if (t > 0.2) continue;
      const x = cx + Math.floor(hash2(sx, sy, 7) * 18);
      const y = cy + Math.floor(hash2(sx, sy, 9) * 12);
      px(p, x, y, t < 0.06 ? 'paper' : 'sky');
    }
  }

  // Long evening clouds, their undersides lit by the low sun.
  for (let x = firstAt(ox + 30, 62) - 62; x < w; x += 62) {
    const seed = x - ox;
    const up = 20 + Math.floor(hash2(seed, 1, 61) * 96);
    if (horizon - up < 2) continue;
    const [body, under]: readonly [PaletteName, PaletteName] =
      up < 40
        ? ['mauve', 'honey']
        : up < 70
          ? ['violet', 'rosy']
          : up < 104
            ? ['dusk', 'rosy']
            : ['indigo', 'mauve'];
    const y = horizon - up;
    const dx = Math.floor(hash2(seed, 2, 61) * 26);
    const len = 30 + Math.floor(hash2(seed, 3, 61) * 26);
    p.rect(x + dx + 10, y, len - 22, 1, body);
    p.rect(x + dx + 3, y + 1, len - 8, 1, body);
    p.rect(x + dx, y + 2, len, 1, body);
    p.rect(x + dx + 2, y + 3, len - 3, 1, under);
    p.rect(x + dx + 14, y + 4, len - 24, 1, under);
  }

  // The sun, low over the far bank.
  const sx = ox + SUN.x;
  const sy = horizon - HORIZON + SUN.y;
  glowEllipse(p, sx, sy, 26, 16, 'paper', [0.42, 0.26, 0.14, 0.06]);
  ellipse(p, sx, sy, 4, 4, 'paper');

  // A few birds on their way home.
  if (horizon >= 50) {
    const birds: readonly (readonly [number, number])[] = [
      [0, 0],
      [8, 3],
      [15, -2],
      [23, 4],
    ];
    for (const [bx, by] of birds) {
      const x = ox + 50 + bx;
      const y = horizon - 42 + by;
      px(p, x, y, 'plum');
      px(p, x + 1, y + 1, 'plum');
      px(p, x + 2, y + 1, 'plum');
      px(p, x + 3, y, 'plum');
    }
  }

  // Someone's kite, still up in the last of the wind.
  if (horizon >= 96) paintKite(p, ox + 84, horizon - 86);
}

/** A diamond kite with its top corner at (x, y), a tail of bows, the line running down to the right. */
function paintKite(p: Painter, x: number, y: number): void {
  // the line first, so the kite sits on it
  for (let i = 0; i < 90; i++) px(p, x + 2 + Math.floor(i / 2), y + 7 + i, 'fog');
  const rows: readonly (readonly [number, number])[] = [
    [0, 1],
    [-1, 3],
    [-2, 5],
    [-3, 7],
    [-2, 5],
    [-2, 5],
    [-1, 3],
    [-1, 3],
    [0, 1],
  ];
  rows.forEach(([dx, len], dy) => {
    p.rect(x + dx, y + dy, len, 1, 'red');
    if (len > 1) p.rect(x + dx, y + dy, Math.floor(len / 2), 1, 'neon');
  });
  p.rect(x - 3, y + 3, 7, 1, 'maroon');
  // tail
  const tail: readonly (readonly [number, number, PaletteName])[] = [
    [-1, 10, 'honey'],
    [-2, 12, 'honey'],
    [-2, 14, 'cyan'],
    [-3, 16, 'cyan'],
    [-5, 18, 'honey'],
  ];
  for (const [dx, dy, color] of tail) p.rect(x + dx, y + dy, 2, 1, color);
}

// ---------------------------------------------------------------------------
// The far side: hazy hills, the trees on the far bank, the pond.

function paintFarBank(p: Painter, w: number, ox: number, oy: number): void {
  const base = oy + HORIZON;
  // hills in the evening haze
  for (let x = 0; x < w; x++) {
    const wx = x - ox;
    const hh = 10 + Math.round(4 * Math.sin(wx * 0.04 + 1.6) + 2 * Math.sin(wx * 0.11));
    p.rect(x, base - hh, 1, hh, 'mauve');
    if (hash2(wx, 0, 17) < 0.5) px(p, x, base - hh, 'rosy');
  }
  // the far bank's trees, dark against the light, their tops catching it
  p.rect(0, base - 2, w, 3, 'moss');
  for (let x = firstAt(ox, 6) - 6; x < w + 6; x += 6) {
    const wx = x - ox;
    const nearSun = Math.abs(wx - SUN.x) < 9;
    const t = hash2(wx, 1, 13);
    const cx = x + Math.floor(hash2(wx, 2, 13) * 4);
    if (!nearSun && t < 0.1) {
      // a tall narrow tree
      const th = 9 + Math.floor(hash2(wx, 3, 13) * 4);
      p.rect(cx - 1, base - th + 1, 3, th, 'moss');
      px(p, cx, base - th, 'moss');
      px(p, cx + 1, base - th + 2, 'leaf');
      continue;
    }
    const ry = nearSun ? 1 : 2 + Math.floor(hash2(wx, 4, 13) * 3);
    const rx = 3 + Math.floor(hash2(wx, 5, 13) * 3);
    const cy = base - 2 - ry;
    ellipse(p, cx, cy, rx, ry, 'moss');
    if (t > 0.45) p.rect(cx, cy - ry, 2, 1, 'leaf');
    if (t > 0.7) px(p, cx + 2, cy - ry + 1, 'leaf');
  }
  // a little pavilion among them, right of the core
  for (let x = ox + PAVILION_X; x < w; x += STEP * 2) paintPavilion(p, x, base);
  for (let x = ox + PAVILION_X - STEP * 2 - 30; x + 16 > 0; x -= STEP * 2) {
    paintPavilion(p, x, base);
  }
}

/** A small open pavilion on the far bank, its left post at x. */
function paintPavilion(p: Painter, x: number, base: number): void {
  p.rect(x - 1, base - 1, 15, 2, 'fog');
  p.rect(x + 1, base - 7, 11, 6, 'honey');
  for (const dx of [1, 6, 11]) p.rect(x + dx, base - 7, 1, 6, 'ember');
  p.rect(x + 1, base - 3, 11, 1, 'ember');
  p.rect(x - 2, base - 9, 17, 2, 'maroon');
  p.rect(x - 3, base - 8, 19, 1, 'amber');
  p.rect(x + 1, base - 11, 11, 2, 'maroon');
  p.rect(x + 4, base - 13, 5, 2, 'maroon');
  px(p, x + 6, base - 14, 'amber');
}

function paintPond(p: Painter, w: number, ox: number, oy: number): void {
  const top = oy + POND_TOP;
  const rows = LAWN_TOP - POND_TOP;
  // the sky upside down: gold under the far bank, then rose, mauve and violet
  p.rect(0, top, w, 3, 'honey');
  ditherGradient(p, 0, top + 3, w, rows - 3, ['honey', 'rosy', 'mauve', 'violet']);
  // the far trees mirrored in it
  p.rect(0, top, w, 1, 'moss');
  ditherRect(p, 0, top + 1, w, 1, 'moss', 8);
  ditherRect(p, 0, top + 2, w, 1, 'moss', 3);
  // ripples
  for (let row = 2; row < rows; row++) {
    for (let x = firstAt(ox, 10) - 10; x < w; x += 10) {
      const wx = x - ox;
      if (hash2(wx, row, 21) > 0.5) continue;
      const dx = Math.floor(hash2(wx, row, 22) * 10);
      const len = 2 + Math.floor(hash2(wx, row, 23) * 5);
      p.rect(x + dx, top + row, len, 1, row < 4 ? 'paper' : row < 7 ? 'honey' : 'rosy');
    }
  }
  // the sun's path on the water: broken strokes
  const glitter: readonly (readonly [number, number])[][] = [
    [[-1, 3]],
    [[-1, 3]],
    [[-2, 5]],
    [
      [-3, 3],
      [1, 2],
    ],
    [[-2, 5]],
    [
      [-4, 2],
      [-1, 4],
    ],
    [[-3, 6]],
    [
      [-5, 3],
      [0, 4],
    ],
    [
      [-4, 2],
      [1, 5],
    ],
  ];
  glitter.forEach((strokes, row) => {
    if (row >= rows) return;
    for (const [dx, len] of strokes) {
      p.rect(ox + SUN.x + dx, top + row, len, 1, row === 0 || row > 5 ? 'honey' : 'paper');
    }
  });
  // two ducks
  for (const [dx, dy] of [
    [47, 5],
    [55, 6],
  ] as const) {
    p.rect(ox + dx, top + dy, 3, 1, 'plum');
    px(p, ox + dx - 1, top + dy - 1, 'plum');
    p.rect(ox + dx + 1, top + dy + 1, 4, 1, 'paper');
  }
}

// ---------------------------------------------------------------------------
// The lawn, the path, the grass in front.

function paintLawn(p: Painter, w: number, ox: number, oy: number): void {
  const top = oy + LAWN_TOP;
  const bottom = oy + PATH_TOP;
  p.rect(0, top, w, bottom - top, 'leaf');
  // the near bank: a dark edge and reeds
  p.rect(0, top, w, 1, 'moss');
  for (let x = firstAt(ox, 13) - 13; x < w; x += 13) {
    const wx = x - ox;
    if (hash2(wx, 0, 27) > 0.55) continue;
    const rx = x + Math.floor(hash2(wx, 1, 27) * 9);
    p.rect(rx, top - 2, 1, 3, 'moss');
    p.rect(rx + 2, top - 3, 1, 4, 'moss');
    px(p, rx + 2, top - 4, 'ember');
    px(p, rx + 4, top - 1, 'moss');
  }
  // low sunlight lying across the far half of the grass
  p.rect(0, top + 1, w, 4, 'honey', 0.3);
  p.rect(0, top + 5, w, 5, 'honey', 0.18);
  p.rect(0, top + 10, w, 5, 'honey', 0.08);
  // the near edge is in the shade of the beds
  ditherRect(p, 0, bottom - 9, w, 4, 'moss', 2);
  ditherRect(p, 0, bottom - 5, w, 5, 'moss', 5);
  // tufts and a few daisies
  for (let gy = top + 3; gy < bottom - 2; gy += 4) {
    for (let x = firstAt(ox, 9) - 9; x < w; x += 9) {
      const wx = x - ox;
      const wy = gy - oy;
      const t = hash2(wx, wy, 31);
      const tx = x + Math.floor(hash2(wx, wy, 32) * 9);
      const ty = gy + Math.floor(hash2(wx, wy, 33) * 4);
      if (t < 0.34) {
        px(p, tx, ty, 'moss');
        px(p, tx + 1, ty - 1, 'moss');
      } else if (t < 0.4) {
        px(p, tx, ty, 'paper');
      }
    }
  }
}

function paintPath(p: Painter, w: number, h: number, ox: number, oy: number): void {
  const top = oy + PATH_TOP;
  p.rect(0, top, w, h - top, 'tan');
  p.rect(0, top, w, 1, 'ember');
  ditherRect(p, 0, top + 1, w, 1, 'ember', 6);
  // gravel: light and dark grains
  for (let gy = top + 2; gy < h; gy += 2) {
    for (let x = firstAt(ox, 7) - 7; x < w; x += 7) {
      const wx = x - ox;
      const wy = gy - oy;
      const t = hash2(wx, wy, 37);
      const gx = x + Math.floor(hash2(wx, wy, 38) * 7);
      const y = gy + Math.floor(hash2(wx, wy, 39) * 2);
      if (y >= h) continue;
      if (t < 0.3) p.rect(gx, y, 2, 1, 'skin');
      else if (t < 0.5) px(p, gx, y, 'ember');
    }
  }
}

/** With room below the core, the grass on the near side of the path. */
function paintVerge(p: Painter, w: number, h: number, ox: number, oy: number): void {
  const top = oy + PATH_TOP + PATH_H;
  if (h - top < 2) return;
  p.rect(0, top, w, h - top, 'moss');
  ditherRect(p, 0, top - 1, w, 1, 'ember', 8);
  for (let x = firstAt(ox, 3) - 3; x < w; x += 3) {
    const wx = x - ox;
    const t = hash2(wx, 0, 43);
    const bx = x + Math.floor(hash2(wx, 1, 43) * 3);
    if (t < 0.6) px(p, bx, top - 1, 'moss');
    if (t < 0.2) px(p, bx + 1, top - 2, 'moss');
    if (t > 0.5 && h - top > 2) px(p, bx, top + 1 + Math.floor(hash2(wx, 2, 43) * 3), 'leaf');
    if (t > 0.94 && h - top > 4) px(p, bx, top + 2, 'paper');
  }
}

// ---------------------------------------------------------------------------
// Trees

type Blob = readonly [dx: number, dy: number, rx: number, ry: number];
type TreeKind = 'old' | 'slim';

interface TreeShape {
  /** The y of the trunk's foot in core pixels, its width and height. */
  foot: number;
  trunkW: number;
  trunkH: number;
  /** Clumps of leaves from the top down, measured from the foot (dx grows toward the sun). */
  crown: readonly Blob[];
}

const TREES: Readonly<Record<TreeKind, TreeShape>> = {
  // a broad old tree at the edge of the path
  old: {
    foot: 56,
    trunkW: 7,
    trunkH: 62,
    crown: [
      [2, -117, 20, 11],
      [-19, -109, 16, 10],
      [23, -105, 17, 10],
      [-33, -93, 13, 10],
      [0, -99, 22, 12],
      [33, -89, 14, 10],
      [-14, -85, 18, 11],
      [17, -81, 20, 11],
      [-31, -73, 14, 9],
      [35, -71, 12, 8],
      [-8, -67, 18, 9],
      [17, -63, 16, 8],
      [-22, -59, 10, 6],
      [3, -55, 12, 5],
    ],
  },
  // a younger, taller one standing back on the lawn
  slim: {
    foot: 47,
    trunkW: 3,
    trunkH: 44,
    crown: [
      [1, -95, 11, 9],
      [-8, -83, 13, 10],
      [9, -80, 13, 10],
      [0, -68, 18, 11],
      [-11, -56, 12, 9],
      [10, -54, 13, 9],
      [0, -45, 10, 6],
    ],
  },
};

/** A tree with its trunk's middle at cx; `sun` is +1 when the sun is to its right, -1 to its left. */
function paintTree(p: Painter, cx: number, oy: number, kind: TreeKind, sun: 1 | -1): void {
  const shape = TREES[kind];
  const foot = oy + shape.foot;
  const half = Math.floor(shape.trunkW / 2);
  const top = foot - shape.trunkH;
  const old = kind === 'old';

  // its long shadow, falling away from the sun: on the path for the old tree, on the grass otherwise
  for (let i = 0; i < 7; i++) {
    const sw = shape.trunkW + 6 - i;
    const sx = cx - sun * (2 + i * 3) - Math.floor(sw / 2);
    ditherRect(p, sx, foot - 1 + i, sw, 1, old ? 'ember' : 'moss', old ? 7 : 9);
  }

  // trunk: dark, the side toward the sun warm
  p.rect(cx - half, top, shape.trunkW, shape.trunkH, 'plum');
  const litW = old ? 2 : 1;
  const litX = sun > 0 ? cx + half + 1 - litW : cx - half;
  p.rect(litX, top, litW, shape.trunkH, 'ember');
  if (old) {
    p.rect(cx - half - 1, foot - 5, shape.trunkW + 2, 5, 'plum');
    p.rect(cx - half - 2, foot - 2, shape.trunkW + 4, 2, 'plum');
    p.rect(sun > 0 ? litX + 1 : litX - 1, foot - 5, 2, 3, 'ember');
    for (let i = 0; i < 6; i++) {
      const by = top + 14 + i * 7 + Math.floor(hash2(i, 1, 51) * 4);
      p.rect(cx - 1 - sun + Math.floor(hash2(i, 2, 51) * 2), by, 1, 3, 'night');
    }
    // two limbs forking off below the crown
    for (let i = 0; i < 13; i++) {
      // the longer one on the side away from the sun
      p.rect(cx - sun * (half + 1 + i) - 1, foot - 39 - i, 3, 2, 'plum');
      if (i < 8) {
        p.rect(cx + sun * (half + i) - 1, foot - 43 - i, 3, 2, 'plum');
        px(p, cx + sun * (half + 1 + i), foot - 43 - i, 'ember');
      }
    }
  }

  // crown: one dark mass, then each clump's sunny side from the top down
  const seed = old ? 53 : 57;
  for (const [dx, dy, rx, ry] of shape.crown) ellipse(p, cx + sun * dx, foot + dy, rx, ry, 'moss');
  shape.crown.forEach(([dx, dy, rx, ry], b) => {
    const bx = cx + sun * dx;
    const by = foot + dy;
    // loose leaves around the clump
    for (let i = 0; i < 8; i++) {
      const a = hash2(b, i, seed) * Math.PI * 2;
      const r = 1 + hash2(b, i, seed + 1) * 0.22;
      const lx = bx + Math.round(Math.cos(a) * rx * r);
      const ly = by + Math.round(Math.sin(a) * ry * r);
      p.rect(lx, ly, 2, 1, 'moss');
    }
    if (rx < 11) return;
    // a crescent of lit leaves on the side toward the sun
    ellipse(p, bx + sun * 2, by - 2, rx - 4, ry - 3, 'leaf');
    ellipse(p, bx - sun, by + 1, rx - 4, ry - 3, 'moss');
    for (let i = 0; i < 5; i++) {
      const a = 0.15 + hash2(b, i, seed + 2) * 1.5;
      const lx = bx + sun * (2 + Math.round(Math.cos(a) * (rx - 4)));
      const ly = by - 2 - Math.round(Math.sin(a) * (ry - 3));
      const t = hash2(b, i, seed + 3);
      if (t < 0.3) px(p, lx, ly, 'honey');
      else if (t < 0.6) p.rect(lx - sun * 3, ly + 2, 2, 1, 'leaf');
    }
  });
}

// ---------------------------------------------------------------------------
// Along the path: flower beds, benches, the notice board, lamps.

const FLOWERS: readonly PaletteName[] = ['neon', 'paper', 'honey', 'rosy', 'paper', 'honey'];

/** A low bed of flowers between the lawn and the path, from x0 to x1. */
function paintFlowerBed(p: Painter, x0: number, x1: number, ox: number, oy: number): void {
  const bottom = oy + PATH_TOP;
  for (let x = x0; x < x1; x++) {
    const wx = x - ox;
    const end = Math.min(x - x0, x1 - 1 - x);
    const t = hash2(wx, 0, 67);
    const top = bottom - 5 + (end < 1 ? 2 : end < 3 ? 1 : 0) + (t < 0.3 ? 1 : 0);
    p.rect(x, top, 1, bottom - top, 'moss');
    if (t > 0.72) px(p, x, top, 'leaf');
    const f = hash2(wx, 1, 67);
    if (f < 0.3 && end > 0) {
      px(p, x, top + 1 + Math.floor(hash2(wx, 2, 67) * 3), pick(FLOWERS, f / 0.3, 'paper'));
    }
  }
  p.rect(x0 + 1, bottom, x1 - x0 - 2, 1, 'plum');
}

/** A park bench seen from the front, its left edge at x. */
function paintBench(p: Painter, x: number, oy: number): void {
  const top = oy + BENCH.top;
  const foot = oy + 59;
  const { w } = BENCH;
  // its shadow reaching toward you across the path
  ditherRect(p, x - 1, foot, w + 2, 1, 'ember', 10);
  ditherRect(p, x - 2, foot + 1, w + 4, 1, 'ember', 6);
  ditherRect(p, x - 3, foot + 2, w + 6, 1, 'ember', 3);
  // iron ends: back posts, arm rests, legs
  for (const ex of [x, x + w - 2]) {
    p.rect(ex, top - 11, 2, foot - top + 11, 'ink');
    p.rect(ex - 1, foot - 1, 4, 1, 'ink');
  }
  p.rect(x - 1, top - 5, 4, 1, 'ink');
  p.rect(x + w - 3, top - 5, 4, 1, 'ink');
  px(p, x - 1, top - 4, 'ink');
  px(p, x + w, top - 4, 'ink');
  p.rect(x + Math.floor(w / 2) - 1, top + 5, 2, foot - top - 6, 'ink');
  // back: two wooden rails
  p.rect(x + 2, top - 10, w - 4, 3, 'amber');
  p.rect(x + 2, top - 10, w - 4, 1, 'lamp');
  p.rect(x + 2, top - 5, w - 4, 3, 'amber');
  p.rect(x + 2, top - 3, w - 4, 1, 'ember');
  // seat
  p.rect(x, top, w, 3, 'amber');
  p.rect(x, top, w, 1, 'lamp');
  p.rect(x, top + 3, w, 2, 'ember');
  for (let sx = x + 11; sx < x + w - 2; sx += 11) {
    p.rect(sx, top + 1, 1, 2, 'ember');
    p.rect(sx, top - 9, 1, 2, 'ember');
    p.rect(sx, top - 4, 1, 1, 'ember');
  }
}

/** The notice board on its two posts, a little roof over it, the event poster pinned up. */
function paintBoard(p: Painter, ox: number, oy: number): void {
  const x = ox + BOARD.x;
  const top = oy + BOARD.top;
  const { w, h } = BOARD;
  const foot = oy + PATH_TOP + 2;
  // posts, their shadows slanting away from the sun across the path
  for (const px0 of [x + 2, x + w - 4]) {
    for (let i = 0; i < 5; i++) ditherRect(p, px0 + 1 + i * 2, foot + i, 3, 1, 'ember', 8);
    p.rect(px0, top + h, 2, foot - top - h, 'ember');
    p.rect(px0 + 1, top + h, 1, foot - top - h, 'plum');
    p.rect(px0 - 1, foot - 1, 4, 1, 'plum');
  }
  // roof
  p.rect(x - 2, top - 2, w + 4, 2, 'ember');
  p.rect(x - 2, top - 2, w + 4, 1, 'amber');
  p.rect(x + 3, top - 3, w - 6, 1, 'amber');
  // frame and cork
  p.rect(x, top, w, h, 'ember');
  p.rect(x + 1, top + 1, w - 2, h - 2, 'tan');
  p.rect(x + 1, top + 1, w - 2, 1, 'plum');
  // the event poster: a sun over a green hill, three lines of writing
  p.rect(x + 3, top + 3, 10, 15, 'paper');
  p.rect(x + 3, top + 3, 10, 6, 'sky');
  p.rect(x + 9, top + 4, 2, 2, 'honey');
  p.rect(x + 3, top + 7, 10, 2, 'leaf');
  p.rect(x + 5, top + 6, 4, 1, 'leaf');
  p.rect(x + 4, top + 11, 8, 1, 'stone');
  p.rect(x + 4, top + 13, 6, 1, 'stone');
  p.rect(x + 4, top + 15, 7, 1, 'red');
  px(p, x + 8, top + 3, 'red');
  // smaller notes beside it
  p.rect(x + 15, top + 3, 5, 6, 'honey');
  p.rect(x + 16, top + 5, 3, 1, 'ember');
  p.rect(x + 16, top + 7, 2, 1, 'ember');
  px(p, x + 17, top + 3, 'red');
  p.rect(x + 14, top + 11, 6, 7, 'rosy');
  p.rect(x + 15, top + 13, 4, 1, 'maroon');
  p.rect(x + 15, top + 15, 3, 1, 'maroon');
  px(p, x + 16, top + 11, 'paper');
}

/** A park lamp: a lit lantern on a slim post (the post at x), its light on the path. */
function paintLamp(p: Painter, x: number, oy: number): void {
  const head = oy + 5;
  const foot = oy + 61;
  p.rect(x, head + 9, 2, foot - head - 9, 'ink');
  p.rect(x, head + 16, 1, foot - head - 24, 'stone');
  p.rect(x - 1, foot - 5, 4, 5, 'ink');
  p.rect(x - 2, foot, 6, 1, 'ink');
  p.rect(x - 1, head + 12, 4, 1, 'ink');
  // lantern
  p.rect(x, head - 1, 2, 1, 'ink');
  p.rect(x - 2, head, 6, 1, 'ink');
  p.rect(x - 3, head + 1, 8, 1, 'ink');
  p.rect(x - 2, head + 2, 6, 5, 'honey');
  p.rect(x - 1, head + 3, 4, 3, 'paper');
  p.rect(x - 3, head + 2, 1, 5, 'ink');
  p.rect(x + 4, head + 2, 1, 5, 'ink');
  p.rect(x - 2, head + 7, 6, 1, 'ink');
  p.rect(x - 1, head + 8, 4, 1, 'ink');
  glowEllipse(p, x + 1, head + 4, 11, 9, 'honey', [0.36, 0.22, 0.1]);
  glowEllipse(p, x + 6, foot, 24, 5, 'honey', [0.3, 0.18, 0.08]);
}

// ---------------------------------------------------------------------------
// The volunteer: 16x24, facing left. A man in his thirties helping at the
// weekend event: a white cap over short dark hair, a bright cyan volunteer
// vest with a yellow band over a white T-shirt, bare forearms, grey trousers,
// a clipboard with the sign-up sheet held in front of him.

const VOLUNTEER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '.....cccccc.....',
    '....cbcccccc....',
    '..fffccccccc....',
    '....sssshhhh....',
    '...ssesssshh....',
    '....sssssss.....',
    '....sssssss.....',
    '......sss.......',
    '.....vvvwwww....',
    '....vvvvvwwww...',
    '....vvvvvwwww...',
    '..ooovvvvvsst...',
    '..oppyyyyysst...',
    '..opgvvvvvsst...',
    '..oppssvvvsst...',
    '..ooovvvvvvt....',
    '.....dddddd.....',
    '......ddqq......',
    '......ddqq......',
    '......ddqq......',
    '......ddqq......',
    '......ddqq......',
    '....kkkkk.......',
  ],
  legend: {
    c: 'paper',
    b: 'cyan',
    f: 'fog',
    h: 'night',
    s: 'skin',
    e: 'ink',
    w: 'paper',
    v: 'cyan',
    t: 'teal',
    y: 'honey',
    o: 'amber',
    p: 'paper',
    g: 'stone',
    d: 'stone',
    q: 'slate',
    k: 'ink',
  },
};

/** Props stand on the bench seat, their shadow on it, like the pictures on the café counter. */
const PROP_TOP = BENCH.top - 20;

export const PARK_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    neighbor: { sprite: NEIGHBOR_SPRITE, x: 80, y: CORE_H - 25, side: 'right' },
    // Alone he stands where the neighbour stands; with her there too, by the notice board.
    volunteer: {
      sprite: VOLUNTEER_SPRITE,
      x: 80,
      y: CORE_H - 25,
      side: 'right',
      beside: { x: 96, y: CORE_H - 25 },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 5 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 84, y: 25 } },
  rest: { left: { x: BENCH.x, y: PROP_TOP }, right: { x: BENCH.x + 20, y: PROP_TOP } },
};
