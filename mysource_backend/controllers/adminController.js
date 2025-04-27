const { User, Product, Business, Comment, Message, Image, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../utils/emailUtils');

// Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        role: { [Op.in]: ['ADMIN', 'SUPER_ADMIN'] },
      },
      attributes: ['id', 'name', 'email', 'campus', 'role', 'lastSeen'],
    });

    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

// Get all users (for super admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { campus, search, page = 1, limit = 20 } = req.query;
    const parsedPage = Number.parseInt(page);
    const parsedLimit = Number.parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    // Validate pagination parameters
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ message: 'Invalid page or limit' });
    }

    const where = {};

    if (campus) {
      where.campus = campus;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: [
        'id',
        'name',
        'email',
        'campus',
        'role',
        'lastSeen',
        'createdAt',
        [sequelize.fn('COUNT', sequelize.col('products.id')), 'productsCount'],
        [sequelize.fn('COUNT', sequelize.col('businesses.id')), 'businessesCount'],
      ],
      include: [
        {
          model: Product,
          attributes: [],
          required: false,
        },
        {
          model: Business,
          attributes: [],
          required: false,
        },
      ],
      group: ['User.id'],
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset,
    });

    const total = await User.count({ where });

    res.json({
      users,
      pagination: {
        total,
        page: parsedPage,
        pageSize: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Make a user an admin
exports.makeAdmin = async (req, res) => {
  const { userId, campus } = req.body;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ where: { id: parsedUserId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user role to ADMIN
    const updatedUser = await User.update(
      {
        role: 'ADMIN',
        campus: campus || user.campus,
      },
      {
        where: { id: parsedUserId },
        returning: true,
      }
    );

    const updatedUserData = await User.findOne({
      where: { id: parsedUserId },
      attributes: ['id', 'name', 'email', 'campus', 'role'],
    });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'You are now an admin on Campus Marketplace',
        text: `Congratulations! You have been made an admin for ${campus || user.campus} on Campus Marketplace. You can now manage products, businesses, and users on the platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">You're Now an Admin!</h2>
            <p>Congratulations ${user.name || ''}!</p>
            <p>You have been made an admin for <strong>${campus || user.campus}</strong> on Campus Marketplace.</p>
            <p>As an admin, you can now:</p>
            <ul>
              <li>Manage products and businesses</li>
              <li>Disable content that violates our policies</li>
              <li>Act as a middleman for transactions</li>
              <li>Handle user reports and issues</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a>
            </div>
            <p>Thank you for helping make our platform safe and reliable!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending admin notification email:', emailError);
    }

    res.json({
      message: 'User has been made an admin',
      admin: updatedUserData,
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Failed to make user an admin' });
  }
};

// Remove admin role from a user
exports.removeAdmin = async (req, res) => {
  const { userId } = req.params;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Check if user exists and is an admin
    const user = await User.findOne({ where: { id: parsedUserId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Cannot remove super admin role' });
    }

    // Update user role to USER
    await User.update(
      { role: 'USER' },
      { where: { id: parsedUserId } }
    );

    const updatedUser = await User.findOne({
      where: { id: parsedUserId },
      attributes: ['id', 'name', 'email', 'campus', 'role'],
    });

    res.json({
      message: 'Admin role has been removed',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error removing admin role:', error);
    res.status(500).json({ message: 'Failed to remove admin role' });
  }
};

// Remove a user from the platform (super admin only)
exports.removeUser = async (req, res) => {
  const { userId } = req.params;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({
      where: { id: parsedUserId },
      include: [
        {
          model: Product,
          attributes: [],
          required: false,
        },
        {
          model: Business,
          attributes: [],
          required: false,
        },
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('products.id')), 'productsCount'],
          [sequelize.fn('COUNT', sequelize.col('businesses.id')), 'businessesCount'],
        ],
      },
      group: ['User.id'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Cannot remove a super admin' });
    }

    // Start a transaction to remove user and their content
    const result = await sequelize.transaction(async (t) => {
      const productsRemoved = await Product.destroy({
        where: { userId: parsedUserId },
        transaction: t,
      });

      const businessesRemoved = await Business.destroy({
        where: { userId: parsedUserId },
        transaction: t,
      });

      await Comment.destroy({
        where: { userId: parsedUserId },
        transaction: t,
      });

      await Message.destroy({
        where: {
          [Op.or]: [{ senderId: parsedUserId }, { receiverId: parsedUserId }],
        },
        transaction: t,
      });

      await User.destroy({
        where: { id: parsedUserId },
        transaction: t,
      });

      return {
        productsRemoved,
        businessesRemoved,
      };
    });

    res.json({
      message: `User ${user.name || user.email} has been removed from the platform`,
      details: `Removed ${result.productsRemoved} products and ${result.businessesRemoved} businesses`,
    });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ message: 'Failed to remove user' });
  }
};

// Disable a product
exports.disableProduct = async (req, res) => {
  const { productId } = req.params;
  const { reason } = req.body;

  // Parse productId to integer
  const parsedProductId = parseInt(productId, 10);
  if (isNaN(parsedProductId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    // Check if product exists
    const product = await Product.findOne({
      where: { id: parsedProductId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product to disabled
    await Product.update(
      {
        isDisabled: true,
        disabledReason: reason || 'Violated platform policies',
      },
      { where: { id: parsedProductId } }
    );

    const updatedProduct = await Product.findOne({ where: { id: parsedProductId } });

    // Notify the product owner
    try {
      await sendEmail({
        to: product.User.email,
        subject: 'Your product has been disabled',
        text: `Your product "${product.description.substring(0, 50)}..." has been disabled by an admin. Reason: ${reason || 'Violated platform policies'}. If you believe this is a mistake, please contact our support team.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Product Disabled</h2>
            <p>Hello ${product.User.name || ''},</p>
            <p>Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}"</strong> has been disabled by an admin.</p>
            <p><strong>Reason:</strong> ${reason || 'Violated platform policies'}</p>
            <p>Your product will no longer be visible to other users, but you can still view it in your dashboard.</p>
            <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending product disabled email:', emailError);
    }

    res.json({
      message: 'Product has been disabled',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error disabling product:', error);
    res.status(500).json({ message: 'Failed to disable product' });
  }
};

// Enable a product
exports.enableProduct = async (req, res) => {
  const { productId } = req.params;

  // Parse productId to integer
  const parsedProductId = parseInt(productId, 10);
  if (isNaN(parsedProductId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    // Check if product exists
    const product = await Product.findOne({
      where: { id: parsedProductId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product to enabled
    await Product.update(
      {
        isDisabled: false,
        disabledReason: null,
      },
      { where: { id: parsedProductId } }
    );

    const updatedProduct = await Product.findOne({ where: { id: parsedProductId } });

    // Notify the product owner
    try {
      await sendEmail({
        to: product.User.email,
        subject: 'Your product has been enabled',
        text: `Good news! Your product "${product.description.substring(0, 50)}..." has been enabled and is now visible to other users.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Product Enabled</h2>
            <p>Hello ${product.User.name || ''},</p>
            <p>Good news! Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}"</strong> has been enabled.</p>
            <p>Your product is now visible to other users on the platform.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending product enabled email:', emailError);
    }

    res.json({
      message: 'Product has been enabled',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error enabling product:', error);
    res.status(500).json({ message: 'Failed to enable product' });
  }
};

// Disable a business
exports.disableBusiness = async (req, res) => {
  const { businessId } = req.params;
  const { reason } = req.body;

  // Parse businessId to integer
  const parsedBusinessId = parseInt(businessId, 10);
  if (isNaN(parsedBusinessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    // Check if business exists
    const business = await Business.findOne({
      where: { id: parsedBusinessId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Update business to disabled
    await Business.update(
      {
        isDisabled: true,
        disabledReason: reason || 'Violated platform policies',
      },
      { where: { id: parsedBusinessId } }
    );

    const updatedBusiness = await Business.findOne({ where: { id: parsedBusinessId } });

    // Notify the business owner
    try {
      await sendEmail({
        to: business.User.email,
        subject: 'Your business has been disabled',
        text: `Your business "${business.name}" has been disabled by an admin. Reason: ${reason || 'Violated platform policies'}. If you believe this is a mistake, please contact our support team.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Business Disabled</h2>
            <p>Hello ${business.User.name || ''},</p>
            <p>Your business <strong>"${business.name}"</strong> has been disabled by an admin.</p>
            <p><strong>Reason:</strong> ${reason || 'Violated platform policies'}</p>
            <p>Your business will no longer be visible to other users, but you can still view it in your dashboard.</p>
            <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending business disabled email:', emailError);
    }

    res.json({
      message: 'Business has been disabled',
      business: updatedBusiness,
    });
  } catch (error) {
    console.error('Error disabling business:', error);
    res.status(500).json({ message: 'Failed to disable business' });
  }
};

// Enable a business
exports.enableBusiness = async (req, res) => {
  const { businessId } = req.params;

  // Parse businessId to integer
  const parsedBusinessId = parseInt(businessId, 10);
  if (isNaN(parsedBusinessId)) {
    return res.status(400).json({ message: 'Invalid business ID' });
  }

  try {
    // Check if business exists
    const business = await Business.findOne({
      where: { id: parsedBusinessId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Update business to enabled
    await Business.update(
      {
        isDisabled: false,
        disabledReason: null,
      },
      { where: { id: parsedBusinessId } }
    );

    const updatedBusiness = await Business.findOne({ where: { id: parsedBusinessId } });

    // Notify the business owner
    try {
      await sendEmail({
        to: business.User.email,
        subject: 'Your business has been enabled',
        text: `Good news! Your business "${business.name}" has been enabled and is now visible to other users.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Business Enabled</h2>
            <p>Hello ${business.User.name || ''},</p>
            <p>Good news! Your business <strong>"${business.name}"</strong> has been enabled.</p>
            <p>Your business is now visible to other users on the platform.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Error sending business enabled email:', emailError);
    }

    res.json({
      message: 'Business has been enabled',
      business: updatedBusiness,
    });
  } catch (error) {
    console.error('Error enabling business:', error);
    res.status(500).json({ message: 'Failed to enable business' });
  }
};

// Get all disabled products
exports.getDisabledProducts = async (req, res) => {
  const { campus } = req.query;

  try {
    const whereClause = { isDisabled: true };

    if (req.user.role === 'ADMIN' && req.user.campus) {
      whereClause.campus = req.user.campus;
    } else if (campus) {
      whereClause.campus = campus;
    }

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'campus'],
        },
        Image,
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching disabled products:', error);
    res.status(500).json({ message: 'Failed to fetch disabled products' });
  }
};

// Get all disabled businesses
exports.getDisabledBusinesses = async (req, res) => {
  const { campus } = req.query;

  try {
    const whereClause = { isDisabled: true };

    if (req.user.role === 'ADMIN' && req.user.campus) {
      whereClause.campus = req.user.campus;
    } else if (campus) {
      whereClause.campus = campus;
    }

    const businesses = await Business.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'campus'],
        },
        Image,
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json(businesses);
  } catch (error) {
    console.error('Error fetching disabled businesses:', error);
    res.status(500).json({ message: 'Failed to fetch disabled businesses' });
  }
};

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
  try {
    const whereClause = {};

    if (req.user.role === 'ADMIN' && req.user.campus) {
      whereClause.campus = req.user.campus;
    }

    const [
      totalUsers,
      totalProducts,
      totalBusinesses,
      disabledProducts,
      disabledBusinesses,
      recentUsers,
      recentProducts,
      recentBusinesses,
    ] = await Promise.all([
      User.count({ where: whereClause }),
      Product.count({ where: whereClause }),
      Business.count({ where: whereClause }),
      Product.count({
        where: {
          ...whereClause,
          isDisabled: true,
        },
      }),
      Business.count({
        where: {
          ...whereClause,
          isDisabled: true,
        },
      }),
      User.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'email', 'campus', 'createdAt'],
      }),
      Product.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
          },
          {
            model: Image,
            limit: 1,
          },
        ],
      }),
      Business.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [
          {
            model: User,
            attributes: ['id', 'name'],
          },
          {
            model: Image,
            limit: 1,
          },
        ],
      }),
    ]);

    res.json({
      counts: {
        users: totalUsers,
        products: totalProducts,
        businesses: totalBusinesses,
        disabledProducts,
        disabledBusinesses,
      },
      recent: {
        users: recentUsers,
        products: recentProducts,
        businesses: recentBusinesses,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

// Get campus admin
exports.getCampusAdmin = async (req, res) => {
  const { campus } = req.params;

  if (!campus) {
    return res.status(400).json({ message: 'Campus parameter is required' });
  }

  try {
    const admin = await User.findOne({
      where: {
        campus,
        role: { [Op.in]: ['ADMIN', 'SUPER_ADMIN'] },
        website: { [Op.ne]: null },
      },
      attributes: ['id', 'name', 'email', 'website', 'phone'],
    });

    if (!admin) {
      return res.status(404).json({ message: 'No admin found for this campus' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Error fetching campus admin:', error);
    res.status(500).json({ message: 'Failed to fetch campus admin' });
  }
};

// Get all campus admins
exports.getCampusAdmins = async (req, res) => {
  const { campus } = req.params;

  if (!campus) {
    return res.status(400).json({ message: 'Campus parameter is required' });
  }

  try {
    const admins = await User.findAll({
      where: {
        campus,
        role: { [Op.in]: ['ADMIN', 'SUPER_ADMIN'] },
        website: { [Op.ne]: null },
      },
      attributes: ['id', 'name', 'email', 'website', 'phone', 'role'],
      order: [
        ['role', 'DESC'],
        ['lastSeen', 'DESC'],
      ],
      limit: 2,
    });

    if (admins.length === 0) {
      const superAdmins = await User.findAll({
        where: {
          role: 'SUPER_ADMIN',
          website: { [Op.ne]: null },
        },
        attributes: ['id', 'name', 'email', 'website', 'phone', 'role'],
        order: [['lastSeen', 'DESC']],
        limit: 2,
      });

      if (superAdmins.length === 0) {
        return res.status(404).json({ message: 'No admins found' });
      }

      return res.json(superAdmins);
    }

    res.json(admins);
  } catch (error) {
    console.error('Error fetching campus admins:', error);
    res.status(500).json({ message: 'Failed to fetch campus admins' });
  }
};

// Get dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  const userId = req.user.id; // Integer from auth middleware
  const { campus } = req.query; // Optional campus filter
  const role = req.user.role; // ADMIN or SUPER_ADMIN
  const userCampus = req.user.campus; // e.g., unilag

  try {
    // Build where clauses
    const userWhere = role === 'SUPER_ADMIN' ? {} : { campus: userCampus };
    if (campus && role === 'SUPER_ADMIN') {
      userWhere.campus = campus;
    }

    const productWhere = role === 'SUPER_ADMIN' ? {} : { campus: userCampus };
    if (campus && role === 'SUPER_ADMIN') {
      productWhere.campus = campus;
    }

    const businessWhere = role === 'SUPER_ADMIN' ? {} : { campus: userCampus };
    if (campus && role === 'SUPER_ADMIN') {
      businessWhere.campus = campus;
    }

    // Fetch metrics
    const [totalUsers, totalProducts, totalBusinesses, disabledProducts, disabledBusinesses] =
      await Promise.all([
        User.count({ where: userWhere }),
        Product.count({ where: productWhere }),
        Business.count({ where: businessWhere }),
        Product.count({ where: { ...productWhere, isDisabled: true } }),
        Business.count({ where: { ...businessWhere, isDisabled: true } }),
      ]);

    // Users by campus
    let usersByCampus = {};
    if (role === 'SUPER_ADMIN' && !campus) {
      const results = await User.findAll({
        attributes: ['campus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['campus'],
      });
      usersByCampus = results.reduce((acc, { campus, dataValues }) => {
        acc[campus] = dataValues.count;
        return acc;
      }, {});
    } else if (campus) {
      usersByCampus = { [campus]: totalUsers };
    } else {
      usersByCampus = { [userCampus]: totalUsers };
    }

    // Products by category
    const productsByCategoryResults = await Product.findAll({
      where: productWhere,
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['category'],
    });
    const productsByCategory = productsByCategoryResults.reduce((acc, { category, dataValues }) => {
      acc[category] = dataValues.count;
      return acc;
    }, {});

    // Businesses by category
    const businessesByCategoryResults = await Business.findAll({
      where: businessWhere,
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['category'],
    });
    const businessesByCategory = businessesByCategoryResults.reduce((acc, { category, dataValues }) => {
      acc[category] = dataValues.count;
      return acc;
    }, {});

    res.json({
      totalUsers,
      totalProducts,
      totalBusinesses,
      disabledProducts,
      disabledBusinesses,
      usersByCampus,
      productsByCategory,
      businessesByCategory,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
};