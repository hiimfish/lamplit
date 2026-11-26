// Lamplit's service worker: never let a cache hand out an old page (2026-11-26).
//
// GitHub Pages lets browsers keep index.html for ten minutes, and a phone's home-screen web
// app can hold on to it longer. The page itself (a navigation) and version.json are therefore
// always fetched from the network, skipping every cache; only when the network fails is the
// browser's own copy used, so the game still opens offline if it can. Everything else (the
// hashed scripts and styles, pictures, audio, the pronunciation model) goes past untouched.
// Nothing is stored here. Registered by src/core/update.ts; tests/mobileGuards.test.ts runs it.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** True for the requests that must never come from a cache. */
function mustBeFresh(request) {
  if (request.method !== 'GET') return false;
  if (request.mode === 'navigate') return true;
  return new URL(request.url).pathname.endsWith('/version.json');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!mustBeFresh(request)) return;
  event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => fetch(request)));
});
