/* eslint-disable no-restricted-globals */
// Service Worker with Push Notifications and Network-First Static Asset Caching
const VERSION = "2" // This will be replaced during build
const BUILD_HASH = "2" // This will be replaced during build

// Cache names with version
const STATIC_CACHE_NAME = "campus-marketplace-static-v" + VERSION
const IMAGES_CACHE_NAME = "campus-marketplace-images-v" + VERSION

// Static assets that can be cached
const STATIC_ASSETS = [
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
]

console.log("[Service Worker] Starting Service Worker v" + VERSION + " (Build: " + BUILD_HASH + ")")

// Install event - cache core static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker v" + VERSION)

  // Skip waiting to ensure immediate activation
  self.skipWaiting()

  // Cache static assets
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static assets for version", VERSION)
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker v" + VERSION)

  // Clean up old caches
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match our current version
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== IMAGES_CACHE_NAME) {
              console.log("[Service Worker] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[Service Worker] Cache cleanup completed for version", VERSION)
        // Take control of all clients immediately
        return self.clients.claim()
      })
      .then(() => {
        // Notify all clients about the new version
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "NEW_VERSION_AVAILABLE",
              version: VERSION,
              buildHash: BUILD_HASH,
            })
          })
        })
      }),
  )
})

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))
}

// Helper function to determine if a request is for an image
const isImageRequest = (url) => {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)
}

// Helper function to determine if a request is for an API route
const isApiRequest = (url) => {
  return url.pathname.startsWith("/api/")
}

// Helper function to check for version updates
const checkForVersionUpdate = async () => {
  try {
    const response = await fetch("/version.json", { cache: "no-cache" })
    if (response.ok) {
      const versionInfo = await response.json()
      if (versionInfo.version !== VERSION) {
        console.log("[Service Worker] New version detected:", versionInfo.version, "Current:", VERSION)
        return versionInfo
      }
    }
  } catch (error) {
    console.log("[Service Worker] Could not check version:", error)
  }
  return null
}

// Fetch event - network-first for static assets, no caching for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle version.json requests - always fetch fresh
  if (url.pathname === "/version.json") {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" }).catch(() => {
        return new Response('{"version":"unknown","error":"offline"}', {
          headers: { "Content-Type": "application/json" },
        })
      }),
    )
    return
  }

  // Handle static assets with network-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const clonedResponse = response.clone()

          // Cache the fresh response
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })

          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
        }),
    )
    return
  }

  // Handle image requests with network-first strategy
  if (isImageRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const clonedResponse = response.clone()

          // Cache the fresh image
          caches.open(IMAGES_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })

          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
        }),
    )
    return
  }

  // For API requests, don't cache at all
  if (isApiRequest(url)) {
    return // Let the browser handle it normally
  }

  // For all other requests, use network-first
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only try cache if network fails
      return caches.match(event.request)
    }),
  )
})

// Push notification event listener
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received:", event)

  let data = {
    title: "Campus Marketplace",
    body: "You have a new notification.",
  }

  if (event.data) {
    try {
      data = event.data.json()
      console.log("[Service Worker] Push data:", data)
    } catch (e) {
      console.log("[Service Worker] Push data as text:", event.data.text())
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(
    self.registration
      .showNotification(data.title, options)
      .then(() => {
        console.log("[Service Worker] Notification shown successfully")
      })
      .catch((error) => {
        console.error("[Service Worker] Error showing notification:", error)
      }),
  )
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click:", event)

  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Skip waiting requested")
    self.skipWaiting()
  }

  if (event.data && event.data.type === "CHECK_VERSION") {
    checkForVersionUpdate().then((versionInfo) => {
      event.ports[0]?.postMessage({
        type: "VERSION_CHECK_RESULT",
        versionInfo,
        currentVersion: VERSION,
      })
    })
  }

  if (event.data && event.data.type === "CLEAR_ALL_CACHES") {
    console.log("[Service Worker] Clearing all caches requested")
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        })
        .then(() => {
          console.log("[Service Worker] All caches cleared on request")
          // Notify the client that caches are cleared
          event.ports[0]?.postMessage({ success: true })
        }),
    )
  }
})

// Periodic version check (every 30 minutes)
setInterval(
  () => {
    checkForVersionUpdate().then((versionInfo) => {
      if (versionInfo) {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "NEW_VERSION_AVAILABLE",
              versionInfo,
              currentVersion: VERSION,
            })
          })
        })
      }
    })
  },
  30 * 60 * 1000,
) // 30 minutes

// Error handling
self.addEventListener("error", (event) => {
  console.error("[Service Worker] Error:", event.error)
})

self.addEventListener("unhandledrejection", (event) => {
  console.error("[Service Worker] Unhandled promise rejection:", event.reason)
})

console.log("[Service Worker] Service Worker loaded successfully v" + VERSION)
