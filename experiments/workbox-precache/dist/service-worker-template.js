'use strict';

var workboxRouting = require('workbox-routing');
var workboxPrecaching = require('workbox-precaching');
var workboxStrategies = require('workbox-strategies');
var workboxExpiration = require('workbox-expiration');

workboxPrecaching.precacheAndRoute(self.__WB_MANIFEST);

workboxRouting.registerRoute(
  /\.(?:png|gif|jpg|jpeg|webp|svg)$/,
  new workboxStrategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workboxExpiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

self.addEventListener('install', () => {
  self.skipWaiting();
});
