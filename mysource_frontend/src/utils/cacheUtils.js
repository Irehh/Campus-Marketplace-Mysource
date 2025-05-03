/**
 * Utility functions for managing caches
 */

/**
 * Clear all user-specific caches
 */
export const clearUserCaches = async () => {
  // Clear caches using Cache API
  if ("caches" in window) {
    try {
      const userCacheNames = ["user-data-cache", "user-messages-cache"]

      // Delete specific caches
      for (const cacheName of userCacheNames) {
        await caches.delete(cacheName)
      }

      console.log("User-specific caches cleared")
    } catch (error) {
      console.error("Error clearing caches:", error)
    }
  }

  // Clear IndexedDB data
  if (window.indexedDB) {
    try {
      const dbNames = ["campus-marketplace", "campus-marketplace-sync"]
      for (const dbName of dbNames) {
        window.indexedDB.deleteDatabase(dbName)
      }
      console.log("IndexedDB data cleared")
    } catch (error) {
      console.error("Error clearing IndexedDB:", error)
    }
  }

  // Notify service worker to clear user caches
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_USER_CACHES",
    })
  }
}

/**
 * Preload and cache common pages
 */
export const preloadCommonPages = async () => {
  try {
    if ("caches" in window) {
      const pagesToPreload = ["/", "/products", "/businesses", "/search"]

      const cache = await caches.open("campus-marketplace-dynamic-v1")

      for (const page of pagesToPreload) {
        try {
          const response = await fetch(page, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "Cache-Control": "no-store",
            },
          })

          if (response.ok) {
            await cache.put(page, response)
            console.log(`Preloaded page: ${page}`)
          }
        } catch (error) {
          console.error(`Failed to preload ${page}:`, error)
        }
      }
    }
  } catch (error) {
    console.error("Error preloading pages:", error)
  }
}
