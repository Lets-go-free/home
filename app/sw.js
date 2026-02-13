// ─── Let's go free · Service Worker ───────────────────────────────────────
// Version is injected by the main app when updating content
const CACHE_VERSION = 'lgf-v1.0.0';
const CACHE_NAME = `letsgofree-${CACHE_VERSION}`;

// Core app shell files to cache on install
const APP_SHELL = [
  '/app/',
  '/app/index.html',
];

// ── Install: cache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('letsgofree-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for freebie pages, network-first for rest ──────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache freebie HTML pages (letsgofree.me domain)
  if (url.hostname === 'www.letsgofree.me' || url.hostname === 'letsgofree.me') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback: return cached version if available
          return caches.match(event.request);
        });
      })
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── Message: force update cache of specific URL ───────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache =>
        Promise.all(urls.map(url =>
          fetch(url, { cache: 'reload' }).then(res => {
            if (res.status === 200) cache.put(url, res);
          }).catch(() => {})
        ))
      ).then(() => {
        event.source.postMessage({ type: 'CACHE_COMPLETE' });
      })
    );
  }
});
