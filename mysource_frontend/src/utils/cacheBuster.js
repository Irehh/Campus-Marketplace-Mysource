// Cache buster utility - only clears API response caches

// Function to clear API caches only
export const clearApiCaches = async () => {
  if ("caches" in window) {
    try {
      const keys = await caches.keys()
      const apiCaches = keys.filter((key) => key.includes("data") || key.includes("api"))

      await Promise.all(apiCaches.map((key) => caches.delete(key)))

      console.log("API caches cleared")
      return true
    } catch (error) {
      console.error("Error clearing API caches:", error)
      return false
    }
  }
  return false
}

// Function to reload the page after clearing caches
export const clearApiCachesAndReload = async () => {
  await clearApiCaches()
  window.location.reload()
}

// Function to check for new version
export const checkForNewVersion = (callback) => {
  const currentVersion = process.env.REACT_APP_VERSION || localStorage.getItem("appVersion") || "1.0.0"

  // Store current version
  localStorage.setItem("appVersion", currentVersion)

  // In a real app, this would check with the server
  // For now, we'll just use the version from env
  const newVersion = process.env.REACT_APP_VERSION || "1.0.0"

  if (currentVersion !== newVersion) {
    callback(currentVersion, newVersion)
    localStorage.setItem("appVersion", newVersion)
  }
}

// Function to disable aggressive caching
export const disableCaching = () => {
  // Only clear API caches, not static assets
  clearApiCaches()

  // Add cache control headers to fetch requests
  if (window.fetch) {
    const originalFetch = window.fetch
    window.fetch = function (url, options = {}) {
      // Only add cache busting for API requests
      if (typeof url === "string" && url.includes("/api/")) {
        // Add timestamp to API URLs to prevent caching
        const separator = url.includes("?") ? "&" : "?"
        url = `${url}${separator}_t=${Date.now()}`

        // Set cache control headers for API requests
        options.headers = {
          ...options.headers,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        }
      }

      return originalFetch.call(this, url, options)
    }
  }
}
