import type { PaletteName } from '../palette';
import { ditherRect, ellipse, hash2, lightPool, px, type Painter } from '../painter';
import { LIGHTER } from './paintUpper';
import type { Bay, Rect, StreetPlan } from './plan';

/** Sign band, shopfronts under the arcade, pavement and road. */

/** A made-up glyph: a small random block that reads as "a sign" from afar. */
function glyph(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  c: PaletteName,
  seed: number,
) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const edge = yy === 0 || xx === 0 || yy === h - 1;
      if (hash2(xx + seed * 13, yy, 81) < (edge ? 0.7 : 0.4)) px(p, x + xx, y + yy, c);
    }
  }
}

function signboard(p: Painter, plan: StreetPlan, bay: Bay): void {
  const x = bay.x + plan.colW / 2 + 2;
  const y = plan.beamTop + 1;
  const w = bay.w - plan.colW - 4;
  const h = plan.beamBottom - plan.beamTop - 2;
  const gh = h - 2;
  const gw = Math.max(3, gh - 1);
  const glyphs = (c: PaletteName, from: number, count: number): void => {
    for (let i = 0; i < count; i++) {
      const gx = from + i * (gw + 2);
      if (gx + gw > x + w - 1) break;
      glyph(p, gx, y + 1, gw, gh, c, bay.index * 10 + i);
    }
  };
  switch (bay.kind) {
    case 'cafe':
      p.rect(x, y, w, h, 'ink');
      // A row of warm marquee bulbs.
      for (let bx = x + 1; bx < x + w - 1; bx += 3) {
        px(p, bx, y + 1, 'lamp');
        px(p, bx + 1, y + h - 2, 'honey');
      }
      break;
    case 'noodle':
      p.rect(x, y, w, h, 'red');
      p.rect(x, y + h - 1, w, 1, 'maroon');
      // Bowl and chopsticks.
      p.rect(x + 2, y + 2, 7, 1, 'paper');
      p.rect(x + 3, y + 3, 5, 1, 'paper');
      p.rect(x + 4, y + 4, 3, Math.max(1, h - 5), 'paper');
      px(p, x + 6, y + 1, 'paper');
      px(p, x + 8, y, 'paper');
      glyphs('paper', x + 12, 4);
      break;
    case 'tea':
      p.rect(x, y, w, h, 'teal');
      p.rect(x, y, w, 1, 'cyan');
      // A cup with a straw.
      p.rect(x + 3, y + 2, 4, h - 3, 'paper');
      px(p, x + 6, y + 1, 'ink');
      px(p, x + 7, y, 'ink');
      glyphs('paper', x + 10, 4);
      break;
    case 'grocery':
      p.rect(x, y, w, h, 'paper');
      p.rect(x, y + h - 1, w, 1, 'fog');
      glyphs('red', x + 3, 5);
      break;
    case 'shutter':
      p.rect(x, y, w, h, 'dusk');
      glyphs('violet', x + 4, 4);
      break;
    case 'stair':
      // Blue house-number plate.
      p.rect(x + 3, y + 1, 6, 4, 'denim');
      p.rect(x + 4, y + 2, 4, 1, 'paper');
      break;
  }
}

function paintBeam(p: Painter, plan: StreetPlan): void {
  const { beamTop, beamBottom } = plan;
  for (const bay of plan.bays) {
    p.rect(bay.x, beamTop, bay.w, beamBottom - beamTop, bay.wall);
    p.rect(bay.x, beamTop, bay.w, 1, LIGHTER[bay.wall] ?? 'fog');
    p.rect(bay.x, beamBottom - 1, bay.w, 1, 'night');
    signboard(p, plan, bay);
  }
}

interface Inner {
  x: number;
  y: number;
  w: number;
  h: number;
}

