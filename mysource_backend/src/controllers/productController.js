import { PrismaClient } from "@prisma/client"
import { processImage } from "../utils/imageUtils.js"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()

// Get all products with optional campus filter
export const getProducts = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const where = {}
  if (campus) where.campus = campus
  if (category) where.category = category

  const products = await prisma.product.findMany({
    where,
    include: {
      images: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: Number.parseInt(limit),
    skip,
  })

  const total = await prisma.product.count({ where })

  res.json({
    products,
    pagination: {
      total,
      page: Number.parseInt(page),
      pageSize: Number.parseInt(limit),
      totalPages: Math.ceil(total / Number.parseInt(limit)),
    },
  })
}

// Get a single product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  res.json(product)
}

// Update the createProduct function to remove title requirement
export const createProduct = async (req, res) => {
  const { description, price, category } = req.body
  const userId = req.user.id
  const campus = req.user.campus

  // Validate required fields
  if (!description) {
    return res.status(400).json({ message: "Description is required" })
  }

  // Process images if any
  const imageFiles = req.files
  if (!imageFiles || imageFiles.length === 0) {
    return res.status(400).json({ message: "At least one image is required" })
  }

  try {
    // Create product in database
    const product = await prisma.product.create({
      data: {
        description,
        price: price ? Number.parseFloat(price) : null,
        category: category || null,
        campus : user.campus,
        userId,
      },
    })

    // Process and save images
    const images = []
    for (const file of imageFiles) {
      const { url, thumbnailUrl } = await processImage(file)

      // Save image info to database
      const image = await prisma.image.create({
        data: {
          url,
          thumbnailUrl,
          productId: product.id,
        },
      })

      images.push(image)
    }

    // Emit event for real-time updates - include campus info
    emitEvent("newProduct", {
      message: `New product added in ${campus}: ${description.substring(0, 30)}...`,
      campus: campus,
    })

    res.status(201).json({
      ...product,
      images,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ message: "Failed to create product", error: error.message })
  }
}

// Update the updateProduct function to remove title
export const updateProduct = async (req, res) => {
  const { id } = req.params
  const { description, price, category } = req.body
  const userId = req.user.id

  // Check if product exists and belongs to user
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  })

  if (!existingProduct) {
    return res.status(404).json({ message: "Product not found" })
  }

  if (existingProduct.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to update this product" })
  }

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      description,
      price: price ? Number.parseFloat(price) : null,
      category,
    },
    include: {
      images: true,
    },
  })

  res.json(updatedProduct)
}

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Check if product exists and belongs to user
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!existingProduct) {
    return res.status(404).json({ message: "Product not found" })
  }

  if (existingProduct.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to delete this product" })
  }

  // Delete product (images will be cascade deleted due to Prisma schema)
  await prisma.product.delete({
    where: { id },
  })

  res.json({ message: "Product deleted successfully" })
}

