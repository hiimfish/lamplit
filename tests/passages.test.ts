import { describe, expect, it } from 'vitest';
import type {
  PassageItem,
  PassageKind,
  PassageSet,
  PassageSetQuestion,
  PassageText,
  SinglePassage,
  Task,
  Unit,
} from '../src/content/types';
import { questionTexts } from '../src/content/vocab';
import type { TaskCheckContext } from '../src/content/checks/common';
import {
  checkPassages,
  PASSAGE_KINDS,
  PASSAGE_MAX_WORDS,
  PASSAGE_MIN_WORDS,
} from '../src/content/checks/passages';
import { validateUnit } from '../src/content/validate';
import { findAnswerLine, passageQuestions } from '../src/learning/gen/passages';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import { docNames, docTabs, PASSAGE_KIND_ZH } from '../src/ui/minigames/ReadPassage';

const passage = (over: Partial<SinglePassage> = {}): SinglePassage => ({
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

  it('allows up to 160 words from Act 3 on', () => {
    const inAct = (act: number, p: PassageItem) =>
      checkPassages({ passages: [p] }, { ...context(), act }).join('\n');
    expect(inAct(3, passage({ lines: [words(78), words(80)] }))).toBe('');
    expect(inAct(3, passage({ lines: [words(78), words(81)] }))).toMatch(/161 words .*max 160/);
    expect(inAct(2, passage({ lines: [words(38), words(41)] }))).toMatch(/max 80/);
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

describe('Act 4 passages: longer single texts and 兩篇／三篇一組 sets', () => {
  const act4 = (): TaskCheckContext => ({ ...context(), act: 4 });
  const inAct4 = (p: unknown) => checkPassages({ passages: [p] }, act4());
  const q = (en: string, needs?: number[]): PassageSetQuestion => ({
    en,
    zh: '問題',
    options: ['Monday', 'Friday', 'Sunday', 'Tuesday'],
    answer: 0,
    ...(needs ? { needs } : {}),
  });
  const threeQuestions = [q('One?'), q('Two?'), q('Three?')];
  /** A text of `n` words in two lines, no title. */
  const text = (n: number, kind: PassageKind = 'notice'): PassageText => ({
    kind,
    lines: [words(n - Math.floor(n / 2)), words(Math.floor(n / 2))],
  });
  const double = (over: Partial<PassageSet> = {}): PassageSet => ({
    id: 's1',
    texts: [text(100), text(100)],
    questions: [q('One?'), q('Two?'), q('Three?', [0, 1]), q('Four?')],
    ...over,
  });
  const triple = (over: Partial<PassageSet> = {}): PassageSet => ({
    id: 's2',
    texts: [text(80), text(80), text(80)],
    questions: [q('One?', [0, 2]), q('Two?'), q('Three?', [1, 2]), q('Four?', [1])],
    ...over,
  });

  it('needs 150 to 300 words and exactly 3 questions in a single text', () => {
    const single = (n: number) => passage({ title: undefined, lines: [words(n - 50), words(50)] });
    expect(inAct4({ ...single(150), questions: threeQuestions })).toEqual([]);
    expect(inAct4({ ...single(300), questions: threeQuestions })).toEqual([]);
    expect(inAct4({ ...single(149), questions: threeQuestions })).toEqual([
      expect.stringContaining('149 words with the title (min 150 in Act 4)'),
    ]);
    expect(inAct4({ ...single(301), questions: threeQuestions })).toEqual([
      expect.stringContaining('301 words with the title (max 300)'),
    ]);
    expect(inAct4({ ...single(200), questions: threeQuestions.slice(0, 2) })).toEqual([
      expect.stringContaining('exactly 3 questions in Act 4'),
    ]);
    // Acts 1 to 3 keep their limits.
    expect(checkPassages({ passages: [single(200)] }, { ...context(), act: 3 })).toEqual([
      expect.stringContaining('max 160'),
    ]);
  });

  it('accepts a double set and a triple set', () => {
    expect(inAct4(double())).toEqual([]);
    expect(inAct4(triple())).toEqual([]);
    expect(inAct4(triple({ questions: [...triple().questions, q('Five?')] }))).toEqual([]);
    expect(inAct4(double({ texts: [text(90, 'email'), text(90)] }))).toEqual([
      expect.stringContaining('text 1 is an email and needs a title'),
    ]);
  });

  it('keeps sets out of Acts 1 to 3', () => {
    expect(checkPassages({ passages: [double()] }, { ...context(), act: 3 })).toEqual([
      expect.stringContaining('passage set (texts), which is for Act 4 units only'),
    ]);
  });

  it('counts the words of every text and title together', () => {
    expect(inAct4(double({ texts: [text(90), text(89)] }))).toEqual([
      expect.stringContaining('179 words in all with the titles; a double set has 180 to 260'),
    ]);
    expect(inAct4(double({ texts: [text(130), text(131)] }))).toEqual([
      expect.stringContaining('261 words'),
    ]);
    expect(inAct4(triple({ texts: [text(100), text(100), text(120)] }))).toEqual([]);
    expect(inAct4(triple({ texts: [text(100), text(100), text(121)] }))).toEqual([
      expect.stringContaining('321 words in all with the titles; a triple set has 180 to 320'),
    ]);
    const titled = { ...text(88), title: 'Two words' };
    expect(inAct4(double({ texts: [titled, text(90)] }))).toEqual([]);
  });

  it('needs 2 or 3 texts, each a real text', () => {
    expect(inAct4(double({ texts: [text(200)] }))[0]).toContain('a list of 2 or 3 texts');
    expect(inAct4({ ...double(), texts: [text(100), 'text'] })).toContainEqual(
      expect.stringContaining('text 2 must be an object'),
    );
    expect(
      inAct4(double({ texts: [text(170), { kind: 'notice', lines: ['Short one.', 'Ok.'] }] })),
    ).toContainEqual(expect.stringContaining('text 2 has 3 words with the title (min 15)'));
    expect(inAct4({ ...double(), title: 'Set' })).toEqual([
      expect.stringContaining('unknown field "title"'),
    ]);
  });

  it('needs 4 questions in a double set and 4 or 5 in a triple set', () => {
    expect(inAct4(double({ questions: double().questions.slice(0, 3) }))).toEqual([
      expect.stringContaining('double set and needs exactly 4 questions'),
    ]);
    const six = [...triple().questions, q('Five?'), q('Six?')];
    expect(inAct4(triple({ questions: six }))).toEqual([
      expect.stringContaining('triple set and needs 4 to 5 questions'),
    ]);
  });

  it('needs questions that need more than one text: 1 in a double set, 2 in a triple', () => {
    const plain = [q('One?'), q('Two?'), q('Three?', [1]), q('Four?')];
    expect(inAct4(double({ questions: plain }))).toEqual([
      expect.stringContaining(
        'has 0 question(s) that need more than one text; a double set needs at least 1',
      ),
    ]);
    const one = [q('One?', [0, 1, 2]), q('Two?'), q('Three?'), q('Four?')];
    expect(inAct4(triple({ questions: one }))).toEqual([
      expect.stringContaining(
        'has 1 question(s) that need more than one text; a triple set needs at least 2',
      ),
    ]);
  });

  it('rejects bad "needs", and "needs" on a single passage', () => {
    for (const needs of [[], [0, 0], [0, 2], [-1, 1], 'both']) {
      const bad = {
        ...double(),
        questions: [q('One?'), q('Two?', [0, 1]), q('Three?'), { ...q('Four?'), needs }],
      };
      expect(inAct4(bad), JSON.stringify(needs)).toEqual([
        expect.stringContaining('question 4 has bad "needs"'),
      ]);
    }
    expect(problems([{ ...passage(), questions: [q('One?', [0, 1])] }]).join()).toMatch(
      /"needs", which only a passage set has/,
    );
  });

  it('makes one question per set question, each with every text', () => {
    const set = double({
      texts: [
        { kind: 'notice', title: 'Cost Report', lines: [words(90), 'Travel was $9,600.'] },
        { kind: 'email', title: 'A mistake', lines: [words(90), 'It was counted twice.'] },
      ],
      questions: [
        {
          en: 'How much was travel?',
          zh: '差旅費多少？',
          options: ['$9,600', '$7,800'],
          answer: 0,
        },
        {
          en: 'What was wrong?',
          zh: '哪裡錯了？',
          options: ['counted twice', 'too low'],
          answer: 0,
          needs: [1, 0],
        },
      ],
    });
    const qs = passageQuestions(task({ passages: [set] }), makeRng(1));
    expect(qs).toHaveLength(2);
    expect(qs[0]).toMatchObject({
      kind: 'read-passage',
      passageId: 's1',
      passageKind: 'notice',
      title: 'Cost Report',
      index: 0,
      total: 2,
      answerText: 0,
      answerLine: 1,
    });
    expect(qs[0]?.texts?.map((t) => [t.passageKind, t.title])).toEqual([
      ['notice', 'Cost Report'],
      ['email', 'A mistake'],
    ]);
    expect(qs[0]).not.toHaveProperty('needs');
    expect(qs[1]).toMatchObject({ needs: [1, 0], answerText: 1, answerLine: 1 });
    // A single passage carries no texts.
    expect(passageQuestions(task({ passages: [passage()] }), makeRng(1))[0]).not.toHaveProperty(
      'texts',
    );
  });

  it('takes every text of a set into questionTexts', () => {
    const set = double({
      texts: [
        { kind: 'notice', title: 'Report', lines: ['One line.', 'Two lines.'] },
        { kind: 'email', title: 'Mail', lines: ['Three.', 'Four.'] },
      ],
      questions: [q('Which?', [0, 1])],
    });
    expect(questionTexts(task({ passages: [set] })).map((l) => l.en)).toEqual([
      'Report',
      'One line.',
      'Two lines.',
      'Mail',
      'Three.',
      'Four.',
      'Which?',
      'Monday',
      'Friday',
      'Sunday',
      'Tuesday',
    ]);
  });
});

describe('the passage set screen (ReadPassage tabs)', () => {
  it('names every kind of text in Chinese', () => {
    for (const kind of PASSAGE_KINDS) {
      expect(PASSAGE_KIND_ZH[kind as PassageKind], kind).toMatch(/^\p{Script=Han}{2}$/u);
    }
  });

  it('makes one tab per text, marking the texts the question needs', () => {
    const texts = (['notice', 'email', 'form'] as const).map((passageKind) => ({
      passageKind,
      lines: ['One.', 'Two.'],
    }));
    expect(docTabs({ texts, needs: [2, 0] })).toEqual([
      { name: '文件 1', kindZh: '公告', needed: true },
      { name: '文件 2', kindZh: '郵件', needed: false },
      { name: '文件 3', kindZh: '表格', needed: true },
    ]);
    expect(docTabs({ texts: texts.slice(0, 2) }).map((t) => t.needed)).toEqual([false, false]);
    // A single passage has no tabs.
    expect(docTabs({})).toEqual([]);
  });

  it('names the needed texts for the feedback, in reading order', () => {
    expect(docNames([1])).toBe('文件 2');
    expect(docNames([1, 0])).toBe('文件 1 和文件 2');
    expect(docNames([2, 0, 1])).toBe('文件 1、文件 2 和文件 3');
    expect(docNames([])).toBe('');
  });

  it('gives a set question the text that holds its answer, and its needed tabs', () => {
    const set: PassageSet = {
      id: 's1',
      texts: [
        { kind: 'notice', title: 'Cost Report', lines: [words(90), 'Travel was $9,600.'] },
        { kind: 'email', title: 'A mistake', lines: [words(90), 'Travel was $7,800.'] },
      ],
      questions: [
        {
          en: 'What should travel be?',
          zh: '差旅費應該是多少？',
          options: ['$9,600', '$7,800'],
          answer: 1,
          needs: [0, 1],
        },
      ],
    };
    const [question] = passageQuestions(task({ passages: [set] }), makeRng(1));
    expect(question).toMatchObject({ answerText: 1, answerLine: 1 });
    expect(docTabs(question!).map((t) => t.needed)).toEqual([true, true]);
  });
});
