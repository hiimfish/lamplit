import {
  ditherGradient,
  ditherOn,
  ditherRect,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W, paintClock, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';

/**
 * The bank stage: a small-town bank near closing time on a late August
 * evening. From the left: the front window with the low sun coming through
 * and its blind half down, a queue rope on brass posts (you wait in front of
 * it), a cash machine set into the wall, then the teller counter: dark wood
 * with a brass coin on its front, a low glass partition with an opening at the
 * teller's window and a brass tray to pass things through. Behind it: the
 * wall clock, a back counter with ledgers and the round vault door. Painted
 * through the Painter interface, palette colours only, whole pixels.
 *
 * Like the other stages it fills any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (a brass rail, the bank's coin emblem, a
 * rate board and a painting, then a dark upper wall with tall arched windows),
 * the front door, a waiting bench and a leaflet rack to the left, more teller
 * windows (closed for the day) and a wall of safe-deposit boxes to the right.
 */

/** The counter's left edge and the y of its top, in core pixels (props rest on it). */
const COUNTER = { x: 54, top: 40 } as const;
/** 24x24 pictures stand on the countertop with their shadow on it. */
const PROP_TOP = COUNTER.top - 20;
/** The teller's window: the gap in the glass partition, in core x. */
const OPENING = { x0: 92, x1: 113 } as const;
/** Top of the low glass partition on the counter. */
const GLASS_TOP = 29;

const FLOOR_TOP = 56;
/** Top of the wooden panelling on the lower wall. */
const DADO_TOP = 44;
/** Top of the back counter behind the teller. */
const BACK_TOP = 34;
/** Counter length past the core's right edge before it ends. */
const COUNTER_TAIL = 30;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** The pendant lamps: one at this core x, then one every LAMP_GAP both ways. */
const LAMP_X = 46;
const LAMP_GAP = 48;
/** Wall above the core needed for the brass rail, for the emblem row, and for the upper wall. */
const RAIL_MIN = 10;
const EMBLEM_MIN = 38;
const CORNICE_MIN = 56;
/** How far above the core the upper wall starts. */
const CORNICE_UP = 42;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Paints the bank to fill a w x h stage (at least the 128x64 core). */
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
    lightPool(p, lx, oy + 14, 22, 20, [['fog', 0.5]], {
      y0: cornice + 3,
      y1: oy + DADO_TOP,
    });
  }

  // Up the wall, when there is room above the core.
  if (cornice > 0) paintHighWindows(p, w, ox, cornice);
  if (oy >= RAIL_MIN) paintRail(p, w, oy - 4);
  if (oy >= EMBLEM_MIN) {
    if (ox + 6 >= 0) paintPainting(p, ox + 6, oy - 33);
    paintEmblem(p, ox + 64, oy - 22);
    paintRateBoard(p, ox + 88, oy - 34);
  }

  paintDado(p, w, ox, oy + DADO_TOP, floorTop);
  paintFloor(p, w, ox, floorTop, h);

  // Bays beside the core: the front door, a waiting bench and a leaflet rack
  // to the left; a wall of safe-deposit boxes and the office door to the right.
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    if (i === 0) paintDoor(p, x + 8, oy + 8, floorTop);
    else if (i % 2 === 1) paintBench(p, x + 4, oy, floorTop);
    else paintLeafletRack(p, x + 8, oy, floorTop);
  }
  for (let x = counterEnd + 4, i = 0; x < w; x += BAY_W, i++) {
    if (i % 2 === 0) paintDepositBoxes(p, x + 2, oy + 10, i);
    else paintOfficeDoor(p, x + 8, oy + 6, floorTop);
  }

  // The customer side.
  paintFrontWindow(p, ox + 1, oy + 5);
  paintSunOnFloor(p, ox + 1, floorTop, h);
  paintAtm(p, ox + 37, oy + 17, floorTop);
  paintQueue(p, ox + 2, ox + 33, floorTop + 4);

  // Behind the counter.
  paintClock(p, ox + 70, oy + 11);
  paintVault(p, ox + 122, oy + 19);
  paintBackCounter(p, ox + COUNTER.x, counterEnd, oy + BACK_TOP, oy + COUNTER.top);
  paintMonitor(p, ox + 77, oy + BACK_TOP);
  for (const lx of lamps) paintLamp(p, lx, oy);

  paintCounter(p, ox + COUNTER.x, counterEnd, oy + COUNTER.top, oy + CORE_H, counterEnd < w);
  paintPartition(p, ox, counterEnd, oy);
  paintPlant(p, ox + 3, oy + 18);
  paintClosedWindow(p, ox + CORE_W + 2, oy);
}

