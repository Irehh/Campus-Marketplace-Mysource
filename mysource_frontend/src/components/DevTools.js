"use client"

import { useState } from "react"
import { clearApiCachesAndReload } from "../utils/cacheBuster"

/**
 * Development tools component with buttons to help during development
 * Only shown in development mode
 */
export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false)
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev) return null

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear all caches and reload?")) {
      clearApiCachesAndReload()
    }
  }

  const handleReloadSW = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.update()
        }
        alert("Service Worker updated! Reload the page to see changes.")
      } catch (err) {
        console.error("Failed to update service worker:", err)
        alert("Failed to update Service Worker. See console for details.")
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Dev Tools</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
              ×
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              className="block w-full bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
            >
              Clear API Caches
            </button>
            <button
              onClick={handleReloadSW}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
            >
              Update Service Worker
            </button>
            <div className="text-xs mt-3 text-gray-300">
              Environment: {process.env.NODE_ENV}
              <br />
              Version: {process.env.REACT_APP_VERSION || "1.0.0"}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        >
          🛠️
        </button>
      )}
    </div>
  )
}
