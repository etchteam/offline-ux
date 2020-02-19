const cacheName = 'offlinePage';
const offlineUrl = 'offline.html';

const cacheOfflinePage = async () => {
  const cache = await caches.open(cacheName);
  return cache.add(offlineUrl);
};

const getOfflinePage = async () => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(offlineUrl);
  return cachedResponse;
};

self.addEventListener('install', async event => {
  self.skipWaiting();
  event.waitUntil(cacheOfflinePage());
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  try {
    event.respondWith(fetch(event.request));
  } catch (err) {
    event.respondWith(getOfflinePage());
  }
});