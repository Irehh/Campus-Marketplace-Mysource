// const axios = require("axios")

// /**
//  * Middleware to validate Cloudflare Turnstile tokens
//  *
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @param {Function} next - Express next function
//  */
// const validateTurnstile = async (req, res, next) => {
//   // Skip validation if Turnstile is disabled in environment
//   if (process.env.DISABLE_TURNSTILE === "true") {
//     return next()
//   }

//   const { turnstileToken } = req.body

//   // Check if token exists
//   if (!turnstileToken) {
//     return res.status(400).json({
//       message: "Security verification failed",
//       turnstileError: true,
//       errors: {
//         turnstile: "Security verification is required",
//       },
//     })
//   }

//   try {
//     // Validate token with Cloudflare
//     const response = await axios.post(
//       "https://challenges.cloudflare.com/turnstile/v0/siteverify",
//       new URLSearchParams({
//         secret: process.env.TURNSTILE_SECRET_KEY,
//         response: turnstileToken,
//         remoteip: req.ip || req.connection.remoteAddress,
//       }),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       },
//     )

//     const { success, "error-codes": errorCodes } = response.data

//     if (!success) {
//       console.warn("Turnstile validation failed:", errorCodes)
//       return res.status(400).json({
//         message: "Security verification failed",
//         turnstileError: true,
//         errors: {
//           turnstile: "Security verification failed. Please try again.",
//         },
//       })
//     }

//     // Validation successful, proceed
//     next()
//   } catch (error) {
//     console.error("Error validating Turnstile token:", error)
//     return res.status(500).json({
//       message: "Error validating security token",
//       turnstileError: true,
//     })
//   }
// }

// module.exports = validateTurnstile


const axios = require("axios")

/**
 * Middleware to validate Cloudflare Turnstile tokens
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateTurnstile = async (req, res, next) => {
  // Skip validation if Turnstile is disabled in environment
  if (process.env.DISABLE_TURNSTILE === "true") {
    console.log("Turnstile validation disabled by environment variable")
    return next()
  }

  const { turnstileToken } = req.body

  // Check if token exists
  if (!turnstileToken) {
    return res.status(400).json({
      message: "Security verification failed",
      turnstileError: true,
      errors: {
        turnstile: "Security verification is required",
      },
    })
  }

  // Handle special fallback tokens
  if (turnstileToken === "disabled-token" || turnstileToken === "manual-verification-token") {
    console.log(`Turnstile fallback token used: ${turnstileToken}`)

    // In production, you might want to log this for manual review
    if (process.env.NODE_ENV === "production") {
      console.warn(`Manual verification token used for IP: ${req.ip}, User-Agent: ${req.get("User-Agent")}`)
      // You could also store this in a database for manual review
    }

    return next()
  }

  try {
    // Validate token with Cloudflare
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: req.ip || req.connection.remoteAddress,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      },
    )

    const { success, "error-codes": errorCodes } = response.data

    if (!success) {
      console.warn("Turnstile validation failed:", errorCodes)

      // Handle specific error codes
      const errorCode = errorCodes?.[0]
      let errorMessage = "Security verification failed. Please try again."

      switch (errorCode) {
        case "timeout-or-duplicate":
          errorMessage = "Verification expired. Please try again."
          break
        case "invalid-input-secret":
          errorMessage = "Security configuration error."
          break
        case "invalid-input-response":
          errorMessage = "Invalid verification response."
          break
        case "bad-request":
          errorMessage = "Invalid verification request."
          break
        default:
          errorMessage = "Security verification failed. Please try again."
      }

      return res.status(400).json({
        message: errorMessage,
        turnstileError: true,
        errorCode: errorCode,
        errors: {
          turnstile: errorMessage,
        },
      })
    }

    // Validation successful, proceed
    console.log("Turnstile validation successful")
    next()
  } catch (error) {
    console.error("Error validating Turnstile token:", error.message)

    // If it's a network error, allow fallback in development
    if (process.env.NODE_ENV === "development" && error.code === "ECONNREFUSED") {
      console.warn("Turnstile validation failed due to network error in development, allowing fallback")
      return next()
    }

    return res.status(500).json({
      message: "Error validating security token",
      turnstileError: true,
      errors: {
        turnstile: "Security verification service temporarily unavailable",
      },
    })
  }
}

module.exports = validateTurnstile
