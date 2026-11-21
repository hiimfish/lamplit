import type { PaletteName } from '../palette';
import { ditherGradient, ditherRect, hash2, px, type Painter } from '../painter';
import type { Bay, StreetPlan, UpperWindow } from './plan';

/** Sky, moon, stars, distant buildings and the upper floors of the shophouses. */

/** A lighter neighbour of a wall colour, for rim light from the sky. */
export const LIGHTER: Partial<Record<PaletteName, PaletteName>> = {
  night: 'slate',
  slate: 'stone',
  stone: 'concrete',
  concrete: 'fog',
  dusk: 'violet',
  plum: 'mauve',
  indigo: 'dusk',
};

export function paintSky(p: Painter, plan: StreetPlan): void {
  const { width: W, beamTop } = plan;
  ditherGradient(p, 0, 0, W, beamTop, [
    'deep',
    'deep',
    'indigo',
    'dusk',
    'violet',
    'mauve',
    'rosy',
  ]);

  for (const star of plan.stars) {
    if (plan.twinkles.includes(star)) continue;
    px(p, star.x, star.y, star.bright ? 'paper' : 'sky');
  }

  // Thin crescent moon, only where nothing stands in front of it.
  const { x: mx, y: my, r } = plan.moon;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = mx + dx;
      const y = my + dy;
      if (y >= (plan.skyTop[x] ?? 0)) continue;
      const inDisc = dx * dx + dy * dy <= r * r + r * 0.6;
      const cut = (dx + r * 0.55) ** 2 + (dy + r * 0.25) ** 2 <= r * r;
      if (!inDisc || cut) continue;
      const edge = (dx + r * 0.55) ** 2 + (dy + r * 0.25) ** 2 <= (r + 1.2) ** 2;
      px(p, x, y, edge ? 'fog' : 'paper');
    }
  }
}

export function paintSkyline(p: Painter, plan: StreetPlan): void {
  plan.skyline.forEach((b, i) => {
    p.rect(b.x, b.y, b.w, b.h, 'night');
    p.rect(b.x, b.y, b.w, 1, 'slate');
    // Stepped tops and rooftop antennas on some blocks.
    if (hash2(i, 0, 51) < 0.4 && b.w > 18) {
      const sw = Math.round(b.w * 0.4);
      p.rect(b.x + 3, b.y - 3, sw, 3, 'night');
      p.rect(b.x + 3, b.y - 3, sw, 1, 'slate');
    }
    if (hash2(i, 1, 51) < 0.35) {
      const ax = b.x + Math.floor(hash2(i, 2, 51) * (b.w - 2)) + 1;
      p.rect(ax, b.y - 6, 1, 6, 'night');
    }
    // A few lit windows far away.
    for (let y = b.y + 3; y < b.y + b.h - 2; y += 5) {
      for (let x = b.x + 2; x < b.x + b.w - 2; x += 4) {
        const roll = hash2(x, y, 52);
        if (roll < 0.09) p.rect(x, y, 2, 1, 'lamp');
        else if (roll < 0.12) p.rect(x, y, 1, 1, 'honey');
        else if (roll < 0.14) p.rect(x, y, 2, 1, 'sky');
      }
    }
  });
}

function paintGlass(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  light: UpperWindow['light'],
  curtain: boolean,
): void {
  if (light === 'warm') {
    p.rect(x, y, w, h, 'amber');
    ditherRect(p, x, y + Math.floor(h / 3), w, h - Math.floor(h / 3), 'lamp', 9);
    p.rect(x, y, w, 1, 'ember');
    if (curtain) {
      const cw = Math.max(2, Math.round(w * 0.35));
      p.rect(x, y, cw, h, 'honey');
      for (let cx = x + 1; cx < x + cw; cx += 2) p.rect(cx, y + 1, 1, h - 1, 'lamp');
    }
  } else if (light === 'cool') {
    p.rect(x, y, w, h, 'denim');
    ditherRect(p, x, y + 1, w, h - 1, 'sky', 6);
    if (curtain) p.rect(x + w - Math.round(w * 0.3), y, Math.round(w * 0.3), h, 'dusk');
  } else {
    p.rect(x, y, w, h, 'indigo');
    p.rect(x, y, w, 1, 'deep');
    for (let i = 0; i < Math.min(w, h) - 2; i++) px(p, x + 2 + i, y + h - 2 - i, 'dusk');
    if (curtain) p.rect(x, y, Math.max(2, Math.round(w * 0.25)), h, 'night');
  }
  if (w >= 12) p.rect(x + Math.floor(w / 2), y, 1, h, 'ink');
}

