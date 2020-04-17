---
layout: default.hbs
---

<div class="article-header">

  # My first offline website

</div>

<p class="subtitle">
  Even the most basic cache implementation can simultaneously improve performance
  and enable offline use of any website.
</p>

Let's start experimenting with offline capabilities by seeing how all the content
on the webpage shown below can be viewed without any network connection.

![A basic cache example](/assets/my-first-cache/basic-cache-example.png)

[view demo](https://my-first-offline-website.glitch.me/)
&nbsp; | &nbsp;
[view code](https://glitch.com/edit/#!/my-first-offline-website)
&nbsp; | &nbsp;
[all major browsers except IE](https://caniuse.com/#search=caches)

## Service worker + cache = offline possibilities

Service workers allow us to hook into life cycle events, such as when the
website is viewed for the first time or whenever a network request occurs.
We'll see why this is key for the implementation in a minute.

The cache API that comes with browsers was built as a companion to service
workers, they're practically inseparable!

For now, creating a service worker is as simple as adding a new Javascript file
to your project. We'll call it `service-worker.js` but it can be called anything.

To make the browser aware of the `service-worker.js` file it needs to be registered,
most of the time this code is set up to be called whenever a page loads...

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js');
    });
  }
</script>
```

After adding this code, if you were to reload the page, open developer tools and
navigate to the application tab, it would show that the service worker gets registered.

![Service worker registered](/assets/my-first-cache/service-worker-registered.png)

<div class="callout">

  **Remember:** Service workers require a
  [secure context](https://w3c.github.io/webappsec-secure-contexts/),
  make sure view the page over HTTPS or localhost.

</div>

## Add content to the cache

Now, code can be added to the `service-worker.js` to create our very own cache!
To start with the cache API will need to be given...

- Name: what we're going to call this cache
- Location: where are the files that we want to cache

This basic cache will be called "offline", it will contain the HTML, CSS and image
used in the example web page above. For now these can be added as variables at
the top of the file...

```javascript
const cacheName = 'offline';
const image = new Request('/image.jpeg', { cache: 'reload' });
const thingsToCache = ['/', 'index.html', 'styles.css', image];
```

Adding `{cache: 'reload'}` for `image` makes sure that the default browser HTTP
cache isn't used when the browser requests this asset.

Service workers have an "install" event which can be used to initiate the cache,
it'll be called once per service worker installation, the perfect time to start
adding to the cache...

```javascript
const cacheResources = async () => {
  const cache = await caches.open(cacheName);
  return cache.addAll(thingsToCache);
};

self.addEventListener('install', event => {
  event.waitUntil(cacheResources());
});
```

This will `open` the cache and `addAll` the paths inside `thingsToCache` to it.
The cache will go off in the background to retrieve then store each path.

In this case, `event.waitUntil` will hold our service worker in the "installing"
phase until it has finished caching. If this fails the service worker won't
install and will be discarded instead.

<div class="callout">
  
  **Remember:** Service worker `event` methods like `event.waitUntil`
  must be called synchronously as part of the event handler. Placing them inside
  a promise or after an `await` will break things.

</div>

The dependant files and URLs are now in the cache 🎉...But loading this page offline
still uses the network and the assets won't load. An extra step is needed to
tell the browser when it should use the cache.

## Use the cache, not the network

This is where the service worker super power of being able to watch whenever a network
request occurs comes in handy, this is the key to serving the contents from the cache
instead of using network requests.

The service workers "fetch" event can be used to hijack any network requests...

```javascript
const getResponse = async request => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  return cachedResponse || fetch(request);
};

self.addEventListener('fetch', event => {
  event.respondWith(getResponse(event.request));
});
```

This starts by matching items in the cache against what's being fetched using
a call to `cache.match` for every request. The promise it returns will either
contain the cached item or `undefined` if there was nothing cached for the
current request.

When a match is found, `cachedResponse` will contain the item directly from the cache
and avoid the network request entirely.

A successful install of this web page now means **a connection is no longer required!**
Viewing the network requests in dev tools will show the dependant items served
from the service worker instead.

![Serving from the cache](/assets/my-first-cache/service-worker-fetch.png)

## Avoid stale cache content

Currently, if a change is made to any of the cached files nothing will change on
the webpage. Ut oh! We have stale cache contents. The service worker will still
serve the out of date content, it has no way of telling that there is newer versions
of the cached files available.

The `cacheName` variable is used when initially adding to the cache as well as
serving contents of the cache with `caches.open(cacheName)`. So, updating the `cacheName`
to something like "offline-v1" should cause a new cache to be set up with the up
to date versions of the files.

But updating `cacheName` still doesn't cause the content to change, frustrating!

![Waiting to activate](/assets/my-first-cache/waiting-to-activate.png)

Upon further investigation, the application tab in dev tools is saying that a version
of the service worker is "waiting to activate". This means the new service worker
is installed and ready to go, but it won't activate until the previous service worker
has become inactive. Only a hard refresh or closing the tab will make our new service
worker become the active one.

This is the default behaviour of service workers, in many cases immediately
activating a new version of a service worker whilst a user is browsing could cause
things to break. In this case though the new content should appear straight away,
the waiting phase can be skipped by adding an extra line to the "install" event handler...

```javascript
self.addEventListener('install', event => {
  event.waitUntil(cacheResources());
  self.skipWaiting();
});
```

The new content is now appearing from a new cache when `cacheName` is changed. But
what happened to the old cache? It's dead but still lingering like a ghost that
gobbles up data storage limits.

We should cleanup after ourselves and not leave stale caches lying around...

```javascript
const cleanup = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => (
    name !== cacheName && caches.delete(name)
  )));
};

self.addEventListener('activate', event => {
  event.waitUntil(cleanup());
});
```

This will delete all caches that have been created by this website which don't have
the same name as the current `cacheName`.

The "activate" event is a good place to put this, it'll be called once the service
worker is installed and ready to go. The cleanup will happen in the background
not interrupting anything else that's going on.

## No connection required

We've got a working offline website working through use of our own cache and service
worker!

This is exciting but the cache implementation still needs work, its flaws are
revealed as soon as the content updates. It will continue to serve the cached
content instead of the updated content until someone manually updates the `cacheName`.
Even then, it would go off and create an entirely new cache for something as simple
as a text change in one file.

Realistically caching one set of content isn't going to cut it, a full caching
strategy taking into account real-world content and frequently evolving nature
of production software will be needed.

This goes beyond a basic cache implementation, the network needs to *enhance*
the stale contents of the cache to build off this implementation.

<div class="callout">
  
  **Next up:** <a href="/versioning-offline-content.html">Versioning offline content &rarr;</a>

</div>
