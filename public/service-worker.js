const STATIC_CACHE = "alpha-focus-static-v2";
const PAGE_CACHE = "alpha-focus-pages-v2";
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          event.waitUntil(caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, cloned)));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }

          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, response.clone())))
            .catch(() => undefined)
        );
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, response.clone())));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Alpha Focus", body: "You have a new reminder.", url: "/dashboard", tag: "system", requireInteraction: false, renotify: false, vibrate: [90] };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    payload = { title: "Alpha Focus", body: "You have a new reminder.", url: "/dashboard", tag: "system", requireInteraction: false, renotify: false, vibrate: [90] };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      tag: payload.tag || "system",
      requireInteraction: Boolean(payload.requireInteraction),
      renotify: Boolean(payload.renotify),
      vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [90],
      data: {
        url: payload.url || payload.actionUrl || "/dashboard",
        metadata: payload.metadata || {},
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url.includes(self.location.origin));
      if (matchingClient) {
        return matchingClient.focus().then(() => matchingClient.navigate(targetUrl));
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "alpha-focus-sync") {
    event.waitUntil(Promise.resolve());
  }
});