// ---------------------------------------------------------------------------
// Room

/**
 * The wall: cool grey-blue plaster. On a tall stage a rail runs at `cornice`
 * and the wall above it is darker, with a small diamond pattern.
 */
function paintWall(p: Painter, w: number, ox: number, floorTop: number, cornice: number): void {
  p.rect(0, 0, w, floorTop, 'concrete');
  if (cornice > 0) {
    p.rect(0, 0, w, cornice, 'slate');
    for (let row = 0; cornice - 6 - row * 8 >= 4; row++) {
      const y = cornice - 6 - row * 8;
      for (let x = mod(ox + (row % 2) * 8, 16) - 16; x < w; x += 16) {
        px(p, x, y, 'stone');
        px(p, x - 1, y + 1, 'night');
        px(p, x + 1, y + 1, 'night');
      }
    }
    ditherRect(p, 0, 0, w, 3, 'night', 8);
    p.rect(0, cornice, w, 1, 'honey');
    p.rect(0, cornice + 1, w, 1, 'amber');
    p.rect(0, cornice + 2, w, 1, 'ember');
  } else {
    ditherRect(p, 0, 0, w, 3, 'slate', 8);
  }
}

/** A brass picture rail across the wall at `y`. */
function paintRail(p: Painter, w: number, y: number): void {
  p.rect(0, y, w, 1, 'amber');
  p.rect(0, y + 1, w, 1, 'ember');
}

/** Dark wooden panelling on the lower wall. */
function paintDado(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'ember');
  p.rect(0, top, w, 1, 'honey');
  p.rect(0, top + 1, w, 1, 'amber');
  for (let x = mod(ox + 4, 12) - 12; x < w; x += 12) {
    p.rect(x, top + 3, 10, floorTop - top - 5, 'plum');
    p.rect(x, top + 3, 10, 1, 'night');
    p.rect(x + 1, top + 4, 8, floorTop - top - 7, 'ember');
  }
  p.rect(0, floorTop - 1, w, 1, 'night');
}

/** Polished stone floor: big pale tiles with dark joints. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  p.rect(0, floorTop, w, 1, 'ink');
  for (let row = 0; floorTop + 1 + row * 4 < h; row++) {
    const y = floorTop + 1 + row * 4;
    p.rect(0, y + 3, w, 1, 'stone');
    for (let x = mod(ox + (row % 2) * 10, 20) - 20; x < w; x += 20) {
      p.rect(x, y, 1, 3, 'stone');
      p.rect(x + 1, y, 6, 1, 'fog');
    }
  }
}

/** A brass globe lamp hanging from the ceiling (y 0) down to the core. */
function paintLamp(p: Painter, cx: number, oy: number): void {
  p.rect(cx, 0, 1, oy + 1, 'ink');
  p.rect(cx - 1, oy + 1, 3, 1, 'amber');
  p.rect(cx - 2, oy + 2, 5, 1, 'lamp');
  p.rect(cx - 3, oy + 3, 7, 3, 'honey');
  p.rect(cx - 2, oy + 6, 5, 1, 'lamp');
  p.rect(cx - 1, oy + 7, 3, 1, 'amber');
  px(p, cx - 2, oy + 3, 'paper');
}

// ---------------------------------------------------------------------------
// The customer side

