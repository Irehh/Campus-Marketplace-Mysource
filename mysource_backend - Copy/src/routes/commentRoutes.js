import express from "express"
import { getComments, createComment, updateComment, deleteComment } from "../controllers/commentController.js"
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

// Get comments for a product or business
router.get("/:itemType/:itemId", optionalAuth, getComments)

// Protected routes
router.post("/", authenticate, createComment)
router.put("/:id", authenticate, updateComment)
router.delete("/:id", authenticate, deleteComment)

export default router

