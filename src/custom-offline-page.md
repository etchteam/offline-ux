---
layout: default.hbs
---

[&larr; Back to all articles](/)

# Show a custom offline page

Display a more engaging custom branded offline webpage when users move offline
instead of the generic default web browser one.

A custom offline page is a good fallback option on any project even if the full
offline experience is going to be out of budget.

![Custom offline page](/assets/custom-offline-page/offline-page.jpg)

<a href="https://custom-offline-page.glitch.me/">
  view demo
</a>
&nbsp; | &nbsp;
<a href="https://glitch.com/edit/#!/custom-offline-page">
  view code
</a>
&nbsp; | &nbsp;
<a href="https://caniuse.com/#search=caches">
  all major browsers except ios safari and ie
</a>

## Serving a basic offline page

<div class="callout">
  
  **Notice:** This assumes some knowledge of service workers and the cache API provided
  in the [basic cache implementation article](/a-basic-cache-implementation.html).

</div>

The custom offline page will need to display whenever a network issue is encountered
whilst fetching another webpage. This involves three steps:

1. Caching the offline page
2. Trying a fetch request
3. If the fetch fails, serve the cached offline page

The service worker "install" event can be used to set up the cache, on install the
`offline.html` file containing the custom offline page can be cached...

```javascript
const cacheName = 'offlinePage';
const offlineUrl = new Request('offline.html', { cache: 'reload' });

const cacheOfflinePage = async () => {
  const cache = await caches.open(cacheName);
  return cache.add(offlineUrl);
};

self.addEventListener('install', event => {
  event.waitUntil(cacheOfflinePage());
});
```

This will make sure our offline page is safely stored in a cache called "offlinePage"
when the website first loads. It's now ready to be used without requiring a network
connection.

The next step is "trying a fetch request"...

```javascript
const getPage = event => {
  return fetch(event.request);
};

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(getPage(event));
});
```

Every time any network request occurs the browser sends off a `fetch` request,
including for any images or scripts. It's important that the implementation only
serves the offline page when other pages are requested.

This is accomplished here by checking `event.request.mode` which will be equal to
`navigate` only when the request is for a HTML webpage.

If `event.respondWith` is never called within the service workers fetch event handler
the browser will carry out the request as normal. So if the `navigate` check fails
it's safe to simply `return` and exit the function execution.

Finally, a `catch` can be added on the request to react to any network failures by
serving the custom offline page instead...

```javascript
const getPage = event => {
  return fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(offlineUrl);
    return cachedResponse;
  });
};
```

## UX Suggestions

- Easy mode: Branded offline page
  - display part of the app shell so it looks like the user is still in the app
  - wasted touchpoint?
- Give them something to do
  - self indulgent and unrealistic when building something for a client?
- keep it current
  - display any blog entries you’ve added to the cache
  - What if we made our offline page so useful that users wanted to navigate to it?

## Examples

![Google search offline](/assets/custom-offline-page/google.jpg)
