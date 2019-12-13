## General
- Security? - Service workers need to be run in "secure context" so either localhost or over https
- This is good https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle maybe it could be expanded on with some diagrams
- Good article on the problems with the PWA model http://softwareas.com/progressive-web-apps-have-leapfrogged-the-native-install-model-but-challenges-remain/
- https://addyosmani.com/blog/getting-started-with-progressive-web-apps/
- Background Sync — https://developers.google.com/web/updates/2015/12/background-sync?hl=en is for deferring actions until the user has stable connectivity. This is handy for making use whatever the user wants to send is actually sent. This enables pushing periodic updates when the app is next online. (only supported in chrome)
- Push API https://developers.google.com/web/fundamentals/engage-and-retain/push-notifications/ — An API enabling push services to send push messages to a webapp. Servers can send messages at any time, even when the webapp or browser are not running.
- Agressively cache the app shell first then display that immediately on any load
- "perhaps server-side rendering should not be viewed as a fallback but client-side rendering should be looked at as an enhancement." - Jeremy Keith
- Probably need difficulty and reading length indicators
- Probably helpful to have can i use stats for popular browsers
- Google handles offline searches like: https://etch.slack.com/archives/CRBQC3WNP/p1576269769001000

## Achieving the ultimate offline experience
- While online, downloaded network requests and assets are cached depending on what the user has viewed
- While offline, the cache is used to allow users to view the downloaded content.
- Content that can't be viewed because of poor or non existing network connection should show as unavailable.
- Once a network connection is regained content should become available again seemlesly

## Show a custom offline page
- how do these people do it https://taskmob.demo.vaadin.com/ (disconnect to see)

## How to offline
- Service workers
- Implementing a basic service worker
- Workbox
- Manifests
- Use in Frameworks

## Wonderful progressive web apps
- Bad connection - Can still load data and use network as fallback
- No connection - Can still browse
- Cacheing - No more need for recurring HTTP requests on every page load for things that don't change like font files
- Kill the app store - Linkable, no hassle install, no central controlling monopoly, no install times, better natural discovery (not limited to app store descriptions), use app before you install it
- The future of applications

## Adding a click to install app button
- Is it possible?
- Could pay to install be implemented?
- Dealing with people who have already installed a native app

## Awesome offline
- https://github.com/hemanth/awesome-pwa
- https://serviceworke.rs/
- https://jakearchibald.com/2014/offline-cookbook/
- https://addyosmani.com/blog/getting-started-with-progressive-web-apps/

## Adding a click to install button
- See navigator.storage.requestPersistent()

# Features
- Add definitions for key words, this would automatically underline the word wherever it appears and show a tooltip on hover.
  - Service worker(s)
  - Offline first