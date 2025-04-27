const { Message, User, Product, Business, sequelize } = require('../models');
const { Op } = require('sequelize');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');
const { emitEvent } = require('../utils/eventEmitter');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Create a test email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
    pass: process.env.EMAIL_PASS || 'ethereal_pass',
  },
});

// Get all messages for a user
exports.getMessages = async (req, res) => {
  const userId = req.user.id; // Integer

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name'],
        },
        {
          model: Product,
          attributes: ['id', 'description'],
        },
        {
          model: Business,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  const userId = req.user.id; // Integer
  const { otherUserId } = req.params;

  // Parse otherUserId to integer
  const parsedOtherUserId = parseInt(otherUserId, 10);
  if (isNaN(parsedOtherUserId)) {
    return res.status(400).json({ message: 'Invalid other user ID' });
  }

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: parsedOtherUserId,
          },
          {
            senderId: parsedOtherUserId,
            receiverId: userId,
          },
        ],
      },
      include: [
        {
          model: Product,
          attributes: ['id', 'description'],
        },
        {
          model: Business,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Mark messages as read
    const unreadMessages = messages.filter((message) => message.receiverId === userId && !message.read);

    if (unreadMessages.length > 0) {
      await Message.update(
        { read: true },
        {
          where: {
            id: { [Op.in]: unreadMessages.map((message) => message.id) },
          },
        }
      );
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  const senderId = req.user.id; // Integer
  const { receiverId, content, productId, businessId } = req.body;

  // Validate required fields
  if (!content || !receiverId) {
    return res.status(400).json({ message: 'Receiver and content are required' });
  }

  // Parse receiverId to integer
  const parsedReceiverId = parseInt(receiverId, 10);
  if (isNaN(parsedReceiverId)) {
    return res.status(400).json({ message: 'Invalid receiver ID' });
  }

  // Parse productId and businessId to integers if provided
  let parsedProductId = null;
  if (productId) {
    parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
  }

  let parsedBusinessId = null;
  if (businessId) {
    parsedBusinessId = parseInt(businessId, 10);
    if (isNaN(parsedBusinessId)) {
      return res.status(400).json({ message: 'Invalid business ID' });
    }
  }

  try {
    // Check if receiver exists
    const receiver = await User.findOne({ where: { id: parsedReceiverId } });

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create message
    const message = await Message.create({
      content,
      senderId,
      receiverId: parsedReceiverId,
      productId: parsedProductId,
      businessId: parsedBusinessId,
    });

    // Fetch message with relations
    const messageWithRelations = await Message.findOne({
      where: { id: message.id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'campus'],
        },
        {
          model: Product,
          attributes: ['id', 'description'],
        },
        {
          model: Business,
          attributes: ['id', 'name'],
        },
      ],
    });

    // Emit event for real-time updates
    emitEvent('newMessage', {
      message: `New message from ${req.user.name || 'Someone'} in ${req.user.campus}`,
      campus: req.user.campus,
    });

    // Check if this is the first message from this sender to this receiver
    const previousMessages = await Message.findAll({
      where: {
        senderId,
        receiverId: parsedReceiverId,
        id: { [Op.ne]: message.id },
      },
      limit: 1,
    });

    const isFirstMessage = previousMessages.length === 0;

    // Send notification via Telegram if enabled
    if (receiver.telegramId && receiver.notifyByTelegram) {
      try {
        let itemInfo = '';
        if (messageWithRelations.Product) {
          itemInfo = `about your product: ${messageWithRelations.Product.description.substring(0, 30)}...`;
        } else if (messageWithRelations.Business) {
          itemInfo = `about your business: ${messageWithRelations.Business.name}`;
        }

        const telegramRecipient = receiver.telegramId.startsWith('@')
          ? receiver.telegramId
          : `@${receiver.telegramId}`;

        await bot.sendMessage(
          telegramRecipient,
          `New message from ${req.user.name || 'Someone'} ${itemInfo}:\n\n"${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"\n\nLogin to Campus Marketplace to reply.`
        );
      } catch (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    }

    // Send email notification for first message
    if (isFirstMessage) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Campus Marketplace" <no-reply@campusmarketplace.com>',
          to: receiver.email,
          subject: 'New message on Campus Marketplace',
          text: `You have a new message from ${req.user.name || 'Someone'} on Campus Marketplace.\n\nMessage: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"\n\nLogin to Campus Marketplace to view and reply to this message.`,
          html: `<p>You have a new message from <strong>${req.user.name || 'Someone'}</strong> on Campus Marketplace.</p><p><em>Message:</em> "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"</p><p>Login to Campus Marketplace to view and reply to this message.</p>`,
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    res.status(201).json(messageWithRelations);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  const userId = req.user.id; // Integer
  const { messageIds } = req.body;

  // Validate messageIds
  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ message: 'Message IDs are required' });
  }

  // Parse messageIds to integers
  const parsedMessageIds = messageIds.map((id) => parseInt(id, 10));
  if (parsedMessageIds.some(isNaN)) {
    return res.status(400).json({ message: 'Invalid message IDs' });
  }

  try {
    // Ensure user can only mark messages where they are the receiver
    const messages = await Message.findAll({
      where: {
        id: { [Op.in]: parsedMessageIds },
        receiverId: userId,
      },
    });

    const validMessageIds = messages.map((message) => message.id);

    if (validMessageIds.length === 0) {
      return res.status(403).json({ message: 'No valid messages to mark as read' });
    }

    await Message.update(
      { read: true },
      {
        where: {
          id: { [Op.in]: validMessageIds },
        },
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Toggle Telegram notifications
exports.toggleNotifications = async (req, res) => {
  const userId = req.user.id; // Integer
  const { notifyByTelegram } = req.body;

  if (typeof notifyByTelegram !== 'boolean') {
    return res.status(400).json({ message: 'notifyByTelegram must be a boolean' });
  }

  try {
    await User.update(
      { notifyByTelegram },
      { where: { id: userId } }
    );

    const updatedUser = await User.findOne({
      where: { id: userId },
      attributes: ['notifyByTelegram'],
    });

    res.json({ notifyByTelegram: updatedUser.notifyByTelegram });
  } catch (error) {
    console.error('Error toggling notifications:', error);
    res.status(500).json({ message: 'Failed to toggle notifications' });
  }
};

// Get unread messages count
exports.getUnreadCount = async (req, res) => {
  const userId = req.user.id; // Integer

  try {
    const count = await Message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    res.status(500).json({ message: 'Failed to get unread messages count' });
  }
};