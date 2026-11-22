import {
  ditherGradient,
  ditherRect,
  glowEllipse,
  hash2,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { clipped, coreOrigin, CORE_W, paintClock, paintPicture, paintPlant } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';
import { NEIGHBOR_SPRITE } from './moveIn';

/**
 * The day-before stage: your own living room on a mid-November evening, the
 * day before your new job starts. From the left: a floor lamp lit beside a
 * teal sofa (you stand in front of it), a wall clock, a window onto the dark
 * early evening with red curtains and the neighbour's flowers on the sill, a
 * low coffee table on a rug (things for tomorrow are laid out on it), a coat
 * stand with tomorrow's navy suit and red tie, the front door with polished
 * shoes waiting on the mat. Fairy lights along the wall make it a little
 * festive. The neighbour stands at the table's far end.
 *
 * The phone call backdrop keeps the same room on the left, and on the right a
 * framed panel with an inked, rounded border and a phone badge: Ms. Carter's
 * office at Harbor Trading, the harbour at dusk in its window, her desk phone
 * behind her. The coffee table stays in front of the panel: it is your room.
 *
 * Like the other stages both fill any size: the 128x64 core sits centred near
 * the bottom; extra wall goes above (taller windows and curtains, a picture
 * and a calendar with Monday ringed, a shelf, then a picture rail and the
 * upper wall with high windows onto the night sky), more windows, bookcases,
 * floor lamps and plants to both sides. Painted through the Painter
 * interface, palette colours only, whole pixels.
 */

/** The coffee table's left edge, width and the y of its top, in core pixels (props rest on it). */
const TABLE = { x: 40, w: 40, top: 48 } as const;
/** 24x24 pictures stand on the tabletop with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 56;
/** The rail between the pale upper wall and the lower wall. */
const RAIL_Y = 38;
/** The living-room window: its glass from (x, y), w x h; curtains hang either side. */
const WINDOW = { x: 60, y: 7, w: 26, h: 22 } as const;
/** Where the person visiting (or calling) stands, at the table's far end. */
const BY_TABLE = { x: 80, y: 39 } as const;
/** The call panel in core pixels: its outer border. */
const PANEL = { x: 62, y: 2, w: 60, h: 62 } as const;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** How much taller the windows grow on a tall stage, at most. */
const WINDOW_GROW = 30;
/** Wall above the core needed for the picture and calendar, the shelf, and the picture rail. */
const PICTURE_MIN = 22;
const SHELF_MIN = 48;
const RAIL_MIN = 72;
const RAIL_UP = 58;
/** Gap between the high windows above the picture rail. */
const HIGH_GAP = 88;

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

/** The living room with the neighbour visiting. */
function paintHome(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintRug(p, ox, oy + FLOOR_TOP);
  paintTable(p, ox + TABLE.x, oy + TABLE.top, oy + FLOOR_TOP);
}

/** The living room on the left, Ms. Carter's office in a call panel on the right. */
function paintCall(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintRoom(p, w, h);
  const { ox, oy } = coreOrigin(w, h);
  paintRug(p, ox, oy + FLOOR_TOP);
  paintPanel(p, ox + PANEL.x, oy + PANEL.y, ox);
  paintTable(p, ox + TABLE.x, oy + TABLE.top, oy + FLOOR_TOP);
}

// ---------------------------------------------------------------------------
// The living room

/** Everything of the room except the rug and the coffee table. */
function paintRoom(p: Painter, w: number, h: number): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const railY = oy + RAIL_Y;
  const rail = oy >= RAIL_MIN ? oy - RAIL_UP : -1;
  // On a taller stage the windows reach further up.
  const winTop = oy + WINDOW.y - Math.min(WINDOW_GROW, Math.max(0, oy - 20));
  const winH = oy + WINDOW.y + WINDOW.h - winTop;

  // The bays beside the core: [left x, kind]. Lamps stand in the ones without a window.
  const bays: [number, 'window' | 'shelf' | 'plant'][] = [];
  for (let x = ox - BAY_W, i = 0; x + BAY_W > 0; x -= BAY_W, i++) {
    bays.push([x, i % 3 === 0 ? 'shelf' : i % 3 === 1 ? 'window' : 'plant']);
  }
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) {
    bays.push([x, i % 2 === 0 ? 'window' : 'shelf']);
  }

  // The wall: pale paper with a faint stripe, warm where the lamps light it.
  p.rect(0, 0, w, railY, 'fog');
  for (let x = mod(ox + 3, 8); x < w; x += 8) ditherRect(p, x, 0, 1, railY, 'concrete', 6);
  if (rail >= 0) paintUpperWall(p, w, ox, rail);
  else ditherRect(p, 0, 0, w, 2, 'concrete', 8);
  glowEllipse(p, ox + 50, oy + 22, 34, 26, 'honey', [0.26, 0.16, 0.08]);
  for (const [x, kind] of bays) {
    if (kind !== 'window') glowEllipse(p, x + 22, oy + 22, 28, 22, 'honey', [0.2, 0.1]);
  }

  // Up the wall, when there is room above the core.
  if (oy >= PICTURE_MIN) {
    paintPicture(p, ox + 14, oy - 20);
    paintCalendar(p, ox + 100, oy - 19);
  }
  if (oy >= SHELF_MIN) paintWallShelf(p, ox + 8, oy - 30);

  // The lower wall: a white rail over panelling, a white skirting board.
  p.rect(0, railY, w, floorTop - railY, 'concrete');
  for (let x = mod(ox + 6, 12); x < w; x += 12) {
    p.rect(x, railY + 4, 1, floorTop - railY - 8, 'stone');
    p.rect(x + 1, railY + 4, 1, floorTop - railY - 8, 'fog');
  }
  p.rect(0, railY, w, 1, 'paper');
  p.rect(0, railY + 1, w, 1, 'stone');
  p.rect(0, floorTop - 2, w, 2, 'paper');
  paintFloor(p, w, ox, floorTop, h);

  for (const [x, kind] of bays) {
    if (kind === 'window') paintWindow(p, x + 9, winTop, 26, winH, x);
    else if (kind === 'shelf') paintBookcase(p, x + 8, oy + 26, floorTop, x);
    else {
      paintPlant(p, x + 8, floorTop - 20);
      paintSideTable(p, x + 22, oy + 44, floorTop, x);
    }
    if (kind === 'shelf') paintFloorLamp(p, x + 36, oy + 18, floorTop);
  }
  paintFairyLights(p, w, ox, rail >= 0 ? rail + 4 : Math.max(1, oy - 6));

  // The core.
  paintClock(p, ox + 21, oy + 14);
  paintWindow(p, ox + WINDOW.x, winTop, WINDOW.w, winH, ox);
  paintFlowers(p, ox + WINDOW.x + WINDOW.w - 8, oy + WINDOW.y + WINDOW.h);
  paintFloorLamp(p, ox + 51, oy + 18, floorTop);
  paintSofa(p, ox + 5, oy + 33, floorTop);
  paintDoor(p, ox + 110, oy + 9, floorTop);
  paintCoatStand(p, ox + 103, oy + 8, floorTop);
}

