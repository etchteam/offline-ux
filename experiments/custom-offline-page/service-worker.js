const cacheName = 'offline';
const offlineUrl = 'offline.html';

self.addEventListener('install', async () => {
  const offlinePage = new Request(offlineUrl, {cache: 'reload'});
  const cache = await caches.open(cacheName);
  return cache.add(offlinePage);
});

self.addEventListener('fetch', async event => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  try {
    const response = fetch(event.request);
    event.respondWith(response);
  } catch (err) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(offlineUrl);
    event.respondWith(response);
  }
});