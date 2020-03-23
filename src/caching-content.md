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

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

Much cleaner right!

We're using `workbox.strategies.CacheFirst` for the home route or any files ending
in .css, .jpeg or .html (based on the regex). This will handle:

1. Attempting to serve content from a cache called "offline"
2. Falling back to the network if nothing is found in the cache
3. Updating the cache with the network response

It'll also cleanup stale caches for us too.

<a href="https://developers.google.com/web/tools/workbox/modules/workbox-strategies" target="_blank" rel="noopener noreferrer">Learn more about other caching strategies</a>
workbox makes available or see
<a href="https://glitch.com/edit/#!/my-first-workbox-cache?path=service-worker.js:15:3"  target="_blank" rel="noopener noreferrer">this cache in action</a>.

So far, this cache only replicates the functionality of the last one with less
lines of code. There is still a big problem, if the website content changes then
the cache will not automatically update. People who have already viewed the site
will all see out of date content.

## Automatically update the cache

There are two ways to solve this problem...

1. Update file names when a file changes
2. Update the contents of the cache on detected file changes