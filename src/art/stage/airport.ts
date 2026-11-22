import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { AIRLINE_AGENT_SPRITE, COWORKER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_H, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The airport stage: your first business trip, with Dan, on flight 482 to
 * Chicago. Two places.
 *
 * The check-in hall (`paint`): queue posts with red tape and a yellow
 * wayfinding sign on the left (you stand in the lane), a departures board on
 * the wall, then the airline's long counter with the agent behind it, a desk
 * screen over her head and the luggage belt running along the wall behind
 * her, suitcases riding on it.
 *
 * The gate (`backdrops.coworker`): a wall of glass onto the apron at dusk, a
 * parked plane with a red tail right outside, rows of teal seats under the
 * window, a small table in front of them (things rest on it), the yellow GATE
 * sign and, on the right, the gate desk in front of the boarding door.
 *
 * Both have a surface with its top at the same height in the same place (the
 * counter, the table), so bubbles and props share one set of spots. The agent
 * stands behind the counter or the gate desk; Dan stands on the floor beside
 * the table, and in front of the counter when both are on the stage.
 *
 * Like the other stages both fill any size: the 128x64 core sits centred near
 * the bottom; above it the hall gets a ceiling, hanging zone letters and a
 * band of high glass, and the gate's window simply grows taller; to the sides
 * come more desks, the entrance, kiosks, more seats and more planes. Painted
 * through the Painter interface, palette colours only, whole pixels.
 */

/** The y of the counter top, the gate desk top and the table top, in core pixels. */
const SURFACE_TOP = 48;
/** 24x24 pictures stand on that surface with their shadow on it. */
const PROP_TOP = SURFACE_TOP - 20;
/** The left edge of the check-in counter and of the gate's table. */
const SURFACE_X = 42;
/** The table's width: room for two pictures side by side. */
const TABLE_W = 38;
/** Where the floor starts in both places. */
const FLOOR_TOP = 57;
/** The agent, behind the counter (check-in) or the gate desk. */
const AGENT = { x: 96, y: 28 } as const;
/** Dan, on the floor past the end of the table. */
const DAN = { x: 82, y: 39 } as const;
/** Width of one check-in desk, and of one bay beside the core. */
const BAY_W = 44;

// The hall
/** The white trim between the pale upper wall and the cladding behind the desks. */
const TRIM_Y = 26;
/** The luggage belt behind the counter: the y of its back rail. */
const BELT_Y = 36;

// The gate
/** The window sill. */
const SILL_Y = 36;
/** Where the apron starts outside the window. */
const HORIZON_Y = 29;
/** The solid wall with the boarding door: its left edge and width, in core pixels. */
const DOOR_WALL = { x: 96, w: 76 } as const;
/** The gate desk ends this far past the core's right edge. */
const DESK_TAIL = 12;
/** Distance between two parked planes. */
const PLANE_GAP = 170;

/** Colours of the suitcases. */
const CASES: readonly (readonly [PaletteName, PaletteName])[] = [
  ['red', 'maroon'],
  ['lamp', 'amber'],
  ['teal', 'moss'],
  ['denim', 'indigo'],
  ['mauve', 'violet'],
];

/** The airline's red, and its shade: the tail of the plane at your gate. */
const AIRLINE_RED: readonly [PaletteName, PaletteName] = ['red', 'maroon'];
/** Tail colours of the other airlines' planes. */
const TAILS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['teal', 'moss'],
  ['denim', 'indigo'],
];

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

/** Paints a tiny bitmap: every '#' is one pixel. */
function glyph(p: Painter, x: number, y: number, rows: readonly string[], color: PaletteName) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') px(p, x + dx, y + dy, color);
  });
}

/** A plane seen from above, flying right. */
const PLANE_ICON = [
  '...#.....',
  '...##....',
  '#..###...',
  '########.',
  '#..###...',
  '...##....',
  '...#.....',
] as const;
const PLANE_ICON_SMALL = ['..#....', '#.##...', '######.', '#.##...', '..#....'] as const;
const ARROW_ICON = ['..#..', '...#.', '#####', '...#.', '..#..'] as const;
const CASE_ICON = ['.###.', '.#.#.', '#####', '#####', '#####', '#####'] as const;
const GATE_LETTERS: readonly (readonly string[])[] = [
  ['###', '#..', '#.#', '#.#', '###'],
  ['###', '#.#', '###', '#.#', '#.#'],
  ['###', '.#.', '.#.', '.#.', '.#.'],
  ['###', '#..', '##.', '#..', '###'],
];
const ZONE_LETTERS: readonly (readonly string[])[] = [
  ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
];

// ---------------------------------------------------------------------------
// The check-in hall

