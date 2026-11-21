import type { PaletteName } from '../palette';
import { ditherRect, glowEllipse, halo, hash2, paintSprite, px, type Painter } from '../painter';
import { SPRITES } from '../sprites';
import type { Point, StreetPlan } from './plan';

/** Foreground (columns, poles, wires, scooters) and the glow layer. */

function column(p: Painter, plan: StreetPlan, cx: number): void {
  const { colW, beamBottom, curbY, cafe } = plan;
  const x = Math.round(cx - colW / 2);
  const h = curbY - beamBottom;
  p.rect(x, beamBottom, colW, h, 'stone');
  p.rect(x, beamBottom, 1, h, 'concrete');
  p.rect(x + colW - 1, beamBottom, 1, h, 'slate');
  p.rect(x - 1, beamBottom, colW + 2, 2, 'concrete');
  p.rect(x - 1, beamBottom + 2, colW + 2, 1, 'slate');
  p.rect(x, curbY - 4, colW, 4, 'night');
  p.rect(x, curbY - 4, colW, 1, 'slate');
  // Columns beside the cafe catch its warm light on the inner face.
  if (cx === cafe.x)
    ditherRect(p, x + Math.ceil(colW / 2), beamBottom + 3, colW / 2, h - 7, 'amber', 6);
  if (cx === cafe.x + cafe.w) ditherRect(p, x, beamBottom + 3, colW / 2, h - 7, 'amber', 6);
  // The odd flyer taped to a column.
  if (hash2(cx, 0, 101) < 0.3) {
    p.rect(x + 1, beamBottom + Math.round(h * 0.4), colW - 2, 4, 'paper');
    p.rect(x + 2, beamBottom + Math.round(h * 0.4) + 1, colW - 4, 1, 'stone');
  }
}

/** Sagging wire between two points, one pixel per column (gaps filled). */
function wire(p: Painter, a: Point, b: Point, sag: number, color: PaletteName = 'ink'): void {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const span = Math.max(1, x1 - x0);
  const ya = a.x <= b.x ? a.y : b.y;
  const yb = a.x <= b.x ? b.y : a.y;
  let prev: number | null = null;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / span;
    const y = Math.round(ya + (yb - ya) * t + sag * 4 * t * (1 - t));
    if (prev === null || Math.abs(y - prev) <= 1) px(p, x, y, color);
    else p.rect(x, Math.min(y, prev + Math.sign(y - prev)), 1, Math.abs(y - prev), color);
    prev = y;
  }
}

function pole(p: Painter, plan: StreetPlan, at: Point): void {
  const { curbY } = plan;
  p.rect(at.x - 1, at.y, 3, curbY - at.y, 'stone');
  p.rect(at.x - 1, at.y, 1, curbY - at.y, 'concrete');
  p.rect(at.x + 1, at.y, 1, curbY - at.y, 'slate');
  p.rect(at.x - 6, at.y + 2, 13, 1, 'ink');
  for (const dx of [-5, -1, 3, 6]) px(p, at.x + dx, at.y + 1, 'fog');
  // Transformer drum and a couple of stickers.
  p.rect(at.x + 2, at.y + 7, 4, 7, 'concrete');
  p.rect(at.x + 2, at.y + 7, 4, 1, 'fog');
  p.rect(at.x + 5, at.y + 8, 1, 6, 'stone');
  const sy = plan.pavTop - 18;
  p.rect(at.x - 1, sy, 3, 4, 'paper');
  p.rect(at.x - 1, sy + 6, 3, 2, 'lamp');
}

function wires(p: Painter, plan: StreetPlan): void {
  const [a, b] = plan.poles;
  if (!a || !b) return;
  const W = plan.width;
  const span = b.x - a.x;
  const count = plan.height < 150 ? 2 : 3;
  for (let k = 0; k < count; k++) {
    const dy = 1 + k * 2;
    const sag = Math.round(span * (0.045 + k * 0.012));
    wire(p, { x: a.x - 5 + k * 4, y: a.y + dy }, { x: b.x - 5 + k * 4, y: b.y + dy }, sag);
    wire(p, { x: -60, y: a.y - 8 + k * 3 }, { x: a.x - 5 + k * 4, y: a.y + dy }, 10 + k * 2);
    wire(p, { x: b.x - 5 + k * 4, y: b.y + dy }, { x: W + 80, y: b.y - 10 + k * 4 }, 12 + k * 2);
  }
  // Service drop from the pole to a building, and a bird resting on a wire.
  const drop = {
    x: a.x + Math.round(span * 0.18),
    y: plan.beamTop - Math.round(plan.floorH * 1.2),
  };
  wire(p, { x: a.x + 1, y: a.y + 3 }, drop, 4);
  const bx = Math.round(a.x + span * 0.62);
  const t = (bx - a.x) / Math.max(1, span);
  const wy = Math.round(a.y + 1 + (b.y - a.y) * t + Math.round(span * 0.045) * 4 * t * (1 - t));
  p.rect(bx, wy - 2, 3, 2, 'ink');
  px(p, bx + 3, wy - 3, 'ink');
}

