import { describe, expect, it } from 'vitest';
import type { FillItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkFills } from '../src/content/checks/fills';
import { validateUnit } from '../src/content/validate';
import { fillQuestions } from '../src/learning/gen/fills';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';

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

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: ['need_job'],
  newWordIds: [],
  scene: [],
  ...over,
});

const unit = (fills: FillItem[]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks: [{ id: 'need_job', en: 'I need a new job.', zh: '我需要一份新工作。' }],
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

  it('rejects an empty list, bad or repeated ids', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems([fill({ id: 'F 1' })])).not.toEqual([]);
    expect(problems([fill(), fill()])).not.toEqual([]);
    expect(validateUnit(unit([fill(), fill({ en: 'She ___ a job.' })]))).not.toEqual([]);
  });

  it('needs the blank exactly once', () => {
    expect(problems([fill({ en: 'I need a new job.' })])).not.toEqual([]);
    expect(problems([fill({ en: 'I ___ a ___ job.' })])).not.toEqual([]);
  });

  it('needs 3 or 4 different options and an answer among them', () => {
    expect(problems([fill({ options: ['need', 'needs'] })])).not.toEqual([]);
    expect(problems([fill({ options: ['need', 'Need', 'needs'] })])).not.toEqual([]);
    expect(problems([fill({ options: ['a', 'b', 'c', 'd', 'e'] })])).not.toEqual([]);
    expect(problems([fill({ answer: 3 })])).not.toEqual([]);
    expect(problems([fill({ zh: '' })])).not.toEqual([]);
  });

  it('allows a chunkId only for a chunk taught by now', () => {
    expect(problems([fill({ chunkId: 'later' })])).not.toEqual([]);
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
