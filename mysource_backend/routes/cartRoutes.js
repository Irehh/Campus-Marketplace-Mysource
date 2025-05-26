const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/authMiddleware")
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require("../controllers/cartController")

// All cart routes require authentication
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Get user's cart
router.get("/", authenticate, getCart)

// Add item to cart
router.post("/add", authenticate, addToCart)

// Update cart item quantity
router.put("/items/:cartItemId", authenticate, updateCartItem)

// Remove item from cart
router.delete("/items/:cartItemId", authenticate, removeCartItem)

// Clear entire cart
router.delete("/clear", authenticate, clearCart)

module.exports = router
