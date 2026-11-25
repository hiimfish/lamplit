import type { PixelSprite } from '../../game/sprites';
import { ITEM_SIZE } from '../items/draw';
import { EMOJI_LEGEND, EMOJI_ROWS } from './sprites';

/**
 * Pixel icons for the words that have no hand-drawn icon (the abstract words): each
 * word's emoji, scaled down to the item icon size and recoloured to the palette by
 * scripts/emoji-pixels.mjs (sprites.ts is generated; rerun the script after adding
 * a word with a new emoji).
 */

/** The lookup key of an emoji: without variation selectors (U+FE0F). */
export function emojiKey(emoji: string): string {
  return emoji.replace(/️/g, '');
}

const cache = new Map<string, PixelSprite>();

export function getEmojiSprite(emoji: string | undefined): PixelSprite | undefined {
  if (!emoji) return undefined;
  const key = emojiKey(emoji);
  const hit = cache.get(key);
  if (hit) return hit;
  const flat = Object.prototype.hasOwnProperty.call(EMOJI_ROWS, key) ? EMOJI_ROWS[key] : undefined;
  if (flat === undefined) return undefined;
  const rows = Array.from({ length: ITEM_SIZE }, (_, y) =>
    flat.slice(y * ITEM_SIZE, (y + 1) * ITEM_SIZE),
  );
  const sprite: PixelSprite = { rows, legend: EMOJI_LEGEND };
  cache.set(key, sprite);
  return sprite;
}

/** Every emoji that has a pixel icon (without U+FE0F; for tests). */
export const EMOJI_SPRITE_KEYS = Object.keys(EMOJI_ROWS);
