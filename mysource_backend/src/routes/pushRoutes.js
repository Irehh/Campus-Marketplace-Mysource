import express from "express"
import { getVapidPublicKey, subscribe, unsubscribe } from "../controllers/pushController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

// Get VAPID public key
router.get("/vapid-public-key", getVapidPublicKey)

// Subscribe to push notifications
router.post("/subscribe", authenticate, subscribe)

// Unsubscribe from push notifications
router.post("/unsubscribe", unsubscribe)

export default router

