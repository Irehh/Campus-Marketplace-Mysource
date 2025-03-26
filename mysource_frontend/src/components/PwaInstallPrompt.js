"use client"

import { useState, useEffect } from "react"
import { FiDownload, FiX } from "react-icons/fi"

const PwaInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const hasUserDismissed = localStorage.getItem("pwaPromptDismissed")
    if (hasUserDismissed) return

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Handle install prompt for non-iOS devices
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowPrompt(true)
    }

    // For iOS, just show instructions
    if (isIOSDevice) {
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt && !isIOS) return

    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      setInstallPrompt(null)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem("pwaPromptDismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-2 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mx-auto max-w-md flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary rounded-full p-2 mr-3 text-white">
            <FiDownload size={16} />
          </div>
          <div>
            <p className="text-sm font-medium">Install Campus Marketplace</p>
            <p className="text-xs text-gray-500">
              {isIOS ? "Tap Share then 'Add to Home Screen'" : "Install for a better experience"}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {!isIOS && (
            <button onClick={handleInstall} className="mr-2 bg-primary text-white text-xs px-3 py-1 rounded-full">
              Install
            </button>
          )}
          <button onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
            <FiX size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallPrompt

