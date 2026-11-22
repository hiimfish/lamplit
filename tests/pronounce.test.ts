import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAudioContext, type FakeNode } from './fakeAudio';

const fake = vi.hoisted(() => ({
  manager: null as null | {
    ctx: AudioContext;
    voice: unknown;
    voiceStarted: () => void;
    voiceEnded: () => void;
  },
  speak: vi.fn(),
}));

vi.mock('../src/audio/AudioManager', () => ({ getAudioManager: () => fake.manager }));
vi.mock('../src/audio/browserSpeech', () => ({ speakWithBrowser: fake.speak }));

type Module = typeof import('../src/audio/pronounce');

let ctx: FakeAudioContext;
let mod: Module;
let fetchMock: ReturnType<typeof vi.fn>;
let started: number;
let ended: number;

const okResponse = () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

beforeEach(async () => {
  vi.resetModules();
  ctx = new FakeAudioContext();
  started = 0;
  ended = 0;
  fake.manager = {
    ctx: ctx.asContext(),
    voice: ctx.createGain(),
    voiceStarted: () => (started += 1),
    voiceEnded: () => (ended += 1),
  };
  fake.speak.mockReset();
  fetchMock = vi.fn(async () => okResponse());
  vi.stubGlobal('fetch', fetchMock);
  mod = await import('../src/audio/pronounce');
});

afterEach(() => {
  mod.stopAudio();
  vi.unstubAllGlobals();
  fake.manager = null;
});

function sources(): FakeNode[] {
  return ctx.nodes('source');
}

/** Ends the most recent clip as if it finished playing. */
function endClip(): void {
  sources().at(-1)?.onended?.();
}

