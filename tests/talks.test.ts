import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TalkItem, Task, Unit } from '../src/content/types';
import type { TaskCheckContext } from '../src/content/checks/common';
import { checkTalks } from '../src/content/checks/talks';
import { validateUnit } from '../src/content/validate';
import { talkQuestions, type TalkQuestion } from '../src/learning/gen/talks';
import { buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import {
  LEAD_IN_MS,
  PAUSE_NEW_SPEAKER_MS,
  PAUSE_SAME_SPEAKER_MS,
  lineTimeoutMs,
  optionForKey,
  pauseBeforeMs,
  playConversation,
  type ConversationDeps,
} from '../src/ui/minigames/Talk';

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
    isRole: (value) =>
      value === 'clerk' || value === 'friend' || value === 'guide' || value === 'barista',
  };
};
const problems = (talks: unknown) => checkTalks({ talks }, context());
/** Problems of one talk whose fields are replaced (any shape, as content arrives as JSON). */
const with_ = (over: Record<string, unknown>) => problems([{ ...talk(), ...over }]);
const lines = talk().lines;
const line = (i: number, over: Record<string, unknown> = {}) => ({ ...lines[i]!, ...over });
const q0 = talk().questions[0]!;

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 't',
  newChunkIds: ['open_account'],
  newWordIds: [],
  scene: [],
  ...over,
});

const unit = (talks: TalkItem[], tasks?: Task[]): Unit => ({
  id: 'u',
  title: 'u',
  titleEn: 'u',
  chunks: [{ id: 'open_account', en: 'I want to open an account.', zh: '我想開戶。' }],
  words: [],
  tasks: tasks ?? [task({ talks })],
});

