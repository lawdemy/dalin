/*
 * DaLin service worker: shows push notifications and opens the right page
 * when one is tapped. It doesn't cache pages (the diary is always live).
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** Only paths on this site; anything else opens the dashboard. */
function safePath(href) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//")
    ? href
    : "/admin";
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "DaLin", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "DaLin", {
        body: data.body || "",
        tag: data.tag,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        data: { href: safePath(data.href) },
      });
      // Let open pages refresh their bell.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: "dalin:notification" });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = safePath(event.notification.data && event.notification.data.href);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(href);
          return;
        }
      }
      await self.clients.openWindow(href);
    })(),
  );
});