function paintCheckIn(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const trim = oy + TRIM_Y;

  // A pale upper wall, darker cladding behind the desks, warm pools of light.
  p.rect(0, 0, w, trim, 'fog');
  p.rect(0, trim + 2, w, floorTop - trim - 2, 'concrete');
  for (let x = mod(ox + 20, 22) - 22; x < w; x += 22) {
    ditherRect(p, x, trim + 3, 1, floorTop - trim - 4, 'stone', 8);
  }
  paintHallAbove(p, w, ox, oy);
  for (let x = mod(ox + 22, 64) - 64; x < w + 32; x += 64) {
    glowEllipse(p, x, oy + 18, 28, 20, 'honey', [0.26, 0.15, 0.07]);
  }
  // each desk's own lamp on the cladding behind it
  for (let x = mod(ox + SURFACE_X + 21, BAY_W) - BAY_W; x < w + 22; x += BAY_W) {
    glowEllipse(p, x, trim + 9, 18, 9, 'honey', [0.22, 0.1]);
  }
  p.rect(0, trim, w, 1, 'paper');
  p.rect(0, trim + 1, w, 1, 'stone');
  p.rect(0, floorTop - 1, w, 1, 'stone');
  paintHallFloor(p, w, ox, floorTop, h);

  // To the left: the queue, the entrance with a luggage trolley, check-in kiosks.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i % 3 === 0) paintPoster(p, x + 13, oy + 4);
    else if (i % 3 === 1) {
      paintEntrance(p, x + 3, oy + 5, floorTop);
      paintTrolley(p, x + 11, floorTop);
    } else {
      paintKiosk(p, x + 9, floorTop);
      paintKiosk(p, x + 25, floorTop);
    }
  }

  paintWaySign(p, ox + 3, oy + 5);
  paintBoard(p, ox + SURFACE_X + 4, oy + 4);

  // The desks: the belt along the wall, suitcases on it, a screen over every desk.
  const deskX = ox + SURFACE_X;
  paintBelt(p, deskX + 2, w, oy + BELT_Y);
  for (let k = 1, x = deskX + BAY_W; x - 4 < w; k++, x += BAY_W) {
    paintDeskScreen(p, x + 14, oy + 14, k);
    const [a, aShade] = CASES[k % CASES.length] ?? ['red', 'maroon'];
    // at the agent's desk the first one stops short of where Dan's head can be
    if (k === 1) paintSuitcase(p, x - 8, oy + BELT_Y + 3, 7, 8, a, aShade);
    else paintSuitcase(p, x - 2, oy + BELT_Y + 3, 9, 8 + (k % 2), a, aShade);
    if (k === 1 || hash2(k, 5, 61) > 0.35) {
      const [b, bShade] = CASES[(k + 2) % CASES.length] ?? ['teal', 'moss'];
      paintSuitcase(p, x + 28, oy + BELT_Y + 3, 8, 7 + ((k + 1) % 3), b, bShade);
    }
  }
  paintCounter(p, deskX, w, oy + SURFACE_TOP, oy + CORE_H, false);
  for (let k = 0, x = deskX; x < w; k++, x += BAY_W) {
    if (k > 0) p.rect(x, oy + SURFACE_TOP + 3, 1, CORE_H - SURFACE_TOP - 6, 'deep');
    paintRoundel(p, x + 17, oy + SURFACE_TOP + 4);
  }

  // The queue lane you stand in, a cabin-bag sizer beside it.
  paintSizer(p, ox + 8, floorTop);
  const tapeY = floorTop - 10;
  p.rect(ox - 31, tapeY, 69, 1, 'red');
  p.rect(ox - 31, tapeY + 1, 69, 1, 'maroon');
  for (const x of [ox - 31, ox + 3, ox + 37]) paintPost(p, x, floorTop);
}

/** Above the core of the hall: the ceiling lights, a band of high glass, the zone letters. */
function paintHallAbove(p: Painter, w: number, ox: number, oy: number): void {
  if (oy < 8) {
    ditherRect(p, 0, 0, w, 2, 'concrete', 8);
    return;
  }
  const glassTop = 9;
  const glassBottom = oy - 26;
  if (glassBottom - glassTop >= 12) paintHighGlass(p, w, ox, glassTop, glassBottom);
  p.rect(0, 0, w, 4, 'stone');
  p.rect(0, 4, w, 1, 'slate');
  for (let x = mod(ox + 14, 32) - 32; x < w; x += 32) {
    p.rect(x, 2, 14, 2, 'honey');
    p.rect(x + 1, 3, 12, 1, 'paper');
  }
  if (oy < 24) return;
  // a lit letter over every second desk, hung from the ceiling
  for (let k = Math.floor(-(ox + 80) / 88) - 1; ox + 80 + k * 88 < w; k++) {
    const x = ox + 80 + k * 88;
    const y = oy - 19;
    p.rect(x + 2, 5, 1, y - 5, 'slate');
    p.rect(x + 10, 5, 1, y - 5, 'slate');
    p.rect(x, y, 13, 11, 'ink');
    p.rect(x + 1, y + 1, 11, 9, 'lamp');
    glyph(p, x + 4, y + 2, ZONE_LETTERS[mod(k + 1, ZONE_LETTERS.length)] ?? [], 'ink');
  }
}

/** The high glass of the hall from y0 to y1: the evening sky, a plane climbing away. */
function paintHighGlass(p: Painter, w: number, ox: number, y0: number, y1: number): void {
  const tall = y1 - y0;
  const colours: readonly PaletteName[] =
    tall < 40
      ? ['indigo', 'dusk', 'violet', 'mauve']
      : ['deep', 'deep', 'indigo', 'indigo', 'dusk', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, 0, y0, w, tall, colours);
  if (tall >= 40) {
    for (let i = 0; i < Math.floor(w / 7); i++) {
      const sx = Math.floor(hash2(i, 1, 301) * w);
      const sy = y0 + 1 + Math.floor(hash2(i, 2, 301) * tall * 0.45);
      px(p, sx, sy, hash2(i, 3, 301) > 0.7 ? 'paper' : 'fog');
    }
    for (let x = mod(ox + 30, 96) - 96; x < w; x += 96) {
      const k = Math.floor((x - ox) / 96);
      paintCloud(p, x, y1 - 24 - Math.floor(hash2(k, 4, 307) * 16), 30);
    }
  }
  // a plane climbing away, its lights on
  const ax = ox + 96;
  const ay = y1 - Math.min(16, Math.floor(tall / 2) + 2);
  p.rect(ax, ay + 3, 3, 1, 'night');
  p.rect(ax + 2, ay + 2, 4, 1, 'night');
  p.rect(ax + 5, ay + 1, 3, 1, 'night');
  px(p, ax, ay + 2, 'night');
  p.rect(ax + 2, ay + 3, 3, 1, 'night');
  px(p, ax + 8, ay + 1, 'paper');
  px(p, ax + 3, ay + 4, 'red');
  // the frame
  for (let x = mod(ox + 20, 26) - 26; x < w; x += 26) p.rect(x, y0, 1, tall, 'slate');
  for (let y = y1 - 28; y > y0 + 6; y -= 28) p.rect(0, y, w, 1, 'slate');
  p.rect(0, y0 - 1, w, 1, 'stone');
  p.rect(0, y1, w, 1, 'paper');
  p.rect(0, y1 + 1, w, 1, 'stone');
}

