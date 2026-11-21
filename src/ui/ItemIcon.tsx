import { getItemSprite, ITEM_SIZE, spriteRuns, type PixelRun } from '../art/items';
import './itemIcon.css';

interface Props {
  /** Word id, e.g. "latte"; undefined for items that have no picture (chunks). */
  id: string | undefined;
  /** Shown instead when there is no pixel icon for `id` yet (the word's emoji). */
  fallback?: string;
}

const runCache = new Map<string, PixelRun[]>();

function runsFor(id: string | undefined): PixelRun[] | undefined {
  if (id === undefined) return undefined;
  const cached = runCache.get(id);
  if (cached) return cached;
  const sprite = getItemSprite(id);
  if (!sprite) return undefined;
  const runs = spriteRuns(sprite);
  runCache.set(id, runs);
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
  const runs = runsFor(id);
  if (!runs) {
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
      {runs.map((r) => (
        <rect key={`${r.x},${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}
