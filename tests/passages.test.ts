import { describe, expect, it } from 'vitest';
import type { PassageItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import {
  checkPassages,
  PASSAGE_MAX_WORDS,
  PASSAGE_MIN_WORDS,
} from '../src/content/checks/passages';
import { validateUnit } from '../src/content/validate';
import { findAnswerLine, passageQuestions } from '../src/learning/gen/passages';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';

const passage = (over: Partial<PassageItem> = {}): PassageItem => ({
  id: 'p1',
  kind: 'notice',
  title: 'Job Fair',
  lines: [
    'Come to the job fair on Monday at the Job Center.',
    'It starts at 10 a.m. and it is free.',
  ],
  questions: [
    {
      en: 'When is the job fair?',
      zh: '就業博覽會是哪天？',
      options: ['Monday', 'Friday', 'Sunday'],
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
/** The problems of one passage, as one string to match against. */
const said = (p: unknown) => problems([p]).join('\n');

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

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('checkPassages (讀短文)', () => {
  it('accepts good passages of every kind and a task without passages', () => {
    expect(problems([passage()])).toEqual([]);
    for (const kind of ['message', 'flyer', 'notice', 'ad', 'form', 'email'] as const) {
      expect(problems([passage({ kind })])).toEqual([]);
    }
    expect(problems([passage({ title: undefined, kind: 'flyer' })])).toEqual([]);
    expect(problems([passage(), passage({ id: 'p2' })])).toEqual([]);
    expect(checkPassages({}, context())).toEqual([]);
    expect(validateUnit(unit([passage()]))).toEqual([]);
  });

  it('rejects an empty list and more than 2 passages in a task', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems('nope')).not.toEqual([]);
    const three = [passage(), passage({ id: 'p2' }), passage({ id: 'p3' })];
    expect(problems(three).join()).toMatch(/3 passages \(at most 2\)/);
  });

  it('rejects bad or repeated ids, also across tasks of a unit', () => {
    expect(said(passage({ id: 'Job-Fair' }))).toMatch(/bad id/);
    expect(problems([passage(), passage()]).join()).toMatch(/duplicate id/);
    const ctx = context();
    expect(checkPassages({ passages: [passage()] }, ctx)).toEqual([]);
    expect(checkPassages({ passages: [passage()] }, ctx).join()).toMatch(/duplicate id/);
  });

  it('rejects a bad kind, naming the good ones', () => {
    expect(said({ ...passage(), kind: 'poem' })).toMatch(/bad kind "poem".*message, flyer/);
    expect(said({ ...passage(), kind: undefined })).toMatch(/bad kind/);
  });

  it('rejects an empty title, and a message or email without one', () => {
    expect(said(passage({ title: '' }))).toMatch(/empty title/);
    expect(said(passage({ title: '   ' }))).toMatch(/empty title/);
    expect(said({ ...passage(), title: 3 })).toMatch(/empty title/);
    expect(said(passage({ title: undefined, kind: 'message' }))).toMatch(
      /needs a title: the sender/,
    );
    expect(said(passage({ title: undefined, kind: 'email' }))).toMatch(
      /needs a title: the subject/,
    );
  });

  it('needs at least 2 lines, each real text', () => {
    expect(said(passage({ lines: [] }))).toMatch(/at least 2 lines/);
    expect(
      said(passage({ lines: ['Come to the job fair on Monday at ten in the morning.'] })),
    ).toMatch(/at least 2 lines/);
    expect(said({ ...passage(), lines: 'Come on Monday.' })).toMatch(/at least 2 lines/);
    const good = passage().lines[0]!;
    expect(said(passage({ lines: [good, ''] }))).toMatch(/line 2 is empty/);
    expect(said(passage({ lines: ['  ', good] }))).toMatch(/line 1 is empty/);
    expect(said({ ...passage(), lines: [good, 7] })).toMatch(/line 2 is empty or not text/);
  });

  it(`needs ${PASSAGE_MIN_WORDS} to ${PASSAGE_MAX_WORDS} words with the title`, () => {
    // "Job Fair" is 2 words.
    expect(problems([passage({ lines: [words(38), words(40)] })])).toEqual([]);
    expect(said(passage({ lines: [words(38), words(41)] }))).toMatch(/81 words .*max 80/);
    expect(problems([passage({ lines: [words(6), words(7)] })])).toEqual([]);
    expect(said(passage({ lines: [words(6), words(6)] }))).toMatch(/14 words .*min 15/);
    expect(said(passage({ title: undefined, lines: [words(7), words(7)] }))).toMatch(/14 words/);
  });

  it('needs 1 to 3 good, different questions', () => {
    const q = passage().questions[0]!;
    const other = passage().questions[1]!;
    const third = {
      ...q,
      en: 'Where is the job fair?',
      options: ['At the Job Center', 'At the bank'],
    };
    expect(problems([passage({ questions: [q, other, third] })])).toEqual([]);
    expect(problems([passage({ questions: [{ ...q, options: ['a', 'b', 'c', 'd'] }] })])).toEqual(
      [],
    );
    expect(said(passage({ questions: [] }))).toMatch(/1 to 3 questions/);
    expect(said({ ...passage(), questions: undefined })).toMatch(/1 to 3 questions/);
    expect(said(passage({ questions: [q, other, third, q] }))).toMatch(/1 to 3 questions/);
    expect(said(passage({ questions: [{ ...q, zh: '' }] }))).toMatch(/question 1 needs en and zh/);
    expect(said(passage({ questions: [{ ...q, options: ['Monday'] }] }))).toMatch(/2 to 4/);
    expect(said(passage({ questions: [{ ...q, options: ['a', 'b', 'c', 'd', 'e'] }] }))).toMatch(
      /2 to 4/,
    );
    expect(said(passage({ questions: [{ ...q, options: ['a', 'A'] }] }))).toMatch(/2 to 4/);
    expect(said(passage({ questions: [{ ...q, answer: 3 }] }))).toMatch(/bad answer/);
    expect(said(passage({ questions: [q, { ...other, en: 'WHEN is the job fair? ' }] }))).toMatch(
      /question 2 asks the same as question 1/,
    );
  });

  it('reports the task through validateUnit', () => {
    const report = validateUnit(unit([passage({ kind: 'email', title: undefined })]));
    expect(report.join()).toMatch(/task "t1" passage "p1" is an email and needs a title/);
  });
});

describe('findAnswerLine', () => {
  const lines = ['Story Time for Kids: April and May.', 'Ask the Mayor at 10:00.', 'Total $520.'];

  it('finds the first line with the answer as whole words, ignoring case and spaces', () => {
    expect(findAnswerLine(lines, 'may')).toBe(0);
    expect(findAnswerLine(lines, ' april  and MAY ')).toBe(0);
    expect(findAnswerLine(lines, '$520')).toBe(2);
    expect(findAnswerLine(lines, '10:00')).toBe(1);
    expect(findAnswerLine(['The Mayor came.', 'In May.'], 'May')).toBe(1);
  });

  it('finds nothing rather than guess', () => {
    expect(findAnswerLine(lines, 'June')).toBe(-1);
    expect(findAnswerLine(lines, 'Mayo')).toBe(-1);
    expect(findAnswerLine(lines, '52')).toBe(-1);
    expect(findAnswerLine(lines, '')).toBe(-1);
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

  it('marks the line that holds the answer, or none', () => {
    const [first, second] = passageQuestions(task({ passages: [passage()] }), makeRng(1));
    expect(first?.answerLine).toBe(0);
    expect(second?.answerLine).toBe(1);
    const q = { en: 'Is it free?', zh: '免費嗎？', options: ['Yes', 'No'], answer: 0 };
    const [none] = passageQuestions(task({ passages: [passage({ questions: [q] })] }), makeRng(1));
    expect(none).not.toHaveProperty('answerLine');
  });

  it('leaves out a missing title', () => {
    const [q] = passageQuestions(
      task({ passages: [passage({ title: undefined, kind: 'flyer' })] }),
      makeRng(1),
    );
    expect(q).not.toHaveProperty('title');
  });

  it('is deterministic for a seed and shuffles the options', () => {
    const many = passage({
      questions: [{ en: 'Which?', zh: '哪個？', options: ['a', 'b', 'c', 'd'], answer: 2 }],
    });
    const run = (seed: number) => passageQuestions(task({ passages: [many] }), makeRng(seed));
    expect(run(7)).toEqual(run(7));
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) =>
        run(s)[0]!
          .options.map((o) => o.label)
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
    for (let s = 0; s < 20; s++) {
      const q = run(s)[0]!;
      expect(q.options.find((o) => o.id === q.correctId)?.label).toBe('c');
    }
  });

  it('comes in the task practice before arranging, questions on one passage together', () => {
    const passages = [passage(), passage({ id: 'p2' })];
    const questions = buildTaskPractice(unit(passages), task({ passages }), makeRng(1));
    const reads = questions.filter((q) => q.kind === 'read-passage');
    const first = questions.findIndex((q) => q.kind === 'read-passage');
    expect(questions.slice(first, first + 4).map((q) => q.kind)).toEqual(
      Array(4).fill('read-passage'),
    );
    expect(reads.map((q) => (q.kind === 'read-passage' ? [q.passageId, q.index] : []))).toEqual([
      ['p1', 0],
      ['p1', 1],
      ['p2', 0],
      ['p2', 1],
    ]);
    expect(first).toBeLessThan(questions.findIndex((q) => q.kind === 'arrange'));
  });
});
