---
layout: default.hbs
---

[&larr; Back to all articles](/)

# A basic cache implementation

Even the most basic cache implementation can simultaneously improve performance
and enable offline use of any website.

Let's start experimenting with caching by seeing how all the content on the
webpage shown below can be viewed without any network connection.

![A basic cache example](/assets/a-basic-cache-implementation/basic-cache-example.png)

<a href="https://a-basic-cache.glitch.me">
  view app
</a>
&nbsp; | &nbsp;
<a href="https://glitch.com/edit/#!/a-basic-cache">
  view code
</a>
&nbsp; | &nbsp;
<a href="https://caniuse.com/#search=caches">
  all major browsers except ios safari and ie
</a>

## Creating a service worker

The cache API that comes with browsers was built as a companion to service
workers, they're practically inseparable!

Service workers allow us to hook into life cycle events, such as when the
website is viewed for the first time or whenever a network request occurs.
We'll see why this is key for the cache implementation in a minute.

For now, creating a service worker is as simple as adding a new Javascript file
to your project. We'll call it `service-worker.js` but it can be called anything.

To register the `service-worker.js` file a bit of extra JS is needed, most
commonly this code is set up to be called whenever the page loads...

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
```

After adding this code, if you were to reload the page, open developer tools and
navigate to the application tab, it would show that the service worker gets registered.

![Service worker registered](/assets/a-basic-cache-implementation/service-worker-registered.png)

<div class="callout">

  **Remember:** Service workers require a
  <a href="https://w3c.github.io/webappsec-secure-contexts/" target="_blank" rel="noopener noreferrer">secure context</a>,
  make sure view the page over HTTPS or localhost.

</div>

## Adding to the cache

Now, code can be added to the `service-worker.js` to create the cache!

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

## Using the cache

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

A successful install of this web page now means a connection is no longer required.
Viewing the network requests in dev tools will show the dependant items served
from the service worker instead.

![Serving from the cache](/assets/a-basic-cache-implementation/service-worker-fetch.png)

## Next steps

As exciting as this is, the cache implementation still needs a lot of work, it's
flaws are revealed as soon as the content updates. It will continue to serve the
cached content instead of the updated content.

Realistically caching one set of content isn't going to cut it, a full caching
strategy taking into account real-world content and frequently evolving nature
of production software will be needed.

This goes beyond a basic cache implementation, the network needs to *enhance*
the stale contents of the cache to build off this implementation.
