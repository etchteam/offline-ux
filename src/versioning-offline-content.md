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
[my first offline website](/my-first-offline-website.html) article, it would be tough to manually
maintain the cache and avoid it going stale in any but the simplest of websites.

Luckily there are tools available that make reliably maintaining even the largest
frequently updating caches manageable.

## The same cache, but better

To start with, lets take the cache we already have and re-implement it. This time
the cache is going to be built with [Workbox](https://developers.google.com/web/tools/workbox),
an open source library from Google.

Here's the service worker code from [my first offline website](/my-first-offline-website.html)...

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

You can view the working [source code and demo](https://glitch.com/edit/#!/workbox-cache)
for this cache or learn more about other caching strategies on the [Workbox website](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)

So far, this cache only replicates the functionality of the last one with less
lines of code. This still leaves the same two big problems:

- The cache will not automatically update on content changes. People who have
already viewed the site will all see out of date content.
- If we update the cache by changing the caches name the entire cache will need
to be re-downloaded, instead of just the content that updated.

## A better way to version caches

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

The `precacheAndRoute` function is really smart.

With this set up, changing the `revision` property on any of the files will cause
the cache to update **only where the revision has changed**. This avoids having to
update the entire cache when only part of it changes.

The `precacheAndRoute` function will handle storing all the URLs in the cache and
setting up individual routes for them using the `CacheFirst` strategy.

Another really handy feature is that it will account for common URL practices, we
no longer need an extra route for `/` because `precacheAndRoute` will automatically
to match it to `index.html`.

Great! Now we just need a way to automatically update the revision number when
files change.

## Update caches on detected file changes

The implementation needs to move away from manually defining a list of files and
revision information. It's error prone and will take too much work to maintain in
a large codebase. The list of files and versions needs to be generated instead.

Workbox offers a few ways to generate the list of files at build time, the simplest
option is [Workbox CLI](https://developers.google.com/web/tools/workbox/modules/workbox-cli)
which we'll be using here.

To get started, install the CLI `npm i -g workbox-cli` and run the wizard
`workbox wizard`...

```bash
> workbox wizard

? Please enter the path to the root of your web app: .
? Which file types would you like to precache? jpeg, html, css
? Where would you like your service worker file to be saved? service-worker.js
? Where would you like to save these configuration options? workbox-config.js
```

The wizard creates a config file that it will chuck in the
projects root directory called `workbox-config.js`...

```javascript
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "*.{jpeg,html,css}"
  ],
  "swDest": "service-worker.js"
};
```

This config would work with the `workbox generateSW` command which generates the
whole service worker for us. In this implementation we only want workbox to generate
the list of precache files though, not the whole service worker.

`workbox-config.js` accepts an `swSrc` property which tells workbox to use a template
service worker file instead of creating it's own one, let's define that as `service-worker-template.js`...

```javascript
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "*.{jpeg,html,css}"
  ],
  "swSrc": "service-worker-template.js",
  "swDest": "service-worker.js"
};
```

Workbox calls the list of files with revision information that go inside `precacheAndRoute`
a "manifest". Given a template file Workbox will look for `self.__WB_MANIFEST` and
"inject" the manifest it generates.

To create the `service-worker-template.js` file, we can rename the current service
worker file and update it to replace the list of files with `self.__WB_MANIFEST`...

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute(
  self.__WB_MANIFEST
);

self.addEventListener('install', () => {
  self.skipWaiting();
});
```

Now that Workbox has a template file to work with it can be told to generate
the destination file by using `workbox injectManifest`. The output `service-worker.js`
file will look something like this...

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

Workbox has generated the list of precached files and revision information for
us 💪. Try updating one of the files and running `workbox injectManifest` again,
the revision number should automatically change for the file that was updated!

Check out the full [working example](https://glitch.com/edit/#!/workbox-precache) of
this code.

## Self updating caches

Out of all the content on most websites images are one of the least likely to
regularly update, they also consume the most cache storage space and are often
less essential for the website to work.

If all the images where added as precache files it could be an unnecessary waste
of limited cache storage space. A better approach is to create a separate dedicated
image cache with sensible limits.

Workbox can automatically swap out items in the cache based on a set of configured
limits. A common approach for images is to set a maximum number of images that can
be in the cache at once as well as an expiration time limit...

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

Now the image can be removed from the generated precached files by removing `jpg`
from the `globPatterns` in `workbox-config.js`...

```javascript
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "*.{html,css}"
  ],
  "swSrc": "service-worker-template.js",
  "swDest": "service-worker.js"
};
```

## Cache versioning through file names

## Avoid using the CDN

Currently the Workbox code in the service worker uses a CDN script, the script is
smart but still adds overhead pulling in the modules it needs.

![Workbox modules](/assets/versioning-offline-content/workbox-modules.png)

A better approach would be to only import the specific modules that are being used,
this will reduce the overall service worker size and improve how we managing including
and versioning the modules.
