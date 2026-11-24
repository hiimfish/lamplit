import { describe, expect, it } from 'vitest';
import {
  DEBUG_SAVE_KEY,
  SAVE_KEY,
  MISTAKE_TAGS_PER_DAY,
  createEmptySave,
  currentStreak,
  dateKey,
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

describe('corrupt save', () => {
  it('keeps the unreadable text once before starting over', () => {
    const now = day('2026-11-22');
    const storage = fakeStorage({ [SAVE_KEY]: '{not json' });
    expect(loadSave(storage, now).coins).toBe(0);
    expect(storage.data['lamplit.save.v1.corrupt']).toBe('{not json');
    storage.data[SAVE_KEY] = '{also bad';
    loadSave(storage, now);
    expect(storage.data['lamplit.save.v1.corrupt']).toBe('{not json');
  });

  it('keeps no copy of a readable save or of the debug save', () => {
    const now = day('2026-11-22');
    const storage = fakeStorage({ [SAVE_KEY]: '[1,2]', [DEBUG_SAVE_KEY]: '{bad' });
    loadSave(storage, now);
    loadSave(storage, now, DEBUG_SAVE_KEY);
    expect(storage.data['lamplit.save.v1.corrupt']).toBeUndefined();
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

describe('mistakes in the save', () => {
  const today = day('2026-11-24');
  const load = (mistakes: unknown) => sanitizeSave({ mistakes }, today).mistakes;

  it('starts empty and loads an old save without the field', () => {
    expect(createEmptySave(today).mistakes).toEqual({});
    expect(sanitizeSave({ version: 1, cards: {} }, today).mistakes).toEqual({});
  });

  it('keeps good days and tags, drops bad ones and [0, 0]', () => {
    const raw = {
      '2026-11-24': {
        'p:f-v': [2, 5],
        'k:arrange': [0, 3],
        'e:article': [1, 1.5],
        'bad tag': [1, 1],
        'k:cloze': [0, 0],
        'k:spell': [1, 2, 3],
        'k:fill': 'x',
        'g:Upper': [1, 1],
      },
      soon: { 'k:arrange': [1, 1] },
      '2026-11-23': 'nothing',
      '2026-11-22': { 'k:arrange': [-1, 2] },
    };
    expect(load(raw)).toEqual({ '2026-11-24': { 'p:f-v': [2, 5], 'k:arrange': [0, 3] } });
  });

  it('keeps at most the tags missed most of a day', () => {
    const day60 = Object.fromEntries(
      Array.from({ length: MISTAKE_TAGS_PER_DAY + 10 }, (_, i) => [`k:q${i}`, [i, 100]]),
    );
    const kept = load({ '2026-11-24': day60 })['2026-11-24'] ?? {};
    expect(Object.keys(kept)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(kept['k:q69']).toEqual([69, 100]);
    expect(kept['k:q9']).toBeUndefined();
    expect(kept['k:q10']).toEqual([10, 100]);
  });

  it('drops days older than 120', () => {
    const raw = { '2026-11-24': { 'k:a': [1, 1] }, '2026-07-26': { 'k:a': [1, 1] } };
    expect(Object.keys(load(raw))).toEqual(['2026-11-24']);
  });

  it('merges two tabs: days and tags together, each number the larger', () => {
    const base = createEmptySave(today);
    const ours = {
      ...base,
      mistakes: {
        '2026-11-24': { 'k:a': [1, 4] as [number, number], 'k:b': [2, 2] as [number, number] },
      },
    };
    const theirs = {
      ...base,
      mistakes: {
        '2026-11-24': { 'k:a': [3, 3] as [number, number] },
        '2026-11-23': { 'k:c': [1, 1] as [number, number] },
      },
    };
    expect(mergeSaves(ours, theirs).mistakes).toEqual({
      '2026-11-24': { 'k:a': [3, 4], 'k:b': [2, 2] },
      '2026-11-23': { 'k:c': [1, 1] },
    });
  });
});

describe('grammar counters in the save', () => {
  const today = day('2026-11-24');

  it('starts at 0, keeps a good count and merges to the larger', () => {
    expect(createEmptySave(today).daily.grammar).toBe(0);
    const raw = {
      daily: { date: '2026-11-24', grammar: 7 },
      history: { '2026-11-23': { tasks: 1, grammar: 4 }, '2026-11-22': { grammar: -2 } },
    };
    const save = sanitizeSave(raw, today);
    expect(save.daily.grammar).toBe(7);
    expect(save.history['2026-11-23']?.grammar).toBe(4);
    expect(save.history['2026-11-22']?.grammar).toBe(0);
    const other = { ...save, daily: { ...save.daily, grammar: 9 } };
    expect(mergeSaves(save, other).daily.grammar).toBe(9);
    const hist = {
      ...save,
      history: { '2026-11-23': { ...save.history['2026-11-23']!, grammar: 6 } },
    };
    expect(mergeSaves(save, hist).history['2026-11-23']?.grammar).toBe(6);
  });
});

describe('exams in the save', () => {
  const today = day('2026-11-24');
  const record = (attempts: number, lastDate: string, listening = 200, reading = 180) => ({
    attempts,
    lastDate,
    listening,
    reading,
    seen: {},
  });

  it('starts empty and loads an old save without the fields', () => {
    const empty = createEmptySave(today);
    expect(empty.exams).toEqual({});
    expect(empty.examRun).toBeUndefined();
    expect(sanitizeSave({ version: 1, cards: {} }, today).exams).toEqual({});
  });

  it('keeps good exam records and drops bad ones', () => {
    const raw = {
      exams: {
        exam1: {
          attempts: 2,
          lastDate: '2026-11-20',
          listening: 200,
          reading: 180,
          seen: { s1_a: 2, 'BAD ID': 1, s1_b: 0 },
        },
        exam2: { attempts: 0, lastDate: '2026-11-20', listening: 200, reading: 180 },
        exam3: { attempts: 1, lastDate: 'soon', listening: 200, reading: 180 },
        exam4: { attempts: 1, lastDate: '2026-11-20', listening: 203, reading: 180 },
        exam9: { attempts: 1, lastDate: '2026-11-20', listening: 200, reading: 180 },
        calibration: { listening: 80, reading: -12.4, pairs: 2 },
      },
    };
    expect(sanitizeSave(raw, today).exams).toEqual({
      exam1: { ...record(2, '2026-11-20'), seen: { s1_a: 2 } },
      calibration: { listening: 50, reading: -12, pairs: 2 },
    });
    expect(sanitizeSave({ exams: { calibration: { pairs: 0 } } }, today).exams).toEqual({});
  });

  it('merges two tabs: more attempts, the later sitting scores, larger seen counts', () => {
    const base = createEmptySave(today);
    const a = { ...record(1, '2026-11-20', 210, 190), seen: { s1_a: 1, s1_b: 3 } };
    const b = { ...record(2, '2026-11-22', 230, 200), seen: { s1_a: 2 } };
    const merged = mergeSaves(
      { ...base, exams: { exam1: a, calibration: { listening: 5, reading: 5, pairs: 1 } } },
      {
        ...base,
        exams: {
          exam1: b,
          exam2: record(1, '2026-11-21'),
          calibration: { listening: 9, reading: 9, pairs: 3 },
        },
      },
    ).exams;
    expect(merged.exam1).toEqual({
      attempts: 2,
      lastDate: '2026-11-22',
      listening: 230,
      reading: 200,
      seen: { s1_a: 2, s1_b: 3 },
    });
    expect(merged.exam2).toEqual(record(1, '2026-11-21'));
    expect(merged.calibration).toEqual({ listening: 9, reading: 9, pairs: 3 });
  });

  describe('examRun', () => {
    const run = (startedOn: string, done: unknown[] = [], extra = {}) => ({
      exam: 'exam2',
      seed: 12345,
      startedOn,
      done,
      answers: { s1_q1: 'o2' },
      ...extra,
    });

    it('keeps a good run', () => {
      expect(sanitizeSave({ examRun: run('2026-11-20', ['s1']) }, today).examRun).toEqual(
        run('2026-11-20', ['s1']),
      );
    });

    it('drops an unknown exam, a bad id, a bad seed or a run over 7 days old', () => {
      for (const bad of [
        run('2026-11-20', [], { exam: 'exam7' }),
        run('2026-11-20', [], { seed: -1 }),
        run('2026-11-16'),
        run('soon'),
      ]) {
        expect(sanitizeSave({ examRun: bad }, today).examRun).toBeUndefined();
      }
      expect(sanitizeSave({ examRun: run('2026-11-17') }, today).examRun).toBeDefined();
      const cleaned = sanitizeSave(
        {
          examRun: run('2026-11-20', ['s1', 'BAD', 5], {
            answers: { s1_q1: 'o1', s1_q2: 'x', 'BAD ID': 'o1' },
          }),
        },
        today,
      ).examRun;
      expect(cleaned?.done).toEqual(['s1']);
      expect(cleaned?.answers).toEqual({ s1_q1: 'o1' });
    });

    it('merges the same sitting: the one with more sections done; else ours', () => {
      const base = createEmptySave(today);
      const mine = {
        ...base,
        examRun: sanitizeSave({ examRun: run('2026-11-20', ['s1']) }, today).examRun,
      };
      const more = sanitizeSave({ examRun: run('2026-11-20', ['s1', 's2']) }, today);
      expect(mergeSaves(mine, more).examRun?.done).toEqual(['s1', 's2']);
      expect(mergeSaves(more, mine).examRun?.done).toEqual(['s1', 's2']);
      const other = sanitizeSave({ examRun: run('2026-11-21', ['s1', 's2']) }, today);
      expect(mergeSaves(mine, other).examRun?.startedOn).toBe('2026-11-20');
      // Only one side has a run: it is kept, both ways round.
      expect(mergeSaves(base, more).examRun?.done).toEqual(['s1', 's2']);
      expect(mergeSaves(more, base).examRun?.done).toEqual(['s1', 's2']);
      expect(mergeSaves(base, base).examRun).toBeUndefined();
    });

    it('drops a lone run whose exam the other side has sat more often (it was finished)', () => {
      const withRun = sanitizeSave({ examRun: run('2026-11-20', ['s1']) }, today);
      const finished = sanitizeSave(
        { exams: { exam2: { attempts: 1, lastDate: '2026-11-21', listening: 200, reading: 200 } } },
        today,
      );
      expect(mergeSaves(finished, withRun).examRun).toBeUndefined();
      expect(mergeSaves(withRun, finished).examRun).toBeUndefined();
    });
  });
});
