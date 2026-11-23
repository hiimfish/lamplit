import { describe, expect, it } from 'vitest';
import { isValidAudioId } from '../src/audio/voices';
import { unitToAudioItems } from '../src/content/audioItems';
import type { TaskCheckContext } from '../src/content/checks/common';
import {
  checkResponds,
  respondAudioId,
  responseAudioId,
  RESPONSE_ROLE,
} from '../src/content/checks/responds';
import type { RespondItem, Task, Unit } from '../src/content/types';
import { questionTexts } from '../src/content/vocab';
import { respondQuestions } from '../src/learning/gen/responds';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import { applyAnswer, FAST_MS_ARRANGE, FAST_MS_LISTEN_CHOOSE } from '../src/learning/sessionPlan';
import { createEmptySave } from '../src/core/save';

const item = (id: string, over: Partial<RespondItem> = {}): RespondItem => ({
  id,
  prompt: { role: 'agency', en: `Have you seen the new ideas ${id}?`, zh: '你看過新點子了嗎？' },
  responses: [
    { en: 'Yes, she sent them this morning.', zh: '有，她今天早上寄來了。' },
    { en: 'It is on the second floor.', zh: '在二樓。' },
    { en: 'About twenty dollars.', zh: '大約二十美元。' },
  ],
  answer: 0,
  ...over,
});
const items = () => [item('r1'), item('r2'), item('r3')];

const context = (act = 4): TaskCheckContext => {
  const spaces = new Map<string, Set<string>>();
  return {
    seen: (kind) => spaces.get(kind) ?? spaces.set(kind, new Set()).get(kind)!,
    taughtChunks: new Set(),
    isRole: (value) => value === 'agency' || value === 'manager' || value === 'guide',
    act,
  };
};
const problems = (responds: unknown, act = 4) => checkResponds({ responds }, context(act));
/** Problems of one item (among two good ones) with fields replaced, as JSON may arrive. */
const with_ = (over: Record<string, unknown>) =>
  problems([item('r1'), item('r2'), { ...item('r3'), ...over }]);

const task = (over: Partial<Task> = {}): Task => ({
  id: 't6',
  title: 't',
  newChunkIds: [],
  newWordIds: [],
  scene: [],
  ...over,
});
const unit = (tasks: Task[]): Unit => ({
  id: 'marketing',
  title: 'u',
  titleEn: 'u',
  chunks: [],
  words: [],
  tasks,
});

describe('checkResponds (應答題)', () => {
  it('accepts 3 or 4 items, and a task without responds', () => {
    expect(problems(items())).toEqual([]);
    expect(problems([...items(), item('r4')])).toEqual([]);
    expect(checkResponds({}, context())).toEqual([]);
  });

  it('is for Act 4 units only', () => {
    expect(problems(items(), 3)).toEqual([expect.stringContaining('for Act 4 units only')]);
    expect(problems(items(), 0)).toEqual([expect.stringContaining('for Act 4 units only')]);
  });

  it('needs a list of 3 to 4 items', () => {
    expect(problems(items().slice(0, 2))).toEqual([expect.stringContaining('3 to 4 items')]);
    expect(problems([...items(), item('r4'), item('r5')])).toEqual([
      expect.stringContaining('3 to 4 items'),
    ]);
    expect(problems('r1')).toEqual([expect.stringContaining('3 to 4 items')]);
  });

  it('rejects bad or repeated ids, also across tasks of a unit', () => {
    expect(with_({ id: 'R-3' })).toEqual([expect.stringContaining('bad id')]);
    expect(with_({ id: 'r1' })).toContainEqual(expect.stringContaining('duplicate id'));
    const ctx = context();
    expect(checkResponds({ responds: items() }, ctx)).toEqual([]);
    expect(checkResponds({ responds: items() }, ctx).join()).toMatch(/duplicate id/);
  });

  it('needs a prompt by a role with a voice that is not the guide', () => {
    expect(with_({ prompt: { role: 'guide', en: 'Hi there?', zh: '嗨？' } })).toEqual([
      expect.stringContaining(`said by "${RESPONSE_ROLE}", who says the responses`),
    ]);
    expect(with_({ prompt: { role: 'mayor', en: 'Hi there?', zh: '嗨？' } })).toEqual([
      expect.stringContaining('bad role "mayor"'),
    ]);
    expect(with_({ prompt: { role: 'manager', en: '', zh: '嗨？' } })).toEqual([
      expect.stringContaining('prompt needs its English'),
    ]);
    expect(with_({ prompt: { role: 'manager', en: 'Hi there?' } })).toEqual([
      expect.stringContaining('prompt needs its Chinese'),
    ]);
    expect(with_({ prompt: 'Hi there?' })).toEqual([expect.stringContaining('needs "prompt"')]);
    expect(with_({ prompt: { ...item('r1').prompt } })).toEqual([
      expect.stringContaining("the same as an earlier item's"),
    ]);
  });

  it('needs exactly 3 different responses with en and zh, and a good answer', () => {
    const [a, b, c] = item('r3').responses;
    expect(with_({ responses: [a, b] })).toEqual([expect.stringContaining('exactly 3')]);
    expect(with_({ responses: [a, b, c, a] })).toEqual([expect.stringContaining('exactly 3')]);
    expect(with_({ responses: [a, a, c] })).toEqual([
      expect.stringContaining('two responses that are the same'),
    ]);
    expect(with_({ responses: [a, b, { en: 'Sure.' }] })).toEqual([
      expect.stringContaining('response 3 needs its Chinese'),
    ]);
    expect(with_({ responses: [a, b, 'Sure.'] })).toEqual([
      expect.stringContaining('response 3 must be an object'),
    ]);
    for (const answer of [3, -1, 1.5, '0']) {
      expect(with_({ answer }), String(answer)).toEqual([expect.stringContaining('bad answer')]);
    }
  });

  it('rejects fields an item, a prompt or a response does not have', () => {
    expect(with_({ question: 'x' })).toEqual([expect.stringContaining('unknown field "question"')]);
    const prompt = { ...item('r3').prompt, speaker: 'npc' };
    expect(with_({ prompt })).toEqual([expect.stringContaining('unknown field "speaker"')]);
  });
});

