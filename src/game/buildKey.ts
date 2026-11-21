/**
 * What the painted street depends on. A layout change can emit the scale
 * RESIZE event two or three times (setZoom refreshes, resize emits again);
 * the street only needs repainting when one of these values really changes.
 */
export interface BuildKey {
  /** Logical scene size, rounded the same way buildStreet rounds it. */
  width: number;
  height: number;
  animated: boolean;
}

export function buildKey(width: number, height: number, animated: boolean): BuildKey {
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    animated,
  };
}

/** True when nothing has been built yet or the size / motion setting changed. */
export function needsRebuild(previous: BuildKey | null, next: BuildKey): boolean {
  return (
    previous === null ||
    previous.width !== next.width ||
    previous.height !== next.height ||
    previous.animated !== next.animated
  );
}
