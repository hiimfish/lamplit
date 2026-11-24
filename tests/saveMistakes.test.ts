import { describe, expect, it } from 'vitest';
import {
  HISTORY_DAYS,
  MISTAKE_TAG,
  MISTAKE_TAGS_PER_DAY,
  createEmptySave,
  exportSave,
  importSave,
  mergeSaves,
  sanitizeSave,
  shiftDay,
  type MistakeCount,
  type MistakeDay,
} from '../src/core/save';

const today = new Date('2026-11-24T10:00:00');
const TODAY = '2026-11-24';
const load = (mistakes: unknown) => sanitizeSave({ mistakes }, today).mistakes;
const pair = (m: number, a: number): MistakeCount => [m, a];

function withMistakes(mistakes: Record<string, MistakeDay>) {
  return { ...createEmptySave(today), mistakes };
}

function bigDay(count: number, asked = 100): Record<string, number[]> {
  return Object.fromEntries(Array.from({ length: count }, (_, i) => [`k:q${i}`, [i, asked]]));
}

describe('MISTAKE_TAG', () => {
  it.each(['p:f-v', 'k:arrange', 'e:article', 'g:to_be', `k:${'a'.repeat(48)}`])(
    'accepts %s',
    (tag) => {
      expect(MISTAKE_TAG.test(tag)).toBe(true);
    },
  );

  it.each(['', 'k:', 'K:a', 'kk:a', 'k:A', 'k:a b', 'k:a.b', 'k:你好', `k:${'a'.repeat(49)}`])(
    'rejects %j',
    (tag) => {
      expect(MISTAKE_TAG.test(tag)).toBe(false);
    },
  );
});

describe('mistakes: loading', () => {
  it('reads as {} when the field is missing, null or not an object', () => {
    expect(sanitizeSave({ version: 1, cards: {} }, today).mistakes).toEqual({});
    for (const bad of [null, undefined, 5, 'x', true, []]) {
      expect(load(bad)).toEqual({});
    }
  });

  it('drops day keys that are not YYYY-MM-DD', () => {
    const entry = { 'k:a': [1, 1] };
    const raw = { today: entry, '2026-1-2': entry, '20261123': entry, '2026-11-23x': entry };
    expect(load(raw)).toEqual({});
  });

  it('drops a day whose value is not an object or ends up empty', () => {
    const raw = {
      '2026-11-24': null,
      '2026-11-23': [],
      '2026-11-22': 'x',
      '2026-11-21': {},
      '2026-11-20': { 'k:a': [0, 0] },
    };
    expect(load(raw)).toEqual({});
  });

  it('drops tags that do not match MISTAKE_TAG', () => {
    const raw = { [TODAY]: { 'k:ok': [1, 1], bad: [1, 1], 'K:up': [1, 1], 'k:': [1, 1] } };
    expect(load(raw)).toEqual({ [TODAY]: { 'k:ok': [1, 1] } });
  });

  it('drops values that are not [whole, whole]', () => {
    const raw = {
      [TODAY]: {
        'k:good': [1, 2],
        'k:short': [1],
        'k:long': [1, 2, 3],
        'k:str': ['1', '2'],
        'k:frac': [1.5, 2],
        'k:frac2': [1, 2.5],
        'k:neg': [-1, 2],
        'k:neg2': [1, -2],
        'k:nan': [Number.NaN, 2],
        'k:inf': [1, Number.POSITIVE_INFINITY],
        'k:null': [null, 1],
        'k:obj': { 0: 1, 1: 2 },
        'k:text': 'x',
        'k:nil': null,
      },
    };
    expect(load(raw)).toEqual({ [TODAY]: { 'k:good': [1, 2] } });
  });

  it('does NOT accept a bare number as [n, 0] (the code drops it)', () => {
    expect(load({ [TODAY]: { 'k:a': 3, 'k:b': [1, 1] } })).toEqual({ [TODAY]: { 'k:b': [1, 1] } });
  });

  it('drops [0, 0] but keeps [0, n] and [n, 0]', () => {
    const raw = { [TODAY]: { 'k:none': [0, 0], 'k:asked': [0, 4], 'k:missed': [3, 0] } };
    expect(load(raw)).toEqual({ [TODAY]: { 'k:asked': [0, 4], 'k:missed': [3, 0] } });
  });

  it('keeps a good day untouched', () => {
    const day: MistakeDay = { 'p:f-v': [2, 5], 'e:article': [1, 1], 'g:to_be': [0, 9] };
    expect(load({ [TODAY]: day })).toEqual({ [TODAY]: day });
  });
});

