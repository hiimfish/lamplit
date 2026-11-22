import type { Role, Unit } from './types';
import { validateUnit } from './validate';

/** Every unit JSON file; UNIT_ORDER sets the play order (unlisted units go last). */
const modules = import.meta.glob<unknown>('../data/units/*.json', {
  eager: true,
  import: 'default',
});

const UNIT_ORDER = ['move_in', 'cafe'];

/** Keeps only units that pass validateUnit; broken ones are skipped (with a warning in dev). */
function validUnits(raw: Record<string, unknown>): Unit[] {
  const units: Unit[] = [];
  for (const [path, unit] of Object.entries(raw)) {
    const problems = validateUnit(unit);
    if (problems.length === 0) {
      units.push(unit as Unit);
    } else if (import.meta.env.DEV) {
      console.warn(`Skipping unit ${path}: ${problems.join('; ')}`);
    }
  }
  return units;
}

export const UNITS: Unit[] = validUnits(modules).sort((a, b) => {
  const ia = UNIT_ORDER.indexOf(a.id);
  const ib = UNIT_ORDER.indexOf(b.id);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

export interface ItemInfo {
  itemId: string;
  kind: 'chunk' | 'word' | 'pair';
  unitId: string;
  text: string;
  zh: string;
  audioId: string;
  /** Voice role for the fallback speech; items are spoken by the guide voice. */
  role: Role;
  emoji?: string;
  note?: string;
  /** Minimal pairs only: the contrast (e.g. "f／v") and both words with their audio. */
  focus?: string;
  sides?: { id: string; en: string; zh: string; audioId: string }[];
}

/** Looks up `chunk:<id>`, `word:<id>` or `pair:<id>` across all units. */
export function getItem(itemId: string): ItemInfo | undefined {
  const [kind, id] = itemId.split(':');
  for (const unit of UNITS) {
    if (kind === 'pair') {
      const pair = unit.pairs?.find((p) => p.id === id);
      if (pair) {
        const sides = [pair.a, pair.b].map((s) => ({
          id: s.id,
          en: s.en,
          zh: s.zh,
          audioId: `${unit.id}.pair.${s.id}`,
        }));
        return {
          itemId,
          kind: 'pair',
          unitId: unit.id,
          text: `${pair.a.en} / ${pair.b.en}`,
          zh: `${pair.a.zh} / ${pair.b.zh}`,
          audioId: `${unit.id}.pair.${pair.a.id}`,
          role: 'guide',
          note: pair.note,
          focus: pair.focus,
          sides,
        };
      }
    }
    if (kind === 'chunk') {
      const chunk = unit.chunks.find((c) => c.id === id);
      if (chunk) {
        return {
          itemId,
          kind: 'chunk',
          unitId: unit.id,
          text: chunk.en,
          zh: chunk.zh,
          audioId: `${unit.id}.chunk.${chunk.id}`,
          role: 'guide',
          note: chunk.note,
        };
      }
    } else if (kind === 'word') {
      const word = unit.words.find((w) => w.id === id);
      if (word) {
        return {
          itemId,
          kind: 'word',
          unitId: unit.id,
          text: word.en,
          zh: word.zh,
          audioId: `${unit.id}.word.${word.id}`,
          role: 'guide',
          emoji: word.emoji,
        };
      }
    }
  }
  return undefined;
}

export function lineAudioId(unitId: string, lineId: string): string {
  return `${unitId}.line.${lineId}`;
}

/** Item ids a task teaches: chunks, then words, then minimal pairs. */
export function taskItemIds(task: {
  newChunkIds: string[];
  newWordIds: string[];
  newPairIds?: string[];
}): string[] {
  return [
    ...task.newChunkIds.map((id) => `chunk:${id}`),
    ...task.newWordIds.map((id) => `word:${id}`),
    ...(task.newPairIds ?? []).map((id) => `pair:${id}`),
  ];
}
