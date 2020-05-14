import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

const getPage = event => fetch(event.request)
  .catch(() => matchPrecache('/offline.html'));

precacheAndRoute([{"revision":"1a07d995f01d90356aedf423dfe74e67","url":"offline.html"}]);
registerRoute(new NavigationRoute(getPage));