/** A long evening cloud, lit from below. */
function paintCloud(p: Painter, x: number, y: number, len: number): void {
  p.rect(x + 6, y, len - 14, 1, 'violet');
  p.rect(x + 2, y + 1, len - 4, 1, 'violet');
  p.rect(x, y + 2, len, 1, 'violet');
  p.rect(x + 4, y + 3, len - 10, 1, 'mauve');
}

/** Pale polished tiles, the ceiling lights shining in them. */
function paintHallFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'fog');
  for (let row = 0; floorTop + 3 + row * 4 < h; row++) {
    const y = floorTop + 3 + row * 4;
    p.rect(0, y, w, 1, 'concrete');
    for (let x = mod(ox + 5 + row * 3, 18) - 18; x < w; x += 18) p.rect(x, y - 3, 1, 3, 'concrete');
  }
  // the ceiling lights, mirrored in the polish
  for (let x = mod(ox + 18, 64) - 64; x < w; x += 64) {
    for (let r = 0; r < 4 && floorTop + 1 + r * 4 < h; r++) {
      p.rect(x + r, floorTop + 1 + r * 4, 9 - r * 2, 2, 'paper');
    }
  }
  p.rect(0, floorTop, w, 1, 'stone');
}

/** One queue post, its foot on the floor line. */
function paintPost(p: Painter, x: number, floorTop: number): void {
  p.rect(x, floorTop - 11, 2, 12, 'slate');
  p.rect(x, floorTop - 11, 1, 10, 'stone');
  p.rect(x - 1, floorTop - 12, 4, 1, 'night');
  p.rect(x - 1, floorTop + 1, 4, 1, 'slate');
  p.rect(x - 2, floorTop + 2, 6, 1, 'stone');
}

/** A cabin-bag sizer: a steel frame under a yellow plate. */
function paintSizer(p: Painter, x: number, floorTop: number): void {
  p.rect(x, floorTop - 13, 1, 13, 'slate');
  p.rect(x + 9, floorTop - 13, 1, 13, 'slate');
  p.rect(x, floorTop - 7, 10, 1, 'slate');
  p.rect(x, floorTop - 1, 10, 1, 'slate');
  p.rect(x - 1, floorTop - 22, 12, 9, 'ink');
  p.rect(x, floorTop - 21, 10, 7, 'lamp');
  glyph(p, x + 3, floorTop - 20, CASE_ICON, 'ink');
}

/** The yellow wayfinding sign: departures, this way, bag drop. */
function paintWaySign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 32, 11, 'ink');
  p.rect(x + 1, y + 1, 30, 9, 'lamp');
  p.rect(x + 1, y + 1, 30, 1, 'honey');
  glyph(p, x + 3, y + 2, PLANE_ICON, 'ink');
  glyph(p, x + 14, y + 3, ARROW_ICON, 'ink');
  p.rect(x + 21, y + 2, 1, 7, 'amber');
  glyph(p, x + 24, y + 3, CASE_ICON, 'ink');
  p.rect(x + 1, y + 11, 31, 1, 'concrete');
}

/** The departures board: a time, a place, a gate and a light on every row; one flight is late. */
function paintBoard(p: Painter, x: number, y: number): void {
  const w = 48;
  p.rect(x, y, w, 20, 'ink');
  p.rect(x + 1, y + 1, w - 2, 18, 'night');
  glyph(p, x + 3, y + 2, PLANE_ICON_SMALL, 'paper');
  p.rect(x + 12, y + 3, 12, 1, 'paper');
  p.rect(x + 12, y + 5, 7, 1, 'fog');
  p.rect(x + 37, y + 3, 8, 3, 'slate');
  p.rect(x + 38, y + 4, 2, 1, 'honey');
  p.rect(x + 41, y + 4, 3, 1, 'honey');
  p.rect(x + 1, y + 7, w - 2, 1, 'slate');
  for (let r = 0; r < 4; r++) {
    const ry = y + 9 + r * 3;
    const late = r === 1;
    p.rect(x + 3, ry, 2, 1, 'paper');
    p.rect(x + 6, ry, 2, 1, 'paper');
    p.rect(x + 11, ry, 7 + Math.floor(hash2(r, 3, 211) * 9), 1, 'honey');
    p.rect(x + 30, ry, 3, 1, 'cyan');
    p.rect(x + 36, ry, late ? 9 : 6, 1, late ? 'red' : 'leaf');
  }
  p.rect(x + 1, y + 20, w, 1, 'concrete');
}

