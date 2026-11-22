import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { COWORKER_SPRITE, DIRECTOR_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_W } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The company event stage: Lakeside Hall on the evening of Harbor Trading's
 * twentieth anniversary party. From the left: a guest table under a tall
 * window onto the lake at dusk (you stand beside it), the buffet table under
 * a red and gold "20" banner hung with balloons (handed-over things rest on
 * its cloth), then the small stage: a red curtain, a wooden platform, the
 * microphone, a guitar and an amplifier waiting for the band. Strings of
 * warm bulbs run along the wall. Ms. Carter and Dan stand at the buffet's far
 * end; Mr. Ellis stands on the platform at the microphone. Painted through
 * the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (party bunting, the stage lights, big
 * foil "20" balloons, balloons that got away to the ceiling, taller windows,
 * then a cornice and the upper hall with arched windows and chandeliers), and
 * to both sides more guest tables, each with one of the company's glass
 * lamps, under windows and boards of old photos.
 */

/** The buffet table: left edge, width and the y of its top (props rest on it), in core pixels. */
const BUFFET = { x: 35, w: 37, top: 47 } as const;
/** 24x24 pictures stand on the cloth with their shadow on it. */
const PROP_TOP = BUFFET.top - 20;

const FLOOR_TOP = 54;
/** Where the feet of people and furniture are: one past the last row of a shoe. */
const FEET = 63;
/** The rail on top of the dark panelling. */
const RAIL_Y = 47;
/**
 * The small stage: its left edge, the back of the platform's top (where the
 * curtain ends), its front lip (the row the speaker's shoes stand on) and how
 * far it runs past the core.
 */
const PLATFORM = { x: 95, back: 49, lip: 57, tail: 26 } as const;
/** The microphone stand's pole. */
const MIC_X = 98;
/** At the buffet's far end; next to it, nearer the stage; on the platform at the microphone. */
const BY_BUFFET = { x: 70, y: 39 } as const;
const NEAR_STAGE = { x: 82, y: 39 } as const;
const AT_MIC = { x: 96, y: PLATFORM.lip - 23 } as const;
/** The anniversary banner on the wall over the buffet. */
const BANNER = { x: 45, y: 6, w: 36, h: 13 } as const;
/** The tall window in the core: its outer frame. */
const WINDOW = { x: 3, y: 7, w: 23, h: 31 } as const;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 22;
/** Width of one bay beside the core. */
const BAY_W = 46;
/** The strings of bulbs: the distance between two hooks. */
const LIGHT_SPAN = 26;
/** Wall above the core needed for the bunting and stage lights, the foil balloons, the loose balloons. */
const BUNTING_MIN = 14;
const FOIL_MIN = 36;
const LOOSE_MIN = 44;
/** Wall above the core needed for the upper hall, and how far above the core its cornice sits. */
const CORNICE_MIN = 64;
const CORNICE_UP = 50;
/** Gap between the arched windows of the upper hall. */
const HIGH_GAP = 88;

type Pair = readonly [PaletteName, PaletteName];

/** Balloon and pennant colours: body and its shade. */
const PARTY: readonly Pair[] = [
  ['red', 'maroon'],
  ['lamp', 'amber'],
  ['cyan', 'teal'],
  ['neon', 'neonDeep'],
  ['leaf', 'moss'],
  ['honey', 'lamp'],
];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function party(n: number): Pair {
  return PARTY[mod(n, PARTY.length)] ?? ['red', 'maroon'];
}

/** A painter that only paints inside one rectangle (a window's glass). */
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

/** A thin line from one pixel to another. */
function line(p: Painter, x0: number, y0: number, x1: number, y1: number, c: PaletteName): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    px(p, Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), c);
  }
}

/** A shape given as rows of '#' and '.', one colour. */
function paintGlyph(p: Painter, x: number, y: number, rows: readonly string[], c: PaletteName) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') px(p, x + dx, y + dy, c);
  });
}

/** The banner's numerals, 6x9. */
const TWO = [
  '.####.',
  '##..##',
  '....##',
  '....##',
  '...##.',
  '..##..',
  '.##...',
  '##....',
  '######',
] as const;
const ZERO = [
  '.####.',
  '##..##',
  '##..##',
  '##..##',
  '##..##',
  '##..##',
  '##..##',
  '##..##',
  '.####.',
] as const;

/** The foil balloons' numerals, 9x12. */
const BIG_TWO = [
  '.#######.',
  '#########',
  '###...###',
  '......###',
  '.....###.',
  '....###..',
  '...###...',
  '..###....',
  '.###.....',
  '###......',
  '#########',
  '#########',
] as const;
const BIG_ZERO = [
  '.#######.',
  '#########',
  '###...###',
  '###...###',
  '###...###',
  '###...###',
  '###...###',
  '###...###',
  '###...###',
  '###...###',
  '#########',
  '.#######.',
] as const;

