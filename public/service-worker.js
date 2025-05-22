// Myngenda Progressive Web App Service Worker
const CACHE_NAME = 'myngenda-cache-v1';
const APP_PREFIX = 'myngenda-';
const VERSION = 'v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/screenshots/homepage.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/.well-known/assetlinks.json'
];

// Keep initial cache minimal for fast registration
const ALL_ASSETS = URLS_TO_CACHE;

// Install event - cache core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Ensures the service worker becomes active immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache: ' + CACHE_NAME);
        return cache.addAll(ALL_ASSETS);
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service worker activated');
      // Claim control immediately to ensure consistent behavior
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network with network-first strategy for API requests
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const requestUrl = new URL(event.request.url);
  
  // Network-first strategy for API requests
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If successful, clone and store in cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try from cache
          return caches.match(event.request);
        })
    );
  } 
  // Cache-first strategy for static assets
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          
          // Clone the request
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(error => {
              console.error('Fetch failed:', error);
              // You could return a custom offline page here
            });
        })
    );
  }
});