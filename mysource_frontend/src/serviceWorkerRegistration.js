/**
 * Service Worker Registration Module
 * Handles registration, updates, and error handling for the service worker
 */

import PWA_CONFIG from './utils/pwaConfig'

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workers are not supported in this browser')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(
      PWA_CONFIG.serviceWorker.path,
      {
        scope: PWA_CONFIG.serviceWorker.scope,
      }
    )

    if (PWA_CONFIG.isDevelopment) {
      console.log('[PWA] Service Worker registered successfully:', registration)
    }

    // Listen for updates
    listenForUpdates(registration)

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error)
    notifySWError('Registration failed: ' + error.message)
    return null
  }
}

/**
 * Listen for service worker updates
 * @param {ServiceWorkerRegistration} registration
 */
const listenForUpdates = (registration) => {
  // Listen for updatefound event
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing

    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker available, old one still in control
        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] New Service Worker installed, waiting for activation')
        }

        // SW will send update notification message
      }
    })
  })

  // Check for updates periodically
  setInterval(() => {
    registration.update()
  }, PWA_CONFIG.update.checkInterval)
}

/**
 * Unregister service worker
 * Only use this in development or special cases
 * @returns {Promise<boolean>}
 */
export const unregister = async () => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    let unregistered = false

    for (const registration of registrations) {
      const success = await registration.unregister()
      if (success) {
        unregistered = true
        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] Service Worker unregistered')
        }
      }
    }

    // Clear all caches
    if (unregistered) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      console.log('[PWA] All caches cleared')
    }

    return unregistered
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error)
    return false
  }
}

/**
 * Force service worker update
 * @returns {Promise<void>}
 */
export const forceUpdate = async () => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      await registration.update()
    }

    if (PWA_CONFIG.isDevelopment) {
      console.log('[PWA] Service Worker update check initiated')
    }
  } catch (error) {
    console.error('[PWA] Force update failed:', error)
  }
}

/**
 * Skip waiting and activate new service worker immediately
 * This causes a reload
 * @returns {Promise<void>}
 */
export const skipWaitingAndReload = async () => {
  if (!('serviceWorker' in navigator)) {
    window.location.reload()
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      if (registration.waiting) {
        // Tell the installing worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        // Reload when the new worker takes over
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    }
  } catch (error) {
    console.error('[PWA] Skip waiting failed:', error)
    window.location.reload()
  }
}

/**
 * Get current service worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    return registrations.length > 0 ? registrations[0] : null
  } catch (error) {
    console.error('[PWA] Failed to get SW registration:', error)
    return null
  }
}

/**
 * Notify about service worker error
 * @param {string} message
 */
const notifySWError = (message) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'SW_ERROR',
            message,
          })
        }
      })
    })
  }
}

/**
 * Send message to service worker
 * @param {Object} message - Message to send
 * @returns {Promise<void>}
 */
export const postMessageToSW = async (message) => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      if (registration.active) {
        registration.active.postMessage(message)
      }
    }
  } catch (error) {
    console.error('[PWA] Failed to post message to SW:', error)
  }
}

/**
 * Listen for messages from service worker
 * @param {Function} callback - Callback function
 * @returns {Function} - Cleanup function
 */
export const listenToSWMessages = (callback) => {
  if (!('serviceWorker' in navigator)) {
    return () => {}
  }

  navigator.serviceWorker.addEventListener('message', callback)

  return () => {
    navigator.serviceWorker.removeEventListener('message', callback)
  }
}

export default registerServiceWorker