/** Warm wooden floorboards, counted from the core so they never shift. */
function paintFloor(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'amber');
  p.rect(0, floorTop, w, 1, 'ember');
  for (let row = 0; floorTop + 3 + row * 3 < h; row++) {
    const y = floorTop + 3 + row * 3;
    p.rect(0, y, w, 1, 'ember');
    for (let x = mod(ox + row * 13, 22); x < w; x += 22) px(p, x, y - 1, 'ember');
  }
}

/**
 * The wall above `rail` on a tall stage: a picture rail, then a deeper
 * wallpaper with a small diamond pattern up to a white cornice.
 */
function paintUpperWall(p: Painter, w: number, ox: number, rail: number): void {
  p.rect(0, 0, w, rail, 'concrete');
  for (let row = 0, y = 9; y < rail - 2; y += 5, row++) {
    for (let x = mod(ox + (row % 2) * 5, 10); x < w; x += 10) px(p, x, y, 'stone');
  }
  // high windows onto the night sky, one over the core and one every HIGH_GAP
  const wh = Math.min(44, rail - 18);
  if (wh >= 12) {
    const top = Math.max(8, Math.floor((rail - wh) / 2) + 2);
    const first = Math.floor(-(ox + 73) / HIGH_GAP) - 1;
    for (let k = first; ox + 73 + k * HIGH_GAP - 16 < w; k++) {
      const cx = ox + 73 + k * HIGH_GAP;
      paintHighWindow(p, cx - 13, top, 26, wh, k);
    }
  }
  p.rect(0, 0, w, 3, 'paper');
  p.rect(0, 3, w, 1, 'fog');
  p.rect(0, 4, w, 1, 'stone');
  p.rect(0, rail, w, 2, 'ember');
  p.rect(0, rail, w, 1, 'amber');
  p.rect(0, rail + 2, w, 1, 'stone');
}