/** The screen over one desk, in the airline's colours. */
function paintDeskScreen(p: Painter, x: number, y: number, k: number): void {
  p.rect(x + 6, y - 3, 2, 3, 'stone');
  p.rect(x, y, 14, 8, 'ink');
  p.rect(x + 1, y + 1, 12, 6, 'indigo');
  p.rect(x + 1, y + 6, 12, 1, 'red');
  p.rect(x + 2, y + 3, 5, 1, 'honey');
  px(p, x + 4, y + 2, 'honey');
  px(p, x + 4, y + 4, 'honey');
  px(p, x + 2, y + 2, 'honey');
  p.rect(x + 8, y + 2, 4, 1, 'paper');
  p.rect(x + 8, y + 4, 2 + (k % 2), 1, 'fog');
}

/** The luggage belt along the wall from x0 to x1: `y` is its back rail. */
function paintBelt(p: Painter, x0: number, x1: number, y: number): void {
  const w = x1 - x0;
  p.rect(x0, y, w, 1, 'fog');
  p.rect(x0, y + 1, w, 3, 'night');
  for (let x = x0 + 2; x < x1; x += 4) px(p, x, y + 2, 'slate');
  p.rect(x0, y + 4, w, 1, 'fog');
  p.rect(x0, y + 5, w, SURFACE_TOP - BELT_Y - 5, 'stone');
  p.rect(x0, y + 10, w, 2, 'slate');
  for (let x = x0 + 21; x < x1; x += 22) p.rect(x, y + 5, 1, 5, 'slate');
  // the end of the belt, with its stop button
  p.rect(x0 - 2, y - 1, 2, SURFACE_TOP - BELT_Y + 1, 'slate');
  px(p, x0 - 2, y + 6, 'red');
}

/** A suitcase standing with its bottom at `base`. */
function paintSuitcase(
  p: Painter,
  x: number,
  base: number,
  w: number,
  h: number,
  color: PaletteName,
  shade: PaletteName,
): void {
  const y = base - h;
  p.rect(x + 2, y - 2, w - 4, 1, 'ink');
  px(p, x + 2, y - 1, 'ink');
  px(p, x + w - 3, y - 1, 'ink');
  p.rect(x, y, w, h, color);
  p.rect(x + w - 2, y, 2, h, shade);
  p.rect(x, base - 1, w, 1, shade);
  p.rect(x + 2, y + 1, 1, h - 2, shade);
  p.rect(x + 1, y + 1, 1, 2, 'paper');
}

/** The airline's counter from x0 to x1: a pale top, a navy front with a red and gold stripe. */
function paintCounter(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top, w, 2, 'paper');
  p.rect(x0, top + 2, w, 1, 'fog');
  p.rect(x0, top + 3, w, bottom - top - 3, 'indigo');
  p.rect(x0, top + 3, w, 1, 'deep');
  p.rect(x0, top + 9, w, 2, 'red');
  p.rect(x0, top + 11, w, 1, 'honey');
  p.rect(x0, bottom - 3, w, 3, 'night');
  p.rect(x0, top + 3, 1, bottom - top - 3, 'deep');
  if (endsInView) p.rect(x1 - 1, top + 3, 1, bottom - top - 3, 'deep');
  p.rect(x0, bottom, w, 1, 'slate'); // its shadow on a deeper floor
}

/** The airline's mark: a white disc with a red wing. */
function paintRoundel(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y, 3, 5, 'paper');
  p.rect(x, y + 1, 5, 3, 'paper');
  px(p, x + 1, y + 3, 'red');
  px(p, x + 2, y + 2, 'red');
  px(p, x + 3, y + 1, 'red');
  px(p, x + 3, y + 2, 'red');
}

/** A self check-in kiosk standing on the floor line. */
function paintKiosk(p: Painter, x: number, floorTop: number): void {
  const top = floorTop - 23;
  p.rect(x, top, 10, 23, 'paper');
  p.rect(x + 9, top, 1, 23, 'fog');
  p.rect(x, top, 10, 2, 'indigo');
  p.rect(x + 1, top + 3, 8, 8, 'ink');
  p.rect(x + 2, top + 4, 6, 6, 'teal');
  p.rect(x + 3, top + 5, 4, 1, 'cyan');
  p.rect(x + 3, top + 7, 2, 1, 'cyan');
  p.rect(x + 2, top + 13, 6, 1, 'ink');
  p.rect(x + 3, top + 14, 4, 2, 'paper');
  px(p, x + 7, top + 16, 'lamp');
  p.rect(x + 1, top + 19, 8, 1, 'fog');
  p.rect(x - 1, floorTop - 1, 12, 1, 'slate');
}

/** The glass entrance: the evening outside, a kerb, far lights. */
function paintEntrance(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 38;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'slate');
  const glass = within(p, x + 1, top + 1, w - 2, h - 1);
  ditherGradient(glass, x + 1, top + 1, w - 2, h - 8, [
    'deep',
    'indigo',
    'dusk',
    'violet',
    'mauve',
  ]);
  glass.rect(x + 1, floorTop - 8, w - 2, 8, 'night');
  glass.rect(x + 1, floorTop - 8, w - 2, 1, 'slate');
  for (let i = 0; i < 7; i++) {
    const lx = x + 2 + Math.floor(hash2(x, i, 71) * (w - 4));
    const ly = floorTop - 16 + Math.floor(hash2(x, i, 73) * 8);
    px(glass, lx, ly, hash2(x, i, 79) > 0.5 ? 'honey' : 'lamp');
  }
  // a taxi waiting at the kerb
  glass.rect(x + 22, floorTop - 12, 11, 4, 'lamp');
  glass.rect(x + 24, floorTop - 14, 6, 2, 'lamp');
  glass.rect(x + 25, floorTop - 13, 4, 1, 'ink');
  px(glass, x + 24, floorTop - 8, 'ink');
  px(glass, x + 30, floorTop - 8, 'ink');
  px(glass, x + 22, floorTop - 11, 'paper');
  // the sliding doors
  p.rect(x + 18, top + 1, 2, h - 1, 'slate');
  p.rect(x + 9, top + 1, 1, h - 1, 'slate');
  p.rect(x + 28, top + 1, 1, h - 1, 'slate');
  p.rect(x + 1, top + 8, w - 2, 1, 'slate');
  p.rect(x + 16, floorTop - 16, 1, 6, 'fog');
  p.rect(x + 21, floorTop - 16, 1, 6, 'fog');
  p.rect(x + 13, top + 3, 12, 3, 'leaf');
  p.rect(x + 15, top + 4, 8, 1, 'paper');
  p.rect(x + 4, floorTop + 1, w - 8, 2, 'concrete');
}

