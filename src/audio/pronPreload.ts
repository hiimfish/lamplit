/**
 * The pronunciation model loads on the title screen, before 點一下開始 (2026-11-26, the
 * player's call: no download note in the middle of a question). The first time it downloads
 * (about 95MB) and is kept in the browser; later opens read it back from there. 點一下開始
 * does not wait for it: the load goes on in the background, and 說說看 or 跟著說 pressed
 * before it ends shares the same load (loadModel) and shows its progress there. A failed load
 * is tried again by the next 說說看.
 */
import { createStore } from '../core/store';
import { loadModel, modelCached, pronSupported } from './pronModel';

export type PreloadPhase =
  /** Not started, or this browser cannot run the model (nothing is shown). */
  | 'off'
  /** Asking the browser whether the model is already kept. */
  | 'checking'
  /** Downloading (first time) or reading it back; `progress` runs 0 to 1. */
  | 'loading'
  /** All bytes are in; the model is being set up. */
  | 'starting'
  | 'ready'
  | 'failed';

export interface PreloadState {
  phase: PreloadPhase;
  /** The model was already on this device (reading back, not downloading). */
  cached: boolean;
  progress: number;
}

export const preloadStore = createStore<PreloadState>({
  phase: 'off',
  cached: false,
  progress: 0,
});

export interface PreloadDeps {
  supported: () => boolean;
  cached: () => Promise<boolean>;
  load: (onProgress: (fraction: number) => void) => Promise<void>;
}

const LIVE: PreloadDeps = { supported: pronSupported, cached: modelCached, load: loadModel };

let started: Promise<void> | null = null;

/** Starts loading the model once per page; later calls return the same promise. */
export function preloadModel(deps: PreloadDeps = LIVE): Promise<void> {
  if (started) return started;
  started = run(deps);
  return started;
}

async function run(deps: PreloadDeps): Promise<void> {
  if (!deps.supported()) return;
  preloadStore.set({ phase: 'checking', progress: 0 });
  const cached = await deps.cached().catch(() => false);
  preloadStore.set({ phase: 'loading', cached });
  try {
    await deps.load((progress) => {
      preloadStore.set(progress >= 1 ? { phase: 'starting', progress: 1 } : { progress });
    });
    preloadStore.set({ phase: 'ready', progress: 1 });
  } catch {
    preloadStore.set({ phase: 'failed' });
  }
}

/** For tests: forget the load so the next preloadModel() starts again. */
export function resetPreload(): void {
  started = null;
  preloadStore.set({ phase: 'off', cached: false, progress: 0 });
}
