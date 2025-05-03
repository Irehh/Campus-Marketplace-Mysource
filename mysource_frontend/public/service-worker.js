// // Cache names
// const STATIC_CACHE_NAME = "campus-marketplace-static-v1"
// const DYNAMIC_CACHE_NAME = "campus-marketplace-dynamic-v1"
// const DATA_CACHE_NAME = "campus-marketplace-data-v1"

// // Files to cache
// const STATIC_ASSETS = [
//   "/",
//   "/index.html",
//   "/manifest.json",
//   "/static/js/main.chunk.js",
//   "/static/js/0.chunk.js",
//   "/static/js/bundle.js",
//   "/static/css/main.chunk.css",
//   "/icons/favicon-32x32.png",
//   "/icons/icon-96x96.png",
//   "/icons/icon-128x128.png",
//   "/icons/apple-icon-144x144.png",
//   "/icons/apple-icon-152x152.png",
//   "/icons/android-chrome-192x192.png",
//   "/icons/icon-384x384.png",
//   "/icons/android-chrome-512x512.png",
//   "/offline.html",
// ]

// // API routes to cache
// const API_ROUTES = ["/api/products", "/api/businesses", "/api/search"]

// // Install event - cache static assets
// self.addEventListener("install", (event) => {
//   console.log("[Service Worker] Installing Service Worker...")

//   // Skip waiting to ensure the new service worker activates immediately
//   self.skipWaiting()

//   event.waitUntil(
//     caches
//       .open(STATIC_CACHE_NAME)
//       .then((cache) => {
//         console.log("[Service Worker] Precaching App Shell")
//         return cache.addAll(STATIC_ASSETS)
//       })
//       .catch((error) => {
//         console.error("[Service Worker] Precaching failed:", error)
//       }),
//   )
// })

// // Activate event - clean up old caches
// self.addEventListener("activate", (event) => {
//   console.log("[Service Worker] Activating Service Worker...")

//   // Claim clients to ensure the service worker controls all clients immediately
//   event.waitUntil(self.clients.claim())

//   // Clean up old caches
//   event.waitUntil(
//     caches.keys().then((keyList) => {
//       return Promise.all(
//         keyList.map((key) => {
//           if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME && key !== DATA_CACHE_NAME) {
//             console.log("[Service Worker] Removing old cache:", key)
//             return caches.delete(key)
//           }
//         }),
//       )
//     }),
//   )

//   return self.clients.claim()
// })

// // Helper function to determine if a request is for an API route
// const isApiRequest = (url) => {
//   return url.pathname.startsWith("/api/")
// }

// // Helper function to determine if a request is for a static asset
// const isStaticAsset = (url) => {
//   return STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))
// }

// // Helper function to determine if a request is for an image
// const isImageRequest = (url) => {
//   return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
// }

// // Fetch event - handle network requests with cache fallback
// self.addEventListener("fetch", (event) => {
//   const url = new URL(event.request.url)

//   // Skip cross-origin requests
//   if (url.origin !== location.origin) {
//     return
//   }

//   // Handle API requests - Network first, then cache
//   if (isApiRequest(url)) {
//     event.respondWith(
//       fetch(event.request)
//         .then((response) => {
//           // Clone the response before using it
//           const clonedResponse = response.clone()

//           // Only cache successful responses
//           if (response.status === 200) {
//             caches.open(DATA_CACHE_NAME).then((cache) => {
//               cache.put(event.request, clonedResponse)
//               console.log("[Service Worker] Cached API response:", url.pathname)
//             })
//           }

//           return response
//         })
//         .catch((error) => {
//           console.log("[Service Worker] Network request failed, trying cache:", url.pathname)
//           return caches.match(event.request).then((cachedResponse) => {
//             if (cachedResponse) {
//               return cachedResponse
//             }

//             // If we're offline and don't have a cached response for an API request,
//             // return a custom offline response
//             return new Response(
//               JSON.stringify({
//                 error: "You are offline",
//                 offline: true,
//               }),
//               {
//                 headers: { "Content-Type": "application/json" },
//               },
//             )
//           })
//         }),
//     )
//     return
//   }

//   // Handle static assets - Cache first, then network
//   if (isStaticAsset(url)) {
//     event.respondWith(
//       caches.match(event.request).then((cachedResponse) => {
//         if (cachedResponse) {
//           return cachedResponse
//         }

//         return fetch(event.request).then((response) => {
//           // Clone the response before using it
//           const clonedResponse = response.clone()

//           caches.open(STATIC_CACHE_NAME).then((cache) => {
//             cache.put(event.request, clonedResponse)
//           })