function pottedPlant(p: Painter, x: number, floor: number, seed: number): void {
  const pot: PaletteName = hash2(seed, 0, 91) < 0.5 ? 'ember' : 'red';
  p.rect(x, floor - 3, 4, 3, pot);
  for (let i = 0; i < 9; i++) {
    const lx = x - 1 + Math.floor(hash2(seed, i, 92) * 6);
    const ly = floor - 4 - Math.floor(hash2(seed, i, 93) * 5);
    px(p, lx, ly, i % 3 === 0 ? 'moss' : 'leaf');
  }
}

/** Warm interior behind the window: back wall, two pendant lamps and a shelf. */
function paintCafeInterior(p: Painter, win: Rect): void {
  p.rect(win.x - 1, win.y - 1, win.w + 2, win.h + 2, 'ink');
  p.rect(win.x, win.y, win.w, win.h, 'amber');
  const lamps = [win.x + Math.round(win.w * 0.25), win.x + Math.round(win.w * 0.72)];
  for (const lx of lamps) {
    lightPool(p, lx, win.y + 7, Math.round(win.w * 0.3), Math.round(win.h * 0.55), [
      ['lamp', 1.5],
      ['honey', 0.8],
    ]);
  }
  const shelfY = win.y + Math.round(win.h * 0.3);
  p.rect(win.x, shelfY, win.w, 1, 'ember');
  for (let x = win.x + 2; x < win.x + win.w - 2; x += 3) {
    const roll = hash2(x, shelfY, 94);
    const c: PaletteName =
      roll < 0.5 ? 'paper' : roll < 0.7 ? 'leaf' : roll < 0.85 ? 'red' : 'ember';
    p.rect(x, shelfY - 2, 2, 2, c);
  }
  for (const lx of lamps) {
    p.rect(lx, win.y, 1, 4, 'ink');
    p.rect(lx - 2, win.y + 4, 5, 1, 'ink');
    p.rect(lx - 1, win.y + 3, 3, 1, 'ink');
    px(p, lx, win.y + 5, 'paper');
  }
}

/** Counter with a lit edge, the espresso machine, a cup, a glint and the sill. */
function paintCafeCounter(p: Painter, win: Rect, counterY: number): void {
  p.rect(win.x, counterY, win.w, win.y + win.h - counterY, 'ember');
  p.rect(win.x, counterY, win.w, 1, 'honey');
  for (let x = win.x + 4; x < win.x + win.w - 2; x += 8) {
    p.rect(x, counterY + 2, 1, win.y + win.h - counterY - 2, 'plum');
  }
  // Espresso machine and a cup.
  const mx = win.x + win.w - 16;
  p.rect(mx, counterY - 6, 9, 6, 'fog');
  p.rect(mx + 6, counterY - 6, 3, 6, 'concrete');
  p.rect(mx, counterY - 6, 9, 1, 'paper');
  p.rect(mx + 2, counterY - 3, 1, 2, 'ink');
  p.rect(mx + 5, counterY - 3, 1, 2, 'ink');
  p.rect(win.x + 4, counterY - 2, 2, 2, 'paper');
  // A glint on the glass.
  for (let i = 0; i < 4; i++) px(p, win.x + 2 + i, win.y + 6 - i, 'paper');
  // Sill with a little row of plants.
  p.rect(win.x - 1, win.y + win.h + 1, win.w + 2, 2, 'ember');
  p.rect(win.x - 1, win.y + win.h + 1, win.w + 2, 1, 'amber');
}

function paintCafeDoor(p: Painter, door: Rect): void {
  p.rect(door.x - 1, door.y - 1, door.w + 2, door.h + 1, 'ink');
  p.rect(door.x, door.y, door.w, door.h, 'ember');
  p.rect(door.x + 1, door.y + 1, door.w - 2, Math.round(door.h * 0.6), 'lamp');
  ditherRect(p, door.x + 1, door.y + 1, door.w - 2, Math.round(door.h * 0.3), 'honey', 6);
  p.rect(door.x + 1, door.y + Math.round(door.h * 0.45), 2, 1, 'fog');
}

