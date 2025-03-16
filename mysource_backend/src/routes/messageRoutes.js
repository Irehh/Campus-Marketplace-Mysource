import express from "express"
import {
  getMessages,
  getConversation,
  sendMessage,
  markAsRead,
  toggleNotifications,
  getUnreadCount,
} from "../controllers/messageController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all messages for the authenticated user
router.get("/", getMessages)

// Get conversation with another user
router.get("/conversation/:otherUserId", getConversation)

// Get unread messages count
router.get("/unread-count", getUnreadCount)

// Send a message
router.post("/", sendMessage)

// Mark messages as read
router.put("/read", markAsRead)

// Toggle Telegram notifications
router.put("/notifications", toggleNotifications)

export default router