/** Paints the party hall to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const railY = oy + RAIL_Y;
  const stageX = ox + PLATFORM.x;
  const stageEnd = ox + CORE_W + PLATFORM.tail;
  const cornice = oy >= CORNICE_MIN ? oy - CORNICE_UP : 0;
  // On a taller stage the windows reach further up.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 24));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The bays beside the core, each with a guest table: [left x, its number].
  const bays: [number, number][] = [];
  for (let x = ox - 10 - BAY_W, i = 1; x + BAY_W > 0; x -= BAY_W, i++) bays.push([x, i]);
  for (let x = stageEnd + 12, i = 0; x < w; x += BAY_W, i++) bays.push([x, i]);
  /** The guest tables' centres: the one at the core's left edge, then one per bay. */
  const tables = [ox + 5, ...bays.map(([x]) => x + 23)];

  // The wall: deep blue, lit where the lamps and the bulbs are.
  p.rect(0, 0, w, railY, 'indigo');
  if (cornice > 0) paintUpperHall(p, w, ox, cornice);
  else ditherRect(p, 0, 0, w, 2, 'deep', 8);
  const wallLight = { y0: cornice > 0 ? cornice + 3 : 0, y1: railY };
  lightPool(p, ox + 62, oy + 30, 38, 26, [['dusk', 0.42]], wallLight);
  for (const cx of tables) {
    lightPool(p, cx, oy + 41, 17, 15, [['dusk', 0.6]], wallLight);
    lightPool(p, cx, oy + 43, 8, 7, [['violet', 0.5]], wallLight);
  }

  // Up the wall, when there is room above the core.
  if (oy >= LOOSE_MIN && cornice === 0) paintLooseBalloons(p, w, ox);
  if (oy >= FOIL_MIN) paintFoilTwenty(p, ox + BANNER.x, oy);

  paintPanelling(p, w, ox, railY, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Windows onto the lake and boards of old photos.
  paintLakeWindow(p, ox + WINDOW.x, winTop, winH, ox);
  for (const [x, i] of bays) {
    if (i % 2 === 0) paintLakeWindow(p, x + 12, winTop, winH, ox);
    else paintPhotoBoard(p, x + 9, oy + 13, i);
  }

  // Bulbs on strings along the wall, bunting above them, both stopping at the stage.
  paintStringLights(p, 0, stageX - 2, oy, ox + 93);
  paintStringLights(p, stageEnd + 1, w, oy, stageEnd + 1);
  if (oy >= BUNTING_MIN) {
    paintBunting(p, 0, stageX - 3, oy - 10, ox);
    paintBunting(p, stageEnd + 2, w, oy - 10, stageEnd + 2);
  }
  paintBanner(p, ox + BANNER.x, oy + BANNER.y);

  paintStage(p, stageX, stageEnd, oy, oy >= BUNTING_MIN);
  paintMic(p, ox + MIC_X, oy + PLATFORM.lip);
  paintGuitar(p, ox + 114, oy + PLATFORM.lip);
  paintAmp(p, ox + 121, oy + PLATFORM.lip);
  paintSpeaker(p, stageEnd + 2, oy);

  // The guest tables, further back than the buffet.
  paintGuestTable(p, ox + 5, oy, 0, false);
  for (const [x, i] of bays) paintGuestTable(p, x + 23, oy, i, true);

  paintBuffet(p, ox + BUFFET.x, oy + BUFFET.top, BUFFET.w, oy + FEET);
}

// ---------------------------------------------------------------------------
// Room

/** Dark panelling under a brass rail, with a skirting board. */
function paintPanelling(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'plum');
  p.rect(0, top, w, 1, 'amber');
  p.rect(0, top + 1, w, 1, 'ember');
  for (let x = mod(ox + 4, 12) - 12; x < w; x += 12) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'night');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** A polished wooden floor: long boards, their joints staggered, counted from the core. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'ember');
  p.rect(0, floorTop, w, 1, 'night');
  let y = floorTop + 1;
  for (let row = 0; y < h; row++) {
    const rowH = Math.min(3 + row, 5);
    p.rect(0, y + rowH - 1, w, 1, 'plum');
    for (let x = mod(ox + row * 13, 36) - 36; x < w; x += 36) {
      p.rect(x, y, 1, rowH - 1, 'plum');
      // the bulbs' shine on some of the boards
      if (hash2(x - ox, row, 211) < 0.5) p.rect(x + 5, y, 9, 1, 'amber');
      if (hash2(x - ox, row, 223) < 0.3) p.rect(x + 22, y + 1, 5, 1, 'amber');
    }
    y += rowH;
  }
}