/** Chalkboard stand by the door. */
function paintChalkboard(p: Painter, door: Rect, pavTop: number): void {
  const bx = door.x - 9;
  const by = pavTop - 9;
  p.rect(bx, by, 7, 8, 'ember');
  p.rect(bx + 1, by + 1, 5, 6, 'ink');
  for (let i = 0; i < 3; i++) p.rect(bx + 2, by + 2 + i * 2, 1 + ((i * 2) % 3), 1, 'paper');
  px(p, bx + 1, pavTop - 1, 'ember');
  px(p, bx + 5, pavTop - 1, 'ember');
}

function paintCafeFront(p: Painter, plan: StreetPlan, inner: Inner): void {
  const { cafeWindow: win, cafeDoor: door, counterY } = plan;
  p.rect(inner.x, inner.y, inner.w, inner.h, 'ember');
  p.rect(inner.x, inner.y + inner.h - 4, inner.w, 4, 'plum');
  paintCafeInterior(p, win);
  paintCafeCounter(p, win, counterY);
  paintCafeDoor(p, door);
  paintChalkboard(p, door, plan.pavTop);
}

function paintNoodle(p: Painter, plan: StreetPlan, inner: Inner): void {
  const floor = plan.pavTop;
  p.rect(inner.x, inner.y, inner.w, inner.h, 'amber');
  ditherRect(p, inner.x, inner.y, inner.w, Math.round(inner.h / 2), 'lamp', 5);
  // Menu boards along the wall.
  for (let x = inner.x + 2; x + 7 < inner.x + inner.w; x += 9) {
    p.rect(x, inner.y + 2, 7, 4, 'paper');
    p.rect(x + 1, inner.y + 3, 1 + Math.floor(hash2(x, 1, 95) * 4), 1, 'red');
    p.rect(x + 1, inner.y + 4, 2 + Math.floor(hash2(x, 2, 95) * 3), 1, 'ink');
  }
  // Fridge, table and red plastic stools.
  p.rect(inner.x + 2, inner.y + 9, 8, inner.h - 9, 'paper');
  p.rect(inner.x + 3, inner.y + 10, 6, inner.h - 13, 'sky');
  for (let y = inner.y + 12; y < floor - 4; y += 3) p.rect(inner.x + 3, y, 6, 1, 'fog');
  const tx = inner.x + 14;
  p.rect(tx, floor - 9, 12, 1, 'paper');
  p.rect(tx + 5, floor - 8, 2, 8, 'stone');
  p.rect(tx - 4, floor - 5, 4, 1, 'red');
  p.rect(tx - 3, floor - 4, 1, 4, 'red');
  p.rect(tx + 13, floor - 5, 4, 1, 'red');
  p.rect(tx + 15, floor - 4, 1, 4, 'red');
  // Stall cart with a steaming pot by the street.
  const potX = plan.steam[0]?.x ?? inner.x + inner.w - 10;
  const cx = potX - 10;
  const top = floor - 12;
  p.rect(cx, top, 20, 10, 'stone');
  p.rect(cx, top, 20, 1, 'paper');
  p.rect(cx + 1, top + 2, 18, 1, 'fog');
  p.rect(cx + 2, top + 4, 8, 4, 'sky');
  p.rect(cx + 3, top + 6, 2, 2, 'honey');
  p.rect(cx + 6, top + 5, 3, 3, 'amber');
  p.rect(cx + 1, floor - 2, 3, 2, 'ink');
  p.rect(cx + 16, floor - 2, 3, 2, 'ink');
  p.rect(potX - 4, top - 5, 9, 5, 'concrete');
  p.rect(potX - 5, top - 5, 11, 1, 'fog');
  p.rect(potX + 2, top - 4, 2, 4, 'stone');
  px(p, potX - 3, top - 7, 'ink');
  px(p, potX - 2, top - 6, 'ink');
}

