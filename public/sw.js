const CACHE_NAME = 'khilafat-books-v3';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.json',
];

// Security & Performance Audit (2026):
// Implements skipWaiting and immediate activation for PWA consistency.
// Enhanced SWR strategy with origin-based security checks.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // SECURITY: Never cache or intercept Supabase API calls, Edge Functions, or auth endpoints
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/') ||
    url.pathname.includes('/functions/') ||
    url.pathname.includes('/auth/')
  ) {
    return;
  }

  // Skip external fonts and CDNs from SWR to maintain strict CSP and avoid cache poisoning
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('res.cloudinary.com') ||
    url.hostname.includes('googletagmanager.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache successful basic responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failure
      });

      return cached || fetchPromise;
    }).catch(() => caches.match('/'))
  );
});
