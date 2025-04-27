const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const fetch = require('node-fetch');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailUtils');
const { passwordReset } = require('../utils/emailTemplates');

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    campus: 'default',
    needsCampusSelection: true,
  });

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Send welcome email
  try {
    const welcomeTemplate = {
      subject: 'Welcome to Campus Marketplace!',
      text: `Hello ${name},\n\nWelcome to Campus Marketplace! We're excited to have you join our community.\n\nBest regards,\nThe Campus Marketplace Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Welcome to Campus Marketplace!</h2>
          <p>Hello ${name},</p>
          <p>We're excited to have you join our community. Here's what you can do:</p>
          <ul>
            <li>Browse products and services from your campus</li>
            <li>List your own products or business</li>
            <li>Connect with other students</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Campus Marketplace Team</p>
        </div>
      `,
    };

    await sendEmail({
      to: email,
      subject: welcomeTemplate.subject,
      text: welcomeTemplate.text,
      html: welcomeTemplate.html,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });
  } catch (emailError) {
    console.error('Error preparing welcome email:', emailError);
  }

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user.toJSON();

  res.status(201).json({
    user: userData,
    token,
  });
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Check if user exists
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Update last seen
  await User.update(
    { lastSeen: new Date() },
    { where: { id: user.id } }
  );

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user.toJSON();

  res.json({
    user: userData,
    token,
  });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  // User is attached by auth middleware
  const userId = req.user.id; // Integer from JWT

  // Update last seen
  await User.update(
    { lastSeen: new Date() },
    { where: { id: userId } }
  );

  // Return user data (excluding password)
  const { password, ...userData } = req.user;

  res.json(userData);
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { name, phone, website, campus } = req.body;
  const userId = req.user.id; // Integer

  // Update user
  const updatedUser = await User.update(
    {
      name: name || undefined,
      phone: phone || undefined,
      website: website || undefined,
      campus: campus || undefined,
      needsCampusSelection: campus ? false : undefined,
      lastSeen: new Date(),
    },
    {
      where: { id: userId },
      returning: true,
    }
  );

  const userData = await User.findOne({
    where: { id: userId },
    attributes: { exclude: ['password'] },
  });

  res.json(userData);
};

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Integer

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new password' });
  }

  // Get user with password
  const user = await User.findOne({ where: { id: userId } });

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  await User.update(
    {
      password: hashedPassword,
      lastSeen: new Date(),
    },
    { where: { id: userId } }
  );

  res.json({ message: 'Password updated successfully' });
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const userData = await response.json();
    const { email, name, sub: googleId } = userData;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    let user = await User.findOne({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        googleId,
        campus: 'default',
        needsCampusSelection: true,
      });
      isNewUser = true;
    } else if (!user.googleId) {
      // Link Google account
      user = await User.update(
        {
          googleId,
          lastSeen: new Date(),
        },
        {
          where: { id: user.id },
          returning: true,
        }
      );
      user = await User.findOne({ where: { id: user.id } });
    } else {
      // Update last seen
      await User.update(
        { lastSeen: new Date() },
        { where: { id: user.id } }
      );
      user = await User.findOne({ where: { id: user.id } });
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        campus: user.campus,
        phone: user.phone,
        website: user.website,
        needsCampusSelection: user.needsCampusSelection || user.campus === 'default',
      },
      token: jwtToken,
      isNewUser,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// Link Telegram account