function paintTea(p: Painter, plan: StreetPlan, inner: Inner): void {
  const floor = plan.pavTop;
  p.rect(inner.x, inner.y, inner.w, inner.h, 'paper');
  ditherRect(p, inner.x, inner.y + 6, inner.w, inner.h - 6, 'sky', 2);
  // Light-box menu.
  p.rect(inner.x + 2, inner.y + 1, inner.w - 4, 4, 'honey');
  for (let x = inner.x + 4; x < inner.x + inner.w - 4; x += 4) {
    px(p, x, inner.y + 2, 'ember');
    px(p, x + 1, inner.y + 3, hash2(x, 3, 96) < 0.5 ? 'neon' : 'teal');
  }
  // Counter and cups of milk tea with pearls.
  const ct = floor - 12;
  p.rect(inner.x + 1, ct, inner.w - 2, floor - ct, 'teal');
  p.rect(inner.x + 1, ct, inner.w - 2, 1, 'paper');
  p.rect(inner.x + 1, ct + 3, inner.w - 2, 1, 'cyan');
  for (let i = 0; i < 4; i++) {
    const x = inner.x + 6 + i * 6;
    if (x + 3 > inner.x + inner.w) break;
    p.rect(x, ct - 5, 3, 5, 'paper');
    p.rect(x, ct - 3, 3, 2, 'amber');
    px(p, x + 1, ct - 1, 'ink');
    px(p, x + 2, ct - 7, 'ink');
    px(p, x + 2, ct - 6, 'ink');
  }
  p.rect(inner.x + inner.w - 9, ct - 7, 6, 7, 'fog');
  p.rect(inner.x + inner.w - 8, ct - 5, 4, 2, 'ink');
}

function paintGrocery(p: Painter, plan: StreetPlan, inner: Inner): void {
  const floor = plan.pavTop;
  p.rect(inner.x, inner.y, inner.w, inner.h, 'night');
  ditherRect(p, inner.x, inner.y, inner.w, inner.h - 4, 'ember', 6);
  const goods: PaletteName[] = ['red', 'leaf', 'lamp', 'cyan', 'paper', 'sky', 'honey', 'neon'];
  for (let s = 0; s < 3; s++) {
    const sy = inner.y + 6 + s * 7;
    if (sy > floor - 8) break;
    p.rect(inner.x + 1, sy, inner.w - 2, 1, 'stone');
    for (let x = inner.x + 2; x < inner.x + inner.w - 3; x += 3) {
      const c = goods[Math.floor(hash2(x, sy, 97) * goods.length)] ?? 'paper';
      p.rect(x, sy - 3, 2, 3, c);
    }
  }
  // Fruit crates out front.
  for (let i = 0; i < 3; i++) {
    const x = inner.x + 3 + i * 11;
    if (x + 9 > inner.x + inner.w) break;
    p.rect(x, floor - 5, 9, 5, 'ember');
    p.rect(x, floor - 4, 9, 1, 'amber');
    const fruit: PaletteName = (['red', 'lamp', 'leaf'] as const)[i % 3] ?? 'red';
    for (let fx = x; fx < x + 9; fx += 2) px(p, fx + (i % 2), floor - 6, fruit);
    p.rect(x + 1, floor - 7, 7, 1, fruit);
  }
}

