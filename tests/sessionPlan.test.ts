import { describe, expect, it } from 'vitest';
import { createEmptySave, type SaveData } from '../src/core/save';
import type { AnswerResult } from '../src/learning/questions';
import { newStoredCard, reviewCard } from '../src/learning/scheduler';
import {
  FAST_MS_ARRANGE,
  FAST_MS_LISTEN_CHOOSE,
  applyAnswer,
  applySessionAnswer,
  buildDailyReview,
  createSession,
  finishTask,
  isTaskUnlocked,
  starsForAccuracy,
  taskKey,
  type PracticeSession,
} from '../src/learning/sessionPlan';

const day0 = new Date(2026, 10, 22, 10, 0, 0);
const day1 = new Date(2026, 10, 23, 10, 0, 0);
const day30 = new Date(2026, 11, 22, 10, 0, 0);

const answer = (itemId: string, over: Partial<AnswerResult> = {}): AnswerResult => ({
  itemId,
  correct: true,
  usedHelp: false,
  ms: 6000,
  ...over,
});

describe('applyAnswer', () => {
  it('creates a card on the first answer and counts it', () => {
    const save = applyAnswer(createEmptySave(day0), answer('word:tea'), day0);
    expect(save.cards['word:tea']?.reps).toBe(1);
    expect(save.daily).toMatchObject({ answered: 1, correct: 1 });
    expect(save.streak.count).toBe(1);
  });

  it('does not mutate the previous save', () => {
    const before = createEmptySave(day0);
    applyAnswer(before, answer('word:tea'), day0);
    expect(before.cards).toEqual({});
  });

  it('a wrong answer counts a lapse-free first rep but not a correct one', () => {
    const save = applyAnswer(createEmptySave(day0), answer('word:tea', { correct: false }), day0);
    expect(save.daily).toMatchObject({ answered: 1, correct: 0 });
  });

  it('uses a higher fast threshold for arrange questions', () => {
    const ms = FAST_MS_LISTEN_CHOOSE + 1000;
    expect(ms).toBeLessThan(FAST_MS_ARRANGE);
    const slow = applyAnswer(createEmptySave(day0), answer('a', { ms }), day0, 'listen-pick');
    const fast = applyAnswer(createEmptySave(day0), answer('a', { ms }), day0, 'arrange');
    // Easy schedules the next review later than Good.
    expect(new Date(fast.cards.a?.due ?? 0).getTime()).toBeGreaterThan(
      new Date(slow.cards.a?.due ?? 0).getTime(),
    );
  });
});

describe('buildDailyReview', () => {
  it('is empty right after learning, and lists items once due', () => {
    let save = createEmptySave(day0);
    save = applyAnswer(save, answer('chunk:can_i_get', { ms: 9000 }), day0);
    save = applyAnswer(save, answer('word:tea', { correct: false }), day0);
    expect(buildDailyReview(save, day0)).not.toContain('chunk:can_i_get');
    const later = buildDailyReview(save, day30);
    expect(later).toContain('chunk:can_i_get');
    expect(later).toContain('word:tea');
  });

  it('caps at the limit', () => {
    let save = createEmptySave(day0);
    for (let i = 0; i < 30; i++) save = applyAnswer(save, answer(`word:${i}`), day0);
    const any = () => true;
    expect(buildDailyReview(save, day30, undefined, any)).toHaveLength(20);
    expect(buildDailyReview(save, day30, 5, any)).toHaveLength(5);
    expect(day1.getTime()).toBeGreaterThan(day0.getTime());
  });
});

describe('finishTask', () => {
  it('awards stars, coins and a 3-star bonus, and keeps the best stars', () => {
    const perfect = Array.from({ length: 10 }, (_, i) => answer(`w${i}`));
    const first = finishTask(createEmptySave(day0), 'cafe/t1', perfect, day0, ['word:tea']);
    expect(first.outcome).toMatchObject({
      stars: 3,
      coins: 60,
      improved: true,
      newItemIds: ['word:tea'],
    });
    expect(first.save.tasks['cafe/t1']).toEqual({ stars: 3, plays: 1 });

    const messy = perfect.map((r, i) => (i < 6 ? { ...r, correct: false } : r));
    const second = finishTask(first.save, 'cafe/t1', messy, day0);
    expect(second.outcome).toMatchObject({ stars: 1, coins: 20, improved: false });
    expect(second.save.tasks['cafe/t1']).toEqual({ stars: 3, plays: 2 });
    expect(second.save.coins).toBe(80);
    expect(second.save.daily.tasksDone).toBe(2);
  });

  it('maps accuracy to stars', () => {
    expect(starsForAccuracy(1)).toBe(3);
    expect(starsForAccuracy(0.9)).toBe(3);
    expect(starsForAccuracy(0.75)).toBe(2);
    expect(starsForAccuracy(0.2)).toBe(1);
  });

  it('never fails a task with no correct answers', () => {
    const { outcome } = finishTask(
      createEmptySave(day0),
      'cafe/t1',
      [answer('a', { correct: false })],
      day0,
    );
    expect(outcome.stars).toBe(1);
  });
});

