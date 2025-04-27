const express = require('express');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  googleLogin,
  linkTelegramAccount,
  getActiveUsersCount,
  unlinkTelegramAccount,
  requestPasswordReset,
  resetPassword,
  getNotificationSettings,
  updateNotificationSettings,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.get('/active-users', getActiveUsersCount);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.post('/link-telegram', authenticate, linkTelegramAccount);
router.post('/unlink-telegram', authenticate, unlinkTelegramAccount);

// Notification settings routes
router.get('/notification-settings', authenticate, getNotificationSettings);
router.put('/notification-settings', authenticate, updateNotificationSettings);

module.exports = router;