import { describe, expect, it } from 'vitest';
import {
  dueToday,
  isDue,
  newStoredCard,
  outcomeFromAnswer,
  recallChance,
  reviewCard,
  worseOutcome,
} from '../src/learning/scheduler';

const day0 = new Date('2026-11-22T09:00:00Z');
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

describe('outcomeFromAnswer', () => {
  it('maps answers to FSRS outcomes', () => {
    expect(outcomeFromAnswer({ correct: false, usedHelp: false, fast: true })).toBe('again');
    expect(outcomeFromAnswer({ correct: true, usedHelp: true, fast: true })).toBe('hard');
    expect(outcomeFromAnswer({ correct: true, usedHelp: false, fast: false })).toBe('good');
    expect(outcomeFromAnswer({ correct: true, usedHelp: false, fast: true })).toBe('easy');
  });
});

describe('reviewCard', () => {
  it('survives a JSON round trip, as it does in localStorage', () => {
    const reviewed = reviewCard(newStoredCard(day0), 'good', day0);
    const restored = JSON.parse(JSON.stringify(reviewed));
    expect(restored).toEqual(reviewed);
    expect(typeof restored.due).toBe('string');
    expect(reviewCard(restored, 'good', addDays(day0, 1)).reps).toBe(2);
  });

  it('is not due the moment it is created, then comes due after the first interval', () => {
    const fresh = newStoredCard(day0);
    const learned = reviewCard(fresh, 'good', day0);
    expect(isDue(learned, day0)).toBe(false);
    expect(isDue(learned, addDays(day0, 3))).toBe(true);
  });

  it('spaces repeated correct answers further and further apart', () => {
    let card = newStoredCard(day0);
    let now = day0;
    const gaps: number[] = [];
    for (let i = 0; i < 5; i++) {
      card = reviewCard(card, 'good', now);
      const next = new Date(card.due);
      gaps.push((next.getTime() - now.getTime()) / 86_400_000);
      now = next;
    }
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1] ?? 0);
    expect(gaps[gaps.length - 1]).toBeGreaterThan(5);
  });

  it('brings a forgotten card back sooner than a remembered one', () => {
    let card = newStoredCard(day0);
    let now = day0;
    for (let i = 0; i < 3; i++) {
      card = reviewCard(card, 'good', now);
      now = new Date(card.due);
    }
    const remembered = reviewCard(card, 'good', now);
    const forgotten = reviewCard(card, 'again', now);
    expect(new Date(forgotten.due).getTime()).toBeLessThan(new Date(remembered.due).getTime());
    expect(forgotten.lapses).toBe(1);
  });

  it('does not change the card it was given', () => {
    const card = newStoredCard(day0);
    const snapshot = JSON.stringify(card);
    reviewCard(card, 'good', day0);
    expect(JSON.stringify(card)).toBe(snapshot);
  });
});

describe('day-sized intervals', () => {
  // Local times, so the calendar day is the same in every time zone.
  const evening = new Date(2026, 10, 24, 20, 0);
  const daysOut = (card: { due: string }, from: Date) =>
    (new Date(card.due).getTime() - from.getTime()) / 86_400_000;

  it('schedules a new card 1, 2, 3 days out, and caps Easy at Good the first time', () => {
    const fresh = newStoredCard(evening);
    expect(daysOut(reviewCard(fresh, 'again', evening), evening)).toBe(1);
    expect(daysOut(reviewCard(fresh, 'hard', evening), evening)).toBe(2);
    expect(daysOut(reviewCard(fresh, 'good', evening), evening)).toBe(3);
    expect(reviewCard(fresh, 'easy', evening)).toEqual(reviewCard(fresh, 'good', evening));
  });

  it('lets Easy count once the card has been reviewed before', () => {
    const learned = reviewCard(newStoredCard(evening), 'good', evening);
    const at = new Date(learned.due);
    expect(daysOut(reviewCard(learned, 'easy', at), at)).toBeGreaterThan(
      daysOut(reviewCard(learned, 'good', at), at),
    );
  });

  it('moves a card saved mid-step (learning or relearning, due in minutes) to whole days', () => {
    const minutes = (state: number) => ({
      ...newStoredCard(evening),
      state,
      reps: 2,
      stability: 2.3,
      difficulty: 5,
      scheduled_days: 0,
      learning_steps: 1,
      lapses: state === 3 ? 1 : 0,
      last_review: new Date(evening.getTime() - 10 * 60_000).toISOString(),
      due: evening.toISOString(),
    });
    for (const state of [1, 3]) {
      for (const outcome of ['again', 'hard', 'good', 'easy'] as const) {
        const next = reviewCard(minutes(state), outcome, evening);
        const days = daysOut(next, evening);
        expect(Number.isFinite(days)).toBe(true);
        expect(days).toBeGreaterThanOrEqual(1);
        expect(Number.isFinite(next.stability)).toBe(true);
      }
    }
  });

  it('counts a card as due from the start of its calendar day', () => {
    const card = reviewCard(newStoredCard(evening), 'again', evening);
    // Due at 20:00 tomorrow: not yet at 23:59 tonight, but due from 00:00 tomorrow on.
    expect(isDue(card, new Date(2026, 10, 24, 23, 59))).toBe(false);
    expect(isDue(card, new Date(2026, 10, 25, 0, 0))).toBe(true);
    expect(isDue(card, new Date(2026, 10, 25, 8, 0))).toBe(true);
    const morning = new Date(2026, 10, 25, 8, 0);
    expect(dueToday([{ id: 'w', card }], morning, 20).map((i) => i.id)).toEqual(['w']);
  });
});

