/*
 * OceanCool service worker — offline-friendly shell, hand written so there is no
 * build-plugin magic to debug.
 *
 * Strategy per request type:
 *   navigations   network first, fall back to the cached app shell (so an offline
 *                 launch from the home screen still opens the app)
 *   static assets cache first (Vite fingerprints filenames, so a cached hit is
 *                 always the right version)
 *   /api/**       network only — records must never be read from a stale cache
 *
 * Bump CACHE_VERSION on release to retire old caches.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `oceancool-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `oceancool-assets-${CACHE_VERSION}`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // one miss (a renamed icon, say) must not fail the whole install
      .then((cache) => Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// lets the app activate a waiting worker as soon as the user accepts the update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigateWithShellFallback(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|woff2?|json)$/.test(pathname)
  );
}

async function navigateWithShellFallback(request) {
  try {
    const response = await fetch(request);
    // keep the shell fresh for the next offline launch
    const cache = await caches.open(SHELL_CACHE);
    cache.put('/index.html', response.clone());
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached = (await cache.match('/index.html')) || (await cache.match('/'));
    return (
      cached ||
      new Response('<h1>OceanCool is offline</h1><p>Reconnect and try again.</p>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}
