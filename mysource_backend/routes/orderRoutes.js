// router.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders, // Import getOrders directly
  getOrder,
  updateDeliveryStatus,
  confirmDelivery,
  cancelOrder,
  buyNow,
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/authMiddleware");

// Create order from cart
router.post("/create", authenticate, createOrder);

// Buy now (single product)
router.post("/buy-now", authenticate, buyNow);

// Get orders as buyer
router.get("/buyer", authenticate, (req, res) => getOrders(req, res, { type: "buyer" }));

// Get orders as seller
router.get("/seller", authenticate, (req, res) => getOrders(req, res, { type: "seller" }));

// Get single order details
router.get("/:orderId", authenticate, getOrder);

// Update delivery status (seller only)
router.put("/:orderId/delivery-status", authenticate, updateDeliveryStatus);

// Confirm delivery (buyer only)
router.put("/:orderId/confirm-delivery", authenticate, confirmDelivery);

// Cancel order
router.put("/:orderId/cancel", authenticate, cancelOrder);

module.exports = router;