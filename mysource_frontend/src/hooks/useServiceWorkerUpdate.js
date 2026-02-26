/**
 * Custom Hook for Service Worker Update Detection
 * Listens for SW updates and provides UI feedback
 */

import { useEffect, useState, useCallback } from 'react'
import PWA_CONFIG, { isMandatoryUpdate } from '../utils/pwaConfig'

/**
 * @typedef {Object} UpdateState
 * @property {boolean} updateAvailable - Whether update is available
 * @property {boolean} isMandatory - Whether update is mandatory
 * @property {string|null} newVersion - New version available
 * @property {string|null} error - Error message if any
 * @property {Function} updateNow - Function to trigger update
 * @property {Function} dismiss - Function to dismiss non-mandatory updates
 */

/**
 * Hook to handle service worker updates
 * @returns {UpdateState}
 */
export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isMandatory, setIsMandatory] = useState(false)
  const [newVersion, setNewVersion] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Trigger immediate update
   */
  const updateNow = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update()
        })
      })

      // Clear all caches to ensure fresh load
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName)
        })
      })

      // Reload after a slight delay
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }, [])

  /**
   * Dismiss non-mandatory update prompt
   */
  const dismiss = useCallback(() => {
    setUpdateAvailable(false)
    localStorage.setItem('pwaUpdateDismissed', new Date().toISOString())
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    /**
     * Handle SW messages for updates
     */
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        const version = event.data.version

        // Check if it's a mandatory update
        const mandatory = isMandatoryUpdate(
          PWA_CONFIG.update.minimumRequiredVersion,
          version
        )

        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] Update Available:', {
            version,
            mandatory,
            buildHash: event.data.buildHash,
          })
        }

        setNewVersion(version)
        setUpdateAvailable(true)
        setIsMandatory(mandatory)

        // Track in analytics if enabled
        if (PWA_CONFIG.analytics.trackUpdates) {
          trackUpdateEvent(version, mandatory)
        }

        // Force update if mandatory
        if (mandatory) {
          // Show update UI and auto-update after timeout
          setTimeout(() => {
            updateNow()
          }, 3000)
        }
      }

      if (event.data && event.data.type === 'SW_ERROR') {
        setError(event.data.message)
        console.error('[PWA] Service Worker Error:', event.data.message)
      }

      if (event.data && event.data.type === 'SW_ACTIVATED') {
        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] Service Worker Activated')
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSWMessage)

    /**
     * Check for updates periodically
     */
    const updateCheckInterval = setInterval(() => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update()
        })
      })
    }, PWA_CONFIG.update.checkInterval)

    // Check immediately on mount
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.update()
      })
    })

    return () => {
      clearInterval(updateCheckInterval)
      navigator.serviceWorker.removeEventListener('message', handleSWMessage)
    }
  }, [updateNow])

  return {
    updateAvailable,
    isMandatory,
    newVersion,
    error,
    updateNow,
    dismiss,
  }
}

/**
 * Track update event in analytics
 * @param {string} version - New version
 * @param {boolean} isMandatory - Is mandatory update
 */
function trackUpdateEvent(version, isMandatory) {
  try {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'pwa_update_available', {
        version,
        is_mandatory: isMandatory,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('[PWA] Analytics tracking failed:', error)
  }
}

export default useServiceWorkerUpdate