/** A luggage trolley loaded with suitcases. */
function paintTrolley(p: Painter, x: number, floorTop: number): void {
  p.rect(x, floorTop - 15, 1, 13, 'slate');
  p.rect(x - 1, floorTop - 16, 3, 1, 'ink');
  p.rect(x, floorTop - 3, 20, 1, 'slate');
  p.rect(x + 19, floorTop - 6, 1, 3, 'slate');
  p.rect(x + 2, floorTop - 2, 2, 2, 'ink');
  p.rect(x + 15, floorTop - 2, 2, 2, 'ink');
  p.rect(x + 2, floorTop - 10, 13, 7, 'denim');
  p.rect(x + 13, floorTop - 10, 2, 7, 'indigo');
  p.rect(x + 2, floorTop - 7, 11, 1, 'indigo');
  px(p, x + 3, floorTop - 9, 'paper');
  p.rect(x + 3, floorTop - 15, 10, 5, 'red');
  p.rect(x + 11, floorTop - 15, 2, 5, 'maroon');
  p.rect(x + 6, floorTop - 16, 4, 1, 'ink');
  p.rect(x + 15, floorTop - 8, 4, 5, 'lamp');
  p.rect(x + 18, floorTop - 8, 1, 5, 'amber');
}

/** A travel poster: the sun going down over the sea. */
function paintPoster(p: Painter, x: number, y: number): void {
  p.rect(x, y, 18, 20, 'paper');
  ditherGradient(p, x + 1, y + 1, 16, 11, ['violet', 'rosy', 'honey']);
  p.rect(x + 7, y + 8, 4, 4, 'lamp');
  p.rect(x + 6, y + 9, 6, 3, 'lamp');
  p.rect(x + 1, y + 12, 16, 4, 'teal');
  p.rect(x + 6, y + 13, 6, 1, 'honey');
  p.rect(x + 8, y + 15, 3, 1, 'cyan');
  p.rect(x + 3, y + 17, 9, 1, 'ink');
  p.rect(x + 13, y + 17, 2, 1, 'red');
  p.rect(x + 1, y + 20, 18, 1, 'concrete');
}

// ---------------------------------------------------------------------------
// The gate

function paintGate(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const sill = oy + SILL_Y;
  // The ceiling takes more of a taller stage; the glass takes all the rest.
  const band = oy < 8 ? 3 : Math.min(26, 6 + Math.floor(oy / 5));

  paintApron(within(p, 0, band, w, sill - band), w, ox, oy, band);
  for (let x = mod(ox + 30, 32) - 32; x < w; x += 32) {
    p.rect(x, band, 2, sill - band, 'slate');
  }
  for (let y = oy - 22; y > band + 8; y -= 26) p.rect(0, y, w, 1, 'slate');
  paintGateCeiling(p, w, ox, band);

  // The sill and the wall under the glass.
  p.rect(0, sill, w, 1, 'fog');
  p.rect(0, sill + 1, w, 1, 'stone');
  p.rect(0, sill + 2, w, floorTop - sill - 2, 'slate');
  for (let x = mod(ox + 30, 32) - 32; x < w; x += 32) {
    p.rect(x, sill + 2, 2, floorTop - sill - 3, 'night');
  }
  p.rect(0, floorTop - 1, w, 1, 'night');
  paintCarpet(p, w, ox, floorTop, h);

  // Rows of seats under the window; now and then a plant and bins instead.
  for (let k = Math.floor(-(ox + 1) / BAY_W) - 1; ox + 1 + k * BAY_W < w; k++) {
    const x = ox + 1 + k * BAY_W;
    if (k < 0 && mod(k, 3) === 1) {
      paintPlant(p, x + 4, floorTop - 20);
      paintBin(p, x + 18, floorTop, 'leaf');
      paintBin(p, x + 27, floorTop, 'denim');
    } else if (x + 36 <= ox + DOOR_WALL.x || x >= ox + DOOR_WALL.x + DOOR_WALL.w) {
      paintSeats(p, x, oy);
    }
  }

  paintDoorWall(p, ox, oy, band, floorTop);
  paintGateSign(p, ox + 83, oy + 4, oy < 44 ? band : -1);
  if (oy >= 34) {
    for (let x = mod(ox + 4, 132) - 132; x < w; x += 132) {
      if (x + 32 <= ox + DOOR_WALL.x || x >= ox + DOOR_WALL.x + DOOR_WALL.w) {
        p.rect(x + 4, band, 1, oy - 20 - band, 'ink');
        p.rect(x + 27, band, 1, oy - 20 - band, 'ink');
        paintWaySign(p, x, oy - 20);
      }
    }
  }

  paintTable(p, ox + SURFACE_X, oy + SURFACE_TOP);
  const deskEnd = Math.min(w, ox + CORE_W + DESK_TAIL);
  paintCounter(p, ox + 98, deskEnd, oy + SURFACE_TOP, oy + CORE_H, deskEnd < w);
  paintRoundel(p, ox + 121, oy + SURFACE_TOP + 4);
  // the boarding-pass reader on the desk
  p.rect(ox + 113, oy + SURFACE_TOP - 5, 3, 5, 'slate');
  p.rect(ox + 112, oy + SURFACE_TOP - 6, 5, 2, 'stone');
  px(p, ox + 113, oy + SURFACE_TOP - 6, 'cyan');
}

