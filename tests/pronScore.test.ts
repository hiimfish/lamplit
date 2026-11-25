/**
 * 發音評分 (pronScore.ts): the target's words and letters, the CTC alignment and the score,
 * on hand-made model outputs (a frame says one token clearly).
 */
import { describe, expect, it } from 'vitest';
import {
  CTC_VOCAB,
  letterPeaks,
  logSoftmaxRows,
  numberWords,
  scorePronunciation,
  targetWords,
  wordScore,
} from '../src/learning/pronScore';
import {
  SPOKEN_LEVEL_LABEL,
  spokenLevel,
  spokenScoreText,
  unclearWords,
} from '../src/learning/spokenScore';

const ID = new Map<string, number>(CTC_VOCAB.map((t, i) => [t, i]));

/** One frame per token ('-' blank, '|' word gap, a letter), said with probability `p`. */
function frames(tokens: string, p = 0.97): Float32Array[] {
  return [...tokens].map((ch) => {
    const id = ID.get(ch === '-' ? '<pad>' : ch)!;
    const row = new Float32Array(CTC_VOCAB.length).fill(Math.log((1 - p) / (CTC_VOCAB.length - 1)));
    row[id] = Math.log(p);
    return row;
  });
}

describe('levels and text', () => {
  it('maps scores to levels at 40, 70 and 90', () => {
    expect([0, 39, 40, 69, 70, 89, 90, 100].map(spokenLevel)).toEqual([
      'unclear', 'unclear', 'partly', 'partly', 'mostly', 'mostly', 'clear', 'clear',
    ]); // prettier-ignore
  });

  it('has a zh-TW label for each level', () => {
    expect(SPOKEN_LEVEL_LABEL).toEqual({
      clear: '很清楚',
      mostly: '大致清楚',
      partly: '有些字不清楚',
      unclear: '要再練習',
    });
  });

  it('writes the score line and lists unclear words, leaving names out', () => {
    const score = {
      score: 72,
      level: 'mostly' as const,
      marks: [
        { word: 'Hi', status: 'hit' as const },
        { word: 'Grant', status: 'missed' as const, free: true },
        { word: 'thanks', status: 'near' as const },
      ],
    };
    expect(spokenScoreText(score)).toBe('發音 72 分・大致清楚');
    expect(unclearWords(score)).toEqual(['thanks']);
  });
});

describe('targetWords', () => {
  it('spells numbers and ordinals out', () => {
    expect(numberWords(0)).toBe('zero');
    expect(numberWords(42)).toBe('forty two');
    expect(numberWords(305)).toBe('three hundred five');
    expect(numberWords(2026)).toBe('two thousand twenty six');
    expect(targetWords('Gate 13, 2nd floor.').map((w) => w.letters)).toEqual([
      'GATE', 'THIRTEEN', 'SECOND', 'FLOOR',
    ]); // prettier-ignore
  });

  it('keeps apostrophes, drops punctuation, splits hyphens', () => {
    expect(targetWords("I'm well-known, thanks!")).toEqual([
      { word: "I'm", letters: "I'M", free: false },
      { word: 'well-known', letters: 'WELL KNOWN', free: false },
      { word: 'thanks', letters: 'THANKS', free: false },
    ]);
  });

  it('leaves names, titles and symbol words out of the count', () => {
    const words = targetWords('Thank you, Mr. Grant. It costs $5 at 3:30.');
    const free = Object.fromEntries(words.map((w) => [w.word, w.free]));
    expect(free).toMatchObject({
      Thank: false,
      Mr: true,
      Grant: true,
      It: false,
      $5: true,
      '3:30': true,
    });
    expect(words.find((w) => w.word === '$5')?.letters).toBe('FIVE DOLLARS');
  });
});

describe('alignment and score', () => {
  it('logSoftmaxRows makes each row sum to 1', () => {
    const rows = logSoftmaxRows([1, 2, 3, 0, 0, 0], 2, 3);
    for (const row of rows) expect([...row].reduce((a, x) => a + Math.exp(x), 0)).toBeCloseTo(1);
  });

  it('gives each letter its peak probability on its own frames', () => {
    const peaks = letterPeaks(frames('-G-O-'), [ID.get('G')!, ID.get('O')!]);
    expect(peaks?.map((p) => p.toFixed(2))).toEqual(['0.97', '0.97']);
  });

  it('needs a blank between a doubled letter, and enough frames', () => {
    const l = ID.get('L')!;
    expect(letterPeaks(frames('L-L'), [l, l])?.[1]).toBeCloseTo(0.97);
    expect(letterPeaks(frames('L'), [l, l])).toBeNull();
  });

  it('scores a clearly said sentence 100', () => {
    const result = scorePronunciation('Go on!', frames('-GO|O-N-'));
    expect(result).toMatchObject({ score: 100, level: 'clear' });
    expect(result?.marks.map((m) => m.status)).toEqual(['hit', 'hit']);
  });

  it('marks a word said as something else, and scores by letters', () => {
    const result = scorePronunciation('Go home', frames('-GO|-CAT-'));
    expect(result?.marks.map((m) => m.status)).toEqual(['hit', 'missed']);
    expect(result!.score).toBeLessThan(40);
  });

  it('maps a mean probability to 0..100', () => {
    expect([0.1, 0.2, 0.5, 0.8, 0.95].map(wordScore)).toEqual([0, 0, 50, 100, 100]);
  });

  it('returns null when the recording is too short to hold the letters', () => {
    expect(scorePronunciation('Good morning', frames('-G-'))).toBeNull();
  });
});
