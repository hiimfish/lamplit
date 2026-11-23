import type { AudioItem, Unit } from './types';

/**
 * Every spoken thing in a unit: chunks, words, both sides of each minimal pair, scene
 * lines (main text only, no `accept` variants), the right sentence of each picture (each
 * of the 4 sentences of a sound-option picture, by the announcer), the lines of each
 * conversation to hear, and each 應答題 prompt (by its role) and response (by the guide).
 *
 * scripts/gen-audio.mjs runs this file in plain Node, so it imports no run-time value: the
 * ids and roles below are spelled out (the same as pictureOptionAudioId and
 * LISTEN_PICTURE_ROLE in checks/pictures.ts, respondAudioId, responseAudioId and
 * RESPONSE_ROLE in checks/responds.ts; tests/audioItems.test.ts checks they agree).
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
    // 看圖選句聲音選項: every sentence is heard, in the announcer's voice.
    for (const picture of task.pictures ?? []) {
      if (picture.listen) {
        picture.options.forEach((option, i) => {
          items.push({
            id: `${unit.id}.pictureopt.${picture.id}_${i}`,
            text: option.en,
            role: 'announcer',
          });
        });
        continue;
      }
      const right = picture.options[picture.answer];
      if (right)
        items.push({ id: `${unit.id}.picture.${picture.id}`, text: right.en, role: 'guide' });
    }
    // 聽對話答題: each line in its speaker's voice, `${unitId}.talk.${lineId}`.
    for (const talk of task.talks ?? []) {
      for (const line of talk.lines) {
        items.push({ id: `${unit.id}.talk.${line.id}`, text: line.en, role: line.role });
      }
    }
    // 應答題: the prompt in its role's voice, each response in yours.
    for (const item of task.responds ?? []) {
      const { role, en } = item.prompt;
      items.push({ id: `${unit.id}.respond.${item.id}`, text: en, role });
      item.responses.forEach((response, i) => {
        items.push({
          id: `${unit.id}.response.${item.id}_${i}`,
          text: response.en,
          role: 'guide',
        });
      });
    }
  }
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
