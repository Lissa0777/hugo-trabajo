const CACHE_NAME = 'mxbiznews-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('No se pudo cachear:', url);
        }
      }
    })
  );
  self.skipWaiting();
});