describe('checkTalks (聽對話答題)', () => {
  it('accepts a good talk and a task without talks', () => {
    expect(problems([talk()])).toEqual([]);
    expect(checkTalks({}, context())).toEqual([]);
    expect(validateUnit(unit([talk()]))).toEqual([]);
  });

  it('accepts 6 lines, two in a row by one speaker, 3 questions with 2 to 4 options', () => {
    const six = [
      line(0),
      line(2, { id: 'a2' }),
      line(1),
      line(1, { id: 'a4' }),
      line(0, { id: 'a5' }),
      line(1, { id: 'a6' }),
    ];
    const qs = [
      q0,
      { ...q0, en: 'Who is the woman?', options: ['A clerk', 'A doctor'] },
      { ...q0, en: 'What will he do next?', options: ['Sit', 'Run', 'Eat', 'Go'], answer: 3 },
    ];
    expect(problems([talk({ lines: six, questions: qs })])).toEqual([]);
  });

  it('accepts the learner (guide) as one of the speakers', () => {
    expect(with_({ lines: [line(0), line(1, { role: 'guide' }), line(2)] })).toEqual([]);
  });

  it('rejects anything but a non-empty list, and more than one talk in a task', () => {
    expect(problems([])).not.toEqual([]);
    expect(problems({ ...talk() })).not.toEqual([]);
    expect(problems('talk')).not.toEqual([]);
    expect(
      problems([talk(), talk({ id: 'k2', lines: lines.map((l) => ({ ...l, id: `x${l.id}` })) })]),
    ).toEqual([expect.stringContaining('at most 1')]);
    expect(problems(['k1'])).toEqual([expect.stringContaining('talk 1 must be an object')]);
  });

  it('rejects bad or repeated talk ids, also across tasks of the unit', () => {
    expect(with_({ id: 'K1' })[0]).toContain('bad id');
    expect(with_({ id: 'k-1' })).not.toEqual([]);
    expect(with_({ id: undefined })).not.toEqual([]);
    const second = talk({ lines: lines.map((l) => ({ ...l, id: `b${l.id}` })) });
    const tasks = [task({ talks: [talk()] }), task({ id: 't2', talks: [second] })];
    expect(validateUnit(unit([], tasks))).toEqual([
      expect.stringContaining('already used by another talk'),
    ]);
  });

  it('rejects fields a talk or a line does not have', () => {
    expect(with_({ question: q0 })).toEqual([expect.stringContaining('unknown field "question"')]);
    expect(with_({ lines: [line(0, { speaker: 'npc' }), line(1), line(2)] })).toEqual([
      expect.stringContaining('unknown field "speaker"'),
    ]);
  });

  it('needs 3 to 6 lines', () => {
    expect(with_({ lines: lines.slice(0, 2) })[0]).toContain('has 2 lines');
    const seven = Array.from({ length: 7 }, (_, i) => line(i % 2, { id: `l${i}` }));
    expect(with_({ lines: seven })[0]).toContain('has 7 lines');
    expect(with_({ lines: undefined })).not.toEqual([]);
    expect(with_({ lines: 'hello' })).not.toEqual([]);
    expect(with_({ lines: [line(0), 'x', line(2)] })).toContain(
      'talk "k1" line 2 must be an object { id, role, en, zh }',
    );
  });

  it('keeps line ids in the audio id form and unique in the unit', () => {
    expect(with_({ lines: [line(0, { id: 'K1_1' }), line(1), line(2)] })[0]).toContain('bad id');
    expect(with_({ lines: [line(0, { id: 'k1.1' }), line(1), line(2)] })).not.toEqual([]);
    expect(with_({ lines: [line(0, { id: 7 }), line(1), line(2)] })).not.toEqual([]);
    expect(with_({ lines: [line(0), line(1, { id: 'k1_1' }), line(2)] })).toEqual([
      expect.stringContaining('already used by another talk line'),
    ]);
    // A second talk (in another task) reusing the first talk's line ids.
    const other = talk({ id: 'k2' });
    const tasks = [task({ talks: [talk()] }), task({ id: 't2', talks: [other] })];
    expect(validateUnit(unit([], tasks)).length).toBe(3);
  });

  it('needs exactly two speakers with known roles and different labels', () => {
    expect(with_({ lines: lines.map((l) => ({ ...l, role: 'clerk' })) })).toContainEqual(
      expect.stringContaining('exactly two speakers'),
    );
    expect(with_({ lines: [line(0), line(1), line(2, { role: 'guide' })] })).toEqual([
      expect.stringContaining('exactly two speakers'),
    ]);
    expect(with_({ lines: [line(0, { role: 'mayor' }), line(1), line(2)] })).toContainEqual(
      expect.stringContaining('bad role "mayor"'),
    );
    expect(with_({ lines: [line(0), line(1, { role: 'barista' }), line(2)] })).toEqual([
      expect.stringContaining('both shown as'),
    ]);
  });

  it('lets one speaker say at most two lines in a row', () => {
    const run = [line(0), line(2, { id: 'r2' }), line(0, { id: 'r3' }), line(1)];
    expect(with_({ lines: run })).toEqual([expect.stringContaining('3 lines in a row by "clerk"')]);
  });

  it('needs English and Chinese on every line', () => {
    expect(with_({ lines: [line(0, { zh: '' }), line(1), line(2)] })).toEqual([
      expect.stringContaining('needs its Chinese'),
    ]);
    expect(with_({ lines: [line(0, { en: '  ' }), line(1), line(2)] })).toEqual([
      expect.stringContaining('needs its English'),
    ]);
    expect(with_({ lines: [line(0, { en: undefined }), line(1), line(2)] })).not.toEqual([]);
  });

  it('needs 1 to 3 good questions', () => {
    expect(with_({ questions: [] })).not.toEqual([]);
    expect(with_({ questions: undefined })).not.toEqual([]);
    expect(with_({ questions: [q0, q0, q0, q0] })[0]).toContain('1 to 3 questions');
    expect(with_({ questions: [{ ...q0, answer: 5 }] })).toEqual([
      expect.stringContaining('bad answer'),
    ]);
    expect(with_({ questions: [{ ...q0, options: ['a', 'b', 'c', 'd', 'e'] }] })).not.toEqual([]);
    expect(with_({ questions: [{ ...q0, options: ['a'], answer: 0 }] })).not.toEqual([]);
    expect(with_({ questions: [{ ...q0, options: ['a', 'A', 'b'] }] })).not.toEqual([]);
    expect(with_({ questions: [{ ...q0, zh: '' }] })).not.toEqual([]);
    expect(with_({ questions: ['What?'] })).toEqual([expect.stringContaining('must be an object')]);
    expect(with_({ questions: [q0, { ...q0, answer: 1 }] })).toEqual([
      expect.stringContaining('question 2 asks the same'),
    ]);
  });

  it('says which talk and line to fix', () => {
    const [problem] = validateUnit(
      unit([talk({ lines: [line(0), line(1, { zh: '' }), line(2)] })]),
    );
    expect(problem).toContain('task "t1"');
    expect(problem).toContain('talk "k1" line "k1_2"');
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
      expect(q.speakers).toEqual(['clerk', 'friend']);
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

  it('is deterministic for a seed and shuffles the options', () => {
    const make = (seed: number) =>
      talkQuestions(unit([talk()]), task({ talks: [talk()] }), makeRng(seed));
    expect(make(7)).toEqual(make(7));
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        make(seed)[0]!
          .options.map((o) => o.id)
          .join(','),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
    for (let seed = 0; seed < 20; seed++) {
      const q = make(seed)[0]!;
      expect(q.options.map((o) => o.id).sort()).toEqual(['o0', 'o1', 'o2']);
      expect(q.correctId).toBe('o0');
    }
  });

  it('comes in the task practice before arranging, questions on one talk together', () => {
    const kinds = buildTaskPractice(unit([talk()]), task({ talks: [talk()] }), makeRng(1)).map(
      (q) => q.kind,
    );
    const first = kinds.indexOf('talk');
    expect(kinds.slice(first, first + 2)).toEqual(['talk', 'talk']);
    expect(kinds.filter((k) => k === 'talk')).toHaveLength(2);
    expect(first).toBeLessThan(kinds.indexOf('arrange'));
  });
});

/** Fake timers: `speech` says when browser speech is busy (time in ms from the start). */
function fakeWorld(play: ConversationDeps['play'], speech: (t: number) => boolean = () => false) {
  const t0 = Date.now();
  const time = () => Date.now() - t0;
  const log: string[] = [];
  const deps: ConversationDeps = {
    play: async (l) => {
      log.push(`play ${l.audioId} @${time()}`);
      return play(l);
    },
    speechBusy: () => speech(time()),
    stop: () => log.push(`stop @${time()}`),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => Date.now(),
  };
  /** Runs the conversation to its end; resolves with whether it finished, and when. */
  const run = async (onLine: (i: number) => void = () => undefined, cancelled = () => false) => {
    let end = -1;
    const done = playConversation(talkLines, onLine, cancelled, deps).then((finished) => {
      end = time();
      return finished;
    });
    await vi.runAllTimersAsync();
    return { finished: await done, end };
  };
  return { deps, log, time, run };
}

let talkLines: TalkQuestion['lines'];

describe('playConversation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    talkLines = talkQuestions(unit([talk()]), task({ talks: [talk()] }), makeRng(1))[0]!.lines;
  });
  afterEach(() => vi.useRealTimers());

  it('pauses longer when the other speaker answers', () => {
    const roles = [{ role: 'a' }, { role: 'b' }, { role: 'b' }];
    expect([0, 1, 2].map((i) => pauseBeforeMs(roles, i))).toEqual([
      LEAD_IN_MS,
      PAUSE_NEW_SPEAKER_MS,
      PAUSE_SAME_SPEAKER_MS,
    ]);
    expect(PAUSE_NEW_SPEAKER_MS).toBeGreaterThan(PAUSE_SAME_SPEAKER_MS);
  });

  it('plays every line in order after the previous clip has ended', async () => {
    const order: number[] = [];
    const world = fakeWorld(async () => true);
    const { finished } = await world.run((i) => order.push(i));
    expect(finished).toBe(true);
    expect(order).toEqual([0, 1, 2]);
    expect(world.log).toEqual([
      'play u.talk.k1_1 @300',
      'play u.talk.k1_2 @800',
      'play u.talk.k1_3 @1300',
    ]);
  });

  it('waits for browser speech to fall silent before the next line', async () => {
    // Without a clip, the speech of each line lasts 2 s from the moment it is asked for.
    let speechEnds = 0;
    const world = fakeWorld(
      async () => {
        speechEnds = world.time() + 2000;
        return false;
      },
      (t) => t < speechEnds,
    );
    await world.run();
    expect(world.log).toEqual([
      'play u.talk.k1_1 @300',
      'play u.talk.k1_2 @2800',
      'play u.talk.k1_3 @5300',
    ]);
  });

  it('moves on soon when nothing could be played at all', async () => {
    const { finished, end } = await fakeWorld(async () => false).run();
    expect(finished).toBe(true);
    expect(end).toBeLessThan(3000);
  });

  it('never waits forever: a clip or speech that never ends times out', async () => {
    const longest = talkLines.reduce((sum, l) => sum + lineTimeoutMs(l.en) + 500, 0);
    const stuck = fakeWorld(() => new Promise<boolean>(() => undefined));
    const a = await stuck.run();
    expect(a.finished).toBe(true);
    expect(a.end).toBeLessThanOrEqual(longest);
    expect(stuck.log.filter((l) => l.startsWith('stop'))).toHaveLength(3);

    const mute = fakeWorld(
      async () => false,
      () => true,
    );
    const b = await mute.run();
    expect(b.finished).toBe(true);
    expect(b.end).toBeLessThanOrEqual(longest);
    expect(mute.log.filter((l) => l.startsWith('stop'))).toHaveLength(3);
  });

  it('stops when cancelled, without starting another line', async () => {
    let cancel = false;
    const world = fakeWorld(async () => {
      cancel = true;
      return true;
    });
    const { finished } = await world.run(undefined, () => cancel);
    expect(finished).toBe(false);
    expect(world.log).toEqual(['play u.talk.k1_1 @300']);
  });
});