//           return response
//         })
//       }),
//     )
//     return
//   }

//   // Handle image requests - Cache first, then network with dynamic caching
//   if (isImageRequest(url)) {
//     event.respondWith(
//       caches.match(event.request).then((cachedResponse) => {
//         if (cachedResponse) {
//           return cachedResponse
//         }

//         return fetch(event.request)
//           .then((response) => {
//             // Clone the response before using it
//             const clonedResponse = response.clone()

//             caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
//               cache.put(event.request, clonedResponse)
//             })

//             return response
//           })
//           .catch(() => {
//             // If offline and no cached image, return a placeholder
//             if (url.pathname.indexOf("/uploads/") > -1) {
//               return caches.match("/icons/placeholder.png")
//             }
//           })
//       }),
//     )
//     return
//   }

//   // Default strategy for other requests - Network first with cache fallback
//   event.respondWith(
//     fetch(event.request)
//       .then((response) => {
//         // Clone the response before using it
//         const clonedResponse = response.clone()

//         caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
//           cache.put(event.request, clonedResponse)
//         })

//         return response
//       })
//       .catch(() => {
//         return caches.match(event.request).then((cachedResponse) => {
//           if (cachedResponse) {
//             return cachedResponse
//           }

//           // If it's a navigation request and we're offline, show the offline page
//           if (event.request.mode === "navigate") {
//             return caches.match("/offline.html")
//           }

//           // For other requests that aren't in cache, return a simple error response
//           return new Response("Not available offline", {
//             status: 503,
//             statusText: "Service Unavailable",
//           })
//         })
//       }),
//   )
// })

// // Background sync for offline form submissions
// self.addEventListener("sync", (event) => {
//   console.log("[Service Worker] Background Sync event:", event.tag)

//   if (event.tag === "sync-messages") {
//     event.waitUntil(syncMessages())
//   } else if (event.tag === "sync-products") {
//     event.waitUntil(syncProducts())
//   } else if (event.tag === "sync-businesses") {
//     event.waitUntil(syncBusinesses())
//   }
// })

// // Function to sync messages that were sent while offline
// async function syncMessages() {
//   try {
//     // Get all pending messages from IndexedDB
//     const db = await openDatabase()
//     const pendingMessages = await getAllPendingItems(db, "pending-messages")

//     console.log("[Service Worker] Syncing messages:", pendingMessages.length)

//     // Send each message
//     const syncPromises = pendingMessages.map(async (message) => {
//       try {
//         const response = await fetch("/api/messages", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${message.token}`,
//           },
//           body: JSON.stringify(message.data),
//         })

//         if (response.ok) {
//           // If successful, remove from pending
//           await deleteItem(db, "pending-messages", message.id)
//           console.log("[Service Worker] Successfully synced message:", message.id)

//           // Show notification that message was sent
//           self.registration.showNotification("Message Sent", {
//             body: "Your message has been sent successfully!",
//             icon: "/icons/android-icon-192x192.png",
//           })

//           return { success: true, id: message.id }
//         } else {
//           console.error("[Service Worker] Failed to sync message:", message.id)
//           return { success: false, id: message.id }
//         }
//       } catch (error) {
//         console.error("[Service Worker] Error syncing message:", error)
//         return { success: false, id: message.id, error }
//       }
//     })

//     return Promise.all(syncPromises)
//   } catch (error) {
//     console.error("[Service Worker] Error in syncMessages:", error)
//     throw error
//   }
// }

// // Function to sync products that were added while offline
// async function syncProducts() {
//   try {
//     // Get all pending products from IndexedDB
//     const db = await openDatabase()
//     const pendingProducts = await getAllPendingItems(db, "pending-products")

//     console.log("[Service Worker] Syncing products:", pendingProducts.length)

//     // Send each product
//     const syncPromises = pendingProducts.map(async (product) => {
//       try {
//         // For products with images, we need to use FormData
//         const formData = new FormData()

//         // Add all product data
//         Object.keys(product.data).forEach((key) => {
//           if (key !== "images") {
//             formData.append(key, product.data[key])
//           }
//         })

//         // Add images if any
//         if (product.data.images && product.data.images.length) {
//           product.data.images.forEach((image) => {
//             formData.append("images", image)
//           })
//         }

//         const response = await fetch("/api/products", {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${product.token}`,
//           },
//           body: formData,
//         })

//         if (response.ok) {
//           // If successful, remove from pending
//           await deleteItem(db, "pending-products", product.id)
//           console.log("[Service Worker] Successfully synced product:", product.id)

//           // Show notification that product was added
//           self.registration.showNotification("Product Added", {
//             body: "Your product has been added successfully!",
//             icon: "/icons/icon-192x192.png",
//           })

