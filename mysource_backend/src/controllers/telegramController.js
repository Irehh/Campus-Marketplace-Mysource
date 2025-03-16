import { PrismaClient } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
import { processImage } from "../utils/imageUtils.js"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

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
      await bot.sendMessage(
        chatId,
        "Your Telegram account is not linked to Campus Marketplace. Please link your account first.",
      )
      return res.sendStatus(200)
    }

    if (text.startsWith("/search")) {
      // Handle search
      const query = text.replace("/search", "").trim()

      if (!query) {
        await bot.sendMessage(chatId, "Please provide a search term. Example: /search laptop")
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
      let responseText = `Search results for "${query}":\n\n`

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

      await bot.sendMessage(chatId, responseText)
    } else if (photos.length > 0) {
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
    } else {
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
    // Format the Telegram ID (ensure it has @ if it's a username)
    const formattedId = telegramId.startsWith("@") ? telegramId : `@${telegramId}`

    // Send the verification code
    await bot.sendMessage(
      formattedId,
      `Your Campus Marketplace verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
    )

    res.json({ message: "Verification code sent successfully" })
  } catch (error) {
    console.error("Error sending verification code:", error)
    res.status(500).json({ message: "Failed to send verification code" })
  }
}

// Function to start the bot and set up commands
export const startBot = () => {
  console.log("Starting Telegram bot...")

  // Check if token is available
  if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === "your_telegram_bot_token") {
    console.error("Invalid Telegram bot token. Please set a valid TELEGRAM_BOT_TOKEN in your .env file.")
    return
  }

  try {
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

    // Set up commands
    bot.setMyCommands([
      { command: "start", description: "Start the bot and get help" },
      { command: "search", description: "Search for products and businesses" },
    ])

    console.log(`Telegram bot started successfully. Username: @${process.env.TELEGRAM_BOT_USERNAME}`)
  } catch (error) {
    console.error("Error starting Telegram bot:", error)
  }
}

// Function to send notification for unread messages
export const sendUnreadMessageNotifications = async () => {
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

      await bot.sendMessage(
        telegramId,
        `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""} on Campus Marketplace.\n\nLog in to view and respond: ${process.env.FRONTEND_URL}/messages`,
      )

      console.log(`Sent unread message notification to ${user.name} (${telegramId})`)
    }
  } catch (error) {
    console.error("Error sending unread message notifications:", error)
  }
}

