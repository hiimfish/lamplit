import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Chunk, FillItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkFillChunks, checkFills, filledSentence } from '../src/content/checks/fills';
import { validateUnit } from '../src/content/validate';
import { fillQuestions } from '../src/learning/gen/fills';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import { fillPrompt } from '../src/ui/minigames/Fill';

const fill = (over: Partial<FillItem> = {}): FillItem => ({
  id: 'f1',
  en: 'I ___ a new job.',
  zh: '我需要一份新工作。',
  options: ['need', 'needs', 'needing'],
  answer: 0,
  ...over,
});

const context = (): TaskCheckContext => {
  const spaces = new Map<string, Set<string>>();
  return {
    seen: (kind) => spaces.get(kind) ?? spaces.set(kind, new Set()).get(kind)!,
    taughtChunks: new Set(['need_job']),
    isRole: (value) => value === 'clerk' || value === 'guide',
  };
};
const problems = (fills: unknown) => checkFills({ fills }, context());
/** Problems for one fill changed by `over`. */
const one = (over: Partial<FillItem> | Record<string, unknown>) =>
  problems([{ ...fill(), ...over }]);

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: ['need_job'],
  newWordIds: [],
  scene: [],
  ...over,
});

const needJob: Chunk = {
  id: 'need_job',
  en: 'I need a new job.',
  zh: '我需要一份新工作。',
  accept: ['I need a new job'],
};

const unit = (fills: FillItem[], chunks: Chunk[] = [needJob]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks,
  words: [],
  tasks: [task({ fills })],
});

describe('checkFills (句子填空)', () => {
  it('accepts a good fill and a task without fills', () => {
    expect(problems([fill()])).toEqual([]);
    expect(problems([fill({ note: '主詞是 I，動詞用原形。', chunkId: 'need_job' })])).toEqual([]);
    expect(checkFills({}, context())).toEqual([]);
    expect(validateUnit(unit([fill()]))).toEqual([]);
  });

  it('accepts a blank before punctuation, at the start, and four options', () => {
    expect(one({ en: 'This is the job I ___.', options: ['need', 'needs', 'want to'] })).toEqual(
      [],
    );
    expect(one({ en: '___ I help you?', options: ['Can', 'Am', 'Does'] })).toEqual([]);
    expect(one({ options: ['need', 'needs', 'needing', 'to need'] })).toEqual([]);
    expect(one({ en: 'It costs $___ a month.', options: ['15', 'fifteen', 'a'] })).toEqual([]);
  });

  it('rejects an empty list, a non-list, a non-object, bad or repeated ids', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems('f1')).not.toEqual([]);
    expect(problems(['f1'])).toEqual(['fill 1 must be an object']);
    expect(problems([fill({ id: 'F 1' })])).not.toEqual([]);
    expect(problems([fill(), fill()])).toEqual(['fill "f1" has a duplicate id']);
    expect(validateUnit(unit([fill(), fill({ en: 'She ___ a job.' })]))).not.toEqual([]);
  });

  it('allows at most 4 fills in a task', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => fill({ id: `f${i}` }));
    expect(problems(many(4))).toEqual([]);
    expect(problems(many(5))).toEqual(['has 5 fills; at most 4 in one task']);
  });

  it('needs the blank exactly once, written as three underscores', () => {
    expect(one({ en: 'I need a new job.' })).not.toEqual([]);
    expect(one({ en: 'I ___ a ___ job.' })).not.toEqual([]);
    expect(one({ en: 'I ____ a new job.' })).not.toEqual([]);
    expect(one({ en: 'I __ a new job.' })).not.toEqual([]);
    expect(one({ en: '' })).not.toEqual([]);
    expect(one({ en: 7 })).not.toEqual([]);
  });

  it('needs a sentence that reads as one sentence with the answer in', () => {
    const msg = (en: string) => one({ en }).join(' ');
    expect(msg('I  ___ a new job.')).toMatch(/two spaces/);
    expect(msg('I ___  a new job.')).toMatch(/two spaces/);
    expect(msg(' I ___ a new job.')).toMatch(/space at the start or end/);
    expect(msg('I ___ a new job. ')).toMatch(/space at the start or end/);
    expect(msg('I need a new ___ .')).toMatch(/space before a punctuation/);
    expect(msg('I ___a new job.')).toMatch(/glued/);
    expect(msg('I need a new job___.')).toMatch(/glued/);
    expect(msg("I ___'s a new job.")).toMatch(/glued/);
  });

  it('needs a capital letter on every option when the blank starts the sentence', () => {
    expect(one({ en: '___ I help you?', options: ['Can', 'am', 'Does'] }).join(' ')).toMatch(
      /option 2 "am" starts the sentence/,
    );
  });

  it('needs 3 or 4 trimmed, different options and an answer among them', () => {
    expect(one({ options: ['need', 'needs'] })).toEqual(['fill "f1" needs 3 or 4 options']);
    expect(one({ options: ['a', 'b', 'c', 'd', 'e'] })).not.toEqual([]);
    expect(one({ options: 'need' })).not.toEqual([]);
    expect(one({ options: ['need', 'Need', 'needs'] }).join(' ')).toMatch(/ignoring case/);
    expect(one({ options: ['need', ' needs', 'needing'] }).join(' ')).toMatch(/option 2/);
    expect(one({ options: ['need', 'needs ', 'needing'] })).not.toEqual([]);
    expect(one({ options: ['need', '', 'needing'] })).not.toEqual([]);
    expect(one({ options: ['need', 3, 'needing'] })).not.toEqual([]);
    expect(one({ options: ['need', 'a ___', 'needing'] }).join(' ')).toMatch(/must not contain/);
    expect(one({ options: ['need', 'to  need', 'needing'] }).join(' ')).toMatch(/two spaces/);
    expect(one({ answer: 3 }).join(' ')).toMatch(/answer must be the index/);
    expect(one({ answer: -1 })).not.toEqual([]);
    expect(one({ answer: 0.5 })).not.toEqual([]);
    expect(one({ answer: '0' })).not.toEqual([]);
  });

  it('keeps options and the sentence short enough for the screen', () => {
    expect(one({ options: ['need', 'really need it', 'want'] })).toEqual([]);
    expect(one({ options: ['need', 'really need it now', 'want'] }).join(' ')).toMatch(
      /longer than 3 words/,
    );
    expect(one({ options: ['need', 'applicationsforms', 'want'] })).toEqual([]);
    expect(one({ options: ['need', 'applicationsformsxx', 'want'] }).join(' ')).toMatch(
      /longer than 18 characters/,
    );
    const fourteen = 'I ___ a new job in the city near my home and my school.';
    expect(one({ en: fourteen })).toEqual([]);
    expect(one({ en: fourteen.replace('home', 'new home') }).join(' ')).toMatch(
      /longer than 14 words/,
    );
    // The count is with the answer in, so a longer answer counts in full.
    expect(one({ en: fourteen, options: ['really need', 'needs', 'needing'] })).not.toEqual([]);
  });

  it('needs zh, and a short non-empty note when there is one', () => {
    expect(one({ zh: '' })).not.toEqual([]);
    expect(one({ zh: '   ' })).not.toEqual([]);
    expect(one({ zh: 3 })).not.toEqual([]);
    expect(one({ zh: '我___一份新工作。' }).join(' ')).toMatch(/no blank/);
    expect(one({ note: '' })).not.toEqual([]);
    expect(one({ note: ' ' })).not.toEqual([]);
    expect(one({ note: 5 })).not.toEqual([]);
    expect(one({ note: '一'.repeat(30) })).toEqual([]);
    expect(one({ note: '一'.repeat(31) }).join(' ')).toMatch(/longer than 30 characters/);
  });

  it('allows a chunkId only for a chunk of the unit taught by now', () => {
    expect(one({ chunkId: 'later' }).join(' ')).toMatch(/chunk "later"/);
    expect(one({ chunkId: 3 })).not.toEqual([]);
  });

  it('names the task and the item in validateUnit messages', () => {
    expect(validateUnit(unit([fill({ zh: '' })]))).toEqual([
      'u: task "t1" fill "f1" needs zh, the Chinese of the whole sentence',
    ]);
  });
});

