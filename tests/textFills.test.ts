import { describe, expect, it } from 'vitest';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkTextFills, fillLines } from '../src/content/checks/textFills';
import type { Task, TextFillItem, Unit } from '../src/content/types';
import { validateUnit } from '../src/content/validate';
import { textFillParts, textFillQuestions } from '../src/learning/gen/textFills';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import { FAST_MS_ARRANGE, applyAnswer } from '../src/learning/sessionPlan';
import { createEmptySave } from '../src/core/save';
import {
  WIDE_OPTION_CHARS,
  emailHeader,
  emailShape,
  wideOptions,
} from '../src/ui/minigames/TextFill';

const item = (over: Partial<TextFillItem> = {}): TextFillItem => ({
  id: 'e1',
  kind: 'email',
  title: 'From: Dan',
  lines: ['Hi team,', 'The meeting is ___ Monday.', 'Please ___ your notes.'],
  zh: ['大家好，', '會議在星期一。', '請帶你的筆記。'],
  blanks: [
    { options: ['on', 'in', 'at', 'by'], answer: 0, note: '星期幾前面用 on。' },
    { options: ['bring', 'brings', 'brought', 'bringing'], answer: 0 },
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
const problems = (textFills: unknown) => checkTextFills({ textFills }, context());
const with_ = (over: Record<string, unknown>) => problems([{ ...item(), ...over }]);
const blank0 = item().blanks[0]!;

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: [],
  newWordIds: [],
  scene: [],
  ...over,
});
const unit = (tasks: Task[]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks: [],
  words: [],
  tasks,
});

describe('checkTextFills (段落填空)', () => {
  it('accepts a good text and a task without text fills', () => {
    expect(problems([item()])).toEqual([]);
    expect(checkTextFills({}, context())).toEqual([]);
    expect(validateUnit(unit([task({ textFills: [item()] })]))).toEqual([]);
  });

  it('accepts whole sentences as options and two blanks in one line', () => {
    const sentences = ['Thank you.', 'See you soon.', 'Sorry for that.', 'Good luck.'];
    expect(
      with_({
        lines: ['I ___ the ___ today.', 'Bye.'],
        zh: ['我今天寄了檔案。', '再見。'],
        blanks: [
          { options: ['sent', 'send', 'sends', 'sending'], answer: 0 },
          { options: sentences, answer: 1 },
        ],
      }),
    ).toEqual([]);
  });

  it('rejects anything but a non-empty list, and more than one in a task', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems(item())).not.toEqual([]);
    expect(problems(['x'])).toEqual([expect.stringContaining('must be an object')]);
    expect(problems([item(), item({ id: 'e2' })])).toEqual([expect.stringContaining('at most 1')]);
  });

  it('keeps ids good and unique across the unit', () => {
    expect(with_({ id: 'E1' })).not.toEqual([]);
    const tasks = [task({ textFills: [item()] }), task({ id: 't2', textFills: [item()] })];
    expect(validateUnit(unit(tasks))).toEqual([expect.stringContaining('duplicate id')]);
  });

  it('checks kind, title and unknown fields', () => {
    expect(with_({ kind: 'letter' })[0]).toContain('bad kind');
    expect(with_({ title: ' ' })[0]).toContain('empty title');
    expect(with_({ title: undefined })).toEqual([]);
    expect(with_({ title: 'Re: ___ order' })[0]).toContain('title must have no blank');
    expect(with_({ text: 'x' })[0]).toContain('unknown field "text"');
    expect(with_({ blanks: [{ ...blank0, hint: 'x' }, item().blanks[1]] })[0]).toContain(
      'unknown field "hint"',
    );
  });

  it('needs one zh per line, with no blank', () => {
    expect(with_({ zh: ['a', 'b'] })[0]).toContain('3 lines but 2 zh');
    expect(with_({ zh: ['a', 'b ___', 'c'] })[0]).toContain('no blank');
    expect(with_({ zh: undefined })).not.toEqual([]);
  });

  it('needs as many "___" as blanks, 2 to 4 of them', () => {
    expect(with_({ lines: ['The meeting is ___ Monday.', 'Bye.', 'Bye.'] })[0]).toContain(
      'has 1 "___" in its lines but 2 blanks',
    );
    expect(with_({ blanks: [blank0] })[0]).toContain('2 to 4 blanks (it has 1)');
    const five = Array.from({ length: 5 }, () => blank0);
    expect(with_({ blanks: five })[0]).toContain('2 to 4 blanks (it has 5)');
    expect(with_({ blanks: 'x' })[0]).toContain('2 to 4 blanks');
  });

  it('wants each blank as exactly three underscores, not glued to a word', () => {
    expect(
      with_({ lines: ['Hi team,', 'The meeting is ____ Monday.', 'Please ___ notes.'] }),
    ).toContainEqual(expect.stringContaining('exactly three underscores'));
    expect(
      with_({ lines: ['Hi team,', 'The meeting is___ Monday.', 'Please ___ notes.'] }),
    ).toContainEqual(expect.stringContaining('glued'));
  });

  it('needs exactly 4 different options, a good answer and a short note', () => {
    expect(with_({ blanks: [{ ...blank0, options: ['on', 'in', 'at'] }, blank0] })[0]).toContain(
      'exactly 4 options (it has 3)',
    );
    expect(
      with_({ blanks: [{ ...blank0, options: ['on', 'On', 'at', 'by'] }, blank0] })[0],
    ).toContain('the same');
    expect(
      with_({ blanks: [{ ...blank0, options: ['on ', 'in', 'at', 'by'] }, blank0] }),
    ).not.toEqual([]);
    expect(with_({ blanks: [{ ...blank0, answer: 4 }, blank0] })[0]).toContain('answer must be');
    expect(with_({ blanks: [{ ...blank0, note: '' }, blank0] })[0]).toContain('note');
    expect(with_({ blanks: [{ ...blank0, note: '很'.repeat(31) }, blank0] })[0]).toContain(
      'longer',
    );
  });

  it('counts at most 90 words, title included, with each blank filled by its answer', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    // Title (2) + "Hi team," (2) + "The meeting is on Monday." (5) + "Please bring your notes." (4) = 13.
    const long = (extra: number) =>
      with_({ lines: [...item().lines, words(extra)], zh: [...item().zh, '字'] });
    expect(long(77)).toEqual([]);
    expect(long(78)[0]).toContain('91 words');
  });

  it('fills the lines with the answers in reading order', () => {
    expect(fillLines(['a ___ b ___', 'c', '___ d'], (i) => `<${i}>`)).toEqual([
      'a <0> b <1>',
      'c',
      '<2> d',
    ]);
  });
});

