/**
 * The pronunciation model's own thread (pronModel.ts talks to it). Downloads the model from
 * this site in parts, keeps it in the Cache API so later visits (and offline play) skip the
 * download, and runs it with onnxruntime-web on WebAssembly. Nothing leaves the device.
 */
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import { MODEL_CACHE, MODEL_PARTS, MODEL_BYTES } from './pronFiles';

export type WorkerRequest =
  { type: 'load'; base: string } | { type: 'run'; id: number; pcm: Float32Array };

export type WorkerReply =
  | { type: 'progress'; fraction: number }
  | { type: 'ready' }
  | { type: 'logits'; id: number; data: Float32Array; frames: number; vocab: number }
  | { type: 'error'; id?: number; code: 'download-failed' | 'failed' };

const post = (reply: WorkerReply, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(reply, transfer);

ort.env.wasm.wasmPaths = { wasm: wasmUrl };
// GitHub Pages cannot send the headers threads need; one thread keeps it simple everywhere.
ort.env.wasm.numThreads = 1;

let session: Promise<ort.InferenceSession> | null = null;

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(MODEL_CACHE);
  } catch {
    return null;
  }
}

/** One part's bytes: from the cache, or downloaded (and then cached). */
async function part(
  url: string,
  cache: Cache | null,
  onBytes: (n: number) => void,
): Promise<Uint8Array> {
  const cached = await cache?.match(url);
  if (cached) {
    const bytes = new Uint8Array(await cached.arrayBuffer());
    onBytes(bytes.length);
    return bytes;
  }
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`download ${response.status}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    onBytes(value.length);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  await cache?.put(url, new Response(bytes)).catch(() => undefined);
  return bytes;
}

async function load(base: string): Promise<ort.InferenceSession> {
  const cache = await openCache();
  let done = 0;
  let lastSent = -1;
  const onBytes = (n: number) => {
    done += n;
    const fraction = Math.min(1, done / MODEL_BYTES);
    if (fraction - lastSent >= 0.01 || fraction === 1) {
      lastSent = fraction;
      post({ type: 'progress', fraction });
    }
  };
  let parts: Uint8Array[];
  try {
    parts = [];
    for (const name of MODEL_PARTS) parts.push(await part(`${base}${name}`, cache, onBytes));
  } catch (error) {
    throw Object.assign(new Error(String(error)), { code: 'download-failed' as const });
  }
  const model = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    model.set(p, at);
    at += p.length;
  }
  return ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
}

async function run(id: number, pcm: Float32Array): Promise<void> {
  if (!session) throw new Error('not loaded');
  const s = await session;
  const input = new ort.Tensor('float32', pcm, [1, pcm.length]);
  const output = await s.run({ [s.inputNames[0] ?? 'input_values']: input });
  const logits = output[s.outputNames[0] ?? 'logits'];
  if (!logits) throw new Error('no logits');
  const [, frames = 0, vocab = 0] = logits.dims;
  const data = logits.data as Float32Array;
  post({ type: 'logits', id, data, frames, vocab }, [data.buffer]);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === 'load') {
    session ??= load(message.base);
    session.then(
      () => post({ type: 'ready' }),
      (error: unknown) => {
        session = null;
        const code =
          (error as { code?: string }).code === 'download-failed' ? 'download-failed' : 'failed';
        post({ type: 'error', code });
      },
    );
    return;
  }
  run(message.id, message.pcm).catch(() => post({ type: 'error', id: message.id, code: 'failed' }));
};
