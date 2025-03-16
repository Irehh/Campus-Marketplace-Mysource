import express from "express"
import { handleWebhook, sendVerificationCode } from "../controllers/telegramController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/webhook", handleWebhook)
router.post("/send-verification", authenticate, sendVerificationCode)

export default router

