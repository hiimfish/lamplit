/**
 * Generators of the exam's questions (docs/specs/curriculum.md): 應答題, 聽力填空,
 * 文法選句 and 價目表, made from the Act's story sentences and the verified bank. Pure:
 * the same seed gives the same questions. No new audio: sentences already have clips.
 */
import type { Unit } from '../content/types';
import type { Lexicon, RespondBankItem } from '../content/lexicon';
import type { Question } from './questions';

/** Sentence ids that must not become questions (src/data/examExclude.json). */
export interface ExamExclude {
  respond: string[];
  cloze: string[];
}

/** The generated questions of an Act; the caller deals them out to the sections. */
export function generateQuestions(
  act: number,
  units: readonly Unit[],
  seed: number,
  exclude: ExamExclude,
): Question[] {
  void act;
  void units;
  void seed;
  void exclude;
  return [];
}

/** Candidates for the verified 應答題 bank (written by SENTENCE_POOL=write, then reviewed). */
export function buildRespondBank(
  act: number,
  units: readonly Unit[],
  lexicon: Record<string, Lexicon>,
  seed: number,
): RespondBankItem[] {
  void act;
  void units;
  void lexicon;
  void seed;
  return [];
}