/** The ceiling of the gate: dark panels with small warm lights. */
function paintGateCeiling(p: Painter, w: number, ox: number, band: number): void {
  p.rect(0, 0, w, band, 'slate');
  if (band >= 8) {
    for (let x = mod(ox + 30, 32) - 32; x < w; x += 32) p.rect(x, 0, 1, band - 1, 'night');
    p.rect(0, Math.floor(band / 2) - 1, w, 1, 'night');
  }
  p.rect(0, band - 1, w, 1, 'night');
  const ly = band >= 8 ? band - 3 : 1;
  for (let x = mod(ox + 12, 32) - 32; x < w; x += 32) {
    p.rect(x, ly, 7, 1, 'honey');
    p.rect(x + 2, ly, 3, 1, 'paper');
  }
}

/** What the window shows, from `top` down to the sill: the sky, far buildings, the apron, planes. */
function paintApron(p: Painter, w: number, ox: number, oy: number, top: number): void {
  const horizon = oy + HORIZON_Y;
  const sky = horizon - top;
  const colours: readonly PaletteName[] =
    sky < 34
      ? ['indigo', 'dusk', 'violet', 'mauve', 'rosy']
      : sky < 80
        ? ['deep', 'indigo', 'dusk', 'violet', 'mauve', 'rosy']
        : ['deep', 'deep', 'deep', 'indigo', 'indigo', 'dusk', 'violet', 'mauve', 'rosy'];
  ditherGradient(p, 0, top, w, sky, colours);
  if (sky >= 60) {
    for (let i = 0; i < Math.floor(w / 6); i++) {
      const sx = Math.floor(hash2(i, 1, 401) * w);
      const sy = top + 1 + Math.floor(hash2(i, 2, 401) * sky * 0.4);
      px(p, sx, sy, hash2(i, 3, 401) > 0.7 ? 'paper' : 'fog');
    }
  }
  if (sky >= 44) {
    // the storm they are waiting out, far off
    for (let x = mod(ox + 50, 84) - 84; x < w; x += 84) {
      const k = Math.floor((x - ox) / 84);
      paintCloud(p, x, horizon - 30 - Math.floor(hash2(k, 4, 419) * 12), 26 + mod(k, 3) * 6);
    }
  }

  // far hangars, a few windows lit, and the control tower
  for (let x = mod(ox, 8) - 8; x < w; x += 8) {
    const k = Math.floor((x - ox) / 8);
    const tall = 1 + Math.floor(hash2(k, 7, 409) * 4);
    p.rect(x, horizon - tall, 8, tall, 'night');
    if (tall >= 3 && hash2(k, 9, 409) < 0.6) px(p, x + 2 + mod(k, 3) * 2, horizon - 2, 'honey');
  }
  for (let x = mod(ox - 46, PLANE_GAP) - PLANE_GAP; x < w; x += PLANE_GAP) {
    p.rect(x + 3, horizon - 21, 3, 21, 'night');
    p.rect(x, horizon - 26, 9, 5, 'night');
    p.rect(x + 1, horizon - 25, 7, 2, 'honey');
    p.rect(x + 4, horizon - 29, 1, 3, 'night');
    px(p, x + 4, horizon - 30, 'red');
  }

  // the apron: taxi line, blue edge lights
  p.rect(0, horizon, w, SILL_Y - HORIZON_Y, 'slate');
  p.rect(0, horizon, w, 1, 'night');
  for (let x = mod(ox + 4, 12) - 12; x < w; x += 12) p.rect(x, horizon + 5, 6, 1, 'lamp');
  for (let x = mod(ox + 9, 24) - 24; x < w; x += 24) px(p, x, horizon + 2, 'cyan');

  for (let x = mod(ox - 72, PLANE_GAP) - PLANE_GAP; x < w; x += PLANE_GAP) {
    paintCarts(p, x, horizon + 4);
  }
  for (let x = mod(ox + 10, PLANE_GAP) - PLANE_GAP; x < w; x += PLANE_GAP) {
    // the one at your gate wears the airline's red; its neighbours belong to others
    const k = Math.round((x - ox - 10) / PLANE_GAP);
    const other = TAILS[mod(k > 0 ? k : 1 - k, TAILS.length)];
    const [fin, shade] = (k === 0 ? undefined : other) ?? AIRLINE_RED;
    paintPlane(p, x, horizon - 18, fin, shade);
  }
}

