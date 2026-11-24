import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compareSpoken,
  hasSeenRecognitionNote,
  listenAlternatives,
  listenOnce,
  markRecognitionNoteSeen,
  RecognitionError,
  recognitionMessage,
} from '../src/audio/recognize';

describe('compareSpoken', () => {
  it('matches everything when identical modulo case and punctuation', () => {
    const r = compareSpoken('Can I get a latte, please?', 'can i get a latte please');
    expect(r.missing).toEqual([]);
    expect(r.score).toBe(1);
  });

  it('lists missing words', () => {
    const r = compareSpoken('To go, please.', 'go please');
    expect(r.matched).toEqual(['go', 'please']);
    expect(r.missing).toEqual(['to']);
    expect(r.score).toBeCloseTo(2 / 3);
  });

  it('counts repeated words separately', () => {
    const r = compareSpoken('no no thanks', 'no thanks');
    expect(r.missing).toEqual(['no']);
  });

  it('handles empty input', () => {
    expect(compareSpoken('', 'hi').score).toBe(0);
    expect(compareSpoken('hi there', '').missing).toEqual(['hi', 'there']);
  });
});

/** Minimal stand-in for window.SpeechRecognition: tests fire the events by hand. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = true;
  maxAlternatives = 0;
  onresult: ((e: { results: ArrayLike<Record<number, { transcript: string }>> }) => void) | null =
    null;
  onerror: ((e: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  say(text: string) {
    this.onresult?.({ results: [{ 0: { transcript: text } }] });
  }
  /** One result segment per argument; each lists that segment's alternatives. */
  sayAlternatives(...segments: string[][]) {
    const results = segments.map((alts) =>
      Object.fromEntries(alts.map((transcript, k) => [k, { transcript }])),
    );
    this.onresult?.({ results });
  }
}

function lastRecognition(): FakeRecognition {
  if (!FakeRecognition.last) throw new Error('no recognition created');
  return FakeRecognition.last;
}

describe('listenOnce', () => {
  beforeEach(() => {
    FakeRecognition.last = null;
    vi.useFakeTimers();
    vi.stubGlobal('window', { SpeechRecognition: FakeRecognition });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolves with the transcript when recognition ends', async () => {
    const listening = listenOnce({ lang: 'en-US' });
    const r = lastRecognition();
    expect(r.start).toHaveBeenCalledOnce();
    expect(r.lang).toBe('en-US');
    r.say('to go please');
    r.onend?.();
    await expect(listening.promise).resolves.toBe('to go please');
  });

  it("treats 'no-speech' as silence", async () => {
    const listening = listenOnce();
    lastRecognition().onerror?.({ error: 'no-speech' });
    await expect(listening.promise).resolves.toBe('');
  });

  it('rejects with the browser error code', async () => {
    const listening = listenOnce();
    lastRecognition().onerror?.({ error: 'not-allowed' });
    await expect(listening.promise).rejects.toMatchObject({ code: 'not-allowed' });
  });

  it('abort() stops the recognizer and settles at once, even without onend', async () => {
    const listening = listenOnce();
    const r = lastRecognition();
    listening.abort();
    expect(r.abort).toHaveBeenCalledOnce();
    await expect(listening.promise).rejects.toMatchObject({ code: 'aborted' });
    // Late events after settling are ignored.
    expect(r.onend).toBeNull();
  });

  it('times out when neither onend nor onerror fires', async () => {
    const listening = listenOnce({ timeoutMs: 8000 });
    const r = lastRecognition();
    const settled = vi.fn();
    listening.promise.catch(settled);
    vi.advanceTimersByTime(7999);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await expect(listening.promise).rejects.toMatchObject({ code: 'timeout' });
    expect(r.abort).toHaveBeenCalledOnce();
  });

  it('clears the timeout once a result arrives', async () => {
    const listening = listenOnce({ timeoutMs: 8000 });
    const r = lastRecognition();
    r.onend?.();
    await expect(listening.promise).resolves.toBe('');
    vi.advanceTimersByTime(10000);
    expect(r.abort).not.toHaveBeenCalled();
  });

  it('rejects when start() throws', async () => {
    vi.stubGlobal('window', {
      SpeechRecognition: class extends FakeRecognition {
        start = vi.fn(() => {
          throw new Error('busy');
        });
      },
    });
    await expect(listenOnce().promise).rejects.toBeInstanceOf(RecognitionError);
  });

  it("rejects with 'unsupported' without SpeechRecognition", async () => {
    vi.stubGlobal('window', {});
    await expect(listenOnce().promise).rejects.toMatchObject({ code: 'unsupported' });
  });

  it("rejects with 'insecure' on plain http, without creating a recognizer", async () => {
    vi.stubGlobal('isSecureContext', false);
    await expect(listenOnce().promise).rejects.toMatchObject({ code: 'insecure' });
    expect(FakeRecognition.last).toBeNull();
  });
});

