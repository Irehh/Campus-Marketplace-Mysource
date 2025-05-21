// Cache busting utility to force browser to load latest assets
const VERSION = process.env.REACT_APP_VERSION || "1.6.0"

// Generate a timestamp for the current session
const SESSION_ID = new Date().getTime()

/**
 * Adds a cache-busting query parameter to a URL
 * @param {string} url - The URL to add the parameter to
 * @param {boolean} useTimestamp - Whether to use timestamp instead of version
 * @returns {string} The URL with cache-busting parameter
 */
export function addCacheBuster(url, useTimestamp = false) {
  if (!url) return url

  // Don't add cache busters to external URLs
  if (url.startsWith("http") && !url.includes(window.location.host)) {
    return url
  }

  const separator = url.includes("?") ? "&" : "?"
  const param = useTimestamp ? `_t=${SESSION_ID}` : `_v=${VERSION}`

  return `${url}${separator}${param}`
}

/**
 * Force clear all caches and reload
 */
export async function clearCachesAndReload() {
  if ("caches" in window) {
    try {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((key) => caches.delete(key)))
      console.log("All caches cleared")
    } catch (err) {
      console.error("Failed to clear caches:", err)
    }
  }

  // If service worker is registered, unregister it
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((reg) => reg.unregister()))
      console.log("Service workers unregistered")
    } catch (err) {
      console.error("Failed to unregister service workers:", err)
    }
  }

  // Clear local storage
  localStorage.clear()

  // Force reload the page
  window.location.reload(true)
}

/**
 * Check if a new version is available
 * @param {Function} onNewVersion - Callback when new version is detected
 */
export function checkForNewVersion(onNewVersion) {
  // Store the current version in localStorage
  const storedVersion = localStorage.getItem("app_version")

  if (!storedVersion) {
    // First time, just store the current version
    localStorage.setItem("app_version", VERSION)
  } else if (storedVersion !== VERSION) {
    // New version detected
    localStorage.setItem("app_version", VERSION)

    if (onNewVersion) {
      onNewVersion(storedVersion, VERSION)
    }
  }
}
