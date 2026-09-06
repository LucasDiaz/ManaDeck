/* eslint-env serviceworker */
/* =============================================================
   ManaDeck — Service Worker

   Caching strategy
   ----------------
   - App shell (HTML / CSS / JS bundles / static SVGs / icons):
       stale-while-revalidate, pre-cached on install.
   - Navigations: network-first, falling back to the cached shell
       so the app opens offline.
   - Scryfall API (api.scryfall.com): network-first, with a
       synthetic `503 { object: "error" }` body when offline so the
       service layer rejects cleanly instead of throwing.
   - Card art / symbol SVGs: cache-first with a bounded cache.

   Bump CACHE_VERSION to invalidate every cache on the next activate.
   ============================================================= */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `manadeck-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `manadeck-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `manadeck-images-${CACHE_VERSION}`;
const EXPECTED_CACHES = [SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE];

const IMAGE_CACHE_LIMIT = 80;

/** Minimal shell — hashed build assets are picked up at runtime. */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

const SCRYFALL_API_ORIGIN = "https://api.scryfall.com";
const SCRYFALL_SVG_ORIGIN = "https://svgs.scryfall.io";

/* ---- Lifecycle ------------------------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => !EXPECTED_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ---- Fetch routing --------------------------------------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin === SCRYFALL_API_ORIGIN) {
    event.respondWith(apiNetworkFirst(request));
    return;
  }

  if (url.origin === SCRYFALL_SVG_ORIGIN) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") {
      event.respondWith(navigationHandler(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  }
  // Anything else falls through to the network (default handling).
});

/* ---- Strategies ----------------------------------------- */

async function navigationHandler(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      trimCache(cacheName, IMAGE_CACHE_LIMIT);
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function apiNetworkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({
        object: "error",
        status: 503,
        code: "offline",
        details:
          "Sin conexión: no se puede contactar con Scryfall en este momento.",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(
    keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key)),
  );
}
