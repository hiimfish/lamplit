/**
 * The 聽力加量 line loop: phases, waits, scoring, errors and the privacy note. Everything
 * is injected, so the tests run it with fake timers, a fake clock and hand-resolved promises.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScoredListening } from '../src/audio/recognize';
import type { SpokenScore } from '../src/learning/spokenScore';
import { classifyListenError, ListenLoop } from '../src/ui/listenLoop';
import type { ListenLoopSnapshot, LoopDeps, LoopLine } from '../src/ui/listenLoop';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms);

/** Five words each: 1,600 ms of browser speech. */
const LINES: LoopLine[] = [
  { audioId: 'u.a', text: 'Good morning how are you' },
  { audioId: 'u.b', text: 'I am fine thank you' },
  { audioId: 'u.c', text: 'Can I have a coffee' },
  { audioId: 'u.d', text: 'Sure that is two dollars' },
];

function score(n: number): SpokenScore {
  return { score: n, level: 'mostly', marks: [] };
}

function setup(options: { noteSeen?: boolean; lines?: LoopLine[] } = {}) {
  const plays: { audioId: string; speed: string; done: ReturnType<typeof deferred<void>> }[] = [];
  const listens: {
    timeoutMs: number;
    result: ReturnType<typeof deferred<string[]>>;
    abort: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  const advances: number[] = [];
  const snapshots: ListenLoopSnapshot[] = [];
  let seen = options.noteSeen ?? true;
  const scoreSpoken = vi.fn((target: string, alts: readonly string[]): SpokenScore | null => {
    void target;
    const n = Number(alts[0]);
    return Number.isNaN(n) ? score(80) : score(n);
  });
  const deps: LoopDeps = {
    play: vi.fn((audioId, opts) => {
      const done = deferred<void>();
      plays.push({ audioId, speed: opts.speed, done });
      return done.promise;
    }),
    stopAudio: vi.fn(),
    listen: vi.fn(({ timeoutMs }) => {
      const result = deferred<string[]>();
      const abort = vi.fn();
      const stop = vi.fn();
      listens.push({ timeoutMs, result, abort, stop });
      return { promise: result.promise, abort, stop } satisfies ScoredListening;
    }),
    scoreSpoken,
    now: () => Date.now(),
    noteSeen: () => seen,
    markNoteSeen: vi.fn(() => {
      seen = true;
    }),
    onAdvance: (index) => void advances.push(index),
  };
  const loop = new ListenLoop((s) => snapshots.push(s), deps);
  loop.setLines(options.lines ?? LINES);
  /** Ends the newest play after `after` ms of "audio". */
  const endPlay = async (after = 0) => {
    await tick(after);
    plays[plays.length - 1]!.done.resolve();
    await tick(0);
  };
  const last = () => snapshots[snapshots.length - 1]!;
  return { loop, deps, plays, listens, advances, snapshots, scoreSpoken, endPlay, last };
}

/** Plays line 0 with 跟著說 on and a usable microphone; stops when it is listening. */
async function listening(t: ReturnType<typeof setup>, index = 0) {
  t.loop.setShadow(true);
  t.loop.play(index);
  await t.endPlay();
  await tick(1600);
  expect(t.loop.state).toBe('listening');
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('classifyListenError', () => {
  const cases: [unknown, string][] = [
    [{ code: 'not-allowed' }, 'denied'],
    [{ code: 'service-not-allowed' }, 'denied'],
    [{ code: 'gesture' }, 'gesture'],
    [{ code: 'not-allowed', message: 'needs a user gesture' }, 'denied'],
    [Object.assign(new Error('requires user gesture'), { code: 'not-allowed' }), 'gesture'],
    [{ code: 'audio-capture' }, 'no-mic'],
    [{ code: 'insecure' }, 'insecure'],
    [{ code: 'unsupported' }, 'unsupported'],
    [{ code: 'network' }, 'network'],
    [{ code: 'aborted' }, 'aborted'],
    [new Error('network'), 'network'],
    [{ code: 'timeout' }, 'other'],
    [{ code: 'failed' }, 'other'],
    [undefined, 'other'],
    [null, 'other'],
    ['boom', 'other'],
  ];
  it.each(cases)('maps %j to %s', (err, kind) => {
    expect(classifyListenError(err)).toBe(kind);
  });
});

describe('after a line, 跟著說 off', () => {
  it('plays the line, then waits 900 ms and advances', async () => {
    const t = setup();
    t.loop.play(0);
    expect(t.loop.state).toBe('playing');
    expect(t.plays[0]).toMatchObject({ audioId: 'u.a', speed: 'normal' });
    await t.endPlay();
    expect(t.loop.state).toBe('gap');
    await tick(899);
    expect(t.advances).toEqual([]);
    await tick(1);
    expect(t.advances).toEqual([0]);
    expect(t.loop.state).toBe('idle');
    expect(t.deps.listen).not.toHaveBeenCalled();
  });

  it('does not advance with 自動 off until it is turned on', async () => {
    const t = setup();
    t.loop.setAuto(false);
    t.loop.play(0);
    await t.endPlay();
    await tick(5000);
    expect(t.advances).toEqual([]);
    t.loop.setAuto(true);
    expect(t.advances).toEqual([0]);
  });

  it('plays a slow replay at slow speed', () => {
    const t = setup();
    t.loop.play(1, true);
    expect(t.plays[0]!.speed).toBe('slow');
  });

  it('ignores an index with no line', () => {
    const t = setup();
    t.loop.play(9);
    expect(t.deps.play).not.toHaveBeenCalled();
    expect(t.loop.state).toBe('idle');
  });
});

describe('跟著說 on, microphone not usable (the pause)', () => {
  it('pauses took + 1200 ms after declining the note', async () => {
    const t = setup({ noteSeen: false });
    t.loop.setShadow(true);
    t.loop.decline();
    t.loop.play(0);
    await t.endPlay(2000);
    expect(t.loop.state).toBe('gap');
    await tick(3199);
    expect(t.advances).toEqual([]);
    await tick(1);
    expect(t.advances).toEqual([0]);
    expect(t.deps.listen).not.toHaveBeenCalled();
  });
});

describe('跟著說 on, microphone usable', () => {
  it('waits words x 320 ms when the audio ends at once, then listens by itself', async () => {
    const t = setup();
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay();
    expect(t.loop.state).toBe('gap');
    await tick(1599);
    expect(t.deps.listen).not.toHaveBeenCalled();
    await tick(1);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
    expect(t.loop.state).toBe('listening');
  });

  it('counts the time the audio already took toward that wait', async () => {
    const t = setup();
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay(1000);
    await tick(599);
    expect(t.deps.listen).not.toHaveBeenCalled();
    await tick(1);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it('listens at once when the audio lasted longer than the words need', async () => {
    const t = setup();
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay(4000);
    await tick(0);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it.each([
    [320, 6000, 'a short line is clamped up to 6 s'],
    [1600, 6200, '2 x took + 3 s'],
    [10000, 15000, 'a long line is clamped down to 15 s'],
  ])('listens for clamp(2 x took + 3000): took %i ms -> %i ms (%s)', async (took, limit) => {
    const t = setup({ lines: [{ audioId: 'u.x', text: took === 320 ? 'Hello' : 'a b c d e' }] });
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay(took === 10000 ? 10000 : 0);
    await tick(1600);
    expect(t.listens[0]!.timeoutMs).toBe(limit);
  });
});

describe('scoring and the hold', () => {
  it('shows the score, holds 1800 ms at 70 or more, then advances', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve(['70']);
    await tick(0);
    expect(t.loop.state).toBe('scored');
    expect(t.last().score?.score).toBe(70);
    await tick(1799);
    expect(t.advances).toEqual([]);
    await tick(1);
    expect(t.advances).toEqual([0]);
  });

  it('holds 3500 ms below 70', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve(['69']);
    await tick(3499);
    expect(t.advances).toEqual([]);
    await tick(1);
    expect(t.advances).toEqual([0]);
  });

  it('keeps the score on screen and waits when 自動 is off', async () => {
    const t = setup();
    t.loop.setAuto(false);
    await listening(t);
    t.listens[0]!.result.resolve(['90']);
    await tick(10000);
    expect(t.loop.state).toBe('scored');
    expect(t.advances).toEqual([]);
  });

  it('passes the line text and every alternative to scoreSpoken', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve(['good morning', 'good mourning']);
    await tick(0);
    expect(t.scoreSpoken).toHaveBeenCalledWith('Good morning how are you', [
      'good morning',
      'good mourning',
    ]);
  });
});

describe('silence', () => {
  it('says nothing was heard, does not count the line and advances', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve([]);
    await tick(0);
    expect(t.last()).toMatchObject({ phase: 'scored', score: null, note: '沒有聽到聲音。' });
    expect(t.last().scoredLines).toBe(0);
    expect(t.scoreSpoken).not.toHaveBeenCalled();
    await tick(1800);
    expect(t.advances).toEqual([0]);
  });

  it('treats a null score as silence too', async () => {
    const t = setup();
    t.scoreSpoken.mockReturnValueOnce(null);
    await listening(t);
    t.listens[0]!.result.resolve(['mumble']);
    await tick(0);
    expect(t.last().note).toBe('沒有聽到聲音。');
    expect(t.last().scoredLines).toBe(0);
  });

  it('turns 跟著說 off after three silent lines in a row', async () => {
    const t = setup();
    for (let i = 0; i < 3; i += 1) {
      await listening(t, i);
      t.listens[i]!.result.resolve([]);
      await tick(0);
      if (i < 2) expect(t.last().shadow).toBe(true);
      await tick(1800);
    }
    expect(t.last()).toMatchObject({
      shadow: false,
      micOn: false,
      note: '一直沒聽到聲音，先關掉跟著說。',
    });
  });

  it('a heard line between resets the silent count', async () => {
    const t = setup({ lines: [...LINES, ...LINES] });
    const results = [[], ['80'], [], []];
    for (let i = 0; i < 4; i += 1) {
      await listening(t, i);
      t.listens[i]!.result.resolve(results[i]!);
      await tick(5000);
    }
    expect(t.last().shadow).toBe(true);
  });
});

describe('errors', () => {
  it('not-allowed on the automatic start goes to ready, and stays tap-to-speak', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code: 'not-allowed' });
    await tick(0);
    expect(t.loop.state).toBe('ready');
    expect(t.last()).toMatchObject({ tapToSpeak: true, micOn: true });
    await tick(20000);
    expect(t.advances).toEqual([]);
    // The next line waits for 說 too, with no automatic listen.
    t.loop.play(1);
    await t.endPlay();
    await tick(1600);
    expect(t.loop.state).toBe('ready');
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it('speak() from ready starts listening; a refusal then turns the mic off', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code: 'not-allowed' });
    await tick(0);
    t.loop.speak();
    expect(t.loop.state).toBe('listening');
    t.listens[1]!.result.reject({ code: 'not-allowed' });
    await tick(0);
    expect(t.last()).toMatchObject({
      micOn: false,
      note: '沒有麥克風權限，跟著說只會每句停一下。',
    });
    await tick(1199);
    expect(t.advances).toEqual([]);
    await tick(1);
    expect(t.advances).toEqual([0]);
  });

  it('speak() from ready can score', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code: 'gesture' });
    await tick(0);
    t.loop.speak();
    t.listens[1]!.result.resolve(['85']);
    await tick(0);
    expect(t.last()).toMatchObject({ phase: 'scored', scoredLines: 1 });
  });

  it.each([
    ['audio-capture', '找不到麥克風，跟著說只會每句停一下。'],
    ['insecure', '辨識需要 https，跟著說只會每句停一下。'],
    ['unsupported', '這個瀏覽器不能辨識，跟著說只會每句停一下。'],
  ])('%s turns the mic off for this mount with a note and a timed pause', async (code, note) => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code });
    await tick(0);
    expect(t.last()).toMatchObject({ micOn: false, note, shadow: true });
    await tick(1200);
    expect(t.advances).toEqual([0]);
    // Later lines only pause (took + 1200), no listening and the note stays.
    t.loop.play(1);
    await t.endPlay();
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
    expect(t.last().note).toBe(note);
  });

  it('a listen that throws is handled like a rejection', async () => {
    const t = setup();
    vi.mocked(t.deps.listen).mockImplementationOnce(() => {
      throw { code: 'unsupported' };
    });
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay();
    await tick(1600);
    expect(t.last().micOn).toBe(false);
  });

  it('one network failure notes it and moves on; two in a row turn the mic off', async () => {
    const t = setup();
    await listening(t, 0);
    t.listens[0]!.result.reject({ code: 'network' });
    await tick(0);
    expect(t.last()).toMatchObject({ micOn: true, note: '網路不通，這句沒有辨識。' });
    await tick(900);
    expect(t.advances).toEqual([0]);
    await listening(t, 1);
    t.listens[1]!.result.reject({ code: 'network' });
    await tick(0);
    expect(t.last()).toMatchObject({
      micOn: false,
      note: '網路一直不通，跟著說只會每句停一下。',
    });
  });

  it('a success between two network failures resets the count', async () => {
    const t = setup();
    const outcomes: ('net' | 'ok')[] = ['net', 'ok', 'net'];
    for (let i = 0; i < 3; i += 1) {
      await listening(t, i);
      if (outcomes[i] === 'net') t.listens[i]!.result.reject({ code: 'network' });
      else t.listens[i]!.result.resolve(['80']);
      await tick(5000);
    }
    expect(t.last().micOn).toBe(true);
  });

  it('ignores an aborted rejection', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code: 'aborted' });
    await tick(10000);
    expect(t.advances).toEqual([]);
    expect(t.last().micOn).toBe(true);
    expect(t.last().note).toBeUndefined();
  });

  it('an unknown error moves on after the short gap without a note', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.reject({ code: 'timeout' });
    await tick(900);
    expect(t.advances).toEqual([0]);
    expect(t.last().note).toBeUndefined();
  });
});

