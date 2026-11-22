import { describe, expect, it } from 'vitest';
import type { TalkItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkTalks } from '../src/content/checks/talks';
import { validateUnit } from '../src/content/validate';
import { talkQuestions } from '../src/learning/gen/talks';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';

const talk = (over: Partial<TalkItem> = {}): TalkItem => ({
  id: 'k1',
  lines: [
    { id: 'k1_1', role: 'clerk', en: 'Can I help you?', zh: '需要幫忙嗎？' },
    { id: 'k1_2', role: 'friend', en: 'I want to open an account.', zh: '我想開戶。' },
    { id: 'k1_3', role: 'clerk', en: 'Sure. Please sit down.', zh: '好的，請坐。' },
  ],
  questions: [
    {
      en: 'What does the man want?',
      zh: '這位男士想做什麼？',
      options: ['Open an account', 'Buy a ticket', 'See a doctor'],
      answer: 0,
    },
    { en: 'Where are they?', zh: '他們在哪裡？', options: ['At a bank', 'At a park'], answer: 0 },
  ],
  ...over,
});

const context = (): TaskCheckContext => {
  const spaces = new Map<string, Set<string>>();
  return {
    seen: (kind) => spaces.get(kind) ?? spaces.set(kind, new Set()).get(kind)!,
    taughtChunks: new Set(),
    isRole: (value) => value === 'clerk' || value === 'friend' || value === 'guide',
  };
};
const problems = (talks: unknown) => checkTalks({ talks }, context());

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: ['open_account'],
  newWordIds: [],
  scene: [],
  ...over,
});

const unit = (talks: TalkItem[]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks: [{ id: 'open_account', en: 'I want to open an account.', zh: '我想開戶。' }],
  words: [],
  tasks: [task({ talks })],
});

describe('checkTalks (聽對話答題)', () => {
  it('accepts a good talk and a task without talks', () => {
    expect(problems([talk()])).toEqual([]);
    expect(checkTalks({}, context())).toEqual([]);
    expect(validateUnit(unit([talk()]))).toEqual([]);
  });

  it('rejects an empty list, bad or repeated talk ids', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems([talk({ id: 'K1' })])).not.toEqual([]);
    expect(problems([talk(), talk()])).not.toEqual([]);
  });

  it('keeps line ids unique across the unit', () => {
    const other = talk({ id: 'k2' });
    expect(problems([talk(), other])).not.toEqual([]);
    expect(validateUnit(unit([talk(), other]))).not.toEqual([]);
  });

  it('needs 3 to 6 lines by two speakers with known roles', () => {
    const lines = talk().lines;
    expect(problems([talk({ lines: lines.slice(0, 2) })])).not.toEqual([]);
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...lines[i % 2]!, id: `l${i}` }));
    expect(problems([talk({ lines: seven })])).not.toEqual([]);
    const oneSpeaker = lines.map((l) => ({ ...l, role: 'clerk' as const }));
    expect(problems([talk({ lines: oneSpeaker })])).not.toEqual([]);
    const three = [...lines.slice(0, 2), { ...lines[2]!, role: 'guide' as const }];
    expect(problems([talk({ lines: three })])).not.toEqual([]);
    expect(
      problems([{ ...talk(), lines: [{ ...lines[0], role: 'mayor' }, ...lines.slice(1)] }]),
    ).not.toEqual([]);
    expect(problems([talk({ lines: [{ ...lines[0]!, zh: '' }, ...lines.slice(1)] })])).not.toEqual(
      [],
    );
  });

  it('needs 1 to 3 good questions', () => {
    const q = talk().questions[0]!;
    expect(problems([talk({ questions: [] })])).not.toEqual([]);
    expect(problems([talk({ questions: [q, q, q, q] })])).not.toEqual([]);
    expect(problems([talk({ questions: [{ ...q, answer: 5 }] })])).not.toEqual([]);
    expect(
      problems([talk({ questions: [{ ...q, options: ['a', 'b', 'c', 'd', 'e'] }] })]),
    ).not.toEqual([]);
  });
});

describe('talkQuestions', () => {
  it('makes one question per question on the talk, in order, each with every line and its clip', () => {
    const questions = talkQuestions(unit([talk()]), task({ talks: [talk()] }), makeRng(1));
    expect(questions.map((q) => [q.index, q.total, q.en])).toEqual([
      [0, 2, 'What does the man want?'],
      [1, 2, 'Where are they?'],
    ]);
    for (const q of questions) {
      expect(q).toMatchObject({ kind: 'talk', talkId: 'k1', itemId: NO_ITEM });
      expect(q.lines.map((l) => [l.audioId, l.role])).toEqual([
        ['u.talk.k1_1', 'clerk'],
        ['u.talk.k1_2', 'friend'],
        ['u.talk.k1_3', 'clerk'],
      ]);
    }
    expect(questions[0]?.options.find((o) => o.id === questions[0]?.correctId)?.label).toBe(
      'Open an account',
    );
  });

  it('comes in the task practice before arranging, questions on one talk together', () => {
    const kinds = buildTaskPractice(unit([talk()]), task({ talks: [talk()] }), makeRng(1)).map(
      (q) => q.kind,
    );
    const first = kinds.indexOf('talk');
    expect(kinds.slice(first, first + 2)).toEqual(['talk', 'talk']);
    expect(first).toBeLessThan(kinds.indexOf('arrange'));
  });
});
