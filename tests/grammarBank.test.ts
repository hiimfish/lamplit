import { describe, expect, it } from 'vitest';
import { ACTS } from '../src/content/acts';
import { GRAMMAR_POINTS } from '../src/content/grammar';
import { GRAMMAR_BANK, GRAMMAR_BANK_FILES, validateGrammarBank } from '../src/content/grammarBank';

const good = {
  id: 'g_be-verb_01',
  grammarId: 'be-verb',
  en: 'I ___ your new neighbor.',
  zh: '我是你的新鄰居。',
  options: ['am', 'is', 'are', 'be'],
  answer: 0,
  note: '主詞 I 配 am。',
};
const check = (...items: unknown[]) => validateGrammarBank({ 'act1.json': { act: 1, items } });

describe('the grammar bank', () => {
  it('has no problems', () => {
    expect(validateGrammarBank(GRAMMAR_BANK_FILES)).toEqual([]);
  });

  it('has at least 5 items for every point a unit in the Acts teaches', () => {
    const units = new Set(ACTS.flatMap((act) => act.places.map((place) => place.unitId)));
    const taught = GRAMMAR_POINTS.filter((point) => units.has(point.unitId));
    expect(taught.length).toBeGreaterThan(0);
    const short = taught
      .filter((point) => (GRAMMAR_BANK[point.id]?.length ?? 0) < 5)
      .map((point) => point.id);
    expect(short).toEqual([]);
  });

  it('files every item under its own point', () => {
    for (const [id, items] of Object.entries(GRAMMAR_BANK)) {
      expect(items.every((item) => item.grammarId === id)).toBe(true);
    }
  });
});

describe('validateGrammarBank', () => {
  it('passes a good item', () => {
    expect(check(good)).toEqual([]);
  });

  it('flags a file that is not { act, items }', () => {
    expect(validateGrammarBank({ 'x.json': [good] })).toHaveLength(1);
  });

  it('flags an unknown grammarId', () => {
    expect(check({ ...good, grammarId: 'nope' })).toEqual([
      'act1.json g_be-verb_01: unknown grammarId nope',
    ]);
  });

  it('flags an id used twice, also across files', () => {
    expect(check(good, good)).toEqual(['act1.json g_be-verb_01: id not unique']);
    const two = validateGrammarBank({
      'a.json': { act: 1, items: [good] },
      'b.json': { act: 2, items: [good] },
    });
    expect(two).toEqual(['b.json g_be-verb_01: id not unique']);
  });

  it('flags no blank or two blanks', () => {
    expect(check({ ...good, en: 'I am here.' })).toHaveLength(1);
    expect(check({ ...good, en: 'I ___ ___ here.' })).toHaveLength(1);
  });

  it('flags the wrong number of options and repeated options', () => {
    expect(check({ ...good, options: ['am', 'is', 'are'] })).toEqual([
      'act1.json g_be-verb_01: needs exactly 4 options',
    ]);
    expect(check({ ...good, options: ['am', 'is', 'Am', 'be'] })).toEqual([
      'act1.json g_be-verb_01: options repeat',
    ]);
  });

  it('flags an answer out of range', () => {
    expect(check({ ...good, answer: 4 })).toEqual(['act1.json g_be-verb_01: answer out of range']);
    expect(check({ ...good, answer: -1 })).toHaveLength(1);
    expect(check({ ...good, answer: 1.5 })).toHaveLength(1);
  });

  it('flags an empty zh or note', () => {
    expect(check({ ...good, zh: ' ', note: '' })).toEqual([
      'act1.json g_be-verb_01: empty zh',
      'act1.json g_be-verb_01: empty note',
    ]);
  });
});
