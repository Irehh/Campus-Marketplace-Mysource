// Platform fee configuration and calculation utilities
const FeeConfig = {
  // Fee tiers based on order amount
  TIERS: [
    {
      name: "SMALL_ORDER",
      maxAmount: 15000,
      fee: 1000,
      description: "Orders under ₦15,000",
    },
    {
      name: "MEDIUM_ORDER",
      maxAmount: 50000,
      fee: 1500,
      description: "Orders ₦15,000 - ₦50,000",
    },
    {
      name: "LARGE_ORDER",
      maxAmount: 100000,
      fee: 2000,
      description: "Orders ₦50,000 - ₦100,000",
    },
    {
      name: "PREMIUM_ORDER",
      maxAmount: Number.POSITIVE_INFINITY,
      fee: 2500,
      description: "Orders above ₦100,000",
    },
  ],

  // Percentage-based fees (alternative to fixed fees)
  PERCENTAGE_FEES: {
    SMALL_ORDER: 0.05, // 5%
    MEDIUM_ORDER: 0.04, // 4%
    LARGE_ORDER: 0.03, // 3%
    PREMIUM_ORDER: 0.025, // 2.5%
  },

  // Fee calculation method
  METHOD: "FIXED", // 'FIXED' or 'PERCENTAGE'

  // Minimum and maximum fees
  MIN_FEE: 500,
  MAX_FEE: 5000,

  // Special campus rates (if needed)
  CAMPUS_MULTIPLIERS: {
    "University of Lagos": 1.0,
    "University of Ibadan": 0.9,
    "Obafemi Awolowo University": 0.9,
    default: 1.0,
  },
}

/**
 * Calculate platform fee for an order
 * @param {number} orderAmount - Total order amount
 * @param {string} campus - Campus name (optional)
 * @param {string} method - Fee calculation method ('FIXED' or 'PERCENTAGE')
 * @returns {object} Fee calculation result
 */
const calculatePlatformFee = (orderAmount, campus = "default", method = FeeConfig.METHOD) => {
  try {
    // Find the appropriate tier
    const tier = FeeConfig.TIERS.find((t) => orderAmount <= t.maxAmount) || FeeConfig.TIERS[FeeConfig.TIERS.length - 1]

    let baseFee = 0

    if (method === "FIXED") {
      baseFee = tier.fee
    } else if (method === "PERCENTAGE") {
      const percentage = FeeConfig.PERCENTAGE_FEES[tier.name] || 0.05
      baseFee = orderAmount * percentage
    }

    // Apply campus multiplier
    const campusMultiplier = FeeConfig.CAMPUS_MULTIPLIERS[campus] || FeeConfig.CAMPUS_MULTIPLIERS.default
    let finalFee = baseFee * campusMultiplier

    // Apply min/max limits
    finalFee = Math.max(FeeConfig.MIN_FEE, Math.min(FeeConfig.MAX_FEE, finalFee))

    // Round to nearest naira
    finalFee = Math.round(finalFee)

    return {
      success: true,
      fee: finalFee,
      tier: tier.name,
      tierDescription: tier.description,
      method,
      campus,
      campusMultiplier,
      baseFee: Math.round(baseFee),
      breakdown: {
        orderAmount,
        baseFee: Math.round(baseFee),
        campusMultiplier,
        finalFee,
        minFee: FeeConfig.MIN_FEE,
        maxFee: FeeConfig.MAX_FEE,
      },
    }
  } catch (error) {
    console.error("Error calculating platform fee:", error)
    return {
      success: false,
      fee: FeeConfig.MIN_FEE, // Fallback to minimum fee
      error: error.message,
    }
  }
}

/**
 * Get fee preview for cart items
 * @param {Array} cartItems - Array of cart items with price and quantity
 * @param {string} campus - Campus name
 * @returns {object} Fee preview
 */
const getCartFeePreview = (cartItems, campus = "default") => {
  try {
    const subtotal = cartItems.reduce((total, item) => {
      return total + Number.parseFloat(item.price) * item.quantity
    }, 0)

    const feeCalculation = calculatePlatformFee(subtotal, campus)

    return {
      success: true,
      subtotal,
      platformFee: feeCalculation.fee,
      total: subtotal + feeCalculation.fee,
      feeDetails: feeCalculation,
    }
  } catch (error) {
    console.error("Error calculating cart fee preview:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update fee configuration (for admin use)
 * @param {object} newConfig - New configuration object
 * @returns {object} Update result
 */
const updateFeeConfig = (newConfig) => {
  try {
    // Validate and update configuration
    if (newConfig.TIERS) {
      FeeConfig.TIERS = newConfig.TIERS
    }
    if (newConfig.METHOD) {
      FeeConfig.METHOD = newConfig.METHOD
    }
    if (newConfig.MIN_FEE !== undefined) {
      FeeConfig.MIN_FEE = newConfig.MIN_FEE
    }
    if (newConfig.MAX_FEE !== undefined) {
      FeeConfig.MAX_FEE = newConfig.MAX_FEE
    }

    return {
      success: true,
      message: "Fee configuration updated successfully",
      config: FeeConfig,
    }
  } catch (error) {
    console.error("Error updating fee configuration:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current fee configuration
 * @returns {object} Current configuration
 */
const getFeeConfig = () => {
  return {
    success: true,
    config: FeeConfig,
  }
}

module.exports = {
  calculatePlatformFee,
  getCartFeePreview,
  updateFeeConfig,
  getFeeConfig,
  FeeConfig,
}
