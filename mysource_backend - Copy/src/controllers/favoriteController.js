// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // Get user's favorites
// export const getUserFavorites = async (req, res) => {
//   const userId = req.user.id; // Assumed to be an integer from auth middleware

//   try {
//     const favorites = await prisma.favorite.findMany({
//       where: { userId }, // Already an integer
//       orderBy: { createdAt: 'desc' },
//     });

//     res.json(favorites);
//   } catch (error) {
//     console.error('Error fetching favorites:', error);
//     res.status(500).json({ message: 'Failed to fetch favorites' });
//   }
// };

// // Add item to favorites
// export const addFavorite = async (req, res) => {
//   const userId = req.user.id; // Assumed to be an integer
//   const { itemId, itemType } = req.body;

//   // Validate inputs
//   if (!itemId || !itemType) {
//     return res.status(400).json({ message: 'Item ID and type are required' });
//   }

//   // Parse itemId to integer
//   const itemIdInt = parseInt(itemId, 10);
//   if (isNaN(itemIdInt)) {
//     return res.status(400).json({ message: 'Invalid item ID' });
//   }

//   try {
//     // Check if already in favorites
//     const existingFavorite = await prisma.favorite.findFirst({
//       where: {
//         userId,
//         itemId: itemIdInt, // Use parsed integer
//         itemType,
//       },
//     });

//     if (existingFavorite) {
//       return res.status(400).json({ message: 'Item is already in favorites' });
//     }

//     // Add to favorites
//     const favorite = await prisma.favorite.create({
//       data: {
//         userId,
//         itemId: itemIdInt, // Use parsed integer
//         itemType,
//       },
//     });

//     res.status(201).json(favorite);
//   } catch (error) {
//     console.error('Error adding to favorites:', error);
//     res.status(500).json({ message: 'Failed to add to favorites' });
//   }
// };

// // Remove item from favorites
// export const removeFavorite = async (req, res) => {
//   const userId = req.user.id; // Assumed to be an integer
//   const { itemId } = req.params;
//   const { itemType } = req.query;

//   // Validate inputs
//   if (!itemId || !itemType) {
//     return res.status(400).json({ message: 'Item ID and type are required' });
//   }

//   // Parse itemId to integer
//   const itemIdInt = parseInt(itemId, 10);
//   if (isNaN(itemIdInt)) {
//     return res.status(400).json({ message: 'Invalid item ID' });
//   }

//   try {
//     // Check if in favorites
//     const favorite = await prisma.favorite.findFirst({
//       where: {
//         userId,
//         itemId: itemIdInt, // Use parsed integer
//         itemType,
//       },
//     });

//     if (!favorite) {
//       return res.status(404).json({ message: 'Item not found in favorites' });
//     }

//     // Remove from favorites
//     await prisma.favorite.delete({
//       where: { id: favorite.id }, // favorite.id is already an integer
//     });

//     res.json({ message: 'Item removed from favorites' });
//   } catch (error) {
//     console.error('Error removing from favorites:', error);
//     res.status(500).json({ message: 'Failed to remove from favorites' });
//   }
// };


// In favoritesController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user's favorites with associated products and businesses
export const getUserFavorites = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer from auth middleware

  try {
    // Fetch favorites
    const favorites = await prisma.favorite.findMany({
      where: { userId }, // Int
      orderBy: { createdAt: "desc" },
    });

    // Group favorites by type
    const productIds = favorites
      .filter((fav) => fav.itemType === "product")
      .map((fav) => fav.itemId); // Int
    const businessIds = favorites
      .filter((fav) => fav.itemType === "business")
      .map((fav) => fav.itemId); // Int

    // Fetch products
    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds }, // Int
            isDisabled: false,
          },
          include: {
            images: true,
            user: {
              select: {
                id: true, // Int
                name: true,
                email: true,
                phone: true,
                website: true,
                // No avatar
              },
            },
          },
        })
      : [];

    // Fetch businesses
    const businesses = businessIds.length
      ? await prisma.business.findMany({
          where: {
            id: { in: businessIds }, // Int
            isDisabled: false,
          },
          include: {
            images: true,
            user: {
              select: {
                id: true, // Int
                name: true,
                email: true,
                phone: true,
                website: true,
                // No avatar
              },
            },
          },
        })
      : [];

    // Return favorites for FavoritesContext and items for FavoritesPage
    res.json({
      favorites, // Array: [{ id, userId, itemId, itemType, createdAt }]
      products, // Array for FavoritesPage
      businesses, // Array for FavoritesPage
    });
  } catch (error) {
    console.error("Error fetching favorites with items:", error);
    if (error.name === "PrismaClientValidationError") {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    res.status(500).json({ message: "Failed to fetch favorites" });
  }
};

// Add item to favorites
export const addFavorite = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer
  const { itemId, itemType } = req.body;

  // Validate inputs
  if (!itemId || !itemType) {
    return res.status(400).json({ message: "Item ID and type are required" });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: "Invalid item ID" });
  }

  try {
    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId: itemIdInt, // Use parsed integer
        itemType,
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Item is already in favorites" });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        itemId: itemIdInt, // Use parsed integer
        itemType,
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: "Failed to add to favorites" });
  }
};

// Remove item from favorites
export const removeFavorite = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer
  const { itemId } = req.params;
  const { itemType } = req.query;

  // Validate inputs
  if (!itemId || !itemType) {
    return res.status(400).json({ message: "Item ID and type are required" });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: "Invalid item ID" });
  }

  try {
    // Check if in favorites
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        itemId: itemIdInt, // Use parsed integer
        itemType,
      },
    });

    if (!favorite) {
      return res.status(404).json({ message: "Item not found in favorites" });
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: { id: favorite.id }, // favorite.id is already an integer
    });

    res.json({ message: "Item removed from favorites" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: "Failed to remove from favorites" });
  }
};