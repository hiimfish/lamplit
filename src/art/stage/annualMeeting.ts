import {
  ditherGradient,
  ditherRect,
  ellipse,
  glowEllipse,
  hash2,
  lightPool,
  px,
  type Painter,
} from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import { CLIENT_SPRITE, DIRECTOR_SPRITE, SUPPLIER_SPRITE } from './act3Cast';
import {
  clipped,
  coreOrigin,
  CORE_W,
  paintClock,
  paintFloor,
  paintLamp,
  paintPicture,
  paintPlant,
  paintWainscot,
  paintWindow,
} from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/**
 * The annual meeting stage, three pictures of it.
 *
 * `paint`: the conference hall of the Riverside Hotel on the day. Wine-red
 * fabric walls under warm chandeliers; on the right a low stage between red
 * drapes, with the big screen (a rising bar chart and a desk lamp, no text)
 * and the wooden lectern with its microphone; in front, a round table under a
 * white cloth with water glasses, where handed-over things rest. Behind you
 * more round tables and gold banquet chairs; a patterned hotel carpet.
 *
 * `backdrops.director`: Harbor Trading's own meeting room a week before,
 * where the agenda is planned: a whiteboard with the day's plan in scribbles,
 * the harbour window at dusk, a wooden table under a pendant lamp.
 *
 * `backdrops.client`: the same hall, its screen grown into a big framed video
 * panel with a play bar, Mr. Hughes in his office in England inside it
 * (rain on the window, a clock tower, a small flag, a Lantern lamp).
 *
 * Ms. Carter stands by the table; Jack next to her; Mr. Ellis nearest the
 * lectern. Each picture fills any size: the 128x64 core sits centred near the
 * bottom, the wall and the ceiling go up above it, and more tables, chairs,
 * windows or plants continue to both sides. Palette colours only, whole pixels.
 */

/** The round table in front: left edge, width and the y of its top (props rest on it). */
const TABLE = { x: 36, w: 31, top: 47 } as const;
/** 24x24 pictures stand on the cloth with their shadow on it. */
const PROP_TOP = TABLE.top - 20;

const FLOOR_TOP = 54;
/** The brass dado rail on the wall. */
const RAIL_Y = 44;
/** The low stage: its left edge, the y of its top and of its front lip's bottom, how far it runs past the core. */
const PLATFORM = { x: 58, top: 45, lip: 53, tail: 14 } as const;
/** The hall's big screen: its outer frame. */
const SCREEN = { x: 70, y: 4, w: 46, h: 28 } as const;
/** The lectern on the stage: its left edge and the y of its top. */
const LECTERN = { x: 112, top: 33 } as const;
/** The video panel Mr. Hughes speaks from: its outer frame. */
const PANEL = { x: 58, y: 1, w: 68, h: 48 } as const;
/** The bottom of the panel's picture: below it is the play bar (Mr. Hughes is cut off here). */
const PANEL_PICTURE_END = PANEL.y + PANEL.h - 6;
/** Width of one bay beside the core. */
const BAY_W = 44;
/** Wall above the core needed for the chandeliers over the core, and for the ceiling. */
const CHANDELIER_MIN = 16;
const CEILING_MIN = 44;
/** How far above the core the ceiling's cornice sits. */
const CEILING_UP = 30;
/** A cornice this far down or further gets a gallery of windows under a second, higher ceiling. */
const UPPER_MIN = 60;
const UPPER_CEILING = 22;

