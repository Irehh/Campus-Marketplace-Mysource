import { PrismaClient } from "@prisma/client"
import { processImage } from "../utils/imageUtils.js"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()

// Get all businesses with optional campus filter
export const getBusinesses = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const where = {}
  if (campus) where.campus = campus
  if (category) where.category = category

  const businesses = await prisma.business.findMany({
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

  const total = await prisma.business.count({ where })

  res.json({
    businesses,
    pagination: {
      total,
      page: Number.parseInt(page),
      pageSize: Number.parseInt(limit),
      totalPages: Math.ceil(total / Number.parseInt(limit)),
    },
  })
}

// Get businesses for the authenticated user
export const getUserBusinesses = async (req, res) => {
  const userId = req.user.id

  try {
    const businesses = await prisma.business.findMany({
      where: { userId },
      include: {
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({ businesses })
  } catch (error) {
    console.error("Error fetching user businesses:", error)
    res.status(500).json({ message: "Failed to fetch your businesses" })
  }
}

// Get a single business by ID
export const getBusinessById = async (req, res) => {
  const { id } = req.params
  const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip

  const business = await prisma.business.findUnique({
    where: { id },
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
  })

  if (!business) {
    return res.status(404).json({ message: "Business not found" })
  }

  // Record view if not already viewed by this visitor
  try {
    const existingView = await prisma.view.findFirst({
      where: {
        visitorId,
        businessId: id,
      },
    })

    if (!existingView) {
      await prisma.view.create({
        data: {
          visitorId,
          businessId: id,
        },
      })

      // Increment view count
      await prisma.business.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })

      // Update the business object to reflect the new view count
      business.viewCount += 1
    }
  } catch (error) {
    console.error("Error recording view:", error)
    // Continue with the response even if view recording fails
  }

  res.json(business)
}

// Create a new business
export const createBusiness = async (req, res) => {
  const { name, description, category } = req.body
  const userId = req.user.id
  const campus = req.user.campus

  console.log("Business creation request:", { name, description, category, campus, userId })

  // Validate required fields
  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" })
  }

  // Process image
  const imageFile = req.file
  if (!imageFile) {
    return res.status(400).json({ message: "Business image is required" })
  }

  try {
    // Create business in database
    const business = await prisma.business.create({
      data: {
        name,
        description,
        category: category || "Other",
        campus,
        userId,
      },
    })

    // Process and save image
    const { url, thumbnailUrl } = await processImage(imageFile)

    const image = await prisma.image.create({
      data: {
        url,
        thumbnailUrl,
        businessId: business.id,
      },
    })

    // Emit event for real-time updates - include campus info
    emitEvent("newBusiness", {
      message: `New business added in ${campus}: ${name}`,
      campus: campus,
    })

    res.status(201).json({
      ...business,
      images: [image],
    })
  } catch (error) {
    console.error("Error creating business:", error)
    res.status(500).json({ message: "Failed to create business", error: error.message })
  }
}

// Update a business
export const updateBusiness = async (req, res) => {
  const { id } = req.params
  const { name, description, category } = req.body
  const userId = req.user.id

  // Check if business exists and belongs to user
  const existingBusiness = await prisma.business.findUnique({
    where: { id },
  })

  if (!existingBusiness) {
    return res.status(404).json({ message: "Business not found" })
  }

  if (existingBusiness.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to update this business" })
  }

  // Update business
  const updatedBusiness = await prisma.business.update({
    where: { id },
    data: {
      name,
      description,
      category,
    },
    include: {
      images: true,
    },
  })

  res.json(updatedBusiness)
}

// Delete a business
export const deleteBusiness = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Check if business exists and belongs to user
  const existingBusiness = await prisma.business.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!existingBusiness) {
    return res.status(404).json({ message: "Business not found" })
  }

  if (existingBusiness.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to delete this business" })
  }

  // Delete business (images will be cascade deleted due to Prisma schema)
  await prisma.business.delete({
    where: { id },
  })

  res.json({ message: "Business deleted successfully" })
}

// Add images to a business
export const addBusinessImages = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Check if business exists and belongs to user
  const existingBusiness = await prisma.business.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!existingBusiness) {
    return res.status(404).json({ message: "Business not found" })
  }

  if (existingBusiness.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to update this business" })
  }

  // Check if adding these images would exceed the limit of 4
  const currentImageCount = existingBusiness.images.length
  const newImageCount = req.files?.length || 0

  if (currentImageCount + newImageCount > 4) {
    return res.status(400).json({
      message: `Business can have at most 4 images. Currently has ${currentImageCount}.`,
    })
  }

  try {
    // Process and save images
    const newImages = []

    for (const file of req.files) {
      const { url, thumbnailUrl } = await processImage(file)

      // Save image info to database
      const image = await prisma.image.create({
        data: {
          url,
          thumbnailUrl,
          businessId: id,
        },
      })

      newImages.push(image)
    }

    res.status(201).json(newImages)
  } catch (error) {
    console.error("Error adding business images:", error)
    res.status(500).json({ message: "Failed to add images", error: error.message })
  }
}

// Delete a specific image from a business
export const deleteBusinessImage = async (req, res) => {
  const { id, imageId } = req.params
  const userId = req.user.id

  // Check if business exists and belongs to user
  const existingBusiness = await prisma.business.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!existingBusiness) {
    return res.status(404).json({ message: "Business not found" })
  }

  if (existingBusiness.userId !== userId) {
    return res.status(403).json({ message: "Not authorized to update this business" })
  }

  // Check if image exists and belongs to this business
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  })

  if (!image || image.businessId !== id) {
    return res.status(404).json({ message: "Image not found or does not belong to this business" })
  }

  // Don't allow deletion if it's the only image
  if (existingBusiness.images.length <= 1) {
    return res.status(400).json({ message: "Cannot delete the only image. Business must have at least one image." })
  }

  // Delete the image
  await prisma.image.delete({
    where: { id: imageId },
  })

  res.json({ message: "Image deleted successfully" })
}

