import { PrismaClient } from "@prisma/client"
import TelegramBot from "node-telegram-bot-api"
import { processImage } from "../utils/imageUtils.js"
import { emitEvent } from "../utils/eventEmitter.js"

const prisma = new PrismaClient()
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })

export const handleWebhook = async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.sendStatus(200)
    }

    const chatId = message.chat.id
    const text = message.text || ""
    const photos = message.photo || []

    // Check if the user's Telegram ID is linked to an account
    const user = await prisma.user.findUnique({
      where: { telegramId: chatId.toString() },
    })

    if (!user) {
      await bot.sendMessage(
        chatId,
        "Your Telegram account is not linked to Campus Marketplace. Please link your account first.",
      )
      return res.sendStatus(200)
    }

    if (text.startsWith("/search")) {
      // Handle search...
    } else if (photos.length > 0) {
      // Handle product listing...
      const photo = photos[photos.length - 1]
      const fileId = photo.file_id

      const fileInfo = await bot.getFile(fileId)
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`

      // Download and process the image
      const { url, thumbnailUrl } = await processImage(fileUrl)

      // Parse product details from caption
      const caption = text || ""
      let description = "Untitled Product"
      let price = null

      const lines = caption.split("\n")
      if (lines.length > 1) description = lines.slice(1).join("\n")

      const priceMatch = caption.match(/price:?\s*(\d+)/i)
      if (priceMatch) price = Number.parseFloat(priceMatch[1])

      // Create product
      const product = await prisma.product.create({
        data: {
          description,
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
        message: `New product added via Telegram: ${description}`,
      })

      await bot.sendMessage(
        chatId,
        `Product added successfully!\nTitle: ${description}\nPrice: ${price ? `₦${price}` : "Not specified"}`,
      )
    } else {
      await bot.sendMessage(
        chatId,
        "Welcome to Campus Marketplace!\n\nTo search: /search [query]\nTo add a product: Send a photo with caption in this format:\nProduct Title\nDescription\nPrice: 1000",
      )
    }

    res.sendStatus(200)
  } catch (error) {
    console.error("Telegram webhook error:", error)
    res.status(500).json({ error: "Failed to process webhook" })
  }
}

// Function to start the bot and set up commands
export const startBot = () => {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    const user = await prisma.user.findUnique({
      where: { telegramId: chatId.toString() },
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

  // Set up other bot commands as needed
}

