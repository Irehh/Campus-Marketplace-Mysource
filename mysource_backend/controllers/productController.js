const { Product, User, Image, View, sequelize } = require('../models');
const { Op } = require('sequelize');
const { processImage } = require('../utils/imageUtils');
const { logger } = require('../utils/logger');
const { emitEvent } = require('../utils/eventEmitter'); // Assuming you have an event emitter setup

// Create a new product
exports.createProduct = async (req, res) => {
  const { description, price, category } = req.body;
  const userId = req.user.id; // Integer from auth middleware
  const campus = req.user.campus;

  try {
    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Create product within a transaction
    const createdProduct = await sequelize.transaction(async (t) => {
      const product = await Product.create(
        {
          description,
          price: price ? Number.parseFloat(price) : 'On Request',
          category,
          campus,
          userId,
          isDisabled: false,
          viewCount: 0,
        },
        { transaction: t }
      );

      if (req.files && req.files.length > 0) {
        const imagePromises = req.files.map(async (file) => {
          const imageData = await processImage(file);
          return Image.create(
            {
              url: imageData.url,
              thumbnailUrl: imageData.thumbnailUrl,
              productId: product.id,
            },
            { transaction: t }
          );
        });

        await Promise.all(imagePromises);
      }

      // Emit event for new product creation (if using event system)
      emitEvent("newProduct", {
        message: `New product from ${req.user.name}`,
        campus: req.user.campus,
      });

      // Fetch the created product with relations
      return await Product.findOne({
        where: { id: product.id },
        include: [
          { model: Image },
          {
            model: User,
            attributes: ['id', 'name'],
          },
        ],
        transaction: t,
      });
    });

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    logger.error('Error creating product', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// Update an existing product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id); // Convert string to integer
  const { title, description, price, category, campus } = req.body;
  const userId = req.user.id; // Integer

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    // Check if product exists and belongs to user
    const existingProduct = await Product.findOne({ where: { id: productId } });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (existingProduct.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update product within a transaction
    const updatedProduct = await sequelize.transaction(async (t) => {
      await Product.update(
        {
          title: title || undefined,
          description: description || undefined,
          price: price ? Number.parseFloat(price) : undefined,
          category: category || undefined,
          campus: campus || undefined,
        },
        { where: { id: productId }, transaction: t }
      );

      if (req.files && req.files.length > 0) {
        if (req.body.replaceImages === 'true') {
          await Image.destroy({ where: { productId }, transaction: t });
        }

        const imagePromises = req.files.map(async (file) => {
          const imageData = await processImage(file);
          return Image.create(
            {
              url: imageData.url,
              thumbnailUrl: imageData.thumbnailUrl,
              productId,
            },
            { transaction: t }
          );
        });

        await Promise.all(imagePromises);
      }

      // Fetch updated product
      return await Product.findOne({
        where: { id: productId },
        include: [
          { model: Image },
          {
            model: User,
            attributes: ['id', 'name'],
          },
        ],
        transaction: t,
      });
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id); // Convert string to integer
  const userId = req.user.id; // Integer

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    // Check if product exists and belongs to user
    const existingProduct = await Product.findOne({ where: { id: productId } });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (existingProduct.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete product and associated data within a transaction
    await sequelize.transaction(async (t) => {
      await Image.destroy({ where: { productId }, transaction: t });
      await View.destroy({ where: { productId }, transaction: t });
      await Product.destroy({ where: { id: productId }, transaction: t });
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// Get multiple products with filters
exports.getProducts = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query;
  const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit);

  const where = {};
  if (campus) where.campus = campus;
  if (category) where.category = category;

  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    where.isDisabled = false;
  }

  try {
    const products = await Product.findAll({
      where,
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name', 'phone', 'website'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number.parseInt(limit),
      offset,
    });

    const total = await Product.count({ where });

    res.json({
      products,
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get products for the authenticated user
exports.getUserProducts = async (req, res) => {
  const userId = req.user.id; // Integer

  try {
    const products = await Product.findAll({
      where: { userId },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      products,
    });
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Failed to fetch your products' });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const visitorId = req.user?.id || req.headers['x-visitor-id'] || req.ip;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid or missing product ID' });
  }

  const productId = parseInt(id); // Convert string to integer

  try {
    const product = await Product.findOne({
      where: { id: productId },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name', 'phone', 'website', 'role'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (
      product.isDisabled &&
      (!req.user || (req.user.id !== product.userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN'))
    ) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Record view if not already viewed by this visitor
    try {
      const existingView = await View.findOne({
        where: {
          visitorId,
          productId,
        },
      });

      if (!existingView) {
        await sequelize.transaction(async (t) => {
          await View.create(
            {
              visitorId,
              productId,
            },
            { transaction: t }
          );

          await Product.update(
            {
              viewCount: sequelize.literal('viewCount + 1'),
            },
            { where: { id: productId }, transaction: t }
          );
        });

        product.viewCount += 1;
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
};

// Get multiple products by IDs
exports.getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }

    const productIds = ids.split(',').map((id) => parseInt(id)); // Convert each ID to integer

    if (productIds.some((id) => isNaN(id))) {
      return res.status(400).json({ message: 'Invalid product IDs' });
    }

    const products = await Product.findAll({
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
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};