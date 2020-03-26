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
the cache is going to be built with [Workbox](https://developers.google.com/web/tools/workbox),
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
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const cacheFirst = new workbox.strategies.CacheFirst({
  cacheName: 'offline'
});

workbox.routing.registerRoute('/', cacheFirst);
workbox.routing.registerRoute(
  new RegExp('\.(?:css|html|jpeg)$'),
  cacheFirst
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

[Learn more about other caching strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
that Workbox makes available or see
[this cache in action](https://glitch.com/edit/#!/my-first-workbox-cache?path=service-worker.js:15:3).

So far, this cache only replicates the functionality of the last one with less
lines of code. There is still a big problem, if the website content changes then
the cache will not automatically update. People who have already viewed the site
will all see out of date content.

## Automatically update the cache

There are three ways to solve this problem...

1. Update cache content on detected file changes
2. Set an expiration time on the cache
3. Change file names to trigger cache updates

### Update cache content on detected file changes

Workbox has a concept called "precaching". It involves defining a set of files
along with version info that will be downloaded and cached on the service worker
"install" event.

It's possible to manually change the current service worker to use precaching, here's
how it would look...

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([
  {
    "revision": "1",
    "url": "image.jpeg"
  }, {
    "revision":"1",
    "url":"index.html"
  }, {
    "revision":"1",
    "url":"styles.css"
  }
]);

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

The `precacheAndRoute` function will handle storing all the URLs in the cache and
setting up individual routes for them using the `CacheFirst` strategy.

Another really handy feature is that it will account for common URL practices, we
no longer need an extra route for `/` because `precacheAndRoute` is smart enough
to match it to `index.html`.

With this set up, changing the `revision` property on any of the files will cause
the cache to update only where the revision has changed. This avoids having to update
the entire cache when only part of it changes.

Now we just need a way to automatically update the revision number when files change.

The simplest way to do this is by using [Workbox CLI](https://developers.google.com/web/tools/workbox/modules/workbox-cli)

### Set an expiration time on the cache

Out of all the content on most websites images are one of the least likely to
regularly update, they also consume the most cache storage space and are often
not essential for the website to work.

So a sensible approach is to create a separate dedicated image cache.

### Change file names to trigger cache updates

## Avoid using the CDN

Currently the Workbox code in the service worker uses a CDN script, the script is
smart but still adds overhead pulling in the modules it needs.

A better approach would be to only import the specific modules that are being used,
this will reduce the overall service worker size and improve how we managing including
and versioning the modules.
