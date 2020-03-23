# My first Workbox cache

A Workbox implementation of [my first cache](https://glitch.com/edit/#!/my-first-cache)...

---

This experiment is part of the [offline UX project](https://offline.etch.now.sh/).

A basic cache is implemented using `service-worker.js` which stores the webpages
content on initial page load.

Future requests for the same content are served from the cache which makes the
page work without the need for any network connection.

## Try it out

- **View App** then click **Fullscreen**
- Go **offline** and reload the page to see the image loaded from the cache. No
connection required 💪

---

*Imported from Github etchteam/offline:/experiments/my-first-workbox-cache/*