import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';

/**
 * Spaced-repetition scheduling (FSRS) with a save-friendly card shape.
 * Time is always passed in, never read from the clock, so tests and the
 * ?debugDate option can simulate other days.
 */

/** A card as stored in localStorage: dates are ISO strings. */
export interface StoredCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days?: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export type Outcome = 'again' | 'hard' | 'good' | 'easy';

export interface AnswerInfo {
  correct: boolean;
  /** Used a hint, the slow replay, or the Chinese translation. */
  usedHelp: boolean;
  /** Answered quickly for this kind of question. */
  fast: boolean;
}

/**
 * Short-term (minute) steps are off: every interval is at least one day, so a card
 * learned or missed today is next due tomorrow, never again later today. A card
 * saved mid-step (learning or relearning, due in minutes) moves to whole days on its
 * next review.
 */
const scheduler = fsrs({ enable_fuzz: false, enable_short_term: false });

const RATINGS: Record<Outcome, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Wrong -> again. Right but helped -> hard. Right -> good. Right and fast -> easy. */
export function outcomeFromAnswer(answer: AnswerInfo): Outcome {
  if (!answer.correct) return 'again';
  if (answer.usedHelp) return 'hard';
  return answer.fast ? 'easy' : 'good';
}

function toCard(stored: StoredCard): Card {
  return {
    ...stored,
    due: new Date(stored.due),
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  } as Card;
}

function toStored(card: Card): StoredCard {
  const { due, last_review, ...rest } = card;
  return {
    ...rest,
    due: due.toISOString(),
    ...(last_review ? { last_review: last_review.toISOString() } : {}),
  };
}

export function newStoredCard(now: Date): StoredCard {
  return toStored(createEmptyCard(now));
}

/** Worst first: a session keeps the worst outcome it has seen for each item. */
const OUTCOME_ORDER: readonly Outcome[] = ['again', 'hard', 'good', 'easy'];

/** The lower of two outcomes (again < hard < good < easy). */
export function worseOutcome(a: Outcome, b: Outcome): Outcome {
  return OUTCOME_ORDER.indexOf(a) <= OUTCOME_ORDER.indexOf(b) ? a : b;
}

/**
 * Reviews at max(now, last_review): if the clock went backwards (device clock
 * fixed, ?debugDate removed) FSRS would throw on the negative gap. Never throws:
 * a card FSRS cannot handle is replaced by a fresh card reviewed now.
 */
export function reviewCard(stored: StoredCard, outcome: Outcome, now: Date): StoredCard {
  // One quick right answer right after the intro card says little: a card never
  // reviewed before gets at most Good (3 days), not Easy (8 days).
  const firstTime = stored.state === 0 || !(stored.reps > 0);
  const rating = RATINGS[firstTime && outcome === 'easy' ? 'good' : outcome];
  try {
    const last = stored.last_review ? new Date(stored.last_review).getTime() : Number.NaN;
    const at = Number.isFinite(last) && last > now.getTime() ? new Date(last) : now;
    return toStored(scheduler.next(toCard(stored), at, rating).card);
  } catch {
    try {
      return toStored(scheduler.next(createEmptyCard(now), now, rating).card);
    } catch {
      return newStoredCard(now);
    }
  }
}

/** Local calendar day as YYYY-MM-DD (same as dateKey in core/save, which imports this file). */
function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Due by calendar day: a card due at any time today (local date) is due now, so a
 * card reviewed at 20:00 and due the next 20:00 shows up that morning. A card with
 * a bad date is never due (loading the save repairs it).
 */
export function isDue(stored: StoredCard, now: Date): boolean {
  const due = new Date(stored.due);
  if (!Number.isFinite(due.getTime())) return false;
  return localDay(due) <= localDay(now);
}

export interface DueItem {
  id: string;
  card: StoredCard;
}

/**
 * The cards to review today, most overdue first, at most `limit`.
 * The limit stops the pile growing into something that feels like a chore.
 */
export function dueToday(items: readonly DueItem[], now: Date, limit: number): DueItem[] {
  return items
    .filter((item) => isDue(item.card, now))
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime())
    .slice(0, limit);
}

/** Chance (0 to 1) of recalling the card right now, per the FSRS forgetting curve. */
export function recallChance(stored: StoredCard, now: Date): number {
  if (stored.state === 0) return 0;
  try {
    const chance = Number(scheduler.retrievability(toCard(stored), now));
    return Number.isFinite(chance) ? Math.min(1, Math.max(0, chance)) : 0;
  } catch {
    return 0;
  }
}
