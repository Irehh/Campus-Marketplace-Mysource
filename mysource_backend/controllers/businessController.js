const { Business, User, Image, View, sequelize } = require('../models');
const { Op } = require('sequelize');
const { processImage } = require('../utils/imageUtils');

// Create a new business
exports.createBusiness = async (req, res) => {
  const { name, description, category } = req.body;
  const userId = req.user.id; // Integer from auth middleware
  const campus = req.user.campus;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  try {
    // Process image if uploaded
    let imageData = null;
    if (req.file) {
      imageData = await processImage(req.file);
    }

    // Create business within a transaction
    const business = await sequelize.transaction(async (t) => {
      const newBusiness = await Business.create(
        {
          name,
          description,
          category: category || null,
          campus,
          userId,
        },
        { transaction: t }
      );

      if (imageData) {
        await Image.create(
          {
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            businessId: newBusiness.id,
          },
          { transaction: t }
        );
      }

      // Fetch the created business with relations
      return await Business.findOne({
        where: { id: newBusiness.id },
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

    res.status(201).json(business);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ message: 'Failed to create business' });
  }
};

// Update a business
exports.updateBusiness = async (req, res) => {
  const { id } = req.params;
  const businessId = parseInt(id); // Convert string to integer
  const { name, description, category } = req.body;
  const userId = req.user.id; // Integer

  // Validate ID
  if (isNaN(businessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    // Check if business exists and belongs to user
    const business = await Business.findOne({ where: { id: businessId } });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    // Update business
    await Business.update(
      {
        name: name || undefined,
        description: description || undefined,
        category: category || undefined,
      },
      { where: { id: businessId } }
    );

    // Fetch updated business
    const updatedBusiness = await Business.findOne({
      where: { id: businessId },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ message: 'Failed to update business' });
  }
};

// Delete a business
exports.deleteBusiness = async (req, res) => {
  const { id } = req.params;
  const businessId = parseInt(id); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate ID
  if (isNaN(businessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    // Check if business exists and belongs to user
    const business = await Business.findOne({ where: { id: businessId } });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this business' });
    }

    // Delete associated images and views within a transaction
    await sequelize.transaction(async (t) => {
      await Image.destroy({ where: { businessId }, transaction: t });
      await View.destroy({ where: { businessId }, transaction: t });
      await Business.destroy({ where: { id: businessId }, transaction: t });
    });

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ message: 'Failed to delete business' });
  }
};

// Add business images
exports.addBusinessImages = async (req, res) => {
  const { id } = req.params;
  const businessId = parseInt(id); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate ID
  if (isNaN(businessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    // Check if business exists and belongs to user
    const business = await Business.findOne({ where: { id: businessId } });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    // Process images
    const imagePromises = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageData = await processImage(file);
        imagePromises.push(
          Image.create({
            url: imageData.url,
            thumbnailUrl: imageData.thumbnailUrl,
            businessId,
          })
        );
      }
    }

    const images = await Promise.all(imagePromises);
    res.json(images);
  } catch (error) {
    console.error('Error adding business images:', error);
    res.status(500).json({ message: 'Failed to add business images' });
  }
};

// Get businesses for the authenticated user
exports.getUserBusinesses = async (req, res) => {
  const userId = req.user.id; // Integer

  try {
    const businesses = await Business.findAll({
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
      businesses,
    });
  } catch (error) {
    console.error('Error fetching user businesses:', error);
    res.status(500).json({ message: 'Failed to fetch your businesses' });
  }
};

// Delete business image
exports.deleteBusinessImage = async (req, res) => {
  const { id, imageId } = req.params;
  const businessId = parseInt(id); // Convert string to integer
  const parsedImageId = parseInt(imageId); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate IDs
  if (isNaN(businessId) || isNaN(parsedImageId)) {
    return res.status(400).json({ message: 'Invalid business or image ID' });
  }

  try {
    // Check if business exists and belongs to user
    const business = await Business.findOne({
      where: { id: businessId },
      include: [{ model: Image }],
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    // Check if image exists and belongs to this business
    const image = business.Images.find((img) => img.id === parsedImageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete image
    await Image.destroy({ where: { id: parsedImageId } });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting business image:', error);
    res.status(500).json({ message: 'Failed to delete business image' });
  }
};

// Get multiple businesses with filters
exports.getBusinesses = async (req, res) => {
  const { campus, category, limit = 20, page = 1 } = req.query;
  const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit);

  const where = {};
  if (campus) where.campus = campus;
  if (category) where.category = category;

  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    where.isDisabled = false;
  }

  try {
    const businesses = await Business.findAll({
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

    const total = await Business.count({ where });

    res.json({
      businesses,
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'Failed to fetch businesses' });
  }
};

// Get a single business by ID
exports.getBusinessById = async (req, res) => {
  const { id } = req.params;
  const businessId = parseInt(id); // Convert string to integer
  const visitorId = req.user?.id || req.headers['x-visitor-id'] || req.ip;

  // Validate ID
  if (isNaN(businessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    const business = await Business.findOne({
      where: { id: businessId },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name', 'phone', 'website', 'role'],
        },
      ],
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (
      business.isDisabled &&
      (!req.user || (req.user.id !== business.userId && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN'))
    ) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Record view if not already viewed by this visitor
    try {
      const existingView = await View.findOne({
        where: {
          visitorId,
          businessId,
        },
      });

      if (!existingView) {
        await sequelize.transaction(async (t) => {
          await View.create(
            {
              visitorId,
              businessId,
            },
            { transaction: t }
          );

          await Business.update(
            {
              viewCount: sequelize.literal('viewCount + 1'),
            },
            { where: { id: businessId }, transaction: t }
          );
        });

        business.viewCount += 1;
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }

    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ message: 'Failed to fetch business details' });
  }
};

// Get multiple businesses by IDs
exports.getBusinessesByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Business IDs are required' });
    }

    const businessIds = ids.split(',').map((id) => parseInt(id)); // Convert each ID to integer

    // Validate all IDs are numbers
    if (businessIds.some((id) => isNaN(id))) {
      return res.status(400).json({ message: 'Invalid business IDs' });
    }

    const businesses = await Business.findAll({
      where: {
        id: { [Op.in]: businessIds },
        isDisabled: false,
      },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone', 'website', 'avatar'],
        },
      ],
    });

    res.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses by IDs:', error);
    res.status(500).json({ message: 'Failed to fetch businesses' });
  }
};