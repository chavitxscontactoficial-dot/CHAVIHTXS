const CACHE_NAME = 'chavihtxs-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza a activar la nueva versión de inmediato
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Toma el control de las pestañas abiertas al instante
    })
  );
});

// Interceptar peticiones: Primero intenta red, si falla usa caché (Network First)
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean GET (evita errores al intentar guardar peticiones POST en caché)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si hay internet, actualizamos la caché con lo más nuevo de forma silenciosa
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Si no hay red, jalamos lo que tengamos guardado offline
        return caches.match(event.request);
      })
  );
});

// Manejo de notificaciones
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: './icon-192.png',
      badge: '/badge.png',
      tag: 'chavihtxs-alert',
      renotify: true
    });
  }
});