describe('textFillQuestions', () => {
  it('makes one question per blank, in order, each with the whole text and every answer', () => {
    const qs = textFillQuestions(task({ textFills: [item()] }), makeRng(1));
    expect(qs).toHaveLength(2);
    expect(qs.map((q) => [q.kind, q.textFillId, q.index, q.total, q.correctId])).toEqual([
      ['text-fill', 'e1', 0, 2, 'o0'],
      ['text-fill', 'e1', 1, 2, 'o0'],
    ]);
    for (const q of qs) {
      expect(q.lines).toEqual(item().lines);
      expect(q.zh).toEqual(item().zh);
      expect(q.answers).toEqual(['on', 'bring']);
      expect(q.title).toBe('From: Dan');
      expect(q.passageKind).toBe('email');
      expect(q.itemId).toBe(NO_ITEM);
      expect(q.options).toHaveLength(4);
    }
    expect(qs[0]!.note).toBe('星期幾前面用 on。');
    expect(qs[1]).not.toHaveProperty('note');
    expect(qs[0]!.options.find((o) => o.id === qs[0]!.correctId)?.label).toBe('on');
  });

  it('cuts the lines into text and blanks numbered across the text', () => {
    expect(textFillParts(['Hi ___.', '___ and ___'])).toEqual([
      [{ text: 'Hi ' }, { blank: 0 }, { text: '.' }],
      [{ blank: 1 }, { text: ' and ' }, { blank: 2 }],
    ]);
  });

  it('comes right after the sentence fills in practice', () => {
    const fills = [
      {
        id: 'f1',
        en: 'I ___ a job.',
        zh: '我需要工作。',
        options: ['need', 'needs', 'needing'],
        answer: 0,
      },
    ];
    const passages = [
      {
        id: 'p1',
        kind: 'notice' as const,
        lines: ['Come on Monday.', 'Bring a pen.'],
        questions: [{ en: 'When?', zh: '何時？', options: ['Monday', 'Friday'], answer: 0 }],
      },
    ];
    const t = task({ fills, passages, textFills: [item()] });
    const kinds = buildTaskPractice(unit([t]), t, makeRng(1)).map((q) => q.kind);
    expect(kinds).toEqual(['fill', 'text-fill', 'text-fill', 'read-passage']);
  });

  it('keeps blank order and each right answer whatever the shuffle', () => {
    const three = item({
      lines: ['Hi ___,', 'Thanks ___ the list.', '___'],
      zh: ['嗨，', '謝謝清單。', '再見。'],
      blanks: [
        { options: ['Ann', 'Bo', 'Cy', 'Di'], answer: 2 },
        { options: ['for', 'to', 'of', 'at'], answer: 0 },
        { options: ['See you soon.', 'Good luck.', 'Thank you.', 'Sorry.'], answer: 3 },
      ],
    });
    for (let seed = 1; seed <= 20; seed++) {
      const qs = textFillQuestions(task({ textFills: [three] }), makeRng(seed));
      expect(qs.map((q) => q.index)).toEqual([0, 1, 2]);
      expect(qs.every((q) => q.total === 3)).toBe(true);
      const right = qs.map((q) => q.options.find((o) => o.id === q.correctId)?.label);
      expect(right).toEqual(['Cy', 'for', 'Sorry.']);
      expect(qs[0]!.answers).toEqual(right);
    }
  });

  it('makes no questions for a task without text fills', () => {
    expect(textFillQuestions(task(), makeRng(1))).toEqual([]);
  });

  it('uses the slow fast-answer threshold', () => {
    const now = new Date('2026-11-23T10:00:00');
    const result = { itemId: 'chunk:x', correct: true, usedHelp: false, ms: FAST_MS_ARRANGE - 1 };
    // A card seen once before: the first answer about a card is never rated Easy.
    const seen = applyAnswer(createEmptySave(now), { ...result, ms: 60_000 }, now);
    const later = new Date(seen.cards['chunk:x']?.due ?? 0);
    const slow = applyAnswer(seen, { ...result, ms: 6000 }, later, 'text-fill');
    const listen = applyAnswer(seen, { ...result, ms: 6000 }, later, 'listen-pick');
    // 6 s is fast for a text fill (under 12 s) but not for a listen-pick (4 s).
    expect(slow.cards['chunk:x']).not.toEqual(listen.cards['chunk:x']);
  });
});