/** By the table; next to her; nearest the lectern. */
const BY_TABLE = { x: 64, y: 39 } as const;
const MIDDLE = { x: 80, y: 39 } as const;
const BY_LECTERN = { x: 96, y: 39 } as const;
/** Mr. Hughes inside the video panel, shown from the waist up. */
const IN_VIDEO = { x: 92, y: PANEL_PICTURE_END - 16 } as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A painter that only paints inside one rectangle (a screen, a window's glass). */
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

// ---------------------------------------------------------------------------
// The hotel hall

/** The bays beside the core in the hall: [left x, its number], left ones first. */
function hallBays(w: number, ox: number): [number, number][] {
  const bays: [number, number][] = [];
  for (let x = ox - BAY_W, i = 1; x + BAY_W > 0; x -= BAY_W, i++) bays.push([x, i]);
  for (let x = ox + CORE_W + PLATFORM.tail + 6, i = 0; x < w; x += BAY_W, i++) bays.push([x, i]);
  return bays;
}

/** Paints the hotel conference hall to fill a w x h stage (at least the 128x64 core). */
function paint(target: Painter, w: number, h: number): void {
  paintHall(clipped(target, w, h), w, h, false);
}

/** Paints the hall with its screen playing Mr. Hughes' recorded speech. */
function paintVideo(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  paintHall(p, w, h, true);
  const { ox, oy } = coreOrigin(w, h);
  paintVideoPanel(p, ox + PANEL.x, oy + PANEL.y);
}

function paintHall(p: Painter, w: number, h: number, video: boolean): void {
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const railY = oy + RAIL_Y;
  const stageX = ox + PLATFORM.x;
  const stageEnd = ox + CORE_W + PLATFORM.tail;
  const ceiling = oy >= CEILING_MIN ? oy - CEILING_UP : 0;
  const bays = hallBays(w, ox);

  // The wall: wine-red fabric, warm where the chandeliers light it.
  p.rect(0, 0, w, railY, 'plum');
  paintWallPanels(p, w, ox, ceiling, railY);
  const lit = { y0: ceiling, y1: railY };
  const chandeliers = bays.map(([x]) => x + BAY_W / 2);
  chandeliers.push(ox + 12);
  if (oy >= CHANDELIER_MIN) chandeliers.push(ox + 56);
  for (const cx of chandeliers) {
    lightPool(p, cx, Math.max(oy - 4, 4), 22, 16, [['mauve', 0.18]], lit);
    glowEllipse(p, cx, Math.max(oy - 4, 4), 28, 22, 'honey', [0.12, 0.07, 0.03]);
  }
  // On a very tall stage a gallery of arched windows runs above the cornice, under the ceiling.
  const hangFrom = ceiling >= UPPER_MIN ? UPPER_CEILING : ceiling;
  if (ceiling >= UPPER_MIN) {
    paintGallery(p, w, ox, UPPER_CEILING, ceiling);
    paintCeiling(p, w, ox, UPPER_CEILING);
    paintCornice(p, w, ox, UPPER_CEILING);
    paintCornice(p, w, ox, ceiling);
  } else if (ceiling > 0) {
    paintCeiling(p, w, ox, ceiling);
    paintCornice(p, w, ox, ceiling);
  }

  paintLowerWall(p, w, ox, railY, floorTop);
  paintCarpet(p, w, ox, floorTop, h);

  // Sconces between the bays, on the wall above the rail.
  for (const [x] of bays) paintSconce(p, x, oy + 22);

  // The stage: drapes, the screen, the platform and the lectern.
  paintStageDrapes(p, stageX, stageEnd, oy, ceiling);
  if (!video) paintScreen(p, ox + SCREEN.x, oy + SCREEN.y);
  paintPlatform(p, stageX, stageEnd, oy + PLATFORM.top, oy + PLATFORM.lip);
  paintLectern(p, ox + LECTERN.x, oy + LECTERN.top, oy + PLATFORM.top + 2);

  // The chandeliers, hanging from the ceiling (or from above the picture).
  for (const cx of chandeliers) {
    const cy = cx === ox + 12 && oy < CHANDELIER_MIN ? 5 : oy - 9;
    paintChandelier(p, cx, hangFrom, cy);
  }

  // Guest tables behind you and in every bay; a row of chairs in every other bay.
  paintGuestTable(p, ox + 4, oy, 0);
  for (const [x, i] of bays) {
    if (i % 2 === 0) paintChairRow(p, x + 6, oy + 42, i);
    else paintGuestTable(p, x + 22, oy, i);
  }

  paintFrontTable(p, ox + TABLE.x, oy + TABLE.top, TABLE.w);
}

/** Tall fabric panels in thin dark mouldings, the light falling off towards the top. */
function paintWallPanels(p: Painter, w: number, ox: number, top: number, railY: number): void {
  ditherRect(p, 0, top, w, 3, 'night', 6);
  const panelTop = top + 5;
  for (let x = mod(ox + 2, 22) - 22; x < w; x += 22) {
    p.rect(x, panelTop, 18, 1, 'maroon');
    p.rect(x, railY - 4, 18, 1, 'maroon');
    p.rect(x, panelTop, 1, railY - 4 - panelTop, 'maroon');
    p.rect(x + 17, panelTop, 1, railY - 4 - panelTop, 'maroon');
    p.rect(x + 1, panelTop + 1, 16, 1, 'neonDeep');
  }
}

/** A coffered ceiling with small downlights down to y `bottom`. */
function paintCeiling(p: Painter, w: number, ox: number, bottom: number): void {
  p.rect(0, 0, w, bottom, 'night');
  for (let y = bottom; y > -12; y -= 12) {
    p.rect(0, y, w, 1, 'slate');
    for (let x = mod(ox + 6, 24) - 24; x < w; x += 24) {
      p.rect(x, y - 11, 1, 11, 'slate');
      p.rect(x + 11, y - 7, 3, 2, 'slate');
      px(p, x + 12, y - 6, 'honey');
    }
  }
}

/** A gilded cornice at y. */
function paintCornice(p: Painter, w: number, ox: number, y: number): void {
  p.rect(0, y - 2, w, 1, 'ember');
  p.rect(0, y - 1, w, 1, 'amber');
  p.rect(0, y, w, 2, 'ember');
  for (let x = mod(ox, 4); x < w; x += 4) px(p, x, y + 1, 'amber');
  p.rect(0, y + 2, w, 1, 'maroon');
}

/** The upper wall between two cornices: tall arched windows onto the night city. */
function paintGallery(p: Painter, w: number, ox: number, top: number, bottom: number): void {
  p.rect(0, top, w, bottom - top, 'plum');
  ditherRect(p, 0, top, w, 4, 'night', 8);
  const winTop = top + 8;
  const winBottom = bottom - 6;
  if (winBottom - winTop < 16) return;
  for (let cx = mod(ox + 20, 44) - 44; cx < w + 44; cx += 44) {
    const x = cx - 8;
    p.rect(x - 1, winTop + 2, 18, winBottom - winTop - 1, 'amber');
    p.rect(x + 2, winTop - 1, 12, 3, 'amber');
    const glass = within(p, x, winTop, 16, winBottom - winTop);
    ditherGradient(glass, x, winTop, 16, winBottom - winTop, ['deep', 'deep', 'indigo', 'dusk']);
    glass.rect(x, winTop, 3, 3, 'amber');
    glass.rect(x + 13, winTop, 3, 3, 'amber');
    px(glass, x + 3, winTop, 'amber');
    px(glass, x + 12, winTop, 'amber');
    // far towers with lit windows near the bottom, a few stars above
    for (let i = 0; i < 16; i++) {
      const th = 4 + Math.floor(hash2(cx - ox, i, 61) * 9);
      glass.rect(x + i, winBottom - th, 1, th, 'night');
      if (hash2(cx - ox, i, 67) < 0.3) px(glass, x + i, winBottom - th + 2, 'honey');
      if (hash2(cx - ox, i, 71) < 0.15) {
        px(glass, x + i, winTop + 4 + Math.floor(hash2(cx - ox, i, 73) * 10), 'fog');
      }
    }
    glass.rect(x + 7, winTop, 2, winBottom - winTop, 'amber');
    p.rect(x - 2, winBottom, 20, 2, 'amber');
    p.rect(x - 2, winBottom + 2, 20, 1, 'maroon');
  }
}

/** Dark wood below the rail, a gold line on top, a skirting board at the floor. */
function paintLowerWall(p: Painter, w: number, ox: number, top: number, floorTop: number): void {
  p.rect(0, top, w, floorTop - top, 'maroon');
  p.rect(0, top, w, 1, 'amber');
  p.rect(0, top + 1, w, 1, 'ember');
  for (let x = mod(ox + 9, 14) - 14; x < w; x += 14) {
    p.rect(x, top + 3, 1, floorTop - top - 5, 'plum');
  }
  p.rect(0, floorTop - 2, w, 2, 'night');
}

/** The hotel carpet: deep red with a small repeating gold and red pattern, counted from the core. */
function paintCarpet(p: Painter, w: number, ox: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'maroon');
  p.rect(0, floorTop, w, 1, 'night');
  for (let row = 0; floorTop + 2 + row * 4 < h; row++) {
    const y = floorTop + 2 + row * 4;
    const shift = (row % 2) * 4;
    for (let x = mod(ox + shift, 8) - 8; x < w; x += 8) {
      px(p, x, y, 'amber');
      p.rect(x - 1, y + 2, 3, 1, 'red');
    }
  }
  // the chandeliers' light on the carpet, near the wall
  ditherRect(p, 0, floorTop + 1, w, 1, 'plum', 8);
}