/** The front window: the evening street in low sunlight, the blind half down. */
function paintFrontWindow(p: Painter, x: number, y: number): void {
  const w = 32;
  const h = 33;
  p.rect(x, y, w, h, 'ember');
  ditherGradient(p, x + 2, y + 2, w - 4, h - 4, ['violet', 'mauve', 'rosy', 'honey']);
  // the low sun and the roofs across the street
  p.rect(x + 20, y + 19, 4, 3, 'paper');
  p.rect(x + 19, y + 20, 6, 1, 'paper');
  const roofs: readonly (readonly [number, number, number])[] = [
    [2, 6, 9],
    [8, 9, 6],
    [17, 6, 4],
    [23, 7, 8],
  ];
  for (const [dx, bw, bh] of roofs) {
    p.rect(x + dx, y + h - 2 - bh, bw, bh, 'plum');
    if (bh > 5) px(p, x + dx + 2, y + h - bh, 'honey');
  }
  // a street lamp outside
  p.rect(x + 15, y + 15, 1, h - 17, 'night');
  p.rect(x + 14, y + 14, 3, 1, 'night');
  px(p, x + 15, y + 15, 'lamp');
  // the blind, pulled half down at closing time
  p.rect(x + 2, y + 2, w - 4, 10, 'paper');
  for (let i = 0; i < 5; i++) p.rect(x + 2, y + 3 + i * 2, w - 4, 1, 'fog');
  p.rect(x + 2, y + 12, w - 4, 1, 'tan');
  px(p, x + 15, y + 13, 'ink');
  px(p, x + 15, y + 14, 'lamp');
  // the frame
  p.rect(x + 15, y + 2, 2, h - 4, 'ember');
  p.rect(x - 1, y + h, w + 2, 1, 'honey');
  p.rect(x - 1, y + h + 1, w + 2, 1, 'amber');
  p.rect(x, y + h + 2, w, 1, 'night');
}

/** The low sun through the front window: a warm patch on the floor, the mullion's shadow in it. */
function paintSunOnFloor(p: Painter, x: number, floorTop: number, h: number): void {
  for (let y = floorTop + 1; y < h; y++) {
    const d = y - floorTop;
    const x0 = x + 4 + d * 2;
    const x1 = x + 30 + d * 3;
    const level = Math.max(2, 7 - Math.floor(d / 3));
    for (let xx = x0; xx < x1; xx++) {
      const mid = x + 17 + Math.floor(d * 2.5);
      if (Math.abs(xx - mid) <= 1) continue;
      if (ditherOn(xx, y, level)) px(p, xx, y, 'rosy');
    }
  }
}

/** A brass queue post standing on `foot`. */
function paintPost(p: Painter, x: number, foot: number): void {
  p.rect(x - 2, foot - 1, 5, 1, 'ember');
  p.rect(x - 1, foot - 2, 3, 1, 'amber');
  p.rect(x, foot - 13, 1, 11, 'lamp');
  p.rect(x + 1, foot - 12, 1, 10, 'amber');
  p.rect(x - 1, foot - 15, 3, 2, 'honey');
  px(p, x + 1, foot - 14, 'amber');
}

/** Two brass posts with a red rope sagging between them: where you queue. */
function paintQueue(p: Painter, x0: number, x1: number, foot: number): void {
  const top = foot - 13;
  const span = x1 - x0;
  for (let x = x0 + 2; x < x1; x++) {
    const t = (x - x0) / span;
    const sag = Math.round(Math.sin(t * Math.PI) * 4);
    px(p, x, top + sag, 'red');
    px(p, x, top + sag + 1, 'maroon');
  }
  paintPost(p, x0, foot);
  paintPost(p, x1, foot);
}

