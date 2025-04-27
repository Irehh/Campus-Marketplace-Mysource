const express = require('express');
const { search } = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, search);

module.exports = router;