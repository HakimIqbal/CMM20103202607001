/* Development service worker: immediately unregisters itself and clears all caches.
   PWA offline support will be reintroduced in Step 6 with proper cache versioning. */
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => caches.delete(n)))
    ).then(() => self.registration.unregister())
  );
});
