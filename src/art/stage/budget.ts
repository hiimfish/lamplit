import type { Painter } from '../../game/painter';
import { DIRECTOR_SPRITE } from './act3Cast';
import { ACCOUNTANT_SPRITE } from './act4Cast';
import { clipped, coreOrigin, CORE_H, paintFloor } from './common';
import { GUIDE_ACTOR, type StageConfig } from './config';
import { MANAGER_SPRITE } from './interview';

/** Placeholder until the accountant's office is painted: a plain wall and floor; everyone borrows a stand-in sprite. */
function paint(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { oy } = coreOrigin(w, h);
  p.rect(0, 0, w, h, 'dusk');
  paintFloor(p, w, oy + CORE_H - 12, h);
}

export const BUDGET_STAGE: StageConfig = {
  paint,
  cast: {
    guide: GUIDE_ACTOR,
    accountant: { sprite: ACCOUNTANT_SPRITE, x: 76, y: 39, side: 'right' },
    manager: { sprite: MANAGER_SPRITE, x: 76, y: 39, side: 'right', beside: { x: 96, y: 39 } },
    director: { sprite: DIRECTOR_SPRITE, x: 76, y: 39, side: 'right', beside: { x: 56, y: 39 } },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: { left: { x: 54, y: 20 }, right: { x: 76, y: 20 } },
};