describe('checkFillChunks', () => {
  it('passes a fill that is its chunk with the answer in, ignoring case and end punctuation', () => {
    expect(checkFillChunks(unit([fill({ chunkId: 'need_job' })]))).toEqual([]);
    expect(checkFillChunks(unit([fill({ chunkId: 'need_job', en: 'i ___ a new job!' })]))).toEqual(
      [],
    );
    const accepted = { ...needJob, en: 'I really need a new job.', accept: ['I need a new job.'] };
    expect(checkFillChunks(unit([fill({ chunkId: 'need_job' })], [accepted]))).toEqual([]);
  });

  it('flags a fill that differs from its chunk', () => {
    const [problem] = checkFillChunks(
      unit([fill({ chunkId: 'need_job', en: 'I ___ a good job.' })]),
    );
    expect(problem).toMatch(/task "t1" fill "f1" reads "I need a good job."/);
    expect(problem).toMatch(/chunk "need_job" is "I need a new job."/);
  });

  it('ignores fills without a chunkId', () => {
    expect(checkFillChunks(unit([fill({ en: 'She ___ a job.' })]))).toEqual([]);
  });

  it('fills the blank with the option', () => {
    expect(filledSentence('I ___ a new job.', 'need')).toBe('I need a new job.');
  });
});

describe('fills in the shipped units', () => {
  const dir = join(__dirname, '..', 'src', 'data', 'units');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  it.each(files)('%s: each fill with a chunkId is that chunk', (file) => {
    const raw: unknown = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    expect(checkFillChunks(raw)).toEqual([]);
  });
});

