/* Service Worker for Skynet - Progressive Web App */
const CACHE_VERSION = 'skynet-v1.6.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
	'/static/css/modern-ui.css',
	'/static/css/bulma-7.css',
	'/static/js/jquery-2.2.0.min.js',
	'/static/js/bulma.js',
	'/static/js/app.js',
	'/static/img/logo.png',
	'/static/fonts/icon-discord.css',
	'/',
];

// Maximum cache sizes
const MAX_DYNAMIC_ITEMS = 50;
const MAX_IMAGE_ITEMS = 100;

// Install event - cache static assets
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then(cache => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting())
			.catch(err => console.error('Service Worker: Cache install failed', err)),
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys()
			.then(keys => Promise.all(
				keys
					.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
					.map(key => caches.delete(key)),
			))
			.then(() => self.clients.claim()),
	);
});

// Helper: Limit cache size
const limitCacheSize = (cacheName, maxItems) => {
	return caches.open(cacheName)
		.then(cache => cache.keys())
		.then(keys => {
			if (keys.length > maxItems) {
				return caches.open(cacheName)
					.then(cache => cache.delete(keys[0]))
					.then(() => limitCacheSize(cacheName, maxItems));
			}
			return Promise.resolve();
		})
		.catch(err => console.error('Cache size limit error:', err));
};

// Helper: Check if request should be cached
const shouldCache = request => {
	const url = new URL(request.url);

	// Don't cache API calls
	if (url.pathname.startsWith('/api/')) return false;

	// Don't cache socket.io
	if (url.pathname.includes('socket.io')) return false;

	// Don't cache authentication endpoints
	if (url.pathname.includes('/login') || url.pathname.includes('/logout')) return false;

	// Don't cache admin/dashboard dynamic content
	if (url.pathname.includes('/admin/') || url.pathname.includes('/dashboard/')) return false;

	return true;
};

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// Skip chrome extensions
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

	// Skip non-cacheable requests
	if (!shouldCache(request)) {
		event.respondWith(fetch(request));
		return;
	}

	// Determine cache strategy based on request type
	const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/.test(url.pathname);
	const isStatic = url.pathname.startsWith('/static/');

	if (isImage) {
		// Images: Cache-first strategy
		event.respondWith(
			caches.match(request)
				.then(cacheRes => {
					if (cacheRes) return cacheRes;

					return fetch(request).then(fetchRes => {
						// Clone response before caching
						const responseClone = fetchRes.clone();

						caches.open(IMAGE_CACHE)
							.then(cache => cache.put(request, responseClone))
							.then(() => limitCacheSize(IMAGE_CACHE, MAX_IMAGE_ITEMS))
							.catch(err => console.error('Image cache error:', err));

						return fetchRes;
					});
				})
				.catch(() => {
					// Return placeholder if offline
					const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
						'<rect fill="#e2e8f0" width="100" height="100"/>' +
						'<text x="50" y="50" text-anchor="middle" dy=".3em" fill="#64748b">Offline</text>' +
						'</svg>';
					return new Response(svg, {
						headers: { 'Content-Type': 'image/svg+xml' },
					});
				}),
		);
	} else if (isStatic) {
		// Static assets: Cache-first with network fallback
		event.respondWith(
			caches.match(request)
				.then(cacheRes => cacheRes || fetch(request))
				.catch(() => caches.match('/')),
		);
	} else {
		// Dynamic pages: Network-first with cache fallback
		event.respondWith(
			fetch(request)
				.then(fetchRes => {
					// Clone response before caching
					const responseClone = fetchRes.clone();

					// Cache successful responses
					if (fetchRes.ok) {
						caches.open(DYNAMIC_CACHE)
							.then(cache => cache.put(request, responseClone))
							.then(() => limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS))
							.catch(err => console.error('Dynamic cache error:', err));
					}

					return fetchRes;
				})
				.catch(() => {
					// Serve from cache if network fails
					return caches.match(request)
						.then(cacheRes => {
							if (cacheRes) return cacheRes;

							// Return offline page if available
							return caches.match('/').then(res => {
								if (res) return res;

								// Fallback offline message
								return new Response('Offline', {
									status: 503,
									statusText: 'Service Unavailable',
									headers: { 'Content-Type': 'text/plain' },
								});
							});
						});
				}),
		);
	}
});

// Handle messages from clients
self.addEventListener('message', event => {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}

	if (event.data.action === 'clearCache') {
		event.waitUntil(
			caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))),
		);
	}
});