function paintStair(p: Painter, plan: StreetPlan, bay: Bay, inner: Inner): void {
  const floor = plan.pavTop;
  p.rect(inner.x, inner.y, inner.w, inner.h, bay.wallShade);
  ditherRect(p, inner.x, inner.y, inner.w, inner.h, 'night', 6);
  // Iron gate door.
  const dw = 12;
  const dx = inner.x + Math.round(inner.w / 2 - dw / 2) + 4;
  p.rect(dx - 1, inner.y + 4, dw + 2, floor - inner.y - 4, 'ink');
  p.rect(dx, inner.y + 5, dw, floor - inner.y - 5, 'deep');
  for (let x = dx + 1; x < dx + dw; x += 2) p.rect(x, inner.y + 5, 1, floor - inner.y - 5, 'stone');
  p.rect(dx, inner.y + 10, dw, 1, 'stone');
  // Small wall lamp, mailboxes, plants and slippers.
  p.rect(dx + 4, inner.y + 1, 3, 2, 'lamp');
  px(p, dx + 5, inner.y + 1, 'honey');
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const mx = dx - 12 + c * 5;
      const my = inner.y + 8 + r * 4;
      p.rect(mx, my, 4, 3, 'fog');
      p.rect(mx + 1, my + 1, 2, 1, 'stone');
    }
  }
  pottedPlant(p, dx + dw + 3, floor, bay.index);
  pottedPlant(p, dx + dw + 9, floor, bay.index + 50);
  p.rect(dx + 2, floor - 1, 2, 1, 'red');
  p.rect(dx + 5, floor - 1, 2, 1, 'red');
}

function paintShutter(p: Painter, plan: StreetPlan, bay: Bay, inner: Inner): void {
  const floor = plan.pavTop;
  p.rect(inner.x, inner.y, inner.w, inner.h, 'stone');
  for (let y = inner.y + 1; y < floor; y += 2) p.rect(inner.x, y, inner.w, 1, 'slate');
  for (let y = inner.y + 3; y < floor; y += 6) p.rect(inner.x, y, inner.w, 1, 'concrete');
  p.rect(inner.x, floor - 2, inner.w, 2, 'fog');
  p.rect(inner.x + Math.round(inner.w / 2), floor - 3, 2, 2, 'lamp');
  const sx = inner.x + 4 + Math.floor(hash2(bay.index, 0, 98) * (inner.w - 12));
  p.rect(sx, inner.y + 9, 4, 3, 'paper');
  p.rect(sx + 1, inner.y + 10, 2, 1, 'red');
}

function paintArcade(p: Painter, plan: StreetPlan): void {
  const { beamBottom, pavTop, colW } = plan;
  for (const bay of plan.bays) {
    p.rect(bay.x, beamBottom, bay.w, pavTop - beamBottom, 'night');
    const inner = {
      x: bay.x + colW / 2 + 1,
      y: beamBottom + 3,
      w: bay.w - colW - 2,
      h: pavTop - beamBottom - 3,
    };
    switch (bay.kind) {
      case 'cafe':
        paintCafeFront(p, plan, inner);
        pottedPlant(p, plan.cafeDoor.x + plan.cafeDoor.w + 1, pavTop, 7);
        break;
      case 'noodle':
        paintNoodle(p, plan, inner);
        break;
      case 'tea':
        paintTea(p, plan, inner);
        break;
      case 'grocery':
        paintGrocery(p, plan, inner);
        break;
      case 'stair':
        paintStair(p, plan, bay, inner);
        break;
      case 'shutter':
        paintShutter(p, plan, bay, inner);
        break;
    }
    // Arcade ceiling with its strip light.
    p.rect(bay.x, beamBottom, bay.w, 3, 'ink');
    p.rect(bay.x, beamBottom + 2, bay.w, 1, 'night');
  }
  for (const tube of plan.tubes) p.rect(tube.x, tube.y, tube.w, tube.h, 'paper');
}

const LIT: ReadonlySet<string> = new Set(['cafe', 'noodle', 'tea', 'grocery']);

