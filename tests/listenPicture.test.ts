import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPicture } from '../src/art/pictures';
import { isValidAudioId } from '../src/audio/voices';
import { unitToAudioItems } from '../src/content/audioItems';
import type { TaskCheckContext } from '../src/content/checks/common';
import {
  checkPictures,
  LISTEN_PICTURE_OPTIONS,
  LISTEN_PICTURE_ROLE,
  pictureOptionAudioId,
} from '../src/content/checks/pictures';
import type { PictureItem, Task, Unit } from '../src/content/types';
import { questionTexts } from '../src/content/vocab';
import { pictureQuestions } from '../src/learning/gen/pictures';
import { makeRng } from '../src/learning/questionGen';
import { NO_ITEM } from '../src/learning/questions';
import {
  GAP_MS,
  keyState,
  OPTION_LETTERS,
  optionLines,
  playInTurn,
  statusText,
} from '../src/ui/minigames/ListenPicture';
import { LEAD_IN_MS, type ConversationDeps } from '../src/ui/minigames/Talk';

const listenItem = (over: Partial<PictureItem> = {}): PictureItem => ({
  id: 'p1',
  pictureId: 'presenter_chart',
  options: [
    { en: "She's pointing at the screen.", zh: '她指著螢幕。' },
    { en: "She's turning off the screen.", zh: '她在關螢幕。' },
    { en: "She's sitting at a desk.", zh: '她坐在桌前。' },
    { en: "She's reading a book.", zh: '她在看書。' },
  ],
  answer: 0,
  listen: true,
  ...over,
});

const context = (act = 4): TaskCheckContext => {
  const spaces = new Map<string, Set<string>>();
  return {
    seen: (kind) => spaces.get(kind) ?? spaces.set(kind, new Set()).get(kind)!,
    taughtChunks: new Set(),
    isRole: () => true,
    act,
  };
};
const problems = (pictures: unknown, act = 4) => checkPictures({ pictures }, context(act));

const task = (over: Partial<Task> = {}): Task => ({
  id: 't5',
  title: 't',
  newChunkIds: [],
  newWordIds: [],
  scene: [],
  ...over,
});
const unit = (pictures: PictureItem[]): Unit => ({
  id: 'presentation',
  title: 'u',
  titleEn: 'u',
  chunks: [],
  words: [],
  tasks: [task({ pictures })],
});

describe('checkPictures: sound options (看圖選句聲音選項)', () => {
  it('accepts a listen item with exactly 4 sentences in Act 4', () => {
    expect(problems([listenItem()])).toEqual([]);
    expect(problems([listenItem(), listenItem({ id: 'p2', answer: 3 })])).toEqual([]);
  });

  it('is for Act 4 units only', () => {
    expect(problems([listenItem()], 3)).toEqual([
      expect.stringContaining('which is for Act 4 units only'),
    ]);
    expect(problems([listenItem()], 0)).toEqual([
      expect.stringContaining('which is for Act 4 units only'),
    ]);
  });

  it(`needs exactly ${LISTEN_PICTURE_OPTIONS} sentences`, () => {
    const three = listenItem().options.slice(0, 3);
    expect(problems([listenItem({ options: three })])).toEqual([
      expect.stringContaining('needs exactly 4 (has 3)'),
    ]);
    // Without listen, 2 to 4 sentences are still fine in any act.
    expect(problems([{ ...listenItem({ options: three }), listen: undefined }], 1)).toEqual([]);
  });

  it('rejects a listen flag that is not true, and a bad answer', () => {
    expect(problems([{ ...listenItem(), listen: 'yes' }])).toEqual([
      expect.stringContaining('bad listen "yes"'),
    ]);
    expect(problems([listenItem({ answer: 4 })])).toEqual([expect.stringContaining('bad answer')]);
  });

  it('keeps the old messages for plain pictures', () => {
    const plain = { ...listenItem(), listen: undefined };
    expect(problems([plain, plain], 1)).toEqual(['duplicate picture id "p1"']);
    expect(problems([], 1)).toEqual(['pictures must be a non-empty list']);
  });

  it('has the three Act 4 pictures drawn', () => {
    for (const id of ['presenter_chart', 'meeting_table', 'speaker_microphone']) {
      expect(getPicture(id), id).toBeDefined();
    }
  });
});

