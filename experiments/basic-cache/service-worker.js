const cacheName = 'cache';
const image = new Request('/image.jpeg', { cache: 'reload' });
const thingsToCache = ['/', 'index.html', 'styles.css', image];

const cacheResources = async () => {
  const cache = await caches.open(cacheName);
  return cache.addAll(thingsToCache);
};

const getResponse = async request => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  return cachedResponse || fetch(request);
};

self.addEventListener('install', async event => {
  self.skipWaiting();
  event.waitUntil(cacheResources());
});

self.addEventListener('fetch', event => {
  event.respondWith(getResponse(event.request));
});