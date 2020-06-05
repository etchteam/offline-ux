---
layout: default.hbs
---

<div class="article-header">

  # Versioning offline content

</div>

<p class="subtitle">
  A well implemented cache is fundamental to keeping a website performant and
  functional despite unreliable connections.
</p>

There's still lots of holes in the basic implementation provided in the
[offline fundamentals](/offline-fundamentals) article, it would be
tough to manually maintain the cache and avoid it going stale in any but the simplest
of websites.

Luckily there are tools available that make reliably maintaining even the largest
frequently updating caches manageable.

## Introducing Workbox

[Workbox](https://developers.google.com/web/tools/workbox) is an open source library
from Google which makes working with caches and service workers easier. To get started
we're going to move the cache we already have to Workbox.

Here's the existing service worker code from [offline fundamentals](/offline-fundamentals)&hellip;

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

Here's the same implementation in Workbox&hellip;

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

We're pulling down the Workbox lib from a CDN with `importScripts` then using `workbox.strategies.CacheFirst`
for the home route or any files ending in .css, .jpeg or .html (based on the regex).
This will handle:

1. Attempting to serve content from a cache called "offline"
2. Falling back to the network if nothing is found in the cache
3. Updating the cache with the network response
4. Cleaning up any old stale caches

You can view the working [source code and demo](https://glitch.com/edit/#!/workbox-cache)
for this cache or learn more about other caching strategies on the [Workbox website](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)

This is an improvement but so far this cache only replicates the functionality
of the last one with less lines of code. This still leaves the same two big problems:

- The cache will not automatically update on content changes. People who have
already viewed the site will all see out of date content.
- If we update the cache by changing the caches name the entire cache will need
to be re-downloaded, instead of just the content that updated.

As the [saying goes](https://martinfowler.com/bliki/TwoHardThings.html), there is
two hard things in computer science and we're facing one of them &mdash; cache invalidation

## A better way to version caches

Workbox has a concept called **"precaching"**. It involves defining a set of files
along with version info that will be downloaded and cached on the service worker
*install* event.

Most importantly, precaching provides a solution to our cache invalidation woes.

It's reasonably straightforward to manually change the current service worker to
use precaching, here's how it would look&hellip;

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

The `precacheAndRoute` function used here is really smart.

The function will handle storing all the URLs in the cache and setting up
individual routes for them using the `CacheFirst` strategy.

Changing the `revision` property on any of the files will cause
the cache to update **only where the revision has changed**. This avoids having to
update the entire cache when only part of it changes.

Another really handy feature is that it will account for common URL practices, we
no longer need an extra route for `/` because `precacheAndRoute` will automatically
to match it to `index.html`.

Great! Now we just need a way to automatically update the revision number when
files change.

## Update cache version on detected file changes

The implementation needs to move away from manually defining a list of files and
revision information. It's error prone and will take too much work to maintain in
a large codebase.

The only real way to make sure the versioning is kept up to date is by generated
the list of files and versions after files change, instead of manually entering them.

Workbox offers a few ways to generate the list of files at build time, the simplest
option is [Workbox CLI](https://developers.google.com/web/tools/workbox/modules/workbox-cli)
which we'll be using here.

To get started, install the CLI `npm i -g workbox-cli` and run the wizard by using
`workbox wizard`&hellip;

```bash
> workbox wizard

? Please enter the path to the root of your web app: .
? Which file types would you like to precache? jpeg, html, css
? Where would you like your service worker file to be saved? service-worker.js
? Where would you like to save these configuration options? workbox-config.js
```

The wizard creates a config file that it will chuck in the projects root directory
called `workbox-config.js`&hellip;

```javascript
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "*.{jpeg,html,css}"
  ],
  "swDest": "service-worker.js"
};
```

This config only has a destination defined in `swDest`, so it would work with the
`workbox generateSW` command which generates the whole service worker for us.

`workbox-config.js` also accepts an `swSrc` property which tells workbox to use a
template service worker file instead of creating it's own one. We're going to need
that extra control, so let's define `swSrc` as `service-worker-template.js`&hellip;

```javascript
export default {
  "globDirectory": ".",
  "globPatterns": [
    "*.{jpeg,html,css}"
  ],
  "swSrc": "service-worker-template.js",
  "swDest": "service-worker.js"
};
```

To create the `service-worker-template.js` file, we can rename the current service
worker file and update it to replace the list of files with `self.__WB_MANIFEST`&hellip;

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute(
  self.__WB_MANIFEST
);

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

Given a template file Workbox will look for `self.__WB_MANIFEST` and use it to
"inject" the list of files with revision information it generates.

Now that Workbox has a template file to work with it can be told to generate
the service worker using `workbox injectManifest`. The output `service-worker.js`
file will look something like this&hellip;

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([
  {"revision":"13187a99c3b92698b93520df29dc23e4","url":"image.jpeg"},
  {"revision":"a9b2611a124faa588cee9149e1825eeb","url":"index.html"},
  {"revision":"5e89a0d14a7ef2ccb7ae86621bd1c84e","url":"styles.css"}
]);

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

Workbox has generated the list of precache files and revision information for
us 💪. Try updating one of the files and running `workbox injectManifest` again,
the revision number should automatically change for the file that was updated!

## Self updating caches

Out of all the content on most websites images are one of the least likely to
regularly update, they also consume the most cache storage space and are often
less essential for the website to work.

If all the images were added as precache files it could be an unnecessary waste
of limited cache storage space. A better approach is to create a separate dedicated
image cache with sensible limits.

Workbox can automatically swap out items in the cache based on a set of configured
limits. A common approach for images is to set a maximum number of images that can
be in the cache at once as well as a time limit using the `ExpirationPlugin` like
so&hellip;

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { precacheAndRoute } = workbox.precaching;
const { CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

<div class="callout">
  
  **Remember:** The earliest registered route will be used to respond to requests,
  if the precache is above the image cache, the precache takes priority.

</div>

Now that we have a dedicated image cache, the image can be removed from the generated
precache files by removing `jpg` from the `globPatterns` in `workbox-config.js`&hellip;

```javascript
export default {
  "globDirectory": ".",
  "globPatterns": [
    "*.{html,css}"
  ],
  "swSrc": "service-worker-template.js",
  "swDest": "service-worker.js"
};
```

Don't forget to re-run `workbox injectManifest` to update the service worker with
these changes!

Every time an image is viewed the service worker will now:

1. intercept the request
2. use the `CacheFirst` strategy to serve from the cache or fall back to the network
3. remove the oldest cache entry if there are now more than 60 entries
4. remove any entries older than 30 days

Smart! That'll avoid using all our available cache storage on images the user
isn't even looking at.

## Cache invalidation solved

Check out the final [working example](https://glitch.com/edit/#!/workbox-precache)
of the versioned cache.

The cache has been massively improved! We no longer have to worry about cache invalidation
and the cache can be sustainably maintained with little to no effort.

A couple of things are still bugging me, why should we have to remember to run
`workbox injectManifest` every time a file changes? Isn't that Workbox CDN
URL causing extra unnecessary network requests? Seems like we've still got some
*workflow improvements* to tighten up!

**Next up:** <a href="/offline-workflow" class="arrow-link">Offline workflow &xrarr;</a>