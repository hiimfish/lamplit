// Guards for problems found on a real phone (2026-11-26), so they cannot come back unnoticed:
// the page zoomed on a double tap or a pinch, 確定離開 outgrew the title strip, and a
// home-screen web app kept an old build (sw.js and the version check, core/update.ts).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { lockZoom } from '../src/core/noZoom';

const read = (path: string) => readFileSync(path, 'utf8');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

describe('no zoom', () => {
  it('the viewport turns zoom off', () => {
    const viewport = /<meta\s+name="viewport"\s+content="([^"]*)"/.exec(read('index.html'))?.[1];
    expect(viewport).toContain('maximum-scale=1');
    expect(viewport).toContain('user-scalable=no');
  });

  it('every element has a touch-action without zoom', () => {
    const css = read('src/styles.css');
    expect(css).toMatch(/\*\s*\{[^}]*touch-action:\s*pan-x pan-y;/);
  });

  it('no stylesheet lets zoom back in', () => {
    // auto and manipulation allow double-tap zoom or pinch; pinch-zoom allows pinch.
    const allowed = new Set(['pan-x pan-y', 'pan-x', 'pan-y', 'none']);
    for (const file of cssFiles('src')) {
      for (const [, value] of read(file).matchAll(/touch-action:\s*([^;]+);/g)) {
        expect(allowed.has(value!.trim()), `${file}: touch-action: ${value}`).toBe(true);
      }
    }
  });

  function fakeTarget() {
    const handlers = new Map<string, (e: Event) => void>();
    return {
      handlers,
      addEventListener: (type: string, handler: (e: Event) => void) => handlers.set(type, handler),
    };
  }
  const event = (extra: object = {}) =>
    ({ cancelable: true, preventDefault: vi.fn(), ...extra }) as unknown as Event & {
      preventDefault: ReturnType<typeof vi.fn>;
    };

  it("stops Safari's pinch gestures", () => {
    const target = fakeTarget();
    lockZoom(target as unknown as EventTarget);
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      const e = event();
      target.handlers.get(type)!(e);
      expect(e.preventDefault, type).toHaveBeenCalled();
    }
  });

  it('stops a two-finger move but lets one finger scroll', () => {
    const target = fakeTarget();
    lockZoom(target as unknown as EventTarget);
    const two = event({ touches: { length: 2 } });
    const one = event({ touches: { length: 1 } });
    target.handlers.get('touchmove')!(two);
    target.handlers.get('touchmove')!(one);
    expect(two.preventDefault).toHaveBeenCalled();
    expect(one.preventDefault).not.toHaveBeenCalled();
  });
});

describe('確定離開', () => {
  it('keeps the size of 先回小鎮 (no .primary, which is taller and wider)', () => {
    const source = read('src/ui/QuitKey.tsx');
    expect(source).not.toMatch(/primary/);
    expect(read('src/ui/flow.css')).toMatch(/\.pixel-button\.quit\.armed\s*\{\s*background:/);
  });
});

describe('sw.js', () => {
  /** Runs public/sw.js against a fake worker scope and returns its fetch handler. */
  function loadWorker() {
    const handlers = new Map<string, (e: unknown) => void>();
    const self = {
      addEventListener: (type: string, handler: (e: unknown) => void) =>
        handlers.set(type, handler),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn(() => Promise.resolve()) },
    };
    const fetch = vi.fn(() => Promise.resolve('network'));
    new Function('self', 'fetch', read('public/sw.js'))(self, fetch);
    const onFetch = (request: { url: string; mode: string; method?: string }) => {
      const respondWith = vi.fn();
      handlers.get('fetch')!({ request: { method: 'GET', ...request }, respondWith });
      return { respondWith };
    };
    return { handlers, self, onFetch, fetch };
  }

  it('fetches the page itself past every cache', () => {
    const { onFetch, fetch } = loadWorker();
    const { respondWith } = onFetch({ url: 'https://x.io/lamplit/', mode: 'navigate' });
    expect(respondWith).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(expect.anything(), { cache: 'no-store' });
  });

  it('fetches version.json past every cache', () => {
    const { onFetch } = loadWorker();
    const { respondWith } = onFetch({ url: 'https://x.io/lamplit/version.json?t=1', mode: 'cors' });
    expect(respondWith).toHaveBeenCalled();
  });

  it('leaves scripts, audio and posts alone', () => {
    const { onFetch } = loadWorker();
    for (const url of [
      'https://x.io/lamplit/assets/index-abc.js',
      'https://x.io/lamplit/audio/a.mp3',
    ]) {
      expect(onFetch({ url, mode: 'no-cors' }).respondWith).not.toHaveBeenCalled();
    }
    const post = onFetch({ url: 'https://x.io/lamplit/', mode: 'navigate', method: 'POST' });
    expect(post.respondWith).not.toHaveBeenCalled();
  });

  it('takes over at once, so the next open already uses it', () => {
    const { handlers, self } = loadWorker();
    handlers.get('install')!({});
    handlers.get('activate')!({ waitUntil: vi.fn() });
    expect(self.skipWaiting).toHaveBeenCalled();
    expect(self.clients.claim).toHaveBeenCalled();
  });
});
