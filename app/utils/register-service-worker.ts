// Minimal service worker registration helper.
// To enable offline caching, create `public/sw.js` and call register() on load.

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed", err));
    });
  }
}

/*
Example `sw.js` (not included) could precache `/api/timetable.json`:
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('static').then(cache => cache.add('/api/timetable.json'))
  );
});
*/
