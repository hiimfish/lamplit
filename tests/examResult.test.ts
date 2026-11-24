import { beforeAll, describe, expect, it, vi } from 'vitest';

type Words = typeof import('../src/ui/exam/ExamResult');
let words: Words;

// ExamResult pulls in appState, which reads window at load; the wording helpers need none of it.
beforeAll(async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: () => undefined });
  words = await import('../src/ui/exam/ExamResult');
});

describe('exam result wording', () => {
  it('says how many were right, with the share', () => {
    expect(words.correctText(12, 16)).toBe('答對 12／16（75%）');
    expect(words.correctText(2, 3)).toBe('答對 2／3（67%）');
    expect(words.correctText(0, 0)).toBe('答對 0／0（0%）');
  });

  it('writes the estimate as a guide, with its range and parts', () => {
    expect(words.estimateText({ score: 205, low: 180, high: 230 })).toBe(
      '估計約 205 分（180～230），只能參考',
    );
    expect(
      words.partsText({ score: 105, low: 90, high: 120 }, { score: 100, low: 85, high: 115 }),
    ).toBe('聽力約 105、閱讀約 100');
  });

  it('says how the estimates were calibrated', () => {
    expect(words.calibrationText(2)).toBe('已依你 2 次多益練習題分數校正');
    expect(words.calibrationText(0)).toContain('還沒校正');
  });

  it('names the cap of each Act', () => {
    expect(words.capText(1)).toBe('第一幕結業考最高只能估到 300 分');
    expect(words.capText(4)).toBe('第四幕結業考最高只能估到 700 分');
  });

  it('words the verdict and the retake', () => {
    expect(words.verdictText('behind', 375, 5)).toBe('和第 5 週的目標 375 比：落後');
    expect(words.verdictText('ahead', 225, 3)).toContain('領先');
    expect(words.retakeText(7)).toBe('有 7 題你看過，分數可能偏高。');
  });
});
