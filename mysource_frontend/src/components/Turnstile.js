// "use client"

// import { useEffect, useRef, useState } from "react"

// /**
//  * Cloudflare Turnstile component for bot prevention
//  *
//  * @param {Object} props
//  * @param {Function} props.onVerify - Callback function that receives the token when verification is complete
//  * @param {Function} props.onError - Callback function that receives error when verification fails
//  * @param {Function} props.onExpire - Callback function called when the token expires
//  * @param {string} props.siteKey - Cloudflare Turnstile site key (defaults to env variable)
//  * @param {string} props.action - Action name for analytics (optional)
//  * @param {string} props.theme - 'light' or 'dark' (optional)
//  * @param {string} props.size - 'normal' or 'compact' (optional)
//  * @param {string} props.className - Additional CSS classes (optional)
//  */
// const Turnstile = ({
//   onVerify,
//   onError,
//   onExpire,
//   siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY,
//   action,
//   theme = "light",
//   size = "normal",
//   className = "",
// }) => {
//   const containerRef = useRef(null)
//   const [widgetId, setWidgetId] = useState(null)
//   const [loaded, setLoaded] = useState(false)
//   const [scriptLoaded, setScriptLoaded] = useState(false)
//   const [isRendered, setIsRendered] = useState(false)
//   const resetAttemptRef = useRef(0)

//   // Load the Turnstile script
//   useEffect(() => {
//     // Check if script is already loaded
//     if (window.turnstile) {
//       setScriptLoaded(true)
//       setLoaded(true)
//       return
//     }

//     // Check if script is already being loaded
//     const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]')
//     if (existingScript) {
//       existingScript.addEventListener("load", () => {
//         setScriptLoaded(true)
//         setLoaded(true)
//       })
//       return
//     }

//     // Load the script
//     const script = document.createElement("script")
//     script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
//     script.async = true
//     script.defer = true

//     script.onload = () => {
//       setScriptLoaded(true)
//       setLoaded(true)
//     }
//     script.onerror = () => {
//       console.error("Failed to load Turnstile script")
//       if (onError) onError("Failed to load Turnstile")
//     }

//     document.head.appendChild(script)

//     return () => {
//       // Don't remove the script on unmount as other components might be using it
//     }
//   }, [])

//   // Safely reset the widget
//   const safeReset = () => {
//     if (!window.turnstile || !widgetId) return false

//     try {
//       window.turnstile.reset(widgetId)
//       return true
//     } catch (error) {
//       console.warn("Turnstile reset failed:", error.message)
//       return false
//     }
//   }

//   // Safely remove the widget
//   const safeRemove = () => {
//     if (!window.turnstile || !widgetId) return false

//     try {
//       window.turnstile.remove(widgetId)
//       setWidgetId(null)
//       setIsRendered(false)
//       return true
//     } catch (error) {
//       console.warn("Turnstile remove failed:", error.message)
//       return false
//     }
//   }

//   // Render the Turnstile widget when script is loaded
//   useEffect(() => {
//     // Wait for script to load and container to be available
//     if (!scriptLoaded || !containerRef.current || !window.turnstile) return

//     // If already rendered and we have a widget ID, don't re-render
//     if (isRendered && widgetId) return

//     // If we have a widget ID but it's not rendered properly, remove it first
//     if (widgetId && !isRendered) {
//       safeRemove()
//     }

//     // Delay rendering slightly to ensure DOM is stable
//     const renderTimeout = setTimeout(() => {
//       try {
//         // Render new widget
//         const id = window.turnstile.render(containerRef.current, {
//           sitekey: siteKey,
//           callback: (token) => {
//             setIsRendered(true)
//             if (onVerify) onVerify(token)
//           },
//           "error-callback": (error) => {
//             console.warn("Turnstile error:", error)
//             if (onError) onError("Verification failed: " + error)
//           },
//           "expired-callback": () => {
//             if (onExpire) onExpire()
//           },
//           theme: theme,
//           size: size,
//           action: action,
//         })

