const cacheName = 'cache';
const image = 'https://images.unsplash.com/photo-1572627690516-b531677b926f?ixlib=rb-1.2.1&auto=format&fit=crop&w=802&q=80';
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