const express = require("express")
const router = express.Router()
const walletController = require("../controllers/walletController")
const { authenticate } = require("../middleware/authMiddleware")

// All routes require authentication except webhook
router.use((req, res, next) => {
  // Skip authentication for webhook
  if (req.path === "/webhook") {
    return next()
  }
  return authenticate(req, res, next)
})

// Get user's wallet
router.get("/", walletController.getWallet)

// Get wallet summary (for dashboard)
router.get("/summary", walletController.getWalletSummary)

// Initialize deposit
router.post("/deposit", walletController.initializeDeposit)

// Verify deposit
router.get("/verify-deposit", walletController.verifyDeposit)

// Withdraw funds
router.post("/withdraw", walletController.withdraw)

// Get transaction history
router.get("/transactions", walletController.getTransactionHistory)

// Get bank list (for withdrawals)
router.get("/banks", walletController.getBankList)

// Verify bank account
router.post("/verify-account", walletController.verifyBankAccount)

// New balance verification endpoint (with enhanced accountability)
router.get("/verify-balance", walletController.verifyBalance)

// Paystack webhook (no authentication required)
router.post("/webhook", express.raw({ type: "application/json" }), walletController.paystackWebhook)

module.exports = router
