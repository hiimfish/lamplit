import { describe, expect, it } from 'vitest';
import type { GrammarPoint } from '../src/content/grammar';
import type { Lexicon, Pattern } from '../src/content/lexicon';
import { createEmptySave, dateKey } from '../src/core/save';
import type { SaveData } from '../src/core/save';
import {
  buildDrill,
  drillAvailable,
  drillRemaining,
  finishDrill,
  grammarGoal,
  pickDrillPoints,
  taughtUpTo,
} from '../src/learning/grammarDrill';
import type { DrillDeps } from '../src/learning/grammarDrill';
import type { FillQuestion } from '../src/learning/questions';
import { taskKey } from '../src/learning/sessionPlan';
import { buildTown } from '../src/learning/townPlan';

const now = new Date(2026, 10, 24, 10, 0, 0);
const today = dateKey(now);

const unit = (id: string, tasks = 2) => ({
  id,
  title: id,
  tasks: Array.from({ length: tasks }, (_, i) => ({
    id: `t${i + 1}`,
    newWordIds: [`${id}${i + 1}a`, `${id}${i + 1}b`],
  })),
});
const town = buildTown(
  [
    {
      no: '一',
      title: 'one',
      places: [
        { unitId: 'a', title: 'A' },
        { unitId: 'b', title: 'B' },
      ],
    },
  ],
  [unit('a'), unit('b')],
);

const point = (id: string, unitId: string, taskId: string): GrammarPoint => ({
  id,
  zh: id,
  group: 'g',
  unitId,
  taskId,
  note: id,
});
const points = [
  point('p1', 'a', 't1'),
  point('p2', 'a', 't2'),
  point('p3', 'b', 't1'),
  point('p4', 'b', 't2'),
];

function played(...keys: string[]): SaveData {
  const save = createEmptySave(now);
  for (const key of keys) save.tasks[key] = { stars: 1, plays: 1 };
  return save;
}

function withTags(save: SaveData, tags: Record<string, [number, number]>): SaveData {
  return { ...save, mistakes: { ...save.mistakes, [today]: tags } };
}

describe('grammarGoal and drillRemaining', () => {
  it('is 10 on the normal route and 15 on the sprint', () => {
    const save = createEmptySave(now);
    expect(grammarGoal(save.route)).toBe(10);
    expect(grammarGoal({ ...save.route, kind: 'sprint' })).toBe(15);
  });

  it('counts down with today answers and never goes below 0', () => {
    const save = createEmptySave(now);
    expect(drillRemaining(save, save.route, now)).toBe(10);
    const some = { ...save, daily: { ...save.daily, grammar: 4 } };
    expect(drillRemaining(some, save.route, now)).toBe(6);
    const many = { ...save, daily: { ...save.daily, grammar: 99 } };
    expect(drillRemaining(many, save.route, now)).toBe(0);
  });

  it('starts over on a new day', () => {
    const save = createEmptySave(now);
    const some = { ...save, daily: { ...save.daily, grammar: 4 } };
    expect(drillRemaining(some, save.route, new Date(2026, 10, 25))).toBe(10);
  });
});