function paintPavement(p: Painter, plan: StreetPlan): void {
  const { pavTop, curbY, width: W } = plan;
  const pavH = curbY - pavTop;
  for (const bay of plan.bays) {
    const base: PaletteName = bay.index % 2 === 0 ? 'slate' : 'stone';
    p.rect(bay.x, pavTop, bay.w, pavH, base);
    for (let x = bay.x + 3; x < bay.x + bay.w; x += 6) p.rect(x, pavTop + 1, 1, pavH - 1, 'night');
    p.rect(bay.x, pavTop + Math.floor(pavH / 2), bay.w, 1, 'night');
    p.rect(bay.x, pavTop, bay.w, 1, 'ink');
  }
  const clip = { y0: pavTop + 1, y1: curbY };
  for (const bay of plan.bays) {
    if (!LIT.has(bay.kind)) continue;
    const cx = Math.round(bay.x + bay.w / 2);
    const strong = bay.kind === 'cafe';
    lightPool(
      p,
      cx,
      pavTop,
      Math.round(bay.w / 2),
      pavH + 3,
      [
        ['ember', strong ? 1 : 0.65],
        ['amber', strong ? 0.6 : 0.3],
        ['lamp', strong ? 0.25 : 0],
      ],
      clip,
    );
  }
  for (const lamp of plan.lamps) {
    lightPool(
      p,
      lamp.headX,
      curbY - 1,
      24,
      pavH + 2,
      [
        ['ember', 0.6],
        ['amber', 0.3],
      ],
      clip,
    );
  }
  // Curb.
  p.rect(0, curbY, W, 1, 'fog');
  p.rect(0, curbY + 1, W, 1, 'stone');
}

function paintRoad(p: Painter, plan: StreetPlan): void {
  const { roadTop, height: H, width: W, cafeWindow: win } = plan;
  const roadH = H - roadTop;
  p.rect(0, roadTop, W, roadH, 'night');
  ditherRect(p, 0, roadTop, W, roadH, 'ink', 3);
  p.rect(0, roadTop, W, 1, 'ink');
  const laneY = roadTop + Math.round(roadH * 0.82);
  for (let x = 2; x < W; x += 14) p.rect(x, laneY, 7, 1, 'stone');
  const clip = { y0: roadTop + 1, y1: H };
  for (const lamp of plan.lamps) {
    lightPool(
      p,
      lamp.headX,
      roadTop,
      28,
      Math.round(roadH * 0.9),
      [
        ['plum', 0.7],
        ['ember', 0.35],
      ],
      clip,
    );
  }
  // Wet asphalt: the cafe window, the neon and the lamps reflect as
  // broken vertical streaks.
  const streak = (x: number, length: number, color: PaletteName, top: PaletteName): void => {
    for (let y = roadTop + 1; y < Math.min(H, roadTop + 1 + length); y++) {
      if ((x + y) % 2 === 0) continue;
      px(p, x, y, y < roadTop + 3 ? top : color);
    }
  };
  for (let x = win.x + 2; x < win.x + win.w - 2; x++) {
    const roll = hash2(x, 0, 99);
    if (roll < 0.55) streak(x, Math.round(roadH * (0.3 + roll)), 'ember', 'amber');
  }
  const ncx = plan.neonCup.x + 11;
  for (let x = ncx - 3; x <= ncx + 3; x++) {
    streak(x, Math.round(roadH * (0.5 + hash2(x, 1, 99) * 0.5)), 'neonDeep', 'neon');
  }
  for (const lamp of plan.lamps) {
    for (let x = lamp.headX - 1; x <= lamp.headX + 2; x++) {
      streak(x, Math.round(roadH * (0.4 + hash2(x, 2, 99) * 0.5)), 'amber', 'honey');
    }
  }
  // A puddle reflecting the sky, the lamp and the neon.
  const { x: qx, y: qy } = plan.puddle;
  ellipse(p, qx, qy, 9, 1, 'deep');
  p.rect(qx - 6, qy, 12, 1, 'indigo');
  p.rect(qx - 2, qy - 1, 3, 1, 'dusk');
  px(p, qx + 3, qy, 'lamp');
  px(p, qx + 4, qy, 'honey');
  px(p, qx - 4, qy, 'neon');
}

export function paintStreet(p: Painter, plan: StreetPlan): void {
  paintBeam(p, plan);
  paintArcade(p, plan);
  paintPavement(p, plan);
  paintRoad(p, plan);
}
