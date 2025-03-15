import express from "express"
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  googleLogin,
  linkTelegramAccount,
  getActiveUsersCount,
} from "../controllers/authController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public routes
router.post("/register", register)
router.post("/login", login)
router.post("/google-login", googleLogin)
router.get("/active-users", getActiveUsersCount)

// Protected routes
router.get("/me", authenticate, getCurrentUser)
router.put("/profile", authenticate, updateProfile)
router.put("/password", authenticate, changePassword)
router.post("/link-telegram", authenticate, linkTelegramAccount)

export default router

