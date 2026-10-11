'use strict';
const CACHE = 'make-play-remix:shell:v1';
const PREFIX = 'make-play-remix:shell:';
const root = new URL('./', self.location.href);
const files = ['index.html', 'manifest.webmanifest', 'icon.svg'];
const urls = files.map(file => new URL(file, root).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
  const canonical = url.pathname === root.pathname || url.pathname === root.pathname + 'index.html'
    ? urls[0] : new URL(url.pathname, root.origin).href;
  if (!urls.includes(canonical)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(canonical) || fetch(event.request);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
  if (event.data?.type === 'CHECK_CACHE') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      const ready = (await Promise.all(urls.map(url => cache.match(url)))).every(Boolean);
      event.ports[0]?.postMessage({ ready });
    })());
  }
});
