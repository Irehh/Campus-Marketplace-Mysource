

import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"
import "express-async-errors"

// Import routes
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import businessRoutes from "./routes/businessRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"
import telegramRoutes from "./routes/telegramRoutes.js"
import eventsRoutes from "./routes/eventsRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import commentRoutes from "./routes/commentRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import pushRoutes from "./routes/pushRoutes.js"

// Import middleware
import { errorHandler } from "./middleware/errorMiddleware.js"
import { setupMulter } from "./middleware/uploadMiddleware.js"

// Import Telegram bot controller
import { startBot, sendUnreadMessageNotifications } from "./controllers/telegramController.js"

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// Optional: Customize Morgan logging (only log errors, not all requests)
// Comment out or remove this line to disable all Morgan logging
app.use(
  morgan("dev", {
    skip: (req, res) => res.statusCode < 400, // Only log requests with errors (400+)
  })
)

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")))

// Setup multer for file uploads
setupMulter(app)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/businesses", businessRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/telegram", telegramRoutes)
app.use("/api/events", eventsRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/comments", commentRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/push", pushRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Catch-all for undefined routes (e.g., PUT /auth/profile 404)
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.status = 404
  next(error)
})

// Error handling middleware
app.use(errorHandler)

// Start the Telegram bot if configured
if (process.env.ENABLE_TELEGRAM === "true") {
  let bot
  try {
    bot = startBot()
    global.bot = bot
    console.info("Telegram bot started successfully")

    if (process.env.TELEGRAM_USE_POLLING === "true") {
      const notificationInterval = 4 * 60 * 60 * 1000 // 4 hours
      const notificationTimer = setInterval(async () => {
        try {
          await sendUnreadMessageNotifications()
        } catch (error) {
          console.error("Error sending notifications:", {
            message: error.message,
            stack: error.stack,
          })
        }
      }, notificationInterval)

      process.on("SIGTERM", () => {
        clearInterval(notificationTimer)
      })
    }
  } catch (error) {
    console.error("Failed to start Telegram bot:", {
      message: error.message,
      stack: error.stack,
    })
    console.warn("Telegram features will be disabled")
  }
} else {
  console.info("Telegram bot is disabled. Set ENABLE_TELEGRAM=true to enable it.")
}

// Start server
app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`)
  console.info(`Environment: ${process.env.NODE_ENV}`)
})

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

// Improved error logging for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
    code: error.code,
  })
  if (error.code === "EFATAL" || error.code === "ENOTFOUND") {
    console.warn("Non-critical error caught, continuing execution")
  } else {
    process.exit(1)
  }
})

// Improved error logging for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", {
    promise,
    reason: reason instanceof Error ? {
      message: reason.message,
      stack: reason.stack,
      code: reason.code,
    } : reason,
  })
  if (reason && (reason.code === "EFATAL" || reason.code === "ENOTFOUND")) {
    console.warn("Non-critical rejection caught, continuing execution")
  } else {
    process.exit(1)
  }
})