/** A brass wall light with two small shades, at (cx, y). */
function paintSconce(p: Painter, cx: number, y: number): void {
  glowEllipse(p, cx, y, 9, 7, 'honey', [0.25, 0.12]);
  p.rect(cx, y + 1, 1, 5, 'amber');
  p.rect(cx - 3, y + 3, 7, 1, 'amber');
  for (const sx of [cx - 4, cx + 2]) {
    p.rect(sx, y - 1, 3, 1, 'paper');
    p.rect(sx - 1, y, 5, 2, 'paper');
    p.rect(sx - 1, y + 1, 5, 1, 'honey');
  }
}

/** A tiered crystal chandelier: a chain from `top`, a gold frame, candle bulbs and drops; centred at (cx, cy). */
function paintChandelier(p: Painter, cx: number, top: number, cy: number): void {
  glowEllipse(p, cx, cy + 2, 14, 9, 'honey', [0.3, 0.16, 0.07]);
  if (cy - 4 > top) p.rect(cx, top, 1, cy - 4 - top, 'amber');
  p.rect(cx - 1, cy - 4, 3, 2, 'amber');
  // the upper tier
  p.rect(cx - 4, cy - 1, 9, 1, 'amber');
  for (const bx of [cx - 4, cx, cx + 4]) {
    px(p, bx, cy - 2, 'honey');
    px(p, bx, cy, 'paper');
  }
  // the lower tier, wider
  p.rect(cx - 7, cy + 2, 15, 1, 'amber');
  p.rect(cx - 6, cy + 3, 13, 1, 'ember');
  for (const bx of [cx - 7, cx - 3, cx + 1, cx + 5, cx + 7]) px(p, bx, cy + 1, 'honey');
  for (let dx = -6; dx <= 6; dx += 2) {
    px(p, cx + dx, cy + 4, dx % 4 === 0 ? 'paper' : 'cyan');
    if (Math.abs(dx) <= 2) px(p, cx + dx, cy + 5, 'paper');
  }
  px(p, cx, cy + 6, 'cyan');
}

