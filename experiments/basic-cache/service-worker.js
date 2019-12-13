self.addEventListener('install', event => {
  const image = 'https://images.unsplash.com/photo-1572627690516-b531677b926f?ixlib=rb-1.2.1&auto=format&fit=crop&w=802&q=80';
  const thingsToCache = ['/', 'index.html', 'styles.css', image];
  const cached = caches.open('cache').then(cache => cache.addAll(thingsToCache));
  event.waitUntil(cached);
});

self.addEventListener('fetch', event => {
  const response = caches.match(event.request)
    .then(cachedResponse => {
      return cachedResponse ? cachedResponse : fetch(event.request);
    });
  event.respondWith(response);
});