/** A high window with a white frame: only the night sky, stars, a thin moon in every third. */
function paintHighWindow(p: Painter, x: number, y: number, w: number, h: number, n: number) {
  p.rect(x - 2, y - 2, w + 4, h + 4, 'paper');
  ditherGradient(p, x, y, w, h, ['deep', 'deep', 'indigo', 'dusk']);
  for (let i = 0; i < 6; i++) {
    const sx = x + 1 + Math.floor(hash2(i, n, 131) * (w - 2));
    const sy = y + 1 + Math.floor(hash2(i, n, 137) * (h - 2));
    px(p, sx, sy, hash2(i, n, 139) > 0.7 ? 'paper' : 'fog');
  }
  if (mod(n, 3) === 0) {
    p.rect(x + 5, y + 3, 1, 4, 'paper');
    px(p, x + 6, y + 2, 'paper');
    px(p, x + 6, y + 7, 'paper');
    px(p, x + 4, y + 4, 'honey');
    px(p, x + 4, y + 5, 'honey');
  }
  p.rect(x + Math.floor(w / 2), y, 1, h, 'paper');
  p.rect(x - 3, y + h + 2, w + 6, 1, 'stone');
}

/** A string of fairy lights in loose loops along the wall, warm and coloured bulbs. */
function paintFairyLights(p: Painter, w: number, ox: number, y: number): void {
  const bulbs: readonly PaletteName[] = ['honey', 'neon', 'lamp', 'cyan', 'honey', 'rosy'];
  for (let x = 0; x < w; x++) {
    const lx = mod(x - ox, 22);
    const sag = Math.round(Math.sin((lx / 22) * Math.PI) * 3);
    px(p, x, y + sag, 'stone');
    if (lx === 0) px(p, x, y - 1, 'ink'); // the pin
    if (lx === 4 || lx === 11 || lx === 18) {
      const k = Math.floor((x - ox + 528) / 7);
      const c = bulbs[mod(k, bulbs.length)] ?? 'honey';
      px(p, x, y + sag + 1, c);
      p.rect(x - 1, y + sag, 3, 3, c, 0.25);
    }
  }
}

/** A window onto the dark early evening: rooftops with lit windows, a crescent moon, curtains. */
function paintWindow(p: Painter, x: number, y: number, w: number, h: number, seed: number): void {
  // the frame
  p.rect(x - 2, y - 2, w + 4, h + 4, 'paper');
  paintNight(within(p, x, y, w, h), x, y, w, h, seed);
  p.rect(x + Math.floor(w / 2), y, 1, h, 'paper');
  p.rect(x, y + h - 9, w, 1, 'paper');
  p.rect(x, y, w, 1, 'fog');
  // the sill
  p.rect(x - 3, y + h + 2, w + 6, 1, 'paper');
  p.rect(x - 3, y + h + 3, w + 6, 1, 'concrete');
  // the rod and the red curtains, tied back
  p.rect(x - 7, y - 4, w + 14, 1, 'ember');
  px(p, x - 8, y - 4, 'amber');
  px(p, x + w + 7, y - 4, 'amber');
  paintCurtain(p, x - 7, y - 3, h + 6, false);
  paintCurtain(p, x + w + 2, y - 3, h + 6, true);
}

/** The view itself: sky from night to a last violet, rooftops and lit windows. */
function paintNight(p: Painter, x: number, y: number, w: number, h: number, seed: number): void {
  const roofs = y + h - 7;
  ditherGradient(p, x, y, w, roofs - y + 2, ['deep', 'deep', 'indigo', 'dusk', 'violet']);
  for (let i = 0; i < 5; i++) {
    const sx = x + 1 + Math.floor(hash2(seed, i, 17) * (w - 2));
    const sy = y + 1 + Math.floor(hash2(seed, i, 19) * Math.max(1, roofs - y - 8));
    px(p, sx, sy, hash2(seed, i, 23) > 0.6 ? 'paper' : 'fog');
  }
  if (mod(seed, 3) === 0) {
    // a thin crescent moon
    p.rect(x + w - 7, y + 3, 1, 4, 'paper');
    px(p, x + w - 6, y + 2, 'paper');
    px(p, x + w - 6, y + 7, 'paper');
    px(p, x + w - 8, y + 4, 'honey');
    px(p, x + w - 8, y + 5, 'honey');
  }
  // rooftops across the street, a chimney or two, windows lit for the evening
  for (let i = 0; i < w;) {
    const bw = 5 + Math.floor(hash2(seed + i, 1, 29) * 6);
    const bh = 3 + Math.floor(hash2(seed + i, 2, 31) * 5);
    const top = roofs - bh + 4;
    p.rect(x + i, top, bw, y + h - top, 'night');
    p.rect(x + i, top, bw, 1, 'slate');
    if (hash2(seed + i, 3, 37) < 0.4) p.rect(x + i + 1, top - 2, 1, 2, 'night');
    for (let wy = top + 2; wy < y + h - 1; wy += 3) {
      for (let wx = x + i + 1; wx < x + i + bw - 1; wx += 2) {
        if (hash2(wx, wy, 41) < 0.35) px(p, wx, wy, hash2(wx, wy, 43) < 0.5 ? 'honey' : 'lamp');
      }
    }
    i += bw + 1;
  }
}

