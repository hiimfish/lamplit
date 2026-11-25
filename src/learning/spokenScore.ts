/**
 * The shape of a spoken score, shared by 大聲說說看's 評分 and 聽力加量's 跟著說. The score
 * itself comes from the on-device pronunciation model (pronScore.ts).
 */

export type SpokenLevel = 'clear' | 'mostly' | 'partly' | 'unclear';

/** One word of the target: said clearly, unclearly, or not recognisably. */
export interface SpokenMark {
  word: string;
  status: 'hit' | 'near' | 'missed';
  /** A name or a word read from symbols: shown, left out of the score. */
  free?: boolean;
}

export interface SpokenScore {
  /** 0 to 100. */
  score: number;
  level: SpokenLevel;
  /** One entry per word of the target, in order. */
  marks: SpokenMark[];
}

/** zh-TW wording of a level. */
export const SPOKEN_LEVEL_LABEL: Record<SpokenLevel, string> = {
  clear: '很清楚',
  mostly: '大致清楚',
  partly: '有些字不清楚',
  unclear: '要再練習',
};

/** 90 and up clear, 70 to 89 mostly, 40 to 69 partly, under 40 unclear. */
export function spokenLevel(score: number): SpokenLevel {
  if (score >= 90) return 'clear';
  if (score >= 70) return 'mostly';
  if (score >= 40) return 'partly';
  return 'unclear';
}

/** 「發音 83 分・大致清楚」: 大聲說說看's 評分 and 聽力加量's 跟著說. */
export function spokenScoreText(score: SpokenScore): string {
  return `發音 ${score.score} 分・${SPOKEN_LEVEL_LABEL[score.level]}`;
}

/** The counted words that were not clear (names and symbol words are left out). */
export function unclearWords(score: SpokenScore): string[] {
  return score.marks.filter((m) => m.status !== 'hit' && !m.free).map((m) => m.word);
}
