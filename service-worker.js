const CACHE_NAME = 'mi-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icons/icono 192x192.png' // Asegúrate de que este icono exista en tu carpeta icons
    // Puedes añadir más iconos o recursos que quieras cachear aquí
];

// Evento: 'install'
// Se ejecuta cuando el Service Worker se instala por primera vez
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento: 'fetch'
// Se ejecuta cada vez que la PWA intenta hacer una solicitud de red (ej. cargar una página, una imagen)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el recurso está en caché, lo devuelve
                if (response) {
                    return response;
                }
                // Si no está en caché, intenta obtenerlo de la red
                return fetch(event.request);
            })
    );
});

// Evento: 'activate'
// Se ejecuta cuando el Service Worker se activa (ej. después de una actualización)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});