describe('buildDailyReview with unknown cards', () => {
  it('skips cards for items the content does not have, before the limit', () => {
    let save = createEmptySave(day0);
    const old = new Date(2020, 0, 1).toISOString();
    const stale = { ...newStoredCard(day0), due: old };
    const cards: SaveData['cards'] = { 'chunk:t1_2': stale };
    for (let i = 0; i < 25; i++) cards[`chunk:removed_${i}`] = stale;
    save = applyAnswer({ ...save, cards }, answer('word:tea'), day0);
    expect(buildDailyReview(save, day30)).toEqual(['word:tea']);
  });

  it('accepts a custom lookup', () => {
    const save = applyAnswer(createEmptySave(day0), answer('x:1'), day0);
    expect(buildDailyReview(save, day30)).toEqual([]);
    expect(buildDailyReview(save, day30, undefined, (id) => id === 'x:1')).toEqual(['x:1']);
  });
});

describe('one scheduling per item per session', () => {
  const at = (base: Date, seconds: number) => new Date(base.getTime() + seconds * 1000);
  const run = (
    save: SaveData,
    answers: { result: AnswerResult; now: Date }[],
    session: PracticeSession = createSession(),
  ) => {
    let state = { save, session };
    const saves: SaveData[] = [];
    for (const { result, now } of answers) {
      state = applySessionAnswer(state.save, state.session, result, now, 'listen-pick');
      saves.push(state.save);
    }
    return { ...state, saves };
  };

  it('three fast answers in 40 s count as one easy review', () => {
    const fast = answer('chunk:can_i_get', { ms: 1000 });
    const t2 = at(day0, 40);
    const { save, saves } = run(createEmptySave(day0), [
      { result: fast, now: day0 },
      { result: fast, now: at(day0, 20) },
      { result: fast, now: t2 },
    ]);
    expect(save.cards['chunk:can_i_get']).toEqual(reviewCard(newStoredCard(t2), 'easy', t2));
    // Saved after every answer, so a refresh loses nothing.
    expect(saves.map((s) => s.daily.answered)).toEqual([1, 2, 3]);
    expect(saves[0]?.cards['chunk:can_i_get']).toBeDefined();
  });

  it('uses the worst outcome seen in the session', () => {
    const before = reviewCard(newStoredCard(day0), 'good', day0);
    const start = { ...createEmptySave(day0), cards: { 'word:tea': before } };
    const t = day30;
    const { save } = run(start, [
      { result: answer('word:tea', { ms: 1000 }), now: t },
      { result: answer('word:tea', { correct: false }), now: at(t, 10) },
      { result: answer('word:tea', { ms: 1000 }), now: at(t, 20) },
    ]);
    expect(save.cards['word:tea']).toEqual(reviewCard(before, 'again', at(t, 20)));
    expect(save.cards['word:tea']?.reps).toBe(before.reps + 1);
  });

  it('a replay of a finished task does not push the card further out', () => {
    let card = newStoredCard(day0);
    card = reviewCard(card, 'good', day0);
    card = reviewCard(card, 'good', new Date(card.due));
    const t = new Date(card.due);
    const start = { ...createEmptySave(t), cards: { 'word:tea': card } };
    const first = run(start, [{ result: answer('word:tea'), now: t }]);
    const dueAfterFirst = first.save.cards['word:tea']?.due ?? '';
    expect(new Date(dueAfterFirst).getTime()).toBeGreaterThan(t.getTime());
    // New session (replay), same day, all fast.
    const replay = run(first.save, [
      { result: answer('word:tea', { ms: 1000 }), now: at(t, 300) },
      { result: answer('word:tea', { ms: 1000 }), now: at(t, 320) },
    ]);
    expect(replay.save.cards['word:tea']?.due).toBe(dueAfterFirst);
    // A wrong answer in a replay may still bring it forward.
    const wrong = run(first.save, [
      { result: answer('word:tea', { correct: false }), now: at(t, 300) },
    ]);
    expect(new Date(wrong.save.cards['word:tea']?.due ?? '').getTime()).toBeLessThan(
      new Date(dueAfterFirst).getTime(),
    );
  });
});

describe('isTaskUnlocked', () => {
  const unit = { id: 'cafe', tasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] };

  it('opens the first task and each task after a cleared one', () => {
    let save = createEmptySave(day0);
    expect(isTaskUnlocked(save, unit, 0)).toBe(true);
    expect(isTaskUnlocked(save, unit, 1)).toBe(false);
    save = finishTask(save, taskKey('cafe', 't1'), [answer('a')], day0).save;
    expect(isTaskUnlocked(save, unit, 1)).toBe(true);
    expect(isTaskUnlocked(save, unit, 2)).toBe(false);
  });

  it('handles out-of-range indexes', () => {
    const save = createEmptySave(day0);
    expect(isTaskUnlocked(save, unit, -1)).toBe(true);
    expect(isTaskUnlocked(save, unit, 9)).toBe(false);
  });
});