describe('optionForKey', () => {
  const key = (k: string, over: Partial<KeyboardEvent> = {}) =>
    ({
      key: k,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      repeat: false,
      ...over,
    }) as KeyboardEvent;

  it('maps 1 to the first option shown, up to the number of options', () => {
    expect(optionForKey(key('1'), 3)).toBe(0);
    expect(optionForKey(key('3'), 3)).toBe(2);
    expect(optionForKey(key('4'), 3)).toBeNull();
    expect(optionForKey(key('0'), 3)).toBeNull();
    expect(optionForKey(key('a'), 3)).toBeNull();
    expect(optionForKey(key(' '), 3)).toBeNull();
  });

  it('ignores shortcuts and held keys', () => {
    expect(optionForKey(key('1', { ctrlKey: true }), 3)).toBeNull();
    expect(optionForKey(key('1', { repeat: true }), 3)).toBeNull();
  });
});

describe('monologues (聽獨白答題)', () => {
  /** A voicemail of `n` lines by the clerk, 6 words each. */
  const voicemail = (n: number, over: Record<string, unknown> = {}) => ({
    ...talk(),
    kind: 'monologue',
    lines: Array.from({ length: n }, (_, i) => ({
      id: `m${i}`,
      role: 'clerk',
      en: 'Please call me back this afternoon.',
      zh: '請今天下午回電給我。',
    })),
    ...over,
  });

  it('accepts one speaker, 3 to 10 lines, 30 to 120 words, with runs of any length', () => {
    expect(problems([voicemail(5)])).toEqual([]);
    expect(problems([voicemail(10)])).toEqual([]);
    expect(validateUnit(unit([voicemail(5) as TalkItem]))).toEqual([]);
  });

  it('rejects a bad kind, two speakers, too few or many lines or words', () => {
    expect(with_({ kind: 'speech' })[0]).toContain('bad kind "speech"');
    const two = voicemail(5);
    two.lines[1] = { ...two.lines[1]!, role: 'friend' };
    expect(problems([two])).toEqual([expect.stringContaining('exactly one speaker')]);
    expect(problems([voicemail(2)])[0]).toContain('a monologue needs 3 to 10');
    expect(problems([voicemail(11)])[0]).toContain('a monologue needs 3 to 10');
    expect(problems([voicemail(4)])).toEqual([expect.stringContaining('24 words')]);
    const long = voicemail(10);
    long.lines[0] = { ...long.lines[0]!, en: Array.from({ length: 70 }, () => 'word').join(' ') };
    expect(problems([long])).toEqual([expect.stringContaining('124 words')]);
  });

  it('keeps tables off a monologue', () => {
    const table = {
      rows: [
        ['Day', 'Time'],
        ['Monday', '9 am'],
      ],
    };
    expect(problems([voicemail(5, { table })])).toEqual([
      expect.stringContaining('only a conversation may have a table'),
    ]);
  });

  it('marks the questions as a monologue', () => {
    const qs = talkQuestions(unit([]), task({ talks: [voicemail(5) as TalkItem] }), makeRng(1));
    expect(qs.every((q) => q.monologue === true && q.speakers.length === 1)).toBe(true);
    const plain = talkQuestions(unit([]), task({ talks: [talk()] }), makeRng(1));
    expect(plain.every((q) => !('monologue' in q) && !('table' in q))).toBe(true);
  });
});

