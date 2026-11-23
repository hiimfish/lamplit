import type { PixelSprite } from '../../game/sprites';
import { AIRLINE_AGENT_SPRITE } from './act3Cast';
import { COUNSELOR_SPRITE } from './jobCenter';
import { LANDLORD_SPRITE, NEIGHBOR_SPRITE } from './moveIn';
import { VOLUNTEER_SPRITE } from './park';
import { FRIEND_SPRITE } from './restaurant';
import { CLERK_SPRITE } from './store';

/**
 * The new people of Act 4, one 16x24 sprite each, facing left like every other
 * NPC. (The people carried over are in act3Cast.ts and interview.ts; the UK
 * border officer of the branch is drawn in branch.ts only; the announcer is
 * only a voice and is never drawn.)
 *
 * Stand-ins for now: each borrows the sprite of someone from an earlier act
 * (a woman's for the women) until the real one is drawn here.
 */

/** Ms. Patel, the part-time accountant. */
export const ACCOUNTANT_SPRITE: PixelSprite = COUNSELOR_SPRITE;

/** Nina Ortiz, of the marketing agency. */
export const AGENCY_SPRITE: PixelSprite = FRIEND_SPRITE;

/** Leo Martin, 26: the applicant, then the new assistant. */
export const NEW_HIRE_SPRITE: PixelSprite = CLERK_SPRITE;

/** Mr. Shaw, the lawyer. */
export const LAWYER_SPRITE: PixelSprite = LANDLORD_SPRITE;

/** Ms. Varga, who runs Brightway's plant in Taoyuan. */
export const PLANT_MANAGER_SPRITE: PixelSprite = NEIGHBOR_SPRITE;

/** Ms. Wright, the British manager of the new London branch. */
export const BRANCH_MANAGER_SPRITE: PixelSprite = AIRLINE_AGENT_SPRITE;

/** Ryan Cole, the Canadian reporter. */
export const REPORTER_SPRITE: PixelSprite = VOLUNTEER_SPRITE;
