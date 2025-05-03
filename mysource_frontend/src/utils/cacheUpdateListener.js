"use client"

import React from "react"

/**
 * Utility to listen for cache updates from the service worker
 * and refresh the UI when new content is available
 */

export const setupCacheUpdateListener = () => {
  // Only set up the listener once
  if (window._cacheUpdateListenerSetup) return
  window._cacheUpdateListenerSetup = true

  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CACHE_UPDATED") {
      const { cacheName, url } = event.data.meta

      console.log(`[Cache Update] New content available for ${url}`)

      // Check if this is a product or business listing update
      if (url.includes("/api/products") || url.includes("/api/businesses")) {
        // Find components that might need to refresh
        const componentsToUpdate = findComponentsToUpdate(url)

        // Notify components to refresh their data
        if (componentsToUpdate.length > 0) {
          window.dispatchEvent(
            new CustomEvent("cache-updated", {
              detail: { url, cacheName, componentsToUpdate },
            }),
          )
        }
      }
    }
  })
}

/**
 * Find components that might need to update based on the URL
 */
const findComponentsToUpdate = (url) => {
  const components = []

  // Homepage products
  if (url.includes("/api/products") && url.includes("limit=4")) {
    components.push("homepage-products")
  }

  // Homepage businesses
  if (url.includes("/api/businesses") && url.includes("limit=3")) {
    components.push("homepage-businesses")
  }

  // Product listings
  if (url.includes("/api/products") && !url.includes("limit=4")) {
    components.push("product-listings")
  }

  // Business listings
  if (url.includes("/api/businesses") && !url.includes("limit=3")) {
    components.push("business-listings")
  }

  return components
}

/**
 * Hook to use in components to listen for cache updates
 */
export const useCacheUpdateListener = (componentId, onUpdate) => {
  React.useEffect(() => {
    // Set up the listener if not already done
    if (navigator.serviceWorker) {
      setupCacheUpdateListener()
    }

    // Listen for cache update events
    const handleCacheUpdate = (event) => {
      const { componentsToUpdate } = event.detail

      // If this component should update, call the callback
      if (componentsToUpdate.includes(componentId)) {
        onUpdate()
      }
    }

    window.addEventListener("cache-updated", handleCacheUpdate)

    // Clean up
    return () => {
      window.removeEventListener("cache-updated", handleCacheUpdate)
    }
  }, [componentId, onUpdate])
}
