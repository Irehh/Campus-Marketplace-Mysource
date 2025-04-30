"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Cloudflare Turnstile component for bot prevention
 *
 * @param {Object} props
 * @param {Function} props.onVerify - Callback function that receives the token when verification is complete
 * @param {Function} props.onError - Callback function that receives error when verification fails
 * @param {Function} props.onExpire - Callback function called when the token expires
 * @param {string} props.siteKey - Cloudflare Turnstile site key (defaults to env variable)
 * @param {string} props.action - Action name for analytics (optional)
 * @param {string} props.theme - 'light' or 'dark' (optional)
 * @param {string} props.size - 'normal' or 'compact' (optional)
 * @param {string} props.className - Additional CSS classes (optional)
 */
const Turnstile = ({
  onVerify,
  onError,
  onExpire,
  siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY,
  action,
  theme = "light",
  size = "normal",
  className = "",
}) => {
  const containerRef = useRef(null)
  const [widgetId, setWidgetId] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const resetAttemptRef = useRef(0)

  // Load the Turnstile script
  useEffect(() => {
    // Check if script is already loaded
    if (window.turnstile) {
      setScriptLoaded(true)
      setLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setScriptLoaded(true)
        setLoaded(true)
      })
      return
    }

    // Load the script
    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true

    script.onload = () => {
      setScriptLoaded(true)
      setLoaded(true)
    }
    script.onerror = () => {
      console.error("Failed to load Turnstile script")
      if (onError) onError("Failed to load Turnstile")
    }

    document.head.appendChild(script)

    return () => {
      // Don't remove the script on unmount as other components might be using it
    }
  }, [])

  // Safely reset the widget
  const safeReset = () => {
    if (!window.turnstile || !widgetId) return false

    try {
      window.turnstile.reset(widgetId)
      return true
    } catch (error) {
      console.warn("Turnstile reset failed:", error.message)
      return false
    }
  }

  // Safely remove the widget
  const safeRemove = () => {
    if (!window.turnstile || !widgetId) return false

    try {
      window.turnstile.remove(widgetId)
      setWidgetId(null)
      setIsRendered(false)
      return true
    } catch (error) {
      console.warn("Turnstile remove failed:", error.message)
      return false
    }
  }

  // Render the Turnstile widget when script is loaded
  useEffect(() => {
    // Wait for script to load and container to be available
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return

    // If already rendered and we have a widget ID, don't re-render
    if (isRendered && widgetId) return

    // If we have a widget ID but it's not rendered properly, remove it first
    if (widgetId && !isRendered) {
      safeRemove()
    }

    // Delay rendering slightly to ensure DOM is stable
    const renderTimeout = setTimeout(() => {
      try {
        // Render new widget
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setIsRendered(true)
            if (onVerify) onVerify(token)
          },
          "error-callback": (error) => {
            console.warn("Turnstile error:", error)
            if (onError) onError("Verification failed: " + error)
          },
          "expired-callback": () => {
            if (onExpire) onExpire()
          },
          theme: theme,
          size: size,
          action: action,
        })

        setWidgetId(id)
        setIsRendered(true)
        resetAttemptRef.current = 0
      } catch (error) {
        console.error("Error rendering Turnstile:", error)
        if (onError) onError("Failed to render verification: " + error.message)
      }
    }, 100)

    return () => {
      clearTimeout(renderTimeout)
    }
  }, [scriptLoaded, siteKey, onVerify, onError, onExpire, theme, size, action, isRendered])

  // Handle component unmount
  useEffect(() => {
    return () => {
      if (widgetId) {
        safeRemove()
      }
    }
  }, [widgetId])

  // Expose reset method to parent via ref
  const reset = () => {
    // If we've tried to reset too many times, remove and re-render
    if (resetAttemptRef.current > 2) {
      safeRemove()
      // Widget will be re-rendered by the effect
      resetAttemptRef.current = 0
      return
    }

    // Try to reset
    const resetSuccessful = safeReset()
    if (!resetSuccessful) {
      resetAttemptRef.current += 1
      // If reset failed and we have a widget ID, try to remove and let the effect re-render
      if (widgetId) {
        safeRemove()
      }
    }
  }

  // Expose the reset method
  if (typeof window !== "undefined") {
    window.resetTurnstile = reset
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="turnstile-container"></div>
      {!loaded && <div className="text-center text-sm text-gray-500 mt-2">Loading security verification...</div>}
    </div>
  )
}

export default Turnstile
