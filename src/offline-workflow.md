---
layout: default.hbs
---

<div class="article-header">

  # Offline workflow

</div>

<p class="subtitle">
  The ultimate offline user experience wouldn't be complete without accounting
  for the experience of the developer.
</p>

Maintaining offline content and service worker code shouldn't take manual effort
or become a messy process for developers. If it does we'd be risking future errors
creeping in, or the offline experience becoming too costly to keep in place.

By adding an automated build step into the workflow, we can **reduce service worker
startup times** and automate generating caches at build time to **avoid manual effort
and human error**.

## The current workflow

Using the [implementation so far](/versioning-offline-content) we have two problems.

Firstly, developers have to remember to call `workbox injectManifest` to update
the precache, every single time. This might not seem like much, but it'd be easy
to forget and the consequence for forgetting would lead to out of date content
being served.

The second problem is less obvious, but you might have already noticed it if you
looked at the browsers network tab 😬

![Workbox modules](/assets/offline-workflow/workbox-modules.png)

Currently, the Workbox code in the service worker uses a CDN script, the script is
smart because it only includes what it needs, but it still adds overhead. Pulling
the scripts down from the network increase the service workers startup time and
reliance on the network.

We could just inline all the library code into the service worker file ourself,
doing so would not only cause a huge unmaintainable mess in the service
worker file but also make handling versions of the library code very difficult.

Fortunately, Workbox makes its modules available via NPM. Using NPM will bring the
added benefit of better versioning and security vulnerability detection on top of
the performance benefits!

Let's look at how through using a build step we can automate calling `workbox injectManifest`
at the same time as enabling use of Workbox modules from NPM.

## The build step

It's important to plan out a build step before diving in, it can get complicated
so nailing down specific outcomes will help keep our efforts focussed.

To maintain an organised folder structure the config files will be in the root,
source files in the `src` directory and built distributed files in the `dist` directory.
We can start representing this structure by moving the source files including the
service worker template file into a `src` directory and leaving `workbox-config.js`
in the root&hellip;

```bash
|- src/
|  |- service-worker.js
|  |- styles.css
|  |- index.html
|  |- image.jpeg
|- workbox-config.js
```

Our `workbox-config.js` file will need to be updated to match this new folder structure&hellip;

```javascript
export default {
  "globDirectory": "src",
  "globPatterns": ["*.{html,css}"],
  "swSrc": "src/service-worker.js",
  "swDest": "dist/service-worker.js"
};
```

We still need a build tool to do the heavy lifting for us, the basic requirements
for whatever tools is chosen is that it can&hellip;

1. Automate generating caches with Workbox
2. Bundle in the Workbox NPM modules
3. Move any other source files into the dist directory

