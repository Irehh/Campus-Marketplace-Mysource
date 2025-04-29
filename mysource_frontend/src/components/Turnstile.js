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

  // Load the Turnstile script
  useEffect(() => {
    if (window.turnstile) {
      setLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true

    script.onload = () => setLoaded(true)
    script.onerror = () => {
      console.error("Failed to load Turnstile script")
      if (onError) onError("Failed to load Turnstile")
    }

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Render the Turnstile widget when script is loaded
  useEffect(() => {
    if (!loaded || !containerRef.current || !window.turnstile) return

    // Reset any existing widget
    if (widgetId) {
      window.turnstile.reset(widgetId)
    }

    // Render new widget
    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        if (onVerify) onVerify(token)
      },
      "error-callback": () => {
        if (onError) onError("Verification failed")
      },
      "expired-callback": () => {
        if (onExpire) onExpire()
      },
      theme: theme,
      size: size,
      action: action,
    })

    setWidgetId(id)

    return () => {
      if (id) window.turnstile.remove(id)
    }
  }, [loaded, siteKey, onVerify, onError, onExpire, theme, size, action])

  return <div ref={containerRef} className={className}></div>
}

export default Turnstile
