const { Product, Business, User } = require('../models');
const { Op } = require('sequelize');

// Search products and businesses
exports.search = async (req, res) => {
  const { q, type = 'all', campus } = req.query;

  // Validate search query
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ message: 'Search query is required and must be a non-empty string' });
  }

  // Validate type
  const validTypes = ['all', 'products', 'businesses'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid type. Must be 'all', 'products', or 'businesses'" });
  }

  try {
    const searchResults = {};
    const whereClause = campus ? { campus } : {};

    // Search products
    if (type === 'all' || type === 'products') {
      const products = await Product.findAll({
        where: {
          ...whereClause,
          [Op.or]: [
            { description: { [Op.like]: `%${q}%` } },
            { category: { [Op.like]: `%${q}%` } },
          ],
          isDisabled: false,
        },
        include: [
          { model: Image },
          {
            model: User,
            attributes: ['id', 'name', 'phone', 'website'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      // Truncate description text
      searchResults.products = products.map((product) => ({
        ...product.toJSON(),
        description:
          product.description.length > 150
            ? product.description.substring(0, 150) + '...'
            : product.description,
      }));
    }

    // Search businesses
    if (type === 'all' || type === 'businesses') {
      const businesses = await Business.findAll({
        where: {
          ...whereClause,
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { description: { [Op.like]: `%${q}%` } },
            { category: { [Op.like]: `%${q}%` } },
          ],
          isDisabled: false,
        },
        include: [
          { model: Image },
          {
            model: User,
            attributes: ['id', 'name', 'phone', 'website'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      // Truncate description text
      searchResults.businesses = businesses.map((business) => ({
        ...business.toJSON(),
        description:
          business.description.length > 150
            ? business.description.substring(0, 150) + '...'
            : business.description,
      }));
    }

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Invalid search parameters' });
    }
    res.status(500).json({ message: 'Failed to process search request' });
  }
};