//           return { success: true, id: product.id }
//         } else {
//           console.error("[Service Worker] Failed to sync product:", product.id)
//           return { success: false, id: product.id }
//         }
//       } catch (error) {
//         console.error("[Service Worker] Error syncing product:", error)
//         return { success: false, id: product.id, error }
//       }
//     })

//     return Promise.all(syncPromises)
//   } catch (error) {
//     console.error("[Service Worker] Error in syncProducts:", error)
//     throw error
//   }
// }

// // Function to sync businesses that were added while offline
// async function syncBusinesses() {
//   try {
//     // Get all pending businesses from IndexedDB
//     const db = await openDatabase()
//     const pendingBusinesses = await getAllPendingItems(db, "pending-businesses")

//     console.log("[Service Worker] Syncing businesses:", pendingBusinesses.length)

//     // Send each business
//     const syncPromises = pendingBusinesses.map(async (business) => {
//       try {
//         // For businesses with images, we need to use FormData
//         const formData = new FormData()

//         // Add all business data
//         Object.keys(business.data).forEach((key) => {
//           if (key !== "images") {
//             formData.append(key, business.data[key])
//           }
//         })

//         // Add images if any
//         if (business.data.images && business.data.images.length) {
//           business.data.images.forEach((image) => {
//             formData.append("images", image)
//           })
//         }

//         const response = await fetch("/api/businesses", {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${business.token}`,
//           },
//           body: formData,
//         })

//         if (response.ok) {
//           // If successful, remove from pending
//           await deleteItem(db, "pending-businesses", business.id)
//           console.log("[Service Worker] Successfully synced business:", business.id)

//           // Show notification that business was added
//           self.registration.showNotification("Business Added", {
//             body: "Your business has been added successfully!",
//             icon: "/icons/android-icon-192x192.png",
//           })

//           return { success: true, id: business.id }
//         } else {
//           console.error("[Service Worker] Failed to sync business:", business.id)
//           return { success: false, id: business.id }
//         }
//       } catch (error) {
//         console.error("[Service Worker] Error syncing business:", error)
//         return { success: false, id: business.id, error }
//       }
//     })

//     return Promise.all(syncPromises)
//   } catch (error) {
//     console.error("[Service Worker] Error in syncBusinesses:", error)
//     throw error
//   }
// }

// // IndexedDB helper functions
// function openDatabase() {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open("campus-marketplace-sync", 1)

//     request.onupgradeneeded = (event) => {
//       const db = event.target.result

//       // Create object stores for pending items
//       if (!db.objectStoreNames.contains("pending-messages")) {
//         db.createObjectStore("pending-messages", { keyPath: "id" })
//       }

//       if (!db.objectStoreNames.contains("pending-products")) {
//         db.createObjectStore("pending-products", { keyPath: "id" })
//       }

//       if (!db.objectStoreNames.contains("pending-businesses")) {
//         db.createObjectStore("pending-businesses", { keyPath: "id" })
//       }
//     }

//     request.onsuccess = (event) => {
//       resolve(event.target.result)
//     }

//     request.onerror = (event) => {
//       reject(event.target.error)
//     }
//   })
// }

// function getAllPendingItems(db, storeName) {
//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction(storeName, "readonly")
//     const store = transaction.objectStore(storeName)
//     const request = store.getAll()

//     request.onsuccess = (event) => {
//       resolve(event.target.result)
//     }

//     request.onerror = (event) => {
//       reject(event.target.error)
//     }
//   })
// }

// function deleteItem(db, storeName, id) {
//   return new Promise((resolve, reject) => {
//     const transaction = db.transaction(storeName, "readwrite")
//     const store = transaction.objectStore(storeName)
//     const request = store.delete(id)

//     request.onsuccess = (event) => {
//       resolve()
//     }

//     request.onerror = (event) => {
//       reject(event.target.error)
//     }
//   })
// }

// // Push notification event listener
// self.addEventListener("push", (event) => {
//   console.log("[Service Worker] Push Received:", event)

//   let data = { title: "New Notification", body: "Something happened in the app." }

//   if (event.data) {
//     try {
//       data = event.data.json()
//     } catch (e) {
//       data.body = event.data.text()
//     }
//   }

//   const options = {
//     body: data.body,
//     icon: "/icons/android-icon-192x192.png",
//     badge: "/icons/apple-icon-76x76.png",
//     vibrate: [100, 50, 100],
//     data: {
//       url: data.url || "/",
//     },
//   }

//   event.waitUntil(self.registration.showNotification(data.title, options))
// })