Workbox has an integration for most popular build tools and frameworks, this example
is going to use [Rollup](https://rollupjs.org/guide/en/). The Workbox plugin
for Rollup uses the same configuration options as Workbox, this is good because
it'll allow us to keep the existing Workbox config setup.

## Automate generating caches at build time

The first job of the build step is to call `workbox injectManifest` automatically
when a file changes, it shouldn't be something we need to consciously remember to
call.

To start off, we'll need to pull down Rollup and the Rollup Workbox plugin from NPM&hellip;

```bash
npm init -y && npm i -D rollup rollup-plugin-workbox
```

Creating a `rollup.config.js` file in the project root directory we can tell Rollup
what to do&hellip;

```javascript
import { injectManifest } from 'rollup-plugin-workbox';
import workboxConfig from './workbox-config.js';

export default [
  // Generate the service worker
  {
    input: 'src/service-worker.js',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [injectManifest(workboxConfig)]
  }
];
```

Here we're taking the `input` file which is the service worker template in the
`src` directory and telling rollup to send any output files to a `dist` directory.

When Rollup is run, the `injectManifest` plugin will perform exactly
the same action as `workbox injectManifest` did previously. The Workbox
config which is passed in gets imported directly from the `workbox-config.js` file.

To tell Rollup to do its thing, a "build" NPM script can be set up in `package.json`&hellip;

```json
"scripts": {
  "build": "rollup --config",
}
```

<div class="callout">

  **Note:** Using the `--config` flag here will make Rollup use our `rollup.config.js`
  file.

</div>

Putting `npm run build` in the terminal will&hellip;

1. Create the `dist` directory
2. Populate the precache with the *injected* manifest
3. Output the final service worker file in the `dist` directory

Now to tackle those Workbox module imports!

## Bundle in the Workbox NPM modules

Currently the list of included modules inside `src/service-worker.js` looks like
this&hellip;

```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');
const { registerRoute } = workbox.routing;
const { precacheAndRoute } = workbox.precaching;
const { CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
```

Workbox modules on NPM follow the same naming format, just swapping the dots for
hyphens. Let's pull in all the modules being used&hellip;

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

If `npm run build` is re-run now, the output `service-worker.js` file will
include these import statements.

Unfortunately, most browsers can't read import statements, we wouldn't want to include
`node_modules` directly in the website anyway. Instead, the modules should be *bundled*
into the service worker.

That means more NPM installs for the Rollup plugins we're going to need&hellip;

```bash
npm i -D @rollup/plugin-node-resolve @rollup/plugin-replace
```

During the build step, Rollup is going to need to take the `service-worker.js` file
and change all the imports to directly include the code they're referencing&hellip;

```javascript
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { injectManifest } from 'rollup-plugin-workbox';
import workboxConfig from './workbox-config.js';

export default [
  // Generate the service worker
  {
    input: 'src/service-worker.js',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [injectManifest(workboxConfig)]
  },
  // bundle imports
  {
    input: 'dist/service-worker.js',
    output: { dir: 'dist', format: 'cjs' },
    plugins: [
      resolve(),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    ]
  }
];
```

The build step now has two stages, generating the service worker file and then
bundling the imports in the output service worker file.

In the second step, Rollup will take the input service worker files and run them
through the list of plugins.

`resolve` bundles the imports, inlining the code within them.

`replace`, with the options it's been provided, will run through all the code in
the service worker file and replace any occurrences of `process.env.NODE_ENV` with
`production` making Workbox use production mode.

<div class="callout">
  
  **Remember:** Every browser that supports service workers also supports most
  ES2015 features, it's not necessary to include Babel to this stack.

</div>

Phew! now if we run `npm run build` the complete `service-worker.js` file will
get output in the `dist` directory safe to use in the browser.

## Move the source files to the dist directory

The `service-worker.js` file now get's output in the `dist` directory but all the
other website files are still left behind in the `src` directory. The `dist` directory
is what is going to end up being served to end users so it needs to contain all the
production website files.

Rollup has a plugin to copy files between directories, while we're here a bonus
improvement could be thrown in, the `service-worker.js` file could be smaller if
its contents were minified.

You guessed it, this means more NPM installs!

```bash
npm i -D rollup-plugin-copy rollup-plugin-terser
```

`terser()` minifies the code that workbox outputs, a good idea to further
reduce service worker startup times

`copy()` takes a target source and destination directories to copy files over
to the destination

The plugins can be imported and included in `rollup.config.js` to complete our
build step&hellip;

```javascript
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import { injectManifest } from 'rollup-plugin-workbox';
import workboxConfig from './workbox-config.js';

export default [{
  input: 'src/service-worker.js',
  output: { dir: 'dist', format: 'cjs' },
  plugins: [injectManifest(workboxConfig)]
}, {
  input: 'dist/service-worker.js',
  output: { dir: 'dist', format: 'cjs' },
  plugins: [
    resolve(),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
    terser(),
    copy({ targets: [{ src: 'src/*', dest: 'dist/' }] })
  ]
}];
```

## Solid foundations

Here's a [working example](https://glitch.com/edit/#!/workbox-precache) to see
all we've been talking about brought together.

With the build step complete we now get the following with zero effort from here
on&hellip;

- Automatically generating caches
- Speedier service worker startup times ⚡️
- Improved versioning and security through NPM
- Increased confidence by removing possibility of human error from the process

At this point, the build could easily be added to continuous integration. Rollup
could also be run in `--watch` mode during development to automatically rebuild
on any file changes.

With the caching and service worker powers acquired so far we're finally ready to
start implementing features and functionality to obtain the *ultimate offline experience*.

**Next up:** <a href="/offline-fallback-page" class="arrow-link">Offline fallback page &xrarr;</a>