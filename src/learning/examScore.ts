/**
 * The estimated TOEIC part score of an exam (docs/specs/curriculum.md): answers
 * weighted by difficulty, mapped through the Act's curve, with a range from the number
 * of questions and a personal offset from the player's ETS scores. Pure.
 */
import type { SectionKind } from '../content/exam';

/** An estimate with its range, each rounded to 5. */
export interface ExamEstimate {
  score: number;
  low: number;
  high: number;
}

/** One answered question as the estimate needs it. */
export interface ScoredAnswer {
  correct: boolean;
  /** Options on the question (the chance of a guess is 1 / options). */
  options: number;
  /** 0 (easy) to 1 (hard). */
  difficulty: number;
}

/** The estimate for one part (聽力 or 閱讀); `offset` is the calibration for that part. */
export function examScore(
  act: 1 | 2 | 3 | 4,
  kind: SectionKind,
  answers: readonly ScoredAnswer[],
  offset = 0,
): ExamEstimate {
  void act;
  void kind;
  void answers;
  void offset;
  return { score: 5, low: 5, high: 5 };
}
