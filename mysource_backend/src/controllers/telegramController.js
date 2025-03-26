import { PrismaClient } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()
let bot = null

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Initialize the Telegram bot
export const startBot = () => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn("Telegram bot token not provided, bot will not be initialized")
      return null
    }

    const usePolling = process.env.TELEGRAM_USE_POLLING === "true"
    const options = {
      polling: usePolling
        ? {
            timeout: 10, // 10 seconds polling timeout
            limit: 100, // Get up to 100 updates at once
            allowed_updates: ["message", "callback_query"],
            params: {
              timeout: 10, // API request timeout
            },
          }
        : false,
    }

    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, options)

    // Set up command handlers
    setupCommandHandlers(bot)

    // Set up message handlers
    setupMessageHandlers(bot)

    console.info("Telegram bot initialized successfully")

    if (usePolling) {
      // Set up polling with timeout
      setupPollingWithTimeout(bot)

      // Add error handlers
      bot.on("error", (error) => {
        console.error("Telegram bot error:", error.message || error)
        // Don't crash the server for Telegram errors
      })

      bot.on("polling_error", (error) => {
        console.error("Telegram polling error:", error.message || error)
        // Don't restart polling for network errors
        if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET" || error.code === "ENOTFOUND") {
          console.warn("Network error in Telegram polling. Will retry automatically.")
        }
      })
    }

    return bot
  } catch (error) {
    console.error("Failed to initialize Telegram bot", { error: error.message })
    return null
  }
}

// Set up command handlers for the bot
const setupCommandHandlers = (bot) => {
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    try {
      const chatId = msg.chat.id
      const username = msg.from.username

      console.info("User started bot", { chatId, username })

      // Check if user is already linked
      const existingUser = await prisma.user.findFirst({
        where: { telegramChatId: chatId.toString() },
      })

      if (existingUser) {
        await bot.sendMessage(
          chatId,
          `Welcome back, ${existingUser.name || "User"}! Your account is already linked with Campus Marketplace.

You can:
• Send text to search for products and businesses
• Send an image with caption to post a new product`,
          { parse_mode: "Markdown" },
        )
        return
      }

      // Generate a verification code
      const code = generateVerificationCode()

      // First, try to find an existing verification for this chat ID
      const existingVerification = await prisma.verification.findFirst({
        where: { telegramChatId: chatId.toString() },
      })

      if (existingVerification) {
        // Update the existing verification
        await prisma.verification.update({
          where: { id: existingVerification.id },
          data: {
            code,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
          },
        })
      } else {
        // Create a new verification
        await prisma.verification.create({
          data: {
            telegramChatId: chatId.toString(),
            code,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
          },
        })
      }

      // Send welcome message with verification code
      await bot.sendMessage(
        chatId,
        `Welcome to Campus Marketplace! 🎉\n\nYour verification code is: *${code}*\n\nThis code will expire in 1 hour. Enter it on your profile page to link your Telegram account.`,
        { parse_mode: "Markdown" },
      )

      // Store the chat ID for this user if we have their username
      if (username) {
        try {
          // Check if we have a user with this username
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ telegramId: username }, { telegramId: username.toLowerCase() }],
            },
          })

          if (user) {
            // Update the user with their actual chat ID for more reliable messaging
            await prisma.user.update({
              where: { id: user.id },
              data: {
                telegramChatId: chatId.toString(),
                // Keep the username as well for backward compatibility
                telegramId: username,
              },
            })
          }
        } catch (error) {
          console.error("Error updating user Telegram chat ID:", error)
        }
      }
    } catch (error) {
      console.error("Error handling /start command", { error: error.message })
    }
  })

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    try {
      const chatId = msg.chat.id

      await bot.sendMessage(
        chatId,
        `*Campus Marketplace Bot Help*\n\n` +
          `• /start - Get a verification code to link your account\n` +
          `• /help - Show this help message\n\n` +
          `After linking your account, you can:\n` +
          `• Send text to search for products and businesses\n` +
          `• Send an image with caption to post a new product`,
        { parse_mode: "Markdown" },
      )
    } catch (error) {
      console.error("Error handling /help command", { error: error.message })
    }
  })
}

// Set up message handlers for the bot
const setupMessageHandlers = (bot) => {
  // Handle regular messages (not commands)
  bot.on("message", async (msg) => {
    try {
      // Skip command messages (they're handled separately)
      if (msg.text && msg.text.startsWith("/")) {
        return
      }

      const chatId = msg.chat.id

      // Check if user is linked
      const user = await prisma.user.findFirst({
        where: { telegramChatId: chatId.toString() },
      })

      if (!user) {
        await bot.sendMessage(
          chatId,
          "Your account is not linked with Campus Marketplace. Please use /start to get a verification code and link your account.",
          { parse_mode: "Markdown" },
        )
        return
      }

      // Handle image with caption (product upload)
      if (msg.photo && msg.photo.length > 0) {
        await handleProductUpload(bot, msg, user)
        return
      }

      // Handle text message (search)
      if (msg.text) {
        await handleSearch(bot, msg, user)
        return
      }

      // If we get here, it's an unsupported message type
      await bot.sendMessage(
        chatId,
        "I can only process text messages for search or images with captions for product uploads.",
        { parse_mode: "Markdown" },
      )
    } catch (error) {
      console.error("Error handling message:", error)
      try {
        await bot.sendMessage(msg.chat.id, "Sorry, there was an error processing your message. Please try again later.")
      } catch (sendError) {
        console.error("Error sending error message:", sendError)
      }
    }
  })
}

