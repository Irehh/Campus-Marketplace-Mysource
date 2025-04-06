// mysource_backend/src/controllers/favoriteController.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Get user's favorites
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    res.json(favorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    res.status(500).json({ message: 'Failed to fetch favorites' })
  }
}

// Add to favorites
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id
    const { itemId, itemType } = req.body

    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' })
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId,
        itemType
      }
    })

    if (existingFavorite) {
      return res.status(400).json({ message: 'Item is already in favorites' })
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        itemId,
        itemType
      }
    })

    res.status(201).json(favorite)
  } catch (error) {
    console.error('Error adding to favorites:', error)
    res.status(500).json({ message: 'Failed to add to favorites' })
  }
}

// Remove from favorites
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id
    const { itemId } = req.params
    const { itemType } = req.query

    if (!itemId || !itemType) {
      return res.status(400).json({ message: 'Item ID and type are required' })
    }

    // Check if in favorites
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId,
        itemType
      }
    })

    if (!favorite) {
      return res.status(404).json({ message: 'Item not found in favorites' })
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: { id: favorite.id }
    })

    res.json({ message: 'Item removed from favorites' })
  } catch (error) {
    console.error('Error removing from favorites:', error)
    res.status(500).json({ message: 'Failed to remove from favorites' })
  }
}