exports.linkTelegramAccount = async (req, res) => {
  const { telegramId } = req.body;
  const userId = req.user.id; // Integer

  try {
    // Remove @ symbol if present
    const formattedTelegramId = telegramId.startsWith('@') ? telegramId.substring(1) : telegramId;

    // Check if Telegram ID is already linked
    const existingUser = await User.findOne({
      where: {
        telegramId: formattedTelegramId,
        id: { [Op.ne]: userId },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'This Telegram account is already linked to another user. Please use a different Telegram account.',
      });
    }

    // Try to get the chat ID
    let telegramChatId = null;
    try {
      if (global.bot) {
        const updates = await global.bot.getUpdates({ limit: 100 });
        const userChat = updates.find(
          (update) =>
            update.message &&
            update.message.from &&
            (update.message.from.username === formattedTelegramId ||
              update.message.from.username?.toLowerCase() === formattedTelegramId.toLowerCase())
        );

        if (userChat && userChat.message && userChat.message.chat) {
          telegramChatId = userChat.message.chat.id.toString();
        }
      }
    } catch (error) {
      console.error('Error getting Telegram chat ID:', error);
    }

    const updatedUser = await User.update(
      {
        telegramId: formattedTelegramId,
        telegramChatId,
        lastSeen: new Date(),
      },
      {
        where: { id: userId },
        returning: true,
      }
    );

    const userData = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'email', 'campus', 'telegramId', 'telegramChatId', 'phone', 'website'],
    });

    res.json({
      message: 'Telegram account linked successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    res.status(400).json({ message: 'Failed to link Telegram account' });
  }
};

// Unlink Telegram account
exports.unlinkTelegramAccount = async (req, res) => {
  const userId = req.user.id; // Integer

  try {
    const updatedUser = await User.update(
      {
        telegramId: null,
        lastSeen: new Date(),
      },
      {
        where: { id: userId },
        returning: true,
      }
    );

    const userData = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'email', 'campus', 'telegramId', 'phone', 'website'],
    });

    res.json({
      message: 'Telegram account unlinked successfully',
      user: {
        ...userData.toJSON(),
        telegramId: null,
      },
    });
  } catch (error) {
    console.error('Error unlinking Telegram account:', error);
    res.status(400).json({ message: 'Failed to unlink Telegram account' });
  }
};

// Get active users count
exports.getActiveUsersCount = async (req, res) => {
  const { campus } = req.query;

  // Consider users active if seen in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where = {
    lastSeen: { [Op.gte]: oneDayAgo },
  };

  if (campus) {
    where.campus = campus;
  }

  // Get counts
  const activeCount = await User.count({ where });

  const totalCountWhere = campus ? { campus } : {};
  const totalCount = await User.count({ where: totalCountWhere });

  // Format with commas
  const formattedActiveCount = activeCount.toLocaleString();
  const formattedTotalCount = totalCount.toLocaleString();

  res.json({
    activeCount: formattedActiveCount,
    totalCount: formattedTotalCount,
    display: `${formattedActiveCount}, ${formattedTotalCount}`,
  });
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to user
    await User.update(
      {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
      { where: { id: user.id } }
    );

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const template = passwordReset(resetUrl);

    await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    res.json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  try {
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await User.update(
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
      { where: { id: user.id } }
    );

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // Integer

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['notifyByTelegram', 'notificationKeywords'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      notifyByTelegram: user.notifyByTelegram,
      notificationKeywords: user.notificationKeywords || '',
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ message: 'Failed to get notification settings' });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // Integer
    const { notifyByTelegram, notificationKeywords } = req.body;

    // Validate input
    if (typeof notifyByTelegram !== 'boolean') {
      return res.status(400).json({ message: 'notifyByTelegram must be a boolean' });
    }

    // Clean keywords
    let cleanedKeywords = null;
    if (notificationKeywords) {
      cleanedKeywords = notificationKeywords
        .split(',')
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 0)
        .join(',');
    }

    await User.update(
      {
        notifyByTelegram,
        notificationKeywords: cleanedKeywords,
        lastSeen: new Date(),
      },
      { where: { id: userId } }
    );

    const updatedUser = await User.findOne({
      where: { id: userId },
      attributes: ['notifyByTelegram', 'notificationKeywords'],
    });

    res.json({
      message: 'Notification settings updated successfully',
      settings: updatedUser,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
};