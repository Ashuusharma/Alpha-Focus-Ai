self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Alpha Focus", body: "You have a new reminder." };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    payload = { title: "Alpha Focus", body: "You have a new reminder." };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "alpha-focus-sync") {
    event.waitUntil(Promise.resolve());
  }
});
