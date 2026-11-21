import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recorderMessage, RecorderError, startRecording } from '../src/audio/recorder';

/** Fake MediaRecorder: stop() fires 'stop' asynchronously like the real one. */
class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static failConstruct = false;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  private listeners = new Map<string, ((e: unknown) => void)[]>();
  stopCalls = 0;
  constructor(readonly stream: FakeStream) {
    if (FakeMediaRecorder.failConstruct) throw new Error('bad mime');
    FakeMediaRecorder.instances.push(this);
  }
  addEventListener(type: string, fn: (e: unknown) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  emit(type: string, e: unknown = {}) {
    (this.listeners.get(type) ?? []).forEach((fn) => fn(e));
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.stopCalls += 1;
    this.state = 'inactive';
    queueMicrotask(() => {
      this.emit('dataavailable', { data: new Blob(['abc']) });
      this.emit('stop');
    });
  }
}

class FakeStream {
  track = { stopped: false, stop: () => (this.track.stopped = true) };
  getTracks() {
    return [this.track];
  }
}

const getUserMedia = vi.fn<() => Promise<FakeStream>>();

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  FakeMediaRecorder.failConstruct = false;
  getUserMedia.mockReset();
  getUserMedia.mockImplementation(async () => new FakeStream());
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
});
afterEach(() => vi.unstubAllGlobals());

describe('startRecording', () => {
  it('records and releases the microphone on stop', async () => {
    const handle = await startRecording();
    const recorder = FakeMediaRecorder.instances[0]!;
    expect(recorder.state).toBe('recording');
    const blob = await handle.stop();
    expect(blob.size).toBe(3);
    expect(recorder.stream.track.stopped).toBe(true);
  });

  it('a second stop() reuses the first instead of stopping twice', async () => {
    const handle = await startRecording();
    const [a, b] = [handle.stop(), handle.stop()];
    expect(a).toBe(b);
    await a;
    expect(FakeMediaRecorder.instances[0]!.stopCalls).toBe(1);
  });

  it('maps a permission refusal to denied', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    await expect(startRecording()).rejects.toMatchObject({ code: 'denied' });
  });

  it('maps other getUserMedia failures to failed', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('none', 'NotFoundError'));
    await expect(startRecording()).rejects.toMatchObject({ code: 'failed' });
  });

  it('releases the microphone when MediaRecorder cannot be created', async () => {
    const stream = new FakeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    FakeMediaRecorder.failConstruct = true;
    await expect(startRecording()).rejects.toMatchObject({ code: 'failed' });
    expect(stream.track.stopped).toBe(true);
  });

  it('reports unsupported without MediaRecorder', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    await expect(startRecording()).rejects.toMatchObject({ code: 'unsupported' });
  });
});

describe('recorderMessage', () => {
  it('gives a zh-TW message per error code', () => {
    expect(recorderMessage(new RecorderError('unsupported'))).toContain('不支援');
    expect(recorderMessage(new RecorderError('denied'))).toContain('權限');
    expect(recorderMessage(new Error('x'))).toContain('錄音失敗');
  });
});
