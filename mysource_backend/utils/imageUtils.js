const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fetch = require('node-fetch');

// Process and save image, return full URLs
exports.processImage = async (file) => {
  try {
    // Generate unique filename
    const filename = `${uuidv4()}.webp`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'Uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Get base URL for images
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.REACT_APP_API_URL || 'https://mysource.com.ng'
        : process.env.REACT_APP_API_URL || `http://localhost:${process.env.PORT || 5000}`;

    // Process image with sharp
    let buffer;

    // Handle both file objects from multer and URLs from Telegram
    if (typeof file === 'string') {
      // It's a URL (from Telegram)
      const response = await fetch(file);
      buffer = await response.arrayBuffer();
      buffer = Buffer.from(buffer);
    } else {
      // It's a file object from multer
      buffer = file.buffer;
    }

    const optimizedImageBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Save image
    await fs.writeFile(path.join(uploadDir, filename), optimizedImageBuffer);

    // Generate thumbnail
    const thumbnailFilename = `thumb_${filename}`;
    await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 60 })
      .toBuffer()
      .then((data) => fs.writeFile(path.join(uploadDir, thumbnailFilename), data));

    return {
      url: `${baseUrl}/Uploads/${filename}`,
      thumbnailUrl: `${baseUrl}/Uploads/${thumbnailFilename}`,
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};