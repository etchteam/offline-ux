importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { precacheAndRoute } = workbox.precaching;
const { CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

precacheAndRoute([{"revision":"a9b2611a124faa588cee9149e1825eeb","url":"index.html"},{"revision":"5e89a0d14a7ef2ccb7ae86621bd1c84e","url":"styles.css"}]);

registerRoute(
  /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

self.addEventListener('install', () => {
  self.skipWaiting();
});