// ---------------------------------------------------------------------------
// The lake outside

/** One period of the lake, in pixels; the view repeats so every window shows a piece of it. */
const LAKE_P = 138;

/**
 * The lake at dusk seen through a window: its glass from (x, y), w x h.
 * Positions count from the core's left edge `ox`, so windows side by side
 * show one continuous view.
 */
function paintLake(target: Painter, x: number, y: number, w: number, h: number, ox: number) {
  const p = within(target, x, y, w, h);
  // The far shore sits a fixed way up from the sill, so a taller window only shows more sky.
  const horizon = y + h - 9;
  const sky: PaletteName[] =
    h > 34
      ? ['deep', 'deep', 'indigo', 'violet', 'mauve', 'rosy']
      : ['deep', 'indigo', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, x, y, w, horizon - y, sky);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['mauve', 'violet', 'dusk', 'indigo']);
  for (let i = 0; i < w; i++) {
    const hx = mod(x + i - ox, LAKE_P);
    const turn = (hx / LAKE_P) * Math.PI * 2;
    // wooded hills on the far shore, a few house lights at the water's edge
    const bump = Math.round(2.2 + Math.sin(turn * 3) * 1.4 + Math.sin(turn * 8) * 0.7);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(hx, 5, 89) < 0.1) px(p, x + i, horizon, 'honey');
    // the afterglow on the water
    if (hx % 5 === 0 && hash2(hx, 1, 71) < 0.55) {
      p.rect(x + i, horizon + 2 + Math.floor(hash2(hx, 2, 73) * 6), 2 + (hx % 2), 1, 'rosy');
    }
    // a few early stars
    if (hash2(hx, 3, 79) < 0.05) {
      px(p, x + i, y + 1 + Math.floor(hash2(hx, 4, 83) * Math.max(3, horizon - y - 14)), 'fog');
    }
  }
  // what stands in the water, one period at a time
  const first = Math.floor((x - ox - 40) / LAKE_P);
  for (let k = first; ox + k * LAKE_P < x + w + 40; k++) {
    const base = ox + k * LAKE_P;
    // a thin moon
    p.rect(base + 18, y + 3, 1, 4, 'paper');
    px(p, base + 17, y + 2, 'paper');
    px(p, base + 17, y + 7, 'paper');
    // the hall's jetty with a lamp at its end
    p.rect(base + 4, horizon + 5, 14, 1, 'ink');
    for (let jx = base + 5; jx < base + 18; jx += 4) p.rect(jx, horizon + 6, 1, 2, 'ink');
    p.rect(base + 5, horizon + 1, 1, 4, 'ink');
    px(p, base + 5, horizon, 'honey');
    px(p, base + 6, horizon + 7, 'lamp');
    // a sailing boat coming home
    p.rect(base + 84, horizon + 3, 7, 1, 'ink');
    p.rect(base + 87, horizon - 3, 1, 6, 'ink');
    p.rect(base + 88, horizon - 2, 1, 4, 'paper');
    p.rect(base + 89, horizon, 1, 2, 'paper');
    px(p, base + 86, horizon + 5, 'fog');
  }
}

/** A tall window onto the lake between long drapes, its frame from (x, top), `ht` high. */
function paintLakeWindow(p: Painter, x: number, top: number, ht: number, ox: number): void {
  const w = WINDOW.w;
  const bottom = top + ht;
  // the drapes, tied back, under a pelmet on a brass rod
  for (const [dx, lit] of [
    [x - 4, x - 2],
    [x + w, x + w + 1],
  ] as const) {
    p.rect(dx, top - 1, 4, ht + 8, 'violet');
    p.rect(lit, top - 1, 1, ht + 8, 'mauve');
    p.rect(dx, bottom - 6, 4, 1, 'lamp');
    p.rect(dx, bottom + 6, 4, 1, 'plum');
  }
  p.rect(x - 5, top - 3, w + 10, 3, 'violet');
  p.rect(x - 5, top - 3, w + 10, 1, 'lamp');
  for (let sx = x - 4; sx < x + w + 5; sx += 3) px(p, sx, top, 'violet');

  p.rect(x, top, w, ht, 'concrete');
  paintLake(p, x + 1, top + 1, w - 2, ht - 2, ox);
  p.rect(x + Math.floor(w / 2), top + 1, 1, ht - 2, 'concrete');
  p.rect(x + 1, top + 10, w - 2, 1, 'concrete');
  // the sill and its shadow
  p.rect(x - 1, bottom, w + 2, 1, 'fog');
  p.rect(x, bottom + 1, w, 1, 'deep');
}

// ---------------------------------------------------------------------------
// Decorations

