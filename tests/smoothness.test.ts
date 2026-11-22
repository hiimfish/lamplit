import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SceneLine, Task, Unit } from '../src/content/types';
import { UNIT_ORDER } from '../src/content/unitOrder';
import {
  parseWordLists,
  profileUnits,
  smoothnessBreaks,
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
    expect(smoothnessBreaks([task(), task({ score: 23, newItems: 5 })], lists)).toEqual([]);
  });

  it('limits short stories to one frequent untaught word', () => {
    expect(smoothnessBreaks([task({ unplanned: ['open', 'bus'] })], lists)).toHaveLength(1);
    expect(smoothnessBreaks([task({ unplanned: ['sheep'] })], lists)).toHaveLength(1); // N2710
    expect(smoothnessBreaks([task({ unplanned: ['open'] })], lists)).toEqual([]);
  });

  it('judges long texts by coverage instead', () => {
    const long = { tokens: 60, unplanned: ['open', 'bus'] };
    expect(smoothnessBreaks([task({ ...long, coverage: 0.97 })], lists)).toHaveLength(1);
    expect(smoothnessBreaks([task({ ...long, coverage: 0.98 })], lists)).toEqual([]);
  });

  it('lets the score rise by 3 and drop by 5 at most', () => {
    const run = (next: number) => smoothnessBreaks([task(), task({ score: next })], lists);
    expect(run(23)).toEqual([]);
    expect(run(24)).toHaveLength(1);
    expect(run(15)).toEqual([]);
    expect(run(14)).toHaveLength(1);
  });

  it('leaves review-only tasks out of the score curve', () => {
    const review = task({ review: true, newItems: 0, score: 5 });
    // The next task is compared with the last one that teaches, not with the review.
    expect(smoothnessBreaks([task(), review, task({ score: 23, newItems: 5 })], lists)).toEqual([]);
    expect(smoothnessBreaks([task(), review, task({ score: 24 })], lists)).toHaveLength(1);
    expect(smoothnessBreaks([task(), review, task({ newItems: 6 })], lists)).toHaveLength(1);
  });

  it('still checks the story of a review-only task', () => {
    const noisy = task({ review: true, unplanned: ['open', 'bus'] });
    expect(smoothnessBreaks([task(), noisy], lists)).toHaveLength(1);
  });

  it('adds at most one new item per task', () => {
    expect(smoothnessBreaks([task(), task({ newItems: 6 })], lists)).toHaveLength(1);
    expect(smoothnessBreaks([task({ newItems: 6 }), task({ newItems: 2 })], lists)).toEqual([]);
  });
});

/** The shipped units that are in the play order, in that order. */
const shipped = (): Unit[] =>
  readdirSync(UNITS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(UNITS, f), 'utf8')) as Unit)
    .filter((u) => UNIT_ORDER.includes(u.id))
    .sort((a, b) => UNIT_ORDER.indexOf(a.id) - UNIT_ORDER.indexOf(b.id));

/** Every text a task's cloze, sign and picture questions show, as lines to profile like a story. */
function questionTexts(task: Task): SceneLine[] {
  const texts = [
    ...(task.cloze ?? []).flatMap((c) => [c.word, ...c.distractors]),
    ...(task.signs ?? []).flatMap((s) => [
      s.heading ?? '',
      ...s.rows.flatMap((r) => [r.label, r.value ?? '']),
      s.question.en,
      ...s.options,
    ]),
    ...(task.pictures ?? []).flatMap((p) => p.options.map((o) => o.en)),
  ];
  return texts
    .filter((en) => en !== '')
    .map((en, i) => ({ id: `q${i}`, role: 'guide', speaker: 'npc', en, zh: en }));
}

describe('the real units in play order', () => {
  it('break no smoothness rule', () => {
    const units = shipped();
    expect(units.map((u) => u.id)).toEqual([...UNIT_ORDER]);
    expect(smoothnessBreaks(profileUnits(units, lists), lists)).toEqual([]);
  });

  // Blanked words, wrong choices, signs, their questions, picture sentences: all taught by that task.
  it('use only taught words in cloze, sign and picture questions', () => {
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
