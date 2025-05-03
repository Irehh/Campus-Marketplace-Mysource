// Cache names
const STATIC_CACHE_NAME = "campus-marketplace-static-v1"
const DYNAMIC_CACHE_NAME = "campus-marketplace-dynamic-v1"
const DATA_CACHE_NAME = "campus-marketplace-data-v1"

// Files to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/static/js/main.chunk.js",
  "/static/js/0.chunk.js",
  "/static/js/bundle.js",
  "/static/css/main.chunk.css",
  "/icons/favicon-32x32.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/apple-icon-144x144.png",
  "/icons/apple-icon-152x152.png",
  "/icons/android-chrome-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/android-chrome-512x512.png",
  "/offline.html",
]

// API routes to cache
const API_ROUTES = ["/api/products", "/api/businesses", "/api/search"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...")

  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting()

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Precaching App Shell")
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error("[Service Worker] Precaching failed:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...")

  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim())

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key)
            return caches.delete(key)
          }
        }),
      )
    }),
  )

  return self.clients.claim()
})

// Helper function to determine if a request is for an API route
const isApiRequest = (url) => {
  return url.pathname.startsWith("/api/")
}

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))
}

// Helper function to determine if a request is for an image
const isImageRequest = (url) => {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
}

// Fetch event - handle network requests with cache fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests - Network first, then cache
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const clonedResponse = response.clone()

          // Only cache successful responses
          if (response.status === 200) {
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
              console.log("[Service Worker] Cached API response:", url.pathname)
            })
          }

          return response
        })
        .catch((error) => {
          console.log("[Service Worker] Network request failed, trying cache:", url.pathname)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // If we're offline and don't have a cached response for an API request,
            // return a custom offline response
            return new Response(
              JSON.stringify({
                error: "You are offline",
                offline: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            )
          })
        }),
    )
    return
  }

  // Handle static assets - Cache first, then network
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request).then((response) => {
          // Clone the response before using it
          const clonedResponse = response.clone()

          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })

          return response
        })
      }),
    )
    return
  }

  // Handle image requests - Cache first, then network with dynamic caching
  if (isImageRequest(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request)
          .then((response) => {
            // Clone the response before using it
            const clonedResponse = response.clone()

            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse)
            })

            return response
          })
          .catch(() => {
            // If offline and no cached image, return a placeholder
            if (url.pathname.indexOf("/uploads/") > -1) {
              return caches.match("/icons/placeholder.png")
            }
          })
      }),
    )
    return
  }

  // Default strategy for other requests - Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before using it
        const clonedResponse = response.clone()

        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse)
        })

        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If it's a navigation request and we're offline, show the offline page
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }

          // For other requests that aren't in cache, return a simple error response
          return new Response("Not available offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
      }),
  )
})

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Sync event:", event.tag)

  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages())
  } else if (event.tag === "sync-products") {
    event.waitUntil(syncProducts())
  } else if (event.tag === "sync-businesses") {
    event.waitUntil(syncBusinesses())
  }
})

