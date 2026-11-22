import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import type { Unit } from '../src/content/types';
import { unitToAudioItems } from '../src/content/audioItems';
import { VOICE_NAMES, isValidAudioId } from '../src/audio/voices';

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

  it('speaks each line of a talk in its speaker voice, with a valid audio id', () => {
    const withTalk: Unit = {
      id: 'bank',
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
          talks: [
            {
              id: 'k1',
              lines: [
                { id: 'k1_1', role: 'clerk', en: 'Can I help you?', zh: '需要幫忙嗎？' },
                { id: 'k1_2', role: 'friend', en: 'Yes, please.', zh: '好，麻煩你。' },
                { id: 'k1_3', role: 'clerk', en: 'Sit down, please.', zh: '請坐。' },
              ],
              questions: [
                { en: 'Who helps?', zh: '誰幫忙？', options: ['A clerk', 'A friend'], answer: 0 },
              ],
            },
          ],
        },
      ],
    };
    const result = unitToAudioItems(withTalk);
    expect(result).toEqual([
      { id: 'bank.talk.k1_1', text: 'Can I help you?', role: 'clerk' },
      { id: 'bank.talk.k1_2', text: 'Yes, please.', role: 'friend' },
      { id: 'bank.talk.k1_3', text: 'Sit down, please.', role: 'clerk' },
    ]);
    expect(result.every((item) => isValidAudioId(item.id))).toBe(true);
  });

  it('speaks a monologue by the announcer like any talk, with valid ids and a voice', () => {
    const withMonologue: Unit = {
      id: 'airport',
      title: 't',
      titleEn: 't',
      chunks: [],
      words: [],
      tasks: [
        {
          id: 't7',
          title: 't',
          newChunkIds: [],
          newWordIds: [],
          scene: [],
          talks: [
            {
              id: 't7_talk',
              kind: 'monologue',
              lines: [
                { id: 't7_m1', role: 'announcer', en: 'Good evening.', zh: '晚安。' },
                { id: 't7_m2', role: 'announcer', en: 'Flight 20 is late.', zh: '20 號班機延誤。' },
                { id: 't7_m3', role: 'announcer', en: 'Thank you.', zh: '謝謝。' },
              ],
              questions: [
                {
                  en: 'What is late?',
                  zh: '什麼延誤？',
                  options: ['A flight', 'A bus'],
                  answer: 0,
                },
              ],
            },
          ],
        },
      ],
    };
    const result = unitToAudioItems(withMonologue);
    expect(result.map((item) => item.id)).toEqual([
      'airport.talk.t7_m1',
      'airport.talk.t7_m2',
      'airport.talk.t7_m3',
    ]);
    expect(result.every((item) => item.role === 'announcer' && isValidAudioId(item.id))).toBe(true);
    for (const family of Object.values(VOICE_NAMES)) expect(family.announcer).toBeTruthy();
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
