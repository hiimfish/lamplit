/**
 * Picking up a new deploy. The site has no service worker, and a phone's home-screen web app
 * (iPhone 加到主畫面) resumes the page it already has instead of loading it again, with no
 * reload gesture, so it could keep the old build for days (2026-11-26). Each build writes its
 * id into the bundle and into version.json (vite.config.ts); when the page opens or comes
 * back to the front this asks for version.json, and if the id differs it reloads straight
 * away where nothing is lost (title, town), or else shows 有新版本 (UpdateBanner) to tap.
 */
import { createStore } from './store';

/** This bundle's build id; 'dev' under the dev server, which never checks. */
export const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? 'dev';

/** The newer build's id once one is found and waiting for a tap, else null. */
export const updateStore = createStore<{ ready: string | null }>({ ready: null });

/** Checks closer together than this (ms) are skipped (switching apps back and forth). */
const CHECK_GAP_MS = 30_000;

/** A different build is out: `remote` is a real id and not this bundle's. */
export function isNewBuild(remote: unknown, local: string = BUILD_ID): remote is string {
  return typeof remote === 'string' && remote !== '' && remote !== local;
}

async function remoteBuildId(): Promise<string | null> {
  try {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { id?: unknown };
    return typeof body.id === 'string' ? body.id : null;
  } catch {
    return null; // offline or a bad file: try again next time
  }
}

/**
 * Loads the new build. A fresh query string makes the browser fetch the page itself again
 * instead of reusing its cached copy (Pages caches it for ten minutes).
 */
export function reloadToUpdate(id: string | null = updateStore.get().ready): void {
  const url = new URL(location.href);
  url.searchParams.set('v', id ?? String(Date.now()));
  location.replace(url.toString());
}

/**
 * Starts watching (call once at start-up). `quietNow` says whether a reload would lose
 * nothing right now; then it reloads by itself, otherwise it waits for the banner's tap.
 */
export function watchForUpdates(quietNow: () => boolean): void {
  // Drop the ?v= a reload left, so the address stays clean.
  const here = new URL(location.href);
  // The build this page was reloaded for. If it still is not the one running (a cache gave
  // the old page again), ask with the banner rather than reloading in a loop.
  const reloadedFor = here.searchParams.get('v');
  if (reloadedFor !== null) {
    here.searchParams.delete('v');
    history.replaceState(history.state, '', here.toString());
  }
  if (import.meta.env.DEV) return;
  // public/sw.js: the page and version.json always come from the network, never a cache.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // No service worker (private mode, an old browser): the version check still works.
    });
  }
  let last = -Infinity;
  const check = async () => {
    const now = Date.now();
    if (now - last < CHECK_GAP_MS) return;
    last = now;
    const id = await remoteBuildId();
    if (!isNewBuild(id)) return;
    if (quietNow() && id !== reloadedFor) reloadToUpdate(id);
    else updateStore.set({ ready: id });
  };
  void check();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) void check();
  });
}