/** One round balloon, 5 wide, its knot under it; top left at (x, y). */
function paintBalloon(p: Painter, x: number, y: number, n: number): void {
  const [c, shade] = party(n);
  p.rect(x + 1, y, 3, 1, c);
  p.rect(x, y + 1, 5, 3, c);
  p.rect(x + 1, y + 4, 3, 1, c);
  p.rect(x + 4, y + 2, 1, 2, shade);
  px(p, x + 3, y + 4, shade);
  px(p, x + 2, y + 5, shade);
  px(p, x + 1, y + 1, 'paper');
}

/** Three balloons on strings tied at (tx, ty), leaning to the left (-1) or the right (1). */
function paintBalloonBunch(p: Painter, tx: number, ty: number, lean: 1 | -1, n: number): void {
  const spots: readonly [number, number][] = [
    [lean * 2 - 2, -16],
    [lean * 7 - 2, -12],
    [lean * 4 - 2, -8],
  ];
  for (const [dx, dy] of spots) line(p, tx, ty, tx + dx + 2, ty + dy + 5, 'fog');
  spots.forEach(([dx, dy], i) => paintBalloon(p, tx + dx, ty + dy, n + i * 2));
}

/** The anniversary banner: red cloth with gold borders and a gold "20", balloons at both ends. */
function paintBanner(p: Painter, x: number, y: number): void {
  const { w, h } = BANNER;
  // cords up to two hooks
  for (const hx of [x + 3, x + w - 4]) {
    p.rect(hx, y - 3, 1, 3, 'fog');
    px(p, hx, y - 4, 'lamp');
  }
  p.rect(x + 1, y + h, w - 1, 1, 'deep'); // its shadow on the wall
  p.rect(x, y, w, h, 'red');
  p.rect(x, y, w, 1, 'honey');
  p.rect(x, y + h - 1, w, 1, 'honey');
  p.rect(x, y + h - 2, w, 1, 'maroon');
  p.rect(x, y + 1, 1, h - 2, 'maroon');
  p.rect(x + w - 1, y + 1, 1, h - 2, 'maroon');
  // "20", its shadow first
  paintGlyph(p, x + 12, y + 3, TWO, 'maroon');
  paintGlyph(p, x + 20, y + 3, ZERO, 'maroon');
  paintGlyph(p, x + 11, y + 2, TWO, 'honey');
  paintGlyph(p, x + 19, y + 2, ZERO, 'honey');
  // a star at each side
  for (const sx of [x + 5, x + w - 6]) {
    p.rect(sx - 1, y + 6, 3, 1, 'honey');
    p.rect(sx, y + 5, 1, 3, 'honey');
    px(p, sx, y + 6, 'paper');
  }
  paintBalloonBunch(p, x - 1, y + h - 1, -1, 1);
  paintBalloonBunch(p, x + w, y + h - 1, 1, 2);
}

/** Warm bulbs on a wire that sags between hooks, from x0 to x1; hooks count from `anchor`. */
function paintStringLights(p: Painter, x0: number, x1: number, y: number, anchor: number): void {
  for (let x = Math.max(0, x0); x < x1; x++) {
    const t = mod(x - anchor, LIGHT_SPAN);
    const sag = Math.round((12 * t * (LIGHT_SPAN - t)) / (LIGHT_SPAN * LIGHT_SPAN));
    px(p, x, y + sag, 'ink');
    if (t % 4 === 1) {
      px(p, x, y + sag + 1, mod(Math.floor((x - anchor) / 4), 3) === 0 ? 'lamp' : 'honey');
    }
  }
}

/** A line of little flags from x0 to x1 along y; the colours count from `anchor`. */
function paintBunting(target: Painter, x0: number, x1: number, y: number, anchor: number): void {
  if (x1 <= x0) return;
  const p = within(target, x0, y, x1 - x0, 5);
  p.rect(x0, y, x1 - x0, 1, 'stone');
  for (let x = x0 - mod(x0 - anchor, 7); x < x1; x += 7) {
    const [c] = party(Math.floor((x - anchor) / 7));
    p.rect(x + 1, y + 1, 5, 1, c);
    p.rect(x + 2, y + 2, 3, 1, c);
    px(p, x + 3, y + 3, c);
  }
}

/** Big gold foil balloons, "2" and "0", floating over the banner on their ribbons. */
function paintFoilTwenty(p: Painter, x: number, oy: number): void {
  const y = oy - 31;
  const left = x + 7;
  const right = x + 20;
  line(p, left + 4, y + 12, x + 6, oy + BANNER.y - 4, 'fog');
  line(p, right + 4, y + 12, x + BANNER.w - 7, oy + BANNER.y - 4, 'fog');
  paintGlyph(p, left + 1, y + 1, BIG_TWO, 'amber');
  paintGlyph(p, right + 1, y + 1, BIG_ZERO, 'amber');
  paintGlyph(p, left, y, BIG_TWO, 'honey');
  paintGlyph(p, right, y, BIG_ZERO, 'honey');
  px(p, left + 1, y + 1, 'paper');
  px(p, left + 2, y + 1, 'paper');
  px(p, right + 1, y + 1, 'paper');
  px(p, right + 1, y + 2, 'paper');
}

