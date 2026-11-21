import { describe, expect, it } from 'vitest';
import {
  DEBUG_SAVE_KEY,
  SAVE_KEY,
  createEmptySave,
  currentStreak,
  dateKey,
  exportSave,
  importSave,
  loadSave,
  mergeSaves,
  resolveNow,
  saveKeyFor,
  sanitizeSave,
  touchPlayed,
  writeSave,
  type StorageLike,
} from '../src/core/save';
import { newStoredCard, recallChance, reviewCard } from '../src/learning/scheduler';

const day = (iso: string) => new Date(`${iso}T10:00:00`);

function fakeStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('load / write', () => {
  it('starts fresh when nothing is stored', () => {
    const save = loadSave(fakeStorage(), day('2026-11-22'));
    expect(save.coins).toBe(0);
    expect(save.cards).toEqual({});
  });

  it('round-trips through storage', () => {
    const now = day('2026-11-22');
    const storage = fakeStorage();
    const save = { ...createEmptySave(now), coins: 42 };
    save.cards['word:tea'] = newStoredCard(now);
    expect(writeSave(storage, save)).toBe(true);
    expect(loadSave(storage, now)).toEqual(save);
  });

  it('survives corrupt JSON and wrong shapes', () => {
    const now = day('2026-11-22');
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '{not json' }), now).coins).toBe(0);
    expect(loadSave(fakeStorage({ [SAVE_KEY]: '[1,2]' }), now).coins).toBe(0);
    expect(loadSave(fakeStorage({ [SAVE_KEY]: 'null' }), now).coins).toBe(0);
  });

  it('survives a storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadSave(broken, day('2026-11-22')).coins).toBe(0);
    expect(writeSave(broken, createEmptySave(day('2026-11-22')))).toBe(false);
  });

  it('drops invalid cards and clamps bad numbers', () => {
    const save = sanitizeSave(
      {
        coins: -5,
        cards: { 'word:a': { due: 'nope' }, 'word:b': newStoredCard(day('2026-11-22')) },
        tasks: { 'cafe/t1': { stars: 9, plays: 'x' } },
        streak: { count: 3, lastDate: 'yesterday' },
      },
      day('2026-11-22'),
    );
    expect(save.coins).toBe(0);
    // A broken card becomes a fresh one: the item stays known, its schedule restarts.
    expect(Object.keys(save.cards)).toEqual(['word:a', 'word:b']);
    expect(save.cards['word:a']).toMatchObject({ state: 0, reps: 0 });
    expect(save.tasks['cafe/t1']).toEqual({ stars: 3, plays: 1 });
    expect(save.streak).toEqual({ count: 0, lastDate: null });
  });
});

describe('streak', () => {
  it('counts consecutive days and resets (never penalises) after a gap', () => {
    let save = createEmptySave(day('2026-11-22'));
    save = touchPlayed(save, day('2026-11-22'));
    expect(save.streak.count).toBe(1);
    save = touchPlayed(save, day('2026-11-22'));
    expect(save.streak.count).toBe(1);
    save = touchPlayed(save, day('2026-11-23'));
    expect(save.streak.count).toBe(2);
    expect(currentStreak(save, day('2026-11-24'))).toBe(2);
    expect(currentStreak(save, day('2026-11-26'))).toBe(0);
    save = touchPlayed(save, day('2026-11-26'));
    expect(save.streak.count).toBe(1);
    expect(save.coins).toBe(0);
  });

  it('rolls daily counters over on a new day', () => {
    let save = createEmptySave(day('2026-11-22'));
    save = { ...save, daily: { ...save.daily, answered: 5 } };
    save = touchPlayed(save, day('2026-11-23'));
    expect(save.daily).toMatchObject({ date: '2026-11-23', answered: 0 });
  });
});

describe('export / import', () => {
  it('round-trips a save', () => {
    const now = day('2026-11-22');
    const save = { ...createEmptySave(now), coins: 77 };
    save.cards['chunk:to_go'] = newStoredCard(now);
    const result = importSave(exportSave(save), now);
    expect(result).toEqual({ ok: true, save });
  });

  it('rejects garbage', () => {
    const now = day('2026-11-22');
    expect(importSave('hello world', now).ok).toBe(false);
    expect(importSave(btoa('{"a":1}'), now).ok).toBe(false);
    expect(importSave('', now).ok).toBe(false);
  });
});

describe('debugDate', () => {
  it('moves the date but keeps the time of day', () => {
    const real = new Date(2026, 10, 22, 15, 30, 5);
    const now = resolveNow('?debugDate=2026-12-01', real);
    expect(dateKey(now)).toBe('2026-12-01');
    expect(now.getHours()).toBe(15);
  });

  it('ignores missing or malformed values', () => {
    const real = new Date(2026, 10, 22, 15, 30, 5);
    expect(resolveNow('', real)).toBe(real);
    expect(resolveNow('?debugDate=tomorrow', real)).toBe(real);
  });
});