export function paintUpperWindow(p: Painter, win: UpperWindow, bay: Bay): void {
  const { x, y, w, h } = win;
  p.rect(x - 1, y - 1, w + 2, h + 2, bay.wallShade);
  paintGlass(p, x, y, w, h, win.light, win.curtain);
  if (win.grille) {
    // Iron window cage, typical of the neighbourhood.
    p.rect(x - 2, y - 2, w + 4, 1, 'stone');
    p.rect(x - 2, y - 1, 1, h + 2, 'ink');
    p.rect(x + w + 1, y - 1, 1, h + 2, 'ink');
    for (let gx = x + 2; gx < x + w; gx += 3) p.rect(gx, y, 1, h, 'ink');
    p.rect(x - 2, y + h + 1, w + 4, 1, 'ink');
    if (hash2(x, y, 61) < 0.45) {
      for (let lx = x - 1; lx < x + w + 1; lx++) {
        const roll = hash2(lx, y, 62);
        if (roll < 0.5) px(p, lx, y + h, roll < 0.2 ? 'moss' : 'leaf');
        if (roll < 0.18) px(p, lx, y + h - 1, 'leaf');
      }
    } else if (hash2(x, y, 63) < 0.4) {
      // Laundry hanging inside the cage.
      const colours: PaletteName[] = ['paper', 'rosy', 'sky', 'lamp'];
      for (let i = 0; i < 3 && x + 1 + i * 4 + 2 < x + w; i++) {
        const c = colours[Math.floor(hash2(i, x, 64) * colours.length)] ?? 'paper';
        p.rect(x + 1 + i * 4, y + 1, 2, 3, c);
      }
    }
  } else {
    p.rect(x - 1, y + h + 1, w + 2, 1, LIGHTER[bay.wall] ?? 'fog');
  }
  if (win.ac) {
    const ax = x + w - 4;
    const ay = y + h + 3;
    p.rect(ax, ay, 7, 4, 'fog');
    p.rect(ax, ay + 3, 7, 1, 'concrete');
    p.rect(ax + 1, ay + 1, 3, 1, 'stone');
    px(p, ax + 5, ay + 1, 'stone');
    p.rect(ax + 2, ay + 4, 1, 2, 'ink');
  }
}

function paintRoof(p: Painter, bay: Bay, top: number): void {
  const light = LIGHTER[bay.wall] ?? 'fog';
  // Parapet with a rim of evening light.
  p.rect(bay.x, top - 2, bay.w, 2, bay.wallShade);
  p.rect(bay.x, top - 2, bay.w, 1, light);
  const { tank, shed } = bay.roof;
  if (shed) {
    p.rect(shed.x, shed.y, shed.w, shed.h, 'stone');
    for (let x = shed.x + 1; x < shed.x + shed.w; x += 2)
      p.rect(x, shed.y + 1, 1, shed.h - 1, 'slate');
    p.rect(shed.x - 1, shed.y, shed.w + 2, 1, 'concrete');
  }
  if (tank !== null) {
    // Stainless rooftop water tank on a little stand.
    const ty = top - 11;
    p.rect(tank + 1, ty, 8, 6, 'fog');
    p.rect(tank, ty + 1, 10, 4, 'fog');
    p.rect(tank + 6, ty + 1, 3, 4, 'concrete');
    p.rect(tank + 1, ty, 3, 1, 'paper');
    p.rect(tank + 1, ty + 6, 1, 3, 'ink');
    p.rect(tank + 8, ty + 6, 1, 3, 'ink');
    p.rect(tank + 1, ty + 7, 8, 1, 'ink');
  }
}

export function paintUpperFloors(p: Painter, plan: StreetPlan): void {
  const { beamTop, floorH, colW } = plan;
  for (const bay of plan.bays) {
    const top = beamTop - bay.floors * floorH;
    p.rect(bay.x, top, bay.w, beamTop - top, bay.wall);
    ditherRect(p, bay.x, top, bay.w, beamTop - top, bay.wallShade, 1);
    p.rect(bay.x + bay.w - 1, top, 1, beamTop - top, bay.wallShade);
    for (let f = 1; f < bay.floors; f++) {
      p.rect(bay.x, beamTop - f * floorH, bay.w, 1, bay.wallShade);
      p.rect(bay.x, beamTop - f * floorH - 1, bay.w, 1, LIGHTER[bay.wall] ?? 'fog');
    }
    paintRoof(p, bay, top);
    if (bay.kind === 'cafe') {
      // Dark sign panel that holds the neon cup.
      const panelY = beamTop - floorH + 2;
      p.rect(bay.x + colW / 2 + 2, panelY, bay.w - colW - 4, floorH - 4, 'ember');
      p.rect(bay.x + colW / 2 + 3, panelY + 1, bay.w - colW - 6, floorH - 6, 'ink');
    }
    for (const win of bay.windows) {
      paintUpperWindow(
        p,
        bay.kind === 'cafe' ? { ...win, light: 'warm', grille: false } : win,
        bay,
      );
    }
    if (bay.kind === 'cafe' && bay.floors > 1) {
      // Potted herbs along the balcony of the flat above the cafe.
      const ledge = beamTop - floorH - 1;
      for (let x = bay.x + colW; x < bay.x + bay.w - colW; x++) {
        const roll = hash2(x, ledge, 71);
        if (roll < 0.35) px(p, x, ledge - 1, roll < 0.12 ? 'moss' : 'leaf');
        if (roll < 0.12) px(p, x, ledge - 2, 'leaf');
      }
    }
  }
}