describe('mistakes: the per-day cap', () => {
  it('drops the least-missed tag when one over the limit', () => {
    const kept = load({ [TODAY]: bigDay(MISTAKE_TAGS_PER_DAY + 1) })[TODAY] ?? {};
    expect(Object.keys(kept)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    const exact = load({ [TODAY]: bigDay(MISTAKE_TAGS_PER_DAY + 1) });
    expect(exact[TODAY]?.['k:q0']).toBeUndefined();
  });

  it('keeps the tags missed most when over the limit', () => {
    const kept = load({ [TODAY]: bigDay(MISTAKE_TAGS_PER_DAY + 5) })[TODAY] ?? {};
    expect(Object.keys(kept)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(kept[`k:q${MISTAKE_TAGS_PER_DAY + 4}`]).toBeDefined();
    expect(kept['k:q4']).toBeUndefined();
    expect(kept['k:q5']).toBeDefined();
  });

  it('breaks ties by asked more, then by name', () => {
    const raw: Record<string, number[]> = {};
    for (let i = 0; i < MISTAKE_TAGS_PER_DAY; i++) raw[`k:t${String(i).padStart(2, '0')}`] = [1, 5];
    raw['k:more'] = [1, 9];
    raw['k:aaa'] = [1, 5];
    const kept = load({ [TODAY]: raw })[TODAY] ?? {};
    expect(Object.keys(kept)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(kept['k:more']).toEqual([1, 9]);
    expect(kept['k:aaa']).toEqual([1, 5]);
    expect(kept['k:t58']).toBeUndefined();
    expect(kept['k:t59']).toBeUndefined();
    expect(kept['k:t57']).toBeDefined();
  });

  it('caps each day on its own', () => {
    const out = load({
      [TODAY]: bigDay(MISTAKE_TAGS_PER_DAY + 3),
      '2026-11-23': bigDay(3),
    });
    expect(Object.keys(out[TODAY] ?? {})).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(Object.keys(out['2026-11-23'] ?? {})).toHaveLength(3);
  });

  it('counts only valid tags toward the cap', () => {
    const raw = { ...bigDay(MISTAKE_TAGS_PER_DAY + 1), 'bad one': [99, 99], 'k:zero': [0, 0] };
    const kept = load({ [TODAY]: raw })[TODAY] ?? {};
    expect(Object.keys(kept)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(kept['k:q0']).toBeUndefined();
    expect(kept['bad one']).toBeUndefined();
  });
});

describe('mistakes: pruning old days', () => {
  const entry = { 'k:a': [1, 1] };

  it('keeps the day HISTORY_DAYS - 1 back and drops HISTORY_DAYS back', () => {
    const last = shiftDay(TODAY, -(HISTORY_DAYS - 1));
    const first = shiftDay(TODAY, -HISTORY_DAYS);
    const out = load({ [last]: entry, [first]: entry });
    expect(Object.keys(out)).toEqual([last]);
  });

  it('drops much older days and keeps today', () => {
    const out = load({ '2020-01-01': entry, [TODAY]: entry });
    expect(Object.keys(out)).toEqual([TODAY]);
  });

  it('keeps a future-dated day (the code only prunes old ones)', () => {
    const future = shiftDay(TODAY, 3);
    expect(Object.keys(load({ [future]: entry }))).toEqual([future]);
  });
});

describe('mistakes: mergeSaves', () => {
  it('unions days that only one side has', () => {
    const ours = withMistakes({ '2026-11-24': { 'k:a': pair(1, 1) } });
    const theirs = withMistakes({ '2026-11-23': { 'k:b': pair(2, 2) } });
    expect(mergeSaves(ours, theirs).mistakes).toEqual({
      '2026-11-24': { 'k:a': [1, 1] },
      '2026-11-23': { 'k:b': [2, 2] },
    });
  });

  it('unions tags within a shared day', () => {
    const ours = withMistakes({ [TODAY]: { 'k:a': pair(1, 1) } });
    const theirs = withMistakes({ [TODAY]: { 'k:b': pair(2, 2) } });
    expect(mergeSaves(ours, theirs).mistakes).toEqual({
      [TODAY]: { 'k:a': [1, 1], 'k:b': [2, 2] },
    });
  });

  it('takes the max of each element and never sums', () => {
    const ours = withMistakes({ [TODAY]: { 'k:a': pair(5, 2), 'k:b': pair(1, 1) } });
    const theirs = withMistakes({ [TODAY]: { 'k:a': pair(3, 9), 'k:b': pair(1, 1) } });
    expect(mergeSaves(ours, theirs).mistakes).toEqual({
      [TODAY]: { 'k:a': [5, 9], 'k:b': [1, 1] },
    });
  });

  it('is symmetric', () => {
    const ours = withMistakes({
      [TODAY]: { 'k:a': pair(5, 2), 'k:c': pair(0, 3) },
      '2026-11-20': { 'k:z': pair(1, 1) },
    });
    const theirs = withMistakes({ [TODAY]: { 'k:a': pair(3, 9), 'k:b': pair(2, 2) } });
    expect(mergeSaves(ours, theirs).mistakes).toEqual(mergeSaves(theirs, ours).mistakes);
  });

  it('merging a save with itself changes nothing', () => {
    const save = withMistakes({ [TODAY]: { 'k:a': pair(5, 2) } });
    expect(mergeSaves(save, save).mistakes).toEqual(save.mistakes);
  });

  it('merges with an empty log on either side', () => {
    const full = withMistakes({ [TODAY]: { 'k:a': pair(5, 2) } });
    const empty = withMistakes({});
    expect(mergeSaves(full, empty).mistakes).toEqual(full.mistakes);
    expect(mergeSaves(empty, full).mistakes).toEqual(full.mistakes);
    expect(mergeSaves(empty, empty).mistakes).toEqual({});
  });

  it('re-applies the per-day cap on a shared day', () => {
    const half = MISTAKE_TAGS_PER_DAY / 2 + 5;
    const a = Object.fromEntries(
      Array.from({ length: half }, (_, i) => [`k:a${i}`, pair(10 + i, 20)]),
    );
    const b = Object.fromEntries(Array.from({ length: half }, (_, i) => [`k:b${i}`, pair(i, 20)]));
    const merged = mergeSaves(withMistakes({ [TODAY]: a }), withMistakes({ [TODAY]: b })).mistakes;
    const day = merged[TODAY] ?? {};
    expect(Object.keys(day)).toHaveLength(MISTAKE_TAGS_PER_DAY);
    expect(day[`k:a${half - 1}`]).toEqual([10 + half - 1, 20]);
    expect(day['k:b0']).toBeUndefined();
  });

  it('does not change the inputs', () => {
    const ours = withMistakes({ [TODAY]: { 'k:a': pair(1, 1) } });
    const theirs = withMistakes({ [TODAY]: { 'k:a': pair(4, 4) } });
    const before = JSON.stringify([ours.mistakes, theirs.mistakes]);
    mergeSaves(ours, theirs);
    expect(JSON.stringify([ours.mistakes, theirs.mistakes])).toBe(before);
  });
});

describe('mistakes: export and import', () => {
  it('keeps the log through a round trip', () => {
    const save = withMistakes({
      [TODAY]: { 'p:f-v': pair(2, 5), 'e:article': pair(0, 3) },
      '2026-11-01': { 'g:to_be': pair(1, 1) },
    });
    const result = importSave(exportSave(save), today);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.save.mistakes).toEqual(save.mistakes);
  });

  it('cleans a hand-edited code on import', () => {
    const save = {
      ...createEmptySave(today),
      mistakes: { [TODAY]: { 'k:a': [1, 1], 'bad tag': [1, 1], 'k:b': [0, 0] }, nope: {} },
    };
    const result = importSave(exportSave(save as never), today);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.save.mistakes).toEqual({ [TODAY]: { 'k:a': [1, 1] } });
  });
});

describe('mistakes: sanitizeSave is idempotent', () => {
  it('gives the same result when run twice on messy input', () => {
    const raw = {
      mistakes: {
        [TODAY]: { ...bigDay(MISTAKE_TAGS_PER_DAY + 7), 'bad tag': [1, 1], 'k:zero': [0, 0] },
        '2026-11-23': { 'k:a': [1, 2], 'k:b': 3 },
        [shiftDay(TODAY, -HISTORY_DAYS)]: { 'k:a': [1, 1] },
        junk: { 'k:a': [1, 1] },
      },
    };
    const once = sanitizeSave(raw, today);
    expect(sanitizeSave(once, today)).toEqual(once);
    expect(sanitizeSave(JSON.parse(JSON.stringify(once)), today).mistakes).toEqual(once.mistakes);
  });

  it('is stable on an empty save', () => {
    const once = sanitizeSave({}, today);
    expect(sanitizeSave(once, today).mistakes).toEqual({});
  });
});
