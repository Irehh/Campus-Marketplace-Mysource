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

// Import middleware
import { errorHandler } from "./middleware/errorMiddleware.js"
import { setupMulter } from "./middleware/uploadMiddleware.js"

// Import Telegram bot controller
import { startBot } from "./controllers/telegramController.js"

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

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use(errorHandler)

// Start the Telegram bot
startBot()

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
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

