import express from "express"
import { handleWebhook, verifyTelegramCode } from "../controllers/telegramController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

// Webhook endpoint for Telegram
router.post("/webhook", handleWebhook)

// Verify and link Telegram account
router.post("/verify", authenticate, verifyTelegramCode)

export default router

