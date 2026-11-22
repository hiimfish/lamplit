import type { AudioItem, Unit } from './types';

/**
 * Every spoken thing in a unit: chunks, words, both sides of each minimal pair and scene
 * lines (main text only, no `accept` variants).
 */
export function unitToAudioItems(unit: Unit): AudioItem[] {
  const items: AudioItem[] = [];
  for (const chunk of unit.chunks) {
    items.push({ id: `${unit.id}.chunk.${chunk.id}`, text: chunk.en, role: 'guide' });
  }
  for (const word of unit.words) {
    items.push({ id: `${unit.id}.word.${word.id}`, text: word.en, role: 'guide' });
  }
  for (const pair of unit.pairs ?? []) {
    for (const side of [pair.a, pair.b]) {
      items.push({ id: `${unit.id}.pair.${side.id}`, text: side.en, role: 'guide' });
    }
  }
  for (const task of unit.tasks) {
    for (const line of task.scene) {
      items.push({ id: `${unit.id}.line.${line.id}`, text: line.en, role: line.role });
    }
    // 看圖選句: only the sentence that matches the picture is spoken, after answering.
    for (const picture of task.pictures ?? []) {
      const right = picture.options[picture.answer];
      if (right)
        items.push({ id: `${unit.id}.picture.${picture.id}`, text: right.en, role: 'guide' });
    }
  }
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
