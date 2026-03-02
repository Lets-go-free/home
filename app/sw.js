// ─── Let's go free · Service Worker ───────────────────────────────────────
const CACHE_VERSION = 'lgf-v99.0';
const CACHE_NAME = `letsgofree-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/app-styles.css',
  '/dateien/icon-192-v2.png',
  '/dateien/icon-512-v2.png',
  '/dateien/freebie-defi-glossar.html',
  '/dateien/freebie-datensicherungsblatt.html',
  '/dateien/freebie-datensicherungsblatt_split.html',
  '/dateien/freebie-wallet-vergleich.html',
  '/dateien/freebie-gas-fee-guide.html',
  '/ebook/ebook-kap1.html',
  '/ebook/ebook-kap2.html',
  '/ebook/ebook-kap3.html',
  '/ebook/ebook-kap4.html',
  '/ebook/ebook-kap5.html',
  '/ebook/ebook-kap6.html',
  '/ebook/ebook-kap7.html',
  '/ebook/ebook-kap8.html',
  '/ebook/kompakt-kap1.html',
  '/ebook/kompakt-kap2.html',
  '/ebook/kompakt-kap3.html',
  '/ebook/kompakt-kap4.html',
  '/ebook/kompakt-kap5.html',
  '/ebook/krypto-einsteiger-guide.pdf',
  '/dateien/bonus-checkliste.html',
  '/dateien/bonus-bonus-empfehlungen.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Netlify Functions nie cachen
  if (url.pathname.startsWith('/.netlify/functions/')) return;

  // Freebie-Seiten auf letsgofree.me: cache-first mit Netz-Fallback
  if (url.hostname === 'www.letsgofree.me' || url.hostname === 'letsgofree.me') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // App Shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Auf Befehl bestimmte URLs cachen (z.B. Freebies vorab laden)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache =>
        Promise.all(event.data.urls.map(url =>
          fetch(url, { cache: 'reload' }).then(res => {
            if (res.status === 200) cache.put(url, res);
          }).catch(() => {})
        ))
      ).then(() => event.source.postMessage({ type: 'CACHE_COMPLETE' }))
    );
  }
});