// // Notification click event
// self.addEventListener("notificationclick", (event) => {
//   console.log("[Service Worker] Notification click:", event)

//   event.notification.close()

//   event.waitUntil(clients.openWindow(event.notification.data.url))
// })



/* eslint-disable no-restricted-globals */
// Cache names
const STATIC_CACHE_NAME = "campus-marketplace-static-v1"
const DYNAMIC_CACHE_NAME = "campus-marketplace-dynamic-v1"
const DATA_CACHE_NAME = "campus-marketplace-data-v1"
const USER_DATA_CACHE_NAME = "user-data-cache"
const USER_MESSAGES_CACHE_NAME = "user-messages-cache"

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

// API routes to cache with different strategies
const API_ROUTES_TO_CACHE = [
  // Dynamic content - stale-while-revalidate
  {
    urlPattern: /\/api\/products\?.*limit=4/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 900, // 15 minutes
    strategy: "stale-while-revalidate",
  },
  {
    urlPattern: /\/api\/businesses\?.*limit=3/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 900, // 15 minutes
    strategy: "stale-while-revalidate",
  },
  {
    urlPattern: /\/api\/products\?/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 900, // 15 minutes
    strategy: "stale-while-revalidate",
  },
  {
    urlPattern: /\/api\/businesses\?/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 900, // 15 minutes
    strategy: "stale-while-revalidate",
  },

  // Detail pages - network first
  {
    urlPattern: /\/api\/products\/[a-zA-Z0-9-]+$/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 1800, // 30 minutes
    strategy: "network-first",
  },
  {
    urlPattern: /\/api\/businesses\/[a-zA-Z0-9-]+$/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 1800, // 30 minutes
    strategy: "network-first",
  },

  // Search results - network first
  {
    urlPattern: /\/api\/search\?/,
    cacheName: DYNAMIC_CACHE_NAME,
    maxAge: 900, // 15 minutes
    strategy: "network-first",
  },

  // User-specific data - network first with short cache
  {
    urlPattern: /\/api\/auth\/me/,
    cacheName: USER_DATA_CACHE_NAME,
    maxAge: 300, // 5 minutes
    strategy: "network-first",
  },
  {
    urlPattern: /\/api\/messages/,
    cacheName: USER_MESSAGES_CACHE_NAME,
    maxAge: 60, // 1 minute
    strategy: "network-first",
  },
  {
    urlPattern: /\/api\/favorites/,
    cacheName: USER_DATA_CACHE_NAME,
    maxAge: 300, // 5 minutes
    strategy: "network-first",
  },
]

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
          if (
            key !== STATIC_CACHE_NAME &&
            key !== DYNAMIC_CACHE_NAME &&
            key !== DATA_CACHE_NAME &&
            key !== USER_DATA_CACHE_NAME &&
            key !== USER_MESSAGES_CACHE_NAME
          ) {
            console.log("[Service Worker] Removing old cache:", key)
            return caches.delete(key)
          }
        }),
      )
    }),
  )

  return self.clients.claim()
})

// Helper function to determine if a request matches any of our cacheable API routes
const getMatchingCacheConfig = (url) => {
  const urlString = url.toString()
  return API_ROUTES_TO_CACHE.find((route) => route.urlPattern.test(urlString))
}

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))
}

// Helper function to determine if a request is for an image
const isImageRequest = (url) => {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
}

// Helper function to determine if a request is for an API route
const isApiRequest = (url) => {
  return url.pathname.startsWith("/api/")
}

// Helper function to determine if a request is for a write operation
const isWriteOperation = (request) => {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
}

// Helper function to broadcast updates to clients
const broadcastUpdate = (cacheName, url) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "CACHE_UPDATED",
        meta: {
          cacheName,
          url,
        },
      })
    })
  })
}

