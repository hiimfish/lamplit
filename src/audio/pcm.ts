/**
 * A recording as the pronunciation model wants it: 16 kHz mono samples, the quiet ends cut,
 * a little silence put back around the speech, then zero mean and unit variance (what
 * wav2vec2's feature extractor does).
 */

export const SAMPLE_RATE = 16000;
/** Silence kept before and after the speech: the model misses a first letter said at once. */
const PAD_SECONDS = 0.25;
/** Longest recording scored; the rest is dropped. */
const MAX_SECONDS = 20;
/** Window for loudness, in samples (30 ms). */
const WINDOW = 480;
/** Below this loudness (RMS of the loudest window) the recording counts as silent. */
const SILENT_RMS = 0.01;

/** Decodes a recording (WebM, MP4, …) to 16 kHz mono. */
export async function decodeToPcm(blob: Blob): Promise<Float32Array> {
  const data = await blob.arrayBuffer();
  // An offline context decodes straight to its own sample rate.
  const context = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  const audio = await context.decodeAudioData(data);
  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const channel = audio.getChannelData(c);
    for (let i = 0; i < mono.length; i++) mono[i]! += (channel[i] ?? 0) / audio.numberOfChannels;
  }
  return mono;
}

function windowRms(pcm: Float32Array, start: number): number {
  let sum = 0;
  const end = Math.min(pcm.length, start + WINDOW);
  for (let i = start; i < end; i++) sum += (pcm[i] ?? 0) ** 2;
  return Math.sqrt(sum / Math.max(1, end - start));
}

/** Loudness of each 30 ms window. */
function loudness(pcm: Float32Array): number[] {
  const out: number[] = [];
  for (let start = 0; start < pcm.length; start += WINDOW) out.push(windowRms(pcm, start));
  return out;
}

/** Nothing louder than a quiet room. */
export function isSilent(pcm: Float32Array): boolean {
  return Math.max(0, ...loudness(pcm)) < SILENT_RMS;
}

/** Cuts the quiet ends (under a tenth of the loudest window), pads, normalizes. */
export function prepareForModel(pcm: Float32Array): Float32Array {
  const levels = loudness(pcm);
  const threshold = Math.max(SILENT_RMS / 2, Math.max(0, ...levels) / 10);
  const first = levels.findIndex((l) => l >= threshold);
  let last = levels.length - 1;
  while (last > first && (levels[last] ?? 0) < threshold) last--;
  const from = Math.max(0, first) * WINDOW;
  const to = Math.min(pcm.length, (last + 1) * WINDOW, from + MAX_SECONDS * SAMPLE_RATE);
  const pad = Math.round(PAD_SECONDS * SAMPLE_RATE);
  const out = new Float32Array(to - from + 2 * pad);
  out.set(pcm.subarray(from, to), pad);
  let mean = 0;
  for (const x of out) mean += x;
  mean /= out.length || 1;
  let variance = 0;
  for (const x of out) variance += (x - mean) ** 2;
  const scale = 1 / Math.sqrt(variance / (out.length || 1) + 1e-7);
  for (let i = 0; i < out.length; i++) out[i] = ((out[i] ?? 0) - mean) * scale;
  return out;
}