// Function to sync messages that were sent while offline
async function syncMessages() {
  try {
    // Get all pending messages from IndexedDB
    const db = await openDatabase()
    const pendingMessages = await getAllPendingItems(db, "pending-messages")

    console.log("[Service Worker] Syncing messages:", pendingMessages.length)

    // Send each message
    const syncPromises = pendingMessages.map(async (message) => {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${message.token}`,
          },
          body: JSON.stringify(message.data),
        })

        if (response.ok) {
          // If successful, remove from pending
          await deleteItem(db, "pending-messages", message.id)
          console.log("[Service Worker] Successfully synced message:", message.id)

          // Show notification that message was sent
          self.registration.showNotification("Message Sent", {
            body: "Your message has been sent successfully!",
            icon: "/icons/android-icon-192x192.png",
          })

          return { success: true, id: message.id }
        } else {
          console.error("[Service Worker] Failed to sync message:", message.id)
          return { success: false, id: message.id }
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing message:", error)
        return { success: false, id: message.id, error }
      }
    })

    return Promise.all(syncPromises)
  } catch (error) {
    console.error("[Service Worker] Error in syncMessages:", error)
    throw error
  }
}

// Function to sync products that were added while offline
async function syncProducts() {
  try {
    // Get all pending products from IndexedDB
    const db = await openDatabase()
    const pendingProducts = await getAllPendingItems(db, "pending-products")

    console.log("[Service Worker] Syncing products:", pendingProducts.length)

    // Send each product
    const syncPromises = pendingProducts.map(async (product) => {
      try {
        // For products with images, we need to use FormData
        const formData = new FormData()

        // Add all product data
        Object.keys(product.data).forEach((key) => {
          if (key !== "images") {
            formData.append(key, product.data[key])
          }
        })

        // Add images if any
        if (product.data.images && product.data.images.length) {
          product.data.images.forEach((image) => {
            formData.append("images", image)
          })
        }

        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${product.token}`,
          },
          body: formData,
        })

        if (response.ok) {
          // If successful, remove from pending
          await deleteItem(db, "pending-products", product.id)
          console.log("[Service Worker] Successfully synced product:", product.id)

          // Show notification that product was added
          self.registration.showNotification("Product Added", {
            body: "Your product has been added successfully!",
            icon: "/icons/icon-192x192.png",
          })

          return { success: true, id: product.id }
        } else {
          console.error("[Service Worker] Failed to sync product:", product.id)
          return { success: false, id: product.id }
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing product:", error)
        return { success: false, id: product.id, error }
      }
    })

    return Promise.all(syncPromises)
  } catch (error) {
    console.error("[Service Worker] Error in syncProducts:", error)
    throw error
  }
}

// Function to sync businesses that were added while offline
async function syncBusinesses() {
  try {
    // Get all pending businesses from IndexedDB
    const db = await openDatabase()
    const pendingBusinesses = await getAllPendingItems(db, "pending-businesses")

    console.log("[Service Worker] Syncing businesses:", pendingBusinesses.length)

    // Send each business
    const syncPromises = pendingBusinesses.map(async (business) => {
      try {
        // For businesses with images, we need to use FormData
        const formData = new FormData()

        // Add all business data
        Object.keys(business.data).forEach((key) => {
          if (key !== "images") {
            formData.append(key, business.data[key])
          }
        })

        // Add images if any
        if (business.data.images && business.data.images.length) {
          business.data.images.forEach((image) => {
            formData.append("images", image)
          })
        }

        const response = await fetch("/api/businesses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${business.token}`,
          },
          body: formData,
        })

        if (response.ok) {
          // If successful, remove from pending
          await deleteItem(db, "pending-businesses", business.id)
          console.log("[Service Worker] Successfully synced business:", business.id)

          // Show notification that business was added
          self.registration.showNotification("Business Added", {
            body: "Your business has been added successfully!",
            icon: "/icons/android-icon-192x192.png",
          })

          return { success: true, id: business.id }
        } else {
          console.error("[Service Worker] Failed to sync business:", business.id)
          return { success: false, id: business.id }
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing business:", error)
        return { success: false, id: business.id, error }
      }
    })

    return Promise.all(syncPromises)
  } catch (error) {
    console.error("[Service Worker] Error in syncBusinesses:", error)
    throw error
  }
}

// IndexedDB helper functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("campus-marketplace-sync", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object stores for pending items
      if (!db.objectStoreNames.contains("pending-messages")) {
        db.createObjectStore("pending-messages", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("pending-products")) {
        db.createObjectStore("pending-products", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("pending-businesses")) {
        db.createObjectStore("pending-businesses", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

function getAllPendingItems(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

function deleteItem(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = (event) => {
      resolve()
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

// Push notification event listener
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received:", event)

  let data = { title: "New Notification", body: "Something happened in the app." }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/android-icon-192x192.png",
    badge: "/icons/apple-icon-76x76.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click:", event)

  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url))
})
