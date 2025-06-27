const { User, Product, Business, Verification, Image, sequelize } = require('../models');
const { Op } = require('sequelize');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fetch = require('node-fetch').default;
import { REACT_APP_API_URL  } from '../../mysource_frontend/src/config';

let bot = null;

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize the Telegram bot
exports.startBot = () => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('Telegram bot token not provided, bot will not be initialized');
      return null;
    }

    const usePolling = process.env.TELEGRAM_USE_POLLING === 'true';
    const options = {
      polling: usePolling
        ? {
            timeout: 10,
            limit: 100,
            allowed_updates: ['message', 'callback_query'],
            params: { timeout: 10 },
          }
        : false,
    };

    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, options);

    // Set up command handlers
    setupCommandHandlers(bot);

    // Set up message handlers
    setupMessageHandlers(bot);

    console.info('Telegram bot initialized successfully');

    if (usePolling) {
      // Set up polling with timeout
      setupPollingWithTimeout(bot);

      // Add error handlers
      bot.on('error', (error) => {
        console.error('Telegram bot error:', error.message || error);
      });

      bot.on('polling_error', (error) => {
        console.error('Telegram polling error:', error.message || error);
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
          console.warn('Network error in Telegram polling. Will retry automatically.');
        }
      });
    }

    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot', { error: error.message });
    return null;
  }
};