/** Balloons that got away and rest against the ceiling, their strings hanging. */
function paintLooseBalloons(p: Painter, w: number, ox: number): void {
  for (let k = Math.floor(-ox / 23) - 1; ox + k * 23 < w; k++) {
    if (hash2(k, 3, 307) < 0.35) continue;
    const x = ox + k * 23 + Math.floor(hash2(k, 5, 311) * 12);
    const y = 2 + Math.floor(hash2(k, 7, 313) * 3);
    const len = 5 + Math.floor(hash2(k, 9, 317) * 5);
    p.rect(x + 2, y + 6, 1, len, 'fog');
    px(p, x + 3, y + 6 + len, 'fog');
    paintBalloon(p, x, y, Math.floor(hash2(k, 11, 331) * PARTY.length));
  }
}

/** A board of old photos from the company's twenty years, its top left at (x, y). */
function paintPhotoBoard(p: Painter, x: number, y: number, n: number): void {
  const w = 28;
  const h = 19;
  p.rect(x + 1, y + h, w, 1, 'deep');
  p.rect(x, y, w, h, 'ember');
  p.rect(x, y, w, 1, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'tan');
  const skies: readonly PaletteName[] = ['sky', 'rosy', 'fog', 'honey', 'sky', 'mauve'];
  for (let i = 0; i < 6; i++) {
    const fx = x + 3 + (i % 3) * 8 + (hash2(n, i, 401) < 0.5 ? 0 : 1);
    const fy = y + 2 + Math.floor(i / 3) * 8 + (hash2(n, i, 409) < 0.5 ? 0 : 1);
    p.rect(fx, fy, 6, 6, 'paper');
    p.rect(fx + 1, fy + 1, 4, 3, skies[mod(i + n, skies.length)] ?? 'sky');
    // a person or two in each photo
    px(p, fx + 2, fy + 2, 'skin');
    px(p, fx + 2, fy + 3, i % 2 === 0 ? 'denim' : 'red');
    if (hash2(n, i, 419) < 0.6) {
      px(p, fx + 4, fy + 2, 'skin');
      px(p, fx + 4, fy + 3, 'slate');
    }
    px(p, fx + 3, fy, 'red'); // the pin
  }
}

// ---------------------------------------------------------------------------
// The small stage

/**
 * The stage from x0 to x1: a red curtain under a scalloped pelmet, a wooden
 * platform with a dark skirt. With `lights`, two stage lights hang on a bar
 * above the pelmet.
 */
function paintStage(p: Painter, x0: number, x1: number, oy: number, lights: boolean): void {
  const w = x1 - x0;
  const back = oy + PLATFORM.back;
  const lip = oy + PLATFORM.lip;
  const feet = oy + FEET;

  // the curtain: folds, gathered darker at both ends
  p.rect(x0, oy + 2, w, back - oy - 2, 'red');
  for (let x = x0 + 5; x < x1 - 3; x += 5) p.rect(x, oy + 8, 1, back - oy - 8, 'maroon');
  p.rect(x0, oy + 8, 2, back - oy - 8, 'maroon');
  p.rect(x1 - 3, oy + 8, 3, back - oy - 8, 'maroon');
  ditherRect(p, x0, oy + 8, w, 3, 'maroon', 8);
  // the stage light on the curtain where the speaker stands
  const lit = within(p, x0, oy + 8, w, back - oy - 8);
  glowEllipse(lit, x0 + 11, oy + 34, 13, 17, 'honey', [0.22, 0.12]);

  // the pelmet on its brass rod, a gold fringe on each scallop
  p.rect(x0 - 2, oy + 1, w + 4, 1, 'lamp');
  p.rect(x0 - 2, oy + 2, w + 4, 4, 'maroon');
  p.rect(x0 - 2, oy + 2, w + 4, 1, 'red');
  for (let x = x0 - 2; x < x1 + 2; x += 6) {
    p.rect(x, oy + 6, 5, 1, 'maroon');
    p.rect(x + 1, oy + 7, 3, 1, 'maroon');
    p.rect(x + 1, oy + 8, 3, 1, 'honey');
  }
  if (lights) {
    p.rect(x0 + 2, oy - 7, w - 4, 1, 'ink');
    for (const lx of [x0 + 9, x0 + Math.floor(w / 2) + 6]) {
      p.rect(lx, oy - 6, 1, 2, 'ink');
      p.rect(lx - 2, oy - 4, 5, 4, 'night');
      p.rect(lx - 2, oy - 4, 5, 1, 'stone');
      p.rect(lx - 1, oy - 1, 3, 1, 'honey');
      px(p, lx, oy - 1, 'paper');
    }
  }

  // the platform: boards on top, a lit front edge, a pleated skirt
  p.rect(x0, back, w, lip - back, 'amber');
  p.rect(x0, back, w, 1, 'ember');
  p.rect(x0, back + 4, w, 1, 'ember');
  for (let x = x0 + 11; x < x1; x += 17) p.rect(x, back + 1, 1, 3, 'ember');
  for (let x = x0 + 4; x < x1; x += 17) p.rect(x, back + 5, 1, lip - back - 5, 'ember');
  p.rect(x0, lip, w, 1, 'honey');
  p.rect(x0, lip + 1, w, feet - lip - 1, 'night');
  for (let x = x0 + 2; x < x1; x += 4) p.rect(x, lip + 2, 1, feet - lip - 2, 'slate');
  p.rect(x0, lip + 1, 1, feet - lip - 1, 'slate');
  p.rect(x0, feet, w + 1, 1, 'plum');
}

