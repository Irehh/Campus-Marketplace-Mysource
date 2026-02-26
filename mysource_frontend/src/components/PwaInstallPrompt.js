/**
 * PWA Install Prompt Component
 * Intelligently prompts users to install the app
 * Respects user preferences and platform differences
 */

import { useState, useEffect } from "react"
import { FiDownload, FiX } from "react-icons/fi"
import PWA_CONFIG from "../utils/pwaConfig"

/**
 * PWA Install Prompt Component
 * Shows install prompt after delay, respects dismissals
 */
const PwaInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true)
      return
    }

    // Check if already dismissed recently
    const hasUserDismissed = localStorage.getItem(PWA_CONFIG.installPrompt.storageKey)
    if (hasUserDismissed) {
      const dismissalDate = new Date(hasUserDismissed)
      const now = new Date()
      const daysGap = (now.getTime() - dismissalDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysGap < PWA_CONFIG.installPrompt.dismissalDuration) {
        return
      } else {
        // Clear old dismissal, allow prompt again
        localStorage.removeItem(PWA_CONFIG.installPrompt.storageKey)
      }
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Handle install prompt for non-iOS devices
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)

      // Show prompt after delay
      setTimeout(() => {
        setShowPrompt(true)

        // Track in analytics
        if (PWA_CONFIG.analytics.trackInstallation && window.gtag) {
          window.gtag("event", "pwa_install_prompt_shown", {
            timestamp: new Date().toISOString(),
          })
        }
      }, PWA_CONFIG.installPrompt.delayBeforeShow)
    }

    // For iOS, show instructions after delay
    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true)

        // Track in analytics
        if (PWA_CONFIG.analytics.trackInstallation && window.gtag) {
          window.gtag("event", "pwa_install_prompt_shown_ios", {
            timestamp: new Date().toISOString(),
          })
        }
      }, PWA_CONFIG.installPrompt.delayBeforeShow)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  /**
   * Handle install button click
   */
  const handleInstall = async () => {
    if (!installPrompt && !isIOS) return

    setIsInstalling(true)

    try {
      if (installPrompt) {
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice

        // Track installation outcome
        if (PWA_CONFIG.analytics.trackInstallation && window.gtag) {
          window.gtag("event", "pwa_install_outcome", {
            outcome,
            timestamp: new Date().toISOString(),
          })
        }

        if (outcome === "accepted") {
          setShowPrompt(false)
          setInstallPrompt(null)
        }
      }
    } catch (error) {
      console.error("[PWA] Installation error:", error)
    } finally {
      setIsInstalling(false)
    }
  }

  /**
   * Dismiss the install prompt
   */
  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem(
      PWA_CONFIG.installPrompt.storageKey,
      new Date().toISOString()
    )

    // Track dismissal
    if (PWA_CONFIG.analytics.trackInstallation && window.gtag) {
      window.gtag("event", "pwa_install_dismissed", {
        timestamp: new Date().toISOString(),
      })
    }
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 z-40 md:bottom-4 md:right-4 md:left-auto md:max-w-sm">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 mx-auto md:mx-0 hover:shadow-3xl transition-shadow">
        <div className="flex items-start justify-between gap-4">
          {/* Icon and Content */}
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-indigo-100 rounded-full p-2 text-indigo-600 flex-shrink-0 mt-1">
              <FiDownload size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">
                Install Campus Marketplace
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isIOS
                  ? "Tap Share then 'Add to Home Screen' for quick access"
                  : "Get instant access - no app store needed"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={dismissPrompt}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
            aria-label="Dismiss install prompt"
            title="Dismiss"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={dismissPrompt}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isInstalling}
          >
            Maybe Later
          </button>
          {!isIOS && (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-75"
            >
              {isInstalling ? "Installing..." : "Install"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PwaInstallPrompt
