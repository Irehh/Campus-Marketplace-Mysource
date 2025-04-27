const express = require('express');
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Get comments for a product or business
router.get('/:itemType/:itemId', optionalAuth, getComments);

// Protected routes
router.post('/', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

module.exports = router;