/**
 * Pieces shared by questionGen.ts and the per-question-type generators in this folder.
 * Pure: all randomness comes from a seeded RNG so tests are deterministic.
 */

/** Returns numbers in [0, 1). */
export type Rng = () => number;

/** Small seeded generator (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

export const chunkItemId = (id: string) => `chunk:${id}`;
export const wordItemId = (id: string) => `word:${id}`;
export const pairItemId = (id: string) => `pair:${id}`;

/**
 * Text options in a shuffled order, with ids `o0`, `o1`... by their place in the content,
 * so the right one is `o${answer}`.
 */
export function shuffledOptions(
  options: readonly string[],
  rng: Rng,
): { id: string; label: string }[] {
  return shuffle(
    options.map((label, i) => ({ id: `o${i}`, label })),
    rng,
  );
}
