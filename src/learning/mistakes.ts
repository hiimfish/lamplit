/**
 * 最常錯的音和文法 (docs/specs/ui-flow.md): every answer is tagged and counted per
 * day in `save.mistakes`. Tags: `p:<pairId>` (a sound pair), `k:<question kind>`,
 * `e:<error type>` and `g:<grammar point id>`. Pure.
 */
import type { MistakeCount, SaveData } from '../core/save';
import type { AnswerResult, Question } from './questions';

/** The dashboard blocks: 聽不清楚的音, 文法和拼字, 聽力題型, 文法點. */
export type MistakeBlock = 'sound' | 'writing' | 'listening' | 'grammar';

export interface MistakeRow {
  tag: string;
  missed: number;
  asked: number;
}

/** Display names of the tags shown (zh-TW). */
export const MISTAKE_LABELS: Record<string, string> = {};

/** The tags one answer counts under; every tag is asked, a wrong answer also counts missed. */
export function mistakeTags(question: Question, result: AnswerResult): string[] {
  void question;
  void result;
  return [];
}

/** The save with this answer counted in today's tags. */
export function logAnswer(
  save: SaveData,
  question: Question,
  result: AnswerResult,
  now: Date,
): SaveData {
  void question;
  void result;
  void now;
  return save;
}

/** Counts per tag over the last `days` days up to `now`. */
export function mistakeTotals(
  save: SaveData,
  now: Date,
  days: number,
): Record<string, MistakeCount> {
  void save;
  void now;
  void days;
  return {};
}

/** The block a tag shows in; undefined for tags that are stored but not shown. */
export function blockOf(tag: string): MistakeBlock | undefined {
  void tag;
  return undefined;
}

/** The most-missed rows of a block over the last `days` days, at most `limit`. */
export function topMistakes(
  save: SaveData,
  now: Date,
  days: number,
  block: MistakeBlock,
  limit = 5,
): MistakeRow[] {
  void save;
  void now;
  void days;
  void block;
  void limit;
  return [];
}
