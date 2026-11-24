/**
 * 幕結業考 sitting (docs/specs/ui-flow.md): which questions a section has, which form
 * (A or B) is sat, and the unlock rule. Pure: the seed makes a section repeatable, so
 * a reload halfway gets the same questions.
 */
import type { ExamSectionFile } from '../content/exam';
import type { ExamItem } from '../ui/exam/types';

/** The questions of a section: the generated ones plus the written ones of the chosen form. */
export function sectionQuestions(file: ExamSectionFile | undefined, seed: number): ExamItem[] {
  void file;
  void seed;
  return [];
}