// Handle product upload from image with caption
const handleProductUpload = async (bot, msg, user) => {
  try {
    const chatId = msg.chat.id
    const caption = msg.caption || ""

    // Check if caption exists
    if (!caption) {
      await bot.sendMessage(
        chatId,
        "Please provide a caption with your image. The caption should include the product description and price.",
        { parse_mode: "Markdown" },
      )
      return
    }

    // Get the largest photo
    const photo = msg.photo[msg.photo.length - 1]
    const fileId = photo.file_id

    // Get file path from Telegram
    const file = await bot.getFile(fileId)
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Download the file using fetch instead of axios
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    // Generate a unique filename
    const filename = `telegram_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`
    const filePath = path.join(uploadDir, filename)
    const relativePath = `uploads/${filename}`

    // Save the file
    const fileStream = fs.createWriteStream(filePath)
    const buffer = await response.arrayBuffer()

    fileStream.write(Buffer.from(buffer))
    fileStream.end()

    await new Promise((resolve, reject) => {
      fileStream.on("finish", resolve)
      fileStream.on("error", reject)
    })

    // Parse caption for title and description
    let title = caption
    let description = ""

    // If caption contains a newline, split into title and description
    if (caption.includes("\n")) {
      const parts = caption.split("\n")
      title = parts[0].trim()
      description = parts.slice(1).join("\n").trim()
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        description: description || title, // Use title as description if none provided
        price: null, // Price is null as specified
        category: "Other", // Default category
        campus: user.campus || "default", // Use user's campus
        userId: user.id,
        isDisabled: false,
        viewCount: 0,
      },
    })

    // Create the image record
    await prisma.image.create({
      data: {
        url: relativePath,
        thumbnailUrl: relativePath,
        productId: product.id,
      },
    })

    // Send confirmation
    await bot.sendMessage(
      chatId,
      `✅ Product posted successfully!\n\n*${title}*\n\nView it on the marketplace: ${process.env.FRONTEND_URL}/products/${product.id}`,
      { parse_mode: "Markdown" },
    )

    console.info(`User ${user.id} posted product ${product.id} via Telegram`)
  } catch (error) {
    console.error("Error handling product upload:", error)
    await bot.sendMessage(msg.chat.id, "Sorry, there was an error posting your product. Please try again later.")
  }
}

// Handle search from text message
const handleSearch = async (bot, msg, user) => {
  try {
    const chatId = msg.chat.id
    const searchQuery = msg.text.trim()

    if (searchQuery.length < 2) {
      await bot.sendMessage(chatId, "Please provide a longer search term (at least 2 characters).")
      return
    }

    // Search for products (limit 10)
    const products = await prisma.product.findMany({
      where: {
        OR: [{ description: { contains: searchQuery } }, { category: { contains: searchQuery } }],
        isDisabled: false,
        campus: user.campus || undefined, // Filter by user's campus if available
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Search for businesses (limit 5)
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery } },
          { description: { contains: searchQuery } },
          { category: { contains: searchQuery } },
        ],
        isDisabled: false,
        campus: user.campus || undefined, // Filter by user's campus if available
      },
      include: {
        images: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Prepare response message
    let responseMessage = `🔍 *Search results for "${searchQuery}"*\n\n`

    if (products.length === 0 && businesses.length === 0) {
      responseMessage += "No results found. Try a different search term."
    } else {
      // Add products to response
      if (products.length > 0) {
        responseMessage += `*Products (${products.length}):*\n`
        products.forEach((product, index) => {
          const price = product.price ? `₦${product.price}` : "Price not specified"
          responseMessage += `${index + 1}. *${product.description.substring(0, 30)}${product.description.length > 30 ? "..." : ""}* - ${price}\n`
          responseMessage += `   ${process.env.FRONTEND_URL}/products/${product.id}\n\n`
        })
      }

      // Add businesses to response
      if (businesses.length > 0) {
        responseMessage += `*Businesses (${businesses.length}):*\n`
        businesses.forEach((business, index) => {
          responseMessage += `${index + 1}. *${business.name}*\n`
          responseMessage += `   ${process.env.FRONTEND_URL}/businesses/${business.id}\n\n`
        })
      }

      responseMessage += `View more results on the website: ${process.env.FRONTEND_URL}/search?q=${encodeURIComponent(searchQuery)}`
    }

    // Send response
    await bot.sendMessage(chatId, responseMessage, { parse_mode: "Markdown" })

    console.info(`User ${user.id} searched for "${searchQuery}" via Telegram`)
  } catch (error) {
    console.error("Error handling search:", error)
    await bot.sendMessage(msg.chat.id, "Sorry, there was an error processing your search. Please try again later.")
  }
}

