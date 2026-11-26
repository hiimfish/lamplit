/**
 * 發音評分 on this device: the model runs in its own worker (pronWorker.ts), downloaded once
 * from this site and kept in the browser. scoreRecording() turns a recording into a
 * SpokenScore (pronScore.ts). Recordings never leave the device.
 */
import { t } from '../core/i18n';
import { scorePronunciation, logSoftmaxRows } from '../learning/pronScore';
import type { SpokenScore } from '../learning/spokenScore';
import { decodeToPcm, isSilent, prepareForModel } from './pcm';
import { MODEL_CACHE, MODEL_DIR, MODEL_PARTS } from './pronFiles';
import type { WorkerReply, WorkerRequest } from './pronWorker';

export type PronErrorCode = 'unsupported' | 'download-failed' | 'failed';

export class PronError extends Error {
  readonly code: PronErrorCode;
  constructor(code: PronErrorCode) {
    super(code);
    this.name = 'PronError';
    this.code = code;
  }
}

const MESSAGES: Record<PronErrorCode, [zh: string, en: string]> = {
  unsupported: [
    '這個瀏覽器不能評分（需要 WebAssembly）。可以先跳過這一題。',
    "This browser can't score (it needs WebAssembly). You can skip this one.",
  ],
  'download-failed': [
    '發音模型下載失敗，請確認網路後再試一次。',
    "The pronunciation model didn't download. Check your connection and try again.",
  ],
  failed: ['評分失敗了，請再錄一次試試。', "Scoring didn't work. Please record again."],
};

/** Friendly message for the UI, in the current 介面語言. */
export function pronMessage(error: unknown): string {
  const [zh, en] = MESSAGES[error instanceof PronError ? error.code : 'failed'];
  return t(zh, en);
}

/** Shown while 跟著說 waits for the model (it normally loads on the title screen); the Chinese wording. */
export const PRON_NOTE =
  '發音模型還沒載入好，正在下載（約 95MB，只要一次）。錄音只在這台裝置上評分，不會上傳。';

/** PRON_NOTE in the current 介面語言. */
export function pronNote(): string {
  return t(
    PRON_NOTE,
    'The pronunciation model is still downloading (about 95 MB, just once). Your recording is scored on this device and never uploaded.',
  );
}

export function pronSupported(): boolean {
  return typeof WebAssembly === 'object' && typeof Worker === 'function';
}

/** Whether the model is already on this device (no download needed). */
export async function modelCached(): Promise<boolean> {
  if (ready) return true;
  try {
    if (typeof caches === 'undefined') return false;
    const cache = await caches.open(MODEL_CACHE);
    const base = `${import.meta.env.BASE_URL}${MODEL_DIR}`;
    const hits = await Promise.all(MODEL_PARTS.map((name) => cache.match(`${base}${name}`)));
    return hits.every(Boolean);
  } catch {
    return false;
  }
}

let worker: Worker | null = null;
let ready = false;
let loading: Promise<void> | null = null;
const progressListeners = new Set<(fraction: number) => void>();
const pending = new Map<
  number,
  { resolve: (r: WorkerReply) => void; reject: (e: unknown) => void }
>();
let nextId = 1;

function send(message: WorkerRequest, transfer: Transferable[] = []): void {
  worker?.postMessage(message, transfer);
}

function startWorker(): Worker {
  const w = new Worker(new URL('./pronWorker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (event: MessageEvent<WorkerReply>) => {
    const reply = event.data;
    if (reply.type === 'progress') {
      for (const listener of progressListeners) listener(reply.fraction);
    } else if ((reply.type === 'logits' || reply.type === 'error') && reply.id !== undefined) {
      const call = pending.get(reply.id);
      pending.delete(reply.id);
      if (reply.type === 'logits') call?.resolve(reply);
      else call?.reject(new PronError(reply.code));
    }
  };
  return w;
}

/**
 * Loads the model (downloading it the first time). One load at a time: a second caller
 * shares it, with its own progress listener. Rejects with a PronError.
 */
export function loadModel(onProgress?: (fraction: number) => void): Promise<void> {
  if (ready) return Promise.resolve();
  if (!pronSupported()) return Promise.reject(new PronError('unsupported'));
  if (onProgress) progressListeners.add(onProgress);
  const cleanup = () => {
    if (onProgress) progressListeners.delete(onProgress);
  };
  if (!loading) {
    worker ??= startWorker();
    const w = worker;
    loading = new Promise<void>((resolve, reject) => {
      const onReply = (event: MessageEvent<WorkerReply>) => {
        const reply = event.data;
        if (reply.type === 'ready') {
          w.removeEventListener('message', onReply);
          ready = true;
          resolve();
        } else if (reply.type === 'error' && reply.id === undefined) {
          w.removeEventListener('message', onReply);
          loading = null;
          reject(new PronError(reply.code));
        }
      };
      w.addEventListener('message', onReply);
      w.onerror = () => {
        w.removeEventListener('message', onReply);
        loading = null;
        reject(new PronError('failed'));
      };
      send({ type: 'load', base: `${import.meta.env.BASE_URL}${MODEL_DIR}` });
    });
  }
  return loading.then(
    () => cleanup(),
    (error: unknown) => {
      cleanup();
      throw error;
    },
  );
}

/** Per-frame log-probabilities of prepared samples. */
async function logProbs(pcm: Float32Array): Promise<Float32Array[]> {
  await loadModel();
  const id = nextId++;
  const reply = await new Promise<WorkerReply>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ type: 'run', id, pcm }, [pcm.buffer]);
  });
  if (reply.type !== 'logits') throw new PronError('failed');
  return logSoftmaxRows(reply.data, reply.frames, reply.vocab);
}

/**
 * Scores a recording of `text`. Resolves null when the recording is silent (nothing to
 * score); rejects with a PronError when the model cannot be used.
 */
export async function scoreRecording(blob: Blob, text: string): Promise<SpokenScore | null> {
  // A microphone that produced no frames at all leaves an empty recording: nothing said.
  if (blob.size === 0) return null;
  let pcm: Float32Array;
  try {
    pcm = await decodeToPcm(blob);
  } catch {
    throw new PronError('failed');
  }
  if (isSilent(pcm)) return null;
  return scorePronunciation(text, await logProbs(prepareForModel(pcm)));
}
