import type { Role } from '../../content/types';
import type { Painter } from '../../game/painter';
import { idleKey, SPRITES, type PixelSprite } from '../../game/sprites';

/**
 * The shape of a stage: its background painter, who stands where, and where
 * bubbles and props go. Each location's file (cafe.ts, street.ts, ...) builds
 * one; index.ts lists them by unit id.
 */

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

/** The player: the same walker at the same spot, on the left of every stage. */
export const GUIDE_ACTOR: StageActor = { sprite: walker, x: 20, y: 39, side: 'left' };
