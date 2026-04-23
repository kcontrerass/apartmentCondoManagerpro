const CACHE_NAME = 'adesso365-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/icon.svg',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: '/icon.svg',
                badge: '/icon.svg',
                data: {
                    url: data.url || '/'
                },
                vibrate: [100, 50, 100],
                actions: [
                    {
                        action: 'open_url',
                        title: 'Ver ahora'
                    }
                ]
            };

            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        } catch (e) {
            console.error('Push data error:', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const raw = event.notification.data && event.notification.data.url;
    const path =
        typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : '/es/';
    const url =
        path.startsWith('http://') || path.startsWith('https://')
            ? path
            : new URL(path, self.location.origin).href;

    event.waitUntil(clients.openWindow(url));
});
