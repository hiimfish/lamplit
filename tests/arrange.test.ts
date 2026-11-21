import { describe, expect, it } from 'vitest';
import { gradeAnswer } from '../src/learning/grading';
import { makeRng, sentenceFrom, shuffleBlocks } from '../src/learning/questionGen';

describe('shuffleBlocks', () => {
  it('never returns the correct order', () => {
    const words = ['To', 'go,', 'please.'];
    for (let seed = 0; seed < 200; seed++) {
      const out = shuffleBlocks(words, ['To go, please.', 'To go.'], makeRng(seed));
      expect(out.join(' ')).not.toBe('To go, please.');
      expect([...out].sort()).toEqual([...words].sort());
    }
  });

  it('handles two-word sentences', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(shuffleBlocks(['Here', 'you'], ['Here you'], makeRng(seed))).toEqual(['you', 'Here']);
    }
  });
});

describe('arranged answers', () => {
  const blocks = ['get', 'Can', 'I', 'a', 'latte?'];
  it('builds the sentence from placed indices (duplicates allowed by index)', () => {
    expect(sentenceFrom(blocks, [1, 2, 0, 3, 4])).toBe('Can I get a latte?');
  });

  it('grades correct and wrong orders', () => {
    const accepted = ['Can I get a latte?'];
    expect(gradeAnswer(sentenceFrom(blocks, [1, 2, 0, 3, 4]), accepted).correct).toBe(true);
    const wrong = gradeAnswer(sentenceFrom(blocks, [1, 0, 2, 3, 4]), accepted);
    expect(wrong.correct).toBe(false);
    expect(wrong.error).toBe('word-order');
  });
});
