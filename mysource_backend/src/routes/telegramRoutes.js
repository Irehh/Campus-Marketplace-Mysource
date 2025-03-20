import express from "express";
import { handleWebhook, initiateLink } from "../controllers/telegramController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/webhook", handleWebhook);
router.post("/link", authenticate, initiateLink);

export default router;