/** The cash machine set into the wall, 15 wide, its foot on the floor. */
function paintAtm(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 15;
  // its glow on the wall around it
  lightPool(p, x + 7, top + 10, 12, 12, [['sky', 0.3]]);
  p.rect(x - 1, top - 1, w + 2, floorTop - top + 2, 'night');
  p.rect(x, top, w, floorTop - top, 'fog');
  p.rect(x + w - 2, top, 2, floorTop - top, 'concrete');
  // the header with the bank's coin
  p.rect(x, top, w, 4, 'teal');
  p.rect(x + 6, top + 1, 3, 2, 'honey');
  px(p, x + 7, top + 1, 'lamp');
  // the screen
  p.rect(x + 2, top + 6, 10, 8, 'ink');
  p.rect(x + 3, top + 7, 8, 6, 'teal');
  p.rect(x + 4, top + 8, 5, 1, 'cyan');
  p.rect(x + 4, top + 10, 3, 1, 'paper');
  p.rect(x + 4, top + 11, 4, 1, 'sky');
  px(p, x + 3, top + 7, 'cyan');
  // the shelf, the keypad and the card slot
  p.rect(x + 1, top + 16, w - 2, 1, 'paper');
  p.rect(x + 1, top + 17, w - 2, 1, 'stone');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) px(p, x + 3 + c * 2, top + 19 + r * 2, 'night');
  }
  p.rect(x + 10, top + 19, 2, 1, 'neon');
  p.rect(x + 10, top + 21, 2, 1, 'leaf');
  p.rect(x + 2, top + 25, 6, 1, 'ink');
  px(p, x + 8, top + 25, 'cyan');
  // the cash slot
  p.rect(x + 2, top + 29, 10, 2, 'ink');
  p.rect(x + 3, top + 31, 8, 1, 'stone');
}

// ---------------------------------------------------------------------------
// Behind the counter

/** The round vault door set into the back wall, centred on (cx, cy). */
function paintVault(p: Painter, cx: number, cy: number): void {
  const ring = (r: number, color: PaletteName): void => {
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy + r * 0.6));
      p.rect(cx - half, cy + dy, half * 2 + 1, 1, color);
    }
  };
  ring(11, 'night');
  ring(10, 'fog');
  ring(9, 'stone');
  ring(7, 'slate');
  ring(6, 'stone');
  // bolts round the rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    px(p, cx + Math.round(Math.cos(a) * 8), cy + Math.round(Math.sin(a) * 8), 'fog');
  }
  // the wheel: three brass spokes round a hub
  p.rect(cx - 4, cy, 9, 1, 'lamp');
  p.rect(cx, cy - 4, 1, 9, 'lamp');
  for (let i = -3; i <= 3; i++) px(p, cx + i, cy + i, 'amber');
  p.rect(cx - 1, cy - 1, 3, 3, 'honey');
  px(p, cx + 1, cy + 1, 'amber');
  // the hinges
  p.rect(cx + 10, cy - 5, 2, 3, 'ink');
  p.rect(cx + 10, cy + 3, 2, 3, 'ink');
}

/** Ledgers and a cash box on the back counter, its top at `top`. */
function paintBackCounter(p: Painter, x0: number, x1: number, top: number, bottom: number): void {
  const books: readonly (readonly [number, number, PaletteName])[] = [
    [2, 5, 'maroon'],
    [4, 6, 'denim'],
    [6, 4, 'moss'],
    [8, 6, 'maroon'],
  ];
  for (const [dx, bh, color] of books) {
    p.rect(x0 + dx, top - bh, 2, bh, color);
    px(p, x0 + dx, top - bh + 1, 'honey');
  }
  // a cash box
  p.rect(x0 + 13, top - 4, 9, 4, 'teal');
  p.rect(x0 + 13, top - 4, 9, 1, 'cyan');
  px(p, x0 + 17, top - 2, 'honey');
  // a stack of papers
  p.rect(x0 + 24, top - 2, 7, 2, 'paper');
  p.rect(x0 + 24, top - 1, 7, 1, 'fog');
  p.rect(x0, top, x1 - x0, 1, 'amber');
  p.rect(x0, top + 1, x1 - x0, bottom - top - 1, 'ember');
  p.rect(x0, top + 2, x1 - x0, 1, 'plum');
}

// ---------------------------------------------------------------------------
// The counter and what stands on it