/** The microphone on its stand: the pole at x, its foot on the platform's lip. */
function paintMic(p: Painter, x: number, lip: number): void {
  p.rect(x - 1, lip, 3, 1, 'ink');
  p.rect(x, lip - 14, 1, 14, 'ink');
  p.rect(x - 1, lip - 16, 2, 2, 'fog');
  px(p, x - 1, lip - 16, 'paper');
  px(p, x, lip - 14, 'stone');
}

/** The band's guitar on a stand at the back of the platform. */
function paintGuitar(p: Painter, x: number, lip: number): void {
  const base = lip - 2;
  p.rect(x + 2, base - 19, 1, 10, 'ink');
  p.rect(x + 1, base - 21, 3, 2, 'ember');
  px(p, x + 2, base - 20, 'honey');
  p.rect(x + 1, base - 10, 3, 3, 'amber');
  p.rect(x, base - 7, 5, 5, 'amber');
  p.rect(x + 4, base - 6, 1, 4, 'ember');
  px(p, x + 2, base - 5, 'ink');
  p.rect(x + 1, base - 3, 3, 1, 'honey');
  p.rect(x, base - 2, 5, 1, 'ember');
  // the stand
  p.rect(x + 2, base - 1, 1, 1, 'ink');
  p.rect(x, base, 5, 1, 'ink');
}

/** The band's amplifier beside the guitar. */
function paintAmp(p: Painter, x: number, lip: number): void {
  const top = lip - 13;
  p.rect(x, top, 10, 12, 'night');
  p.rect(x, top, 10, 1, 'stone');
  p.rect(x + 1, top + 3, 8, 8, 'slate');
  for (let gy = top + 4; gy < top + 11; gy += 2) p.rect(x + 2, gy, 6, 1, 'stone');
  px(p, x + 2, top + 1, 'honey');
  px(p, x + 4, top + 1, 'fog');
  px(p, x + 6, top + 1, 'fog');
  px(p, x + 8, top + 1, 'red');
}

/** A loudspeaker on a tripod on the floor past the stage's end. */
function paintSpeaker(p: Painter, x: number, oy: number): void {
  const top = oy + 26;
  const feet = oy + FEET - 2;
  p.rect(x + 3, top + 14, 2, feet - top - 14, 'stone');
  line(p, x + 3, feet - 5, x, feet, 'stone');
  line(p, x + 4, feet - 5, x + 7, feet, 'stone');
  p.rect(x, top, 8, 14, 'ink');
  p.rect(x, top, 8, 1, 'stone');
  p.rect(x + 3, top + 2, 2, 2, 'concrete');
  p.rect(x + 2, top + 6, 4, 6, 'slate');
  p.rect(x + 3, top + 7, 2, 4, 'stone');
  px(p, x + 6, top + 2, 'leaf');
}

// ---------------------------------------------------------------------------
// Tables

/**
 * A round guest table further back in the hall, centred on cx: a white cloth,
 * one of the company's glass lamps lit in the middle, a bowl of snacks, gold
 * chairs. The table at the core's edge has no chair on the right, where you stand.
 */
