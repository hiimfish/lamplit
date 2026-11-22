import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import type { Unit } from '../src/content/types';
import { unitToAudioItems } from '../src/content/audioItems';

const unit = cafe as unknown as Unit;

describe('unitToAudioItems', () => {
  const items = unitToAudioItems(unit);

  it('has unique ids with the expected prefixes', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const chunk of unit.chunks) {
      expect(items.find((i) => i.id === `${unit.id}.chunk.${chunk.id}`)?.text).toBe(chunk.en);
    }
    for (const word of unit.words) {
      expect(items.find((i) => i.id === `${unit.id}.word.${word.id}`)?.role).toBe('guide');
    }
  });

  it('uses the line role for scene lines', () => {
    for (const task of unit.tasks) {
      for (const line of task.scene) {
        const item = items.find((i) => i.id === `${unit.id}.line.${line.id}`);
        expect(item?.role).toBe(line.role);
        expect(item?.text).toBe(line.en);
      }
    }
  });

  it('speaks the right sentence of each picture in the guide voice', () => {
    const withPicture: Unit = {
      id: 'u',
      title: 't',
      titleEn: 't',
      chunks: [],
      words: [],
      tasks: [
        {
          id: 't1',
          title: 't',
          newChunkIds: [],
          newWordIds: [],
          scene: [],
          pictures: [
            {
              id: 'p1',
              pictureId: 'reading',
              options: [
                { en: 'She is drinking tea.', zh: '她在喝茶。' },
                { en: 'She is reading a book.', zh: '她在看書。' },
              ],
              answer: 1,
            },
          ],
        },
      ],
    };
    expect(unitToAudioItems(withPicture)).toEqual([
      { id: 'u.picture.p1', text: 'She is reading a book.', role: 'guide' },
    ]);
  });

  it('keeps one item when ids collide and skips accept variants', () => {
    const dup: Unit = {
      id: 'u',
      title: 't',
      titleEn: 't',
      chunks: [
        { id: 'a', en: 'Hi', zh: '嗨', accept: ['Hello'] },
        { id: 'a', en: 'Hi again', zh: '嗨' },
      ],
      words: [],
      tasks: [],
    };
    const result = unitToAudioItems(dup);
    expect(result).toEqual([{ id: 'u.chunk.a', text: 'Hi', role: 'guide' }]);
  });
});
