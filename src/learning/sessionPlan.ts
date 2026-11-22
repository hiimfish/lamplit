import { getItem } from '../content/units';
import { dailyFor, touchPlayed, type SaveData } from '../core/save';
import { NO_ITEM, type AnswerResult, type Question } from './questions';
import {
  dueToday,
  isDue,
  newStoredCard,
  outcomeFromAnswer,
  reviewCard,
  worseOutcome,
  type Outcome,
  type StoredCard,
} from './scheduler';

/** An answer faster than this counts as "fast" (FSRS Easy) for listen and choose questions. */
export const FAST_MS_LISTEN_CHOOSE = 4000;
/**
 * Arranging blocks takes longer, and so does typing a word, hearing a whole line for a
 * cloze, reading a sign or reading sentences about a picture, completing a sentence,
 * reading a passage or hearing a conversation, so their fast threshold is higher.
 */
export const FAST_MS_ARRANGE = 12000;

const DAILY_REVIEW_LIMIT = 20;
const COINS_PER_CORRECT = 5;
const COINS_THREE_STAR_BONUS = 10;

export type QuestionKind = Question['kind'];

const SLOW_KINDS: readonly QuestionKind[] = [
  'arrange',
  'spell',
  'cloze',
  'read-sign',
  'picture',
  'fill',
  'read-passage',
  'talk',
];

function isFastAnswer(ms: number, kind: QuestionKind): boolean {
  return ms < (SLOW_KINDS.includes(kind) ? FAST_MS_ARRANGE : FAST_MS_LISTEN_CHOOSE);
}

/** True if the item id still exists in the content (`chunk:<id>` or `word:<id>`). */
const isKnownItem = (itemId: string): boolean => getItem(itemId) !== undefined;

/**
 * Item ids due today, most overdue first, at most `limit`. Cards for items the
 * content no longer has (renamed, removed, bad ids) are skipped before the
 * limit, so they can never fill the list. The town's "N due" uses this too.
 */
export function buildDailyReview(
  save: SaveData,
  now: Date,
  limit = DAILY_REVIEW_LIMIT,
  isKnown: (itemId: string) => boolean = isKnownItem,
): string[] {
  const items = Object.entries(save.cards)
    .filter(([id]) => isKnown(id))
    .map(([id, card]) => ({ id, card }));
  return dueToday(items, now, limit).map((item) => item.id);
}

/**
 * One practice run (a task or a daily review). Each item is scheduled once per
 * session: from its card as it was before the session, with the worst outcome
 * seen so far. The save is still updated after every answer, so a refresh loses
 * nothing, but three quick answers about one item count as one review.
 */
export interface PracticeSession {
  /** Card before this session's first answer about the item (undefined: no card yet). */
  readonly before: Readonly<Record<string, StoredCard | undefined>>;
  readonly worst: Readonly<Record<string, Outcome>>;
}

export function createSession(): PracticeSession {
  return { before: {}, worst: {} };
}

/**
 * Schedules `before` with `outcome`. A card that is not due yet (already reviewed
 * recently, e.g. a task replayed the same day) may be brought forward by a weak
 * answer but never pushed further out, so replays cannot inflate the interval.
 */
function scheduleOnce(before: StoredCard | undefined, outcome: Outcome, now: Date): StoredCard {
  const base = before ?? newStoredCard(now);
  const next = reviewCard(base, outcome, now);
  if (before && !isDue(before, now) && new Date(next.due) > new Date(before.due)) return before;
  return next;
}

/**
 * Records one answer within a session: the item's card is (re)computed once from
 * its pre-session state, and the daily counters and streak move. Speak questions
 * are never graded, so callers must not pass them.
 */
export function applySessionAnswer(
  save: SaveData,
  session: PracticeSession,
  result: AnswerResult,
  now: Date,
  kind: QuestionKind = 'listen-pick',
): { save: SaveData; session: PracticeSession } {
  const id = result.itemId;
  const played = touchPlayed(save, now);
  const daily = dailyFor(played, now);
  const counted = {
    ...daily,
    answered: daily.answered + 1,
    correct: daily.correct + (result.correct ? 1 : 0),
  };
  // A question about no item (a sign to read) only counts for the day.
  if (id === NO_ITEM) return { session, save: { ...played, daily: counted } };
  const outcome = outcomeFromAnswer({
    correct: result.correct,
    usedHelp: result.usedHelp,
    fast: isFastAnswer(result.ms, kind),
  });
  const seen = id in session.before;
  const before = seen ? session.before[id] : save.cards[id];
  const previousWorst = session.worst[id];
  const worst = previousWorst ? worseOutcome(previousWorst, outcome) : outcome;
  const nextSession: PracticeSession = {
    before: seen ? session.before : { ...session.before, [id]: before },
    worst: { ...session.worst, [id]: worst },
  };
  return {
    session: nextSession,
    save: {
      ...played,
      cards: { ...played.cards, [id]: scheduleOnce(before, worst, now) },
      daily: counted,
    },
  };
}

/** Records a single answer as its own one-answer session (see applySessionAnswer). */
export function applyAnswer(
  save: SaveData,
  result: AnswerResult,
  now: Date,
  kind: QuestionKind = 'listen-pick',
): SaveData {
  return applySessionAnswer(save, createSession(), result, now, kind).save;
}

export function starsForAccuracy(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

export interface TaskOutcome {
  stars: 1 | 2 | 3;
  coins: number;
  correct: number;
  total: number;
  newItemIds: string[];
  /** True if these stars beat the previous best (or it is the first clear). */
  improved: boolean;
}

/** Awards stars and coins for a finished task and records the best stars. */
export function finishTask(
  save: SaveData,
  taskId: string,
  results: readonly AnswerResult[],
  now: Date,
  newItemIds: readonly string[] = [],
): { save: SaveData; outcome: TaskOutcome } {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const stars = starsForAccuracy(total === 0 ? 1 : correct / total);
  const coins = correct * COINS_PER_CORRECT + (stars === 3 ? COINS_THREE_STAR_BONUS : 0);

  const played = touchPlayed(save, now);
  const previous = played.tasks[taskId];
  const best = Math.max(previous?.stars ?? 0, stars);
  const daily = dailyFor(played, now);
  const next: SaveData = {
    ...played,
    coins: played.coins + coins,
    tasks: { ...played.tasks, [taskId]: { stars: best, plays: (previous?.plays ?? 0) + 1 } },
    daily: { ...daily, tasksDone: daily.tasksDone + 1 },
  };
  return {
    save: next,
    outcome: {
      stars,
      coins,
      correct,
      total,
      newItemIds: [...newItemIds],
      improved: stars > (previous?.stars ?? 0),
    },
  };
}

/** Coins for a review round: a smaller reward, same per-correct rate. */
export function reviewCoins(results: readonly AnswerResult[]): number {
  return results.filter((r) => r.correct).length * COINS_PER_CORRECT;
}

export function addCoins(save: SaveData, coins: number): SaveData {
  return { ...save, coins: save.coins + coins };
}

/** Save key for a task's progress. */
export const taskKey = (unitId: string, taskId: string) => `${unitId}/${taskId}`;

/** A task opens once the one before it has been cleared (the first is always open). */
export function isTaskUnlocked(
  save: SaveData,
  unit: { id: string; tasks: readonly { id: string }[] },
  index: number,
): boolean {
  if (index <= 0) return true;
  const previous = unit.tasks[index - 1];
  return previous ? taskKey(unit.id, previous.id) in save.tasks : false;
}
