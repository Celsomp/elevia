const CACHE = 'elevia-v2'
const NAV_FALLBACK = '/'

// On install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add(NAV_FALLBACK))
      .then(() => self.skipWaiting())
  )
})

// On activate: purge old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first for navigation, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(NAV_FALLBACK, clone))
          return response
        })
        .catch(() => caches.match(NAV_FALLBACK))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return response
      })
      return cached ?? networkFetch
    })
  )
})

// Push: show notification
self.addEventListener('push', event => {
  let data = { title: 'Elevia', body: 'Hora de crescer! 🌻', url: '/dashboard' }
  try { data = { ...data, ...event.data.json() } } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'elevia-daily',
      renotify: true,
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Abrir Elevia' },
      ],
    })
  )
})

// Notification click: open the app
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