describe('pictureQuestions with sound options', () => {
  it('gives every option its own clip and marks the question as heard', () => {
    const [q] = pictureQuestions(
      unit([listenItem()]),
      task({ pictures: [listenItem()] }),
      makeRng(1),
    );
    expect(q).toMatchObject({
      kind: 'picture',
      pictureId: 'presenter_chart',
      listen: true,
      correctId: 'o0',
      audioId: 'presentation.pictureopt.p1_0',
      itemId: NO_ITEM,
    });
    const byId = Object.fromEntries(q!.options.map((o) => [o.id, o.audioId]));
    expect(byId).toEqual({
      o0: 'presentation.pictureopt.p1_0',
      o1: 'presentation.pictureopt.p1_1',
      o2: 'presentation.pictureopt.p1_2',
      o3: 'presentation.pictureopt.p1_3',
    });
  });

  it('leaves plain pictures as they were: no listen, no option clips', () => {
    const plain = { ...listenItem(), listen: undefined };
    const [q] = pictureQuestions(unit([plain]), task({ pictures: [plain] }), makeRng(1));
    expect(q).not.toHaveProperty('listen');
    expect(q?.audioId).toBe('presentation.picture.p1');
    for (const o of q!.options) expect(o).not.toHaveProperty('audioId');
  });

  it('shuffles the options, deterministically for a seed', () => {
    const run = (seed: number) =>
      pictureQuestions(unit([listenItem()]), task({ pictures: [listenItem()] }), makeRng(seed));
    expect(run(5)).toEqual(run(5));
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) =>
        run(s)[0]!
          .options.map((o) => o.id)
          .join(),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('sound-option audio and words', () => {
  it('speaks all 4 sentences by the announcer, and no guide clip', () => {
    const items = unitToAudioItems(unit([listenItem()]));
    expect(items).toEqual(
      listenItem().options.map((o, i) => ({
        id: pictureOptionAudioId('presentation', 'p1', i),
        text: o.en,
        role: LISTEN_PICTURE_ROLE,
      })),
    );
    expect(LISTEN_PICTURE_ROLE).toBe('announcer');
    expect(items.every((i) => isValidAudioId(i.id))).toBe(true);
  });

  it('takes every sentence into questionTexts', () => {
    expect(questionTexts(task({ pictures: [listenItem()] })).map((l) => l.en)).toEqual(
      listenItem().options.map((o) => o.en),
    );
  });
});

describe('ListenPicture screen logic', () => {
  const question = () =>
    pictureQuestions(unit([listenItem()]), task({ pictures: [listenItem()] }), makeRng(1))[0]!;

  it('marks only the right key and a wrong pick, and nothing before answering', () => {
    expect(['o0', 'o1', 'o2'].map((id) => keyState(id, 'o0', null))).toEqual(['', '', '']);
    expect(['o0', 'o1', 'o2'].map((id) => keyState(id, 'o0', 'o1'))).toEqual([
      'right',
      'wrong',
      '',
    ]);
    expect(['o0', 'o1'].map((id) => keyState(id, 'o0', 'o0'))).toEqual(['right', '']);
  });

  it('names the sentence playing, or how to use the keys', () => {
    expect(statusText(1, 4)).toBe('正在播 B（2／4）');
    expect(statusText(-1, 4)).toContain('♪');
    expect(OPTION_LETTERS).toEqual(['A', 'B', 'C', 'D']);
  });

  it('turns the options into announcer lines in the order shown', () => {
    const q = question();
    const lines = optionLines(q);
    expect(lines.map((l) => l.audioId)).toEqual(q.options.map((o) => o.audioId));
    expect(lines.every((l) => l.role === LISTEN_PICTURE_ROLE)).toBe(true);
  });

  describe('playInTurn', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** Every clip lasts 1 s; logs when each starts and what the screen is told. */
    const world = () => {
      const t0 = Date.now();
      const log: string[] = [];
      const deps: ConversationDeps = {
        play: async (line) => {
          log.push(`play ${line.audioId} @${Date.now() - t0}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        },
        speechBusy: () => false,
        stop: () => log.push('stop'),
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        now: () => Date.now(),
      };
      return { deps, log };
    };

    it('plays A to D, each after the one before has ended, lighting each key while it plays', async () => {
      const lines = optionLines(question());
      const { deps, log } = world();
      const lit: number[] = [];
      const done = playInTurn(
        lines,
        (i) => lit.push(i),
        () => false,
        deps,
      );
      await vi.runAllTimersAsync();
      expect(await done).toBe(true);
      expect(lit).toEqual([0, -1, 1, -1, 2, -1, 3, -1]);
      const step = LEAD_IN_MS + 1000 + GAP_MS;
      expect(log).toEqual(lines.map((l, i) => `play ${l.audioId} @${LEAD_IN_MS + i * step}`));
    });

    it('stops at once when cancelled (a replay, a pick, or leaving the question)', async () => {
      const lines = optionLines(question());
      const { deps, log } = world();
      let cancel = false;
      const lit: number[] = [];
      const done = playInTurn(
        lines,
        (i) => {
          lit.push(i);
          if (i === 1) cancel = true;
        },
        () => cancel,
        deps,
      );
      await vi.runAllTimersAsync();
      expect(await done).toBe(false);
      expect(lit).toEqual([0, -1, 1]);
      expect(log).toHaveLength(2);
    });
  });
});
