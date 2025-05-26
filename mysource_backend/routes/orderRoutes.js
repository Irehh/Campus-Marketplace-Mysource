const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/authMiddleware")
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderDetails,
  updateDeliveryStatus,
  confirmDelivery,
  cancelOrder,
} = require("../controllers/orderController")

// All order routes require authentication
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Create order from cart
router.post("/create", authenticate, createOrder)

// Get orders as buyer
router.get("/buyer", authenticate, getBuyerOrders)

// Get orders as seller
router.get("/seller", authenticate, getSellerOrders)

// Get single order details
router.get("/:orderId", authenticate, getOrderDetails)

// Update delivery status (seller only)
router.put("/:orderId/delivery-status", authenticate, updateDeliveryStatus)

// Confirm delivery (buyer only)
router.put("/:orderId/confirm-delivery", authenticate, confirmDelivery)

// Cancel order
router.put("/:orderId/cancel", authenticate, cancelOrder)

module.exports = router
