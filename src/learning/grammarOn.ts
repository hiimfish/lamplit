import { GRAMMAR_POINTS } from '../content/grammar';
import { PATTERNS } from '../content/lexicons';
import type { SaveData } from '../core/save';
import { drillAvailable } from './grammarDrill';

/**
 * Whether 文法快練 has anything to ask yet, for 每日目標 and its tally. The drill needs a
 * played task that teaches a grammar point which has a pattern; until the lexicon,
 * pattern files are filled it is false and the goal keeps its four blocks.
 */
export function grammarOn(save: SaveData, town: Parameters<typeof drillAvailable>[1]): boolean {
  return drillAvailable(save, town, GRAMMAR_POINTS, Object.values(PATTERNS).flat());
}
