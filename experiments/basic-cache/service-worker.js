const cacheName = 'cache';

self.addEventListener('install', async () => {
  const image = 'https://images.unsplash.com/photo-1572627690516-b531677b926f?ixlib=rb-1.2.1&auto=format&fit=crop&w=802&q=80';
  const thingsToCache = ['/', 'index.html', 'styles.css', image];
  const cache = await caches.open(cacheName);
  return cache.addAll(thingsToCache);
});

self.addEventListener('fetch', async event => {
  const cache = await caches.open(cacheName);
  const response = await cache.match(event.request);
  event.respondWith(response || fetch(event.request));
});