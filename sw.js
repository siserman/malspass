/* Malspaß service worker — cache-first so the app works fully offline */
var CACHE = 'malspass-v7';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './css/app.css',
  './js/core.js',
  './js/texts.js',
  './js/audio.js',
  './js/mascot.js',
  './js/brushes.js',
  './js/paint.js',
  './js/session.js',
  './js/gallery.js',
  './js/parent.js',
  './js/app.js',
  './audio/de-black.mp3',
  './audio/de-blue.mp3',
  './audio/de-brown.mp3',
  './audio/de-clean.mp3',
  './audio/de-green.mp3',
  './audio/de-lang.mp3',
  './audio/de-orange.mp3',
  './audio/de-pink.mp3',
  './audio/de-purple.mp3',
  './audio/de-red.mp3',
  './audio/de-white.mp3',
  './audio/de-yellow.mp3',
  './audio/en-black.mp3',
  './audio/en-blue.mp3',
  './audio/en-brown.mp3',
  './audio/en-clean.mp3',
  './audio/en-green.mp3',
  './audio/en-lang.mp3',
  './audio/en-orange.mp3',
  './audio/en-pink.mp3',
  './audio/en-purple.mp3',
  './audio/en-red.mp3',
  './audio/en-white.mp3',
  './audio/en-yellow.mp3'
];

self.addEventListener('install', function (e) {
  // 'reload' skips the HTTP cache, so a new version never caches an old file
  var fresh = ASSETS.map(function (url) { return new Request(url, { cache: 'reload' }); });
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(fresh); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
