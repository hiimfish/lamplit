/**
 * 文法快練 (docs/specs/sprint.md): a short daily drill of generated grammar questions.
 * Which points to drill, the questions, and finishing a round. Pure; no FSRS cards.
 */
import type { GrammarPoint } from '../content/grammar';
import type { Lexicon } from '../content/lexicon';
import type { Route, SaveData } from '../core/save';
import type { Question } from './questions';
import type { Taught } from './sentenceGen';
import type { TownAct } from './townPlan';

/** Questions in one round: 10 on the normal route, 15 on the sprint. */
export function grammarGoal(route: Route): number {
  return route.kind === 'sprint' ? 15 : 10;
}

/** The points to drill today: only those already played, most `g:` mistakes first, then in turn. */
export function pickDrillPoints<U extends { id: string }>(
  save: SaveData,
  now: Date,
  town: readonly TownAct<U>[],
): GrammarPoint[] {
  void save;
  void now;
  void town;
  return [];
}

/** The round's questions for the points, from the lexicons and the words taught so far. */
export function buildDrill(
  points: readonly GrammarPoint[],
  lexicons: Record<string, Lexicon>,
  taught: Taught,
  seed: number,
): Question[] {
  void points;
  void lexicons;
  void taught;
  void seed;
  return [];
}

/** Counts a finished round: `daily.grammar`, the streak and the coins of a review round. */
export function finishDrill(save: SaveData, answered: number, now: Date): SaveData {
  void answered;
  void now;
  return save;
}
