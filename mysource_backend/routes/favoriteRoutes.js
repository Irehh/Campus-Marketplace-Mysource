const express = require('express');
const { getUserFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All favorite routes require authentication
router.use(authenticate);

// Get all favorites for the current user
router.get('/', getUserFavorites);

// Add a new favorite
router.post('/', addFavorite);

// Delete a favorite
router.delete('/:itemId', removeFavorite);

module.exports = router;