/** A parked airliner, nose to the right: 79 wide, its wheels 21 below `y`. */
function paintPlane(p: Painter, x: number, y: number, fin: PaletteName, shade: PaletteName): void {
  // the tail fin, in the airline's colour
  for (let r = 0; r < 10; r++) {
    const fx = x + 1 + Math.floor(r / 2);
    p.rect(fx, y + 1 + r, 5 + Math.floor(r * 0.6), 1, fin);
    px(p, fx, y + 1 + r, shade);
  }
  p.rect(x + 5, y + 5, 2, 2, 'honey');
  // the body, lit from the terminal
  p.rect(x + 6, y + 11, 65, 4, 'paper');
  p.rect(x + 6, y + 15, 65, 2, 'fog');
  p.rect(x + 9, y + 17, 59, 1, 'concrete');
  p.rect(x + 3, y + 11, 3, 4, 'paper');
  p.rect(x + 3, y + 15, 3, 1, 'fog');
  p.rect(x + 1, y + 11, 2, 2, 'paper');
  p.rect(x + 1, y + 13, 2, 1, 'fog');
  px(p, x, y + 11, 'fog');
  // the nose and the cockpit windows
  p.rect(x + 71, y + 11, 3, 1, 'paper');
  p.rect(x + 71, y + 12, 5, 3, 'paper');
  p.rect(x + 71, y + 15, 5, 1, 'fog');
  p.rect(x + 71, y + 16, 3, 1, 'fog');
  p.rect(x + 76, y + 13, 2, 2, 'paper');
  px(p, x + 76, y + 15, 'fog');
  px(p, x + 78, y + 14, 'fog');
  p.rect(x + 73, y + 12, 3, 1, 'ink');
  px(p, x + 76, y + 13, 'ink');
  // the stripe, the windows, the door
  p.rect(x + 3, y + 15, 70, 1, fin);
  for (let wx = x + 15; wx < x + 66; wx += 3) px(p, wx, y + 13, 'slate');
  p.rect(x + 68, y + 12, 1, 3, 'concrete');
  p.rect(x - 2, y + 12, 9, 1, 'concrete');
  // the wing and the engine under it
  p.rect(x + 30, y + 15, 16, 1, 'concrete');
  p.rect(x + 27, y + 16, 16, 1, 'concrete');
  p.rect(x + 24, y + 17, 12, 1, 'stone');
  p.rect(x + 36, y + 17, 8, 3, 'fog');
  p.rect(x + 36, y + 19, 8, 1, 'concrete');
  p.rect(x + 43, y + 17, 1, 3, 'night');
  // the wheels
  p.rect(x + 66, y + 17, 1, 3, 'ink');
  p.rect(x + 65, y + 19, 3, 2, 'ink');
  p.rect(x + 32, y + 18, 1, 2, 'ink');
  p.rect(x + 30, y + 19, 5, 2, 'ink');
  px(p, x + 40, y + 10, 'red');
}

/** A tug pulling three baggage carts, wheels at `base`. */
function paintCarts(p: Painter, x: number, base: number): void {
  p.rect(x + 34, base - 4, 7, 3, 'lamp');
  p.rect(x + 35, base - 6, 3, 2, 'lamp');
  px(p, x + 40, base - 4, 'paper');
  px(p, x + 35, base - 1, 'ink');
  px(p, x + 39, base - 1, 'ink');
  for (let i = 0; i < 3; i++) {
    const cx = x + i * 11;
    const [a] = CASES[i % CASES.length] ?? ['red'];
    const [b] = CASES[(i + 2) % CASES.length] ?? ['teal'];
    p.rect(cx, base - 3, 9, 2, 'stone');
    p.rect(cx + 9, base - 2, 2, 1, 'night');
    p.rect(cx + 1, base - 6, 3, 3, a);
    p.rect(cx + 5, base - 5, 3, 2, b);
    px(p, cx + 1, base - 1, 'ink');
    px(p, cx + 7, base - 1, 'ink');
  }
}

/** A dark patterned carpet. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'plum');
  for (let row = 0; floorTop + 2 + row * 3 < h; row++) {
    const y = floorTop + 2 + row * 3;
    for (let x = mod(ox + row * 5, 10) - 10; x < w; x += 10) {
      p.rect(x, y, 2, 1, 'maroon');
      px(p, x + 5, y + 1, 'night');
    }
  }
  p.rect(0, floorTop, w, 1, 'night');
}

/** Four linked seats against the wall: backs, cushions, a steel beam on two legs. */
function paintSeats(p: Painter, x: number, oy: number): void {
  const back = oy + 41;
  for (let i = 0; i < 4; i++) {
    const sx = x + i * 9;
    p.rect(sx, back, 8, 8, 'teal');
    p.rect(sx + 1, back, 6, 1, 'cyan');
    p.rect(sx + 7, back + 1, 1, 7, 'moss');
    p.rect(sx, back + 7, 8, 1, 'moss');
    p.rect(sx, back + 9, 8, 2, 'teal');
    p.rect(sx, back + 11, 8, 1, 'moss');
    if (i > 0) p.rect(sx - 1, back + 6, 1, 4, 'stone');
  }
  p.rect(x, back + 12, 35, 1, 'stone');
  p.rect(x + 3, back + 13, 1, 3, 'stone');
  p.rect(x + 31, back + 13, 1, 3, 'stone');
}

/** A bin with a coloured lid, standing on the floor line. */
function paintBin(p: Painter, x: number, floorTop: number, lid: PaletteName): void {
  p.rect(x, floorTop - 11, 7, 11, 'stone');
  p.rect(x + 6, floorTop - 11, 1, 11, 'night');
  p.rect(x, floorTop - 12, 7, 2, lid);
  p.rect(x + 2, floorTop - 8, 3, 1, 'ink');
}

/** The small table in front of the seats: a pale top on one steel leg. */
function paintTable(p: Painter, x: number, top: number): void {
  p.rect(x, top, TABLE_W, 2, 'paper');
  p.rect(x, top + 2, TABLE_W, 1, 'fog');
  p.rect(x + 1, top + 3, TABLE_W - 2, 1, 'night');
  p.rect(x + 17, top + 3, 4, 10, 'stone');
  p.rect(x + 17, top + 3, 1, 10, 'fog');
  p.rect(x + 11, top + 13, 16, 2, 'stone');
  p.rect(x + 11, top + 14, 16, 1, 'night');
}

