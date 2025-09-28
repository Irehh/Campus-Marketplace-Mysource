const express = require('express');
const { handleWebhook, createSubscription } = require('../controllers/whatsappController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Webhook endpoint for WhatsApp
router.post('/webhook', handleWebhook);

// Create or renew subscription
router.post('/subscribe', authenticate, createSubscription);

module.exports = router;