/** One red curtain tied back at its middle; `right` mirrors it. */
function paintCurtain(p: Painter, x: number, y: number, h: number, right: boolean): void {
  const tie = y + Math.floor(h * 0.6);
  for (let yy = y; yy < y + h; yy++) {
    // full width at the top, gathered to 3 at the tie, flaring a little below
    const t = yy < tie ? (yy - y) / Math.max(1, tie - y) : 1 - (yy - tie) / Math.max(1, h * 0.6);
    const cw = Math.max(3, Math.round(5 - t * 2));
    const cx = right ? x : x + 5 - cw;
    p.rect(cx, yy, cw, 1, 'red');
    px(p, right ? cx + cw - 1 : cx, yy, 'maroon');
    if (cw > 3) px(p, cx + Math.floor(cw / 2), yy, 'maroon');
  }
  p.rect(right ? x : x + 1, tie, 4, 1, 'honey');
}

/** A jar of flowers on the sill: a gift from the neighbour. */
function paintFlowers(p: Painter, x: number, sill: number): void {
  p.rect(x + 1, sill - 3, 4, 4, 'sky');
  p.rect(x + 1, sill - 3, 4, 1, 'paper');
  px(p, x + 4, sill - 1, 'denim');
  p.rect(x + 2, sill - 6, 1, 3, 'moss');
  p.rect(x + 3, sill - 7, 1, 4, 'leaf');
  const heads: readonly [number, number, PaletteName][] = [
    [0, -8, 'neon'],
    [3, -10, 'honey'],
    [5, -7, 'rosy'],
    [2, -7, 'paper'],
  ];
  for (const [dx, dy, c] of heads) {
    p.rect(x + dx, sill + dy, 2, 2, c);
  }
  px(p, x + 4, sill - 9, 'lamp');
}

/** A standing lamp with a fabric shade, switched on; its light falls on the wall. */
function paintFloorLamp(p: Painter, cx: number, top: number, floorTop: number): void {
  p.rect(cx - 3, top, 7, 1, 'paper');
  p.rect(cx - 4, top + 1, 9, 2, 'paper');
  p.rect(cx - 5, top + 3, 11, 3, 'paper');
  p.rect(cx + 2, top + 1, 2, 5, 'fog');
  p.rect(cx - 5, top + 6, 11, 1, 'honey');
  p.rect(cx - 1, top + 7, 3, 1, 'lamp');
  p.rect(cx - 6, top + 7, 13, 2, 'honey', 0.35);
  p.rect(cx, top + 7, 1, floorTop - top - 6, 'ink');
  p.rect(cx - 2, floorTop, 5, 1, 'ink');
}

/** The teal sofa you stand in front of: back, two cushions, rounded arms. */
function paintSofa(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 42;
  // the back
  p.rect(x + 3, top + 1, w - 6, 11, 'teal');
  p.rect(x + 4, top, w - 8, 1, 'teal');
  ditherRect(p, x + 4, top + 1, w - 8, 2, 'cyan', 3);
  for (const dx of [Math.floor(w / 2)]) p.rect(x + dx, top + 3, 1, 8, 'moss');
  // the seat
  p.rect(x + 3, top + 11, w - 6, 4, 'teal');
  p.rect(x + 3, top + 11, w - 6, 1, 'cyan');
  p.rect(x + 3, top + 15, w - 6, 4, 'moss');
  // the arms
  for (const ax of [x, x + w - 6]) {
    p.rect(ax + 1, top + 6, 4, 1, 'teal');
    p.rect(ax, top + 7, 6, 12, 'teal');
    p.rect(ax + 1, top + 7, 4, 1, 'cyan');
    p.rect(ax, top + 16, 6, 3, 'moss');
  }
  // the legs
  const legTop = top + 19;
  for (const lx of [x + 1, x + w - 3]) p.rect(lx, legTop, 2, floorTop + 2 - legTop, 'ember');
  p.rect(x + 1, floorTop + 2, w - 2, 1, 'ember', 0.5);
  // cushions: honey on the left, rosy on the right
  p.rect(x + 7, top + 4, 7, 7, 'honey');
  p.rect(x + 7, top + 10, 7, 1, 'amber');
  px(p, x + 7, top + 4, 'teal');
  px(p, x + 10, top + 7, 'amber');
  p.rect(x + w - 13, top + 5, 6, 6, 'rosy');
  p.rect(x + w - 13, top + 10, 6, 1, 'mauve');
  px(p, x + w - 8, top + 5, 'teal');
}