describe('card range checks on load', () => {
  const now = day('2026-11-22');
  const learned = reviewCard(
    reviewCard(newStoredCard(now), 'good', now),
    'good',
    day('2026-11-23'),
  );
  const broken: Record<string, unknown> = {
    'state 9': { ...learned, state: 9 },
    'state 1.5': { ...learned, state: 1.5 },
    'negative stability': { ...learned, stability: -1 },
    'zero stability when studied': { ...learned, state: 2, stability: 0 },
    'difficulty 50': { ...learned, difficulty: 50 },
    'difficulty 0 when studied': { ...learned, difficulty: 0 },
    'negative reps': { ...learned, reps: -1 },
    'fractional lapses': { ...learned, lapses: 0.5 },
    'bad due': { ...learned, due: 'nope' },
    'numeric due': { ...learned, due: '1' },
    'bad last_review': { ...learned, last_review: 'yesterday' },
  };

  it('replaces every out-of-range card with a fresh card', () => {
    const save = sanitizeSave({ cards: { ...broken, good: learned } }, now);
    for (const id of Object.keys(broken)) {
      expect(save.cards[id], id).toEqual(newStoredCard(now));
    }
    expect(save.cards.good).toEqual(learned);
  });

  it('leaves nothing that makes reviewCard or recallChance throw', () => {
    const save = sanitizeSave({ cards: broken }, now);
    for (const card of Object.values(save.cards)) {
      expect(() => reviewCard(card, 'good', now)).not.toThrow();
      expect(Number.isFinite(recallChance(card, now))).toBe(true);
    }
  });
});

describe('streak with the clock moved back', () => {
  it('does not show or continue a streak for a negative day gap', () => {
    let save = createEmptySave(day('2026-11-22'));
    save = touchPlayed(save, day('2026-11-22'));
    save = touchPlayed(save, day('2026-11-23'));
    expect(save.streak.count).toBe(2);
    expect(currentStreak(save, day('2026-11-20'))).toBe(0);
    expect(touchPlayed(save, day('2026-11-22')).streak.count).toBe(1);
  });
});

describe('debug save key', () => {
  it('uses a separate key while ?debugDate is set', () => {
    expect(saveKeyFor('')).toBe(SAVE_KEY);
    expect(saveKeyFor('?debug')).toBe(SAVE_KEY);
    expect(saveKeyFor('?debugDate=2026-12-01')).toBe(DEBUG_SAVE_KEY);
    expect(DEBUG_SAVE_KEY).not.toBe(SAVE_KEY);
  });

  it('starts the debug save as a copy and never writes the real one', () => {
    const now = day('2026-11-22');
    const real = { ...createEmptySave(now), coins: 9 };
    const storage = fakeStorage({ [SAVE_KEY]: JSON.stringify(real) });
    const debug = loadSave(storage, now, DEBUG_SAVE_KEY);
    expect(debug.coins).toBe(9);
    writeSave(storage, { ...debug, coins: 500 }, DEBUG_SAVE_KEY);
    expect(loadSave(storage, now).coins).toBe(9);
    expect(loadSave(storage, now, DEBUG_SAVE_KEY).coins).toBe(500);
  });
});

describe('mergeSaves (two tabs)', () => {
  it('keeps the newer data per item', () => {
    const d0 = day('2026-11-22');
    const d1 = day('2026-11-23');
    const base = createEmptySave(d0);
    const tea0 = reviewCard(newStoredCard(d0), 'good', d0);
    const tea1 = reviewCard(tea0, 'good', d1);
    const ours: typeof base = {
      ...base,
      coins: 30,
      cards: { 'word:tea': tea1 },
      tasks: { 'cafe/t1': { stars: 2, plays: 3 } },
    };
    const theirs: typeof base = {
      ...base,
      coins: 50,
      cards: { 'word:tea': tea0, 'word:cake': tea0 },
      tasks: { 'cafe/t1': { stars: 3, plays: 1 }, 'cafe/t2': { stars: 1, plays: 1 } },
    };
    const merged = mergeSaves(ours, theirs);
    expect(merged.cards['word:tea']).toEqual(tea1);
    expect(merged.cards['word:cake']).toEqual(tea0);
    expect(merged.tasks).toEqual({
      'cafe/t1': { stars: 3, plays: 3 },
      'cafe/t2': { stars: 1, plays: 1 },
    });
    expect(merged.coins).toBe(50);
    expect(mergeSaves(theirs, ours).cards['word:tea']).toEqual(tea1);
  });
});
