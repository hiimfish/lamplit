/** Thin MediaRecorder wrapper. Recordings stay in memory only. */

export type RecorderErrorCode = 'unsupported' | 'denied' | 'failed';

export class RecorderError extends Error {
  readonly code: RecorderErrorCode;
  constructor(code: RecorderErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'RecorderError';
    this.code = code;
  }
}

/** Friendly zh-TW message for the UI. */
export function recorderMessage(error: unknown): string {
  const code = error instanceof RecorderError ? error.code : 'failed';
  if (code === 'unsupported') return '這個瀏覽器不支援錄音，可以先跳過這一題。';
  if (code === 'denied') return '沒有麥克風權限。請在瀏覽器網址列允許使用麥克風，或先跳過這一題。';
  return '錄音失敗了，請再試一次，或先跳過這一題。';
}

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

export interface RecordingHandle {
  /** Stops recording and resolves with the audio. Releases the microphone. */
  stop(): Promise<Blob>;
}

export async function startRecording(): Promise<RecordingHandle> {
  if (!isRecordingSupported()) throw new RecorderError('unsupported');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (
      name === 'NotAllowedError' ||
      name === 'SecurityError' ||
      name === 'PermissionDeniedError'
    ) {
      throw new RecorderError('denied');
    }
    throw new RecorderError('failed', String(error));
  }

  const release = () => stream.getTracks().forEach((t) => t.stop());
  let recorder: MediaRecorder;
  const chunks: Blob[] = [];
  try {
    recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    });
    recorder.start();
  } catch (error) {
    release();
    throw new RecorderError('failed', String(error));
  }

  // Memoized so a second stop() (e.g. unmount cleanup racing the stop button) is harmless.
  let stopping: Promise<Blob> | null = null;
  return {
    stop() {
      stopping ??= new Promise<Blob>((resolve, reject) => {
        const toBlob = () => new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        recorder.addEventListener('stop', () => {
          release();
          resolve(toBlob());
        });
        recorder.addEventListener('error', () => {
          release();
          reject(new RecorderError('failed'));
        });
        if (recorder.state === 'inactive') {
          release();
          resolve(toBlob());
          return;
        }
        try {
          recorder.stop();
        } catch (error) {
          release();
          reject(new RecorderError('failed', String(error)));
        }
      });
      return stopping;
    },
  };
}