describe('pickDrillPoints', () => {
  it('is empty when nothing was played', () => {
    expect(pickDrillPoints(createEmptySave(now), now, town, points)).toEqual([]);
  });

  it('keeps only points whose home task was played', () => {
    const save = played(taskKey('a', 't1'), taskKey('b', 't1'));
    expect(pickDrillPoints(save, now, town, points).map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('ignores points whose task is not in the town', () => {
    const save = played(taskKey('zz', 't1'));
    expect(pickDrillPoints(save, now, town, [point('x', 'zz', 't1')])).toEqual([]);
  });

  it('puts the most missed points first, then the least asked', () => {
    const base = played(
      taskKey('a', 't1'),
      taskKey('a', 't2'),
      taskKey('b', 't1'),
      taskKey('b', 't2'),
    );
    const save = withTags(base, {
      'g:p2': [1, 4],
      'g:p4': [3, 5],
      'g:p1': [0, 9],
      'g:p3': [0, 2],
    });
    expect(pickDrillPoints(save, now, town, points).map((p) => p.id)).toEqual([
      'p4',
      'p2',
      'p3',
      'p1',
    ]);
  });

  it('ignores misses older than 30 days', () => {
    const base = played(taskKey('a', 't1'), taskKey('a', 't2'));
    const old = { ...base, mistakes: { '2026-10-01': { 'g:p2': [5, 5] as [number, number] } } };
    expect(pickDrillPoints(old, now, town, points).map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('returns up to the limit, distinct', () => {
    const save = played(
      taskKey('a', 't1'),
      taskKey('a', 't2'),
      taskKey('b', 't1'),
      taskKey('b', 't2'),
    );
    const picked = pickDrillPoints(save, now, town, points, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((p) => p.id)).size).toBe(3);
    expect(pickDrillPoints(save, now, town, points, 0)).toEqual([]);
  });

  it('never returns fewer than the played points when under the limit', () => {
    const save = played(taskKey('a', 't1'));
    expect(pickDrillPoints(save, now, town, points)).toHaveLength(1);
  });
});

describe('taughtUpTo', () => {
  it('is empty before any task was played', () => {
    expect(taughtUpTo(town, createEmptySave(now)).size).toBe(0);
  });

  it('includes every task up to the furthest one played', () => {
    const taught = taughtUpTo(town, played(taskKey('b', 't1')));
    expect([...taught].sort()).toEqual(['a1a', 'a1b', 'a2a', 'a2b', 'b1a', 'b1b']);
  });
});

const patterns: Pattern[] = [
  { id: 'pa1', grammarId: 'p1', shape: 'svo', tense: 'present', blanks: ['verb-form'] },
  { id: 'pa2', grammarId: 'p1', shape: 'svo', tense: 'past', blanks: ['article'] },
  { id: 'pb1', grammarId: 'p2', shape: 'svo', tense: 'present', blanks: ['prep'] },
  { id: 'none', grammarId: 'p3', shape: 'svo', tense: 'present', blanks: ['prep'] },
];

const lexicons: Record<string, Lexicon> = { a: { x: { pos: 'n' } }, b: { y: { pos: 'v' } } };

/** A fake generator: sentence text comes from the rng, so seeds decide the round. */
const fakes: DrillDeps = {
  buildSentence: (pattern, _lexicon, _taught, rng) =>
    pattern.id === 'none'
      ? null
      : { en: `${pattern.id} ${Math.floor(rng() * 6)}`, pattern, slots: {} },
  sentenceFill: (sentence, blank): FillQuestion => ({
    kind: 'fill',
    before: sentence.en,
    after: blank,
    answer: 'x',
    zh: '',
    options: [{ id: 'o1', label: 'x' }],
    correctId: 'o1',
    itemId: '',
    grammarIds: [sentence.pattern.grammarId],
  }),
};

const taughtFor = () => new Set(['x']);
const ids = (questions: ReturnType<typeof buildDrill>) =>
  questions.map((q) => (q.kind === 'fill' ? q.grammarIds?.[0] : undefined));

describe('buildDrill', () => {
  const p1 = points[0] as GrammarPoint;
  const p2 = points[1] as GrammarPoint;
  const p3 = points[2] as GrammarPoint;

  it('distributes questions round-robin over the points', () => {
    const questions = buildDrill([p1, p2], lexicons, patterns, taughtFor, 1, 4, fakes);
    expect(ids(questions)).toEqual(['p1', 'p2', 'p1', 'p2']);
  });

  it('skips points whose patterns yield nothing', () => {
    const questions = buildDrill([p3, p1], lexicons, patterns, taughtFor, 1, 3, fakes);
    expect(ids(questions)).toEqual(['p1', 'p1', 'p1']);
  });

  it('is deterministic per seed', () => {
    const a = buildDrill([p1, p2], lexicons, patterns, taughtFor, 7, 6, fakes);
    const b = buildDrill([p1, p2], lexicons, patterns, taughtFor, 7, 6, fakes);
    expect(a).toEqual(b);
  });

  it('uses each sentence once in a run', () => {
    const questions = buildDrill([p1, p2], lexicons, patterns, taughtFor, 3, 8, fakes);
    const texts = questions.map((q) => (q.kind === 'fill' ? q.before : ''));
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('returns fewer when the generator runs out of new sentences', () => {
    const few: DrillDeps = {
      ...fakes,
      buildSentence: (p) => ({ en: p.id, pattern: p, slots: {} }),
    };
    const questions = buildDrill([p1, p2], lexicons, patterns, taughtFor, 1, 10, few);
    expect(questions).toHaveLength(3);
  });

  it('returns nothing for no points, no patterns or count 0', () => {
    expect(buildDrill([], lexicons, patterns, taughtFor, 1, 5, fakes)).toEqual([]);
    expect(buildDrill([p1], lexicons, [], taughtFor, 1, 5, fakes)).toEqual([]);
    expect(buildDrill([p1], lexicons, patterns, taughtFor, 1, 0, fakes)).toEqual([]);
  });

  it('passes the merged lexicon and the taught set of the point', () => {
    const seen: { size: number; taught: string[] }[] = [];
    const spy: DrillDeps = {
      ...fakes,
      buildSentence: (pattern, lexicon, taught, rng) => {
        seen.push({ size: Object.keys(lexicon).length, taught: [...taught] });
        return fakes.buildSentence(pattern, lexicon, taught, rng);
      },
    };
    buildDrill([p1], lexicons, patterns, (p) => new Set([p.id]), 1, 1, spy);
    expect(seen[0]).toEqual({ size: 2, taught: ['p1'] });
  });
});

describe('drillAvailable', () => {
  it('is false when no home task was played', () => {
    expect(drillAvailable(createEmptySave(now), town, points, patterns)).toBe(false);
  });

  it('is false when the played points have no pattern', () => {
    expect(drillAvailable(played(taskKey('b', 't2')), town, points, patterns)).toBe(false);
  });

  it('is false when there are no patterns at all', () => {
    expect(drillAvailable(played(taskKey('a', 't1')), town, points, [])).toBe(false);
  });

  it('is true when a played point has a pattern', () => {
    expect(drillAvailable(played(taskKey('a', 't1')), town, points, patterns)).toBe(true);
  });
});

describe('finishDrill', () => {
  it('adds the answers to daily.grammar and counts the day as played', () => {
    const save = createEmptySave(now);
    const done = finishDrill(save, 10, now);
    expect(done.daily.grammar).toBe(10);
    expect(done.streak.lastDate).toBe(today);
    expect(done.streak.count).toBe(1);
    expect(finishDrill(done, 5, now).daily.grammar).toBe(15);
  });

  it('gives the coins of a review round for the same count', () => {
    const save = createEmptySave(now);
    expect(finishDrill(save, 10, now).coins).toBe(save.coins + 50);
    expect(finishDrill(save, 10, now, 6).coins).toBe(save.coins + 30);
    expect(finishDrill(save, 4, now, 99).coins).toBe(save.coins + 20);
  });

  it('does nothing for an empty round', () => {
    const save = createEmptySave(now);
    expect(finishDrill(save, 0, now)).toBe(save);
  });

  it('does not touch the save it was given', () => {
    const save = createEmptySave(now);
    finishDrill(save, 3, now);
    expect(save.daily.grammar).toBe(0);
  });
});