describe('listenAlternatives', () => {
  beforeEach(() => {
    FakeRecognition.last = null;
    vi.useFakeTimers();
    vi.stubGlobal('window', { SpeechRecognition: FakeRecognition });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('asks for 3 alternatives by default and returns them all', async () => {
    const listening = listenAlternatives({ lang: 'en-US' });
    const r = lastRecognition();
    expect(r.maxAlternatives).toBe(3);
    expect(r.lang).toBe('en-US');
    r.sayAlternatives(['to go please', 'two go please', 'to go police']);
    r.onend?.();
    await expect(listening.promise).resolves.toEqual([
      'to go please',
      'two go please',
      'to go police',
    ]);
  });

  it('passes maxAlternatives through', () => {
    listenAlternatives({ maxAlternatives: 5 });
    expect(lastRecognition().maxAlternatives).toBe(5);
  });

  it('joins segments per alternative, falling back to the first when fewer exist', async () => {
    const listening = listenAlternatives();
    const r = lastRecognition();
    r.sayAlternatives(['a latte', 'a later'], ['to go']);
    r.onend?.();
    await expect(listening.promise).resolves.toEqual(['a latte to go', 'a later to go']);
  });

  it('returns [] when nothing was heard', async () => {
    const listening = listenAlternatives();
    lastRecognition().onend?.();
    await expect(listening.promise).resolves.toEqual([]);
  });

  it("treats 'no-speech' as silence", async () => {
    const listening = listenAlternatives();
    lastRecognition().onerror?.({ error: 'no-speech' });
    await expect(listening.promise).resolves.toEqual([]);
  });

  it.each(['not-allowed', 'service-not-allowed', 'audio-capture', 'network'])(
    'rejects with the browser error code %s',
    async (code) => {
      const listening = listenAlternatives();
      lastRecognition().onerror?.({ error: code });
      await expect(listening.promise).rejects.toMatchObject({ code });
      await expect(listening.promise).rejects.toBeInstanceOf(RecognitionError);
    },
  );

  it('stop() asks the recognizer to deliver now and keeps the result', async () => {
    const listening = listenAlternatives();
    const r = lastRecognition();
    r.sayAlternatives(['hello there', 'hello their']);
    listening.stop();
    expect(r.stop).toHaveBeenCalledOnce();
    expect(r.abort).not.toHaveBeenCalled();
    r.onend?.();
    await expect(listening.promise).resolves.toEqual(['hello there', 'hello their']);
  });

  it('abort() stops the microphone, drops the result and settles with []', async () => {
    const listening = listenAlternatives();
    const r = lastRecognition();
    r.sayAlternatives(['hello']);
    listening.abort();
    expect(r.abort).toHaveBeenCalledOnce();
    await expect(listening.promise).resolves.toEqual([]);
    expect(r.onend).toBeNull();
  });

  it('stop() and abort() after settling do nothing', async () => {
    const listening = listenAlternatives();
    const r = lastRecognition();
    r.onend?.();
    await listening.promise;
    listening.stop();
    listening.abort();
    expect(r.stop).not.toHaveBeenCalled();
    expect(r.abort).not.toHaveBeenCalled();
  });

  it('times out by resolving with what was heard so far', async () => {
    const listening = listenAlternatives({ timeoutMs: 5000 });
    const r = lastRecognition();
    r.sayAlternatives(['half a sentence', 'half a sentenced']);
    vi.advanceTimersByTime(5000);
    await expect(listening.promise).resolves.toEqual(['half a sentence', 'half a sentenced']);
    expect(r.abort).toHaveBeenCalledOnce();
  });

  it('times out with [] when nothing was heard', async () => {
    const listening = listenAlternatives({ timeoutMs: 5000 });
    vi.advanceTimersByTime(5000);
    await expect(listening.promise).resolves.toEqual([]);
  });

  it('clears the timeout once it ends', async () => {
    const listening = listenAlternatives({ timeoutMs: 5000 });
    const r = lastRecognition();
    r.onend?.();
    await listening.promise;
    vi.advanceTimersByTime(10000);
    expect(r.abort).not.toHaveBeenCalled();
  });

  it('rejects when start() throws', async () => {
    vi.stubGlobal('window', {
      SpeechRecognition: class extends FakeRecognition {
        start = vi.fn(() => {
          throw new Error('busy');
        });
      },
    });
    await expect(listenAlternatives().promise).rejects.toBeInstanceOf(RecognitionError);
  });

  it("rejects with 'unsupported' without SpeechRecognition", async () => {
    vi.stubGlobal('window', {});
    const listening = listenAlternatives();
    await expect(listening.promise).rejects.toMatchObject({ code: 'unsupported' });
    expect(() => {
      listening.stop();
      listening.abort();
    }).not.toThrow();
  });

  it("rejects with 'insecure' on plain http, without creating a recognizer", async () => {
    vi.stubGlobal('isSecureContext', false);
    await expect(listenAlternatives().promise).rejects.toMatchObject({ code: 'insecure' });
    expect(FakeRecognition.last).toBeNull();
  });
});

describe('recognitionMessage', () => {
  it.each([
    ['not-allowed', '權限'],
    ['service-not-allowed', '權限'],
    ['audio-capture', '找不到麥克風'],
    ['network', '網路'],
    ['timeout', '再試一次'],
    ['insecure', 'https'],
    ['unsupported', '不支援'],
    ['aborted', '沒關係'],
  ])('maps %s to a zh-TW message', (code, fragment) => {
    expect(recognitionMessage(new RecognitionError(code))).toContain(fragment);
  });

  it('falls back for unknown errors', () => {
    expect(recognitionMessage(new Error('boom'))).toBe('這次辨識沒成功，沒關係，繼續練習就好。');
  });
});

describe('recognition privacy note flag', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is unset until markRecognitionNoteSeen() is called', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
    });
    expect(hasSeenRecognitionNote()).toBe(false);
    expect(hasSeenRecognitionNote()).toBe(false); // reading never sets it
    markRecognitionNoteSeen();
    expect(hasSeenRecognitionNote()).toBe(true);
  });

  it('shows the note when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(hasSeenRecognitionNote()).toBe(false);
    expect(() => markRecognitionNoteSeen()).not.toThrow();
  });
});