/** A brass coin: a round plate with a raised rim and a shine down one side. */
function paintCoin(p: Painter, cx: number, cy: number, r: number): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy + r * 0.6));
    p.rect(cx - half, cy + dy, half * 2 + 1, 1, dy < 0 ? 'lamp' : 'amber');
  }
  for (let dy = -r + 2; dy <= r - 2; dy++) {
    const half = Math.round(Math.sqrt((r - 2) ** 2 - dy * dy + r * 0.3));
    p.rect(cx - half, cy + dy, half * 2 + 1, 1, 'honey');
  }
  for (let dy = -r + 3; dy <= r - 3; dy++) px(p, cx + r - 3, cy + dy, 'lamp');
  px(p, cx - r + 2, cy - 1, 'paper');
}

/** The counter from x0 to x1: a wooden top, dark panels, a brass coin on the front. */
function paintCounter(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top + 4, w, bottom - top - 4, 'plum');
  const panelTop = top + 7;
  const panelH = bottom - 6 - panelTop;
  const panel = (x: number, pw: number): void => {
    p.rect(x, panelTop, pw, panelH, 'ember');
    p.rect(x, panelTop, pw, 1, 'night');
    p.rect(x, panelTop, 1, panelH, 'night');
    p.rect(x + 1, panelTop + panelH - 1, pw - 1, 1, 'amber');
    p.rect(x + pw - 1, panelTop + 1, 1, panelH - 1, 'amber');
  };
  for (let x = x0 + 3; x + 14 <= x1 - 2; x += 17) panel(x, 14);
  paintCoin(p, x0 + 44, panelTop + Math.floor(panelH / 2), 4);
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

/** One pane of the low glass partition, from x0 to x1, standing on the counter. */
function paintPane(p: Painter, x0: number, x1: number, top: number, base: number): void {
  for (let y = top + 1; y < base; y++) {
    for (let x = x0 + 1; x < x1; x++) if (ditherOn(x, y, 3)) px(p, x, y, 'sky');
  }
  // a glint across the glass
  for (let i = 0; i < 4; i++) px(p, x1 - 9 + i, base - 3 - i * 2, 'paper');
  p.rect(x0, top, x1 - x0 + 1, 1, 'lamp');
  p.rect(x0, top + 1, x1 - x0 + 1, 1, 'amber');
  p.rect(x0, top, 1, base - top, 'amber');
  p.rect(x1, top, 1, base - top, 'amber');
}

/**
 * The low glass partition along the counter, open at the teller's window,
 * where a brass tray sits in the counter for passing things through.
 */
function paintPartition(p: Painter, ox: number, counterEnd: number, oy: number): void {
  const top = oy + GLASS_TOP;
  const base = oy + COUNTER.top;
  paintPane(p, ox + COUNTER.x + 1, ox + OPENING.x0, top, base);
  for (let x = ox + OPENING.x1; x < counterEnd - 2; x += 28) {
    paintPane(p, x, Math.min(x + 27, counterEnd - 2), top, base);
  }
  // the opening: brass posts up to a little arch, and the tray in the counter
  for (const x of [ox + OPENING.x0, ox + OPENING.x1]) {
    p.rect(x, top - 2, 1, base - top + 2, 'lamp');
    px(p, x, top - 3, 'honey');
  }
  p.rect(ox + OPENING.x0 + 4, base, 13, 1, 'ember');
  p.rect(ox + OPENING.x0 + 5, base + 1, 11, 1, 'night');
  p.rect(ox + OPENING.x0 + 3, base - 1, 15, 1, 'lamp');
}

/** The teller's computer screen, seen from behind, on the back counter at `base`. */
function paintMonitor(p: Painter, x: number, base: number): void {
  p.rect(x, base - 11, 11, 8, 'night');
  p.rect(x + 1, base - 10, 9, 6, 'slate');
  p.rect(x + 1, base - 10, 9, 1, 'stone');
  px(p, x + 9, base - 5, 'leaf'); // the power light
  p.rect(x + 4, base - 3, 3, 2, 'slate');
  p.rect(x + 2, base - 1, 7, 1, 'night');
}

