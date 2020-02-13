---
layout: default.hbs
---

[&larr; Back to all articles](/)

# A basic cache implementation

*Add can i use stats and links to source code*

Even the most basic cache implementation can simultaneously improve performance
and enable offline use of any website.

If you haven't had the chance to play with the browser cache API this is a good
place to start.

---

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

<div style="margin-top:1em;padding:1em;background:#f3f3f3;">
  <strong>Remember:</strong> Service workers require a
  <a href="https://w3c.github.io/webappsec-secure-contexts/" target="_blank" rel="noopener noreferrer">secure context</a>,
  make sure view the page over HTTPS or localhost.
</div>

## Adding to the cache

![A basic cache example](/assets/a-basic-cache-implementation/basic-cache-example.png)

Now, code can be added to the `service-worker.js` to create the cache!

Service workers have an "install" event which can be used to initiate the cache,
it'll be called once per service worker installation. Here's what the install event
handler looks like...

```javascript
self.addEventListener('install', event => {});
```

This basic cache will contain the HTML, CSS and image used in the example web
page above. Adding these items to the cache can be achieved using `cache.addAll`
like so...

```javascript
self.addEventListener('install', event => {
  const image = 'https://images.unsplash.com/photo-1572627690516-b531677b926f?ixlib=rb-1.2.1&auto=format&fit=crop&w=802&q=80';
  const thingsToCache = ['/', 'index.html', 'styles.css', image];
  const cached = caches.open('cache').then(cache => {
    cache.addAll(thingsToCache);
  });
  event.waitUntil(cached);
});
```

This will `open` a cache called "cache" and `addAll` the paths inside
`thingsToCache` to it. The cache will go off in background to fetch then
store each path.

In this case, `event.waitUntil` will hold our service worker in the "installing"
phase until it has finished caching. If this fails the service worker won't
install and will be discarded instead.

The dependant files and URLs are now in the cache 🎉...But loading this page offline
still uses the network and the assets won't load. An extra step is needed to
tell the browser when it should use the cache.

## Use the cache

This is where the service worker super power of being able to watch "whenever a network
request occurs" comes in handy, this is the key to replacing network requests
with the contents of the cache.

The service workers "fetch" event can be used to hijack any network requests.
In this case, it's used to serve a response from the cache instead of from
the network...

```javascript
self.addEventListener('fetch', event => {
  const response = caches.match(event.request)
    .then(cachedResponse => {
      return cachedResponse ? cachedResponse : fetch(event.request);
    });
  event.respondWith(response);
});
```

`caches.match` will identify if there's any matching items in the cache for the
current request. The promise it returns will either contain the cached item or
`undefined` if there was nothing cached for the current request.

When a match is found, `response` will contain the item directly from the cache
and avoid the network request entirely.

So, a successful install of this web page will mean a connection will no longer
be required. All the dependant items will be served from the cache instead.

## Next steps

As exciting as this is, the cache implementation still needs a lot of work, it's
flaws are revealed as soon as the content updates. It will continue to serve the
cached content instead of the updated content.

Realistically caching one set of content isn't going to cut it, a full caching
strategy taking into account real-world content and frequently evolving nature
of production software will be needed.

This goes beyond a basic cache implementation, the network needs to *enhance*
the stale contents of the cache to build off this implementation.