describe('speak()', () => {
  it('while listening it means 說完了 and stops the recognizer', async () => {
    const t = setup();
    await listening(t);
    t.loop.speak();
    expect(t.listens[0]!.stop).toHaveBeenCalledTimes(1);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it('after a score it listens again and replaces the hold', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve(['60']);
    await tick(0);
    t.loop.speak();
    expect(t.loop.state).toBe('listening');
    await tick(10000);
    expect(t.advances).toEqual([]);
    t.listens[1]!.result.resolve(['95']);
    await tick(0);
    expect(t.last().score?.score).toBe(95);
    expect(t.last().scoredLines).toBe(1);
  });

  it('during the wait before listening it listens at once', async () => {
    const t = setup();
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay();
    t.loop.speak();
    expect(t.loop.state).toBe('listening');
    await tick(5000);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it('does nothing while playing, with the mic unusable, or before any line', async () => {
    const t = setup();
    t.loop.speak();
    t.loop.setShadow(true);
    t.loop.play(0);
    t.loop.speak();
    expect(t.deps.listen).not.toHaveBeenCalled();
    const off = setup();
    off.loop.play(0);
    await off.endPlay();
    off.loop.speak();
    expect(off.deps.listen).not.toHaveBeenCalled();
  });
});

describe('generations', () => {
  it('a superseded play never advances', async () => {
    const t = setup();
    t.loop.play(0);
    t.loop.play(1);
    t.plays[0]!.done.resolve();
    await tick(5000);
    expect(t.advances).toEqual([]);
    expect(t.loop.state).toBe('playing');
    t.plays[1]!.done.resolve();
    await tick(900);
    expect(t.advances).toEqual([1]);
  });

  it('halt() during a play stops audio, never advances and does not score', async () => {
    const t = setup();
    t.loop.play(0);
    t.loop.halt();
    t.plays[0]!.done.resolve();
    await tick(5000);
    expect(t.advances).toEqual([]);
    expect(t.loop.state).toBe('idle');
    expect(t.deps.stopAudio).toHaveBeenCalled();
  });

  it('halt() while listening aborts the recognizer and drops its result', async () => {
    const t = setup();
    await listening(t);
    t.loop.halt();
    expect(t.listens[0]!.abort).toHaveBeenCalledTimes(1);
    t.listens[0]!.result.resolve(['99']);
    await tick(5000);
    expect(t.scoreSpoken).not.toHaveBeenCalled();
    expect(t.advances).toEqual([]);
    expect(t.loop.summary()).toBeUndefined();
  });

  it('halt() during the hold cancels the advance', async () => {
    const t = setup();
    await listening(t);
    t.listens[0]!.result.resolve(['90']);
    await tick(0);
    t.loop.halt();
    await tick(5000);
    expect(t.advances).toEqual([]);
  });

  it('a new play while listening aborts the old listen', async () => {
    const t = setup();
    await listening(t);
    t.loop.play(1);
    expect(t.listens[0]!.abort).toHaveBeenCalledTimes(1);
    t.listens[0]!.result.resolve(['99']);
    await tick(0);
    expect(t.scoreSpoken).not.toHaveBeenCalled();
  });

  it('replaying an older line scores it and advances from the newest line', async () => {
    const t = setup();
    t.loop.play(0);
    await t.endPlay();
    await tick(900);
    t.loop.play(1);
    await t.endPlay();
    await tick(900);
    expect(t.advances).toEqual([0, 1]);
    t.loop.setShadow(true);
    t.loop.play(0);
    await t.endPlay();
    await tick(1600);
    t.listens[0]!.result.resolve(['88']);
    await tick(1800);
    expect(t.last().index).toBe(0);
    expect(t.advances).toEqual([0, 1, 1]);
  });
});

describe('switching 跟著說 while a line is on hand', () => {
  it('turning it off while listening aborts and falls back to the short gap', async () => {
    const t = setup();
    await listening(t);
    t.loop.setShadow(false);
    expect(t.listens[0]!.abort).toHaveBeenCalledTimes(1);
    expect(t.loop.state).toBe('gap');
    await tick(900);
    expect(t.advances).toEqual([0]);
  });

  it('turning it on during the 900 ms gap switches to listening', async () => {
    const t = setup();
    t.loop.play(0);
    await t.endPlay();
    t.loop.setShadow(true);
    await tick(1600);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
    expect(t.advances).toEqual([]);
  });

  it('turning it on while a line plays takes effect when the line ends', async () => {
    const t = setup();
    t.loop.play(0);
    t.loop.setShadow(true);
    await t.endPlay();
    await tick(1600);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });
});

describe('privacy note', () => {
  it('shows the note on the first 跟著說 and stays off until answered', async () => {
    const t = setup({ noteSeen: false });
    t.loop.play(0);
    t.loop.setShadow(true);
    expect(t.loop.state).toBe('confirm');
    expect(t.last().shadow).toBe(false);
    t.plays[0]!.done.resolve();
    await tick(5000);
    expect(t.advances).toEqual([]);
  });

  it('confirm() remembers it, turns 跟著說 on and replays the line', async () => {
    const t = setup({ noteSeen: false });
    t.loop.play(0);
    t.loop.setShadow(true);
    t.loop.confirm();
    expect(t.deps.markNoteSeen).toHaveBeenCalledTimes(1);
    expect(t.last()).toMatchObject({ shadow: true, micOn: true, phase: 'playing' });
    expect(t.plays).toHaveLength(2);
    await t.endPlay();
    await tick(1600);
    expect(t.deps.listen).toHaveBeenCalledTimes(1);
  });

  it('decline() keeps the pause mode with the note and does not remember', async () => {
    const t = setup({ noteSeen: false });
    t.loop.play(0);
    t.loop.setShadow(true);
    t.loop.decline();
    expect(t.deps.markNoteSeen).not.toHaveBeenCalled();
    expect(t.last()).toMatchObject({
      shadow: true,
      micOn: false,
      note: '不辨識也可以，每句後面會停一下讓你唸。',
    });
    await t.endPlay();
    await tick(2800);
    expect(t.advances).toEqual([0]);
    expect(t.deps.listen).not.toHaveBeenCalled();
  });

  it('confirm() and decline() do nothing outside the note', () => {
    const t = setup();
    t.loop.confirm();
    t.loop.decline();
    expect(t.deps.markNoteSeen).not.toHaveBeenCalled();
    expect(t.snapshots).toHaveLength(1);
  });

  it('does not ask again once seen', () => {
    const t = setup({ noteSeen: true });
    t.loop.setShadow(true);
    expect(t.loop.state).toBe('idle');
    expect(t.last().shadow).toBe(true);
  });
});

describe('summary', () => {
  async function scoreLines(t: ReturnType<typeof setup>, scores: string[]) {
    for (let i = 0; i < scores.length; i += 1) {
      await listening(t, i);
      t.listens[i]!.result.resolve([scores[i]!]);
      await tick(5000);
    }
  }

  it('needs max(3, ceil(sceneLines / 2)) scored lines', async () => {
    const t = setup();
    await scoreLines(t, ['90', '80']);
    expect(t.loop.summary()).toBeUndefined();
    await scoreLines(t, []);
    await listening(t, 2);
    t.listens[2]!.result.resolve(['70']);
    await tick(0);
    expect(t.loop.summary()).toEqual({ lines: 3, score: 80 });
  });

  it('scales with a long scene', async () => {
    const many: LoopLine[] = Array.from({ length: 10 }, (_, i) => ({
      audioId: `u.${i}`,
      text: 'one two three four five',
    }));
    const t = setup({ lines: many });
    await scoreLines(t, ['100', '100', '100', '100']);
    expect(t.loop.summary()).toBeUndefined();
    await listening(t, 4);
    t.listens[4]!.result.resolve(['91']);
    await tick(0);
    expect(t.loop.summary()).toEqual({ lines: 5, score: 98 });
  });

  it('counts a line once, with its latest score, and leaves silent lines out', async () => {
    const t = setup();
    await listening(t, 0);
    t.listens[0]!.result.resolve(['50']);
    await tick(0);
    t.loop.speak();
    t.listens[1]!.result.resolve(['90']);
    await tick(0);
    expect(t.last().scoredLines).toBe(1);
    t.loop.speak();
    t.listens[2]!.result.resolve([]);
    await tick(0);
    expect(t.last().scoredLines).toBe(1);
  });

  it('setLines() starts the tally over', async () => {
    const t = setup();
    await scoreLines(t, ['90', '90', '90']);
    expect(t.loop.summary()).toBeDefined();
    t.loop.setLines(LINES);
    expect(t.loop.summary()).toBeUndefined();
    expect(t.last().scoredLines).toBe(0);
  });
});

describe('dispose', () => {
  it('stops everything and silences later callbacks', async () => {
    const t = setup();
    await listening(t);
    const seen = t.snapshots.length;
    t.loop.dispose();
    expect(t.listens[0]!.abort).toHaveBeenCalledTimes(1);
    t.listens[0]!.result.resolve(['90']);
    await tick(10000);
    expect(t.snapshots).toHaveLength(seen);
    expect(t.advances).toEqual([]);
    t.loop.play(1);
    t.loop.speak();
    t.loop.setShadow(false);
    expect(t.deps.play).toHaveBeenCalledTimes(1);
    expect(t.snapshots).toHaveLength(seen);
  });

  it('a play that ends after dispose does nothing', async () => {
    const t = setup();
    t.loop.play(0);
    t.loop.dispose();
    t.plays[0]!.done.resolve();
    await tick(5000);
    expect(t.advances).toEqual([]);
  });
});