// Set up command handlers for the bot
const setupCommandHandlers = (bot) => {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    try {
      const chatId = msg.chat.id.toString(); // telegramChatId is String
      const username = msg.from.username;

      console.info('User started bot', { chatId, username });

      // Check if user is already linked
      const existingUser = await User.findOne({
        where: { telegramChatId: chatId },
      });

      if (existingUser) {
        await bot.sendMessage(
          chatId,
          `Welcome back, ${existingUser.name || 'User'}! Your account is already linked with Campus Marketplace.\n\nYou can:\n• Send text to search for products and businesses\n• Send an image with caption to post a new product`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Generate a verification code
      const code = generateVerificationCode();

      // First, try to find an existing verification for this chat ID
      const existingVerification = await Verification.findOne({
        where: { telegramChatId: chatId },
      });

      if (existingVerification) {
        // Update the existing verification
        await Verification.update(
          {
            code,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
          },
          { where: { id: existingVerification.id } }
        );
      } else {
        // Create a new verification
        await Verification.create({
          telegramChatId: chatId,
          code,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
        });
      }

      // Send welcome message with verification code
      await bot.sendMessage(
        chatId,
        `Welcome to Campus Marketplace! 🎉\n\nYour verification code is: *${code}*\n\nThis code will expire in 1 hour. Enter it on your profile page to link your Telegram account.`,
        { parse_mode: 'Markdown' }
      );

      // Store the chat ID for this user if we have their username
      if (username) {
        try {
          // Check if we have a user with this username
          const user = await User.findOne({
            where: {
              [Op.or]: [{ telegramId: username }, { telegramId: username.toLowerCase() }],
            },
          });

          if (user) {
            // Update the user with their actual chat ID
            await User.update(
              {
                telegramChatId: chatId,
                telegramId: username,
              },
              { where: { id: user.id } }
            );
          }
        } catch (error) {
          console.error('Error updating user Telegram chat ID:', error);
        }
      }
    } catch (error) {
      console.error('Error handling /start command', { error: error.message });
    }
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    try {
      const chatId = msg.chat.id.toString(); // telegramChatId is String

      await bot.sendMessage(
        chatId,
        `*Campus Marketplace Bot Help*\n\n` +
          `• /start - Get a verification code to link your account\n` +
          `• /help - Show this help message\n\n` +
          `After linking your account, you can:\n` +
          `• Send text to search for products and businesses\n` +
          `• Send an image with caption to post a new product`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error handling /help command', { error: error.message });
    }
  });
};

// Set up message handlers for the bot
const setupMessageHandlers = (bot) => {
  bot.on('message', async (msg) => {
    try {
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id.toString(); // telegramChatId is String

      // Check if user is linked
      const user = await User.findOne({
        where: { telegramChatId: chatId },
      });

      if (!user) {
        await bot.sendMessage(
          chatId,
          'Your account is not linked with Campus Marketplace. Please use /start to get a verification code and link your account.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Handle image with caption (product upload)
      if (msg.photo && msg.photo.length > 0) {
        await handleProductUpload(bot, msg, user);
        return;
      }

      // Handle text message (search)
      if (msg.text) {
        await handleSearch(bot, msg, user);
        return;
      }

      await bot.sendMessage(
        chatId,
        'I can only process text messages for search or images with captions for product uploads.',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error handling message:', error);
      try {
        await bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your message. Please try again later.');
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }
    }
  });
};

// Handle product upload from image with caption
const handleProductUpload = async (bot, msg, user) => {
  try {
    const chatId = msg.chat.id.toString(); // telegramChatId is String
    const caption = msg.caption || '';

    if (!caption) {
      await bot.sendMessage(
        chatId,
        'Please provide a caption with your image. The caption should include the product title and description.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get the largest photo
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;

    // Get file path from Telegram
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    // Create uploads directory
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Download the file using fetch
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Generate filenames
    const filename = `telegram_${Date.now()}_${Math.floor(Math.random() * 10000)}.webp`;
    const filePath = path.join(uploadDir, filename);
    const relativePath = `${REACT_APP_API_URL || 'https://mysource.com.ng'}/Uploads/${filename}`;

    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadDir, thumbnailFilename);
    const thumbnailRelativePath = `${REACT_APP_API_URL || 'https://mysource.com.ng'}/Uploads/${thumbnailFilename}`;

    // Process and save images
    await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);

    await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 60 })
      .toFile(thumbnailPath);

    // Parse caption
    let title = caption;
    let description = '';

    if (caption.includes('\n')) {
      const parts = caption.split('\n');
      title = parts[0].trim();
      description = parts.slice(1).join('\n').trim();
    }

    // Create the product and image within a transaction
    const product = await sequelize.transaction(async (t) => {
      const newProduct = await Product.create(
        {
          description: description || title,
          price: null,
          category: 'Other',
          campus: user.campus || 'default',
          userId: user.id,
          isDisabled: false,
          viewCount: 0,
        },
        { transaction: t }
      );

      await Image.create(
        {
          url: relativePath,
          thumbnailUrl: thumbnailRelativePath,
          productId: newProduct.id,
        },
        { transaction: t }
      );

      return newProduct;
    });

    // Send confirmation
    await bot.sendMessage(
      chatId,
      `✅ Product posted successfully!\n\n*${title}*\n\nView it on the marketplace: ${process.env.FRONTEND_URL}/products/${product.id}`,
      { parse_mode: 'Markdown' }
    );

    console.info(`User ${user.id} posted product ${product.id} via Telegram`);

    // Check for keyword notifications
    await sendKeywordNotifications(product, description || title);
  } catch (error) {
    console.error('Error handling product upload:', error);
    await bot.sendMessage(msg.chat.id, 'Sorry, there was an error posting your product. Please try again later.');
  }
};

// Send notifications to users with matching keywords
const sendKeywordNotifications = async (product, description) => {
  try {
    // Find users with notification keywords
    const usersWithKeywords = await User.findAll({
      where: {
        notificationKeywords: { [Op.ne]: null },
      },
      attributes: ['id', 'name', 'email', 'telegramChatId', 'notifyByTelegram', 'notificationKeywords'],
    });

    if (usersWithKeywords.length === 0) return;

    for (const user of usersWithKeywords) {
      if (!user.notificationKeywords) continue;

      const keywords = user.notificationKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0);

      if (keywords.length === 0) continue;

      const descriptionLower = description.toLowerCase();
      const matchingKeywords = keywords.filter((keyword) => descriptionLower.includes(keyword));

      if (matchingKeywords.length === 0) continue;

      console.log(`Sending keyword notification to user ${user.id} for keywords: ${matchingKeywords.join(', ')}`);

      if (user.notifyByTelegram && user.telegramChatId) {
        try {
          await bot.sendMessage(
            user.telegramChatId,
            `🔔 *New Product Alert!*\n\nA new product matching your keywords (${matchingKeywords.join(', ')}) has been posted:\n\n*${description.substring(0, 50)}${description.length > 50 ? '...' : ''}*\n\nView it here: ${process.env.FRONTEND_URL}/products/${product.id}`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.error(`Failed to send Telegram notification to user ${user.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error sending keyword notifications:', error);
  }
};

// Handle search from text message
const handleSearch = async (bot, msg, user) => {
  try {
    const chatId = msg.chat.id.toString(); // telegramChatId is String
    const searchQuery = msg.text.trim();

    if (searchQuery.length < 2) {
      await bot.sendMessage(chatId, 'Please provide a longer search term (at least 2 characters).');
      return;
    }

    // Search for products
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { description: { [Op.like]: `%${searchQuery}%` } },
          { category: { [Op.like]: `%${searchQuery}%` } },
        ],
        isDisabled: false,
        campus: user.campus || { [Op.ne]: null },
      },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // Search for businesses
    const businesses = await Business.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchQuery}%` } },
          { description: { [Op.like]: `%${searchQuery}%` } },
          { category: { [Op.like]: `%${searchQuery}%` } },
        ],
        isDisabled: false,
        campus: user.campus || { [Op.ne]: null },
      },
      include: [
        { model: Image },
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Prepare response message
    let responseMessage = `🔍 *Search results for "${searchQuery}"*\n\n`;

    if (products.length === 0 && businesses.length === 0) {
      responseMessage += 'No results found. Try a different search term.';
    } else {
      if (products.length > 0) {
        responseMessage += `*Products (${products.length}):*\n`;
        products.forEach((product, index) => {
          const price = product.price ? `₦${product.price}` : 'Price not specified';
          responseMessage += `${index + 1}. *${product.description.substring(0, 30)}${product.description.length > 30 ? '...' : ''}* - ${price}\n`;
          responseMessage += `   ${process.env.FRONTEND_URL}/products/${product.id}\n\n`;
        });
      }

      if (businesses.length > 0) {
        responseMessage += `*Businesses (${businesses.length}):*\n`;
        businesses.forEach((business, index) => {
          responseMessage += `${index + 1}. *${business.name}*\n`;
          responseMessage += `   ${process.env.FRONTEND_URL}/businesses/${business.id}\n\n`;
        });
      }

      responseMessage += `View more results on the website: ${process.env.FRONTEND_URL}/search?q=${encodeURIComponent(searchQuery)}`;
    }

    await bot.sendMessage(chatId, responseMessage, { parse_mode: 'Markdown' });

    console.info(`User ${user.id} searched for "${searchQuery}" via Telegram`);
  } catch (error) {
    console.error('Error handling search:', error);
    await bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your search. Please try again later.');
  }
};

// Set up polling with timeout
const setupPollingWithTimeout = (bot) => {
  let lastMessageTime = Date.now();

  bot.on('message', () => {
    lastMessageTime = Date.now();
  });

  const checkPollingTimeout = () => {
    const currentTime = Date.now();
    const timeSinceLastMessage = currentTime - lastMessageTime;

    if (timeSinceLastMessage > 10000) {
      console.info('No messages received for 10 seconds, stopping polling');
      bot.stopPolling();

      setTimeout(() => {
        console.info('Restarting polling');
        bot.startPolling();
        lastMessageTime = Date.now();
      }, 30000);
    }
  };

  setInterval(checkPollingTimeout, 5000);
};

// Verify a Telegram code
exports.verifyTelegramCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id; // Integer

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    // Find the verification record
    const verification = await Verification.findOne({
      where: {
        code,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    console.log('Verification attempt:', {
      userId,
      codeProvided: code,
      verificationFound: !!verification,
      expiryTime: verification?.expiresAt,
    });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Update the user with the Telegram chat ID
    await User.update(
      {
        telegramChatId: verification.telegramChatId,
        telegramId: null,
      },
      { where: { id: userId } }
    );

    // Delete the verification record
    await Verification.destroy({
      where: { id: verification.id },
    });

    // Send confirmation message to the user on Telegram
    if (bot) {
      try {
        const user = await User.findOne({
          where: { id: userId },
        });

        await bot.sendMessage(
          verification.telegramChatId,
          `Your account has been successfully linked with ${user.name || user.email}! 🎉\n\nYou will now receive notifications about your listings and messages.\n\nYou can:\n• Send text to search for products and businesses\n• Send an image with caption to post a new product`
        );
      } catch (error) {
        console.error('Error sending confirmation message to Telegram:', error);
      }
    }

    return res.status(200).json({ message: 'Telegram account linked successfully' });
  } catch (error) {
    console.error('Error verifying Telegram code:', error);
    console.error('Error details:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      code: req.body?.code,
    });

    return res.status(500).json({
      message: 'Failed to verify Telegram code',
      error: error.message,
    });
  }
};

// Send a message to a user via Telegram
exports.sendTelegramMessage = async (userId, message) => {
  try {
    if (!bot) {
      console.warn('Telegram bot not initialized, cannot send message');
      return false;
    }

    // Find the user
    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user || !user.telegramChatId) {
      console.warn('User has no linked Telegram account', { userId });
      return false;
    }

    // Send the message
    await bot.sendMessage(user.telegramChatId, message);
    console.info('Telegram message sent successfully', { userId });
    return true;
  } catch (error) {
    console.error('Error sending Telegram message', { error: error.message, userId });
    return false;
  }
};

// Function to send notification for unread messages
exports.sendUnreadMessageNotifications = async () => {
  if (!bot) {
    console.warn('Telegram bot not initialized. Cannot send unread message notifications.');
    return;
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const usersWithUnreadMessages = await User.findAll({
      where: {
        telegramChatId: { [Op.ne]: null },
        notifyByTelegram: true,
      },
      include: [
        {
          model: Message,
          as: 'receivedMessages',
          where: {
            read: false,
            createdAt: { [Op.lt]: oneHourAgo },
          },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    for (const user of usersWithUnreadMessages) {
      if (!user.telegramChatId) continue;

      const unreadCount = user.receivedMessages.length;
      if (unreadCount === 0) continue;

      try {
        await bot.sendMessage(
          user.telegramChatId,
          `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''} on Campus Marketplace.\n\nLog in to view and respond: ${process.env.FRONTEND_URL}/messages`
        );

        console.info(`Sent unread message notification to ${user.name} (${user.telegramChatId})`);
      } catch (error) {
        console.error(`Failed to send notification to ${user.telegramChatId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error sending unread message notifications:', error);
  }
};

// Get the bot instance
exports.getBot = () => bot;

// Webhook handler for Telegram updates
exports.handleWebhook = (req, res) => {
  try {
    if (!bot) {
      return res.status(500).json({ message: 'Telegram bot not initialized' });
    }

    const update = req.body;
    bot.processUpdate(update);
    return res.status(200).json({ message: 'Update processed' });
  } catch (error) {
    console.error('Error processing webhook update', { error: error.message });
    return res.status(500).json({ message: 'Failed to process update' });
  }
};