describe('talks with a table (聽對話答題加圖表)', () => {
  const table = {
    title: 'Shipping times',
    rows: [
      ['Order', 'Ships'],
      ['Lamps', 'Monday'],
      ['Desks', 'next week'],
    ],
  };

  it('accepts a title and 2 to 5 rows of 2 to 4 short cells, carried by every question', () => {
    expect(with_({ table })).toEqual([]);
    expect(
      with_({
        table: {
          rows: [
            ['a', 'b', 'c', 'd'],
            ['1', '2', '3', '4'],
          ],
        },
      }),
    ).toEqual([]);
    const qs = talkQuestions(unit([]), task({ talks: [talk({ table })] }), makeRng(1));
    expect(qs.map((q) => q.table)).toEqual([table, table]);
  });

  it('rejects bad tables', () => {
    expect(with_({ table: 'x' })[0]).toContain('must be an object');
    expect(with_({ table: { ...table, title: '' } })[0]).toContain('empty title');
    expect(with_({ table: { ...table, color: 'red' } })[0]).toContain('unknown field "color"');
    expect(with_({ table: { rows: [['a', 'b']] } })[0]).toContain('2 to 5 rows');
    const six = Array.from({ length: 6 }, () => ['a', 'b']);
    expect(with_({ table: { rows: six } })[0]).toContain('2 to 5 rows');
    expect(with_({ table: { rows: [['a'], ['b']] } })[0]).toContain('2 to 4 cells');
    expect(
      with_({
        table: {
          rows: [
            ['a', 'b', 'c', 'd', 'e'],
            ['1', '2', '3', '4', '5'],
          ],
        },
      }),
    ).not.toEqual([]);
    expect(
      with_({
        table: {
          rows: [
            ['a', 'b'],
            ['1', '2', '3'],
          ],
        },
      })[0],
    ).toContain('every row needs 2');
    expect(
      with_({
        table: {
          rows: [
            ['a', ''],
            ['1', '2'],
          ],
        },
      })[0],
    ).toContain('empty');
    expect(
      with_({
        table: {
          rows: [
            ['a', 'one two three four'],
            ['1', '2'],
          ],
        },
      })[0],
    ).toContain('longer than 3 words');
  });
});

