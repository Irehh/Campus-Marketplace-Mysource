// Update the index.js file to make Telegram bot polling optional

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
import messageRoutes from "./routes/messageRoutes.js"
import commentRoutes from "./routes/commentRoutes.js"
import adminRoutes from "./routes/adminRoutes.js" // Add admin routes

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
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

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
app.use("/api/admin", adminRoutes) // Add admin routes

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use(errorHandler)

// Start the Telegram bot if configured
if (process.env.ENABLE_TELEGRAM === "true") {
  startBot()

  // Schedule unread message notifications if polling is enabled
  if (process.env.TELEGRAM_USE_POLLING === "true") {
    // Run less frequently to reduce potential errors
    const notificationInterval = 4 * 60 * 60 * 1000 // 4 hours
    setInterval(sendUnreadMessageNotifications, notificationInterval)
  }
} else {
  console.log("Telegram bot is disabled. Set ENABLE_TELEGRAM=true to enable it.")
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  // Don't exit the process for non-critical errors
  if (error.code === "EFATAL" || error.code === "ENOTFOUND") {
    console.warn("Non-critical error caught, continuing execution")
  } else {
    process.exit(1)
  }
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  // Don't exit the process for network-related errors
  if (reason && (reason.code === "EFATAL" || reason.code === "ENOTFOUND")) {
    console.warn("Non-critical rejection caught, continuing execution")
  } else {
    process.exit(1)
  }
})



// Update the index.js file to make Telegram bot polling optional

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
import messageRoutes from "./routes/messageRoutes.js"
import commentRoutes from "./routes/commentRoutes.js"
import adminRoutes from "./routes/adminRoutes.js" // Add admin routes

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
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

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
app.use("/api/admin", adminRoutes) // Add admin routes

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use(errorHandler)

// Start the Telegram bot if configured
if (process.env.ENABLE_TELEGRAM === "true") {
  try {
    startBot()
    console.log("Telegram bot started successfully")

    // Schedule unread message notifications if polling is enabled
    if (process.env.TELEGRAM_USE_POLLING === "true") {
      // Run less frequently to reduce potential errors
      const notificationInterval = 4 * 60 * 60 * 1000 // 4 hours
      setInterval(sendUnreadMessageNotifications, notificationInterval)
    }
  } catch (error) {
    console.error("Failed to start Telegram bot:", error)
    console.log("Telegram features will be disabled")
  }
} else {
  console.log("Telegram bot is disabled. Set ENABLE_TELEGRAM=true to enable it.")
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  // Don't exit the process for non-critical errors
  if (error.code === "EFATAL" || error.code === "ENOTFOUND") {
    console.warn("Non-critical error caught, continuing execution")
  } else {
    process.exit(1)
  }
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  // Don't exit the process for network-related errors
  if (reason && (reason.code === "EFATAL" || reason.code === "ENOTFOUND")) {
    console.warn("Non-critical rejection caught, continuing execution")
  } else {
    process.exit(1)
  }
})

