const { Favorite, Product, Business, User, Image } = require('../models');
const { Op } = require('sequelize');

// Get user's favorites with associated products and businesses
exports.getUserFavorites = async (req, res) => {
  const userId = req.user.id; // Integer from auth middleware

  try {
    // Fetch favorites
    const favorites = await Favorite.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    // Group favorites by type
    const productIds = favorites
      .filter((fav) => fav.itemType === 'product')
      .map((fav) => fav.itemId);
    const businessIds = favorites
      .filter((fav) => fav.itemType === 'business')
      .map((fav) => fav.itemId);

    // Fetch products
    const products = productIds.length
      ? await Product.findAll({
          where: {
            id: { [Op.in]: productIds },
            isDisabled: false,
          },
          include: [
            { model: Image },
            {
              model: User,
              attributes: ['id', 'name', 'email', 'phone', 'website'],
            },
          ],
        })
      : [];

    // Fetch businesses
    const businesses = businessIds.length
      ? await Business.findAll({
          where: {
            id: { [Op.in]: businessIds },
            isDisabled: false,
          },
          include: [
            { model: Image },
            {
              model: User,
              attributes: ['id', 'name', 'email', 'phone', 'website'],
            },
          ],
        })
      : [];

    // Return favorites for FavoritesContext and items for FavoritesPage
    res.json({
      favorites,
      products,
      businesses,
    });
  } catch (error) {
    console.error('Error fetching favorites with items:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
};

// Add item to favorites
exports.addFavorite = async (req, res) => {
  const userId = req.user.id; // Integer
  const { itemId, itemType } = req.body;

  // Validate inputs
  if (!itemId || !itemType) {
    return res.status(400).json({ message: 'Item ID and type are required' });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      where: {
        userId,
        itemId: itemIdInt,
        itemType,
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Item is already in favorites' });
    }

    // Add to favorites
    const favorite = await Favorite.create({
      userId,
      itemId: itemIdInt,
      itemType,
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Failed to add to favorites' });
  }
};

// Remove item from favorites
exports.removeFavorite = async (req, res) => {
  const userId = req.user.id; // Integer
  const { itemId } = req.params;
  const { itemType } = req.query;

  // Validate inputs
  if (!itemId || !itemType) {
    return res.status(400).json({ message: 'Item ID and type are required' });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    // Check if in favorites
    const favorite = await Favorite.findOne({
      where: {
        userId,
        itemId: itemIdInt,
        itemType,
      },
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Item not found in favorites' });
    }

    // Remove from favorites
    await Favorite.destroy({
      where: { id: favorite.id },
    });

    res.json({ message: 'Item removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Failed to remove from favorites' });
  }
};