/** A round rug under the coffee table: maroon with a red border and honey dots. */
function paintRug(p: Painter, ox: number, floorTop: number): void {
  const x = ox + 32;
  const w = 58;
  p.rect(x + 2, floorTop + 3, w - 4, 1, 'red');
  p.rect(x, floorTop + 4, w, 3, 'red');
  p.rect(x + 2, floorTop + 7, w - 4, 1, 'red');
  p.rect(x + 3, floorTop + 4, w - 6, 3, 'maroon');
  for (let i = x + 5; i < x + w - 4; i += 4) px(p, i, floorTop + 5, i % 8 === 1 ? 'honey' : 'red');
}

/** The low coffee table: a wooden top on short legs, between you and your visitor. */
function paintTable(p: Painter, x: number, top: number, floorTop: number): void {
  const w = TABLE.w;
  const foot = floorTop + 5;
  // its shadow on the rug
  p.rect(x + 2, foot, w - 2, 1, 'ink', 0.5);
  // the legs
  for (const lx of [x + 2, x + w - 4]) {
    p.rect(lx, top + 4, 2, foot - top - 4, 'ember');
    px(p, lx, top + 4, 'plum');
  }
  // a shelf under the top
  p.rect(x + 3, top + 7, w - 6, 1, 'ember');
  p.rect(x + 6, top + 6, 6, 1, 'denim'); // a magazine
  p.rect(x + 7, top + 5, 4, 1, 'sky');
  // the top, a pixel proud of the apron
  p.rect(x, top, w, 1, 'honey');
  p.rect(x, top + 1, w, 1, 'amber');
  p.rect(x + 1, top + 2, w - 2, 1, 'ember');
  p.rect(x + 1, top + 3, w - 2, 1, 'plum');
}

/** The front door, closed: wooden panels, a peephole and a brass handle; shoes waiting on the mat. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 18;
  const h = floorTop - top;
  p.rect(x - 2, top - 2, w + 4, h + 2, 'paper');
  p.rect(x - 2, top - 2, 1, h + 2, 'fog');
  p.rect(x, top, w, h, 'amber');
  p.rect(x + w - 2, top, 2, h, 'ember');
  // panels
  for (const [py, ph] of [
    [4, 14],
    [22, h - 26],
  ] as const) {
    p.rect(x + 3, top + py, w - 7, ph, 'ember');
    p.rect(x + 4, top + py + 1, w - 9, ph - 1, 'amber');
  }
  px(p, x + 7, top + 2, 'ink'); // the peephole
  p.rect(x + 2, top + 22, 1, 3, 'honey'); // the handle
  px(p, x + 3, top + 22, 'honey');
  // the mat and the polished shoes for tomorrow
  p.rect(x - 1, floorTop + 1, w + 2, 2, 'moss');
  p.rect(x - 1, floorTop + 1, w + 2, 1, 'leaf');
  p.rect(x + 3, floorTop - 1, 5, 2, 'ink');
  p.rect(x + 9, floorTop - 1, 5, 2, 'ink');
  px(p, x + 4, floorTop - 1, 'fog');
  px(p, x + 10, floorTop - 1, 'fog');
}

/** A coat stand with tomorrow's clothes: the navy suit on a hanger, a white shirt and a red tie. */
function paintCoatStand(p: Painter, x: number, top: number, floorTop: number): void {
  // the stand
  p.rect(x, top, 1, floorTop - top, 'ember');
  px(p, x, top - 1, 'amber');
  p.rect(x - 2, top + 1, 2, 1, 'ember');
  p.rect(x + 1, top + 1, 2, 1, 'ember');
  p.rect(x - 4, floorTop - 1, 9, 1, 'ember');
  px(p, x - 4, floorTop - 2, 'ember');
  px(p, x + 4, floorTop - 2, 'ember');
  // the hanger
  px(p, x, top + 3, 'ink');
  p.rect(x - 1, top + 4, 3, 1, 'ink');
  p.rect(x - 5, top + 5, 11, 1, 'ink');
  // the jacket, its shoulders a little wider than the hanger
  const jy = top + 6;
  p.rect(x - 6, jy, 13, 16, 'denim');
  p.rect(x - 6, jy, 13, 1, 'sky');
  p.rect(x - 6, jy + 1, 1, 15, 'indigo');
  p.rect(x + 6, jy + 1, 1, 15, 'indigo');
  // the shirt and tie in the V of the lapels
  p.rect(x - 1, jy, 3, 6, 'paper');
  px(p, x - 2, jy, 'paper');
  px(p, x + 2, jy, 'paper');
  p.rect(x, jy + 1, 1, 7, 'red');
  px(p, x, jy + 8, 'maroon');
  px(p, x - 2, jy + 2, 'indigo');
  px(p, x + 2, jy + 2, 'indigo');
  p.rect(x, jy + 9, 1, 7, 'indigo'); // the opening
  px(p, x - 1, jy + 10, 'paper'); // a button
  px(p, x - 1, jy + 13, 'paper');
  px(p, x - 4, jy + 9, 'indigo'); // the pocket
  p.rect(x - 4, jy + 9, 3, 1, 'indigo');
  p.rect(x - 6, jy + 16, 13, 1, 'ink', 0.4);
}

