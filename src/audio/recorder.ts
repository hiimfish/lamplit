/** Thin MediaRecorder wrapper. Recordings stay in memory only. */

import { t } from '../core/i18n';
export type RecorderErrorCode =
  /** Page opened over plain http (e.g. a LAN IP): browsers hide the microphone API. */
  | 'insecure'
  /** Secure page, but no getUserMedia (e.g. some in-app browsers). */
  | 'no-mic-api'
  /** No MediaRecorder (e.g. iOS before 14.5). */
  | 'no-recorder'
  | 'denied'
  /** No microphone found. */
  | 'no-mic'
  /** Microphone held by another app (e.g. during a call). */
  | 'mic-busy'
  | 'failed';

export class RecorderError extends Error {
  readonly code: RecorderErrorCode;
  constructor(code: RecorderErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'RecorderError';
    this.code = code;
  }
}

const MESSAGES: Record<RecorderErrorCode, [zh: string, en: string]> = {
  insecure: [
    '錄音需要安全連線（https），現在是用 http 開啟的。請改用 https 網址，或先跳過這一題。',
    'Recording needs a secure (https) connection, but this page is on http. Open the https address, or skip this one.',
  ],
  'no-mic-api': [
    '這個瀏覽器沒有開放麥克風。如果是從 LINE、FB 等 App 開啟，請改用 Safari 或 Chrome，或先跳過這一題。',
    "This browser doesn't allow the microphone. If you opened it inside an app like LINE or Facebook, use Safari or Chrome, or skip this one.",
  ],
  'no-recorder': [
    '這個瀏覽器版本不能錄音。iPhone 請更新到 iOS 14.5 以上，或先跳過這一題。',
    "This browser version can't record. On iPhone, update to iOS 14.5 or later, or skip this one.",
  ],
  denied: [
    '沒有麥克風權限。請在瀏覽器網址列允許使用麥克風，或先跳過這一題。',
    'No microphone permission. Allow the microphone in the address bar, or skip this one.',
  ],
  'no-mic': [
    '找不到麥克風，請確認麥克風有接好，或先跳過這一題。',
    "Can't find a microphone. Check that it's connected, or skip this one.",
  ],
  'mic-busy': [
    '麥克風正被其他 App 使用（例如通話中），請關掉後再試，或先跳過這一題。',
    'Another app is using the microphone (a call, maybe). Close it and try again, or skip this one.',
  ],
  failed: [
    '錄音失敗了，請再試一次，或先跳過這一題。',
    "Recording didn't work. Try again, or skip this one.",
  ],
};

/** Friendly message for the UI, in the current 介面語言. */
export function recorderMessage(error: unknown): string {
  const code = error instanceof RecorderError ? error.code : 'failed';
  const [zh, en] = MESSAGES[code];
  return t(zh, en);
}

/** Why recording cannot start here, or null if the APIs are available. */
function checkSupport(): RecorderErrorCode | null {
  // Checked first: on http the browser removes navigator.mediaDevices entirely, which
  // would otherwise look like a browser without microphone support.
  if ((globalThis as { isSecureContext?: boolean }).isSecureContext === false) return 'insecure';
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'no-mic-api';
  }
  if (typeof MediaRecorder === 'undefined') return 'no-recorder';
  return null;
}

/**
 * Preferred formats, first supported wins. Recordings are only played back in the same
 * browser, so any format it can record is fine: Chrome and Firefox pick WebM, older Safari
 * picks MP4.
 */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

/**
 * The first candidate format this browser can record, or undefined to let the browser
 * choose (no isTypeSupported, or none of the candidates is supported).
 */
export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

function getUserMediaErrorCode(error: unknown): RecorderErrorCode {
  const name = error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
    case 'PermissionDeniedError':
      return 'denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-mic';
    case 'NotReadableError':
      return 'mic-busy';
    default:
      return 'failed';
  }
}

export interface RecordingHandle {
  /** Stops recording and resolves with the audio. Releases the microphone. */
  stop(): Promise<Blob>;
}

/** Asks for the microphone. Rejects with a RecorderError. */
export async function openMicrophone(): Promise<MediaStream> {
  const unsupported = checkSupport();
  if (unsupported) throw new RecorderError(unsupported);
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    throw new RecorderError(getUserMediaErrorCode(error), String(error));
  }
}

/** Stops every track of a microphone stream. */
export function closeMicrophone(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
}

/** Opens the microphone and records until stop(), which also releases it. */
export async function startRecording(): Promise<RecordingHandle> {
  const stream = await openMicrophone();
  return recordStream(stream, () => closeMicrophone(stream));
}

/**
 * Records an open stream until stop(). `release` runs once the recording ends (pass a
 * no-op to keep the microphone open for the next recording).
 */
export function recordStream(stream: MediaStream, release: () => void): RecordingHandle {
  const mimeType = pickMimeType();
  let recorder: MediaRecorder;
  const chunks: Blob[] = [];
  try {
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
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
        const toBlob = () => new Blob(chunks, { type: recorder.mimeType || mimeType || '' });
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