//         setWidgetId(id)
//         setIsRendered(true)
//         resetAttemptRef.current = 0
//       } catch (error) {
//         console.error("Error rendering Turnstile:", error)
//         if (onError) onError("Failed to render verification: " + error.message)
//       }
//     }, 100)

//     return () => {
//       clearTimeout(renderTimeout)
//     }
//   }, [scriptLoaded, siteKey, onVerify, onError, onExpire, theme, size, action, isRendered])

//   // Handle component unmount
//   useEffect(() => {
//     return () => {
//       if (widgetId) {
//         safeRemove()
//       }
//     }
//   }, [widgetId])

//   // Expose reset method to parent via ref
//   const reset = () => {
//     // If we've tried to reset too many times, remove and re-render
//     if (resetAttemptRef.current > 2) {
//       safeRemove()
//       // Widget will be re-rendered by the effect
//       resetAttemptRef.current = 0
//       return
//     }

//     // Try to reset
//     const resetSuccessful = safeReset()
//     if (!resetSuccessful) {
//       resetAttemptRef.current += 1
//       // If reset failed and we have a widget ID, try to remove and let the effect re-render
//       if (widgetId) {
//         safeRemove()
//       }
//     }
//   }

//   // Expose the reset method
//   if (typeof window !== "undefined") {
//     window.resetTurnstile = reset
//   }

//   return (
//     <div className={className}>
//       <div ref={containerRef} className="turnstile-container"></div>
//       {!loaded && <div className="text-center text-sm text-gray-500 mt-2">Loading security verification...</div>}
//     </div>
//   )
// }

