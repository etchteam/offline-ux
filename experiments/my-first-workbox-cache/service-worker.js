importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const cacheFirst = new workbox.strategies.CacheFirst({
  cacheName: 'offline'
});

workbox.routing.registerRoute('/', cacheFirst);
workbox.routing.registerRoute(
  new RegExp('\.(?:css|html|jpeg)$'),
  cacheFirst
);

self.addEventListener('install', () => {
  self.skipWaiting();
});