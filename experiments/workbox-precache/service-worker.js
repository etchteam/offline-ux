importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([
  {"revision":"13187a99c3b92698b93520df29dc23e4","url":"image.jpeg"},
  {"revision":"a9b2611a124faa588cee9149e1825eeb","url":"index.html"},
  {"revision":"5e89a0d14a7ef2ccb7ae86621bd1c84e","url":"styles.css"}
]);

self.addEventListener('install', () => {
  self.skipWaiting();
});