// Set up polling with timeout
const setupPollingWithTimeout = (bot) => {
  let lastMessageTime = Date.now()

  // Listen for any message
  bot.on("message", () => {
    lastMessageTime = Date.now()
  })

  // Check if we should stop polling
  const checkPollingTimeout = () => {
    const currentTime = Date.now()
    const timeSinceLastMessage = currentTime - lastMessageTime

    // If no messages for 10 seconds, stop polling
    if (timeSinceLastMessage > 10000) {
      console.info("No messages received for 10 seconds, stopping polling")
      bot.stopPolling()

      // Restart polling after a delay
      setTimeout(() => {
        console.info("Restarting polling")
        bot.startPolling()
        lastMessageTime = Date.now()
      }, 30000) // 30 second delay before restarting
    }
  }

  // Check polling timeout every 5 seconds
  setInterval(checkPollingTimeout, 5000)
}

// Verify a Telegram code
export const verifyTelegramCode = async (req, res) => {
  try {
    const { code } = req.body
    const userId = req.user.id

    if (!code) {
      return res.status(400).json({ message: "Verification code is required" })
    }

    // Find the verification record
    const verification = await prisma.verification.findFirst({
      where: {
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    // Add detailed logging to console
    console.log("Verification attempt:", {
      userId,
      codeProvided: code,
      verificationFound: !!verification,
      expiryTime: verification?.expiresAt,
    })

    if (!verification) {
      return res.status(400).json({ message: "Invalid or expired verification code" })
    }

    // Update the user with the Telegram chat ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: verification.telegramChatId,
        telegramId: null, // Clear the old telegramId field
      },
    })

    // Delete the verification record
    await prisma.verification.delete({
      where: { id: verification.id },
    })

    // Send confirmation message to the user on Telegram
    if (bot) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        await bot.sendMessage(
          verification.telegramChatId,
          `Your account has been successfully linked with ${user.name || user.email}! 🎉

You will now receive notifications about your listings and messages.

You can:
• Send text to search for products and businesses
• Send an image with caption to post a new product`,
        )
      } catch (error) {
        console.error("Error sending confirmation message to Telegram:", error)
      }
    }

    return res.status(200).json({ message: "Telegram account linked successfully" })
  } catch (error) {
    // Enhanced error logging to console
    console.error("Error verifying Telegram code:", error)
    console.error("Error details:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      code: req.body?.code,
    })

    return res.status(500).json({
      message: "Failed to verify Telegram code",
      error: error.message,
    })
  }
}

// Send a message to a user via Telegram
export const sendTelegramMessage = async (userId, message) => {
  try {
    if (!bot) {
      console.warn("Telegram bot not initialized, cannot send message")
      return false
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.telegramChatId) {
      console.warn("User has no linked Telegram account", { userId })
      return false
    }

    // Send the message
    await bot.sendMessage(user.telegramChatId, message)
    console.info("Telegram message sent successfully", { userId })
    return true
  } catch (error) {
    console.error("Error sending Telegram message", { error: error.message, userId })
    return false
  }
}

// Function to send notification for unread messages
export const sendUnreadMessageNotifications = async () => {
  if (!bot) {
    console.warn("Telegram bot not initialized. Cannot send unread message notifications.")
    return
  }

  try {
    // Find users with unread messages older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const usersWithUnreadMessages = await prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        notifyByTelegram: true,
        receivedMessages: {
          some: {
            read: false,
            createdAt: { lt: oneHourAgo },
          },
        },
      },
      include: {
        receivedMessages: {
          where: {
            read: false,
            createdAt: { lt: oneHourAgo },
          },
          include: {
            sender: {
              select: { name: true },
            },
          },
        },
      },
    })

    // Send notifications
    for (const user of usersWithUnreadMessages) {
      if (!user.telegramChatId) continue

      const unreadCount = user.receivedMessages.length
      if (unreadCount === 0) continue

      try {
        await bot.sendMessage(
          user.telegramChatId,
          `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""} on Campus Marketplace.

Log in to view and respond: ${process.env.FRONTEND_URL}/messages`,
        )

        console.info(`Sent unread message notification to ${user.name} (${user.telegramChatId})`)
      } catch (error) {
        console.error(`Failed to send notification to ${user.telegramChatId}:`, error.message)
      }
    }
  } catch (error) {
    console.error("Error sending unread message notifications:", error)
  }
}

// Get the bot instance
export const getBot = () => bot

// Webhook handler for Telegram updates
export const handleWebhook = (req, res) => {
  try {
    if (!bot) {
      return res.status(500).json({ message: "Telegram bot not initialized" })
    }

    const update = req.body
    bot.processUpdate(update)
    return res.status(200).json({ message: "Update processed" })
  } catch (error) {
    console.error("Error processing webhook update", { error: error.message })
    return res.status(500).json({ message: "Failed to process update" })
  }
}

