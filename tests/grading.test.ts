import { describe, expect, it } from 'vitest';
import { ERROR_HINTS } from '../src/learning/errorHints';
import { editDistance, gradeAnswer, normalize } from '../src/learning/grading';

const accept = ['Can I get a latte, please?', 'Can I get a latte?'];

describe('normalize', () => {
  it('ignores case, punctuation, curly quotes and extra spaces', () => {
    expect(normalize('  Can  I get a LATTE,  please?! ')).toBe('can i get a latte please');
    expect(normalize('I\u2019d like tea')).toBe("i'd like tea");
    expect(normalize("'Hello'")).toBe('hello');
  });

  it('keeps apostrophes inside words and handles empty input', () => {
    expect(normalize("don't")).toBe("don't");
    expect(normalize('')).toBe('');
    expect(normalize('?!')).toBe('');
  });
});

describe('editDistance', () => {
  it('counts single-letter edits', () => {
    expect(editDistance('latte', 'late')).toBe(1);
    expect(editDistance('cat', 'cat')).toBe(0);
    expect(editDistance('', 'abc')).toBe(3);
  });
});

describe('gradeAnswer: correct answers', () => {
  it('accepts either accepted version, however it is typed', () => {
    expect(gradeAnswer('can i get a latte please', accept)).toMatchObject({ correct: true });
    expect(gradeAnswer('Can I get a latte?', accept)).toMatchObject({ correct: true });
  });

  it('does not accept an empty answer', () => {
    expect(gradeAnswer('', [''])).toMatchObject({ correct: false });
    expect(gradeAnswer('   ', accept)).toMatchObject({ correct: false, error: 'missing-word' });
  });
});

describe('gradeAnswer: telling mistakes apart', () => {
  const cases: [string, string][] = [
    ['Can I get latte please', 'article'],
    ['Can I get the latte please', 'article'],
    ['Can I get a lattes please', 'plural'],
    ['Can I get a lattee please', 'spelling'],
    ['Can I a get latte please', 'word-order'],
    ['Can get a latte please', 'missing-word'],
    ['Can I get a big latte please', 'extra-word'],
    ['Do you sell tea today', 'other'],
  ];
  it.each(cases)('%s -> %s', (answer, error) => {
    const result = gradeAnswer(answer, accept);
    expect(result.correct).toBe(false);
    expect(result.error).toBe(error);
  });

  it('compares against the nearest accepted answer', () => {
    expect(gradeAnswer('Can I get a latte', accept).correct).toBe(true);
    expect(gradeAnswer('Can I get a muffin', accept).closest).toBe('Can I get a latte?');
  });

  it('has a Chinese hint for every error type', () => {
    expect(Object.keys(ERROR_HINTS)).toHaveLength(7);
    for (const hint of Object.values(ERROR_HINTS)) expect(hint.length).toBeGreaterThan(3);
  });
});