describe('TextFill screen helpers', () => {
  // Number keys are the shared ChoiceKeys map now (tests/keys-choice.test.ts).
  it('puts the keys one per row only when an option is a phrase or a sentence', () => {
    const labels = (...l: string[]) => l.map((label) => ({ label }));
    expect(wideOptions(labels('on', 'in', 'at', 'by'))).toBe(false);
    expect(wideOptions(labels('attached', 'attach', 'attaching', 'attaches'))).toBe(false);
    expect(wideOptions(labels('x'.repeat(WIDE_OPTION_CHARS), 'b'))).toBe(false);
    expect(wideOptions(labels('Please let me know soon.', 'b'))).toBe(true);
  });

  it('reads an email title as the subject unless it names its own field', () => {
    expect(emailHeader('Your First Day on Monday')).toEqual({
      label: 'Subject',
      value: 'Your First Day on Monday',
    });
    expect(emailHeader('From: Dan Lee')).toEqual({ label: 'From', value: 'Dan Lee' });
    expect(emailHeader('Re: Price list')).toEqual({ label: 'Re', value: 'Price list' });
    expect(emailHeader('Meeting at 9:00')).toEqual({ label: 'Subject', value: 'Meeting at 9:00' });
  });

  it('finds the greeting and the sign-off of an email', () => {
    expect(
      emailShape(['Dear Mr. Hughes,', 'Thank you ___ your email.', 'Sincerely,', 'Amy Chen']),
    ).toEqual({ greeting: true, signOff: 2 });
    expect(emailShape(['Hi team,', 'See you at ___.', 'Best regards,', 'Dan'])).toEqual({
      greeting: true,
      signOff: 2,
    });
    expect(emailShape(['The meeting moved to Friday.', 'Thanks!'])).toEqual({
      greeting: false,
      signOff: 1,
    });
    expect(emailShape(['Please ___ the form.', 'It is due today.'])).toEqual({
      greeting: false,
      signOff: -1,
    });
  });
});
