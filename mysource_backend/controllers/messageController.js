const { Message, User, Product, Business, Gig } = require("../models")
const { Op } = require("sequelize")
const TelegramBot = require("node-telegram-bot-api")
const { sendEmail } = require("../utils/emailUtils.js")
const emailTemplates = require("../utils/emailTemplates.js")
const { emitEvent } = require("../utils/eventEmitter.js")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })

// Get all messages for a user
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id

    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name"],
        },
        {
          model: Product,
          as: "Product",
          attributes: ["id", "description"],
          required: false,
        },
        {
          model: Business,
          as: "Business",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Gig,
          as: "gig",
          attributes: ["id", "description"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    })

    res.json(messages)
  } catch (error) {
    console.error("Error getting messages:", error)
    res.status(500).json({ message: "Failed to get messages" })
  }
}

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id
    const { otherUserId } = req.params

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ["id", "description"],
          required: false,
        },
        {
          model: Business,
          as: "Business",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Gig,
          as: "gig",
          attributes: ["id", "description"],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    })

    // Mark messages as read
    const unreadMessages = messages.filter((message) => message.receiverId === userId && !message.read)

    if (unreadMessages.length > 0) {
      await Message.update(
        { read: true },
        {
          where: {
            id: unreadMessages.map((message) => message.id),
          },
        },
      )
    }

    res.json(messages)
  } catch (error) {
    console.error("Error getting conversation:", error)
    res.status(500).json({ message: "Failed to get conversation" })
  }
}

// Send a message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id
    const { receiverId, content, productId, businessId, gigId } = req.body

    if (!content || !receiverId) {
      return res.status(400).json({ message: "Receiver and content are required" })
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId)

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" })
    }

    // Create message
    const message = await Message.create({
      content,
      senderId,
      receiverId,
      productId: productId || null,
      businessId: businessId || null,
      gigId: gigId || null,
    })

    // Fetch the message with associations
    const messageWithAssociations = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "campus"],
        },
        {
          model: Product,
          as: "Product",
          attributes: ["id", "description"],
          required: false,
        },
        {
          model: Business,
          as: "Business",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Gig,
          as: "gig",
          attributes: ["id", "description"],
          required: false,
        },
      ],
    })

    // Emit event for real-time updates - include campus info
    emitEvent("newMessage", {
      message: `New message from ${req.user.name || "Someone"} in ${req.user.campus}`,
      campus: req.user.campus,
    })

    // Check if this is the first message from this sender to this receiver
    const previousMessages = await Message.findAll({
      where: {
        senderId,
        receiverId,
        id: { [Op.ne]: message.id },
      },
      limit: 1,
    })

    const isFirstMessage = previousMessages.length === 0

    // Send notification via Telegram if user has telegramId and wants notifications
    if (receiver.telegramId && receiver.notifyByTelegram) {
      try {
        let itemInfo = ""
        if (messageWithAssociations.product) {
          itemInfo = `about your product: ${messageWithAssociations.product.description.substring(0, 30)}...`
        } else if (messageWithAssociations.business) {
          itemInfo = `about your business: ${messageWithAssociations.business.name}`
        } else if (messageWithAssociations.gig) {
          itemInfo = `about your gig: ${messageWithAssociations.gig.description.substring(0, 30)}...`
        }

        // Add @ symbol if not present for username
        const telegramRecipient = receiver.telegramId.startsWith("@") ? receiver.telegramId : `@${receiver.telegramId}`

        await bot.sendMessage(
          telegramRecipient,
          `New message from ${req.user.name || "Someone"} ${itemInfo}:
          
"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

Login to Campus Marketplace to reply.`,
        )
      } catch (error) {
        console.error("Failed to send Telegram notification:", error)
      }
    }

    // Send email notification for first message using emailUtils
    if (isFirstMessage) {
      try {
        let itemContext = ""
        if (messageWithAssociations.product) {
          itemContext = `about your product: ${messageWithAssociations.product.description.substring(0, 30)}...`
        } else if (messageWithAssociations.business) {
          itemContext = `about your business: ${messageWithAssociations.business.name}`
        } else if (messageWithAssociations.gig) {
          itemContext = `about your gig: ${messageWithAssociations.gig.description.substring(0, 30)}...`
        }

        // Check if emailTemplates has a newMessage template, otherwise use a simple template
        let emailContent
        if (emailTemplates.newMessage) {
          emailContent = emailTemplates.newMessage(
            receiver.name || "User",
            req.user.name || "Someone",
            content.substring(0, 100) + (content.length > 100 ? "..." : ""),
            itemContext,
          )
        } else {
          // Fallback email content
          emailContent = {
            subject: "New message on Campus Marketplace",
            text: `You have a new message from ${req.user.name || "Someone"} on Campus Marketplace.
            
${itemContext ? `This message is ${itemContext}` : ""}

Message: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

Login to Campus Marketplace to view and reply to this message.`,
            html: `<p>You have a new message from <strong>${req.user.name || "Someone"}</strong> on Campus Marketplace.</p>
            ${itemContext ? `<p><em>This message is ${itemContext}</em></p>` : ""}
            <p><em>Message:</em> "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</p>
            <p>Login to Campus Marketplace to view and reply to this message.</p>`,
          }
        }

        await sendEmail({
          to: receiver.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        })
      } catch (error) {
        console.error("Failed to send email notification:", error)
      }
    }

    res.status(201).json(messageWithAssociations)
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ message: "Failed to send message" })
  }
}

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id
    const { messageIds } = req.body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "Message IDs are required" })
    }

    // Ensure user can only mark messages where they are the receiver
    const messages = await Message.findAll({
      where: {
        id: messageIds,
        receiverId: userId,
      },
    })

    const validMessageIds = messages.map((message) => message.id)

    if (validMessageIds.length === 0) {
      return res.status(403).json({ message: "No valid messages to mark as read" })
    }

    await Message.update(
      { read: true },
      {
        where: {
          id: validMessageIds,
        },
      },
    )

    res.json({ message: "Messages marked as read" })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    res.status(500).json({ message: "Failed to mark messages as read" })
  }
}

// Toggle Telegram notifications
const toggleNotifications = async (req, res) => {
  try {
    const userId = req.user.id
    const { notifyByTelegram } = req.body

    if (typeof notifyByTelegram !== "boolean") {
      return res.status(400).json({ message: "notifyByTelegram must be a boolean" })
    }

    const user = await User.update(
      { notifyByTelegram },
      {
        where: { id: userId },
        returning: true,
      },
    )

    res.json({ notifyByTelegram: user[1][0].notifyByTelegram })
  } catch (error) {
    console.error("Error toggling notifications:", error)
    res.status(500).json({ message: "Failed to toggle notifications" })
  }
}

// Get unread messages count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id

    const count = await Message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    })

    res.json({ count })
  } catch (error) {
    console.error("Error getting unread messages count:", error)
    res.status(500).json({ message: "Failed to get unread messages count" })
  }
}

module.exports = {
  getMessages,
  getConversation,
  sendMessage,
  markAsRead,
  toggleNotifications,
  getUnreadCount,
}
