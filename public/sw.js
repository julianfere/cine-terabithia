const CACHE = 'cine-v1';
const TMDB_CACHE = 'cine-tmdb-v1';
const TMDB_ORIGIN = 'https://image.tmdb.org';

const STATIC = [
  '/',
  '/offline',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== TMDB_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// skipWaiting on demand (update banner)
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data?.json() ?? {}; } catch { data = { body: e.data?.text() ?? '' }; }
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Cine Terabithia', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === e.notification.data.url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(e.notification.data.url);
    })
  );
});

// ── Background Sync ──────────────────────────────────────────────────────────

function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('cine-offline', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('queue', { autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllQueued() {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const results = [];
    const cursor = tx.objectStore('queue').openCursor();
    cursor.onsuccess = (e) => {
      const c = e.target.result;
      if (c) { results.push({ key: c.key, value: c.value }); c.continue(); }
      else resolve(results);
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

async function deleteQueued(key) {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const req = tx.objectStore('queue').delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function syncQueue() {
  const items = await getAllQueued();
  for (const { key, value } of items) {
    try {
      const init = { method: value.method };
      if (value.body !== undefined) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = JSON.stringify(value.body);
      }
      const res = await fetch(value.url, init);
      if (res.ok) {
        await deleteQueued(key);
        const allClients = await self.clients.matchAll({ type: 'window' });
        for (const client of allClients) {
          client.postMessage({ type: 'sync-success', url: value.url });
        }
      }
    } catch {
      // Will retry on next sync event
    }
  }
}

self.addEventListener('sync', (e) => {
  if (e.tag === 'cine-offline-queue') {
    e.waitUntil(syncQueue());
  }
});

// ── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // TMDB images — cache-first, cross-origin
  if (url.origin === TMDB_ORIGIN && request.method === 'GET') {
    e.respondWith(
      caches.open(TMDB_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Next.js manages its own chunks via immutable HTTP headers — don't intercept
  if (url.pathname.startsWith('/_next/')) return;

  // API routes return JSON — never serve HTML fallback for them
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for app icons
  if (url.pathname.startsWith('/icons/') || url.pathname === '/icon.svg') {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for everything else, fall back to cache then offline page
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.destination === 'document') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline'))
      )
  );
});
