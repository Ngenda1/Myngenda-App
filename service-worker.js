// MyNgenda Enhanced Service Worker
const CACHE_NAME = 'myngenda-cache-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/myngenda-icon.png',
  '/icons/maskable-icon.png',
  '/assets/index.js',
  '/assets/index.css',
  '/fix-index.js',
  '/fix-registration.js',
  '/register-fix.html'
];

// Dynamic resources to cache
const DYNAMIC_CACHE = 'myngenda-dynamic-v2';

// Install event - cache core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Ensures the service worker becomes active immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Helper function to determine which caching strategy to use
function shouldUseNetworkFirst(url) {
  const parsedUrl = new URL(url);
  
  // Use network-first for API requests and dynamic content
  return parsedUrl.pathname.startsWith('/api/') || 
         parsedUrl.pathname.includes('token') ||
         parsedUrl.pathname.includes('login') ||
         parsedUrl.pathname.includes('register');
}

// Fetch event
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // Use network-first strategy for API requests and dynamic content
  if (shouldUseNetworkFirst(event.request.url)) {
    event.respondWith(networkFirstStrategy(event.request));
  } 
  // Use cache-first for static assets
  else {
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

// Network-first strategy: try network, fall back to cache, then offline page
async function networkFirstStrategy(request) {
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future use if it's a valid response
    if (networkResponse.ok && networkResponse.status === 200) {
      try {
        dynamicCache.put(request, networkResponse.clone());
      } catch (err) {
        console.error('Error caching dynamic content:', err);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Fetch failed, falling back to cache', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached response for API request, return a custom JSON response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'You are offline. Please check your connection and try again.' 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 503,
          statusText: 'Service Unavailable'
        }
      );
    }
    
    // For non-API requests with no cache, show offline page
    return caches.match('/offline.html');
  }
}

// Cache-first strategy: try cache first, then network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // For HTML requests, show offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    // If nothing else matches, just propagate the error
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-deliveries') {
    event.waitUntil(syncDeliveries());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/myngenda-icon.png',
    badge: '/icons/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background sync implementation
async function syncDeliveries() {
  // Get all pending deliveries from IndexedDB
  // This is a placeholder for actual implementation
  console.log('Syncing pending deliveries');
  
  // In a real implementation, we would:
  // 1. Get pending actions from IndexedDB
  // 2. Send them to the server
  // 3. Update IndexedDB with the results
}
