/**
 * PWA Context
 * Global state management for PWA-related features
 */

import React, { createContext, useState, useCallback, useEffect } from 'react'
import PWA_CONFIG from '../utils/pwaConfig'

/**
 * PWA Context
 */
export const PWAContext = createContext(null)

/**
 * PWA Provider Component
 */
export const PWAProvider = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [installPromptShown, setInstallPromptShown] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false)
  const [newVersion, setNewVersion] = useState(null)
  const [swRegistered, setSwRegistered] = useState(false)
  const [swError, setSwError] = useState(null)

  /**
   * Check if app is installed
   */
  const checkInstallation = useCallback(() => {
    // Check display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return true
    }

    // Check for iOS installation
    if (window.navigator.standalone === true) {
      setIsInstalled(true)
      return true
    }

    return false
  }, [])

  /**
   * Reset install prompt shown flag
   */
  const resetInstallPrompt = useCallback(() => {
    const lastDismissal = localStorage.getItem('pwaPromptDismissed')
    if (!lastDismissal) {
      setInstallPromptShown(false)
      return
    }

    const dismissalDate = new Date(lastDismissal)
    const now = new Date()
    const daysGap =
      (now.getTime() - dismissalDate.getTime()) /
      (1000 * 60 * 60 * 24)

    if (daysGap >= PWA_CONFIG.installPrompt.dismissalDuration) {
      localStorage.removeItem('pwaPromptDismissed')
      setInstallPromptShown(false)
    }
  }, [])

  /**
   * Register service worker
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwError('Service Workers not supported in this browser')
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          PWA_CONFIG.serviceWorker.path,
          {
            scope: PWA_CONFIG.serviceWorker.scope,
          }
        )

        setSwRegistered(true)

        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] Service Worker registered:', registration)
        }

        // Listen for updates
        const handleControllerChange = () => {
          if (PWA_CONFIG.isDevelopment) {
            console.log('[PWA] Service Worker controller changed')
          }
        }

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          handleControllerChange
        )

        return () => {
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            handleControllerChange
          )
        }
      } catch (error) {
        setSwError(error.message)
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()

    // Check installation status
    checkInstallation()
    resetInstallPrompt()
  }, [checkInstallation, resetInstallPrompt])

  /**
   * Handle install prompt event
   */
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPromptShown(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  /**
   * Handle app installed event
   */
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPromptShown(false)

      if (PWA_CONFIG.isDevelopment) {
        console.log('[PWA] App installed')
      }

      // Track installation
      if (PWA_CONFIG.analytics.trackInstallation && window.gtag) {
        window.gtag('event', 'pwa_installed', {
          timestamp: new Date().toISOString(),
        })
      }
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Listen for SW messages about updates
   */
  useEffect(() => {
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        const version = event.data.version
        setNewVersion(version)
        setUpdateAvailable(true)

        // Check if mandatory
        const criticalVersions = PWA_CONFIG.update.criticalVersions
        setIsMandatoryUpdate(
          criticalVersions.includes(version) ||
            PWA_CONFIG.features.forceUpdateOnCritical
        )

        if (PWA_CONFIG.isDevelopment) {
          console.log('[PWA] Update available:', version)
        }
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [])

  const value = {
    // Installation status
    isInstalled,
    installPromptShown,
    setInstallPromptShown,
    checkInstallation,
    resetInstallPrompt,

    // Update status
    updateAvailable,
    isMandatoryUpdate,
    newVersion,

    // Service Worker status
    swRegistered,
    swError,
  }

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>
}

/**
 * Hook to use PWA context
 */
export const usePWA = () => {
  const context = React.useContext(PWAContext)
  if (context === null) {
    throw new Error('usePWA must be used within PWAProvider')
  }
  return context
}

export default PWAContext
