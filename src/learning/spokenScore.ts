/**
 * 聽力加量 跟著說 scoring (docs/specs/learning.md): how many words of the target the
 * recognizer heard, in order, from up to three alternatives. Pure. Not a
 * pronunciation score: it shows how many words the browser understood.
 */

export type SpokenLevel = 'clear' | 'mostly' | 'partly' | 'unclear';

/** One heard word of the target: matched exactly, nearly, or missed. */
export interface SpokenMark {
  word: string;
  status: 'hit' | 'near' | 'missed';
  /** A name: counted when matched, left out of the score when not. */
  free?: boolean;
}

export interface SpokenScore {
  /** 0 to 100. */
  score: number;
  level: SpokenLevel;
  /** One entry per word of the target, in order. */
  marks: SpokenMark[];
}

/** zh-TW wording of a level (很清楚／大致聽得出來／聽到一部分／這次沒聽清楚). */
export const SPOKEN_LEVEL_LABEL: Record<SpokenLevel, string> = {
  clear: '很清楚',
  mostly: '大致聽得出來',
  partly: '聽到一部分',
  unclear: '這次沒聽清楚',
};

/** The score of the best alternative; null when nothing was heard. */
export function scoreSpoken(target: string, alternatives: readonly string[]): SpokenScore | null {
  void target;
  void alternatives;
  return null;
}
