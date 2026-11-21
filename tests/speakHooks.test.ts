/**
 * Lifecycle logic behind useRecorder() / useRecognition(). The hooks are thin bindings over
 * these controllers (dispose() == unmount), so the guards are tested here without a DOM.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordingHandle } from '../src/audio/recorder';
import { RecorderError } from '../src/audio/recorder';
import { listenOnce, RecognitionError } from '../src/audio/recognize';
import type { Listening } from '../src/audio/recognize';
import { RecorderController } from '../src/ui/minigames/useRecorder';
import type { RecorderDeps, RecorderState } from '../src/ui/minigames/useRecorder';
import { NOTHING_HEARD, RecognitionController } from '../src/ui/minigames/useRecognition';
import type { RecognitionDeps, RecognitionState } from '../src/ui/minigames/useRecognition';

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

function recognitionSetup(noteSeen = true) {
  const sessions: { listening: Listening; done: ReturnType<typeof deferred<string>> }[] = [];
  const calls: string[] = [];
  let seen = noteSeen;
  const deps: RecognitionDeps = {
    listen: vi.fn(() => {
      calls.push('listen');
      const done = deferred<string>();
      const listening: Listening = {
        promise: done.promise,
        abort: vi.fn(() => done.reject(new RecognitionError('aborted'))),
      };
      sessions.push({ listening, done });
      return listening;
    }),
    noteSeen: vi.fn(() => seen),
    markNoteSeen: vi.fn(() => {
      calls.push('markNoteSeen');
      seen = true;
    }),
    beforeListen: vi.fn(() => void calls.push('beforeListen')),
  };
  const states: RecognitionState[] = [];
  const controller = new RecognitionController((s) => states.push(s), deps);
  return { controller, deps, sessions, calls, states };
}

describe('RecognitionController (useRecognition)', () => {
  it('first tap shows the privacy note and does not listen or store the flag', () => {
    const { controller, deps } = recognitionSetup(false);
    controller.request('to go please');
    expect(controller.getState().status).toBe('confirm');
    expect(deps.listen).not.toHaveBeenCalled();
    expect(deps.markNoteSeen).not.toHaveBeenCalled();
  });

  it('繼續辨識 stores the flag, silences playback, then starts listening', () => {
    const { controller, calls } = recognitionSetup(false);
    controller.request('to go please');
    controller.confirm();
    expect(calls).toEqual(['markNoteSeen', 'beforeListen', 'listen']);
    expect(controller.getState().status).toBe('listening');
  });

  it('取消 closes the note without listening; the note shows again next time', () => {
    const { controller, deps } = recognitionSetup(false);
    controller.request('hi');
    controller.cancel();
    expect(controller.getState().status).toBe('idle');
    expect(deps.markNoteSeen).not.toHaveBeenCalled();
    controller.request('hi');
    expect(controller.getState().status).toBe('confirm');
    expect(deps.listen).not.toHaveBeenCalled();
  });

  it('after confirming once, later taps listen directly', () => {
    const { controller, calls } = recognitionSetup(true);
    controller.request('hi');
    expect(calls).toEqual(['beforeListen', 'listen']);
  });

  it('ignores taps while already listening (single microphone consumer)', () => {
    const { controller, deps } = recognitionSetup();
    controller.request('hi');
    controller.request('hi');
    expect(deps.listen).toHaveBeenCalledTimes(1);
  });

  it('reports matched words and silence', async () => {
    const { controller, sessions } = recognitionSetup();
    controller.request('to go please');
    sessions[0]!.done.resolve('go please');
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'idle', message: null });
    expect(controller.getState().heard?.missing).toEqual(['to']);
    controller.request('to go please');
    sessions[1]!.done.resolve('');
    await flush();
    expect(controller.getState()).toMatchObject({ heard: null, message: NOTHING_HEARD });
  });

  it('maps a recognition error code to its zh-TW message', async () => {
    const { controller, sessions } = recognitionSetup();
    controller.request('hi');
    sessions[0]!.done.reject(new RecognitionError('network'));
    await flush();
    expect(controller.getState().status).toBe('idle');
    expect(controller.getState().message).toContain('網路');
  });

  it('aborts the recognizer on unmount and ignores its late result', async () => {
    const { controller, sessions, states } = recognitionSetup();
    controller.request('hi');
    controller.dispose();
    expect(sessions[0]!.listening.abort).toHaveBeenCalledOnce();
    const before = states.length;
    sessions[0]!.done.resolve('hi');
    await flush();
    expect(states.length).toBe(before);
  });

  it('abort() (question finished) releases the UI immediately', () => {
    const { controller, sessions } = recognitionSetup();
    controller.request('hi');
    controller.abort();
    expect(sessions[0]!.listening.abort).toHaveBeenCalledOnce();
    expect(controller.getState().status).toBe('idle');
  });

  describe('with the real listenOnce', () => {
    class SilentRecognition {
      static last: SilentRecognition | null = null;
      lang = '';
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      constructor() {
        SilentRecognition.last = this;
      }
    }

    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal('window', { SpeechRecognition: SilentRecognition });
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('the timeout releases the UI when the browser never fires onend/onerror', async () => {
      const states: RecognitionState[] = [];
      const controller = new RecognitionController((s) => states.push(s), {
        listen: listenOnce,
        noteSeen: () => true,
        markNoteSeen: () => undefined,
        beforeListen: () => undefined,
      });
      controller.request('hi');
      expect(controller.getState().status).toBe('listening');
      await vi.advanceTimersByTimeAsync(8000);
      expect(controller.getState().status).toBe('idle');
      expect(controller.getState().message).toContain('再試一次');
      expect(SilentRecognition.last?.abort).toHaveBeenCalledOnce();
    });
  });
});
