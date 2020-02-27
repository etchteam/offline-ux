---
layout: default.hbs
---

[&larr; Back to all articles](/)

# Show a custom offline page

Display a more engaging custom branded offline webpage when users move offline
instead of the generic default web browser one.

A custom offline page is a good fallback option on any project even if the full
offline experience is going to be out of budget.

![Custom offline page](/assets/custom-offline-page/offline-page.jpg)

<a href="https://custom-offline-page.glitch.me/">
  view demo
</a>
&nbsp; | &nbsp;
<a href="https://glitch.com/edit/#!/custom-offline-page">
  view code
</a>
&nbsp; | &nbsp;
<a href="https://caniuse.com/#search=caches">
  all major browsers except ios safari and ie
</a>

## How to serve a custom offline page

<div class="callout">
  
  **Notice:** This assumes some knowledge of service workers and the cache API provided
  in the [basic cache implementation article](/a-basic-cache-implementation.html).

</div>

## UX Suggestions

- keep it current
- display any blog entries you’ve added to the cache
- display part of the app shell so it looks like the user is still in the app
- What if we made our offline page so useful that users wanted to navigate to it?

## Examples

![Google search offline](/assets/custom-offline-page/google.jpg)
