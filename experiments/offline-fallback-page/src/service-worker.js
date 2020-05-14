import { precacheAndRoute, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

const getPage = event => fetch(event.request)
  .catch(() => matchPrecache('/offline.html'));

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(getPage));