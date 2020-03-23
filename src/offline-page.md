---
layout: default.hbs
---

<div class="article-header">

  # Offline page

</div>

<p class="subtitle">
  Implementing an offline page should be just as essential as including
  a 404 page on your website.
</p>

Nearly all websites can benefit from displaying an offline page, instead of the generic
one included with browsers.

It's simple enough to implement as a good fallback option on any project, even
if a more comprehensive offline experience is going to be out of budget.

![Custom offline page](/assets/offline-page/offline-page.jpg)

<a href="https://offline-page.glitch.me/" target="_blank" rel="noopener noreferrer">
  view demo
</a>
&nbsp; | &nbsp;
<a href="https://glitch.com/edit/#!/offline-page" target="_blank" rel="noopener noreferrer">
  view code
</a>
&nbsp; | &nbsp;
<a href="https://caniuse.com/#search=caches" target="_blank" rel="noopener noreferrer">
  all major browsers except IE
</a>

## Implementing an offline page

<div class="callout">
  
  **Notice:** This assumes knowledge of service workers and the cache API provided
  in the [my first cache article](/my-first-cache.html).

</div>

Serving a specific page to users that are offline involves three steps:

1. Cache the page
2. Try a fetch request
3. If the fetch fails, serve the cached page

### Cache the page

As always, the service worker "install" event is the best place to set up the
cache. On install an offline page (`offline.html`) can be cached...

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

The offline page is safely stored in the cache called "offlinePage", it's now
ready to be used without requiring a network connection.

### Try a fetch request

Every time any network request occurs the browser sends off a `fetch` request,
including for any images or scripts. For this implementation, it's important the
offline page is only served when other **pages** are requested...

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

`event.request.mode` makes it possible to tell what the request is for, it will
only be equal to `navigate` when the request is for a HTML webpage.

If `event.respondWith` is never called then the browser will carry out the
request as normal. So if the `navigate` check fails it's safe to simply `return`
and exit the function execution.

### If the fetch fails, serve the cached page

The `fetch` request will `throw` if it fails, so a `catch` can be added to
respond with the cached offline page in place of the missing network response...

```javascript
const getPage = event => {
  return fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(offlineUrl);
    return cachedResponse;
  });
};
```

An important distinction to notice here is that we only need to react when a
**network request fails**, this is different to the
[my first cache implementation](/my-first-cache.html) where the contents
of the cache is read before the network request occurs. So the two solutions
could be implemented at the same time...

```javascript
const getPage = event => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  return fetch(event.request).catch(async () => {
    return await cache.match(offlineUrl);
  });
};
```

The website will now serve the custom offline page based on if the user has a
network connection. Take a look at <a href="https://glitch.com/edit/#!/custom-offline-page" target="_blank" rel="noopener noreferrer">the working version of this code</a>
or the <a href="https://custom-offline-page.glitch.me/" target="_blank" rel="noopener noreferrer">demo</a>
to see the offline page in action.

## Adding content

So far we've got a working, but relatively empty, offline page. Compared to relying
on the default browser offline page It's already an improvement, adding a general
"you are offline" message and leaving it there may be tempting. But this
could be a wasted touch-point.

Offline pages are different to other error pages because people will be stuck
on the page until they give up waiting or their network connection is restored.
So, it's worth considering how to make the page a bit more friendly and maybe even
useful.

### Maintain website context

<div class="callout">
  
  ✅ **Do:** Cache and display the websites "shell"

</div>

![Offline page with shell](/assets/offline-page/offline-with-shell.png)

A go-to approach for optimising any app and providing better support for unreliable
network connections in general is to keep a copy of the websites "shell" in the cache.

Nearly all websites have a few consistent layout elements across all pages like a
header, footer, maybe a page container or sidebar. If the styles and assets used
in these elements are added to the cache they can be used to display the page
layout instantly on repeat visits.

Including these elements on the custom offline page handles the situation
gracefully by maintaining website context. The experience will be less
disorientating for users and avoid it feeling like they've been booted out of
the website.

Presenting the shell offline is a great first step towards improving the offline
page.

### Give them something to do

<div class="callout">
  
  ✅ **Do:** Display the primary website content</br>

</div>

![Articles available to view offline](/assets/offline-page/offline-posts.jpg)

Popularised by the Chrome dinosaur game, A growing number of websites have taken
this literally by presenting some type of game to interact with whilst on the page
completely separate to the rest of the websites content.

While this is fun, in many cases it's unrealistic to expect that it would be part
of a production projects budget. It's also more than likely not the most valuable
content that could be presented.

For users to get the most value out of the content displayed within the page, try
to focus on displaying the primary content already on the website.

For example, websites with a blog as primary content could dig into the cache to
pull up and display the articles that readers had previously viewed or marked for
later reading.

### Handle page actions

<div class="callout">
  
  ✅ **Do:** Add offline functionality to handle user interactions</br>
  ✅ **Do:** Visually disable interactions that won't work offline</br>
  ❌ **Don't:** Leave in offline incompatible interactions

</div>

![Offline actions](/assets/offline-page/offline-actions.jpg)

If the page contains interactive elements the user would expect these to work
normally, unless they're given visual indication otherwise.

Popular web apps like <a href="https://trello.com/" target="_blank" rel="noopener noreferrer">Trello</a>
can sync a users actions once they're back online. This is made possible through <a href="https://developers.google.com/web/updates/2015/12/background-sync" target="_blank" rel="noopener noreferrer">background sync</a>
or offline compatible databases like <a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Concepts_Behind_IndexedDB" target="_blank" rel="noopener noreferrer">IndexedDB</a>.

If implementing this type of sync is out of scope then interactive elements of
the page that require a network connection will need to be disabled. It should
be made obvious that users can't interact with them without a network connection.

### Notify on connection recovery

<div class="callout">
  
  ✅ **Do:** Offer to send notifications upon network recovery

</div>

![Connection recovered notification](/assets/offline-page/notify-offline.jpg)

Even with something to do, many won't wait for the network connection to return.
Rather than ignoring this fact, the offline page could be taken to the next level
by embracing this and offering to notify users with the content they're looking
for once their connection is restored.

A good example of this is how Google handles dropped connections during a
search. Google will remember the search and send a <a href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API" target="_blank" rel="noopener noreferrer">push notification</a>
when the search results are ready to view.

This let's the user get on with whatever else they want to do and provides an
easy way to pick up where they left off once the connection has been recovered.

## Conclusion

The offline page works well as a fallback when a page can't be served due to
connectivity issues. It provides a nice safety net where we can control what
the user sees when they're offline and a simple version can be implemented quickly
enough that it could be added to any project.

Looking beyond the offline page, ideally we shouldn't need to fall back to it at
all. The ultimate offline experience would be if the whole website worked without
a connection, then we wouldn't need to fall back to an offline page and users
could carry on relatively uninterrupted!
