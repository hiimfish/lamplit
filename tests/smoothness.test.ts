import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTS, type Act } from '../src/content/acts';
import type { Task, Unit } from '../src/content/types';
import { UNIT_ORDER } from '../src/content/unitOrder';
import {
  parseWordLists,
  profileUnits,
  questionTexts,
  smoothnessBreaks,
  smoothnessFor,
  type TaskProfile,
} from '../src/content/vocab';

const LISTS = join(__dirname, '..', 'src', 'data', 'wordlists');
const UNITS = join(__dirname, '..', 'src', 'data', 'units');
const utf8 = (f: string) => readFileSync(join(LISTS, f), 'utf8');
const latin1 = (f: string) => readFileSync(join(LISTS, f), 'latin1');

const lists = parseWordLists({
  ngslStats: utf8('NGSL_12_stats.csv'),
  ngslForms: utf8('NGSL_12_lemmatized_for_research.csv'),
  supForms: utf8('SUP_lemmatized.csv'),
  tslStats: latin1('TSL_12_stats.csv'),
  tslForms: latin1('TSL_12_lemmatized_for_research.csv'),
});

/** A short, clean task profile to vary one field at a time. */
const task = (over: Partial<TaskProfile> = {}): TaskProfile => ({
  unitId: 'u',
  taskId: 't',
  newItems: 4,
  newLemmas: [],
  wordBands: [],
  wordRanks: [],
  levelRanks: [],
  freqLevel: 500,
  chunkWords: 4,
  lines: 4,
  avgLineWords: 4,
  tokens: 16,
  coverage: 1,
  unplanned: [],
  score: 20,
  review: false,
  ...over,
});

