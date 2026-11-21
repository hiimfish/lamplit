/**
 * Pronunciation playback. Clips are pre-generated mp3 files; decoded buffers are
 * cached. A missing or undecodable clip falls back to browser speech (when text is
 * given) or silence. Nothing here throws to callers.
 */
import { settingsStore } from '../core/settings';
import { resumeIfNeeded } from './audioContext';
import { getAudioManager } from './AudioManager';
import { speakWithBrowser } from './browserSpeech';
import { audioPath, isValidAudioId, type Speed } from './voices';

export { isValidAudioId };

export interface PlayOptions {
  speed?: Speed;
  /** Fallback text for browser speech when the clip cannot be played. */
  text?: string;
}

/** Throws for ids that could escape the audio folder or break the URL ('../', '#', '?'). */
export function clipUrl(audioId: string, speed: Speed = 'normal'): string {
  if (!isValidAudioId(audioId)) throw new Error(`invalid audio id: ${JSON.stringify(audioId)}`);
  return `${import.meta.env.BASE_URL}${audioPath(settingsStore.get().voiceMode, audioId, speed)}`;
}

/** url -> decoded buffer, or null when the file is missing/undecodable. Fetched once per URL. */
const bufferCache = new Map<string, Promise<AudioBuffer | null>>();

async function fetchAndDecode(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const bytes = await response.arrayBuffer();
  try {
    return await ctx.decodeAudioData(bytes);
  } catch {
    return null; // e.g. a 200 response carrying an HTML fallback page
  }
}

function loadBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  let cached = bufferCache.get(url);
  if (!cached) {
    cached = fetchAndDecode(url, ctx).catch(() => {
      bufferCache.delete(url); // network error: allow a later retry
      return null;
    });
    bufferCache.set(url, cached);
  }
  return cached;
}

interface Playing {
  source: AudioBufferSourceNode;
  finish: () => void;
}

let current: Playing | null = null;
/** Bumped by every play/stop so a slow load can tell it has been superseded. */
let sequence = 0;

/** Resolves when the clip finishes (or immediately if nothing could be played). */
export async function playAudio(audioId: string, options: PlayOptions = {}): Promise<void> {
  try {
    await play(audioId, options);
  } catch {
    // never throw to callers
  }
}

async function play(audioId: string, options: PlayOptions): Promise<void> {
  const speed = options.speed ?? 'normal';
  stopAudio();
  const mine = ++sequence;
  const manager = getAudioManager();
  const url = isValidAudioId(audioId) ? clipUrl(audioId, speed) : null;
  const buffer = manager && url ? await loadBuffer(url, manager.ctx) : null;
  if (mine !== sequence) return; // cancelled or replaced while loading
  if (!manager || !buffer) {
    if (options.text) speakWithBrowser(options.text, { slow: speed === 'slow' });
    return;
  }
  resumeIfNeeded(manager.ctx);
  await new Promise<void>((resolve) => {
    const source = manager.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(manager.voice);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (current?.source === source) current = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
      manager.voiceEnded();
      resolve();
    };
    source.onended = finish;
    current = { source, finish };
    manager.voiceStarted();
    source.start();
  });
}

/** Stops any clip (or browser speech) that is playing. */
export function stopAudio(): void {
  sequence += 1;
  current?.finish();
  current = null;
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

/** Warms the cache (normal speed) so first playback has no delay. Safe before unlock: does nothing. */
export function preloadAudio(ids: string[]): void {
  const manager = getAudioManager();
  if (!manager) return;
  for (const id of ids) {
    if (isValidAudioId(id)) void loadBuffer(clipUrl(id, 'normal'), manager.ctx);
  }
}
