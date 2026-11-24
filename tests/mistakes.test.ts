import { describe, expect, it } from 'vitest';
import { createEmptySave, MISTAKE_TAG, MISTAKE_TAGS_PER_DAY } from '../src/core/save';
import type { SaveData } from '../src/core/save';
import {
  blockOf,
  labelOf,
  logAnswer,
  MISTAKE_LABELS,
  mistakeTags,
  mistakeTotals,
  topMistakes,
} from '../src/learning/mistakes';
import type { AnswerResult, Question } from '../src/learning/questions';

const NOW = new Date(2026, 10, 24, 12, 0, 0);
const TODAY = '2026-11-24';

function question(fields: Record<string, unknown>): Question {
  return { itemId: 'chunk:x', ...fields } as unknown as Question;
}

function result(correct: boolean, error?: string): AnswerResult {
  return { itemId: 'chunk:x', correct, usedHelp: false, ms: 1000, ...(error ? { error } : {}) };
}

function withDays(days: Record<string, Record<string, [number, number]>>): SaveData {
  return { ...createEmptySave(NOW), mistakes: days };
}

describe('mistakeTags: one test per row of the tag table', () => {
  it('listen-pair counts the pair and the kind', () => {
    const q = question({ kind: 'listen-pair', itemId: 'pair:f-v' });
    expect(mistakeTags(q, result(true))).toEqual(['p:f-v', 'k:listen-pair']);
  });

  it.each(['listen-pick', 'cloze', 'talk', 'respond'])('%s counts k:%s', (kind) => {
    expect(mistakeTags(question({ kind }), result(false))).toEqual([`k:${kind}`]);
  });

  it('a picture to listen to is k:picture-listen, a text picture is k:picture', () => {
    expect(mistakeTags(question({ kind: 'picture', listen: true }), result(true))).toEqual([
      'k:picture-listen',
    ]);
    expect(mistakeTags(question({ kind: 'picture' }), result(true))).toEqual(['k:picture']);
  });

  it.each(['arrange', 'spell', 'choose-reply'])('%s counts the kind and a wrong error', (kind) => {
    const q = question({ kind });
    expect(mistakeTags(q, result(true, 'article'))).toEqual([`k:${kind}`]);
    expect(mistakeTags(q, result(false, 'article'))).toEqual([`k:${kind}`, 'e:article']);
  });

  it('fill with grammar is k:fill-grammar, without it k:fill', () => {
    expect(mistakeTags(question({ kind: 'fill', grammar: true }), result(true))).toEqual([
      'k:fill-grammar',
    ]);
    expect(mistakeTags(question({ kind: 'fill' }), result(true))).toEqual(['k:fill']);
  });

  it('text-fill, read-sign and read-passage count their kind', () => {
    expect(mistakeTags(question({ kind: 'text-fill' }), result(true))).toEqual(['k:text-fill']);
    expect(mistakeTags(question({ kind: 'read-sign' }), result(true))).toEqual(['k:read-sign']);
    expect(mistakeTags(question({ kind: 'read-passage' }), result(true))).toEqual([
      'k:read-passage',
    ]);
  });

  it('speak is never tagged', () => {
    expect(mistakeTags(question({ kind: 'speak' }), result(true))).toEqual([]);
    expect(mistakeTags(question({ kind: 'speak' }), result(false))).toEqual([]);
  });
});

describe('mistakeTags: errors and grammar points', () => {
  it.each(['article', 'plural', 'word-order', 'spelling', 'missing-word', 'extra-word', 'other'])(
    'a wrong %s is tagged e:%s',
    (error) => {
      expect(mistakeTags(question({ kind: 'arrange' }), result(false, error))).toContain(
        `e:${error}`,
      );
    },
  );

  it('wrong-choice and unknown errors add no e: tag', () => {
    const q = question({ kind: 'choose-reply' });
    expect(mistakeTags(q, result(false, 'wrong-choice'))).toEqual(['k:choose-reply']);
    expect(mistakeTags(q, result(false, 'whatever'))).toEqual(['k:choose-reply']);
    expect(mistakeTags(q, result(false))).toEqual(['k:choose-reply']);
  });

  it('a fill with grammarIds logs g: tags instead of k:fill-grammar', () => {
    const q = question({ kind: 'fill', grammar: true, grammarIds: ['past-simple', 'article'] });
    expect(mistakeTags(q, result(false))).toEqual(['g:past-simple', 'g:article']);
  });

  it('grammarIds on another kind add g: next to the kind', () => {
    const q = question({ kind: 'text-fill', grammarIds: ['passive-past'] });
    expect(mistakeTags(q, result(true))).toEqual(['k:text-fill', 'g:passive-past']);
  });

  it('sanitises ids and drops ones that cannot be a tag', () => {
    const q = question({ kind: 'fill', grammarIds: ['Past Simple!', '', '***'] });
    const tags = mistakeTags(q, result(true));
    expect(tags).toEqual(['g:past-simple']);
    for (const tag of tags) expect(MISTAKE_TAG.test(tag)).toBe(true);
    const long = question({ kind: 'listen-pair', itemId: `pair:${'a'.repeat(80)}` });
    expect(mistakeTags(long, result(true))[0]).toBe(`p:${'a'.repeat(48)}`);
  });

  it('does not repeat a tag', () => {
    const q = question({ kind: 'fill', grammarIds: ['a', 'a'] });
    expect(mistakeTags(q, result(true))).toEqual(['g:a']);
  });
});

