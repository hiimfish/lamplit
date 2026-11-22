import { describe, expect, it } from 'vitest';
import type { PassageItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkPassages, PASSAGE_MAX_WORDS } from '../src/content/checks/passages';
import { validateUnit } from '../src/content/validate';
import { passageQuestions } from '../src/learning/gen/passages';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';

const passage = (over: Partial<PassageItem> = {}): PassageItem => ({
  id: 'p1',
  kind: 'notice',
  title: 'Job Fair',
  lines: ['Come to the job fair on Monday.', 'It starts at 10 a.m.'],
  questions: [
    {
      en: 'When is the job fair?',
      zh: '就業博覽會是哪天？',
      options: ['Monday', 'Friday'],
      answer: 0,
    },
    {
      en: 'When does it start?',
      zh: '幾點開始？',
      options: ['9 a.m.', '10 a.m.', '11 a.m.'],
      answer: 1,
    },
  ],
  ...over,
});

const context = (): TaskCheckContext => {
  const spaces = new Map<string, Set<string>>();
  return {
    seen: (kind) => spaces.get(kind) ?? spaces.set(kind, new Set()).get(kind)!,
    taughtChunks: new Set(),
    isRole: () => true,
  };
};
const problems = (passages: unknown) => checkPassages({ passages }, context());

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: ['go_fair'],
  newWordIds: [],
  scene: [],
  ...over,
});

const unit = (passages: PassageItem[]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks: [{ id: 'go_fair', en: 'Let us go to the fair.', zh: '我們去博覽會吧。' }],
  words: [],
  tasks: [task({ passages })],
});

describe('checkPassages (讀短文)', () => {
  it('accepts a good passage and a task without passages', () => {
    expect(problems([passage()])).toEqual([]);
    expect(problems([passage({ title: undefined, kind: 'email' })])).toEqual([]);
    expect(checkPassages({}, context())).toEqual([]);
    expect(validateUnit(unit([passage()]))).toEqual([]);
  });

  it('rejects an empty list, bad or repeated ids and bad kinds', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems([passage({ id: 'Job-Fair' })])).not.toEqual([]);
    expect(problems([passage(), passage()])).not.toEqual([]);
    expect(problems([{ ...passage(), kind: 'poem' }])).not.toEqual([]);
    expect(problems([passage({ title: '' })])).not.toEqual([]);
  });

  it(`needs lines, at most ${PASSAGE_MAX_WORDS} words with the title`, () => {
    expect(problems([passage({ lines: [] })])).not.toEqual([]);
    expect(problems([passage({ lines: ['ok', ''] })])).not.toEqual([]);
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    expect(problems([passage({ title: 'Job Fair', lines: [words(78)] })])).toEqual([]);
    expect(problems([passage({ title: 'Job Fair', lines: [words(79)] })])).not.toEqual([]);
  });

  it('needs 1 to 3 good questions', () => {
    const q = passage().questions[0]!;
    expect(problems([passage({ questions: [] })])).not.toEqual([]);
    expect(problems([passage({ questions: [q, q, q, q] })])).not.toEqual([]);
    expect(problems([passage({ questions: [{ ...q, zh: '' }] })])).not.toEqual([]);
    expect(problems([passage({ questions: [{ ...q, options: ['Monday'] }] })])).not.toEqual([]);
    expect(problems([passage({ questions: [{ ...q, options: ['a', 'A'] }] })])).not.toEqual([]);
    expect(problems([passage({ questions: [{ ...q, answer: 2 }] })])).not.toEqual([]);
  });
});

describe('passageQuestions', () => {
  it('makes one question per question on the passage, in order, each with the whole text', () => {
    const questions = passageQuestions(task({ passages: [passage()] }), makeRng(1));
    expect(questions).toHaveLength(2);
    expect(questions.map((q) => [q.index, q.total, q.en])).toEqual([
      [0, 2, 'When is the job fair?'],
      [1, 2, 'When does it start?'],
    ]);
    for (const q of questions) {
      expect(q).toMatchObject({
        kind: 'read-passage',
        passageId: 'p1',
        passageKind: 'notice',
        title: 'Job Fair',
        lines: passage().lines,
        itemId: NO_ITEM,
      });
    }
    expect(questions[1]?.options.find((o) => o.id === questions[1]?.correctId)?.label).toBe(
      '10 a.m.',
    );
  });

  it('comes in the task practice before arranging, questions on one passage together', () => {
    const passages = [passage(), passage({ id: 'p2' })];
    const kinds = buildTaskPractice(unit(passages), task({ passages }), makeRng(1)).map(
      (q) => q.kind,
    );
    const first = kinds.indexOf('read-passage');
    expect(kinds.slice(first, first + 4)).toEqual(Array(4).fill('read-passage'));
    expect(first).toBeLessThan(kinds.indexOf('arrange'));
  });
});