/** Red velvet drapes on both sides of the screen under a gold-fringed valance, the whole stage wide. */
function paintStageDrapes(p: Painter, x: number, end: number, oy: number, ceiling: number): void {
  const valance = Math.max(ceiling + 3, oy - 6);
  const bottom = oy + PLATFORM.top;
  // the dark stage wall behind the screen
  p.rect(x, valance, end - x, bottom - valance, 'night');
  ditherRect(p, x, valance, end - x, bottom - valance, 'plum', 4);
  // drapes, folds in lighter and darker red, tied back near the bottom
  for (const [dx, dw] of [
    [x, 11],
    [end - 11, 11],
  ] as const) {
    p.rect(dx, valance, dw, bottom - valance, 'maroon');
    for (let fx = dx + 1; fx < dx + dw; fx += 3) p.rect(fx, valance, 1, bottom - valance, 'red');
    p.rect(dx, bottom - 12, dw, 1, 'honey');
  }
  // the valance
  p.rect(x - 2, valance - 3, end - x + 4, 4, 'red');
  p.rect(x - 2, valance - 3, end - x + 4, 1, 'amber');
  p.rect(x - 2, valance + 1, end - x + 4, 1, 'maroon');
  for (let fx = x - 2; fx < end + 2; fx += 2) px(p, fx, valance + 2, 'honey');
}

/** The big screen: a rising bar chart and the Lantern lamp, glowing in the dim stage. */
function paintScreen(target: Painter, x: number, y: number): void {
  const { w, h } = SCREEN;
  glowEllipse(target, x + w / 2, y + h / 2, w / 2 + 8, h / 2 + 7, 'sky', [0.18, 0.1, 0.05]);
  target.rect(x, y, w, h, 'ink');
  target.rect(x + 1, y + h, w - 1, 1, 'night');
  const p = within(target, x + 1, y + 1, w - 2, h - 2);
  ditherGradient(p, x + 1, y + 1, w - 2, h - 2, ['deep', 'indigo', 'indigo']);
  // the bars, a month at a time, growing
  const base = y + h - 5;
  p.rect(x + 4, base + 1, 24, 1, 'stone');
  const bars = [3, 5, 6, 8, 10, 13];
  bars.forEach((bh, i) => {
    p.rect(x + 5 + i * 4, base - bh + 1, 3, bh, i === bars.length - 1 ? 'cyan' : 'teal');
    px(p, x + 5 + i * 4, base - bh + 1, 'cyan');
  });
  // the trend line and its arrowhead
  const pts: [number, number][] = [
    [x + 5, base - 6],
    [x + 13, base - 9],
    [x + 21, base - 13],
    [x + 27, base - 17],
  ];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i] ?? [0, 0];
    const [bx, by] = pts[i + 1] ?? [0, 0];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
    for (let s = 0; s <= steps; s++) {
      px(
        p,
        Math.round(ax + ((bx - ax) * s) / steps),
        Math.round(ay + ((by - ay) * s) / steps),
        'honey',
      );
    }
  }
  p.rect(x + 26, base - 18, 3, 1, 'honey');
  p.rect(x + 28, base - 18, 1, 3, 'honey');
  // the Lantern lamp: a round base, a bent arm, the shade and its light
  const lx = x + 34;
  const ly = y + 6;
  for (let r = 0; r < 10; r++) {
    p.rect(lx + 4 - Math.floor(r / 2), ly + 4 + r, 2 + r, 1, 'dusk');
  }
  p.rect(lx - 1, ly + 14, 11, 1, 'violet');
  p.rect(lx + 2, ly, 6, 2, 'lamp');
  p.rect(lx + 1, ly + 2, 8, 2, 'lamp');
  p.rect(lx + 1, ly + 3, 8, 1, 'amber');
  p.rect(lx + 4, ly + 4, 2, 1, 'honey');
  p.rect(lx + 7, ly - 2, 1, 2, 'fog');
  p.rect(lx + 8, ly - 3, 1, 1, 'fog');
  p.rect(lx + 9, ly - 3, 1, 9, 'fog');
  p.rect(lx + 9, ly + 6, 1, 8, 'fog');
  p.rect(lx + 6, ly + 14, 7, 2, 'paper');
  p.rect(lx + 6, ly + 15, 7, 1, 'fog');
  // the frame's edge
  target.rect(x, y, w, 1, 'stone');
}

/** The low stage: a carpeted top and a wooden front with a gold edge. */
function paintPlatform(p: Painter, x: number, end: number, top: number, lip: number): void {
  p.rect(x, top, end - x, 3, 'red');
  p.rect(x, top, end - x, 1, 'neonDeep');
  p.rect(x, top + 3, end - x, 1, 'honey');
  p.rect(x, top + 4, end - x, lip - top - 4, 'ember');
  for (let px0 = x + 4; px0 < end; px0 += 10) p.rect(px0, top + 5, 1, lip - top - 6, 'plum');
  p.rect(x, lip - 1, end - x, 1, 'plum');
  // its steps down at the end
  p.rect(end, top + 3, 4, lip - top - 3, 'ember');
  p.rect(end, top + 3, 4, 1, 'amber');
  p.rect(end + 4, top + 6, 3, lip - top - 6, 'ember');
  p.rect(end + 4, top + 6, 3, 1, 'amber');
}

