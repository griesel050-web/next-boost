const CACHE = 'nextboost-v1';
const STATIC = [
  '/assets/css/main.css',
  '/assets/css/app.css',
  '/assets/css/landing.css',
  '/assets/js/app.js',
  '/assets/js/shared.js',
  '/assets/img/logo.png',
  '/assets/img/favicon.svg',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for API/Supabase, cache first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for Supabase / API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache first for CSS/JS/images
  if (e.request.destination === 'style' || e.request.destination === 'script' || e.request.destination === 'image') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network first for HTML pages, fall back to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Next Boost', {
      body: data.body || '',
      icon: '/assets/img/logo.png',
      badge: '/assets/img/favicon.svg',
      tag: data.tag || 'nextboost',
      data: { url: data.url || '/earn/' },
      actions: [{ action: 'open', title: 'Open' }],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/earn/';
  e.waitUntil(clients.openWindow(url));
});