function streetLamp(p: Painter, plan: StreetPlan, x: number, headX: number, headY: number): void {
  const { curbY } = plan;
  const px0 = x - 1;
  p.rect(px0, headY - 2, 2, curbY - headY + 2, 'slate');
  p.rect(px0, headY - 2, 1, curbY - headY + 2, 'stone');
  p.rect(px0 - 1, curbY - 5, 4, 5, 'slate');
  p.rect(px0, headY - 3, headX - px0 + 3, 1, 'slate');
  p.rect(headX - 2, headY - 2, 6, 2, 'ink');
  p.rect(headX - 1, headY, 4, 1, 'paper');
}

function cone(p: Painter, at: Point): void {
  const { x, y } = at;
  p.rect(x - 3, y - 1, 7, 1, 'night');
  p.rect(x - 2, y - 3, 5, 2, 'amber');
  p.rect(x - 1, y - 5, 3, 2, 'paper');
  p.rect(x - 1, y - 7, 3, 2, 'amber');
  px(p, x, y - 8, 'amber');
  px(p, x - 1, y - 3, 'lamp');
}

function mailboxes(p: Painter, at: Point): void {
  // A red box and a green one, side by side.
  const boxes: [PaletteName, PaletteName, number][] = [
    ['red', 'maroon', 0],
    ['leaf', 'moss', 7],
  ];
  for (const [c, shade, dx] of boxes) {
    const x = at.x + dx;
    p.rect(x + 2, at.y - 4, 2, 4, 'ink');
    p.rect(x, at.y - 13, 6, 9, c);
    p.rect(x + 1, at.y - 14, 4, 1, c);
    p.rect(x + 5, at.y - 13, 1, 9, shade);
    p.rect(x + 1, at.y - 11, 4, 1, 'ink');
    px(p, x + 1, at.y - 13, 'paper');
  }
}

export function paintForeground(p: Painter, plan: StreetPlan): void {
  wires(p, plan);
  for (const at of plan.poles) pole(p, plan, at);
  for (const cx of plan.columns) column(p, plan, cx);
  for (const lamp of plan.lamps) streetLamp(p, plan, lamp.x, lamp.headX, lamp.headY);
  for (const s of plan.scooters) {
    const sprite = SPRITES[`scooter_${s.colour}`];
    if (sprite) paintSprite(p, sprite, s.x, s.y - sprite.rows.length, hash2(s.x, 1, 102) < 0.3);
  }
  if (plan.cone) cone(p, plan.cone);
  if (plan.mailbox) mailboxes(p, plan.mailbox);
}

/** Glow layer: palette colours at partial alpha, in hard-edged steps. */
export function paintGlow(p: Painter, plan: StreetPlan): void {
  const { cafeWindow: win } = plan;
  const { x: mx, y: my, r } = plan.moon;
  glowEllipse(p, mx, my, r * 3, r * 3, 'sky', [0.1, 0.06, 0.03]);

  for (const lamp of plan.lamps) {
    glowEllipse(p, lamp.headX + 1, lamp.headY + 1, 15, 11, 'honey', [0.4, 0.22, 0.12, 0.06]);
    // Faint cone of light down to the pavement.
    for (let y = lamp.headY + 2; y < plan.curbY; y++) {
      const half = Math.round((y - lamp.headY) * 0.45) + 2;
      p.rect(lamp.headX + 1 - half, y, half * 2 + 1, 1, 'honey', 0.06);
    }
  }

  // Window light: stepped rings around the cafe window and door.
  const rings = [0.22, 0.12, 0.05];
  rings.forEach((alpha, i) => {
    const d = i + 2;
    p.rect(win.x - d, win.y - d, win.w + d * 2, 1, 'lamp', alpha);
    p.rect(win.x - d, win.y + win.h + d - 1, win.w + d * 2, 1, 'lamp', alpha);
    p.rect(win.x - d, win.y - d + 1, 1, win.h + d * 2 - 2, 'lamp', alpha);
    p.rect(win.x + win.w + d - 1, win.y - d + 1, 1, win.h + d * 2 - 2, 'lamp', alpha);
  });

  for (const bay of plan.bays) {
    for (const w of bay.windows) {
      if (w.light === 'dark' && bay.kind !== 'cafe') continue;
      const c: PaletteName = w.light === 'cool' ? 'sky' : 'lamp';
      p.rect(w.x - 2, w.y - 2, w.w + 4, 1, c, 0.12);
      p.rect(w.x - 2, w.y + w.h + 1, w.w + 4, 1, c, 0.12);
    }
  }

  for (const tube of plan.tubes) {
    if (tube.flicker) continue;
    glowEllipse(p, tube.x + 5, tube.y + 1, 9, 4, 'paper', [0.16, 0.07]);
  }
}

