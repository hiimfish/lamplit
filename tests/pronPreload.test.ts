import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  preloadModel,
  preloadStore,
  resetPreload,
  type PreloadDeps,
} from '../src/audio/pronPreload';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(cached: boolean, supported = true) {
  const load = deferred();
  let onProgress: (f: number) => void = () => {};
  const deps: PreloadDeps = {
    supported: () => supported,
    cached: vi.fn(async () => cached),
    load: vi.fn((progress: (f: number) => void) => {
      onProgress = progress;
      return load.promise;
    }),
  };
  return { deps, load, progress: (f: number) => onProgress(f) };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('preloadModel (the title screen loading bar)', () => {
  beforeEach(() => resetPreload());

  it('downloads the first time with progress, then is ready', async () => {
    const t = setup(false);
    const done = preloadModel(t.deps);
    expect(preloadStore.get().phase).toBe('checking');
    await flush();
    expect(preloadStore.get()).toMatchObject({ phase: 'loading', cached: false });
    t.progress(0.37);
    expect(preloadStore.get().progress).toBe(0.37);
    t.progress(1);
    expect(preloadStore.get().phase).toBe('starting');
    t.load.resolve();
    await done;
    expect(preloadStore.get()).toMatchObject({ phase: 'ready', progress: 1 });
  });

  it('says it is reading back a kept model', async () => {
    const t = setup(true);
    void preloadModel(t.deps);
    await flush();
    expect(preloadStore.get()).toMatchObject({ phase: 'loading', cached: true });
  });

  it('a failed load shows failed (說說看 tries again later)', async () => {
    const t = setup(false);
    const done = preloadModel(t.deps);
    await flush();
    t.load.reject(new Error('offline'));
    await done;
    expect(preloadStore.get().phase).toBe('failed');
  });

  it('starts only once per page', async () => {
    const t = setup(true);
    const first = preloadModel(t.deps);
    expect(preloadModel(t.deps)).toBe(first);
    await flush();
    expect(t.deps.load).toHaveBeenCalledTimes(1);
  });

  it('shows nothing where the model cannot run', async () => {
    const t = setup(false, false);
    await preloadModel(t.deps);
    expect(preloadStore.get().phase).toBe('off');
    expect(t.deps.load).not.toHaveBeenCalled();
  });
});
