import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import type { Unit } from '../src/content/types';
import { buildReviewQuestions, buildTaskPractice, makeRng } from '../src/learning/questionGen';
import type { Question } from '../src/learning/questions';

const unit = cafe as Unit;

function optionIds(q: Question): string[] {
  if (q.kind === 'listen-pick' || q.kind === 'choose-reply') return q.options.map((o) => o.id);
  return [];
}

describe('makeRng', () => {
  it('is deterministic and in [0,1)', () => {
    const a = makeRng(7);
    const b = makeRng(7);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('buildTaskPractice', () => {
  it('orders word listen-pick, chunk listen-pick, reply, arrange, speak', () => {
    const task = unit.tasks[0]!;
    const kinds = buildTaskPractice(unit, task, makeRng(1)).map((q) => q.kind);
    expect(kinds).toEqual([
      'listen-pick',
      'listen-pick',
      'listen-pick',
      'listen-pick',
      'choose-reply',
      'arrange',
      'speak',
    ]);
  });

  it('has choose-reply only for player lines after an npc line', () => {
    const t1 = buildTaskPractice(unit, unit.tasks[0]!, makeRng(2));
    expect(t1.filter((q) => q.kind === 'choose-reply')).toHaveLength(1);
    const t3 = buildTaskPractice(unit, unit.tasks[2]!, makeRng(2));
    // t3_1 has no preceding line; t3_3 follows an npc line.
    expect(t3.filter((q) => q.kind === 'choose-reply')).toHaveLength(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('keeps options valid (seed %i)', (seed) => {
    for (const task of unit.tasks) {
      for (const q of buildTaskPractice(unit, task, makeRng(seed))) {
        if (q.kind === 'listen-pick' || q.kind === 'choose-reply') {
          const ids = optionIds(q);
          expect(ids.length).toBeGreaterThanOrEqual(2);
          expect(new Set(ids).size).toBe(ids.length);
          expect(ids.filter((id) => id === q.correctId)).toHaveLength(1);
          const labels = q.options.map((o) => ('label' in o ? o.label : o.text).toLowerCase());
          expect(new Set(labels).size).toBe(labels.length);
        }
        if (q.kind === 'arrange') {
          expect(q.blocks.join(' ')).not.toBe(q.accepted[0]);
          expect([...q.blocks].sort()).toEqual([...q.accepted[0]!.split(' ')].sort());
        }
      }
    }
  });

  it('uses expected audio ids and item ids', () => {
    const qs = buildTaskPractice(unit, unit.tasks[0]!, makeRng(3));
    const first = qs[0]!;
    expect(first.kind === 'listen-pick' && first.audioId).toBe('cafe.word.latte');
    expect(first.itemId).toBe('word:latte');
    const speak = qs[qs.length - 1]!;
    expect(speak.kind === 'speak' && speak.audioId).toBe('cafe.chunk.can_i_get');
    expect(speak.itemId).toBe('chunk:can_i_get');
  });

  it('skips a player line with no (or an unknown) chunkId instead of inventing an item', () => {
    const task = unit.tasks[0]!;
    for (const chunkId of [undefined, 'nope']) {
      const scene = task.scene.map((line) =>
        line.speaker === 'player' ? { ...line, chunkId } : line,
      );
      const qs = buildTaskPractice(unit, { ...task, scene }, makeRng(5));
      expect(qs.filter((q) => q.kind === 'choose-reply')).toHaveLength(0);
      expect(qs.some((q) => q.itemId.startsWith('chunk:t1_') || q.itemId === 'chunk:nope')).toBe(
        false,
      );
    }
  });

  it('tags wrong replies with an error', () => {
    const reply = buildTaskPractice(unit, unit.tasks[0]!, makeRng(4)).find(
      (q) => q.kind === 'choose-reply',
    );
    expect(reply?.kind === 'choose-reply' && reply.options.filter((o) => o.error)).toHaveLength(2);
  });
});

describe('buildReviewQuestions', () => {
  it('builds for known ids and ignores unknown ones', () => {
    const qs = buildReviewQuestions(
      unit,
      ['chunk:to_go', 'word:tea', 'chunk:nope', 'word:zzz', 'junk'],
      makeRng(9),
    );
    expect(qs).toHaveLength(2);
    expect(qs.map((q) => q.itemId)).toEqual(['chunk:to_go', 'word:tea']);
    expect(qs.every((q) => q.kind === 'listen-pick' || q.kind === 'arrange')).toBe(true);
  });
});
