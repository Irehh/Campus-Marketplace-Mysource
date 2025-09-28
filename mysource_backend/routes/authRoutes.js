
const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { authenticate } = require("../middleware/authMiddleware")
const { authRateLimit, checkLoginAttempts, trackLoginAttempt } = require("../middleware/rateLimitMiddleware")
const validateTurnstile = require("../middleware/turnstileMiddleware")

// Public routes
// router.post("/register", authRateLimit, validateTurnstile, authController.register)
router.post("/register", authRateLimit, authController.register)
router.post("/login", authRateLimit, checkLoginAttempts, trackLoginAttempt, authController.login)
router.post("/google-login", authRateLimit, authController.googleLogin)
router.post("/resend-verification", authRateLimit, authController.resendVerification)
router.get("/verify-email/:token", authController.verifyEmail)
router.post("/forgot-password", authRateLimit, authController.requestPasswordReset)
router.post("/reset-password", authRateLimit, authController.resetPassword)
router.get("/active-users", authController.getActiveUsersCount)

// Protected routes
router.get("/me", authenticate, authController.getCurrentUser)
router.put("/profile", authenticate, authController.updateProfile)
router.post("/change-password", authenticate, validateTurnstile, authController.changePassword)
router.post("/link-telegram", authenticate, authController.linkTelegramAccount)
router.post("/unlink-telegram", authenticate, authController.unlinkTelegramAccount)
router.get("/notification-settings", authenticate, authController.getNotificationSettings)
router.put("/notification-settings", authenticate, authController.updateNotificationSettings)

module.exports = router
