"use client"

import { useState, useEffect } from "react"
import { FiWifiOff } from "react-icons/fi"

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      setIsOffline(false)
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center text-xs animate-pulse">
      <FiWifiOff className="mr-1" />
      <span>You're offline</span>
    </div>
  )
}

export default OfflineIndicator

