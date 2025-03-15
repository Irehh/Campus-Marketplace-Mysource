import { PrismaClient } from "@prisma/client"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()

// Get comments for a product or business
export const getComments = async (req, res) => {
  const { itemType, itemId } = req.params

  if (!["product", "business"].includes(itemType)) {
    return res.status(400).json({ message: "Invalid item type" })
  }

  try {
    const comments = await prisma.comment.findMany({
      where: {
        ...(itemType === "product" ? { productId: itemId } : { businessId: itemId }),
      },
      include: {
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

    res.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    res.status(500).json({ message: "Failed to fetch comments" })
  }
}

// Create a new comment
export const createComment = async (req, res) => {
  const { content, itemId, itemType } = req.body
  const userId = req.user.id

  if (!content) {
    return res.status(400).json({ message: "Comment content is required" })
  }

  if (!["product", "business"].includes(itemType)) {
    return res.status(400).json({ message: "Invalid item type" })
  }

  try {
    // Check if the item exists
    if (itemType === "product") {
      const product = await prisma.product.findUnique({
        where: { id: itemId },
      })
      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }
    } else {
      const business = await prisma.business.findUnique({
        where: { id: itemId },
      })
      if (!business) {
        return res.status(404).json({ message: "Business not found" })
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        ...(itemType === "product" ? { productId: itemId } : { businessId: itemId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Emit event for real-time updates
    emitEvent("newComment", {
      message: `New comment from ${req.user.name || "Someone"} on a ${itemType}`,
      campus: req.user.campus,
    })

    res.status(201).json(comment)
  } catch (error) {
    console.error("Error creating comment:", error)
    res.status(500).json({ message: "Failed to create comment" })
  }
}

// Update a comment
export const updateComment = async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  if (!content) {
    return res.status(400).json({ message: "Comment content is required" })
  }

  try {
    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this comment" })
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.json(updatedComment)
  } catch (error) {
    console.error("Error updating comment:", error)
    res.status(500).json({ message: "Failed to update comment" })
  }
}

// Delete a comment
export const deleteComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" })
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id },
    })

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({ message: "Failed to delete comment" })
  }
}