describe('fillQuestions', () => {
  it('splits the sentence at the blank and shuffles the options', () => {
    const [q] = fillQuestions(task({ fills: [fill({ note: 'n' })] }), makeRng(1));
    expect(q).toMatchObject({
      kind: 'fill',
      before: 'I ',
      after: ' a new job.',
      answer: 'need',
      zh: '我需要一份新工作。',
      note: 'n',
      correctId: 'o0',
      itemId: NO_ITEM,
    });
    expect(q?.options.map((o) => o.label).sort()).toEqual(['need', 'needing', 'needs']);
    expect(q?.options.find((o) => o.id === q.correctId)?.label).toBe('need');
  });

  it('leaves out the note when there is none, and handles a blank at either end', () => {
    const [start, end] = fillQuestions(
      task({
        fills: [
          fill({ en: '___ I help you?', options: ['Can', 'Am', 'Does'] }),
          fill({ id: 'f2', en: 'This is what I ___', answer: 1 }),
        ],
      }),
      makeRng(2),
    );
    expect(start).not.toHaveProperty('note');
    expect(start).toMatchObject({ before: '', after: ' I help you?', answer: 'Can' });
    expect(end).toMatchObject({ before: 'This is what I ', after: '', answer: 'needs' });
    expect(end?.correctId).toBe('o1');
  });

  it('is deterministic for a seed and keeps the content order', () => {
    const fills = [
      fill(),
      fill({ id: 'f2', en: 'She ___ a job.', options: ['need', 'needs', 'needing', 'to need'] }),
    ];
    const a = fillQuestions(task({ fills }), makeRng(7));
    const b = fillQuestions(task({ fills }), makeRng(7));
    expect(a).toEqual(b);
    expect(a.map((q) => q.before)).toEqual(['I ', 'She ']);
    // Some seed puts the right option somewhere other than first.
    const firsts = [1, 2, 3, 4, 5, 6].map(
      (seed) => fillQuestions(task({ fills: [fill()] }), makeRng(seed))[0]?.options[0]?.id,
    );
    expect(new Set(firsts).size).toBeGreaterThan(1);
  });

  it('counts for the chunk when it has one', () => {
    const [q] = fillQuestions(task({ fills: [fill({ chunkId: 'need_job' })] }), makeRng(1));
    expect(q?.itemId).toBe('chunk:need_job');
  });

  it('comes in the task practice before arranging', () => {
    const kinds = buildTaskPractice(unit([fill()]), task({ fills: [fill()] }), makeRng(1)).map(
      (q) => q.kind,
    );
    expect(kinds.indexOf('fill')).toBeGreaterThan(-1);
    expect(kinds.indexOf('fill')).toBeLessThan(kinds.indexOf('arrange'));
  });
});

describe('grammar fills (文法填空)', () => {
  const grammar = (over: Record<string, unknown> = {}) =>
    one({ grammar: true, options: ['need', 'needs', 'needing', 'needed'], ...over });

  it('accepts a grammar fill with exactly 4 forms', () => {
    expect(grammar()).toEqual([]);
    expect(
      validateUnit(
        unit([fill({ grammar: true, options: ['need', 'needs', 'needing', 'needed'] })]),
      ),
    ).toEqual([]);
  });

  it('does not ask the 4 options to share a stem (who / which / where are fine)', () => {
    expect(
      grammar({
        en: 'This is the office ___ I work.',
        zh: '這是我工作的辦公室。',
        options: ['who', 'which', 'where', 'what'],
        answer: 2,
      }),
    ).toEqual([]);
  });

  it('keeps the size limits of a plain fill', () => {
    expect(grammar({ options: ['need', 'needs', 'needing', 'to be so needed'] })).toEqual([
      expect.stringContaining('longer than 3 words'),
    ]);
    expect(grammar({ answer: 4 })).toEqual([expect.stringContaining('answer must be the index')]);
  });

  it('needs exactly 4 options, and grammar only as true', () => {
    expect(grammar({ options: ['need', 'needs', 'needing'] })).toEqual([
      expect.stringContaining('needs exactly 4 options'),
    ]);
    expect(grammar({ grammar: false })).toEqual([expect.stringContaining('grammar must be true')]);
    expect(grammar({ grammar: 'yes' })).toEqual([expect.stringContaining('grammar must be true')]);
  });

  it('marks the question as grammar, and only then', () => {
    const [q] = fillQuestions(
      task({ fills: [fill({ grammar: true, options: ['need', 'needs', 'needing', 'needed'] })] }),
      makeRng(1),
    );
    expect(q?.grammar).toBe(true);
    const [plain] = fillQuestions(task({ fills: [fill()] }), makeRng(1));
    expect(plain).not.toHaveProperty('grammar');
  });

  it('keeps all 4 options and the answer in the question', () => {
    const [q] = fillQuestions(
      task({ fills: [fill({ grammar: true, options: ['need', 'needs', 'needing', 'needed'] })] }),
      makeRng(3),
    );
    expect(q?.options.map((o) => o.id).sort()).toEqual(['o0', 'o1', 'o2', 'o3']);
    expect(q?.answer).toBe('need');
  });

  it('labels the screen 文法填空, and a plain fill not', () => {
    expect(fillPrompt({ grammar: true })).toMatch(/^文法填空/);
    expect(fillPrompt({})).not.toContain('文法');
  });
});