// Fetch event - handle network requests with appropriate caching strategies
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip write operations - always go to network
  if (isWriteOperation(event.request)) {
    return
  }

  // Handle API requests with different strategies based on configuration
  if (isApiRequest(url)) {
    const cacheConfig = getMatchingCacheConfig(url)

    if (cacheConfig) {
      // Choose strategy based on configuration
      if (cacheConfig.strategy === "stale-while-revalidate") {
        // STALE-WHILE-REVALIDATE: Show cached content immediately, then update from network
        event.respondWith(
          caches.open(cacheConfig.cacheName).then((cache) => {
            return cache
              .match(event.request)
              .then((cachedResponse) => {
                // Start network fetch in the background
                const fetchPromise = fetch(event.request)
                  .then((networkResponse) => {
                    // If we got a valid response, cache it
                    if (networkResponse.ok) {
                      const clonedResponse = networkResponse.clone()
                      cache.put(event.request, clonedResponse)

                      // Notify clients about the update
                      broadcastUpdate(cacheConfig.cacheName, event.request.url)

                      // Update expiration metadata
                      if (cacheConfig.maxAge) {
                        const expirationTime = Date.now() + cacheConfig.maxAge * 1000
                        const metadata = {
                          url: event.request.url,
                          timestamp: Date.now(),
                          expiration: expirationTime,
                        }
                        try {
                          const key = `cache-expiration:${event.request.url}`
                          localStorage.setItem(key, JSON.stringify(metadata))
                        } catch (e) {
                          console.error("Error storing cache expiration:", e)
                        }
                      }
                    }
                    return networkResponse
                  })
                  .catch((error) => {
                    console.error("[Service Worker] Network request failed:", error)
                    // If network fails and we have cached content, that's already being returned
                    // If we don't have cached content, this will propagate to the catch below
                    throw error
                  })

                // Return cached response immediately if we have it
                return cachedResponse || fetchPromise
              })
              .catch(() => {
                // If both cache and network fail, return offline response
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
      } else if (cacheConfig.strategy === "network-first") {
        // NETWORK-FIRST: Try network first, fall back to cache
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              // Clone the response before using it
              const clonedResponse = response.clone()

              // Only cache successful responses
              if (response.status === 200) {
                caches.open(cacheConfig.cacheName).then((cache) => {
                  cache.put(event.request, clonedResponse)

                  // Update expiration metadata
                  if (cacheConfig.maxAge) {
                    const expirationTime = Date.now() + cacheConfig.maxAge * 1000
                    const metadata = {
                      url: event.request.url,
                      timestamp: Date.now(),
                      expiration: expirationTime,
                    }
                    try {
                      const key = `cache-expiration:${event.request.url}`
                      localStorage.setItem(key, JSON.stringify(metadata))
                    } catch (e) {
                      console.error("Error storing cache expiration:", e)
                    }
                  }
                })
              }
              return response
            })
            .catch(() => {
              // If network fails, try cache
              return caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                  // Check if cache is expired
                  try {
                    const key = `cache-expiration:${event.request.url}`
                    const metadataStr = localStorage.getItem(key)
                    if (metadataStr) {
                      const metadata = JSON.parse(metadataStr)
                      if (metadata.expiration < Date.now()) {
                        console.log("[Service Worker] Cache expired:", url.pathname)
                        return new Response(
                          JSON.stringify({
                            error: "You are offline and cached data has expired",
                            offline: true,
                            expired: true,
                          }),
                          {
                            headers: { "Content-Type": "application/json" },
                          },
                        )
                      }
                    }
                  } catch (e) {
                    console.error("Error checking cache expiration:", e)
                  }
                  return cachedResponse
                }

                // If no cache, return offline response
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
    }

    // For API requests we don't explicitly want to cache, just pass through
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
            if (url.pathname.indexOf("/Uploads/") > -1) {
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

        // Don't cache HTML pages with dynamic content
        if (
          !event.request.url.includes("/api/") &&
          !event.request.url.endsWith(".html") &&
          !event.request.url.includes("/auth/")
        ) {
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
        }

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
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
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

// Periodic cache cleanup
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_USER_CACHES") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name === USER_DATA_CACHE_NAME || name === USER_MESSAGES_CACHE_NAME)
            .map((name) => caches.delete(name)),
        )
      }),
    )
  }
})

// Clean expired caches periodically
const cleanupExpiredCache = async () => {
  try {
    // Get all keys from localStorage that start with cache-expiration
    const expirationKeys = Object.keys(localStorage).filter((key) => key.startsWith("cache-expiration:"))

    for (const key of expirationKeys) {
      try {
        const metadataStr = localStorage.getItem(key)
        if (!metadataStr) continue

        const metadata = JSON.parse(metadataStr)

        // If expired, remove from cache
        if (metadata.expiration < Date.now()) {
          const url = metadata.url
          const cacheNames = [DYNAMIC_CACHE_NAME, DATA_CACHE_NAME, USER_DATA_CACHE_NAME, USER_MESSAGES_CACHE_NAME]

          // Try to find and remove the cached response in all caches
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName)
            await cache.delete(url)
          }

          // Remove the expiration entry
          localStorage.removeItem(key)
          console.log("[Service Worker] Removed expired cache:", url)
        }
      } catch (e) {
        console.error("Error processing cache expiration:", e)
      }
    }
  } catch (e) {
    console.error("Error in cleanupExpiredCache:", e)
  }
}

// Run cache cleanup every hour
setInterval(cleanupExpiredCache, 60 * 60 * 1000)
