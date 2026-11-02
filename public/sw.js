// Hustle service worker: lets the game be installed to a home screen and open instantly.
// The game itself is always live, so only the app shell is cached; game data always comes from the server.
const SHELL = "backstreet-shell-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then(c => c.addAll(["/", "/favicon.svg", "/icon-192.png"]))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;  // never touch Supabase or Stripe
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }
  if (u.pathname.startsWith("/assets/")) {  // Vite's hashed files never change, so cache them for good
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; })));
  }
});