function paintGuestTable(p: Painter, cx: number, oy: number, n: number, both: boolean): void {
  const top = oy + 50;
  const hem = oy + 59;
  // gold banquet chairs
  for (const s of both ? [-1, 1] : [-1]) {
    const bx = cx + s * 13;
    p.rect(bx - 2, top - 7, 5, 1, 'lamp');
    p.rect(bx - 2, top - 6, 1, 15, 'amber');
    p.rect(bx + 2, top - 6, 1, 15, 'amber');
    p.rect(bx, top - 6, 1, 8, 'amber');
    p.rect(bx - 2, top + 2, 5, 2, 'lamp');
    p.rect(bx - 2, top + 4, 5, 1, 'ember');
  }
  p.rect(cx - 8, hem, 17, 1, 'plum');
  // the cloth
  p.rect(cx - 10, top, 21, 2, 'paper');
  p.rect(cx - 9, top + 2, 19, hem - top - 2, 'paper');
  p.rect(cx - 9, top + 2, 19, 1, 'fog');
  for (let fx = cx - 7; fx <= cx + 7; fx += 4) p.rect(fx, top + 3, 1, hem - top - 3, 'fog');
  p.rect(cx + 8, top + 3, 2, hem - top - 3, 'fog');
  // the glass lamp: a lit shade on a blue-green stem
  p.rect(cx - 1, top - 7, 3, 1, 'honey');
  p.rect(cx - 2, top - 6, 5, 2, 'honey');
  p.rect(cx - 1, top - 6, 2, 1, 'paper');
  p.rect(cx - 2, top - 4, 5, 1, 'lamp');
  p.rect(cx, top - 3, 1, 2, 'cyan');
  p.rect(cx - 1, top - 1, 3, 1, 'teal');
  // a bowl of snacks and a glass or two
  const side = n % 2 === 0 ? 1 : -1;
  p.rect(cx + side * 6 - 1, top - 2, 3, 1, 'amber');
  p.rect(cx + side * 6 - 2, top - 1, 5, 1, 'sky');
  p.rect(cx - side * 6, top - 3, 1, 2, 'fog');
  px(p, cx - side * 6, top - 1, 'concrete');
  if (n % 3 !== 1) {
    p.rect(cx - side * 4, top - 3, 1, 2, 'fog');
    px(p, cx - side * 4, top - 1, 'concrete');
  }
}

/**
 * The buffet table: a white cloth with a gold swag along its pleated skirt;
 * `top` is the tabletop. The dishes are kept low so that pictures can stand
 * in front of them: plates, a platter, a covered warming dish.
 */
function paintBuffet(p: Painter, x: number, top: number, w: number, feet: number): void {
  const hem = feet - 1;
  p.rect(x + 1, hem, w, 1, 'plum');
  // the cloth: the top, then the skirt
  p.rect(x - 1, top, w + 2, 4, 'paper');
  p.rect(x - 1, top + 3, w + 2, 1, 'fog');
  p.rect(x, top + 4, w, hem - top - 4, 'paper');
  for (let fx = x + 3; fx < x + w; fx += 4) p.rect(fx, top + 9, 1, hem - top - 9, 'fog');
  p.rect(x + w - 1, top + 4, 1, hem - top - 4, 'fog');
  // the swag: shallow gold loops with a red rosette where they meet
  for (let sx = x; sx + 9 <= x + w + 1; sx += 9) {
    px(p, sx + 1, top + 5, 'lamp');
    px(p, sx + 2, top + 6, 'lamp');
    p.rect(sx + 3, top + 7, 4, 1, 'lamp');
    px(p, sx + 7, top + 6, 'lamp');
    px(p, sx + 8, top + 5, 'lamp');
    px(p, sx, top + 4, 'red');
    px(p, sx, top + 5, 'red');
  }
  px(p, x + w - 1, top + 4, 'red');
  px(p, x + w - 1, top + 5, 'red');

  // a stack of plates
  p.rect(x + 1, top - 3, 5, 3, 'fog');
  p.rect(x + 1, top - 3, 5, 1, 'paper');
  p.rect(x + 1, top - 1, 5, 1, 'paper');
  // a platter of small bites
  p.rect(x + 11, top - 1, 11, 1, 'fog');
  const bites: readonly PaletteName[] = ['amber', 'leaf', 'red', 'honey', 'amber'];
  bites.forEach((c, i) => px(p, x + 12 + i * 2, top - 2, c));
  // the warming dish: a silver cover on a stand, a small flame under it
  const dx = x + w - 10;
  p.rect(dx + 1, top - 6, 6, 1, 'fog');
  p.rect(dx, top - 5, 8, 2, 'concrete');
  p.rect(dx + 1, top - 5, 3, 1, 'paper');
  px(p, dx + 3, top - 7, 'stone');
  p.rect(dx, top - 3, 8, 1, 'fog');
  px(p, dx, top - 2, 'stone');
  px(p, dx + 7, top - 2, 'stone');
  px(p, dx, top - 1, 'stone');
  px(p, dx + 7, top - 1, 'stone');
  px(p, dx + 3, top - 1, 'lamp');
  px(p, dx + 4, top - 2, 'honey');
  // steam
  px(p, dx + 2, top - 9, 'fog');
  px(p, dx + 3, top - 10, 'fog');
  px(p, dx + 5, top - 9, 'fog');
  px(p, dx + 5, top - 11, 'fog');
}

