import multer from "multer"
import path from "path"
import fs from "fs/promises"

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter,
})

// Setup multer middleware for the app
export const setupMulter = (app) => {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")
  fs.mkdir(uploadDir, { recursive: true }).catch((err) => console.error("Error creating uploads directory:", err))

  // Make upload middleware available to routes
  app.use((req, res, next) => {
    req.upload = upload
    next()
  })
}

