/*
 * Service worker registration.
 *
 * Only in a production build — a service worker in front of the dev server caches
 * modules that Vite is still hot-reloading and makes changes look like they did not
 * happen. The worker calls skipWaiting/clients.claim itself, so a new release is live
 * on the next launch without asking the user anything.
 */

export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      // an unavailable worker only costs offline support; the app still runs
      console.warn('OceanCool: offline support unavailable —', error?.message || error);
    });
  });
}