// ---------------------------------------------------------------------------
// Small fixed-size textures for things that flicker.

export interface SmallArt {
  key: string;
  w: number;
  h: number;
  paint: (p: Painter) => void;
}

const CUP = [
  '....s...s.......',
  '...s...s........',
  '....s...s.......',
  '.....s...s......',
  '................',
  '.nnnnnnnnnnnn...',
  '.n..........nnn.',
  '.n..........n..n',
  '.n..........n..n',
  '..n........nnnn.',
  '...n......n.....',
  '....nnnnnn......',
  '................',
  'nnnnnnnnnnnnnn..',
];

const ICONS: readonly string[][] = [
  ['..s.', '.s..', 'ssss', 's..s', '.ss.'],
  ['.ss.', 's..s', 's..s', '.ss.', '....'],
  ['s...', 'ss..', 'sss.', 'ssss', '....'],
  ['s..s', '.ss.', '.ss.', 's..s', '....'],
];

function tubeArt(
  rows: readonly string[],
  ox: number,
  oy: number,
  w: number,
  h: number,
  colours: Readonly<Record<string, PaletteName>>,
  glow: PaletteName | null,
) {
  return (p: Painter): void => {
    const lit = new Set<number>();
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (colours[ch]) lit.add((y + oy) * w + x + ox);
      });
    });
    if (glow) halo(p, lit, w, h, glow, [0.45, 0.24, 0.1]);
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const c = colours[ch];
        if (c) px(p, x + ox, y + oy, c);
      });
    });
  };
}

function verticalSignRows(variant: 0 | 1, broken: boolean): string[] {
  const w = 8;
  const rows: string[] = [];
  for (let y = 0; y < 34; y++) {
    if (y === 0 || y === 33) rows.push('b'.repeat(w));
    else rows.push(`b${'.'.repeat(w - 2)}b`);
  }
  const order = variant === 0 ? [0, 1, 3, 2] : [1, 2, 3, 0];
  order.forEach((iconIndex, slot) => {
    const icon = ICONS[iconIndex] ?? [];
    const top = 3 + slot * 8;
    icon.forEach((line, dy) => {
      const row = rows[top + dy];
      if (!row) return;
      const ch = broken && slot === 2 ? 'x' : 's';
      rows[top + dy] = row.slice(0, 2) + line.replace(/s/g, ch) + row.slice(6);
    });
  });
  return rows;
}

const NEON_CUP_W = 22;
const NEON_CUP_H = 20;
const VSIGN_W = 14;
const VSIGN_H = 40;

export function smallArt(): SmallArt[] {
  const vsign = (variant: 0 | 1, state: 'on' | 'part'): SmallArt => {
    const on = variant === 0 ? { b: 'cyan', s: 'paper' } : { b: 'neon', s: 'lamp' };
    // Unlit tube colour, used for the dark part of a half-broken sign.
    const unlit = variant === 0 ? 'stone' : 'ember';
    const colours = { ...on, x: unlit } as Record<string, PaletteName>;
    return {
      key: `vsign_${variant}_${state}`,
      w: VSIGN_W,
      h: VSIGN_H,
      paint: (p) => {
        // Dark board behind the tubes.
        p.rect(3, 3, 8, 34, 'ink');
        tubeArt(
          verticalSignRows(variant, state === 'part'),
          3,
          3,
          VSIGN_W,
          VSIGN_H,
          colours,
          variant === 0 ? 'cyan' : 'neon',
        )(p);
      },
    };
  };
  return [
    {
      key: 'neon_cup_on',
      w: NEON_CUP_W,
      h: NEON_CUP_H,
      paint: tubeArt(CUP, 3, 3, NEON_CUP_W, NEON_CUP_H, { n: 'neon', s: 'lamp' }, 'neon'),
    },
    {
      key: 'neon_cup_off',
      w: NEON_CUP_W,
      h: NEON_CUP_H,
      paint: tubeArt(CUP, 3, 3, NEON_CUP_W, NEON_CUP_H, { n: 'neonDeep', s: 'ember' }, null),
    },
    vsign(0, 'on'),
    vsign(1, 'on'),
    vsign(1, 'part'),
    {
      key: 'tube_glow',
      w: 20,
      h: 9,
      paint: (p) => {
        glowEllipse(p, 10, 4, 9, 4, 'paper', [0.16, 0.07]);
        p.rect(5, 3, 10, 1, 'paper');
      },
    },
    {
      key: 'headlight',
      w: 30,
      h: 9,
      paint: (p) => glowEllipse(p, 15, 4, 14, 4, 'honey', [0.3, 0.16, 0.07]),
    },
    {
      key: 'dot_red',
      w: 1,
      h: 1,
      paint: (p) => p.rect(0, 0, 1, 1, 'red'),
    },
    {
      key: 'dot_star',
      w: 1,
      h: 1,
      paint: (p) => p.rect(0, 0, 1, 1, 'paper'),
    },
  ];
}
