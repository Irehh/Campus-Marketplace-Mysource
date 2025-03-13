import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"
import fetch from "node-fetch"

// Process and save image, return full URLs
export const processImage = async (file) => {
  try {
    // Generate unique filename
    const filename = `${uuidv4()}.webp`

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")
    await fs.mkdir(uploadDir, { recursive: true })

    // Get base URL for images
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.API_BASE_URL || "https://your-production-domain.com"
        : process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`

    // Process image with sharp
    let buffer

    // Handle both file objects from multer and URLs from Telegram
    if (typeof file === "string") {
      // It's a URL (from Telegram)
      const response = await fetch(file)
      buffer = await response.arrayBuffer()
      buffer = Buffer.from(buffer)
    } else {
      // It's a file object from multer
      buffer = file.buffer
    }

    const optimizedImageBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    // Save image
    await fs.writeFile(path.join(uploadDir, filename), optimizedImageBuffer)

    // Generate thumbnail
    const thumbnailFilename = `thumb_${filename}`
    await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 60 })
      .toBuffer()
      .then((data) => fs.writeFile(path.join(uploadDir, thumbnailFilename), data))

    return {
      url: `${baseUrl}/uploads/${filename}`,
      thumbnailUrl: `${baseUrl}/uploads/${thumbnailFilename}`,
    }
  } catch (error) {
    console.error("Image processing error:", error)
    throw new Error("Failed to process image")
  }
}

