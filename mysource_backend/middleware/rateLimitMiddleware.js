const { RateLimiterMemory } = require("rate-limiter-flexible")

// General rate limiter for all API requests
const apiLimiter = new RateLimiterMemory({
  points: 60, // Number of points
  duration: 60, // Per 60 seconds
})

// Stricter rate limiter for authentication endpoints
const authLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60, // Per 60 seconds
  blockDuration: 300, // Block for 5 minutes after exceeding limit
})

// IP-based login attempt tracker for brute force protection
const loginAttemptLimiter = new RateLimiterMemory({
  points: 5, // 5 failed attempts
  duration: 60 * 15, // Per 15 minutes
  blockDuration: 60 * 30, // Block for 30 minutes
})

// Email-based login attempt tracker to prevent targeting specific accounts
const emailLoginAttemptLimiter = new RateLimiterMemory({
  points: 5, // 5 failed attempts
  duration: 60 * 60, // Per 60 minutes
  blockDuration: 60 * 60, // Block for 60 minutes
})

// General API rate limiting middleware
exports.apiRateLimit = async (req, res, next) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress
    await apiLimiter.consume(clientIp)
    next()
  } catch (error) {
    res.status(429).json({
      message: "Too many requests, please try again later.",
      retryAfter: error.msBeforeNext / 1000 || 60,
    })
  }
}

// Authentication endpoints rate limiting middleware
exports.authRateLimit = async (req, res, next) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress
    await authLimiter.consume(clientIp)
    next()
  } catch (error) {
    res.status(429).json({
      message: "Too many authentication attempts, please try again later.",
      retryAfter: error.msBeforeNext / 1000 || 300,
    })
  }
}

// Track failed login attempts by IP
exports.trackLoginAttempt = async (req, res, next) => {
  req.loginLimiter = loginAttemptLimiter
  req.emailLoginLimiter = emailLoginAttemptLimiter
  next()
}

// Middleware to check if IP is blocked due to too many failed login attempts
exports.checkLoginAttempts = async (req, res, next) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress

    // Check IP-based limiter
    try {
      const ipRateLimitRes = await loginAttemptLimiter.get(clientIp)

      if (ipRateLimitRes !== null && ipRateLimitRes.consumedPoints > ipRateLimitRes.points) {
        const retrySecs = Math.round(ipRateLimitRes.msBeforeNext / 1000) || 1
        res.set("Retry-After", String(retrySecs))
        return res.status(429).json({
          message: "Too many failed login attempts, please try again later.",
          retryAfter: retrySecs,
        })
      }
    } catch (error) {
      // Continue even if there's an error checking the rate limit
    }

    // If email is provided, check email-based limiter
    if (req.body.email) {
      try {
        const emailRateLimitRes = await emailLoginAttemptLimiter.get(req.body.email)

        if (emailRateLimitRes !== null && emailRateLimitRes.consumedPoints > emailRateLimitRes.points) {
          // Don't reveal that this specific email is being rate limited
          // Just use a generic message
          return res.status(429).json({
            message: "Too many login attempts, please try again later.",
          })
        }
      } catch (error) {
        // Continue even if there's an error checking the rate limit
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Record a failed login attempt
exports.recordFailedLoginAttempt = async (req) => {
  const clientIp = req.ip || req.connection.remoteAddress
  const email = req.body.email

  try {
    await loginAttemptLimiter.consume(clientIp)

    if (email) {
      await emailLoginAttemptLimiter.consume(email)
    }
  } catch (error) {
    // Just log the error, don't stop the response
    console.error("Error recording failed login attempt:", error)
  }
}

// Reset login attempt counter on successful login
exports.resetLoginAttempts = async (req) => {
  const clientIp = req.ip || req.connection.remoteAddress
  const email = req.body.email

  try {
    if (clientIp) {
      await loginAttemptLimiter.delete(clientIp)
    }

    if (email) {
      await emailLoginAttemptLimiter.delete(email)
    }
  } catch (error) {
    // Just log the error, don't stop the response
    console.error("Error resetting login attempts:", error)
  }
}
