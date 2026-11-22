/** Shared drawing helpers for the item icons. */
import { ditherOn } from '../../game/painter';

export const ITEM_SIZE = 24;

export type Point = readonly [x: number, y: number, ch: string];

export interface Shadow {
  /** Centre and radii of the shadow ellipse, in pixels. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Legend key the shadow is painted with. */
  key: string;
}

/** Returns a copy of `rows` with single pixels replaced. */
export function stamp(rows: readonly string[], points: readonly Point[]): string[] {
  const grid = rows.map((row) => [...row]);
  for (const [x, y, ch] of points) {
    const row = grid[y];
    if (row && x >= 0 && x < row.length) row[x] = ch;
  }
  return grid.map((row) => row.join(''));
}

/**
 * Adds a soft contact shadow on the empty pixels of an ellipse: solid near
 * the centre, then two ordered-dither steps that fade out towards the rim.
 */
export function withShadow(rows: readonly string[], s: Shadow): string[] {
  const points: Point[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '.') continue;
      const d = ((x + 0.5 - s.cx) / s.rx) ** 2 + ((y + 0.5 - s.cy) / s.ry) ** 2;
      const level = d < 0.3 ? 16 : d < 0.65 ? 8 : d < 1 ? 3 : 0;
      if (level > 0 && ditherOn(x, y, level)) points.push([x, y, s.key]);
    }
  });
  return stamp(rows, points);
}
