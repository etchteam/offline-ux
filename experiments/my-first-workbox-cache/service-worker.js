importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

const strategy = new workbox.strategies.CacheFirst({
  cacheName: 'offline'
});

workbox.routing.registerRoute('/', strategy);
workbox.routing.registerRoute(
  new RegExp('\.(?:css|html|jpeg)$'),
  strategy
);

self.addEventListener('install', () => {
  self.skipWaiting();
});