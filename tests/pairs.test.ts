import { describe, expect, it } from 'vitest';
import moveIn from '../src/data/units/move_in.json';
import { VOICE_NAMES } from '../src/audio/voices';
import { unitToAudioItems } from '../src/content/audioItems';
import { ROLE_LABEL } from '../src/content/roles';
import type { Unit } from '../src/content/types';
import { getItem, taskItemIds } from '../src/content/units';
import { validateUnit } from '../src/content/validate';
import { buildReviewQuestions, buildTaskPractice, makeRng } from '../src/learning/questionGen';
import type { ListenPairQuestion, Question } from '../src/learning/questions';

const unit = moveIn as Unit;

/** A fresh deep copy of the moving-in unit to break on purpose. */
const copy = (): typeof moveIn => JSON.parse(JSON.stringify(moveIn));

const pairQuestions = (qs: Question[]) =>
  qs.filter((q): q is ListenPairQuestion => q.kind === 'listen-pair');

describe('minimal pair content', () => {
  const problemsFor = (edit: (u: ReturnType<typeof copy>) => void) => {
    const u = copy();
    edit(u);
    return validateUnit(u);
  };

  it('accepts the shipped unit and a unit without pairs', () => {
    expect(validateUnit(moveIn)).toEqual([]);
    expect(
      problemsFor((u) => {
        delete (u as { pairs?: unknown }).pairs;
        for (const t of u.tasks) delete (t as { newPairIds?: unknown }).newPairIds;
      }),
    ).toEqual([]);
  });

  it('rejects bad or duplicate pair and side ids', () => {
    expect(problemsFor((u) => (u.pairs[0]!.id = 'Fan-Van'))).not.toEqual([]);
    expect(problemsFor((u) => (u.pairs[1]!.id = u.pairs[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.pairs[0]!.a.id = 'f.an'))).not.toEqual([]);
    expect(problemsFor((u) => (u.pairs[1]!.a.id = u.pairs[0]!.b.id))).not.toEqual([]);
  });

  it('rejects missing text, missing focus, a missing side and identical sides', () => {
    expect(problemsFor((u) => (u.pairs[0]!.a.zh = ''))).not.toEqual([]);
    expect(problemsFor((u) => (u.pairs[0]!.focus = ''))).not.toEqual([]);
    expect(problemsFor((u) => delete (u.pairs[0] as { b?: unknown }).b)).not.toEqual([]);
    expect(problemsFor((u) => (u.pairs[0]!.b.en = 'FAN'))).not.toEqual([]);
    expect(problemsFor((u) => ((u as { pairs: unknown }).pairs = 'fan'))).not.toEqual([]);
  });

  it('rejects unknown pair references', () => {
    expect(problemsFor((u) => u.tasks[0]!.newPairIds.push('nope'))).not.toEqual([]);
  });

  it('rejects unknown roles but knows the landlord', () => {
    expect(problemsFor((u) => (u.tasks[0]!.scene[0]!.role = 'mayor'))).not.toEqual([]);
    expect(VOICE_NAMES.chirp.landlord).toMatch(/^en-US-Chirp3-HD-/);
    expect(VOICE_NAMES.neural2.landlord).toMatch(/^en-US-Neural2-/);
    expect(ROLE_LABEL.landlord).toBe('房東');
  });
});

describe('minimal pair items and audio', () => {
  it('looks up a pair with both sides and their audio', () => {
    expect(getItem('pair:fan_van')).toMatchObject({
      itemId: 'pair:fan_van',
      kind: 'pair',
      unitId: 'move_in',
      text: 'fan / van',
      audioId: 'move_in.pair.fan',
      focus: 'f／v',
      sides: [
        { id: 'fan', en: 'fan', audioId: 'move_in.pair.fan' },
        { id: 'van', en: 'van', audioId: 'move_in.pair.van' },
      ],
    });
    expect(getItem('pair:fan')).toBeUndefined();
  });

  it('lists pairs after chunks and words', () => {
    expect(taskItemIds({ newChunkIds: ['a'], newWordIds: ['b'], newPairIds: ['c'] })).toEqual([
      'chunk:a',
      'word:b',
      'pair:c',
    ]);
  });

  it('generates audio for both sides of every pair with the guide voice', () => {
    const items = unitToAudioItems(unit);
    const pairItems = items.filter((i) => i.id.includes('.pair.'));
    expect(pairItems).toHaveLength(unit.pairs!.length * 2);
    expect(pairItems.every((i) => i.role === 'guide')).toBe(true);
    expect(items.find((i) => i.id === 'move_in.pair.sheep')?.text).toBe('sheep');
    expect(items.find((i) => i.id === 'move_in.line.t1_1')?.role).toBe('landlord');
  });
});

describe('listen-pair questions', () => {
  it('tests both sides of each new pair, after the word pictures and before the chunks', () => {
    for (const task of unit.tasks) {
      const qs = buildTaskPractice(unit, task, makeRng(3));
      const pairs = pairQuestions(qs);
      const pairIds = task.newPairIds ?? [];
      expect(pairs).toHaveLength(pairIds.length * 2);
      if (pairIds.length === 0) continue;
      for (const pairId of pairIds) {
        const forPair = pairs.filter((q) => q.itemId === `pair:${pairId}`);
        expect(forPair.map((q) => q.correctId).sort()).toEqual(
          [...forPair[0]!.options.map((o) => o.id)].sort(),
        );
      }
      const kinds = qs.map((q) => q.kind);
      const wordCount = task.newWordIds.length;
      expect(kinds.indexOf('listen-pair')).toBe(wordCount);
      expect(kinds.lastIndexOf('listen-pair')).toBe(wordCount + pairs.length - 1);
    }
  });

  it('offers exactly the two sides and plays the correct one', () => {
    const qs = pairQuestions(buildTaskPractice(unit, unit.tasks[0]!, makeRng(9)));
    for (const q of qs) {
      expect(q.options).toHaveLength(2);
      expect(q.options.map((o) => o.id)).toContain(q.correctId);
      expect(q.audioId).toBe(`move_in.pair.${q.correctId}`);
      expect(q.focus).not.toBe('');
      for (const o of q.options) expect(o.audioId).toBe(`move_in.pair.${o.id}`);
    }
  });

  it('is deterministic for a seed', () => {
    const a = buildTaskPractice(unit, unit.tasks[1]!, makeRng(42));
    const b = buildTaskPractice(unit, unit.tasks[1]!, makeRng(42));
    expect(a).toEqual(b);
  });

  it('builds one review question per due pair', () => {
    const qs = buildReviewQuestions(unit, ['pair:ship_sheep', 'pair:nope', 'word:key'], makeRng(1));
    expect(qs.map((q) => q.kind)).toEqual(['listen-pair', 'listen-pick']);
    expect(qs[0]!.itemId).toBe('pair:ship_sheep');
  });

  it('names the landlord in choose-reply questions', () => {
    const qs = buildTaskPractice(unit, unit.tasks[0]!, makeRng(1));
    const replies = qs.filter((q) => q.kind === 'choose-reply');
    expect(replies.length).toBeGreaterThan(0);
    for (const q of replies) expect(q.npcRole).toBe('landlord');
  });
});
