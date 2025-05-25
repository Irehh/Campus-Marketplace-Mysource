// const express = require('express');
// const {
//   register,
//   login,
//   getCurrentUser,
//   updateProfile,
//   changePassword,
//   googleLogin,
//   linkTelegramAccount,
//   getActiveUsersCount,
//   unlinkTelegramAccount,
//   requestPasswordReset,
//   resetPassword,
//   getNotificationSettings,
//   updateNotificationSettings,
//   verifyEmail,
//   resendVerification,
// } = require('../controllers/authController');
// const { authenticate } = require('../middleware/authMiddleware');
// const { authRateLimit, checkLoginAttempts, trackLoginAttempt } = require("../middleware/rateLimitMiddleware")
// const validateTurnstile = require("../middleware/turnstileMiddleware")

// const router = express.Router();

// // Public routes
// router.post('/register', register);
// router.post('/login', login);
// router.post('/google-login', googleLogin);
// router.get('/active-users', getActiveUsersCount);
// router.post('/request-password-reset', requestPasswordReset);
// router.post('/reset-password', resetPassword);
// router.get("/verify-email/:token", verifyEmail)
// router.post("/resend-verification", resendVerification)

// // Protected routes
// router.get('/me', authenticate, getCurrentUser);
// router.put('/profile', authenticate, updateProfile);
// router.put('/password', authenticate, changePassword);
// router.post('/link-telegram', authenticate, linkTelegramAccount);
// router.post('/unlink-telegram', authenticate, unlinkTelegramAccount);

// // Notification settings routes
// router.get('/notification-settings', authenticate, getNotificationSettings);
// router.put('/notification-settings', authenticate, updateNotificationSettings);

// module.exports = router;

const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { authenticate } = require("../middleware/authMiddleware")
const { authRateLimit, checkLoginAttempts, trackLoginAttempt } = require("../middleware/rateLimitMiddleware")
const validateTurnstile = require("../middleware/turnstileMiddleware")

// Public routes
router.post("/register", authRateLimit, validateTurnstile, authController.register)
router.post("/login", authRateLimit, checkLoginAttempts, trackLoginAttempt, authController.login)
router.post("/google-login", authRateLimit, authController.googleLogin)
router.post("/resend-verification", authRateLimit, authController.resendVerification)
router.get("/verify-email/:verifyToken", authController.verifyEmail)
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