/** A low bookcase with a radio and a photo on top. */
function paintBookcase(p: Painter, x: number, top: number, floorTop: number, seed: number): void {
  const w = 26;
  const bottom = floorTop + 1;
  p.rect(x, top, w, bottom - top, 'ember');
  p.rect(x, top, w, 1, 'amber');
  p.rect(x + 2, top + 2, w - 4, bottom - top - 4, 'plum');
  const colours: readonly PaletteName[] = ['denim', 'red', 'teal', 'lamp', 'paper', 'leaf', 'rosy'];
  for (let s = 0, sy = top + 12; sy <= bottom - 2; sy += 11, s++) {
    for (let bx = x + 2, i = 0; bx + 2 <= x + w - 2; i++) {
      const bw = 2 + Math.floor(hash2(i, seed + s, 53) * 2);
      if (bx + bw > x + w - 2) break;
      const bh = 6 + Math.floor(hash2(i, seed + s, 59) * 4);
      const c = colours[Math.floor(hash2(i, seed + s, 61) * colours.length)] ?? 'denim';
      if (hash2(i, seed + s, 67) > 0.1) p.rect(bx, sy - bh, bw, bh, c);
      bx += bw;
    }
    p.rect(x + 2, sy, w - 4, 1, 'amber');
  }
  // a radio and a framed photo on top
  p.rect(x + 3, top - 5, 9, 5, 'maroon');
  p.rect(x + 4, top - 4, 4, 3, 'ink');
  px(p, x + 10, top - 3, 'honey');
  p.rect(x + 10, top - 8, 1, 3, 'stone');
  p.rect(x + 16, top - 7, 6, 7, 'amber');
  p.rect(x + 17, top - 6, 4, 5, 'sky');
  p.rect(x + 17, top - 3, 4, 2, 'leaf');
}

/** A small round side table with a mug and a book. */
function paintSideTable(p: Painter, x: number, top: number, floorTop: number, seed: number): void {
  p.rect(x, top, 14, 2, 'amber');
  p.rect(x, top, 14, 1, 'honey');
  p.rect(x + 6, top + 2, 2, floorTop - top - 2, 'ember');
  p.rect(x + 3, floorTop - 1, 8, 1, 'ember');
  p.rect(x + 2, top - 2, 6, 2, mod(seed, 2) === 0 ? 'denim' : 'red');
  p.rect(x + 9, top - 3, 3, 3, 'paper');
  px(p, x + 12, top - 2, 'paper');
}

/** A wall calendar with Monday, the first day of work, ringed in red. */
function paintCalendar(p: Painter, x: number, y: number): void {
  p.rect(x, y, 12, 14, 'paper');
  p.rect(x, y, 12, 3, 'teal');
  px(p, x + 6, y - 1, 'ink');
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) px(p, x + 2 + col * 3, y + 5 + row * 3, 'stone');
  }
  p.rect(x + 1, y + 7, 3, 3, 'red');
  px(p, x + 2, y + 8, 'stone');
  p.rect(x + 1, y + 14, 11, 1, 'concrete');
}

/** A wall shelf with a plant, two framed photos and a small trophy of a candle. */
function paintWallShelf(p: Painter, x: number, y: number): void {
  p.rect(x, y, 34, 2, 'amber');
  p.rect(x, y + 2, 34, 1, 'ember');
  px(p, x + 3, y + 3, 'ember');
  px(p, x + 30, y + 3, 'ember');
  // a little plant
  p.rect(x + 2, y - 3, 4, 3, 'amber');
  p.rect(x + 1, y - 6, 2, 3, 'leaf');
  p.rect(x + 4, y - 7, 2, 4, 'moss');
  p.rect(x + 3, y - 5, 2, 2, 'leaf');
  // photos
  p.rect(x + 9, y - 8, 7, 8, 'ink');
  p.rect(x + 10, y - 7, 5, 6, 'sky');
  p.rect(x + 11, y - 5, 2, 2, 'skin');
  p.rect(x + 10, y - 3, 5, 2, 'denim');
  p.rect(x + 18, y - 6, 6, 6, 'amber');
  p.rect(x + 19, y - 5, 4, 4, 'rosy');
  px(p, x + 20, y - 4, 'paper');
  // a candle in a jar
  p.rect(x + 27, y - 4, 4, 4, 'paper');
  px(p, x + 28, y - 5, 'honey');
  px(p, x + 28, y - 6, 'lamp');
}

// ---------------------------------------------------------------------------
// The call panel: Ms. Carter's office at Harbor Trading

