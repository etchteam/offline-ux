---
layout: default.hbs
---

<div class="article-header">

  # Caching content

</div>

<p class="subtitle">
  A well implemented cache is fundamental to keeping a website performant and
  functional despite unreliable connections.
</p>

There's still lots of holes in the basic implementation provided in the
[my first cache](/my-first-cache.html) article, it would be tough to manually
maintain the cache and avoid it going stale in any but the simplest of websites.

Luckily there are tools available that make reliably maintaining even the largest
frequently updating caches manageable.

## The same cache, but better

To start with, lets take the cache we already have and re-implement it. This time
the cache is going to be built with <a href="https://developers.google.com/web/tools/workbox" target="_blank" rel="noopener noreferrer">Workbox</a>,
an open source library from Google.

Here's the service worker code from [my first cache](/my-first-cache.html)...

```javascript
const cacheName = 'offline';
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

const cleanup = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => (
    name !== cacheName && caches.delete(name)
  )));
};

self.addEventListener('install', event => {
  event.waitUntil(cacheResources());
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(getResponse(event.request));
});

self.addEventListener('activate', event => {
  event.waitUntil(cleanup());
});
```

Here's the same implementation in Workbox...

```javascript
const strategy = new workbox.strategies.CacheFirst({
  cacheName: 'offline'
});

workbox.routing.registerRoute('/', strategy);
workbox.routing.registerRoute(
  new RegExp('\.(?:css|html|jpeg)$'),
  strategy
);
```
