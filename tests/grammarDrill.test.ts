import { describe, expect, it } from 'vitest';
import type { GrammarPoint } from '../src/content/grammar';
import type { GrammarItem } from '../src/content/grammarBank';
import { createEmptySave, dateKey } from '../src/core/save';
import type { GrammarSeen, SaveData } from '../src/core/save';
import {
  buildDrill,
  drillRemaining,
  finishDrill,
  grammarGoal,
  markGrammarItem,
  pickDrillPoints,
  taughtUpTo,
} from '../src/learning/grammarDrill';
import { NO_ITEM } from '../src/learning/questions';
import type { AnswerResult, FillQuestion, Question } from '../src/learning/questions';
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

/** A small bank: `n` items for a point, the right answer at `answer`. */
const itemsFor = (grammarId: string, n: number, answer = 0): GrammarItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${grammarId}_${i + 1}`,
    grammarId,
    en: `Sentence ${i + 1} of ${grammarId} ___ here.`,
    zh: `${grammarId} 第 ${i + 1} 句`,
    options: ['right', 'wrong1', 'wrong2', 'wrong3'].map((o) => `${o}${i}`),
    answer,
    note: `${grammarId} 的說明 ${i + 1}`,
  }));
const bank: Record<string, GrammarItem[]> = { p1: itemsFor('p1', 4), p2: itemsFor('p2', 3) };

const fills = (questions: Question[]): FillQuestion[] =>
  questions.flatMap((q) => (q.kind === 'fill' ? [q] : []));
const pointsOf = (questions: Question[]) => fills(questions).map((q) => q.grammarIds?.[0]);
const bankIds = (questions: Question[]) => fills(questions).map((q) => q.bankId);

describe('buildDrill', () => {
  const p1 = points[0] as GrammarPoint;
  const p2 = points[1] as GrammarPoint;
  const p3 = points[2] as GrammarPoint;

  it('takes the points in turn', () => {
    expect(pointsOf(buildDrill([p1, p2], bank, undefined, 1, 4))).toEqual(['p1', 'p2', 'p1', 'p2']);
  });

  it('skips points with no items', () => {
    expect(pointsOf(buildDrill([p3, p1], bank, undefined, 1, 3))).toEqual(['p1', 'p1', 'p1']);
  });

  it('asks each item once a round and stops when the items run out', () => {
    const questions = buildDrill([p1, p2], bank, undefined, 3, 20);
    expect(questions).toHaveLength(7);
    expect(new Set(bankIds(questions)).size).toBe(7);
  });

  it('returns nothing for no points, an empty bank or count 0', () => {
    expect(buildDrill([], bank, undefined, 1, 5)).toEqual([]);
    expect(buildDrill([p1], {}, undefined, 1, 5)).toEqual([]);
    expect(buildDrill([p1], bank, undefined, 1, 0)).toEqual([]);
  });

  it('is deterministic per seed', () => {
    expect(buildDrill([p1, p2], bank, undefined, 7, 6)).toEqual(
      buildDrill([p1, p2], bank, undefined, 7, 6),
    );
  });

  it('asks unseen items first, then the ones answered wrong, then the oldest', () => {
    const seen: Record<string, GrammarSeen> = {
      p1_1: { at: 300 },
      p1_2: { at: 100 },
      p1_3: { at: 500, wrong: true },
    };
    expect(bankIds(buildDrill([p1], bank, seen, 1, 4))).toEqual(['p1_4', 'p1_3', 'p1_2', 'p1_1']);
  });

  it('orders the wrong ones by oldest answer too', () => {
    const seen: Record<string, GrammarSeen> = {
      p1_1: { at: 900, wrong: true },
      p1_2: { at: 200, wrong: true },
      p1_3: { at: 100 },
      p1_4: { at: 50 },
    };
    expect(bankIds(buildDrill([p1], bank, seen, 1, 4))).toEqual(['p1_2', 'p1_1', 'p1_4', 'p1_3']);
  });

  it('moves the right answer around', () => {
    const big = { p1: itemsFor('p1', 40) };
    const places = fills(buildDrill([p1], big, undefined, 5, 40)).map((q) =>
      q.options.findIndex((o) => o.id === q.correctId),
    );
    expect(new Set(places).size).toBeGreaterThan(2);
  });

  it('builds the question from the item: sentence parts, answer, zh and note', () => {
    const [q] = fills(buildDrill([p2], { p2: itemsFor('p2', 1, 2) }, undefined, 1, 1));
    expect(q).toMatchObject({
      kind: 'fill',
      before: 'Sentence 1 of p2 ',
      after: ' here.',
      answer: 'wrong20',
      correctId: 'o2',
      zh: 'p2 第 1 句',
      note: 'p2 的說明 1',
      itemId: NO_ITEM,
      grammar: true,
      grammarIds: ['p2'],
      bankId: 'p2_1',
    });
    expect(q?.options.find((o) => o.id === q.correctId)?.label).toBe('wrong20');
    expect(q?.options).toHaveLength(4);
  });
});

describe('markGrammarItem', () => {
  const [question] = buildDrill([points[0] as GrammarPoint], bank, undefined, 1, 1);
  const result = (correct: boolean): AnswerResult => ({
    itemId: NO_ITEM,
    correct,
    usedHelp: false,
    ms: 0,
  });

  it('remembers when the item was answered and whether it was wrong', () => {
    if (!question || question.kind !== 'fill') throw new Error('no question');
    const wrong = markGrammarItem(createEmptySave(now), question, result(false), now);
    expect(wrong.grammarSeen?.[question.bankId ?? '']).toEqual({ at: now.getTime(), wrong: true });
    const later = new Date(now.getTime() + 1000);
    const right = markGrammarItem(wrong, question, result(true), later);
    expect(right.grammarSeen?.[question.bankId ?? '']).toEqual({ at: later.getTime() });
  });

  it('leaves other questions alone', () => {
    const save = createEmptySave(now);
    const other: FillQuestion = {
      kind: 'fill',
      before: 'a ',
      after: '.',
      answer: 'b',
      zh: '',
      options: [],
      correctId: 'o0',
      itemId: NO_ITEM,
    };
    expect(markGrammarItem(save, other, result(false), now)).toBe(save);
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