/** A teller's window beyond the core, closed for the day: a blind down behind the glass. */
function paintClosedWindow(p: Painter, x: number, oy: number): void {
  const top = oy + GLASS_TOP - 14;
  p.rect(x + 2, top, 20, 14, 'paper');
  for (let i = 0; i < 6; i++) p.rect(x + 2, top + 1 + i * 2, 20, 1, 'fog');
  p.rect(x + 2, top, 20, 1, 'stone');
  // the "closed" plate: a red bar on a brass plate
  p.rect(x + 7, oy + COUNTER.top - 6, 10, 5, 'lamp');
  p.rect(x + 8, oy + COUNTER.top - 4, 8, 1, 'red');
}

// ---------------------------------------------------------------------------
// Above the core

/** The bank's emblem: a big brass coin between two brass wings. */
function paintEmblem(p: Painter, cx: number, cy: number): void {
  p.rect(cx - 28, cy - 1, 56, 1, 'amber');
  p.rect(cx - 26, cy, 52, 1, 'ember');
  for (let i = 0; i < 4; i++) {
    p.rect(cx - 12 - i * 4, cy - 3 + i, 3, 1, 'lamp');
    p.rect(cx + 10 + i * 4, cy - 3 + i, 3, 1, 'lamp');
  }
  paintCoin(p, cx, cy - 1, 8);
  p.rect(cx - 7, cy + 8, 15, 1, 'night');
}