describe('clip ids', () => {
  it('accepts <unit>.<kind>.<id> and bare ids', () => {
    expect(mod.clipUrl('cafe.word.latte')).toMatch(/audio\/\w+\/cafe\.word\.latte\.normal\.mp3$/);
    expect(mod.isValidAudioId('cafe.chunk.can_i_get')).toBe(true);
    expect(mod.isValidAudioId('latte')).toBe(true);
  });

  it.each(['../../src', 'cafe/word', 'a#b', 'a?b', 'Cafe.word.latte', 'a.b', '', 'a.word.b.c'])(
    'refuses %j',
    (id) => {
      expect(mod.isValidAudioId(id)).toBe(false);
      expect(() => mod.clipUrl(id)).toThrow(/invalid audio id/);
    },
  );

  it('an invalid id is never fetched and falls back to browser speech', async () => {
    await mod.playAudio('../../src', { text: 'latte' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake.speak).toHaveBeenCalledWith('latte', { slow: false });
    mod.preloadAudio(['a#b']);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('playAudio', () => {
  it('plays a clip through the voice bus, ducking music while it plays', async () => {
    const done = mod.playAudio('cafe.word.latte');
    await flush();
    const [source] = sources();
    expect(source?.started).toHaveLength(1);
    expect(source?.connected).toContain(fake.manager?.voice);
    expect(started).toBe(1);
    endClip();
    await done;
    expect(ended).toBe(1);
    expect(source?.disconnected).toBe(true);
  });

  it('fetches and decodes each URL once (cache shared with preload)', async () => {
    mod.preloadAudio(['cafe.word.latte', 'cafe.word.latte']);
    const done = mod.playAudio('cafe.word.latte');
    await flush();
    endClip();
    await done;
    const again = mod.playAudio('cafe.word.latte');
    await flush();
    endClip();
    await again;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sources()).toHaveLength(2);
    const slow = mod.playAudio('cafe.word.latte', { speed: 'slow' });
    await flush();
    endClip();
    await slow;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a URL after a network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await mod.playAudio('cafe.word.latte', { text: 'latte' });
    expect(fake.speak).toHaveBeenCalledTimes(1);
    const done = mod.playAudio('cafe.word.latte');
    await flush();
    endClip();
    await done;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sources()).toHaveLength(1);
  });

  it('falls back to browser speech when the clip cannot be decoded', async () => {
    ctx.decodeAudioData = () => Promise.reject(new Error('not audio'));
    await mod.playAudio('cafe.word.latte', { text: 'latte', speed: 'slow' });
    expect(fake.speak).toHaveBeenCalledWith('latte', { slow: true });
    expect(sources()).toHaveLength(0);
  });

  it('falls back to browser speech when the clip is missing, silent without text', async () => {
    fetchMock.mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) });
    await mod.playAudio('cafe.word.latte', { text: 'latte' });
    expect(fake.speak).toHaveBeenCalledTimes(1);
    await mod.playAudio('cafe.word.mocha');
    expect(fake.speak).toHaveBeenCalledTimes(1);
  });

  it('uses browser speech before audio is unlocked', async () => {
    fake.manager = null;
    await mod.playAudio('cafe.word.latte', { text: 'latte' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake.speak).toHaveBeenCalledWith('latte', { slow: false });
  });

  it('a newer call cancels a slower one that is still loading', async () => {
    let release: (value: unknown) => void = () => undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = mod.playAudio('cafe.word.latte', { text: 'latte' });
    const second = mod.playAudio('cafe.word.mocha', { text: 'mocha' });
    await flush();
    expect(sources()).toHaveLength(1);
    release(okResponse());
    await first; // resolves without playing anything
    expect(sources()).toHaveLength(1);
    expect(fake.speak).not.toHaveBeenCalled();
    endClip();
    await second;
    expect(started).toBe(1);
    expect(ended).toBe(1);
  });

  it('a new clip stops the one playing', async () => {
    const first = mod.playAudio('cafe.word.latte');
    await flush();
    const [a] = sources();
    const second = mod.playAudio('cafe.word.mocha');
    await first;
    expect(a?.stopped).toBe(1);
    await flush();
    endClip();
    await second;
    expect(started).toBe(2);
    expect(ended).toBe(2);
  });

  it('stopAudio stops the clip, un-ducks and resolves the pending promise', async () => {
    const done = mod.playAudio('cafe.word.latte');
    await flush();
    mod.stopAudio();
    await done;
    const [source] = sources();
    expect(source?.stopped).toBe(1);
    expect(source?.disconnected).toBe(true);
    expect(ended).toBe(1);
    // a late 'ended' event does not count twice
    source?.onended?.();
    expect(ended).toBe(1);
  });

  it('stopAudio during loading plays nothing and does not fall back to speech', async () => {
    const done = mod.playAudio('cafe.word.latte', { text: 'latte' });
    mod.stopAudio();
    await done;
    expect(sources()).toHaveLength(0);
    expect(fake.speak).not.toHaveBeenCalled();
  });

  describe('nowPlaying', () => {
    const playing = () => mod.nowPlaying.get().audioId;

    it('holds the clip id while it plays, cleared when it ends', async () => {
      const done = mod.playAudio('cafe.line.t1_1');
      expect(playing()).toBeUndefined(); // still loading: nothing heard yet
      await flush();
      expect(playing()).toBe('cafe.line.t1_1');
      endClip();
      await done;
      expect(playing()).toBeUndefined();
    });

    it('is cleared by stopAudio', async () => {
      const done = mod.playAudio('cafe.word.latte');
      await flush();
      mod.stopAudio();
      await done;
      expect(playing()).toBeUndefined();
    });

    it('follows a new clip that replaces the one playing', async () => {
      const first = mod.playAudio('cafe.line.t1_1');
      await flush();
      const second = mod.playAudio('cafe.chunk.can_i_get');
      await first;
      await flush();
      expect(playing()).toBe('cafe.chunk.can_i_get');
      endClip();
      await second;
      expect(playing()).toBeUndefined();
    });

    it('is never set by a clip cancelled while loading', async () => {
      const done = mod.playAudio('cafe.word.latte');
      mod.stopAudio();
      await done;
      expect(playing()).toBeUndefined();
    });

    it('stays empty for browser speech (no reliable end)', async () => {
      fake.manager = null;
      await mod.playAudio('cafe.word.latte', { text: 'latte' });
      expect(fake.speak).toHaveBeenCalled();
      expect(playing()).toBeUndefined();
    });
  });

  it('resumes an interrupted context before playing', async () => {
    ctx.state = 'interrupted';
    const done = mod.playAudio('cafe.word.latte');
    await flush();
    expect(ctx.resumeCalls).toBe(1);
    endClip();
    await done;
  });
});
