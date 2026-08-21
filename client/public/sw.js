// Barangay Burgos Service Worker (PWA & Offline Support)
const CACHE_NAME = 'brgy-burgos-v2'
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/pwa-icon.svg',
    '/vite.svg',
]

// Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('SW: Precache partial error:', err)
            })
        })
    )
    self.skipWaiting()
})

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key)
                    }
                })
            )
        }).then(() => self.clients.claim())
    )
})

// Fetch event: Network-first with Cache fallback for navigation, Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event
    
    // Only handle http and https requests (Cache API does not support chrome-extension://, moz-extension://, etc.)
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
        return
    }

    const url = new URL(request.url)

    // Bypass non-GET requests and API requests
    if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
        return
    }

    // Navigation requests (HTML pages)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && (url.protocol === 'http:' || url.protocol === 'https:')) {
                        const responseClone = networkResponse.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone).catch(() => {})
                        }).catch(() => {})
                    }
                    return networkResponse
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request)
                    if (cachedResponse) {
                        return cachedResponse
                    }
                    // Fallback to cached root index.html (SPA routing)
                    const indexFallback = await caches.match('/')
                    if (indexFallback) {
                        return indexFallback
                    }
                    return new Response(
                        `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Offline | Barangay Burgos</title><style>body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}.box{max-width:400px;background:#1e293b;padding:30px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);}h1{color:#38bdf8;font-size:1.5rem;}p{color:#94a3b8;line-height:1.5;}.btn{display:inline-block;margin-top:15px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;cursor:pointer;border:none;}</style></head><body><div class="box"><h1>🔌 Offline Ka Muna</h1><p>Kasalukuyang walang internet connection. Maaari mo pa ring gamitin ang mga naka-cache na emergency hotlines at announcements kapag nag-reconnect ka.</p><button class="btn" onclick="location.reload()">Subukan Ulit</button></div></body></html>`,
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    )
                })
        )
        return
    }

    // Static assets (CSS, JS, Fonts, Images)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && (url.protocol === 'http:' || url.protocol === 'https:')) {
                        const responseClone = networkResponse.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone).catch(() => {})
                        }).catch(() => {})
                    }
                    return networkResponse
                })
                .catch(() => cachedResponse)

            return cachedResponse || fetchPromise
        })
    )
})

