const express = require('express');
const { handleWebhook, verifyTelegramCode } = require('../controllers/telegramController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Webhook endpoint for Telegram
router.post('/webhook', handleWebhook);

// Verify and link Telegram account
router.post('/verify-code', authenticate, verifyTelegramCode);

module.exports = router;