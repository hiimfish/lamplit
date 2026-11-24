import { GRAMMAR_POINTS, type GrammarPoint } from '../content/grammar';
import { GRAMMAR_BANK } from '../content/grammarBank';
import type { SaveData } from '../core/save';
import { grammarGoal, pickDrillPoints, type DrillUnit } from './grammarDrill';
import type { TownAct } from './townPlan';

/** How many bank items the drill must have before 每日目標 offers it. */
export const MIN_DRILL_QUESTIONS = 5;

/** Today's points: the played ones that have items in the grammar bank. */
export function drillPointsToday<U extends DrillUnit>(
  save: SaveData,
  now: Date,
  town: readonly TownAct<U>[],
): GrammarPoint[] {
  const withItems = GRAMMAR_POINTS.filter((point) => (GRAMMAR_BANK[point.id]?.length ?? 0) > 0);
  return pickDrillPoints(save, now, town, withItems);
}

/**
 * Whether 文法快練 has enough to ask yet, for 每日目標 and its tally: the points already
 * played must hold at least a few bank items; otherwise the drill would open on an
 * empty screen.
 */
export function grammarOn<U extends DrillUnit>(
  save: SaveData,
  town: readonly TownAct<U>[],
): boolean {
  const need = Math.min(MIN_DRILL_QUESTIONS, grammarGoal(save.route));
  const items = drillPointsToday(save, new Date(), town).reduce(
    (total, point) => total + (GRAMMAR_BANK[point.id]?.length ?? 0),
    0,
  );
  return items >= need;
}