/** The wooden lectern: a slanted top, a gold lamp badge, the gooseneck microphone; stands on `foot`. */
function paintLectern(p: Painter, x: number, top: number, foot: number): void {
  p.rect(x + 1, foot, 11, 1, 'night');
  p.rect(x - 1, top, 13, 2, 'amber');
  p.rect(x - 1, top + 2, 13, 1, 'ember');
  p.rect(x, top + 3, 11, foot - top - 3, 'ember');
  p.rect(x, top + 3, 1, foot - top - 3, 'amber');
  p.rect(x + 9, top + 3, 2, foot - top - 3, 'plum');
  p.rect(x - 1, foot - 2, 13, 2, 'amber');
  // the badge: a small lamp
  p.rect(x + 3, top + 6, 5, 2, 'honey');
  p.rect(x + 5, top + 8, 1, 3, 'honey');
  p.rect(x + 4, top + 11, 3, 1, 'honey');
  // the microphone on its gooseneck, leaning to the speaker
  p.rect(x + 2, top - 1, 1, 1, 'ink');
  p.rect(x + 1, top - 2, 1, 1, 'ink');
  p.rect(x, top - 4, 1, 2, 'ink');
  p.rect(x - 1, top - 6, 2, 2, 'stone');
  px(p, x - 1, top - 6, 'fog');
}

/** A round guest table under a white cloth with glasses and a small candle, two gold chairs; centred at cx. */
function paintGuestTable(p: Painter, cx: number, oy: number, n: number): void {
  const top = oy + 45;
  // chairs behind it
  for (const dx of [-9, 6]) {
    p.rect(cx + dx, top - 7, 4, 1, 'amber');
    p.rect(cx + dx, top - 6, 1, 6, 'amber');
    p.rect(cx + dx + 3, top - 6, 1, 6, 'amber');
    p.rect(cx + dx + 1, top - 5, 2, 1, 'honey');
    p.rect(cx + dx + 1, top - 3, 2, 1, 'amber');
  }
  ellipse(p, cx, top + 1, 11, 1, 'paper');
  p.rect(cx - 11, top + 1, 23, 8, 'paper');
  p.rect(cx - 11, top + 2, 2, 7, 'fog');
  p.rect(cx + 9, top + 2, 3, 7, 'fog');
  for (let fx = cx - 7; fx < cx + 9; fx += 4) p.rect(fx, top + 3, 1, 6, 'fog');
  p.rect(cx - 10, top + 9, 21, 1, 'night');
  // glasses of water and a candle in the middle
  for (const gx of [cx - 7, cx + 6]) {
    p.rect(gx, top - 3, 2, 3, 'sky');
    px(p, gx, top - 3, 'paper');
  }
  p.rect(cx - 1, top - 2, 2, 2, 'paper');
  px(p, cx - 1 + (n % 2), top - 3, 'honey');
}

/** A row of three gold banquet chairs seen from behind, red seats; left edge x, top of the backs y. */
function paintChairRow(p: Painter, x: number, y: number, n: number): void {
  for (let i = 0; i < 3; i++) {
    const cx = x + i * 11 + (n % 2);
    p.rect(cx, y, 7, 1, 'amber');
    p.rect(cx, y + 1, 1, 11, 'amber');
    p.rect(cx + 6, y + 1, 1, 11, 'amber');
    for (let r = 2; r < 7; r += 2) p.rect(cx + 1, y + r, 5, 1, 'honey');
    p.rect(cx - 1, y + 7, 9, 2, 'red');
    p.rect(cx - 1, y + 8, 9, 1, 'maroon');
    p.rect(cx, y + 9, 1, 3, 'ember');
    p.rect(cx + 6, y + 9, 1, 3, 'ember');
  }
}

/** The round table in front, its long white cloth to the floor, water glasses at both sides. */
function paintFrontTable(p: Painter, x: number, top: number, w: number): void {
  const cx = x + Math.floor(w / 2);
  const feet = top + 16;
  // the warm light from above on the carpet around it
  ditherRect(p, x - 2, feet - 1, w + 4, 2, 'night', 10);
  ellipse(p, cx, top + 1, Math.floor(w / 2), 1, 'paper');
  p.rect(x, top + 2, w, feet - top - 3, 'paper');
  // the cloth's folds, darker at the sides where it turns away
  p.rect(x, top + 3, 2, feet - top - 4, 'fog');
  p.rect(x + w - 3, top + 3, 3, feet - top - 4, 'fog');
  for (let fx = x + 5; fx < x + w - 4; fx += 5) p.rect(fx, top + 5, 1, feet - top - 6, 'fog');
  p.rect(x + 1, feet - 2, w - 2, 1, 'fog');
  // the chandelier's light on the top
  p.rect(x + 6, top + 1, w - 12, 1, 'honey');
  ditherRect(p, x + 4, top + 2, w - 8, 1, 'honey', 6);
  // a glass of water at each side
  for (const gx of [x + 1, x + w - 3]) {
    p.rect(gx, top - 3, 2, 3, 'sky');
    px(p, gx, top - 3, 'paper');
    px(p, gx + 1, top - 1, 'denim');
  }
}

