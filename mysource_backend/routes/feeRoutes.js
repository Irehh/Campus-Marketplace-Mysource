const express = require("express")
const router = express.Router()
const { authenticate, optionalAuth } = require("../middleware/authMiddleware")
const { isAdmin, isSuperAdmin  } = require("../middleware/adminMiddleware")
const { calculatePlatformFee, getCartFeePreview, updateFeeConfig, getFeeConfig } = require("../utils/feeCalculator")

// Get current fee configuration (public)
router.get("/config", (req, res) => {
  try {
    const config = getFeeConfig()
    res.status(200).json({
      success: true,
      data: config.config,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get fee configuration",
      error: error.message,
    })
  }
})

// Calculate fee for a specific amount
router.post("/calculate", (req, res) => {
  try {
    const { amount, campus } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      })
    }

    const feeCalculation = calculatePlatformFee(amount, campus)

    res.status(200).json({
      success: true,
      data: feeCalculation,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate fee",
      error: error.message,
    })
  }
})

// Update fee configuration (admin only)
router.put("/config", authenticate, isSuperAdmin, (req, res) => {
  try {
    const { config } = req.body

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Configuration data is required",
      })
    }

    const result = updateFeeConfig(config)

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Fee configuration updated successfully",
        data: result.config,
      })
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update fee configuration",
      error: error.message,
    })
  }
})

module.exports = router
