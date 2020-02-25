const cacheName = 'offlinePage';
const offlineUrl = new Request('offline.html', { cache: 'reload' });

const cacheOfflinePage = async () => {
  const cache = await caches.open(cacheName);
  return cache.add(offlineUrl);
};

const getPage = event => {
  return fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match('offline.html');
    return cachedResponse;
  });
};

self.addEventListener('install', async event => {
  self.skipWaiting();
  event.waitUntil(cacheOfflinePage());
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(getPage(event));
});