/** The screen turned video: Mr. Hughes' office in England, a play bar under the picture. */
function paintVideoPanel(target: Painter, x: number, y: number): void {
  const { w, h } = PANEL;
  glowEllipse(target, x + w / 2, y + h / 2, w / 2 + 6, h / 2 + 5, 'sky', [0.2, 0.1]);
  // the frame, its corners rounded
  target.rect(x + 1, y, w - 2, h, 'ink');
  target.rect(x, y + 1, w, h - 2, 'ink');
  target.rect(x + 2, y + 1, w - 4, 1, 'stone');
  const picX = x + 3;
  const picY = y + 3;
  const picW = w - 6;
  const picH = PANEL_PICTURE_END - PANEL.y - 3;
  const p = within(target, picX, picY, picW, picH);
  // his office: wood panelling, warm lamp light
  p.rect(picX, picY, picW, picH, 'ember');
  for (let fx = picX + 3; fx < picX + picW; fx += 8) p.rect(fx, picY, 1, picH, 'plum');
  glowEllipse(p, picX + picW - 9, picY + 12, 16, 14, 'honey', [0.22, 0.12]);
  // the window: a rainy evening, a clock tower, a red bus
  const wx = picX + 4;
  const wy = picY + 4;
  p.rect(wx - 1, wy - 1, 22, 21, 'paper');
  ditherGradient(p, wx, wy, 20, 19, ['deep', 'indigo', 'dusk']);
  p.rect(wx + 4, wy + 4, 4, 15, 'night');
  p.rect(wx + 5, wy + 2, 2, 2, 'night');
  px(p, wx + 5, wy + 1, 'night');
  p.rect(wx + 5, wy + 6, 2, 2, 'honey');
  p.rect(wx + 11, wy + 12, 9, 7, 'night');
  p.rect(wx + 1, wy + 15, 8, 3, 'red');
  p.rect(wx + 2, wy + 16, 5, 1, 'honey');
  for (let i = 0; i < 9; i++) {
    const rx = wx + Math.floor(hash2(i, 3, 41) * 20);
    const ry = wy + Math.floor(hash2(i, 5, 43) * 16);
    p.rect(rx, ry, 1, 2, 'sky');
  }
  p.rect(wx + 10, wy, 1, 19, 'paper');
  p.rect(wx, wy + 9, 20, 1, 'paper');
  // a shelf on the right: a small flag, a Lantern lamp, books
  const sx = picX + picW - 22;
  const sy = picY + 16;
  p.rect(sx, sy, 22, 2, 'amber');
  p.rect(sx, sy + 2, 22, 1, 'plum');
  paintFlag(p, sx + 2, sy - 6);
  p.rect(sx + 15, sy - 1, 5, 1, 'fog');
  p.rect(sx + 17, sy - 6, 1, 5, 'fog');
  p.rect(sx + 14, sy - 8, 6, 2, 'lamp');
  p.rect(sx + 14, sy - 7, 6, 1, 'amber');
  ditherRect(p, sx + 13, sy - 5, 8, 4, 'honey', 5);
  // books on the shelf below
  const by = sy + 14;
  p.rect(sx, by, 22, 2, 'amber');
  const books: PaletteName[] = ['teal', 'red', 'denim', 'moss', 'paper', 'maroon', 'teal'];
  books.forEach((c, i) => p.rect(sx + 1 + i * 3, by - 7 + (i % 3), 2, 7 - (i % 3), c));
  // the play bar: a play mark, the time gone by, the time left
  const barY = PANEL_PICTURE_END - PANEL.y + y;
  target.rect(x + 3, barY, w - 6, 4, 'ink');
  target.rect(x + 5, barY + 1, 1, 3, 'paper');
  target.rect(x + 6, barY + 2, 1, 1, 'paper');
  target.rect(x + 10, barY + 2, w - 16, 1, 'stone');
  target.rect(x + 10, barY + 2, 30, 1, 'honey');
  target.rect(x + 40, barY + 1, 2, 3, 'paper');
}

/** A tiny flag on a stick, 7x5. */
function paintFlag(p: Painter, x: number, y: number): void {
  p.rect(x, y, 7, 5, 'denim');
  p.rect(x, y + 2, 7, 1, 'paper');
  p.rect(x + 3, y, 1, 5, 'paper');
  p.rect(x, y + 2, 7, 1, 'red');
  p.rect(x + 3, y, 1, 5, 'red');
  px(p, x, y, 'paper');
  px(p, x + 6, y + 4, 'paper');
  p.rect(x - 1, y, 1, 6, 'ink');
}

// ---------------------------------------------------------------------------
// The meeting room at Harbor Trading, a week before

/** The meeting room's whiteboard: its outer frame. */
const BOARD = { x: 40, y: 7, w: 44, h: 26 } as const;
/** The harbour window in the core. */
const ROOM_WINDOW = { x: 96, y: 8 } as const;
/** Wall above the core needed for the pictures, and for the ceiling; how far above the core the ceiling is. */
const PICTURE_MIN = 26;
const ROOM_CEILING_MIN = 40;
const ROOM_CEILING_UP = 32;

