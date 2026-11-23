import { describe, expect, it } from 'vitest';
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
