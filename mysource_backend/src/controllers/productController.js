import prisma from "../db.js"
import { processImage } from "../utils/imageUtils.js"

// Add the missing createProduct function
export const createProduct = async (req, res) => {
  const { description, price, category } = req.body
  const userId = req.user.id
  const campus = req.user.campus // Use the user's campus automatically

  try {
    // Validate required fields
    if (!description) {
      return res.status(400).json({ message: "Description is required" })
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        description,
        price: price ? Number.parseFloat(price) : null,
        category,
        campus,
        userId,
        isDisabled: false,
        viewCount: 0,
      },
    })

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(async (file) => {
        const imageData = await processImage(file)
        return prisma.image.create({
          data: {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            productId: product.id,
          },
        })
      })

      await Promise.all(imagePromises)
    }

    // Fetch the created product with images
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
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

    res.status(201).json(createdProduct)
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({ message: "Failed to create product" })
  }
}

// Add the missing updateProduct function
export const updateProduct = async (req, res) => {
  const { id } = req.params
  const { title, description, price, category, campus } = req.body
  const userId = req.user.id

  try {
    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if user is authorized to update this product
    if (existingProduct.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to update this product" })
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: Number.parseFloat(price) }),
        ...(category && { category }),
        ...(campus && { campus }),
      },
    })

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      // Delete existing images if requested
      if (req.body.replaceImages === "true") {
        await prisma.image.deleteMany({
          where: { productId: id },
        })
      }

      const imagePromises = req.files.map(async (file) => {
        const imageData = await processImage(file)
        return prisma.image.create({
          data: {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            productId: id,
          },
        })
      })

      await Promise.all(imagePromises)
    }

    // Fetch the updated product with images
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

    res.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Failed to update product" })
  }
}

// Add the missing deleteProduct function
export const deleteProduct = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if user is authorized to delete this product
    if (existingProduct.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this product" })
    }

    // Delete associated images first
    await prisma.image.deleteMany({
      where: { productId: id },
    })

    // Delete associated views
    await prisma.view.deleteMany({
      where: { productId: id },
    })

    // Delete the product
    await prisma.product.delete({
      where: { id },
    })

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Failed to delete product" })
  }
}

// Update the getProducts function to filter out disabled products
export const getProducts = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const where = {}
  if (campus) where.campus = campus
  if (category) where.category = category

  // Only show enabled products to non-owners and non-admins
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    where.isDisabled = false
  }

  try {
    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            website: true,
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
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ message: "Failed to fetch products" })
  }
}

// Update the getProductById function to handle disabled products
export const getProductById = async (req, res) => {
  const { id } = req.params
  const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            website: true,
            role: true,
          },
        },
      },
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if product is disabled and user is not the owner or an admin
    if (
      product.isDisabled &&
      (!req.user || (req.user.id !== product.userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN"))
    ) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Record view if not already viewed by this visitor
    try {
      const existingView = await prisma.view.findFirst({
        where: {
          visitorId,
          productId: id,
        },
      })

      if (!existingView) {
        await prisma.view.create({
          data: {
            visitorId,
            productId: id,
          },
        })

        // Increment view count
        await prisma.product.update({
          where: { id },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        })

        // Update the product object to reflect the new view count
        product.viewCount += 1
      }
    } catch (error) {
      console.error("Error recording view:", error)
      // Continue with the response even if view recording fails
    }

    res.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ message: "Failed to fetch product details" })
  }
}

// Add/Update the getUserProducts function
export const getUserProducts = async (req, res) => {
  const userId = req.user.id

  try {
    const products = await prisma.product.findMany({
      where: { userId },
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
    })

    res.json({
      products,
    })
  } catch (error) {
    console.error("Error fetching user products:", error)
    res.status(500).json({ message: "Failed to fetch your products" })
  }
}

// Get multiple products by IDs
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.query
    
    if (!ids) {
      return res.status(400).json({ message: 'Product IDs are required' })
    }
    
    const productIds = ids.split(',')
    
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        },
        isDisabled: false
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            website: true,
            avatar: true
          }
        }
      }
    })
    
    res.json(products)
  } catch (error) {
    console.error('Error fetching products by IDs:', error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}