describe('logAnswer', () => {
  it('counts asked and missed under today', () => {
    const q = question({ kind: 'listen-pair', itemId: 'pair:f-v' });
    const wrong = logAnswer(createEmptySave(NOW), q, result(false), NOW);
    expect(wrong.mistakes[TODAY]).toEqual({ 'p:f-v': [1, 1], 'k:listen-pair': [1, 1] });
    const right = logAnswer(wrong, q, result(true), NOW);
    expect(right.mistakes[TODAY]).toEqual({ 'p:f-v': [1, 2], 'k:listen-pair': [1, 2] });
  });

  it('stores an e: tag once, on the wrong answer only', () => {
    const q = question({ kind: 'arrange' });
    const save = logAnswer(createEmptySave(NOW), q, result(false, 'word-order'), NOW);
    expect(save.mistakes[TODAY]).toEqual({ 'k:arrange': [1, 1], 'e:word-order': [1, 1] });
  });

  it('returns the same object for speak and for nothing to record', () => {
    const save = createEmptySave(NOW);
    expect(logAnswer(save, question({ kind: 'speak' }), result(false), NOW)).toBe(save);
    const bad = question({ kind: 'fill', grammarIds: ['***'] });
    expect(logAnswer(save, bad, result(false), NOW)).toBe(save);
  });

  it('never mutates its input', () => {
    const save = withDays({ [TODAY]: { 'k:cloze': [1, 2] } });
    const snapshot = JSON.stringify(save);
    const next = logAnswer(save, question({ kind: 'cloze' }), result(false), NOW);
    expect(JSON.stringify(save)).toBe(snapshot);
    expect(next).not.toBe(save);
    expect(next.mistakes[TODAY]?.['k:cloze']).toEqual([2, 3]);
  });

  it('increments today only and leaves other days alone', () => {
    const past = { 'k:cloze': [3, 4] as [number, number] };
    const save = withDays({ '2026-11-23': past });
    const next = logAnswer(save, question({ kind: 'cloze' }), result(false), NOW);
    expect(next.mistakes['2026-11-23']).toEqual(past);
    expect(next.mistakes[TODAY]).toEqual({ 'k:cloze': [1, 1] });
  });

  it('keeps at most 60 tags a day by dropping the fewest-missed, never the incremented one', () => {
    const day: Record<string, [number, number]> = {};
    for (let i = 0; i < MISTAKE_TAGS_PER_DAY; i++) day[`g:t${String(i).padStart(2, '0')}`] = [5, 6];
    day['g:low'] = [0, 9];
    delete day['g:t59'];
    expect(Object.keys(day)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    const save = withDays({ [TODAY]: day });
    const next = logAnswer(
      save,
      question({ kind: 'fill', grammarIds: ['new'] }),
      result(true),
      NOW,
    );
    const after = next.mistakes[TODAY] ?? {};
    expect(Object.keys(after)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(after['g:low']).toBeUndefined();
    expect(after['g:new']).toEqual([0, 1]);
  });

  it('keeps the tag being incremented even when it has the fewest misses', () => {
    const day: Record<string, [number, number]> = { 'g:mine': [0, 1] };
    for (let i = 0; i < MISTAKE_TAGS_PER_DAY - 1; i++) day[`g:t${i}`] = [4, 4];
    const save = withDays({ [TODAY]: day });
    const next = logAnswer(
      save,
      question({ kind: 'fill', grammarIds: ['mine', 'fresh'] }),
      result(true),
      NOW,
    );
    const after = next.mistakes[TODAY] ?? {};
    expect(after['g:mine']).toEqual([0, 2]);
    expect(after['g:fresh']).toEqual([0, 1]);
    expect(Object.keys(after)).toHaveLength(MISTAKE_TAGS_PER_DAY);
  });
});

describe('blockOf', () => {
  it.each([
    ['p:f-v', 'sound'],
    ['k:listen-pair', 'listening'],
    ['k:listen-pick', 'listening'],
    ['k:cloze', 'listening'],
    ['k:talk', 'listening'],
    ['k:respond', 'listening'],
    ['k:picture-listen', 'listening'],
    ['e:article', 'writing'],
    ['e:spelling', 'writing'],
    ['k:arrange', 'writing'],
    ['k:spell', 'writing'],
    ['k:choose-reply', 'writing'],
    ['k:fill-grammar', 'writing'],
    ['k:text-fill', 'writing'],
    ['g:past-simple', 'grammar'],
  ])('%s shows in %s', (tag, block) => {
    expect(blockOf(tag)).toBe(block);
  });

  it.each(['e:other', 'k:fill', 'k:picture', 'k:read-sign', 'k:read-passage', 'x:y', ''])(
    '%s is stored but not shown',
    (tag) => {
      expect(blockOf(tag)).toBeUndefined();
    },
  );
});

describe('mistakeTotals and topMistakes windows', () => {
  const save = withDays({
    [TODAY]: { 'p:a': [1, 2] },
    '2026-11-22': { 'p:a': [2, 3], 'p:b': [1, 1] },
    '2026-11-01': { 'p:a': [4, 5] },
  });

  it('sums the days ending today', () => {
    expect(mistakeTotals(save, NOW, 1)).toEqual({ 'p:a': [1, 2] });
    expect(mistakeTotals(save, NOW, 3)).toEqual({ 'p:a': [3, 5], 'p:b': [1, 1] });
    expect(mistakeTotals(save, NOW, 30)['p:a']).toEqual([7, 10]);
    expect(mistakeTotals(save, NOW, 0)).toEqual({});
  });

  it('a day just outside the window does not count', () => {
    expect(mistakeTotals(save, NOW, 2)['p:b']).toBeUndefined();
    expect(mistakeTotals(save, NOW, 24)['p:a']).toEqual([7, 10]);
    expect(mistakeTotals(save, NOW, 23)['p:a']).toEqual([3, 5]);
  });

  it('keeps the totals out of other blocks and drops rows never missed', () => {
    const s = withDays({
      [TODAY]: { 'p:ok': [0, 5], 'p:bad': [1, 2], 'k:cloze': [3, 3], 'e:other': [9, 9] },
    });
    expect(topMistakes(s, NOW, 30, 'sound')).toEqual([{ tag: 'p:bad', missed: 1, asked: 2 }]);
    expect(topMistakes(s, NOW, 30, 'listening').map((r) => r.tag)).toEqual(['k:cloze']);
    expect(topMistakes(s, NOW, 30, 'writing')).toEqual([]);
  });
});

describe('topMistakes ordering and limit', () => {
  it('sorts by missed, then rate, then tag', () => {
    const s = withDays({
      [TODAY]: {
        'p:c': [2, 4],
        'p:b': [2, 3],
        'p:a': [2, 3],
        'p:z': [3, 30],
        'p:y': [1, 1],
      },
    });
    expect(topMistakes(s, NOW, 30, 'sound').map((r) => r.tag)).toEqual([
      'p:z',
      'p:a',
      'p:b',
      'p:c',
      'p:y',
    ]);
  });

  it('limits to 5 by default and to the given limit', () => {
    const day: Record<string, [number, number]> = {};
    for (let i = 0; i < 8; i++) day[`p:s${i}`] = [i + 1, 10];
    const s = withDays({ [TODAY]: day });
    expect(topMistakes(s, NOW, 30, 'sound')).toHaveLength(5);
    expect(topMistakes(s, NOW, 30, 'sound')[0]?.tag).toBe('p:s7');
    expect(topMistakes(s, NOW, 30, 'sound', 2)).toHaveLength(2);
    expect(topMistakes(s, NOW, 30, 'sound', 0)).toEqual([]);
  });

  it('lists grammar points from g: tags', () => {
    const s = withDays({ [TODAY]: { 'g:past-simple': [2, 3], 'k:fill-grammar': [1, 1] } });
    expect(topMistakes(s, NOW, 30, 'grammar')).toEqual([
      { tag: 'g:past-simple', missed: 2, asked: 3 },
    ]);
  });
});

describe('labels', () => {
  it('has zh-TW names for e: and k: tags', () => {
    expect(MISTAKE_LABELS['e:article']).toBe('冠詞 a／an／the');
    expect(MISTAKE_LABELS['e:plural']).toBe('單複數');
    expect(MISTAKE_LABELS['e:word-order']).toBe('字的順序');
    expect(MISTAKE_LABELS['e:spelling']).toBe('拼字');
    expect(MISTAKE_LABELS['e:missing-word']).toBe('少了字');
    expect(MISTAKE_LABELS['e:extra-word']).toBe('多了字');
    expect(MISTAKE_LABELS['k:fill-grammar']).toBe('文法填空');
    expect(MISTAKE_LABELS['k:text-fill']).toBe('段落填空');
    expect(MISTAKE_LABELS['k:arrange']).toBe('排句子');
    expect(MISTAKE_LABELS['k:choose-reply']).toBe('選回答');
    expect(MISTAKE_LABELS['k:respond']).toBe('應答題');
  });

  it('labelOf uses the table first, then the lookup', () => {
    const lookup = (tag: string) => (tag === 'p:f-v' ? 'f／v' : undefined);
    expect(labelOf('k:cloze', lookup)).toBe('聽力填空');
    expect(labelOf('p:f-v', lookup)).toBe('f／v');
    expect(labelOf('g:x', lookup)).toBeUndefined();
    expect(labelOf('p:f-v')).toBeUndefined();
  });
});