// ---------------------------------------------------------------------------
// Above the core

/**
 * The hall above `cornice` on a tall stage: a darker upper wall under the
 * ceiling with arched windows onto the night sky and brass chandeliers.
 */
function paintUpperHall(p: Painter, w: number, ox: number, cornice: number): void {
  p.rect(0, 0, w, cornice, 'deep');
  ditherRect(p, 0, 0, w, 3, 'night', 8);
  const wh = Math.min(62, cornice - 22);
  const top = Math.max(10, Math.floor((cornice - wh) / 2) + 2);
  const lampY = Math.max(16, Math.floor(cornice * 0.42));
  const first = Math.floor(-(ox + 20) / HIGH_GAP) - 1;
  for (let k = first; ox + 20 + k * HIGH_GAP - 16 < w; k++) {
    const cx = ox + 20 + k * HIGH_GAP;
    if (wh >= 20) paintArchWindow(p, cx, top, wh, k);
    paintChandelier(p, cx + HIGH_GAP / 2, lampY);
  }
  p.rect(0, cornice, w, 1, 'lamp');
  p.rect(0, cornice + 1, w, 1, 'amber');
  p.rect(0, cornice + 2, w, 1, 'deep');
}

/** How far each row of an arch steps in from the window's side. */
const ARCH = [8, 5, 3, 2, 1, 0] as const;

/** One arched window centred on `cx`: stars, a thin moon in every third. */
function paintArchWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  ARCH.forEach((inset, r) => p.rect(cx - 13 + inset, top + r, 27 - inset * 2, 1, 'concrete'));
  p.rect(cx - 13, top + ARCH.length, 27, wh - ARCH.length, 'concrete');
  ARCH.forEach((inset, r) => p.rect(cx - 12 + inset, top + 1 + r, 25 - inset * 2, 1, 'night'));
  const bodyTop = top + 1 + ARCH.length;
  ditherGradient(p, cx - 12, bodyTop, 25, top + wh - 1 - bodyTop, ['night', 'deep', 'indigo']);
  for (let i = 0; i < 7; i++) {
    const sx = cx - 10 + Math.floor(hash2(i, n, 131) * 21);
    const sy = top + 4 + Math.floor(hash2(i, n, 137) * (wh - 8));
    px(p, sx, sy, hash2(i, n, 139) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 0) {
    p.rect(cx + 5, top + 9, 2, 5, 'paper');
    px(p, cx + 7, top + 9, 'paper');
    px(p, cx + 7, top + 13, 'paper');
  }
  p.rect(cx, top + 1, 1, wh - 2, 'concrete');
  p.rect(cx - 12, bodyTop, 25, 1, 'concrete');
  p.rect(cx - 14, top + wh, 29, 1, 'fog');
  p.rect(cx - 13, top + wh + 1, 27, 1, 'night');
}

/** A brass chandelier on a chain from the ceiling: a ring of candles at `y`, its glow around it. */
function paintChandelier(p: Painter, cx: number, y: number): void {
  glowEllipse(p, cx, y - 1, 24, 15, 'honey', [0.2, 0.12, 0.06]);
  p.rect(cx, 0, 1, y - 7, 'ink');
  p.rect(cx - 1, y - 7, 3, 2, 'amber');
  line(p, cx - 1, y - 5, cx - 8, y - 1, 'amber');
  line(p, cx + 1, y - 5, cx + 8, y - 1, 'amber');
  p.rect(cx - 10, y, 21, 1, 'lamp');
  p.rect(cx - 8, y + 1, 17, 1, 'amber');
  for (const dx of [-10, -5, 0, 5, 10]) {
    p.rect(cx + dx, y - 3, 1, 3, 'paper');
    px(p, cx + dx, y - 4, 'honey');
  }
  p.rect(cx - 1, y + 2, 3, 2, 'amber');
  px(p, cx, y + 4, 'honey');
}

export const COMPANY_EVENT_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...BY_BUFFET, side: 'right' },
    // Alone he stands where Ms. Carter stands; with someone else there he
    // steps aside, towards the stage.
    coworker: { sprite: COWORKER_SPRITE, ...BY_BUFFET, side: 'right', beside: NEAR_STAGE },
    // Mr. Ellis is always up on the platform, at the microphone.
    director: { sprite: DIRECTOR_SPRITE, ...AT_MIC, side: 'right', beside: AT_MIC },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 74, y: 25 } },
  rest: {
    left: { x: BUFFET.x + 1, y: PROP_TOP },
    right: { x: BUFFET.x + 13, y: PROP_TOP },
  },
};
