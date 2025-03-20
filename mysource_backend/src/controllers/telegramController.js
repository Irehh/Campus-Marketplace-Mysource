import { PrismaClient } from "@prisma/client";
import { Telegraf } from "telegraf";
import { processImage } from "../utils/imageUtils.js";
import { emitEvent } from "../utils/eventEmitter.js";

const prisma = new PrismaClient();
let bot;

export const initializeBot = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === "your_telegram_bot_token") {
    console.warn("Missing Telegram bot token. Telegram features disabled.");
    return;
  }

  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

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
        `Welcome to Campus Marketplace!\n\nTo link your account:\n1. Go to ${process.env.FRONTEND_URL}/profile\n2. Enter your Telegram ID (@${ctx.from.username || "your_username"}) and get a code.\n3. Send /link <code> here.\n\nUse /help for more commands.`
      );
    }
  });

  // /help command
  bot.command("help", (ctx) => {
    ctx.reply(
      `Available commands:\n/start - Welcome message\n/link <code> - Link your account\n/search <query> - Search products\n\nTo list a product: Send a photo with a caption (e.g., "Laptop for sale\nPrice: 5000").`
    );
  });

  // /link command for account linking
  bot.command("link", async (ctx) => {
    const code = ctx.message.text.split(" ")[1];
    if (!code) {
      return ctx.reply("Please provide a verification code: /link <code>");
    }

    const verification = await prisma.verification.findFirst({
      where: { code, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!verification) {
      return ctx.reply("Invalid or expired code.");
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { telegramChatId: ctx.from.id.toString(), telegramId: ctx.from.username || null },
    });

    await prisma.verification.delete({ where: { id: verification.id } });
    ctx.reply("Account linked successfully! Use /help for commands.");
  });

  // /search command
  bot.command("search", async (ctx) => {
    const query = ctx.message.text.replace("/search", "").trim();
    if (!query) {
      return ctx.reply("Please provide a search term: /search <query>");
    }

    if (!ctx.user) {
      return ctx.reply("Link your account first to search.");
    }

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

    if (products.length === 0) {
      return ctx.reply("No products found.");
    }

    const response = products
      .map((p) => `${p.description.slice(0, 50)}...\nPrice: ₦${p.price || "N/A"}\n${process.env.FRONTEND_URL}/products/${p.id}`)
      .join("\n\n");
    ctx.reply(`Search results for "${query}":\n\n${response}`);
  });

  // Handle product uploads via photo
  bot.on("photo", async (ctx) => {
    if (!ctx.user) {
      return ctx.reply("Please link your account first.");
    }

    const caption = ctx.message.caption;
    if (!caption) {
      return ctx.reply("Caption is required for product uploads!");
    }

    const photo = ctx.message.photo.pop(); // Highest resolution
    const fileUrl = await ctx.telegram.getFileLink(photo.file_id);
    const { url, thumbnailUrl } = await processImage(fileUrl);

    const priceMatch = caption.match(/price:?\s*(\d+)/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    const product = await prisma.product.create({
      data: {
        description: caption,
        price,
        campus: ctx.user.campus,
        userId: ctx.user.id,
        images: { create: [{ url, thumbnailUrl }] },
      },
    });

    emitEvent("newProduct", { campus: ctx.user.campus, productId: product.id });
    ctx.reply(`Product listed!\nView: ${process.env.FRONTEND_URL}/products/${product.id}`);
  });

  // Set webhook or polling
  if (process.env.TELEGRAM_USE_POLLING === "true") {
    bot.launch();
    console.log("Telegram bot started with polling.");
  } else {
    bot.telegram.setWebhook(`${process.env.BACKEND_URL}/api/telegram/webhook`);
    console.log("Telegram bot webhook set.");
  }

  // Error handling
  bot.catch((err, ctx) => {
    console.error(`Telegram bot error for ${ctx.updateType}:`, err);
    ctx.reply("Something went wrong. Try again later.");
  });
};

// Webhook handler
export const handleWebhook = (req, res) => {
  if (!bot) {
    return res.status(503).json({ error: "Bot not initialized" });
  }
  bot.handleUpdate(req.body);
  res.sendStatus(200);
};

// Initiate linking process
export const initiateLink = async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) {
    return res.status(400).json({ error: "Telegram ID required" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verification.create({
    data: {
      code,
      userId: req.user.id,
      expiresAt,
    },
  });

  const message = `Your verification code for Campus Marketplace is: ${code}\nSend /link ${code} to @${process.env.TELEGRAM_BOT_USERNAME}`;
  try {
    await bot.telegram.sendMessage(telegramId, message);
    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(400).json({ error: "Failed to send code. Ensure you've started the bot." });
  }
};

// Send notifications
export const sendNotification = async (chatId, message) => {
  if (!bot) return;
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// Notify users of new products
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

// ... existing code

export const sendUnreadMessageNotifications = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const usersWithUnread = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      notifyByTelegram: true,
      receivedMessages: {
        some: { read: false, createdAt: { lt: oneHourAgo } },
      },
    },
    include: {
      receivedMessages: {
        where: { read: false, createdAt: { lt: oneHourAgo } },
        include: { sender: { select: { name: true } } },
      },
    },
  });

  for (const user of usersWithUnread) {
    const unreadCount = user.receivedMessages.length;
    const message = `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}.\nView: ${process.env.FRONTEND_URL}/messages`;
    await sendNotification(user.telegramChatId, message);
  }
};