/** A rate board: rows of little lit numbers on black, no words. */
function paintRateBoard(p: Painter, x: number, y: number): void {
  const w = 26;
  const h = 18;
  p.rect(x, y, w, h, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ink');
  for (let r = 0; r < 4; r++) {
    p.rect(x + 3, y + 3 + r * 3, 8, 1, 'fog');
    for (let c = 0; c < 3; c++) {
      if (hash2(r, c, 71) > 0.2) p.rect(x + 14 + c * 3, y + 3 + r * 3, 2, 1, 'lamp');
    }
  }
  p.rect(x + 1, y + h, w, 1, 'night');
}

/** A framed painting of the town's hill at sunset. */
function paintPainting(p: Painter, x: number, y: number): void {
  const w = 30;
  const h = 18;
  p.rect(x, y, w, h, 'amber');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ember');
  ditherGradient(p, x + 2, y + 2, w - 4, h - 4, ['violet', 'rosy', 'honey']);
  p.rect(x + 2, y + h - 6, w - 4, 4, 'moss');
  p.rect(x + 7, y + h - 8, 12, 2, 'moss');
  p.rect(x + 20, y + 4, 2, 2, 'paper');
  p.rect(x + 1, y + h, w, 1, 'night');
}

/** Tall arched windows in the dark upper wall, one in every other gap between the lamp cords. */
function paintHighWindows(p: Painter, w: number, ox: number, cornice: number): void {
  const wh = Math.min(64, cornice - 14);
  if (wh < 26) return;
  const top = Math.floor((cornice - wh) / 2);
  const step = LAMP_GAP * 2;
  const centre = ox + LAMP_X + LAMP_GAP / 2;
  const first = Math.floor(-(centre + 20) / step);
  for (let k = first; centre + k * step - 20 < w; k++) {
    paintHighWindow(p, centre + k * step, top, wh, k);
  }
}

/** One arched window centred on `cx`: the dusk sky over dark rooftops. */
function paintHighWindow(p: Painter, cx: number, top: number, wh: number, n: number): void {
  const half = 14;
  // the arch: rows narrower at the top
  for (let dy = 0; dy < half; dy++) {
    const span = Math.round(Math.sqrt(half * half - (half - dy) ** 2));
    p.rect(cx - span - 2, top + dy, span * 2 + 5, 1, 'fog');
  }
  p.rect(cx - half - 2, top + half, half * 2 + 5, wh - half, 'fog');
  for (let dy = 2; dy < half; dy++) {
    const span = Math.round(Math.sqrt(half * half - (half - dy) ** 2)) - 1;
    if (span > 0) ditherGradient(p, cx - span, top + dy, span * 2 + 1, 1, ['deep']);
  }
  ditherGradient(p, cx - half, top + half, half * 2 + 1, wh - half - 2, [
    'deep',
    'indigo',
    'dusk',
    'violet',
  ]);
  for (let i = 0; i < 6; i++) {
    const sx = cx - half + 1 + Math.floor(hash2(i, n, 41) * (half * 2 - 1));
    const sy = top + half + Math.floor(hash2(i, n, 43) * Math.max(1, wh - half - 14));
    px(p, sx, sy, hash2(i, n, 47) > 0.6 ? 'honey' : 'fog');
  }
  for (let i = 0; i < 4; i++) {
    const bh = 3 + Math.floor(hash2(i, n, 53) * 6);
    const bx = cx - half + i * 7;
    p.rect(bx, top + wh - 2 - bh, i === 3 ? 8 : 7, bh, 'night');
    if (hash2(i, n, 59) > 0.35) px(p, bx + 2 + (i % 3), top + wh - bh, 'honey');
  }
  p.rect(cx, top + 2, 1, wh - 4, 'fog');
  p.rect(cx - half, top + half + Math.floor((wh - half) / 3), half * 2 + 1, 1, 'fog');
  p.rect(cx - half - 4, top + wh, half * 2 + 9, 1, 'paper');
  p.rect(cx - half - 3, top + wh + 1, half * 2 + 7, 1, 'night');
}

// ---------------------------------------------------------------------------
// Beside the core

/** The front door: two glazed leaves onto the evening street, brass push bars. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 30;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'ember');
  p.rect(x, top, w, 1, 'honey');
  for (const dx of [2, 16]) {
    ditherGradient(p, x + dx, top + 3, 12, h - 8, ['violet', 'mauve', 'rosy']);
    p.rect(x + dx, floorTop - 12, 12, 7, 'plum'); // the far side of the street
    px(p, x + dx + 4, floorTop - 11, 'honey');
  }
  p.rect(x + 3, top + 20, 10, 1, 'lamp');
  p.rect(x + 17, top + 20, 10, 1, 'lamp');
  // the opening hours card
  p.rect(x + 19, top + 6, 6, 5, 'paper');
  p.rect(x + 20, top + 7, 4, 1, 'stone');
  p.rect(x + 20, top + 9, 3, 1, 'stone');
}

/** A waiting bench under a framed painting, a plant at its end. */
function paintBench(p: Painter, x: number, oy: number, floorTop: number): void {
  paintPainting(p, x + 4, oy + 12);
  const seat = floorTop - 6;
  p.rect(x + 2, seat - 7, 30, 2, 'ember');
  p.rect(x + 2, seat - 5, 30, 1, 'plum');
  p.rect(x + 1, seat, 32, 2, 'amber');
  p.rect(x + 1, seat + 2, 32, 1, 'ember');
  p.rect(x + 3, seat + 3, 2, floorTop - seat + 2, 'ember');
  p.rect(x + 29, seat + 3, 2, floorTop - seat + 2, 'ember');
  // a leaflet left on the seat
  p.rect(x + 18, seat - 1, 5, 1, 'paper');
  paintPlant(p, x + 34, floorTop - 16);
}

/** A rack of leaflets on the wall over a small table. */
function paintLeafletRack(p: Painter, x: number, oy: number, floorTop: number): void {
  p.rect(x, oy + 14, 26, 24, 'ember');
  p.rect(x + 1, oy + 15, 24, 22, 'plum');
  const colours: readonly PaletteName[] = ['paper', 'sky', 'honey', 'rosy', 'paper', 'leaf'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const color = colours[(r * 3 + c) % colours.length] ?? 'paper';
      p.rect(x + 2 + c * 8, oy + 16 + r * 7, 6, 5, color);
      p.rect(x + 3 + c * 8, oy + 17 + r * 7, 4, 1, 'stone');
      p.rect(x + 2 + c * 8, oy + 21 + r * 7, 7, 1, 'amber');
    }
  }
  const t = floorTop - 10;
  p.rect(x + 2, t, 22, 2, 'amber');
  p.rect(x + 2, t + 2, 22, 1, 'ember');
  p.rect(x + 4, t + 3, 2, floorTop - t, 'ember');
  p.rect(x + 20, t + 3, 2, floorTop - t, 'ember');
  // a pen on a chain
  p.rect(x + 8, t - 1, 5, 1, 'ink');
}

