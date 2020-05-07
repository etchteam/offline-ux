---
layout: default.hbs
---

<div class="article-header">

  # Offline fallback pages

</div>

<p class="subtitle">
  Implementing an offline fallback page should be just as essential as including
  a 404 page on your website.
</p>

Nearly all websites can benefit from displaying an offline page, instead of the generic
one included with browsers.

It's simple enough to implement as a good fallback option on any project, even
if a more comprehensive offline experience is going to be out of budget.

![Custom offline page](/assets/offline-page/offline-page.jpg)

[view demo](https://offline-fallback-page.glitch.me/)
&nbsp; | &nbsp;
[view code](https://glitch.com/edit/#!/offline-fallback-page)
&nbsp; | &nbsp;
[all major browsers except IE](https://caniuse.com/#search=caches)

## Implementing an offline page

Serving a specific page to users that are offline involves three steps:

1. Cache the page
2. Try a fetch request
3. If the fetch fails, serve the cached page

### Cache the page

A HTML file needs to be created to act as the offline page, we'll call ours `offline.html`
and fill it with some basic content.

```html
<!doctype html>
<html lang="en" dir="ltr">
  <head><!-- ... --></head>
  <body>
    <h1>Offline mode engaged!</h1>
    <p>You are viewing the offline version of this website.</p>
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
      }
    </script>
  </body>
</html>
```

For the page to be always available offline, it needs to be cached on *install* with
a "cache first" strategy. We learnt in the [versioning offline content](/versioning-offline-content.html)
article, the best way to do this kind of caching is the workbox precache.

Workbox CLI uses the `workbox-config.js` to decide which files it's going to precache,
for this example the `offline.html` page will be the only precached file...

```javascript
module.exports = {
  "globDirectory": "src",
  "globPatterns": ["offline.html"],
  "swSrc": "service-worker-template.js",
  "swSrc": "service-worker.js",
};
```

For now, `service-worker-template.js` can be set up just so Workbox has somewhere
to output the precache when `workbox injectManifest` is used.

```javascript
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
```

The `offline.html` will be safely stored in the cache now. Next we need a way to
send users to the page if they are offline.

### Try a fetch request

Getting the timing of serving the offline page right is important, interrupting
users if the network drops whilst they're looking at a page would be annoying!

It's best to delay serving the offline page as long as possible, during the *navigation*
from one page to another is where a drop in network connection will be most noticeable.
We should aim to *catch* the user at that point and serve our custom offline page
instead of the browsers default one.

Every time any network request occurs the browser sends off a `fetch` request,
including when a new HTML page is requested. Remember how service workers can hijack
the fetch event to tell it to respond differently? We'll be able to use this to our
advantage here...

```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

const getPage = event => fetch(event.request);

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(getPage));
```

If the request is for a HTML page the requests "mode" will be equal to "navigate".
Under the hood the Workbox `NavigationRoute` helper performs a simple check for us,
if the requests mode is equal to navigate then `getPage` will be called, all other
requests will be ignored by the service worker.

Adding these lines to `service-worker-template.js` won't actually change anything
for now, but it does separate fetch requests for HTML pages providing somewhere to
send a different HTML page if the request fails.

### If the fetch fails, serve the cached page

The `fetch` request inside the `getPage` function will throw an error if it fails
due to a lack of network connection. A `catch` can be added to respond with the cached
offline page in place of the missing network response...

```javascript
import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

const getPage = event => fetch(event.request)
  .catch(() => matchPrecache('/offline.html'));

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(getPage));
```

`matchPrecache` is another Workbox helper which will return the cached version of
the `offline.html` page.

Notice that currently the `NavigationRoute` we've registered is network only,
if we wanted to serve some HTML pages from the cache instead we would need to either
add them to the precache or register separate routes for them above where the `NavigationRoute`
is registered.

The website will now serve the custom offline page based on if the user has a
network connection. Take a look at [the working version of this code](https://glitch.com/edit/#!/offline-fallback-page)
or the [demo](https://offline-fallback-page.glitch.me/) to see the offline page in
action.

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

Popular web apps like [Trello](https://trello.com/) can sync a users actions once
they're back online. This is made possible through [background sync](https://developers.google.com/web/updates/2015/12/background-sync)
or offline compatible databases like [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Concepts_Behind_IndexedDB).

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
search. Google will remember the search and send a [push notification](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
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