/** The panel with its rounded, inked border, the office inside and a phone badge on the corner. */
function paintPanel(p: Painter, x: number, y: number, ox: number): void {
  const { w, h } = PANEL;
  // a soft shadow on the room behind it
  p.rect(x + 2, y + 2, w, h, 'ink', 0.35);
  // the border: ink outside, paper inside, the corners rounded
  p.rect(x + 2, y, w - 4, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'ink');
  p.rect(x, y + 2, w, h - 4, 'ink');
  p.rect(x + 2, y + 1, w - 4, h - 2, 'paper');
  p.rect(x + 1, y + 2, w - 2, h - 4, 'paper');
  const ix = x + 2;
  const iy = y + 2;
  const iw = w - 4;
  const ih = h - 4;
  p.rect(ix + 1, iy, iw - 2, ih, 'ink');
  p.rect(ix, iy + 1, iw, ih - 2, 'ink');
  paintOffice(within(p, ix + 1, iy + 1, iw - 2, ih - 2), ix + 1, iy + 1, iw - 2, ih - 2, x, ox);
  paintPhoneBadge(p, x + 34, y - 2);
}

/** Inside the panel: the office wall, the harbour window, her desk and its phone. */
function paintOffice(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  px0: number,
  ox: number,
): void {
  const coreX = px0 - ox; // the panel's left edge in core pixels, so patterns never shift
  const bottom = y + h;
  const carpet = bottom - 6;
  const lower = carpet - 9;
  p.rect(x, y, w, lower - y, 'fog');
  glowEllipse(p, x + 20, y + 30, 26, 18, 'honey', [0.22, 0.12]);
  // the harbour window
  const wx = x + 2;
  const wy = y + 2;
  const ww = w - 4;
  const wh = 24;
  p.rect(wx, wy, ww, wh, 'paper');
  paintHarbour(within(p, wx + 2, wy + 2, ww - 4, wh - 4), wx + 2, wy + 2, ww - 4, wh - 4);
  p.rect(wx + Math.floor(ww / 2), wy + 2, 1, wh - 4, 'paper');
  p.rect(wx - 1, wy + wh, ww + 2, 1, 'paper');
  p.rect(wx - 1, wy + wh + 1, ww + 2, 1, 'concrete');
  // the plum lower wall under a pale rail, then slate carpet
  p.rect(x, lower, w, carpet - lower, 'plum');
  p.rect(x, lower, w, 1, 'paper');
  p.rect(x, lower + 1, w, 1, 'concrete');
  for (let lx = x + mod(3 - coreX, 12); lx < x + w; lx += 12) {
    p.rect(lx, lower + 3, 1, carpet - lower - 5, 'maroon');
  }
  p.rect(x, carpet - 2, w, 2, 'night');
  p.rect(x, carpet, w, bottom - carpet, 'slate');
  p.rect(x, carpet, w, 1, 'ink');
  for (let row = 0; carpet + 2 + row * 3 < bottom; row++) {
    for (let cx = x + (row % 2) * 4; cx < x + w; cx += 8) px(p, cx, carpet + 2 + row * 3, 'stone');
  }
  // her desk behind her, the desk phone on it, its cord hanging
  const dx = x + 37;
  const dtop = carpet - 12;
  p.rect(dx, dtop, 20, 1, 'honey');
  p.rect(dx, dtop + 1, 20, 2, 'amber');
  p.rect(dx + 1, dtop + 3, 19, 1, 'ember');
  p.rect(dx + 2, dtop + 4, 2, carpet + 3 - dtop - 4, 'ember');
  p.rect(dx + 12, dtop + 4, 7, carpet + 3 - dtop - 4, 'ember');
  p.rect(dx + 13, dtop + 6, 5, 1, 'amber');
  p.rect(dx + 13, dtop + 10, 5, 1, 'amber');
  // the phone's base, its cradle empty: she has the receiver
  p.rect(dx + 5, dtop - 3, 7, 3, 'ink');
  p.rect(dx + 6, dtop - 4, 5, 1, 'night');
  px(p, dx + 7, dtop - 2, 'red');
  px(p, dx + 9, dtop - 2, 'stone');
  for (let i = 0; i < 6; i++) px(p, dx + 4 - (i % 2), dtop - 2 + i, 'ink');
  // a stack of papers and a mug
  p.rect(dx + 14, dtop - 2, 5, 2, 'paper');
  p.rect(dx + 14, dtop - 2, 5, 1, 'fog');
  p.rect(dx + 1, dtop - 3, 2, 3, 'teal');
}

