self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only cache GET static assets; pass through others.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Simple stale-while-revalidate for static files.
  event.respondWith(
    caches.open('oneman-static-v1').then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((response) => {
          if (response.status === 200) cache.put(req, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    )
  );
});
