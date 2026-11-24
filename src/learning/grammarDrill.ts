/**
 * 文法快練 (docs/specs/sprint.md): a short daily drill of generated grammar questions.
 * Which points to drill, the questions, and finishing a round. Pure; no FSRS cards.
 * Nothing here imports the units: the town, points, lexicons and patterns come in as
 * arguments, and the sentence generator can be swapped for a fake in tests.
 */
import type { GrammarPoint } from '../content/grammar';
import type { BlankKind, Lexicon, Pattern } from '../content/lexicon';
import { dailyFor, touchPlayed } from '../core/save';
import type { Route, SaveData } from '../core/save';
import { makeRng } from './gen/common';
import type { Rng } from './gen/common';
import { mistakeTotals } from './mistakes';
import type { AnswerResult, FillQuestion, Question } from './questions';
import { addCoins, reviewCoins, taskKey } from './sessionPlan';
import { buildSentence, sentenceFill } from './sentenceGen';
import { grammarPointOf } from '../content/grammar';
import type { Sentence, Taught } from './sentenceGen';
import { actUnits } from './townPlan';
import type { TownAct } from './townPlan';

/** Days of `g:` counts that decide which points come first. */
const MISTAKE_DAYS = 30;

/** Points a round practises at most. */
export const DRILL_POINTS = 6;

/** Tries per question before a point is given up for the round. */
const TRIES = 8;

/** The part of a unit the drill needs: its tasks and the words each teaches. */
export interface DrillUnit {
  id: string;
  tasks: readonly { id: string; newWordIds: readonly string[] }[];
}

/** The two generator functions, injectable so tests can use fakes. */
export interface DrillDeps {
  buildSentence: (pattern: Pattern, lexicon: Lexicon, taught: Taught, rng: Rng) => Sentence | null;
  sentenceFill: (sentence: Sentence, blank: BlankKind, rng: Rng) => FillQuestion | null;
}

const realDeps: DrillDeps = {
  buildSentence,
  sentenceFill: (sentence, blank, rng) =>
    sentenceFill(sentence, blank, rng, (id) => grammarPointOf(id)?.note),
};

/** Questions in one round: 10 on the normal route, 15 on the sprint. */
export function grammarGoal(route: Route): number {
  return route.kind === 'sprint' ? 15 : 10;
}

/** Questions still to answer today (never below 0). */
export function drillRemaining(save: SaveData, route: Route, now: Date): number {
  return Math.max(0, grammarGoal(route) - dailyFor(save, now).grammar);
}

/** The points whose home task exists in the town and has been played at least once. */
function playedPoints<U extends DrillUnit>(
  save: SaveData,
  town: readonly TownAct<U>[],
  points: readonly GrammarPoint[],
): GrammarPoint[] {
  const tasks = new Set(
    town.flatMap((act) =>
      actUnits(act).flatMap((unit) => unit.tasks.map((task) => taskKey(unit.id, task.id))),
    ),
  );
  return points.filter((point) => {
    const key = taskKey(point.unitId, point.taskId);
    return tasks.has(key) && (save.tasks[key]?.plays ?? 0) >= 1;
  });
}

/**
 * The points to drill today: only those already played, the ones with the most `g:`
 * mistakes in the last 30 days first, then the least asked, at most `limit`.
 */
export function pickDrillPoints<U extends DrillUnit>(
  save: SaveData,
  now: Date,
  town: readonly TownAct<U>[],
  points: readonly GrammarPoint[],
  limit = DRILL_POINTS,
): GrammarPoint[] {
  const open = playedPoints(save, town, points);
  const totals = mistakeTotals(save, now, MISTAKE_DAYS);
  const missed = (point: GrammarPoint) => totals[`g:${point.id}`]?.[0] ?? 0;
  const asked = (point: GrammarPoint) => totals[`g:${point.id}`]?.[1] ?? 0;
  const order = new Map(open.map((point, i) => [point.id, i]));
  const index = (point: GrammarPoint) => order.get(point.id) ?? 0;
  const wrong = open
    .filter((point) => missed(point) >= 1)
    .sort(
      (a, b) =>
        missed(b) - missed(a) ||
        missed(b) / Math.max(asked(b), 1) - missed(a) / Math.max(asked(a), 1) ||
        index(a) - index(b),
    );
  const rest = open
    .filter((point) => missed(point) < 1)
    .sort((a, b) => asked(a) - asked(b) || index(a) - index(b));
  return [...wrong, ...rest].slice(0, Math.max(0, limit));
}

