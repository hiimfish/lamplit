import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  pickMimeType,
  recorderMessage,
  RecorderError,
  startRecording,
} from '../src/audio/recorder';
import type { RecorderErrorCode } from '../src/audio/recorder';

/** Fake MediaRecorder: stop() fires 'stop' asynchronously like the real one. */
class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static failConstruct = false;
  /** Formats the fake can record; set to undefined to mimic a browser without the method. */
  static isTypeSupported: ((type: string) => boolean) | undefined;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  private listeners = new Map<string, ((e: unknown) => void)[]>();
  stopCalls = 0;
  constructor(
    readonly stream: FakeStream,
    readonly options?: { mimeType?: string },
  ) {
    if (FakeMediaRecorder.failConstruct) throw new Error('bad mime');
    // Like real browsers: the chosen type, or the browser's own default.
    this.mimeType = options?.mimeType ?? 'audio/default';
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

/** Makes the fake support exactly these formats. */
function supportOnly(...types: string[]) {
  FakeMediaRecorder.isTypeSupported = (type) => types.includes(type);
}

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  FakeMediaRecorder.failConstruct = false;
  supportOnly('audio/webm;codecs=opus', 'audio/webm');
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

  it('records in the first supported format and labels the blob with it', async () => {
    supportOnly('audio/mp4'); // e.g. older Safari
    const handle = await startRecording();
    expect(FakeMediaRecorder.instances[0]!.options).toEqual({ mimeType: 'audio/mp4' });
    expect((await handle.stop()).type).toBe('audio/mp4');
  });

  it('lets the browser choose when no candidate format is supported', async () => {
    supportOnly();
    const handle = await startRecording();
    expect(FakeMediaRecorder.instances[0]!.options).toBeUndefined();
    expect((await handle.stop()).type).toBe('audio/default');
  });

  it('maps a permission refusal to denied', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    await expect(startRecording()).rejects.toMatchObject({ code: 'denied' });
  });

  it.each([
    ['NotFoundError', 'no-mic'],
    ['OverconstrainedError', 'no-mic'],
    ['NotReadableError', 'mic-busy'],
    ['AbortError', 'failed'],
  ])('maps getUserMedia %s to %s', async (name, code) => {
    getUserMedia.mockRejectedValueOnce(new DOMException('x', name));
    await expect(startRecording()).rejects.toMatchObject({ code });
  });

  it('maps a non-DOMException getUserMedia failure to failed', async () => {
    getUserMedia.mockRejectedValueOnce(new TypeError('boom'));
    await expect(startRecording()).rejects.toMatchObject({ code: 'failed' });
  });

  it('releases the microphone when MediaRecorder cannot be created', async () => {
    const stream = new FakeStream();
    getUserMedia.mockResolvedValueOnce(stream);
    FakeMediaRecorder.failConstruct = true;
    await expect(startRecording()).rejects.toMatchObject({ code: 'failed' });
    expect(stream.track.stopped).toBe(true);
  });

  it('reports insecure on plain http, before looking for the microphone API', async () => {
    vi.stubGlobal('isSecureContext', false);
    // Browsers remove mediaDevices on http; this must not read as "no microphone API".
    vi.stubGlobal('navigator', {});
    await expect(startRecording()).rejects.toMatchObject({ code: 'insecure' });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('reports no-mic-api on a secure page without getUserMedia', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {});
    await expect(startRecording()).rejects.toMatchObject({ code: 'no-mic-api' });
  });

  it('reports no-recorder without MediaRecorder', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    await expect(startRecording()).rejects.toMatchObject({ code: 'no-recorder' });
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

describe('pickMimeType', () => {
  it('prefers WebM Opus when available', () => {
    supportOnly('audio/mp4', 'audio/webm', 'audio/webm;codecs=opus');
    expect(pickMimeType()).toBe('audio/webm;codecs=opus');
  });

  it('falls back to MP4 when WebM is not supported', () => {
    supportOnly('audio/mp4');
    expect(pickMimeType()).toBe('audio/mp4');
  });

  it('returns undefined without isTypeSupported or MediaRecorder', () => {
    FakeMediaRecorder.isTypeSupported = undefined;
    expect(pickMimeType()).toBeUndefined();
    vi.stubGlobal('MediaRecorder', undefined);
    expect(pickMimeType()).toBeUndefined();
  });
});

describe('recorderMessage', () => {
  it.each<[RecorderErrorCode, string]>([
    ['insecure', 'https'],
    ['no-mic-api', 'Safari 或 Chrome'],
    ['no-recorder', 'iOS 14.5'],
    ['denied', '權限'],
    ['no-mic', '找不到麥克風'],
    ['mic-busy', '其他 App'],
    ['failed', '錄音失敗'],
  ])('gives a specific zh-TW message for %s', (code, fragment) => {
    const message = recorderMessage(new RecorderError(code));
    expect(message).toContain(fragment);
    expect(message).not.toContain('不支援');
  });

  it('treats unknown errors as failed', () => {
    expect(recorderMessage(new Error('x'))).toContain('錄音失敗');
  });
});
