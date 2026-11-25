import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EMOJI_SPRITE_KEYS, emojiKey, getEmojiSprite } from '../src/art/emoji';
import { getItemSprite, ITEM_SIZE, validateItemSprite } from '../src/art/items';

const UNITS_DIR = join(__dirname, '../src/data/units');

interface RawWord {
  id: string;
  emoji: string;
  abstract?: boolean;
}

const words: RawWord[] = readdirSync(UNITS_DIR)
  .filter((f) => f.endsWith('.json'))
  .flatMap(
    (f) => (JSON.parse(readFileSync(join(UNITS_DIR, f), 'utf8')) as { words: RawWord[] }).words,
  );

describe('emoji pixel icons', () => {
  it('every word has a pixel picture: hand-drawn, or its emoji in pixels', () => {
    const missing = words
      .filter((w) => !getItemSprite(w.id) && !getEmojiSprite(w.emoji))
      .map((w) => `${w.id} ${w.emoji}`);
    expect(missing).toEqual([]);
  });

  it('has no icons for emoji no word uses any more', () => {
    const used = new Set(words.filter((w) => w.abstract).map((w) => emojiKey(w.emoji)));
    expect(EMOJI_SPRITE_KEYS.filter((k) => !used.has(k))).toEqual([]);
  });

  it.each(EMOJI_SPRITE_KEYS)('%s is a valid 24x24 palette sprite', (key) => {
    const sprite = getEmojiSprite(key);
    expect(sprite).toBeDefined();
    if (!sprite) return;
    expect(validateItemSprite(sprite)).toEqual([]);
    expect(sprite.rows).toHaveLength(ITEM_SIZE);
  });

  it('finds an emoji with or without its variation selector', () => {
    expect(getEmojiSprite('⚠️')).toBe(getEmojiSprite('⚠'));
    expect(getEmojiSprite(undefined)).toBeUndefined();
    expect(getEmojiSprite('no such emoji')).toBeUndefined();
  });
});
