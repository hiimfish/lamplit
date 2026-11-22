import type { Role } from '../../content/types';
import type { Painter } from '../../game/painter';
import { idleKey, SPRITES, type PixelSprite } from '../../game/sprites';
import { BARISTA_SPRITE, CAFE_COUNTER, coreOrigin, CORE_H, CORE_W, paintCafe } from './cafe';
import { HALL_TABLE, LANDLORD_SPRITE, paintMoveIn } from './moveIn';

export { coreOrigin, CORE_H, CORE_W };

export type StageSide = 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

/** One character on a stage, placed in logical pixels from the top left of the 128x64 core. */
interface StageActor {
  sprite: PixelSprite;
  x: number;
  y: number;
  side: StageSide;
  /** Hide everything below this core y (a character standing behind the counter). */
  clipBottom?: number;
}

/** Everything a unit needs to show the little stage above its story. */
export interface StageConfig {
  /** Paints the background to fill a w x h stage (at least the core), core centred at the bottom. */
  paint(p: Painter, w: number, h: number): void;
  cast: Partial<Record<Role, StageActor>>;
  /** Top left of a 28x28 thought bubble over each side's character. */
  want: Record<StageSide, Point>;
  /** Top left of an 11x13 question bubble over each side's character. */
  ask: Record<StageSide, Point>;
  /** Where a 24x24 prop rests on the counter on each side. */
  rest: Record<StageSide, Point>;
}

const walker = SPRITES[idleKey('walker')];
if (!walker) throw new Error('walker idle sprite is missing');

const PROP_TOP = CAFE_COUNTER.top - 20;

const CAFE: StageConfig = {
  paint: paintCafe,
  cast: {
    guide: { sprite: walker, x: 20, y: 39, side: 'left' },
    barista: { sprite: BARISTA_SPRITE, x: 96, y: 19, side: 'right', clipBottom: CAFE_COUNTER.top },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: { left: { x: CAFE_COUNTER.x, y: PROP_TOP }, right: { x: 82, y: PROP_TOP } },
};

/** The key slides across the hall table, its shadow on the tabletop. */
const TABLE_PROP_TOP = HALL_TABLE.top - 19;

const MOVE_IN: StageConfig = {
  paint: paintMoveIn,
  cast: {
    guide: { sprite: walker, x: 20, y: 39, side: 'left' },
    landlord: { sprite: LANDLORD_SPRITE, x: 88, y: 39, side: 'right' },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 92, y: 25 } },
  rest: {
    left: { x: HALL_TABLE.x - 2, y: TABLE_PROP_TOP },
    right: { x: HALL_TABLE.x + 12, y: TABLE_PROP_TOP },
  },
};

/** Units without a stage show only the chat. */
const STAGES: Readonly<Record<string, StageConfig>> = { cafe: CAFE, move_in: MOVE_IN };

export function stageFor(unitId: string): StageConfig | undefined {
  return Object.prototype.hasOwnProperty.call(STAGES, unitId) ? STAGES[unitId] : undefined;
}

/** Unit ids that have a stage (for tests). */
export const STAGE_UNIT_IDS = Object.keys(STAGES);
