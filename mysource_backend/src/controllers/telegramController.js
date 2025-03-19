import { PrismaClient } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
import { processImage } from "../utils/imageUtils.js"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()
let bot = null

export const handleWebhook = async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.sendStatus(200)
    }

    const chatId = message.chat.id
    const username = message.from.username
    const text = message.text || ""
    const photos = message.photo || []

    // Check if the user's Telegram ID is linked to an account
    const user = await prisma.user.findUnique({
      where: { telegramId: username || chatId.toString() },
    })

    if (!user) {
      if (bot) {
        await bot.sendMessage(
          chatId,
          "Your Telegram account is not linked to Campus Marketplace. Please link your account first.",
        )
      }
      return res.sendStatus(200)
    }

    if (text.startsWith("/search")) {
      // Handle search
      const query = text.replace("/search", "").trim()

      if (!query) {
        if (bot) {
          await bot.sendMessage(chatId, "Please provide a search term. Example: /search laptop")
        }
        return res.sendStatus(200)
      }

      // Search for products
      const products = await prisma.product.findMany({
        where: {
          campus: user.campus,
          OR: [
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      // Search for businesses
      const businesses = await prisma.business.findMany({
        where: {
          campus: user.campus,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })

      // Format and send results
      let responseText = `Search results for "${query}":

`

      if (products.length > 0) {
        responseText += "📦 PRODUCTS:\n"
        products.forEach((product, index) => {
          const shortDesc =
            product.description.length > 50 ? product.description.substring(0, 50) + "..." : product.description

          responseText += `${index + 1}. ${shortDesc}\n`
          responseText += `   Price: ${product.price ? `₦${product.price}` : "Not specified"}\n`
          responseText += `   Link: ${process.env.FRONTEND_URL}/products/${product.id}\n\n`
        })
      }

      if (businesses.length > 0) {
        responseText += "🏪 BUSINESSES:\n"
        businesses.forEach((business, index) => {
          responseText += `${index + 1}. ${business.name}\n`
          responseText += `   Link: ${process.env.FRONTEND_URL}/businesses/${business.id}\n\n`
        })
      }

      if (products.length === 0 && businesses.length === 0) {
        responseText += "No results found for your search."
      }

      if (bot) {
        await bot.sendMessage(chatId, responseText)
      }
    } else if (photos.length > 0 && bot) {
      // Handle product listing
      const photo = photos[photos.length - 1]
      const fileId = photo.file_id

      const fileInfo = await bot.getFile(fileId)
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`

      // Download and process the image
      const { url, thumbnailUrl } = await processImage(fileUrl)

      // Parse product details from caption
      const description = text || "No description provided"
      let price = null

      const priceMatch = description.match(/price:?\s*(\d+)/i)
      if (priceMatch) price = Number.parseFloat(priceMatch[1])

      // Create product
      const product = await prisma.product.create({
        data: {
          description: description.length > 500 ? description.substring(0, 500) + "..." : description,
          price,
          campus: user.campus,
          userId: user.id,
          images: {
            create: [{ url, thumbnailUrl }],
          },
        },
      })

      // Emit event for real-time updates
      emitEvent("newProduct", {
        message: `New product added via Telegram: ${description.substring(0, 30)}...`,
        campus: user.campus,
      })

      await bot.sendMessage(
        chatId,
        `Product added successfully!
Description: ${description.substring(0, 50)}...
Price: ${price ? `₦${price}` : "Not specified"}
View your product: ${process.env.FRONTEND_URL}/products/${product.id}`,
      )
    } else if (bot) {
      await bot.sendMessage(
        chatId,
        `Welcome to Campus Marketplace!

Available commands:
/start - Show this help message
/search [query] - Search for products and businesses
       
To add a product: Send a photo with caption in this format:
Product Description
Price: 1000 (optional)

Your products will be posted to your campus: ${user.campus.toUpperCase()}`,
      )
    }

    res.sendStatus(200)
  } catch (error) {
    console.error("Telegram webhook error:", error)
    res.status(500).json({ error: "Failed to process webhook" })
  }
}

// Send verification code to Telegram user
export const sendVerificationCode = async (req, res) => {
  const { telegramId, code } = req.body

  if (!telegramId || !code) {
    return res.status(400).json({ message: "Telegram ID and verification code are required" })
  }

  try {
    // Check if bot is initialized
    if (!bot) {
      return res.status(500).json({ message: "Telegram bot is not initialized" })
    }

    // Format the Telegram ID correctly
    // Remove @ if present for internal processing
    const formattedId = telegramId.startsWith("@") ? telegramId.substring(1) : telegramId

    try {
      // First try to send by username
      await bot.sendMessage(
        `@${formattedId}`,
        `Your Campus Marketplace verification code is: ${code}

This code will expire in 10 minutes.`,
      )

      res.json({ message: "Verification code sent successfully" })
    } catch (error) {
      console.error("Error sending by username, trying alternative methods:", error)

      // If sending by username fails, try to find the chat ID
      try {
        // Get bot updates to find the chat ID
        const updates = await bot.getUpdates()
        const userChat = updates.find(
          (update) =>
            update.message &&
            update.message.from &&
            (update.message.from.username === formattedId || update.message.from.id.toString() === formattedId),
        )

        if (userChat && userChat.message && userChat.message.chat) {
          // Send using chat ID
          await bot.sendMessage(
            userChat.message.chat.id,
            `Your Campus Marketplace verification code is: ${code}

This code will expire in 10 minutes.`,
          )

          res.json({ message: "Verification code sent successfully" })
        } else {
          throw new Error("User hasn't interacted with the bot yet")
        }
      } catch (secondError) {
        console.error("All sending methods failed:", secondError)
        res.status(400).json({
          message:
            "Failed to send verification code. Please make sure you've started a conversation with our bot first by searching for @YourBotUsername on Telegram and sending it a /start message.",
        })
      }
    }
  } catch (error) {
    console.error("Error sending verification code:", error)
    res.status(500).json({
      message: "Failed to send verification code. Please make sure you've started a conversation with our bot first.",
    })
  }
}

// Function to start the bot and set up commands
export const startBot = () => {
  console.log("Checking Telegram bot configuration...")

  // Check if token is available
  if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === "your_telegram_bot_token") {
    console.warn("Invalid or missing Telegram bot token. Telegram features will be disabled.")
    return
  }

  try {
    // Initialize bot with polling disabled by default
    const usePolling = process.env.TELEGRAM_USE_POLLING === "true"

    console.log(`Initializing Telegram bot with polling ${usePolling ? "enabled" : "disabled"}`)

    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: usePolling,
    })

    if (usePolling) {
      bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id
        const username = msg.from.username

        console.log(`Received /start command from ${username || "unknown user"} (ID: ${chatId})`)

        const user = await prisma.user.findUnique({
          where: { telegramId: username || chatId.toString() },
        })

        if (user) {
          await bot.sendMessage(chatId, `Welcome back to Campus Marketplace, ${user.name}!`)
        } else {
          await bot.sendMessage(
            chatId,
            "Welcome to Campus Marketplace! Please link your account on our website to use this bot.",
          )
        }
      })

      // Set up commands only if polling is enabled
      try {
        bot.setMyCommands([
          { command: "start", description: "Start the bot and get help" },
          { command: "search", description: "Search for products and businesses" },
        ])
        console.log(`Telegram bot commands set up successfully.`)
      } catch (error) {
        console.warn("Could not set Telegram bot commands:", error.message)
      }
    }

    console.log(`Telegram bot initialized successfully. Username: @${process.env.TELEGRAM_BOT_USERNAME || "unknown"}`)
  } catch (error) {
    console.error("Error starting Telegram bot:", error)
    bot = null
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
        telegramId: { not: null },
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
      if (!user.telegramId) continue

      const unreadCount = user.receivedMessages.length
      if (unreadCount === 0) continue

      const telegramId = user.telegramId.startsWith("@") ? user.telegramId : `@${user.telegramId}`

      try {
        await bot.sendMessage(
          telegramId,
          `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""} on Campus Marketplace.

Log in to view and respond: ${process.env.FRONTEND_URL}/messages`,
        )

        console.log(`Sent unread message notification to ${user.name} (${telegramId})`)
      } catch (error) {
        console.error(`Failed to send notification to ${telegramId}:`, error.message)
      }
    }
  } catch (error) {
    console.error("Error sending unread message notifications:", error)
  }
}