/** The harbour at dusk: rosy sky, the far shore with lights, a crane, a moored ship. */
function paintHarbour(p: Painter, x: number, y: number, w: number, h: number): void {
  const horizon = y + h - 7;
  ditherGradient(p, x, y, w, horizon - y, ['deep', 'indigo', 'violet', 'mauve', 'rosy']);
  ditherGradient(p, x, horizon, w, y + h - horizon, ['dusk', 'indigo', 'deep']);
  for (let i = 0; i < w; i += 5) {
    px(p, x + i + 1, horizon + 2 + (i % 3), i % 2 === 0 ? 'rosy' : 'violet');
  }
  px(p, x + 4, y + 2, 'fog');
  px(p, x + 30, y + 4, 'fog');
  px(p, x + 15, y + 1, 'paper');
  // the far shore
  for (let i = 0; i < w; i++) {
    const bump = Math.round(1.5 + Math.sin(i / 6) + Math.sin(i / 3.1) * 0.6);
    p.rect(x + i, horizon - bump, 1, bump + 1, 'night');
    if (hash2(i, 5, 89) < 0.14) px(p, x + i, horizon, hash2(i, 6, 97) < 0.5 ? 'honey' : 'lamp');
  }
  // the quay with containers and a crane
  const qx = x + 30;
  p.rect(qx, horizon - 1, 18, 2, 'ink');
  const boxes: readonly PaletteName[] = ['maroon', 'teal', 'ember', 'denim'];
  for (let i = 0; i < 4; i++) p.rect(qx + 1 + i * 4, horizon - 3, 3, 2, boxes[i] ?? 'teal');
  const cr = qx + 10;
  const boom = horizon - 9;
  p.rect(cr, boom, 1, 8, 'ink');
  p.rect(cr + 4, boom, 1, 8, 'ink');
  p.rect(cr - 10, boom, 18, 1, 'ink');
  p.rect(cr + 2, boom - 4, 1, 4, 'ink');
  for (let i = 1; i < 11; i++) px(p, cr + 2 - i, boom - 4 + Math.floor((i * 4) / 11), 'ink');
  px(p, cr + 2, boom - 5, 'red');
  p.rect(cr - 6, boom + 1, 1, 3, 'night');
  // a moored ship, bow to the left
  const sx = x + 4;
  const wl = horizon + 4;
  p.rect(sx + 1, wl - 3, 18, 3, 'ink');
  p.rect(sx, wl - 4, 19, 1, 'night');
  for (let i = 0; i < 3; i++) p.rect(sx + 3 + i * 4, wl - 6, 3, 2, boxes[(i + 1) % 4] ?? 'teal');
  p.rect(sx + 14, wl - 8, 4, 4, 'night');
  px(p, sx + 15, wl - 7, 'honey');
  p.rect(sx + 15, wl - 10, 1, 2, 'ink');
  px(p, sx + 15, wl + 1, 'lamp');
}

/**
 * The phone badge on the panel's top edge: a rounded paper tag in an ink rim,
 * a handset and two signal arcs. O rim, w paper, k handset, t arcs.
 */
const BADGE: readonly string[] = [
  '.OOOOOOOOOOOOOO.',
  'OwwwwwwwwwwwwwwO',
  'OwwkkwwwwwwtwwwO',
  'OwkkkkwwwwwwtwwO',
  'OwkkkwwwwtwwwtwO',
  'OwwkkwwwwwtwwtwO',
  'OwwkkwwwwwtwwtwO',
  'OwwwkkwwwkwwwwwO',
  'OwwwwkkwkkkwwwwO',
  'OwwwwwkkkkwwwwwO',
  'OwwwwwwkkwwwwwwO',
  'OwwwwwwwwwwwwwwO',
  '.OOOOOOOOOOOOOO.',
];
const BADGE_COLOURS: Readonly<Record<string, PaletteName>> = {
  O: 'ink',
  w: 'paper',
  k: 'ink',
  t: 'teal',
};

function paintPhoneBadge(p: Painter, x: number, y: number): void {
  BADGE.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const c = BADGE_COLOURS[row[dx] ?? '.'];
      if (c) px(p, x + dx, y + dy, c);
    }
  });
  p.rect(x + 1, y + BADGE.length, 15, 1, 'ink', 0.35);
}

export const DAY_BEFORE_STAGE: StageConfig = {
  paint: paintHome,
  backdrops: { manager: paintCall },
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...BY_TABLE, side: 'right' },
    // Alone she stands where Ms. Carter would; with Ms. Carter there too
    // she steps back by the coat stand.
    neighbor: {
      sprite: NEIGHBOR_SPRITE,
      ...BY_TABLE,
      side: 'right',
      beside: { x: 96, y: BY_TABLE.y },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 85, y: 25 } },
  rest: {
    left: { x: TABLE.x + 2, y: PROP_TOP },
    right: { x: TABLE.x + 16, y: PROP_TOP },
  },
};
