import { PrismaClient } from "@prisma/client"
import { processImage } from "../utils/imageUtils.js"

const prisma = new PrismaClient()

// Create a new business
export const createBusiness = async (req, res) => {
  const { name, description, category } = req.body
  const userId = req.user.id
  const campus = req.user.campus

  if (!name || !description) {
    return res.status(400).json({ message: "Name and description are required" })
  }

  try {
    // Process image if uploaded
    let imageData = null
    if (req.file) {
      imageData = await processImage(req.file)
    }

    // Create business
    const business = await prisma.business.create({
      data: {
        name,
        description,
        category: category || null,
        campus,
        userId,
        images: imageData
          ? {
              create: [
                {
                  url: imageData.url,
                  thumbnailUrl: imageData.thumbnailUrl,
                },
              ],
            }
          : undefined,
      },
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

    res.status(201).json(business)
  } catch (error) {
    console.error("Error creating business:", error)
    res.status(500).json({ message: "Failed to create business" })
  }
}

// Update a business
export const updateBusiness = async (req, res) => {
  const { id } = req.params
  const { name, description, category } = req.body
  const userId = req.user.id

  try {
    // Check if business exists and belongs to user
    const business = await prisma.business.findUnique({
      where: { id },
    })

    if (!business) {
      return res.status(404).json({ message: "Business not found" })
    }

    if (business.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to update this business" })
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        category: category || undefined,
      },
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

    res.json(updatedBusiness)
  } catch (error) {
    console.error("Error updating business:", error)
    res.status(500).json({ message: "Failed to update business" })
  }
}

// Delete a business
export const deleteBusiness = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Check if business exists and belongs to user
    const business = await prisma.business.findUnique({
      where: { id },
    })

    if (!business) {
      return res.status(404).json({ message: "Business not found" })
    }

    if (business.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this business" })
    }

    // Delete associated images
    await prisma.image.deleteMany({
      where: { businessId: id },
    })

    // Delete associated views
    await prisma.view.deleteMany({
      where: { businessId: id },
    })

    // Delete business
    await prisma.business.delete({
      where: { id },
    })

    res.json({ message: "Business deleted successfully" })
  } catch (error) {
    console.error("Error deleting business:", error)
    res.status(500).json({ message: "Failed to delete business" })
  }
}

// Add business images
export const addBusinessImages = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Check if business exists and belongs to user
    const business = await prisma.business.findUnique({
      where: { id },
    })

    if (!business) {
      return res.status(404).json({ message: "Business not found" })
    }

    if (business.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to update this business" })
    }

    // Process images
    const imagePromises = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageData = await processImage(file)
        imagePromises.push(
          prisma.image.create({
            data: {
              url: imageData.url,
              thumbnailUrl: imageData.thumbnailUrl,
              businessId: id,
            },
          }),
        )
      }
    }

    const images = await Promise.all(imagePromises)
    res.json(images)
  } catch (error) {
    console.error("Error adding business images:", error)
    res.status(500).json({ message: "Failed to add business images" })
  }
}

// Delete business image
export const deleteBusinessImage = async (req, res) => {
  const { id, imageId } = req.params
  const userId = req.user.id

  try {
    // Check if business exists and belongs to user
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        images: true,
      },
    })

    if (!business) {
      return res.status(404).json({ message: "Business not found" })
    }

    if (business.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Not authorized to update this business" })
    }

    // Check if image exists and belongs to this business
    const image = business.images.find((img) => img.id === imageId)
    if (!image) {
      return res.status(404).json({ message: "Image not found" })
    }

    // Delete image
    await prisma.image.delete({
      where: { id: imageId },
    })

    res.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Error deleting business image:", error)
    res.status(500).json({ message: "Failed to delete business image" })
  }
}

// Update the getBusinesses function to filter out disabled businesses
export const getBusinesses = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const where = {}
  if (campus) where.campus = campus
  if (category) where.category = category

  // Only show enabled businesses to non-owners and non-admins
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    where.isDisabled = false
  }

  try {
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
  } catch (error) {
    console.error("Error fetching businesses:", error)
    res.status(500).json({ message: "Failed to fetch businesses" })
  }
}

// Update the getBusinessById function to handle disabled businesses
export const getBusinessById = async (req, res) => {
  const { id } = req.params
  const visitorId = req.user?.id || req.headers["x-visitor-id"] || req.ip

  try {
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
            role: true,
          },
        },
      },
    })

    if (!business) {
      return res.status(404).json({ message: "Business not found" })
    }

    // Check if business is disabled and user is not the owner or an admin
    if (
      business.isDisabled &&
      (!req.user || (req.user.id !== business.userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN"))
    ) {
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
  } catch (error) {
    console.error("Error fetching business:", error)
    res.status(500).json({ message: "Failed to fetch business details" })
  }
}

// Add/Update the getUserBusinesses function
export const getUserBusinesses = async (req, res) => {
  const userId = req.user.id

  try {
    const businesses = await prisma.business.findMany({
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
      businesses,
    })
  } catch (error) {
    console.error("Error fetching user businesses:", error)
    res.status(500).json({ message: "Failed to fetch your businesses" })
  }
}


// Get multiple businesses by IDs
export const getBusinessesByIds = async (req, res) => {
  try {
    const { ids } = req.query
    
    if (!ids) {
      return res.status(400).json({ message: 'Business IDs are required' })
    }
    
    const businessIds = ids.split(',')
    
    const businesses = await prisma.business.findMany({
      where: {
        id: {
          in: businessIds
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
    
    res.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses by IDs:', error)
    res.status(500).json({ message: 'Failed to fetch businesses' })
  }
}
