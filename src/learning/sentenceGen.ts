/**
 * The sentence generator (docs/specs/content.md): builds new sentences from a lexicon,
 * a pattern and the words taught so far, and turns them into questions whose answers
 * the structure decides. Pure and seeded; no import of the units, the data comes in as
 * arguments, so tests and scripts use it too.
 */
import type { BlankKind, Lexicon, Pattern } from '../content/lexicon';
import type { Rng } from './gen/common';
import type { FillQuestion } from './questions';

/** A sentence built from a pattern, with the choices that made it. */
export interface Sentence {
  en: string;
  pattern: Pattern;
  /** Slot name to the word id (or text) placed in it. */
  slots: Record<string, string>;
}

/** A question and answer pair of a wh-question pattern (the answer is a phrase). */
export interface Qa {
  question: string;
  answer: string;
  /** Replies of other types: wrong by structure. */
  wrong: string[];
  grammarId: string;
}

/** `taught` is the set of word ids taught up to a location; only their entries are used. */
export type Taught = ReadonlySet<string>;

/** One sentence of the pattern, or null when the lexicon cannot fill it. */
export function buildSentence(
  pattern: Pattern,
  lexicon: Lexicon,
  taught: Taught,
  rng: Rng,
): Sentence | null {
  void pattern;
  void lexicon;
  void taught;
  void rng;
  return null;
}

/** A 填空 question on one blank of the sentence, with `grammarIds` and `itemId = NO_ITEM`. */
export function sentenceFill(sentence: Sentence, blank: BlankKind, rng: Rng): FillQuestion | null {
  void sentence;
  void blank;
  void rng;
  return null;
}

/** A wh-question about one position of a frame, with its right answer and wrong replies. */
export function buildQa(pattern: Pattern, lexicon: Lexicon, taught: Taught, rng: Rng): Qa | null {
  void pattern;
  void lexicon;
  void taught;
  void rng;
  return null;
}