/** A wall of safe-deposit boxes: small steel doors, each with a brass keyhole. */
function paintDepositBoxes(p: Painter, x: number, y: number, seed: number): void {
  const cols = 5;
  const rows = 5;
  const w = cols * 7 + 1;
  const h = rows * 6 + 1;
  p.rect(x - 1, y - 1, w + 2, h + 2, 'night');
  p.rect(x, y, w, h, 'stone');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = x + 1 + c * 7;
      const dy = y + 1 + r * 6;
      p.rect(dx, dy, 6, 5, 'fog');
      p.rect(dx, dy, 6, 1, 'paper');
      p.rect(dx + 5, dy + 1, 1, 4, 'concrete');
      px(p, dx + 2, dy + 2, hash2(c + seed * 5, r, 7) < 0.25 ? 'amber' : 'lamp');
    }
  }
}

/** The door to the back office: a wooden door with a small round window. */
function paintOfficeDoor(p: Painter, x: number, top: number, floorTop: number): void {
  p.rect(x, top, 24, floorTop - top, 'night');
  p.rect(x + 2, top + 2, 20, floorTop - top - 2, 'ember');
  p.rect(x + 4, top + 4, 16, floorTop - top - 6, 'plum');
  p.rect(x + 9, top + 7, 6, 6, 'night');
  p.rect(x + 10, top + 8, 4, 4, 'honey');
  p.rect(x + 18, top + 26, 2, 2, 'lamp');
}

// ---------------------------------------------------------------------------
// The teller: 16x24, facing left. A woman in her thirties in the bank's
// uniform: black hair tied back in a bun, a dark navy blazer over a white
// blouse, a small teal scarf at the neck and a gold name badge, a dark skirt
// and tights. Only the top part shows above the counter; the legs are there
// so the sprite can bob without a gap at the counter line.

const TELLER_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......hhhhh.....',
    '.....hHhhhhh.hh.',
    '....hhhhhhhhhhhh',
    '....eshhhhhhThhh',
    '...ssesshhhhh.hh',
    '....sssshhhh....',
    '....rsssnh......',
    '......sss.......',
    '.....fwffbb.....',
    '....bwffbbbbb...',
    '....bbwfbbbbbB..',
    '....bbwnbbbbbB..',
    '....bbwbbbbbbB..',
    '....bbbbbbbbbB..',
    '...ssbbbbbbbbB..',
    '...ssbbbbbbbbB..',
    '....bbbbbbbbbB..',
    '.....ddddddddd..',
    '.....dddddddd...',
    '......ggqq......',
    '......ggqq......',
    '......ggqq......',
    '.....kkkkk......',
  ],
  legend: {
    h: 'ink',
    H: 'stone',
    b: 'indigo',
    B: 'deep',
    s: 'skin',
    e: 'ink',
    r: 'rosy',
    T: 'teal',
    w: 'paper',
    f: 'teal',
    n: 'lamp',
    d: 'night',
    g: 'slate',
    q: 'deep',
    k: 'ink',
  },
};

export const BANK_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    teller: {
      sprite: TELLER_SPRITE,
      x: 96,
      y: 19,
      side: 'right',
      clipBottom: COUNTER.top,
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: {
    left: { x: COUNTER.x, y: PROP_TOP },
    // Stops short of the teller, so a prop stays clear of her face and her hands.
    right: { x: COUNTER.x + 21, y: PROP_TOP },
  },
};