/** Paints Harbor Trading's meeting room to fill a w x h stage. */
function paintBoardroom(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const railY = oy + RAIL_Y;

  // The bays beside the core: windows and plants by turns.
  const bays: [number, number][] = [];
  for (let x = ox - BAY_W, i = 1; x + BAY_W > 0; x -= BAY_W, i++) bays.push([x, i]);
  for (let x = ox + CORE_W, i = 0; x < w; x += BAY_W, i++) bays.push([x, i]);
  const lamps = [ox + 60, ...bays.filter(([, i]) => i % 2 === 1).map(([x]) => x + BAY_W / 2)];

  p.rect(0, 0, w, railY, 'dusk');
  ditherRect(p, 0, 0, w, Math.min(railY, 6), 'indigo', 6);
  for (const lx of lamps) glowEllipse(p, lx, oy + 16, 30, 22, 'honey', [0.18, 0.1, 0.05]);
  paintWainscot(p, w, railY, floorTop);
  paintFloor(p, w, floorTop, h);

  for (const [x, i] of bays) {
    if (i % 2 === 0) paintWindow(p, x + 8, oy + 8);
    else paintPlant(p, x + 17, oy + 34);
  }
  paintWindow(p, ox + ROOM_WINDOW.x, oy + ROOM_WINDOW.y);
  paintClock(p, ox + 20, oy + 12);
  paintPlant(p, ox + 2, oy + 34);
  paintWhiteboard(p, ox + BOARD.x, oy + BOARD.y);
  // Up the wall: pictures and a Lantern poster, then the ceiling (and high windows on a very tall stage).
  if (oy >= PICTURE_MIN) {
    paintLanternPoster(p, ox + BOARD.x - 4, oy - 22);
    for (const [x, i] of bays) if (i % 2 === 0) paintPicture(p, x + 11, oy - 22);
    paintPicture(p, ox + ROOM_WINDOW.x + 3, oy - 22);
  }
  for (const lx of lamps) paintLamp(p, lx, oy);
  const ceiling = oy >= ROOM_CEILING_MIN ? oy - ROOM_CEILING_UP : 0;
  if (ceiling >= UPPER_MIN) {
    paintHighWindows(p, w, ox, UPPER_CEILING, ceiling);
    paintTiles(p, w, ox, UPPER_CEILING);
    paintSoffit(p, w, UPPER_CEILING);
    paintSoffit(p, w, ceiling);
  } else if (ceiling > 0) {
    paintTiles(p, w, ox, ceiling);
    paintSoffit(p, w, ceiling);
  }
  paintMeetingTable(p, ox + TABLE.x, oy + TABLE.top, TABLE.w, floorTop);
}

/** A suspended ceiling of pale tiles with a few recessed lights, down to y `bottom`. */
function paintTiles(p: Painter, w: number, ox: number, bottom: number): void {
  p.rect(0, 0, w, bottom, 'stone');
  for (let y = bottom; y > -10; y -= 10) {
    p.rect(0, y, w, 1, 'slate');
    for (let x = mod(ox + 4, 20) - 20; x < w; x += 20) {
      p.rect(x, y - 9, 1, 9, 'slate');
      if (hash2(x - ox, y, 91) < 0.4) p.rect(x + 7, y - 6, 6, 3, 'honey');
    }
  }
}

/** The ceiling's edge on the wall. */
function paintSoffit(p: Painter, w: number, y: number): void {
  p.rect(0, y, w, 2, 'fog');
  p.rect(0, y + 2, w, 1, 'slate');
}

/** A band of high windows onto the harbour sky at dusk, cranes against it. */
function paintHighWindows(p: Painter, w: number, ox: number, top: number, bottom: number): void {
  p.rect(0, top, w, bottom - top, 'dusk');
  const y0 = top + 8;
  const y1 = bottom - 8;
  if (y1 - y0 < 12) return;
  for (let x = mod(ox + 6, 30) - 30; x < w; x += 30) {
    p.rect(x - 1, y0 - 1, 26, y1 - y0 + 2, 'ember');
    const glass = within(p, x, y0, 24, y1 - y0);
    ditherGradient(glass, x, y0, 24, y1 - y0, ['deep', 'indigo', 'violet', 'mauve', 'rosy']);
    // a crane on the quay, now and then
    if (hash2(x - ox, 1, 97) < 0.5) {
      glass.rect(x + 6, y1 - 14, 1, 14, 'night');
      glass.rect(x + 2, y1 - 14, 14, 1, 'night');
      glass.rect(x + 15, y1 - 13, 1, 4, 'night');
      px(glass, x + 6, y1 - 15, 'red');
    }
    glass.rect(x, y1 - 3, 24, 3, 'night');
    for (let i = 0; i < 24; i += 3)
      if (hash2(x - ox, i, 99) < 0.4) px(glass, x + i, y1 - 2, 'honey');
    p.rect(x + 12, y0, 1, y1 - y0, 'ember');
    p.rect(x - 2, y1 + 1, 28, 1, 'amber');
  }
}