/** True when there is something to drill: a played point that has a pattern. */
export function drillAvailable<U extends DrillUnit>(
  save: SaveData,
  town: readonly TownAct<U>[],
  points: readonly GrammarPoint[],
  patterns: readonly Pattern[],
): boolean {
  const ids = new Set(patterns.map((pattern) => pattern.grammarId));
  return playedPoints(save, town, points).some((point) => ids.has(point.id));
}

/**
 * The word ids taught up to the furthest task the player has played, in town order
 * (every earlier task counts, played or not). Empty when nothing was played.
 */
export function taughtUpTo<U extends DrillUnit>(
  town: readonly TownAct<U>[],
  save: SaveData,
): Set<string> {
  const flat = town.flatMap((act) =>
    actUnits(act).flatMap((unit) =>
      unit.tasks.map((task) => ({ key: taskKey(unit.id, task.id), words: task.newWordIds })),
    ),
  );
  let last = -1;
  flat.forEach((task, i) => {
    if (task.key in save.tasks) last = i;
  });
  return new Set(flat.slice(0, last + 1).flatMap((task) => task.words));
}

/**
 * A round of `count` new questions over the points, one point after another in turn.
 * A sentence is used once per round; patterns that cannot be built are skipped.
 * The same seed gives the same round.
 */
export function buildDrill(
  points: readonly GrammarPoint[],
  lexicons: Record<string, Lexicon>,
  patterns: readonly Pattern[],
  taughtFor: (point: GrammarPoint) => Taught,
  seed: number,
  count: number,
  deps: DrillDeps = realDeps,
): Question[] {
  const rng = makeRng(seed);
  const lexicon: Lexicon = Object.assign({}, ...Object.values(lexicons));
  const queues = points
    .map((point) => ({
      point,
      patterns: patterns.filter((pattern) => pattern.grammarId === point.id),
      next: 0,
      dead: false,
    }))
    .filter((queue) => queue.patterns.length > 0);
  const seen = new Set<string>();
  const questions: Question[] = [];
  while (questions.length < count && queues.some((queue) => !queue.dead)) {
    for (const queue of queues) {
      if (queue.dead || questions.length >= count) continue;
      const taught = taughtFor(queue.point);
      let made: FillQuestion | undefined;
      for (let t = 0; t < TRIES && !made; t++) {
        const pattern = queue.patterns[queue.next % queue.patterns.length];
        queue.next += 1;
        const blank = pattern?.blanks[Math.floor(rng() * (pattern.blanks.length || 1))];
        if (!pattern || !blank) continue;
        const sentence = deps.buildSentence(pattern, lexicon, taught, rng);
        if (!sentence || seen.has(sentence.en)) continue;
        const question = deps.sentenceFill(sentence, blank, rng);
        if (!question) continue;
        seen.add(sentence.en);
        made = question;
      }
      if (made) questions.push(made);
      else queue.dead = true;
    }
  }
  return questions;
}

/**
 * Counts a finished round: `answered` questions on `daily.grammar`, the streak, and the
 * coins of a review round (same rate: 5 per correct answer; `correct` defaults to all).
 */
export function finishDrill(
  save: SaveData,
  answered: number,
  now: Date,
  correct: number = answered,
): SaveData {
  if (answered <= 0) return save;
  const played = touchPlayed(save, now);
  const daily = dailyFor(played, now);
  const results: AnswerResult[] = Array.from({ length: Math.min(correct, answered) }, () => ({
    itemId: '',
    correct: true,
    usedHelp: false,
    ms: 0,
  }));
  return addCoins(
    { ...played, daily: { ...daily, grammar: daily.grammar + answered } },
    reviewCoins(results),
  );
}