// export default Turnstile


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
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const resetAttemptRef = useRef(0)
  const maxRetries = 3

  // Error code mappings
  const errorMessages = {
    300010: "Invalid site key or configuration",
    300020: "Invalid parameters provided",
    300030: "Network error or connectivity issue",
    300040: "Invalid domain configuration",
    300050: "Internal error occurred",
    300060: "Network timeout",
    300070: "Invalid response format",
    400020: "Invalid site key or domain not configured in Turnstile",
    400022: "Invalid or mismatched site key domain",
  }

  // Check if Turnstile should be disabled
  const isTurnstileDisabled = process.env.REACT_APP_DISABLE_TURNSTILE === "true"

  // If Turnstile is disabled, auto-verify
  useEffect(() => {
    if (isTurnstileDisabled) {
      console.log("Turnstile disabled, auto-verifying...")
      if (onVerify) {
        onVerify("disabled-token")
      }
      return
    }
  }, [isTurnstileDisabled, onVerify])

  // Load the Turnstile script
  useEffect(() => {
    if (isTurnstileDisabled) return

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
      existingScript.addEventListener("error", () => {
        console.error("Failed to load Turnstile script")
        setError("Failed to load security verification")
        setShowFallback(true)
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
      setError(null)
    }
    script.onerror = () => {
      console.error("Failed to load Turnstile script")
      setError("Failed to load security verification")
      setShowFallback(true)
      if (onError) onError("Failed to load Turnstile script")
    }

    document.head.appendChild(script)

    return () => {
      // Don't remove the script on unmount as other components might be using it
    }
  }, [isTurnstileDisabled])

  // Handle Turnstile errors with retry logic
  const handleTurnstileError = (errorCode) => {
    console.warn("Turnstile error:", errorCode)
    const errorMessage = errorMessages[errorCode] || `Unknown error: ${errorCode}`
    setError(errorMessage)

    // For network errors (300030), try to retry
    if (errorCode === "300030" && retryCount < maxRetries) {
      console.log(`Retrying Turnstile (attempt ${retryCount + 1}/${maxRetries})...`)
      setRetryCount((prev) => prev + 1)

      // Remove current widget and retry after delay
      setTimeout(() => {
        safeRemove()
        setIsRendered(false)
      }, 2000)

      return
    }

    // For configuration errors or max retries reached, show fallback
    if (errorCode === "300010" || errorCode === "300040" || retryCount >= maxRetries) {
      console.log("Showing fallback verification due to persistent errors")
      setShowFallback(true)
    }

    if (onError) onError(errorMessage)
  }

  // Safely reset the widget
  const safeReset = () => {
    if (!window.turnstile || !widgetId) return false

    try {
      window.turnstile.reset(widgetId)
      setError(null)
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
    if (isTurnstileDisabled || showFallback) return

    // Wait for script to load and container to be available
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return

    // If already rendered and we have a widget ID, don't re-render
    if (isRendered && widgetId) return

    // If we have a widget ID but it's not rendered properly, remove it first
    if (widgetId && !isRendered) {
      safeRemove()
    }

    // Validate site key
    if (!siteKey) {
      console.error("Turnstile site key not provided")
      setError("Security verification not configured")
      setShowFallback(true)
      return
    }

    // Delay rendering slightly to ensure DOM is stable
    const renderTimeout = setTimeout(() => {
      try {
        // Render new widget
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            console.log("Turnstile verification successful")
            setIsRendered(true)
            setError(null)
            setRetryCount(0)
            if (onVerify) onVerify(token)
          },
          "error-callback": (errorCode) => {
            handleTurnstileError(errorCode)
          },
          "expired-callback": () => {
            console.log("Turnstile token expired")
            if (onExpire) onExpire()
          },
          theme: theme,
          size: size,
          action: action,
        })

        setWidgetId(id)
        setIsRendered(true)
        resetAttemptRef.current = 0
        setError(null)
      } catch (error) {
        console.error("Error rendering Turnstile:", error)
        setError("Failed to render security verification")
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1)
        } else {
          setShowFallback(true)
        }
        if (onError) onError("Failed to render verification: " + error.message)
      }
    }, 100)

    return () => {
      clearTimeout(renderTimeout)
    }
  }, [
    scriptLoaded,
    siteKey,
    onVerify,
    onError,
    onExpire,
    theme,
    size,
    action,
    isRendered,
    retryCount,
    showFallback,
    isTurnstileDisabled,
  ])

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
    setError(null)
    setRetryCount(0)
    setShowFallback(false)

    // If we've tried to reset too many times, remove and re-render
    if (resetAttemptRef.current > 2) {
      safeRemove()
      resetAttemptRef.current = 0
      return
    }

    // Try to reset
    const resetSuccessful = safeReset()
    if (!resetSuccessful) {
      resetAttemptRef.current += 1
      if (widgetId) {
        safeRemove()
      }
    }
  }

  // Manual verification fallback
  const handleManualVerification = () => {
    console.log("Manual verification triggered")
    if (onVerify) {
      onVerify("manual-verification-token")
    }
    setShowFallback(false)
    setError(null)
  }

  // Expose the reset method
  if (typeof window !== "undefined") {
    window.resetTurnstile = reset
  }

  // If Turnstile is disabled, don't render anything
  if (isTurnstileDisabled) {
    return null
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="turnstile-container"></div>

      {!loaded && !showFallback && (
        <div className="text-center text-sm text-gray-500 mt-2">Loading security verification...</div>
      )}

      {error && !showFallback && retryCount < maxRetries && (
        <div className="text-center text-sm text-orange-600 mt-2">
          <p>{error}</p>
          <p>
            Retrying... ({retryCount + 1}/{maxRetries})
          </p>
        </div>
      )}

      {(showFallback || (error && retryCount >= maxRetries)) && (
        <div className="text-center mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">Security verification temporarily unavailable</p>
          <button
            type="button"
            onClick={handleManualVerification}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Continue with Manual Verification
          </button>
          <p className="text-xs text-gray-600 mt-1">Click to proceed (manual review may be required)</p>
        </div>
      )}
    </div>
  )
}

export default Turnstile