/** A framed poster of the Lantern lamp on a dark ground, 20x16. */
function paintLanternPoster(p: Painter, x: number, y: number): void {
  p.rect(x + 1, y + 16, 19, 1, 'slate');
  p.rect(x, y, 20, 16, 'ink');
  p.rect(x + 1, y + 1, 18, 14, 'indigo');
  ditherRect(p, x + 5, y + 7, 10, 6, 'dusk', 8);
  p.rect(x + 5, y + 4, 6, 2, 'lamp');
  p.rect(x + 5, y + 5, 6, 1, 'amber');
  p.rect(x + 11, y + 3, 1, 2, 'fog');
  p.rect(x + 12, y + 3, 1, 9, 'fog');
  p.rect(x + 9, y + 12, 6, 1, 'paper');
  p.rect(x + 3, y + 13, 14, 1, 'honey');
}

/** The whiteboard: the day's plan as five timed lines in marker scribble, a lamp sketched beside it. */
function paintWhiteboard(p: Painter, x: number, y: number): void {
  const { w, h } = BOARD;
  p.rect(x + 1, y + h, w - 1, 1, 'slate');
  p.rect(x, y, w, h, 'stone');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'paper');
  ditherRect(p, x + 1, y + 1, w - 2, 3, 'fog', 3);
  // a heading underlined in red
  p.rect(x + 4, y + 3, 14, 1, 'denim');
  p.rect(x + 4, y + 5, 16, 1, 'red');
  // five lines: a time, then the item; the fourth (lunch) is short
  const lens = [20, 22, 16, 9, 18];
  lens.forEach((len, i) => {
    const ly = y + 8 + i * 3;
    p.rect(x + 4, ly, 3, 1, 'red');
    p.rect(x + 9, ly, len - Math.floor(hash2(i, 1, 51) * 4), 1, 'ink');
  });
  // the player's slot is circled
  p.rect(x + 2, y + 10, 1, 3, 'teal');
  p.rect(x + 32, y + 10, 1, 3, 'teal');
  p.rect(x + 3, y + 9, 29, 1, 'teal');
  p.rect(x + 3, y + 13, 29, 1, 'teal');
  // a sketch of the lamp in the corner
  p.rect(x + 35, y + 6, 5, 2, 'amber');
  p.rect(x + 39, y + 8, 1, 7, 'ink');
  p.rect(x + 36, y + 15, 6, 1, 'ink');
  // the tray with markers
  p.rect(x + 4, y + h, w - 8, 1, 'stone');
  p.rect(x + 8, y + h - 1, 3, 1, 'red');
  p.rect(x + 13, y + h - 1, 3, 1, 'denim');
}

/** The wooden meeting table: papers, a laptop, a mug; props rest on its top. */
function paintMeetingTable(p: Painter, x: number, top: number, w: number, floorTop: number): void {
  // two chairs pulled in behind it
  for (const cx of [x + 3, x + w - 10]) {
    p.rect(cx + 1, top - 7, 5, 1, 'teal');
    p.rect(cx, top - 6, 7, 4, 'teal');
    p.rect(cx + 1, top - 6, 5, 1, 'cyan');
    p.rect(cx + 6, top - 5, 1, 3, 'moss');
    p.rect(cx + 3, top - 2, 1, 2, 'ink');
  }
  p.rect(x - 1, top, w + 2, 2, 'amber');
  p.rect(x - 1, top + 2, w + 2, 2, 'ember');
  p.rect(x + 1, top + 4, 2, floorTop - top + 5, 'ember');
  p.rect(x + w - 3, top + 4, 2, floorTop - top + 5, 'ember');
  p.rect(x + 3, top + 4, w - 6, 1, 'plum');
  // papers and a mug at the ends of the top
  p.rect(x + 1, top - 1, 6, 1, 'paper');
  p.rect(x + w - 4, top - 3, 3, 3, 'paper');
  px(p, x + w - 1, top - 2, 'paper');
}

export const ANNUAL_MEETING_STAGE: StageConfig = {
  paint,
  backdrops: { director: paintBoardroom, client: paintVideo },
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, ...BY_TABLE, side: 'right' },
    // Alone (at the start of a scene) Mr. Ellis stands by the table; with others, nearest the lectern.
    director: { sprite: DIRECTOR_SPRITE, ...BY_TABLE, side: 'right', beside: BY_LECTERN },
    supplier: { sprite: SUPPLIER_SPRITE, ...BY_TABLE, side: 'right', beside: MIDDLE },
    // Only ever seen alone, in his recorded video, cut off at the bottom of the picture.
    client: {
      sprite: CLIENT_SPRITE,
      ...IN_VIDEO,
      side: 'right',
      clipBottom: PANEL_PICTURE_END,
      beside: IN_VIDEO,
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 62, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 82, y: 25 } },
  rest: {
    left: { x: TABLE.x + 1, y: PROP_TOP },
    right: { x: TABLE.x + 8, y: PROP_TOP },
  },
};