describe('respondQuestions', () => {
  it('makes one question per item, in order, with the clips and the right response', () => {
    const qs = respondQuestions(unit([]), task({ responds: items() }), makeRng(1));
    expect(qs.map((q) => [q.kind, q.respondId, q.index, q.total, q.itemId])).toEqual([
      ['respond', 'r1', 0, 3, NO_ITEM],
      ['respond', 'r2', 1, 3, NO_ITEM],
      ['respond', 'r3', 2, 3, NO_ITEM],
    ]);
    const first = qs[0]!;
    expect(first.prompt).toEqual({
      role: 'agency',
      audioId: 'marketing.respond.r1',
      en: 'Have you seen the new ideas r1?',
      zh: '你看過新點子了嗎？',
    });
    expect(first.options.find((o) => o.id === first.correctId)).toEqual({
      id: 'o0',
      audioId: 'marketing.response.r1_0',
      en: 'Yes, she sent them this morning.',
      zh: '有，她今天早上寄來了。',
    });
    expect(first.options.map((o) => o.audioId).sort()).toEqual([
      'marketing.response.r1_0',
      'marketing.response.r1_1',
      'marketing.response.r1_2',
    ]);
  });

  it('is deterministic for a seed and shuffles the responses', () => {
    const run = (seed: number) =>
      respondQuestions(unit([]), task({ responds: items() }), makeRng(seed));
    expect(run(3)).toEqual(run(3));
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) =>
        run(s)[0]!
          .options.map((o) => o.id)
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('comes in the task practice right after the talks and before arranging', () => {
    const talk = {
      id: 'k1',
      lines: [
        { id: 'k1_1', role: 'agency' as const, en: 'Hi.', zh: '嗨。' },
        { id: 'k1_2', role: 'guide' as const, en: 'Hello.', zh: '哈囉。' },
        { id: 'k1_3', role: 'agency' as const, en: 'Ready?', zh: '好了嗎？' },
      ],
      questions: [{ en: 'Who?', zh: '誰？', options: ['Nina', 'Dan'], answer: 0 }],
    };
    const passage = {
      id: 'p1',
      kind: 'notice' as const,
      lines: ['Come on Monday at ten.', 'It is free for everyone.'],
      questions: [{ en: 'When?', zh: '何時？', options: ['Monday', 'Friday'], answer: 0 }],
    };
    const chunk = { id: 'c1', en: 'Can we try a warmer version?', zh: '可以試溫暖一點的版本嗎？' };
    const t = task({
      newChunkIds: ['c1'],
      responds: items(),
      talks: [talk],
      passages: [passage],
    });
    const kinds = buildTaskPractice({ ...unit([t]), chunks: [chunk] }, t, makeRng(1)).map(
      (q) => q.kind,
    );
    const firstRespond = kinds.indexOf('respond');
    expect(kinds.slice(firstRespond, firstRespond + 3)).toEqual(['respond', 'respond', 'respond']);
    expect(kinds.lastIndexOf('talk')).toBe(firstRespond - 1);
    expect(kinds.indexOf('read-passage')).toBeLessThan(kinds.indexOf('talk'));
    expect(kinds.indexOf('arrange')).toBe(firstRespond + 3);
  });

  it('uses the slow "fast" threshold', () => {
    const now = new Date('2026-11-23T10:00:00');
    // A question about no item makes no card, so check the threshold through an item id.
    const ms = FAST_MS_LISTEN_CHOOSE + 1000;
    expect(ms).toBeLessThan(FAST_MS_ARRANGE);
    const answer = { itemId: 'a', correct: true, usedHelp: false, ms };
    const pick = applyAnswer(createEmptySave(now), answer, now, 'listen-pick');
    const respond = applyAnswer(createEmptySave(now), answer, now, 'respond');
    // Easy (fast) schedules the next review later than Good.
    expect(new Date(respond.cards.a?.due ?? 0).getTime()).toBeGreaterThan(
      new Date(pick.cards.a?.due ?? 0).getTime(),
    );
  });
});

describe('應答題 audio and words', () => {
  it('speaks the prompt in its role and each response in your voice, with valid ids', () => {
    const result = unitToAudioItems(unit([task({ responds: [item('r1')] })]));
    expect(result).toEqual([
      {
        id: respondAudioId('marketing', 'r1'),
        text: 'Have you seen the new ideas r1?',
        role: 'agency',
      },
      ...item('r1').responses.map((r, i) => ({
        id: responseAudioId('marketing', 'r1', i),
        text: r.en,
        role: 'guide',
      })),
    ]);
    expect(result.every((i) => isValidAudioId(i.id))).toBe(true);
  });

  it('takes the prompt and every response into questionTexts', () => {
    expect(questionTexts(task({ responds: [item('r1')] })).map((l) => l.en)).toEqual([
      'Have you seen the new ideas r1?',
      'Yes, she sent them this morning.',
      'It is on the second floor.',
      'About twenty dollars.',
    ]);
  });
});
