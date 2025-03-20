import { PrismaClient } from "@prisma/client";
import { Telegraf } from "telegraf";
import { processImage } from "../utils/imageUtils.js";
import { emitEvent } from "../utils/eventEmitter.js";

const prisma = new PrismaClient();
let bot;

export const initializeBot = async () => { // Ensure this is exported and async
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("Missing Telegram bot token. Telegram features disabled.");
    return;
  }

  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  const webhookUrl = `${process.env.BACKEND_URL || "https://c75f-102-90-100-116.ngrok-free.app"}/api/telegram/webhook`;

  // Middleware to attach user to context
  bot.use(async (ctx, next) => {
    const telegramId = ctx.from?.id.toString();
    const user = await prisma.user.findFirst({
      where: { telegramChatId: telegramId },
    });
    ctx.user = user;
    return next();
  });

  // /start command
  bot.start(async (ctx) => {
    if (ctx.user) {
      await ctx.reply(`Welcome back, ${ctx.user.name}! Your account is linked.\n\nUse /help for commands.`);
    } else {
      await ctx.reply(
        `Welcome to Campus Marketplace!\n\nTo link your account:\n1. Send /link here to get a code.\n2. Go to ${process.env.FRONTEND_URL}/profile and enter the code.\n\nUse /help for more commands.`
      );
    }
  });

  // /help command
  bot.command("help", (ctx) => {
    ctx.reply(
      `Available commands:\n/start - Welcome message\n/link - Get a code to link your account\n/search <query> - Search products\n\nTo list a product: Send a photo with a caption (e.g., "Laptop for sale\nPrice: 5000").`
    );
  });

  // /link command
bot.command("link", async (ctx) => {
  if (ctx.user) return ctx.reply("Your account is already linked!");

  const chatId = ctx.chat.id.toString();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verification.upsert({
    where: { userId: chatId }, // Now valid with @unique on userId
    update: { code, expiresAt },
    create: { userId: chatId, code, expiresAt },
  });

  ctx.reply(
    `Your linking code is: ${code}\nGo to ${process.env.FRONTEND_URL}/profile, enter this code in the "Link Telegram" section, and submit.`
  );
});

  // /search command
  bot.command("search", async (ctx) => {
    const query = ctx.message.text.replace("/search", "").trim();
    if (!query) return ctx.reply("Please provide a search term: /search <query>");
    if (!ctx.user) return ctx.reply("Link your account first to search.");

    const products = await prisma.product.findMany({
      where: {
        campus: ctx.user.campus,
        OR: [
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    if (products.length === 0) return ctx.reply("No products found.");
    const response = products
      .map((p) => `${p.description.slice(0, 50)}...\nPrice: ₦${p.price || "N/A"}\n${process.env.FRONTEND_URL}/products/${p.id}`)
      .join("\n\n");
    ctx.reply(`Search results for "${query}":\n\n${response}`);
  });

  // Photo upload
  bot.on("photo", async (ctx) => {
    if (!ctx.user) return ctx.reply("Please link your account first.");
    const caption = ctx.message.caption;
    if (!caption) return ctx.reply("Caption is required for product uploads!");

    const photo = ctx.message.photo.pop();
    const fileUrl = await ctx.telegram.getFileLink(photo.file_id);
    const { url, thumbnailUrl } = await processImage(fileUrl);

    const priceMatch = caption.match(/price:?\s*(\d+)/i);
    const product = await prisma.product.create({
      data: {
        description: caption,
        price: priceMatch ? parseFloat(priceMatch[1]) : null,
        campus: ctx.user.campus,
        userId: ctx.user.id,
        images: { create: [{ url, thumbnailUrl }] },
      },
    });

    emitEvent("newProduct", { campus: ctx.user.campus, productId: product.id });
    ctx.reply(`Product listed!\nView: ${process.env.FRONTEND_URL}/products/${product.id}`);
  });

  // Try webhook first, fall back to polling if it fails
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Telegram bot webhook set to ${webhookUrl}`);
  } catch (error) {
    console.error("Webhook setup failed:", error.message);
    if (process.env.TELEGRAM_USE_POLLING === "true") {
      console.log("Falling back to polling for 15 seconds per interaction...");
      bot.launch({
        polling: {
          timeout: 15, // Poll for 15 seconds per update
          limit: 1,    // Process one update at a time
        },
      }).catch((err) => console.error("Polling launch failed:", err));
    } else {
      console.warn("Webhook failed and polling is disabled. Telegram features may be limited.");
    }
  }

  bot.catch((err, ctx) => {
    console.error(`Telegram bot error for ${ctx.updateType}:`, err);
    ctx.reply("Something went wrong. Try again later.");
  });
};

export const handleWebhook = (req, res) => {
  if (!bot) return res.status(503).json({ error: "Bot not initialized" });
  bot.handleUpdate(req.body);
  res.sendStatus(200);
};

export const verifyLink = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code required" });

  const verification = await prisma.verification.findFirst({
    where: { code, expiresAt: { gt: new Date() } },
  });

  if (!verification) return res.status(400).json({ error: "Invalid or expired code" });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { telegramChatId: verification.userId, telegramId: null },
  });

  await prisma.verification.delete({ where: { id: verification.id } });
  res.json({ message: "Telegram account linked successfully" });
};

export const sendNotification = async (chatId, message) => {
  if (!bot) return;
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const notifyNewProduct = async (campus, productId) => {
  const users = await prisma.user.findMany({
    where: { campus, notifyByTelegram: true, telegramChatId: { not: null } },
  });

  users.forEach((user) =>
    sendNotification(
      user.telegramChatId,
      `New product listed in ${campus}: ${process.env.FRONTEND_URL}/products/${productId}`
    )
  );
};