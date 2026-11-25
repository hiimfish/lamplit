import { getEmojiSprite } from '../art/emoji';
import { getItemSprite, ITEM_SIZE, spriteRuns, type PixelRun } from '../art/items';
import type { PixelSprite } from '../game/sprites';
import './itemIcon.css';

interface Props {
  /** Word id, e.g. "latte"; undefined for items that have no picture (chunks). */
  id: string | undefined;
  /**
   * The word's emoji: for a word with no hand-drawn icon, its pixel version is shown
   * (src/art/emoji); the emoji itself only if even that is missing.
   */
  fallback?: string;
}

const runCache = new WeakMap<PixelSprite, PixelRun[]>();

function spriteFor(id: string | undefined, fallback: string | undefined): PixelSprite | undefined {
  return (id !== undefined ? getItemSprite(id) : undefined) ?? getEmojiSprite(fallback);
}

function runsOf(sprite: PixelSprite): PixelRun[] {
  const cached = runCache.get(sprite);
  if (cached) return cached;
  const runs = spriteRuns(sprite);
  runCache.set(sprite, runs);
  return runs;
}

export function hasItemIcon(id: string | undefined): boolean {
  return id !== undefined && getItemSprite(id) !== undefined;
}

/** Word id of a `word:<id>` item, or undefined for chunks. */
export function iconIdOf(itemId: string): string | undefined {
  return itemId.startsWith('word:') ? itemId.slice('word:'.length) : undefined;
}

/**
 * A word's picture as crisp pixel art: an inline SVG of one rect per colour
 * run, sized in logical pixels (N * --px) so it sits on the game's pixel grid.
 * Decorative: the English word is always shown next to it.
 */
export function ItemIcon({ id, fallback }: Props) {
  const sprite = spriteFor(id, fallback);
  if (!sprite) {
    return fallback ? (
      <span class="item-icon-fallback" aria-hidden="true">
        {fallback}
      </span>
    ) : null;
  }
  return (
    <svg
      class="item-icon"
      data-item={id}
      viewBox={`0 0 ${ITEM_SIZE} ${ITEM_SIZE}`}
      shape-rendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {runsOf(sprite).map((r) => (
        <rect key={`${r.x},${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}
