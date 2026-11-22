import type { PixelSprite } from '../../game/sprites';
import { BARISTA_SPRITE } from './cafe';
import { COUNSELOR_SPRITE } from './jobCenter';
import { LANDLORD_SPRITE, NEIGHBOR_SPRITE } from './moveIn';
import { VOLUNTEER_SPRITE } from './park';
import { CLERK_SPRITE } from './store';

/**
 * The people of Act 3 who stand on more than one stage, one 16x24 sprite each.
 * (Ms. Carter, the manager, is MANAGER_SPRITE in interview.ts; the announcer is
 * only a voice and is never drawn.)
 *
 * Stand-ins for now: each borrows the sprite of someone from Act 1 or 2 until
 * the real one is drawn here.
 */

/** Ms. Reed, the HR officer. */
export const HR_SPRITE: PixelSprite = COUNSELOR_SPRITE;

/** Dan, the senior sales person at the next desk. */
export const COWORKER_SPRITE: PixelSprite = CLERK_SPRITE;

/** Mr. Hughes, the British client. */
export const CLIENT_SPRITE: PixelSprite = LANDLORD_SPRITE;

/** Jack, the Australian sales rep of a supplier. */
export const SUPPLIER_SPRITE: PixelSprite = VOLUNTEER_SPRITE;

/** Luis, who runs the warehouse. */
export const WAREHOUSE_LEAD_SPRITE: PixelSprite = VOLUNTEER_SPRITE;

/** Mr. Grant, a customer with a late, then damaged, order. */
export const CUSTOMER_SPRITE: PixelSprite = LANDLORD_SPRITE;

/** The airline's agent at the check-in desk and the gate. */
export const AIRLINE_AGENT_SPRITE: PixelSprite = BARISTA_SPRITE;

/** The clerk at the hotel's front desk. */
export const HOTEL_CLERK_SPRITE: PixelSprite = NEIGHBOR_SPRITE;

/** Mr. Ellis, the director who started the company. */
export const DIRECTOR_SPRITE: PixelSprite = CLERK_SPRITE;
