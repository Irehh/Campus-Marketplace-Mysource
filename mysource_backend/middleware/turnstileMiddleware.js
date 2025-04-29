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
      },
    )

    const { success, "error-codes": errorCodes } = response.data

    if (!success) {
      console.warn("Turnstile validation failed:", errorCodes)
      return res.status(400).json({
        message: "Security verification failed",
        turnstileError: true,
        errors: {
          turnstile: "Security verification failed. Please try again.",
        },
      })
    }

    // Validation successful, proceed
    next()
  } catch (error) {
    console.error("Error validating Turnstile token:", error)
    return res.status(500).json({
      message: "Error validating security token",
      turnstileError: true,
    })
  }
}

module.exports = validateTurnstile