describe('dueToday', () => {
  const make = (id: string, daysFromNow: number) => ({
    id,
    card: { ...newStoredCard(day0), due: addDays(day0, daysFromNow).toISOString() },
  });

  it('returns only due cards, most overdue first', () => {
    const items = [make('later', 3), make('recent', -1), make('old', -9), make('now', 0)];
    expect(dueToday(items, day0, 20).map((i) => i.id)).toEqual(['old', 'recent', 'now']);
  });

  it('never returns more than the limit', () => {
    const items = Array.from({ length: 30 }, (_, i) => make(`c${i}`, -i));
    const today = dueToday(items, day0, 20);
    expect(today).toHaveLength(20);
    expect(today[0]?.id).toBe('c29');
  });

  it('returns nothing when nothing is due', () => {
    expect(dueToday([make('a', 1)], day0, 20)).toEqual([]);
    expect(dueToday([], day0, 20)).toEqual([]);
  });
});

describe('recallChance', () => {
  it('is 0 for a card never studied and falls over time after studying', () => {
    expect(recallChance(newStoredCard(day0), day0)).toBe(0);
    const learned = reviewCard(newStoredCard(day0), 'good', day0);
    const soon = recallChance(learned, addDays(day0, 1));
    const later = recallChance(learned, addDays(day0, 30));
    expect(soon).toBeGreaterThan(later);
    expect(soon).toBeLessThanOrEqual(1);
    expect(later).toBeGreaterThanOrEqual(0);
  });
});

describe('reviewCard safety', () => {
  const learned = () => {
    const first = reviewCard(newStoredCard(day0), 'good', day0);
    return reviewCard(first, 'good', new Date(first.due));
  };

  it('does not throw when the clock goes back a day or more', () => {
    const card = learned();
    const last = new Date(card.last_review ?? '');
    const earlier = addDays(last, -2);
    let next = card;
    expect(() => (next = reviewCard(card, 'good', earlier))).not.toThrow();
    // Reviewed as if at the last review time, so the card keeps its progress.
    expect(next.reps).toBe(card.reps + 1);
    expect(new Date(next.due).getTime()).toBeGreaterThan(last.getTime());
  });

  it('never throws on a card FSRS rejects, returning a usable card instead', () => {
    const card = learned();
    for (const bad of [
      { ...card, state: 9 },
      { ...card, stability: -1 },
      { ...card, difficulty: 50 },
      { ...card, due: 'nope', last_review: 'nope' },
    ]) {
      const next = reviewCard(bad, 'good', day0);
      expect(Number.isNaN(new Date(next.due).getTime())).toBe(false);
    }
  });
});

describe('recallChance safety', () => {
  it('returns a number in [0, 1] for broken cards and backwards clocks', () => {
    const learned = reviewCard(newStoredCard(day0), 'good', day0);
    const values = [
      recallChance({ ...learned, state: 2, stability: 0 }, day0),
      recallChance({ ...learned, state: 9 }, day0),
      recallChance(learned, addDays(day0, -5)),
    ];
    for (const v of values) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('worseOutcome', () => {
  it('orders again < hard < good < easy', () => {
    expect(worseOutcome('easy', 'again')).toBe('again');
    expect(worseOutcome('good', 'hard')).toBe('hard');
    expect(worseOutcome('easy', 'good')).toBe('good');
    expect(worseOutcome('good', 'good')).toBe('good');
  });
});
