---
layout: default.hbs
---

<div class="article-header">

  # Offline workflow

</div>

## Why bother?

- reduce startup cost of the service worker by moving away from the CDN
- automate generating precaches at build time based on files to avoid human error

## Avoid using the Workbox CDN

Currently the Workbox code in the service worker uses a CDN script, the script is
smart because it only includes what it needs, but it still adds overhead.

You might have already noticed this if you looked at the browsers network tab 😬

![Workbox modules](/assets/versioning-offline-content/workbox-modules.png)

Fortunately, Workbox makes its modules available via NPM. Using NPM will bring the
added benefit of better versioning and security vulnerability detection on top of
the performance benefits!

Currently the list of included modules looks like this&hellip;

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');
const { registerRoute } = workbox.routing;
const { precacheAndRoute } = workbox.precaching;
const { CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
```

Workbox modules on NPM follow the same naming format, just swapping the dots for
hyphens. Let's download all the ones being used&hellip;

```bash
npm i -D workbox-routing workbox-precaching workbox-strategies workbox-expiration
```

The modules can then be swapped out with import statements. We don't need the `importScripts`
line anymore either, that was only used to pull in the modules that the service worker
was using&hellip;

```javascript
import { registerRoute } from 'workbox-routing';
import { precacheAndRoute } from 'workbox-precaching';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
```

If `workbox injectManifest` is re-run now, the output `service-worker.js` file will
include these import statements.

Unfortunately, most browsers can't read import statements, we wouldn't want to include
`node_modules` directly in the website anyway. Instead, the modules should be *bundled*
into the service worker using a *build* step.

For this example we'll use [Rollup](https://rollupjs.org/guide/en/) to bundle the
code. That means more NPM installs to get Rollup and all the plugins we're going
to need&hellip;

```bash
npm i -D rollup @rollup/plugin-node-resolve @rollup/plugin-replace rollup-plugin-copy rollup-plugin-terser rollup-plugin-workbox
```

During the build step, Rollup is going to take the `service-worker.js` file and change
all the imports to directly include the code they're referencing.

A good build step clearly separates config files in the root directory, from website
source files in the src directory and the built distributed files in the dist directory.
Let's start by updating the `workbox-config.js` to match that structure&hellip;

```javascript
export default {
  "globDirectory": "src",
  "globPatterns": ["*.{html,css}"],
  "swSrc": "src/service-worker.js",
  "swDest": "dist/service-worker.js"
};
```

Creating a `rollup.config.js` file in the project root directory we can tell Rollup
what to do&hellip;

```javascript
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import { injectManifest } from 'rollup-plugin-workbox';
import workboxConfig from './workbox-config.js';

export default [
  // Generate the service worker
  {
    input: 'src/service-worker.js',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [injectManifest(workboxConfig)]
  },
  // bundle imports, minify and copy the rest of the files into the dist dir
  {
    input: 'dist/service-worker.js',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [
      resolve(),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      terser(),
      copy({ targets: [{ src: 'src/*', dest: 'dist/' }] })
    ]
  }
];
```

Rollup will take the input service worker files and run them through the list of
plugins&hellip;

- `injectManifest(workboxConfig)` performs exactly the same action as the
`workbox injectManifest` command was previously, but this time it'll output `service-worker.js`
in the dist folder.
- `resolve()` bundles the imports
- `replace({ 'process.env.NODE_ENV': JSON.stringify('production') })` uses Workbox
production mode
- `terser()` minifies the code that workbox outputs, a good idea seeing as we're
doing this for performance
- `copy({ targets: [{ src: 'src/*', dest: 'dist/' }] })` will move all the files
within the /src directory to the /dist directory

<div class="callout">
  
  **Remember:** Every browser that supports service workers also supports most
  ES2015 features, it's not necessary to include Babel to this stack.

</div>

This config uses the `output` property to tell Workbox to put the final service
worker file in the `dist` folder which will overwrite the one that workbox generates.

As a final step we should separate the website files from config files by creating
the `src` folder. Move the `index.html`, `image.jpeg` and `styles.css` to it then
update the `globDirectory` set in `workbox-config.js`.

Phew! Now if we run `rollup -c` the complete `service-worker.js` file will get output
in the `dist` directory safe to use in the browser.

## Conclusion

With the caching and service worker powers acquired so far we're ready to start
implementing features to attain the *ultimate offline experience*.

**Next up:** <a href="/offline-fallback-page.html" class="arrow-link">Offline fallback page &xrarr;</a>