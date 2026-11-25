/**
 * Lifecycle logic behind useRecorder() / usePronScore(). The hooks are thin bindings over
 * these controllers (dispose() == unmount), so the guards are tested here without a DOM.
 */
import { describe, expect, it, vi } from 'vitest';
import type { RecordingHandle } from '../src/audio/recorder';
import { RecorderError } from '../src/audio/recorder';
import { PronError } from '../src/audio/pronModel';
import type { SpokenScore } from '../src/learning/spokenScore';
import { RecorderController } from '../src/ui/minigames/useRecorder';
import type { RecorderDeps, RecorderState } from '../src/ui/minigames/useRecorder';
import { NOTHING_HEARD, PronController } from '../src/ui/minigames/usePronScore';
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

/** A fake recording whose stop() the test resolves by hand. */
function fakeHandle() {
  const stopped = deferred<Blob>();
  const handle = { stop: vi.fn(() => stopped.promise) } satisfies RecordingHandle;
  return { handle, stopped };
}

function recorderSetup() {
  const pending: ReturnType<typeof deferred<RecordingHandle>>[] = [];
  const created: string[] = [];
  const revoked: string[] = [];
  const player = { play: vi.fn(async () => undefined), pause: vi.fn() };
  const deps: RecorderDeps = {
    start: vi.fn(() => {
      const d = deferred<RecordingHandle>();
      pending.push(d);
      return d.promise;
    }),
    createUrl: vi.fn(() => {
      const url = `blob:${created.length}`;
      created.push(url);
      return url;
    }),
    revokeUrl: vi.fn((url: string) => void revoked.push(url)),
    createPlayer: vi.fn(() => player),
  };
  const states: RecorderState[] = [];
  const controller = new RecorderController((s) => states.push(s), deps);
  return { controller, deps, pending, created, revoked, player, states };
}

describe('RecorderController (useRecorder)', () => {
  it('goes idle -> starting -> recording -> recorded', async () => {
    const { controller, pending, created } = recorderSetup();
    const { handle, stopped } = fakeHandle();
    void controller.start();
    expect(controller.getState().phase).toBe('starting');
    pending[0]!.resolve(handle);
    await flush();
    expect(controller.getState().phase).toBe('recording');
    const stopping = controller.stop();
    stopped.resolve(new Blob(['x']));
    await stopping;
    expect(controller.getState()).toMatchObject({ phase: 'recorded', url: created[0] });
  });

  it('ignores a second tap while the permission prompt is pending (double start)', async () => {
    const { controller, deps, pending } = recorderSetup();
    void controller.start();
    void controller.start();
    expect(deps.start).toHaveBeenCalledTimes(1);
    const { handle } = fakeHandle();
    pending[0]!.resolve(handle);
    await flush();
    expect(controller.getState().phase).toBe('recording');
    controller.dispose();
    expect(handle.stop).toHaveBeenCalledTimes(1);
  });

  it('unmount during the permission prompt stops the late recorder and stores nothing', async () => {
    const { controller, pending, states } = recorderSetup();
    void controller.start();
    const before = states.length;
    controller.dispose();
    const late = fakeHandle();
    pending[0]!.resolve(late.handle);
    await flush();
    expect(late.handle.stop).toHaveBeenCalledTimes(1);
    expect(states.length).toBe(before); // no state update on an unmounted component
  });

  it('a permission error after unmount is swallowed', async () => {
    const { controller, pending, states } = recorderSetup();
    void controller.start();
    controller.dispose();
    const before = states.length;
    pending[0]!.reject(new RecorderError('denied'));
    await flush();
    expect(states.length).toBe(before);
  });

  it('stop() resolving after unmount leaves no unrevoked object URL', async () => {
    const { controller, pending, created, revoked } = recorderSetup();
    const { handle, stopped } = fakeHandle();
    void controller.start();
    pending[0]!.resolve(handle);
    await flush();
    const stopping = controller.stop();
    controller.dispose();
    stopped.resolve(new Blob(['x']));
    await stopping;
    expect(created.every((url) => revoked.includes(url))).toBe(true);
    expect(controller.getState().url).toBeNull();
  });

  it('unmount revokes the kept recording and pauses playback', async () => {
    const { controller, pending, created, revoked, player } = recorderSetup();
    const { handle, stopped } = fakeHandle();
    void controller.start();
    pending[0]!.resolve(handle);
    await flush();
    const stopping = controller.stop();
    stopped.resolve(new Blob(['x']));
    await stopping;
    controller.playMine();
    controller.dispose();
    expect(player.pause).toHaveBeenCalled();
    expect(revoked).toEqual(created);
  });

  it('unmount while recording stops the microphone', async () => {
    const { controller, pending } = recorderSetup();
    const { handle } = fakeHandle();
    void controller.start();
    pending[0]!.resolve(handle);
    await flush();
    controller.dispose();
    controller.dispose();
    expect(handle.stop).toHaveBeenCalledTimes(1);
  });

  it('re-recording revokes the previous URL', async () => {
    const { controller, pending, revoked } = recorderSetup();
    for (let i = 0; i < 2; i++) {
      const { handle, stopped } = fakeHandle();
      void controller.start();
      pending[i]!.resolve(handle);
      await flush();
      const stopping = controller.stop();
      stopped.resolve(new Blob(['x']));
      await stopping;
    }
    expect(revoked).toEqual(['blob:0']);
  });

  it('shows the zh-TW message when the microphone is refused', async () => {
    const { controller, pending } = recorderSetup();
    void controller.start();
    pending[0]!.reject(new RecorderError('denied'));
    await flush();
    expect(controller.getState().phase).toBe('idle');
    expect(controller.getState().message).toContain('權限');
  });
});

