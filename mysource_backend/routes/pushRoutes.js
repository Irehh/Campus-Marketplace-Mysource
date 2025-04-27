const express = require('express');
const { getVapidPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get VAPID public key
router.get('/vapid-public-key', getVapidPublicKey);

// Subscribe to push notifications
router.post('/subscribe', authenticate, subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', unsubscribe);

module.exports = router;