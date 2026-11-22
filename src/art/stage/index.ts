import type { Role } from '../../content/types';
import { BARISTA_SPRITE, CAFE_COUNTER, coreOrigin, CORE_H, CORE_W, paintCafe } from './cafe';
import { BANK_STAGE } from './bank';
import { COMMUNITY_CENTER_STAGE } from './communityCenter';
import { LIBRARY_STAGE } from './library';
import { REPAIR_STAGE } from './repair';
import { JOB_CENTER_STAGE } from './jobCenter';
import { RESUME_STAGE } from './resume';
import { INTERVIEW_STAGE } from './interview';
import { DAY_BEFORE_STAGE } from './dayBefore';
import { CLINIC_STAGE } from './clinic';
import { CLOTHES_STAGE } from './clothes';
import { GUIDE_ACTOR, type StageConfig, type StageSide } from './config';
import { MARKET_STAGE } from './market';
import { HALL_TABLE, LANDLORD_SPRITE, NEIGHBOR_SPRITE, paintMoveIn } from './moveIn';
import { PARK_STAGE } from './park';
import { POST_OFFICE_STAGE } from './postOffice';
import { RESTAURANT_STAGE } from './restaurant';
import { CLERK_SPRITE, paintStore, STORE_COUNTER } from './store';
import { STREET_STAGE } from './street';

export { coreOrigin, CORE_H, CORE_W };
export type { StageConfig, StageSide };

const PROP_TOP = CAFE_COUNTER.top - 20;

const CAFE: StageConfig = {
  paint: paintCafe,
  cast: {
    guide: GUIDE_ACTOR,
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
    guide: GUIDE_ACTOR,
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
    guide: GUIDE_ACTOR,
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
  street: STREET_STAGE,
  market: MARKET_STAGE,
  clothes: CLOTHES_STAGE,
  clinic: CLINIC_STAGE,
  restaurant: RESTAURANT_STAGE,
  post_office: POST_OFFICE_STAGE,
  park: PARK_STAGE,
  bank: BANK_STAGE,
  community_center: COMMUNITY_CENTER_STAGE,
  library: LIBRARY_STAGE,
  repair: REPAIR_STAGE,
  job_center: JOB_CENTER_STAGE,
  resume: RESUME_STAGE,
  interview: INTERVIEW_STAGE,
  day_before: DAY_BEFORE_STAGE,
};

export function stageFor(unitId: string): StageConfig | undefined {
  return Object.prototype.hasOwnProperty.call(STAGES, unitId) ? STAGES[unitId] : undefined;
}

interface Point {
  x: number;
  y: number;
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
