import { describe, expect, it } from 'vitest';
import { examFile } from '../src/content/exams';
import { EXAM_PLAN } from '../src/content/exam';
import { createEmptySave } from '../src/core/save';
import { correctOf, gradeSection, type ExamOutcome } from '../src/learning/exam';
import {
  finishSkip,
  isSkipAct,
  passSkip,
  skipNeeded,
  skipSections,
  type SkipAct,
} from '../src/learning/skipExam';

const NOW = new Date(2026, 10, 25, 12, 0, 0);
const ACTS: SkipAct[] = [1, 2, 3];

/** Every section answered: right for the first `right` questions, wrong after. */
function answered(act: SkipAct, seed: number, right: number): ExamOutcome[] {
  let left = right;
  return skipSections(act, seed).map((section) => {
    const answers: Record<string, string> = {};
    for (const item of section.items) {
      const good = correctOf(item.question) ?? 'o0';
      answers[item.qid] = left-- > 0 ? good : good === 'o0' ? 'o1' : 'o0';
    }
    return gradeSection(section, answers);
  });
}

const count = (act: SkipAct, seed: number) =>
  skipSections(act, seed).reduce((n, s) => n + s.items.length, 0);

describe('skipSections', () => {
  it.each(ACTS)('act %i: every section, about a third of a full form', (act) => {
    const exam = `exam${act}` as const;
    const sections = skipSections(act, 7);
    expect(sections.map((s) => s.id)).toEqual(EXAM_PLAN[exam].sections.map((p) => p.id));
    const full = EXAM_PLAN[exam].sections.reduce((n, p) => n + p.total, 0);
    const n = count(act, 7);
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(Math.ceil(full / 2));
  });

  it('is the same for a seed, and differs between seeds', () => {
    const ids = (seed: number) => skipSections(1, seed).flatMap((s) => s.items.map((i) => i.qid));
    expect(ids(7)).toEqual(ids(7));
    expect([1, 2, 3, 4, 5].some((seed) => ids(seed).join() !== ids(7).join())).toBe(true);
  });

  it('only asks written items of the exam (their audio is already made)', () => {
    for (const act of ACTS) {
      for (const section of skipSections(act, 3)) {
        const file = examFile(`exam${act}`, section.id);
        const known = new Set(
          Object.values(file ?? {})
            .filter(Array.isArray)
            .flatMap((items: { id?: string }[]) => items.map((it) => it.id)),
        );
        for (const item of section.items) expect(known.has(item.seenId)).toBe(true);
      }
    }
  });

  it('shrinks the reading countdown with the questions', () => {
    const reading = skipSections(1, 7).find((s) => s.kind === 'reading');
    expect(reading?.timer?.seconds).toBeGreaterThanOrEqual(60);
    expect(reading?.timer?.seconds).toBeLessThan(600);
  });
});

describe('finishSkip', () => {
  it('passes at 80% and opens the next act, with no exam record or coins', () => {
    const total = count(2, 5);
    const right = skipNeeded(total);
    const { save, summary } = finishSkip(createEmptySave(NOW), 2, answered(2, 5, right), NOW);
    expect(summary).toEqual({ correct: right, total, passed: true });
    expect(save.skipTo).toBe(2);
    expect(save.exams).toEqual({});
    expect(save.coins).toBe(0);
  });

  it('fails one short of 80% and opens nothing', () => {
    const total = count(1, 5);
    const right = skipNeeded(total) - 1;
    const { save, summary } = finishSkip(createEmptySave(NOW), 1, answered(1, 5, right), NOW);
    expect(summary.passed).toBe(false);
    expect(save.skipTo).toBeUndefined();
  });

  it('needs 80% rounded up', () => {
    expect(skipNeeded(10)).toBe(8);
    expect(skipNeeded(14)).toBe(12);
    expect(skipNeeded(15)).toBe(12);
  });
});

describe('passSkip', () => {
  it('only ever moves skipTo up', () => {
    const at3 = passSkip(createEmptySave(NOW), 3);
    expect(at3.skipTo).toBe(3);
    expect(passSkip(at3, 1).skipTo).toBe(3);
  });

  it('knows which acts have one', () => {
    expect([0, 1, 2, 3, 4].map(isSkipAct)).toEqual([false, true, true, true, false]);
  });
});
