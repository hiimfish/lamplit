import type { Role } from '../../content/types';
import type { Painter } from '../../game/painter';
import { idleKey, SPRITES, type PixelSprite } from '../../game/sprites';
import { BARISTA_SPRITE, CAFE_COUNTER, coreOrigin, CORE_H, CORE_W, paintCafe } from './cafe';
import { HALL_TABLE, LANDLORD_SPRITE, NEIGHBOR_SPRITE, paintMoveIn } from './moveIn';
import { CLERK_SPRITE, paintStore, STORE_COUNTER } from './store';

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
  /**
   * Where this NPC stands when another NPC is on the stage too (two NPCs who
   * share a spot when alone). Bubbles stay at the side's usual place, so lines
   * said from here carry no want/ask cue (tests check this).
   */
  beside?: Point;
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
    // Same spot as the landlord: each task shows only the NPCs who speak in it.
    // With the landlord there too, she stands in the open front door.
    neighbor: {
      sprite: NEIGHBOR_SPRITE,
      x: 88,
      y: 39,
      side: 'right',
      beside: { x: 107, y: 39 },
    },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 58, y: 8 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 92, y: 25 } },
  rest: {
    left: { x: HALL_TABLE.x - 2, y: TABLE_PROP_TOP },
    right: { x: HALL_TABLE.x + 12, y: TABLE_PROP_TOP },
  },
};

/** Props on the store counter, their shadow on the countertop like the café's. */
const STORE_PROP_TOP = STORE_COUNTER.top - 20;

const STORE: StageConfig = {
  paint: paintStore,
  cast: {
    guide: { sprite: walker, x: 20, y: 39, side: 'left' },
    clerk: { sprite: CLERK_SPRITE, x: 96, y: 19, side: 'right', clipBottom: STORE_COUNTER.top },
  },
  want: { left: { x: 30, y: 5 }, right: { x: 64, y: 2 } },
  ask: { left: { x: 25, y: 25 }, right: { x: 100, y: 5 } },
  rest: {
    left: { x: STORE_COUNTER.x, y: STORE_PROP_TOP },
    // A little left of the café's spot, so a prop stays clear of the clerk's face.
    right: { x: STORE_COUNTER.x + 22, y: STORE_PROP_TOP },
  },
};

/** Units without a stage show only the chat. */
const STAGES: Readonly<Record<string, StageConfig>> = {
  cafe: CAFE,
  move_in: MOVE_IN,
  store: STORE,
};

export function stageFor(unitId: string): StageConfig | undefined {
  return Object.prototype.hasOwnProperty.call(STAGES, unitId) ? STAGES[unitId] : undefined;
}

/** The player's role: on every stage, never counted as an NPC. */
const PLAYER: Role = 'guide';

/**
 * Where `role` stands while `roles` are on the stage: its `beside` spot when
 * another NPC is there too, its own spot otherwise. Undefined when not in the cast.
 */
export function actorSpot(
  config: StageConfig,
  role: Role,
  roles: readonly Role[],
): Point | undefined {
  const actor = config.cast[role];
  if (!actor) return undefined;
  const npcs = roles.filter((r) => r !== PLAYER && config.cast[r]);
  return npcs.length > 1 && actor.beside ? actor.beside : { x: actor.x, y: actor.y };
}

/** Unit ids that have a stage (for tests). */
export const STAGE_UNIT_IDS = Object.keys(STAGES);