function pronSetup(cached = true) {
  const scores: ReturnType<typeof deferred<SpokenScore | null>>[] = [];
  const download = deferred<void>();
  let progress: (fraction: number) => void = () => undefined;
  const deps: PronDeps = {
    cached: vi.fn(async () => cached),
    load: vi.fn((onProgress: (fraction: number) => void) => {
      progress = onProgress;
      return download.promise;
    }),
    score: vi.fn(() => {
      const d = deferred<SpokenScore | null>();
      scores.push(d);
      return d.promise;
    }),
  };
  const states: PronState[] = [];
  const controller = new PronController((s) => states.push(s), deps);
  return { controller, deps, scores, download, states, progress: (f: number) => progress(f) };
}

const BLOB = new Blob(['x']);
const RESULT: SpokenScore = {
  score: 83,
  level: 'mostly',
  marks: [
    { word: 'to', status: 'near' },
    { word: 'go', status: 'hit' },
  ],
};

describe('PronController (usePronScore)', () => {
  it('scores at once when the model is already on the device', async () => {
    const { controller, deps, scores } = pronSetup(true);
    void controller.request(BLOB, 'to go');
    expect(controller.getState().status).toBe('scoring');
    await flush();
    expect(deps.score).toHaveBeenCalledWith(BLOB, 'to go');
    scores[0]!.resolve(RESULT);
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'idle', score: RESULT, message: null });
  });

  it('the first time asks before downloading, and downloads nothing on 取消', async () => {
    const { controller, deps } = pronSetup(false);
    void controller.request(BLOB, 'hi');
    await flush();
    expect(controller.getState().status).toBe('confirm');
    expect(deps.load).not.toHaveBeenCalled();
    controller.cancel();
    expect(controller.getState().status).toBe('idle');
    expect(deps.load).not.toHaveBeenCalled();
  });

  it('下載並評分 downloads with progress, then scores', async () => {
    const t = pronSetup(false);
    void t.controller.request(BLOB, 'hi');
    await flush();
    void t.controller.confirm();
    expect(t.controller.getState().status).toBe('downloading');
    t.progress(0.4);
    expect(t.controller.getState().progress).toBe(0.4);
    t.download.resolve();
    await flush();
    expect(t.controller.getState().status).toBe('scoring');
    t.scores[0]!.resolve(RESULT);
    await flush();
    expect(t.controller.getState()).toMatchObject({ status: 'idle', score: RESULT });
  });

  it('a failed download shows the zh-TW message', async () => {
    const t = pronSetup(false);
    void t.controller.request(BLOB, 'hi');
    await flush();
    void t.controller.confirm();
    t.download.reject(new PronError('download-failed'));
    await flush();
    expect(t.controller.getState().status).toBe('idle');
    expect(t.controller.getState().message).toContain('下載失敗');
  });

  it('a silent recording asks for another try', async () => {
    const { controller, scores } = pronSetup(true);
    void controller.request(BLOB, 'hi');
    await flush();
    scores[0]!.resolve(null);
    await flush();
    expect(controller.getState()).toMatchObject({ score: null, message: NOTHING_HEARD });
  });

  it('ignores taps while scoring (one at a time)', async () => {
    const { controller, deps } = pronSetup(true);
    void controller.request(BLOB, 'hi');
    void controller.request(BLOB, 'hi');
    await flush();
    expect(deps.score).toHaveBeenCalledTimes(1);
  });

  it('drops a late score after abort() or unmount', async () => {
    const { controller, scores, states } = pronSetup(true);
    void controller.request(BLOB, 'hi');
    await flush();
    controller.abort();
    expect(controller.getState().status).toBe('idle');
    scores[0]!.resolve(RESULT);
    await flush();
    expect(controller.getState().score).toBeNull();
    controller.dispose();
    const before = states.length;
    controller.clear();
    expect(states.length).toBe(before);
  });
});
