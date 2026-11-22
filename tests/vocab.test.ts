import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Unit } from '../src/content/types';
import {
  difficultyScore,
  equivalentRank,
  lemmaOf,
  parseWordLists,
  profileUnits,
  rankOf,
  tokenize,
  type TaskProfile,
} from '../src/content/vocab';

const DIR = join(__dirname, '..', 'src', 'data', 'wordlists');
const utf8 = (f: string) => readFileSync(join(DIR, f), 'utf8');
const latin1 = (f: string) => readFileSync(join(DIR, f), 'latin1');

const lists = parseWordLists({
  ngslStats: utf8('NGSL_12_stats.csv'),
  ngslForms: utf8('NGSL_12_lemmatized_for_research.csv'),
  supForms: utf8('SUP_lemmatized.csv'),
  tslStats: latin1('TSL_12_stats.csv'),
  tslForms: latin1('TSL_12_lemmatized_for_research.csv'),
});

describe('tokenize', () => {
  it('lowercases words and drops punctuation, clitics and numbers', () => {
    expect(tokenize("Here's your key.").map((t) => t.word)).toEqual(['here', 'your', 'key']);
    expect(tokenize("I can't. It's $6.50!").map((t) => t.word)).toEqual(['i', 'can', 'it']);
    expect(tokenize('Trash goes out on Monday night, OK?').map((t) => t.word)).toEqual([
      'trash',
      'goes',
      'out',
      'on',
      'monday',
      'night',
      'ok',
    ]);
  });

  it('marks capitalised words that do not start a sentence', () => {
    const tokens = tokenize('Hi, I am Mr. Bell. Nice to meet you, Mei.');
    const named = tokens.filter((t) => t.midCapital).map((t) => t.word);
    expect(named).toEqual(['i', 'bell', 'mei']); // titles (Mr.) are dropped
  });
});

describe('word lists', () => {
  it('maps word forms to their lemma', () => {
    expect(lemmaOf(lists, 'went')).toBe('go');
    expect(lemmaOf(lists, 'is')).toBe('be');
    expect(lemmaOf(lists, 'boxes')).toBe('box');
    expect(lemmaOf(lists, 'mondays')).toBe('monday');
    expect(lemmaOf(lists, 'zzz')).toBe('zzz'); // off-list: itself
  });

  it('ranks NGSL, TSL and supplementary words', () => {
    expect(rankOf(lists, 'the')).toEqual({ list: 'ngsl', rank: 1 });
    expect(rankOf(lists, 'vacation')).toEqual({ list: 'tsl', rank: 2 });
    expect(rankOf(lists, 'café')).toEqual({ list: 'tsl', rank: 105 }); // ISO-8859-1 file
    expect(rankOf(lists, 'monday')).toEqual({ list: 'sup', rank: 0 });
    expect(rankOf(lists, 'latte')).toBeUndefined();
  });

  it('puts TSL words on the NGSL scale by their frequency index (SFI)', () => {
    expect(equivalentRank(lists, 'the')).toBe(1);
    // sandwich SFI 57.7 sits between chair (N1060, 59.31) and tea (N1599, 57.0).
    const sandwich = equivalentRank(lists, 'sandwich');
    expect(sandwich).toBeGreaterThan(1060);
    expect(sandwich).toBeLessThanOrEqual(1599);
    expect(equivalentRank(lists, 'monday')).toBe(300);
    expect(equivalentRank(lists, 'latte')).toBe(1000);
  });

  it('has the full lists', () => {
    expect(lists.ngslCount).toBe(2809);
    expect(lists.tslCount).toBe(1250);
  });
});