describe('smoothness rules', () => {
  it('passes a smooth run', () => {
    expect(smoothnessBreaks([task(), task({ score: 23, newItems: 5 })], lists, ACTS)).toEqual([]);
  });

  it('limits short stories to one frequent untaught word', () => {
    expect(smoothnessBreaks([task({ unplanned: ['open', 'bus'] })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([task({ unplanned: ['sheep'] })], lists, ACTS)).toHaveLength(1); // N2710
    expect(smoothnessBreaks([task({ unplanned: ['open'] })], lists, ACTS)).toEqual([]);
  });

  it('judges long texts by coverage instead', () => {
    const long = { tokens: 60, unplanned: ['open', 'bus'] };
    expect(smoothnessBreaks([task({ ...long, coverage: 0.97 })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([task({ ...long, coverage: 0.98 })], lists, ACTS)).toEqual([]);
  });

  it('lets the score rise by 3 and drop by 5 at most', () => {
    const run = (next: number) => smoothnessBreaks([task(), task({ score: next })], lists, ACTS);
    expect(run(23)).toEqual([]);
    expect(run(24)).toHaveLength(1);
    expect(run(15)).toEqual([]);
    expect(run(14)).toHaveLength(1);
  });

  it('leaves review-only tasks out of the score curve', () => {
    const review = task({ review: true, newItems: 0, score: 5 });
    // The next task is compared with the last one that teaches, not with the review.
    expect(
      smoothnessBreaks([task(), review, task({ score: 23, newItems: 5 })], lists, ACTS),
    ).toEqual([]);
    expect(smoothnessBreaks([task(), review, task({ score: 24 })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([task(), review, task({ newItems: 6 })], lists, ACTS)).toHaveLength(1);
  });

  it('still checks the story of a review-only task', () => {
    const noisy = task({ review: true, unplanned: ['open', 'bus'] });
    expect(smoothnessBreaks([task(), noisy], lists, ACTS)).toHaveLength(1);
  });

  it('adds at most one new item per task', () => {
    expect(smoothnessBreaks([task(), task({ newItems: 6 })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([task({ newItems: 6 }), task({ newItems: 2 })], lists, ACTS)).toEqual(
      [],
    );
  });
});

/** The shipped units that are in the play order, in that order. */
const shipped = (): Unit[] =>
  readdirSync(UNITS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(UNITS, f), 'utf8')) as Unit)
    .filter((u) => UNIT_ORDER.includes(u.id))
    .sort((a, b) => UNIT_ORDER.indexOf(a.id) - UNIT_ORDER.indexOf(b.id));

describe('smoothness limits per act', () => {
  /** A task of a unit of Act 2 (bank). */
  const act2 = (over: Partial<TaskProfile> = {}) => task({ unitId: 'bank', ...over });

  it('keeps the Act 1 values for Act 1 and for units in no act', () => {
    const act1 = smoothnessFor('cafe', ACTS);
    expect(act1).toEqual({
      longText: 50,
      minCoverage: 0.98,
      maxUnplanned: 1,
      maxUnplannedRank: 1000,
      maxRise: 3,
      maxDrop: 5,
      maxItemGrowth: 1,
    });
    expect(smoothnessFor('nowhere', ACTS)).toEqual(act1);
    expect(smoothnessBreaks([task({ unplanned: ['requirement'] })], lists, ACTS)).toHaveLength(1); // N1204
  });

  it('lets Act 2 use a rarer untaught word and a little less coverage', () => {
    expect(smoothnessFor('bank', ACTS)).toMatchObject({
      maxUnplannedRank: 1800,
      minCoverage: 0.95,
    });
    expect(smoothnessBreaks([act2({ unplanned: ['requirement'] })], lists, ACTS)).toEqual([]);
    expect(smoothnessBreaks([act2({ unplanned: ['negotiate'] })], lists, ACTS)).toHaveLength(1); // N2002
    expect(smoothnessBreaks([act2({ unplanned: ['open', 'bus'] })], lists, ACTS)).toHaveLength(1);
    const long = { tokens: 60, unplanned: ['open', 'bus'] };
    expect(smoothnessBreaks([act2({ ...long, coverage: 0.95 })], lists, ACTS)).toEqual([]);
    expect(smoothnessBreaks([act2({ ...long, coverage: 0.94 })], lists, ACTS)).toHaveLength(1);
  });

  it('keeps the score and item limits in Act 2', () => {
    const run = (next: Partial<TaskProfile>) => smoothnessBreaks([act2(), act2(next)], lists, ACTS);
    expect(run({ score: 23 })).toEqual([]);
    expect(run({ score: 24 })).toHaveLength(1);
    expect(run({ score: 14 })).toHaveLength(1);
    expect(run({ newItems: 6 })).toHaveLength(1);
  });

  it('gives the real Act 3 units the Act 2 values, item growth +1 included', () => {
    expect(smoothnessFor('airport', ACTS)).toEqual(smoothnessFor('bank', ACTS));
    expect(smoothnessFor('onboarding', ACTS).maxItemGrowth).toBe(1);
    const act3 = (over: Partial<TaskProfile> = {}) => task({ unitId: 'airport', ...over });
    expect(smoothnessBreaks([act3({ newItems: 10 }), act3({ newItems: 11 })], lists, ACTS)).toEqual(
      [],
    );
    expect(
      smoothnessBreaks([act3({ newItems: 10 }), act3({ newItems: 12 })], lists, ACTS),
    ).toHaveLength(1);
  });

  it('gives Act 3 the Act 2 values, and Act 4 its own row with the same values', () => {
    const acts: Act[] = ['a', 'b', 'c', 'd'].map((id) => ({
      no: id,
      title: id,
      places: [{ title: id, unitId: id }],
    }));
    expect(smoothnessFor('c', acts)).toEqual(smoothnessFor('b', acts));
    expect(smoothnessFor('d', acts)).toEqual(smoothnessFor('b', acts));
    expect(smoothnessFor('b', acts)).not.toEqual(smoothnessFor('a', acts));
    expect(smoothnessFor('presentation', ACTS)).toEqual(smoothnessFor('bank', ACTS));
  });

  /** New items per teaching task in play order (docs/specs/act4-syllabus.md, 新項目數的曲線). */
  const ACT4_CURVE: Record<string, number[]> = {
    presentation: [11, 12, 12, 11, 12, 12, 11, 12],
    budget: [11, 12, 12, 11, 12, 12, 11, 12],
    marketing: [11, 12, 12, 12, 12, 12, 12, 12],
    recruiting: [11, 12, 12, 12, 12, 12, 12, 12],
    training: [12, 12, 12, 12, 12, 13, 12, 13],
    legal: [12, 12, 12, 12, 12, 13, 12, 13],
    factory: [12, 13, 13, 12, 13, 13, 13, 13],
    branch: [12, 13, 13, 12, 13, 13, 13, 13],
    wellness: [12, 13, 13, 13, 13, 13, 13, 13],
    media: [12, 13, 13, 13, 13, 13, 13, 13],
    annual_meeting: [13, 13, 13, 13, 13, 14, 13, 14],
    promotion: [13, 13, 13, 13, 13, 14, 13, 14],
  };
  /** The curve as profiles, a role-play (no items) after each unit, after company_event t8 (12). */
  const curve = (edit: (unitId: string, i: number, items: number) => number = (_u, _i, n) => n) => [
    task({ unitId: 'company_event', taskId: 't8', newItems: 12 }),
    ...Object.entries(ACT4_CURVE).flatMap(([unitId, items]) => [
      ...items.map((n, i) => task({ unitId, taskId: `t${i + 1}`, newItems: edit(unitId, i, n) })),
      task({ unitId, taskId: 't9', newItems: 0, review: true }),
    ]),
  ];

  it('passes the Act 4 syllabus curve, and catches a jump of two items', () => {
    expect(Object.keys(ACT4_CURVE)).toEqual(ACTS[3]!.places.map((place) => place.unitId));
    expect(smoothnessBreaks(curve(), lists, ACTS)).toEqual([]);
    const jump = curve((unitId, i, n) => (unitId === 'factory' && i === 1 ? n + 1 : n));
    expect(smoothnessBreaks(jump, lists, ACTS)).toEqual([
      expect.stringContaining('factory/t2：新項目從 12 增加到 14'),
    ]);
  });

  it('still catches untaught words and score jumps in Act 4', () => {
    const act4 = (over: Partial<TaskProfile> = {}) => task({ unitId: 'media', ...over });
    expect(smoothnessBreaks([act4({ unplanned: ['open', 'bus'] })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([act4({ unplanned: ['negotiate'] })], lists, ACTS)).toHaveLength(1);
    expect(smoothnessBreaks([act4(), act4({ score: 24 })], lists, ACTS)).toHaveLength(1);
    const long = { tokens: 60, unplanned: ['open', 'bus'] };
    expect(smoothnessBreaks([act4({ ...long, coverage: 0.94 })], lists, ACTS)).toHaveLength(1);
  });
});

describe('questionTexts', () => {
  const base: Task = { id: 't', title: 't', newChunkIds: [], newWordIds: [], scene: [] };
  const texts = (over: Partial<Task>) => questionTexts({ ...base, ...over }).map((l) => l.en);

  it('puts each option of a fill into its blank', () => {
    const fills = [
      {
        id: 'f1',
        en: 'I ___ a job.',
        zh: '我需要工作。',
        options: ['need', 'needs', 'needing'],
        answer: 0,
      },
    ];
    expect(texts({ fills })).toEqual(['I need a job.', 'I needs a job.', 'I needing a job.']);
  });

  it('takes the title, lines, questions and options of a passage', () => {
    const passages = [
      {
        id: 'p1',
        kind: 'notice' as const,
        title: 'Job Fair',
        lines: ['Come on Monday.'],
        questions: [
          { en: 'When is it?', zh: '什麼時候？', options: ['Monday', 'Friday'], answer: 0 },
        ],
      },
    ];
    expect(texts({ passages })).toEqual([
      'Job Fair',
      'Come on Monday.',
      'When is it?',
      'Monday',
      'Friday',
    ]);
  });

  it('takes the lines, questions and options of a talk', () => {
    const talks = [
      {
        id: 'k1',
        lines: [
          { id: 'k1_1', role: 'clerk' as const, en: 'Can I help you?', zh: '需要幫忙嗎？' },
          { id: 'k1_2', role: 'friend' as const, en: 'Yes, please.', zh: '好，麻煩你。' },
        ],
        questions: [
          { en: 'Who is talking?', zh: '誰在說話？', options: ['A clerk', 'A doctor'], answer: 0 },
        ],
      },
    ];
    expect(texts({ talks })).toEqual([
      'Can I help you?',
      'Yes, please.',
      'Who is talking?',
      'A clerk',
      'A doctor',
    ]);
  });

  it('takes the lines and the table of a talk, and the lines of a monologue', () => {
    const lines = [
      { id: 'k1_1', role: 'clerk' as const, en: 'It ships on Monday.', zh: '星期一出貨。' },
      { id: 'k1_2', role: 'friend' as const, en: 'Good.', zh: '好。' },
    ];
    const questions = [{ en: 'When?', zh: '何時？', options: ['Monday', 'Friday'], answer: 0 }];
    const table = {
      title: 'Shipping',
      rows: [
        ['Order', 'Day'],
        ['Lamps', 'Monday'],
      ],
    };
    expect(texts({ talks: [{ id: 'k1', lines, questions, table }] })).toEqual([
      'It ships on Monday.',
      'Good.',
      'Shipping',
      'Order',
      'Day',
      'Lamps',
      'Monday',
      'When?',
      'Monday',
      'Friday',
    ]);
    const monologue = { id: 'k2', kind: 'monologue' as const, lines, questions };
    expect(texts({ talks: [monologue] })).toEqual([
      'It ships on Monday.',
      'Good.',
      'When?',
      'Monday',
      'Friday',
    ]);
  });

  it('takes the title, the lines with the answers in, and every option of a text fill', () => {
    const textFills = [
      {
        id: 'e1',
        kind: 'email' as const,
        title: 'From: Dan',
        lines: ['The meeting is ___ Monday.', 'Please ___ notes.'],
        zh: ['會議在星期一。', '請帶筆記。'],
        blanks: [
          { options: ['in', 'on', 'at', 'by'], answer: 1 },
          { options: ['bring', 'brings', 'brought', 'bringing'], answer: 0 },
        ],
      },
    ];
    expect(texts({ textFills })).toEqual([
      'From: Dan',
      'The meeting is on Monday.',
      'Please bring notes.',
      'in',
      'on',
      'at',
      'by',
      'bring',
      'brings',
      'brought',
      'bringing',
    ]);
  });

  it('flags an untaught word in a text fill option or a table cell', () => {
    const unit: Unit = {
      id: 'u',
      title: 'u',
      titleEn: 'u',
      chunks: [],
      words: [],
      tasks: [
        {
          ...base,
          textFills: [
            {
              id: 'e1',
              kind: 'email',
              lines: ['I see the ___.', 'See you ___.'],
              zh: ['我看到門。', '再見。'],
              blanks: [
                { options: ['door', 'zebra', 'car', 'desk'], answer: 0 },
                { options: ['now', 'then', 'soon', 'here'], answer: 0 },
              ],
            },
          ],
          talks: [
            {
              id: 'k1',
              lines: [
                { id: 'k1_1', role: 'clerk', en: 'Look.', zh: '看。' },
                { id: 'k1_2', role: 'friend', en: 'Okay.', zh: '好。' },
              ],
              questions: [{ en: 'What?', zh: '什麼？', options: ['A', 'B'], answer: 0 }],
              table: {
                rows: [
                  ['Day', 'Item'],
                  ['Today', 'giraffe'],
                ],
              },
            },
          ],
        },
      ],
    };
    const probe = { ...unit, tasks: unit.tasks.map((t) => ({ ...t, scene: questionTexts(t) })) };
    const [profile] = profileUnits([probe], lists, { starterRank: 2809 });
    expect(profile?.unplanned).toEqual(['giraffe', 'zebra']);
  });

  it('flags an untaught word in a fill option, but not a name in mid-sentence', () => {
    const unit: Unit = {
      id: 'u',
      title: 'u',
      titleEn: 'u',
      chunks: [],
      words: [],
      tasks: [
        {
          ...base,
          fills: [
            {
              id: 'f1',
              en: 'I see Mei at the ___.',
              zh: '我在那裡看到美。',
              options: ['door', 'zebra', 'car'],
              answer: 0,
            },
          ],
        },
      ],
    };
    const probe = { ...unit, tasks: unit.tasks.map((t) => ({ ...t, scene: questionTexts(t) })) };
    const [profile] = profileUnits([probe], lists, { starterRank: 2809 });
    expect(profile?.unplanned).toEqual(['zebra']);
  });
});

describe('the real units in play order', () => {
  it('break no smoothness rule', () => {
    const units = shipped();
    expect(units.map((u) => u.id)).toEqual([...UNIT_ORDER]);
    expect(smoothnessBreaks(profileUnits(units, lists), lists, ACTS)).toEqual([]);
  });

  // Blanked words, wrong choices, signs, their questions, picture sentences, fills, passages
  // and talks: all taught by that task.
  it('use only taught words in the questions', () => {
    const probe = shipped().map((u) => ({
      ...u,
      tasks: u.tasks.map((t) => ({ ...t, scene: questionTexts(t) })),
    }));
    const untaught = profileUnits(probe, lists)
      .filter((p) => p.unplanned.length > 0)
      .map((p) => `${p.unitId}/${p.taskId}: ${p.unplanned.join(' ')}`);
    expect(untaught).toEqual([]);
  });
});
