import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "express-async-errors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";
import { setupMulter } from "./middleware/uploadMiddleware.js";
import { initializeBot, notifyNewProduct } from "./controllers/telegramController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")));
setupMulter(app);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));
app.use(errorHandler);

if (process.env.ENABLE_TELEGRAM === "true") {
  initializeBot().then(() => { // This should work since initializeBot is async
    app.on("newProduct", ({ campus, productId }) => notifyNewProduct(campus, productId));
    console.log("Telegram bot initialized");
  }).catch((err) => console.error("Failed to initialize Telegram bot:", err));
} else {
  console.log("Telegram bot is disabled. Set ENABLE_TELEGRAM=true to enable it.");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (error.code !== "EFATAL" && error.code !== "ENOTFOUND") process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  if (reason?.code && reason.code !== "EFATAL" && reason.code !== "ENOTFOUND") process.exit(1);
});