/** A two-task unit: task 2 reuses what task 1 taught. */
const unit = {
  id: 'demo',
  title: '示範',
  titleEn: 'Demo',
  chunks: [
    { id: 'can_i_get', en: 'Can I get a latte, please?', zh: '' },
    { id: 'how_much', en: 'How much is it?', zh: '' },
  ],
  words: [
    { id: 'latte', en: 'latte', zh: '', emoji: '' },
    { id: 'muffin', en: 'muffin', zh: '', emoji: '' },
  ],
  tasks: [
    {
      id: 't1',
      title: '',
      newChunkIds: ['can_i_get'],
      newWordIds: ['latte'],
      scene: [
        { id: 'a', role: 'barista', speaker: 'npc', en: 'Hi! What can I get for you?', zh: '' },
        {
          id: 'b',
          role: 'guide',
          speaker: 'player',
          en: 'Can I get a latte, please?',
          zh: '',
          chunkId: 'can_i_get',
        },
      ],
    },
    {
      id: 't2',
      title: '',
      newChunkIds: ['how_much'],
      newWordIds: ['muffin'],
      scene: [
        { id: 'c', role: 'barista', speaker: 'npc', en: 'A latte and a muffin, Mei?', zh: '' },
        {
          id: 'd',
          role: 'guide',
          speaker: 'player',
          en: 'Yes. How much is it?',
          zh: '',
          chunkId: 'how_much',
        },
        { id: 'e', role: 'barista', speaker: 'npc', en: 'Seven dollars, thanks.', zh: '' },
      ],
    },
  ],
} as unknown as Unit;

describe('profileUnits', () => {
  const [t1, t2] = profileUnits([unit], lists, { starterRank: 100 }) as [TaskProfile, TaskProfile];

  it('counts new items and the scene', () => {
    expect(t1).toMatchObject({ unitId: 'demo', taskId: 't1', newItems: 2, lines: 2 });
    expect(t2).toMatchObject({ newItems: 2, lines: 3 });
    expect(t2.avgLineWords).toBeCloseTo((5 + 5 + 3) / 3); // "Mei" is a name, not counted
  });

  it('lists the new lemmas with their band', () => {
    expect(t1.newLemmas).toContainEqual({ lemma: 'latte', band: '外' });
    expect(t1.newLemmas.map((l) => l.lemma)).not.toContain('can'); // starter word
  });

  it('rates word frequency from the words taught, whatever the starter set', () => {
    expect(t2.wordBands).toEqual(['外']); // muffin
    expect(t2.wordRanks).toEqual([1000]);
    const [, wide] = profileUnits([unit], lists, { starterRank: 1000 }) as [
      TaskProfile,
      TaskProfile,
    ];
    expect(wide.wordBands).toEqual(t2.wordBands);
  });

  it('treats starter words, earlier items and this task’s items as known', () => {
    expect(t1.unplanned).toEqual(['hi']); // NGSL rank 1826: not a starter word
    expect(t1.coverage).toBeCloseTo(12 / 13);
    // latte (task 1) is known now; yes (rank 228), seven, dollar, thank(s) were never taught.
    expect(t2.unplanned).toEqual(['dollar', 'seven', 'thank', 'yes']);
    expect(t2.coverage).toBeCloseTo(9 / 13);
  });

  it('leaves out names (even ones that are words) and spelled-out letters', () => {
    const named = {
      ...unit,
      tasks: [
        {
          ...unit.tasks[0],
          scene: [
            { id: 'n', role: 'landlord', speaker: 'npc', en: "I'm Mr. Bell. B-E-L-L.", zh: '' },
            { id: 'm', role: 'landlord', speaker: 'npc', en: 'See you on Monday.', zh: '' },
          ],
        },
      ],
    } as unknown as Unit;
    const [p] = profileUnits([named], lists, { starterRank: 100 }) as [TaskProfile];
    // "Mr. Bell" and the letters are not counted; Monday is a real word (supplementary list).
    expect(p.unplanned).toEqual(['monday']);
    expect(p.tokens).toBe(5); // i, see, you, on, monday
  });

  it('scores harder tasks higher', () => {
    expect(t1.score).toBeGreaterThanOrEqual(1);
    expect(t1.score).toBeLessThanOrEqual(100);
    const heavier = { ...t1, newItems: t1.newItems + 6 };
    expect(difficultyScore(heavier)).toBeGreaterThan(t1.score);
    const noisier = { ...t1, coverage: 0.9 };
    expect(difficultyScore(noisier)).toBeGreaterThan(t1.score);
  });
});