/** The solid wall right of the glass: a flight screen, the boarding door, a drinks machine. */
function paintDoorWall(p: Painter, ox: number, oy: number, band: number, floorTop: number): void {
  const x = ox + DOOR_WALL.x;
  const w = DOOR_WALL.w;
  const top = oy >= 44 ? oy - 22 : band;
  p.rect(x, top, w, floorTop - top, 'concrete');
  p.rect(x, top, 1, floorTop - top, 'stone');
  p.rect(x + w - 1, top, 1, floorTop - top, 'stone');
  if (top > band) {
    p.rect(x - 1, top - 2, w + 2, 2, 'fog');
    p.rect(x, top, w, 1, 'stone');
    paintClock(p, x + 56, oy - 9);
  }
  glowEllipse(p, x + 12, oy + 28, 14, 16, 'honey', [0.22, 0.1]);
  p.rect(x + 1, floorTop - 2, w - 2, 2, 'stone');

  // the flight screen: three rows, the middle one late
  p.rect(x + 3, oy + 15, 12, 9, 'ink');
  p.rect(x + 4, oy + 16, 10, 7, 'night');
  p.rect(x + 5, oy + 17, 5, 1, 'honey');
  p.rect(x + 11, oy + 17, 2, 1, 'leaf');
  p.rect(x + 5, oy + 19, 4, 1, 'honey');
  p.rect(x + 10, oy + 19, 3, 1, 'red');
  p.rect(x + 5, oy + 21, 6, 1, 'fog');

  // the boarding door, a green light over it
  const dx = x + 17;
  p.rect(dx, oy + 21, 15, floorTop - oy - 21, 'stone');
  p.rect(dx + 4, oy + 22, 7, 2, 'leaf');
  p.rect(dx + 1, oy + 25, 6, floorTop - oy - 25, 'slate');
  p.rect(dx + 8, oy + 25, 6, floorTop - oy - 25, 'slate');
  for (const wx of [dx + 2, dx + 9]) {
    p.rect(wx, oy + 28, 4, 8, 'night');
    p.rect(wx, oy + 32, 4, 4, 'dusk');
    px(p, wx + 1, oy + 33, 'lamp');
  }
  p.rect(dx + 6, oy + 39, 1, 4, 'fog');
  p.rect(dx + 8, oy + 39, 1, 4, 'fog');

  // past the door: a lit drinks machine, a lamp poster, a clock
  const vx = x + 48;
  p.rect(vx, oy + 27, 16, 30, 'teal');
  p.rect(vx + 15, oy + 27, 1, 30, 'moss');
  p.rect(vx + 1, oy + 29, 10, 17, 'cyan');
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 3; i++) {
      const [c] = CASES[(row + i * 2) % CASES.length] ?? ['red'];
      p.rect(vx + 2 + i * 3, oy + 30 + row * 5, 2, 4, c);
    }
    p.rect(vx + 1, oy + 34 + row * 5, 10, 1, 'teal');
  }
  p.rect(vx + 12, oy + 30, 3, 6, 'ink');
  px(p, vx + 13, oy + 31, 'honey');
  px(p, vx + 13, oy + 34, 'red');
  p.rect(vx + 2, oy + 49, 9, 4, 'ink');
  paintLampPoster(p, x + 34, oy + 19);
}

/** A poster of a glass desk lamp, lit. */
function paintLampPoster(p: Painter, x: number, y: number): void {
  p.rect(x, y, 12, 17, 'paper');
  p.rect(x + 1, y + 1, 10, 15, 'deep');
  p.rect(x + 4, y + 3, 4, 1, 'honey');
  p.rect(x + 3, y + 4, 6, 3, 'honey');
  p.rect(x + 4, y + 5, 2, 1, 'paper');
  p.rect(x + 2, y + 7, 8, 1, 'lamp');
  p.rect(x + 5, y + 8, 2, 4, 'amber');
  p.rect(x + 3, y + 12, 6, 1, 'amber');
  p.rect(x + 3, y + 14, 6, 1, 'fog');
}

/** The yellow GATE sign. Hung from `ceiling` on two rods, or fixed to the wall when it is -1. */
function paintGateSign(p: Painter, x: number, y: number, ceiling: number): void {
  if (ceiling >= 0) {
    p.rect(x + 4, ceiling, 1, y - ceiling, 'ink');
    p.rect(x + 24, ceiling, 1, y - ceiling, 'ink');
  }
  p.rect(x, y, 29, 9, 'ink');
  p.rect(x + 1, y + 1, 27, 7, 'lamp');
  p.rect(x + 1, y + 1, 27, 1, 'honey');
  GATE_LETTERS.forEach((letter, i) => glyph(p, x + 2 + i * 4, y + 2, letter, 'ink'));
  glyph(p, x + 19, y + 2, PLANE_ICON_SMALL, 'ink');
}

export const AIRPORT_STAGE: StageConfig = {
  paint: paintCheckIn,
  backdrops: { coworker: paintGate },
  cast: {
    guide: GUIDE_ACTOR,
    airline_agent: {
      sprite: AIRLINE_AGENT_SPRITE,
      x: AGENT.x,
      y: AGENT.y,
      side: 'right',
      clipBottom: SURFACE_TOP,
    },
    // Alone he waits by the table at the gate; with the agent there too he keeps the same place,
    // in front of the counter and left of her.
    coworker: { sprite: COWORKER_SPRITE, x: DAN.x, y: DAN.y, side: 'right', beside: { ...DAN } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 4 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 88, y: 18 } },
  rest: { left: { x: SURFACE_X, y: PROP_TOP }, right: { x: SURFACE_X + 14, y: PROP_TOP } },
};
