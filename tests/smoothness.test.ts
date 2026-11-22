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

  it('gives Acts 3 and 4 the Act 2 values for now', () => {
    const acts: Act[] = ['a', 'b', 'c', 'd'].map((id) => ({
      no: id,
      title: id,
      places: [{ title: id, unitId: id }],
    }));
    expect(smoothnessFor('c', acts)).toEqual(smoothnessFor('b', acts));
    expect(smoothnessFor('d', acts)).toEqual(smoothnessFor('b', acts));
    expect(smoothnessFor('b', acts)).not.toEqual(smoothnessFor('a', acts));
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
