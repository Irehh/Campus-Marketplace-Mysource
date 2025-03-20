import express from "express";
import { handleWebhook, verifyLink } from "../controllers/telegramController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", handleWebhook);
router.post("/verify-link", authenticate, verifyLink);

export default router;