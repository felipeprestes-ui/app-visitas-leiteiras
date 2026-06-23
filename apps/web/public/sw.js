const CACHE_VERSION = 'vl-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Helper to get base path dynamically
function getBasePath() {
  const scope = self.registration.scope;
  return new URL(scope).pathname;
}

self.addEventListener('install', (event) => {
  const basePath = getBasePath();
  const OFFLINE_ROUTES = [
    '',
    'login/',
    'dashboard/',
    'visitas/',
    'agenda/',
    'vendas/',
    'tecnicos/',
    'relatorios/',
    'sync/'
  ];
  const OFFLINE_URLS = OFFLINE_ROUTES.map(route => `${basePath}${route}`);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isApiRequest = url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/');

  if (isApiRequest) {
    event.respondWith(cacheFirstApi(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const basePath = getBasePath();
    if (request.destination === 'document') {
      return caches.match(`${basePath}login/`);
    }
    return new Response('Offline', { status: 503 });
  }
}

async function cacheFirstApi(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(API_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
}