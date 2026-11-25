/**
 * 大聲說說看's 說說看 (usePronScore): the download note, one try at a time, auto-stopped
 * recording, scoring and abort. The hook is a thin binding over PronController, tested here
 * with fake dependencies (no microphone, no model).
 */
import { describe, expect, it, vi } from 'vitest';
import { PronError } from '../src/audio/pronModel';
import { RecorderError } from '../src/audio/recorder';
import type { ScoredAttempt } from '../src/audio/utterance';
import type { SpokenScore } from '../src/learning/spokenScore';
import { nothingHeard, PronController } from '../src/ui/minigames/usePronScore';
import type { PronDeps, PronState } from '../src/ui/minigames/usePronScore';

vi.mock('../src/audio/pronounce', () => ({ stopAudio: vi.fn(), playAudio: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function setup(cached = true) {
  const tries: {
    target: string;
    result: ReturnType<typeof deferred<SpokenScore | null>>;
    onScoring: () => void;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
  }[] = [];
  const download = deferred<void>();
  let progress: (fraction: number) => void = () => undefined;
  const calls: string[] = [];
  const deps: PronDeps = {
    cached: vi.fn(async () => cached),
    load: vi.fn((onProgress: (fraction: number) => void) => {
      progress = onProgress;
      return download.promise;
    }),
    attempt: vi.fn((target: string, onScoring: () => void): ScoredAttempt => {
      calls.push('attempt');
      const result = deferred<SpokenScore | null>();
      const stop = vi.fn();
      const abort = vi.fn();
      tries.push({ target, result, onScoring, stop, abort });
      return { promise: result.promise, stop, abort };
    }),
    beforeRecord: vi.fn(() => void calls.push('beforeRecord')),
    release: vi.fn(),
  };
  const states: PronState[] = [];
  const controller = new PronController((s) => states.push(s), deps);
  return {
    controller,
    deps,
    tries,
    download,
    states,
    calls,
    progress: (f: number) => progress(f),
  };
}

const RESULT: SpokenScore = {
  score: 83,
  level: 'mostly',
  marks: [
    { word: 'to', status: 'near' },
    { word: 'go', status: 'hit' },
  ],
};

describe('PronController (說說看)', () => {
  it('one press: silences the model, records, then scores', async () => {
    const t = setup(true);
    void t.controller.press('to go');
    await flush();
    expect(t.calls).toEqual(['beforeRecord', 'attempt']);
    expect(t.tries[0]!.target).toBe('to go');
    expect(t.controller.getState().status).toBe('recording');
    t.tries[0]!.onScoring();
    expect(t.controller.getState().status).toBe('scoring');
    t.tries[0]!.result.resolve(RESULT);
    await flush();
    expect(t.controller.getState()).toMatchObject({ status: 'idle', score: RESULT, message: null });
  });

  it('a second press while recording ends the recording early', async () => {
    const t = setup(true);
    void t.controller.press('hi');
    await flush();
    void t.controller.press('hi');
    expect(t.tries[0]!.stop).toHaveBeenCalledTimes(1);
    expect(t.deps.attempt).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while scoring', async () => {
    const t = setup(true);
    void t.controller.press('hi');
    await flush();
    t.tries[0]!.onScoring();
    void t.controller.press('hi');
    expect(t.deps.attempt).toHaveBeenCalledTimes(1);
    expect(t.tries[0]!.stop).not.toHaveBeenCalled();
  });

  it('the first time asks before downloading; 取消 downloads and records nothing', async () => {
    const t = setup(false);
    void t.controller.press('hi');
    await flush();
    expect(t.controller.getState().status).toBe('confirm');
    t.controller.cancel();
    expect(t.controller.getState().status).toBe('idle');
    expect(t.deps.load).not.toHaveBeenCalled();
    expect(t.deps.attempt).not.toHaveBeenCalled();
  });

  it('下載並評分 downloads with progress, then records', async () => {
    const t = setup(false);
    void t.controller.press('hi');
    await flush();
    void t.controller.confirm();
    expect(t.controller.getState().status).toBe('downloading');
    t.progress(0.4);
    expect(t.controller.getState().progress).toBe(0.4);
    t.download.resolve();
    await flush();
    expect(t.controller.getState().status).toBe('recording');
    expect(t.deps.attempt).toHaveBeenCalledTimes(1);
  });

  it('a failed download shows the zh-TW message', async () => {
    const t = setup(false);
    void t.controller.press('hi');
    await flush();
    void t.controller.confirm();
    t.download.reject(new PronError('download-failed'));
    await flush();
    expect(t.controller.getState().status).toBe('idle');
    expect(t.controller.getState().message).toContain('下載失敗');
  });

  it('nothing said asks for another try', async () => {
    const t = setup(true);
    void t.controller.press('hi');
    await flush();
    t.tries[0]!.result.resolve(null);
    await flush();
    expect(t.controller.getState()).toMatchObject({ score: null, message: nothingHeard() });
  });

  it('a refused microphone shows the recorder message', async () => {
    const t = setup(true);
    void t.controller.press('hi');
    await flush();
    t.tries[0]!.result.reject(new RecorderError('denied'));
    await flush();
    expect(t.controller.getState().message).toContain('權限');
  });

  it('abort() drops the try, frees the microphone and ignores a late score', async () => {
    const t = setup(true);
    void t.controller.press('hi');
    await flush();
    t.controller.abort();
    expect(t.tries[0]!.abort).toHaveBeenCalledTimes(1);
    expect(t.deps.release).toHaveBeenCalledTimes(1);
    expect(t.controller.getState().status).toBe('idle');
    t.tries[0]!.result.resolve(RESULT);
    await flush();
    expect(t.controller.getState().score).toBeNull();
  });

  it('after dispose nothing changes state', async () => {
    const t = setup(true);
    t.controller.dispose();
    const before = t.states.length;
    void t.controller.press('hi');
    await flush();
    expect(t.states.length).toBe(before);
    expect(t.deps.attempt).not.toHaveBeenCalled();
  });
});
