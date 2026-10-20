/* This template is filled by build-service-worker.mjs after Vite finishes. */
const VERSION = __BUILD_VERSION__;
const FILES = __PRECACHE_URLS__;
const CACHE_PREFIX = `little-days:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const urls = FILES.map((file) => new URL(file, self.registration.scope).href);
const knownUrls = new Set(urls);
const indexUrl = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urls.map((url) => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // Do not skipWaiting: an update must not interrupt an active play session.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    // No clients.claim(): a page and its assets always come from the same build.
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigation queries (e.g. an installed launch URL) use the cached app shell.
  const isNavigation = request.mode === 'navigate' && url.href.startsWith(self.registration.scope);
  url.search = '';
  url.hash = '';
  const cacheUrl = isNavigation ? indexUrl : url.href;
  if (!isNavigation && !knownUrls.has(cacheUrl)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(cacheUrl)) ?? fetch(request);
  })());
});