describe('talk limits from Act 3 on', () => {
  const late = (): TaskCheckContext => ({ ...context(), act: 3 });
  const eight = Array.from({ length: 8 }, (_, i) => line(i % 2, { id: `e${i}` }));
  const nine = Array.from({ length: 9 }, (_, i) => line(i % 2, { id: `n${i}` }));

  it('lets a conversation have up to 8 lines in Act 3, 6 before', () => {
    expect(checkTalks({ talks: [{ ...talk(), lines: eight }] }, late())).toEqual([]);
    expect(checkTalks({ talks: [{ ...talk(), lines: nine }] }, late())[0]).toContain('3 to 8');
    expect(
      checkTalks({ talks: [{ ...talk(), lines: eight }] }, { ...context(), act: 2 })[0],
    ).toContain('3 to 6');
    expect(with_({ lines: eight })[0]).toContain('3 to 6');
  });

  it('gets the act from the unit in validateUnit', () => {
    const acts = [
      { no: '一', title: 'a', places: [] },
      { no: '二', title: 'b', places: [] },
      { no: '三', title: 'c', places: [{ title: 'u', unitId: 'u' }] },
    ];
    const long = unit([talk({ lines: eight as TalkItem['lines'] })]);
    // The unit is in Act 3 here, so it is told it needs 9 tasks, but its 8 lines are fine.
    const act3 = validateUnit(long, acts);
    expect(act3).toContainEqual(expect.stringContaining('has 1 tasks'));
    expect(act3.filter((p) => p.includes('lines'))).toEqual([]);
    expect(validateUnit(long)).toEqual([expect.stringContaining('3 to 6')]);
  });
});
