/**
 * Service Worker for Aggressive Image Caching
 * Works even in incognito mode
 */

const CACHE_NAME = 'aggressive-image-cache-v2';
const IMAGE_CACHE_NAME = 'images-v2';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('🧹 Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Intercept image requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle image requests
  if (request.destination === 'image' || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            console.log('⚡ Service Worker: Serving cached image:', request.url);
            return response;
          }

          // If not in cache, fetch and cache it
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              console.log('💾 Service Worker: Caching new image:', request.url);
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch((error) => {
            console.warn('❌ Service Worker: Failed to fetch image:', request.url, error);
            // Return a placeholder or fallback
            return new Response('', { status: 404 });
          });
        });
      })
    );
  }
});

// Message event for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('🚀 Service Worker: Loaded and ready!');
