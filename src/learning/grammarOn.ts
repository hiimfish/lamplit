import { GRAMMAR_POINTS } from '../content/grammar';
import { LEXICONS, PATTERNS } from '../content/lexicons';
import type { SaveData } from '../core/save';
import {
  buildDrill,
  drillAvailable,
  grammarGoal,
  pickDrillPoints,
  taughtUpTo,
} from './grammarDrill';

/** How many sentences the drill must be able to build before 每日目標 offers it. */
export const MIN_DRILL_QUESTIONS = 5;

let cached: { key: number; value: boolean } | undefined;

/**
 * Whether 文法快練 has enough to ask yet, for 每日目標 and its tally. It needs a played
 * task that teaches a grammar point with a pattern AND the words learned so far must let
 * the patterns build at least a few sentences; otherwise the drill would open on an empty
 * screen. Re-worked only when the number of plays changes (building sentences is not free).
 */
export function grammarOn(save: SaveData, town: Parameters<typeof drillAvailable>[1]): boolean {
  const key =
    Object.values(save.tasks).reduce((total, task) => total + task.plays, 0) * 10000 +
    Object.keys(save.tasks).length;
  if (cached?.key === key) return cached.value;
  const patterns = Object.values(PATTERNS).flat();
  let value = false;
  if (drillAvailable(save, town, GRAMMAR_POINTS, patterns)) {
    const withPattern = new Set(patterns.map((pattern) => pattern.grammarId));
    const points = pickDrillPoints(
      save,
      new Date(),
      town,
      GRAMMAR_POINTS.filter((point) => withPattern.has(point.id)),
    );
    const need = Math.min(MIN_DRILL_QUESTIONS, grammarGoal(save.route));
    value =
      buildDrill(points, LEXICONS, patterns, () => taughtUpTo(town, save), 1, need).length >= need;
  }
  cached = { key, value };
  return value;
}
