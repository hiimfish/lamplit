import type { Painter } from '../../game/painter';
import { CLIENT_SPRITE, DIRECTOR_SPRITE, SUPPLIER_SPRITE } from './act3Cast';
import { clipped, coreOrigin, CORE_H, paintFloor } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/** Placeholder until the annual meeting is painted: a plain wall and floor; everyone borrows a stand-in sprite. */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { oy } = coreOrigin(w, h);
  p.rect(0, 0, w, h, 'dusk');
  paintFloor(p, w, oy + CORE_H - 12, h);
}

export const ANNUAL_MEETING_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    manager: { sprite: MANAGER_SPRITE, x: 76, y: 39, side: 'right' },
    director: { sprite: DIRECTOR_SPRITE, x: 76, y: 39, side: 'right', beside: { x: 96, y: 39 } },
    supplier: { sprite: SUPPLIER_SPRITE, x: 76, y: 39, side: 'right', beside: { x: 56, y: 39 } },
    client: { sprite: CLIENT_SPRITE, x: 76, y: 39, side: 'right', beside: { x: 40, y: 39 } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: { left: { x: 54, y: 20 }, right: { x: 76, y: 20 } },
};
