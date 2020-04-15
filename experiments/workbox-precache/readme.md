# Workbox precache

A Workbox implementation of [my first offline-website](https://glitch.com/edit/#!/my-first-offline-website)
with precaching via the Workbox CLI...

---

This experiment is part of the [offline UX project](https://offline.etch.now.sh/).

An NPM scripts is available in the `package.json` called `precache` which will use
the `service-worker-base.js` and `workbox-config.js` files to inject a list of versioned
files to cache.

The `service-worker.js` file it generates will store the webpages content on initial
page load.

Future requests for the same content are served from the cache which makes the
page work without the need for any network connection.

## Try it out

- **View App** then click **Fullscreen**
- Go **offline** and reload the page to see the image loaded from the cache. No
connection required 💪

---

*Imported from Github etchteam/offline:/experiments/workbox-precache/*