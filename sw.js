const CACHE = 'solitaire-offline-v055';
const ROOT = new URL('./', self.location.href).href;
const INDEX = new URL('index.html', ROOT).href;
const ICON = new URL('icon.png', ROOT).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([INDEX, ICON].map(url => new Request(url, {cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('solitaire-offline-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' && (url.pathname === new URL(ROOT).pathname || url.pathname === new URL(INDEX).pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(req, {cache:'no-cache'});
        if (!response.ok) throw new Error('Navigation failed');
        await cache.put(INDEX, response.clone());
        return response;
      } catch (error) {
        return (await cache.match(INDEX)) || Response.error();
      }
    })());
  } else if (url.href === ICON) {
    event.respondWith((async () => (await (await caches.open(CACHE)).match(ICON)) || fetch(req))());
  }
});
