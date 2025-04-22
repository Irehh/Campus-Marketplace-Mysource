// mysource_backend/src/routes/favoriteRoutes.js

import express from 'express'
import * as favoriteController from '../controllers/favoriteController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// All favorite routes require authentication
router.use(authenticate)

// Get all favorites for the current user
router.get('/', favoriteController.getUserFavorites)

// Add a new favorite
router.post('/', favoriteController.addFavorite)

// Delete a favorite
router.delete('/:itemId', favoriteController.removeFavorite)

export default router