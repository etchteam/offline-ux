'use strict';

var workboxPrecaching = require('workbox-precaching');
var workboxRouting = require('workbox-routing');

const getPage = event => fetch(event.request)
  .catch(() => workboxPrecaching.matchPrecache('/offline.html'));

workboxPrecaching.precacheAndRoute(self.__WB_MANIFEST);
workboxRouting.registerRoute(new workboxRouting.NavigationRoute(getPage));
