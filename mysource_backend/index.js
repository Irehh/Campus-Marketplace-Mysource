require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { fileURLToPath } = require("url");
const { SitemapStream, streamToPromise } = require("sitemap");
const { createGzip } = require("zlib");
const axios = require("axios");
require("express-async-errors");

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const businessRoutes = require("./routes/businessRoutes");
const searchRoutes = require("./routes/searchRoutes");
const telegramRoutes = require("./routes/telegramRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const commentRoutes = require("./routes/commentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pushRoutes = require("./routes/pushRoutes");
const gigRoutes = require("./routes/gigRoutes");
const bidRoutes = require("./routes/bidRoutes");
const walletRoutes = require("./routes/walletRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const feeRoutes = require("./routes/feeRoutes");

// Import middleware
const { errorHandler } = require("./middleware/errorMiddleware");
const { setupMulter } = require("./middleware/uploadMiddleware");
const { apiRateLimit } = require("./middleware/rateLimitMiddleware");

// Import Telegram bot controller
const {
  startBot,
  sendUnreadMessageNotifications,
} = require("./controllers/telegramController");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(apiRateLimit);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://mysource.ng",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    !req.secure &&
    req.get("X-Forwarded-Proto") !== "https"
  ) {
    return res.redirect(`https://${req.get("host")}${req.url}`);
  }
  next(); // Pass control to the next middleware
});

// Optional: Customize Morgan logging (only log errors, not all requests)
app.use(
  morgan("dev", {
    skip: (req, res) => res.statusCode < 400,
  })
);

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Disallow: /`);
});

// Special handling for Paystack webhook
app.use("/api/wallet/webhook", express.raw({ type: "application/json" }));

// Serve static files from uploads directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads"))
);

// Setup multer for file uploads
setupMulter(app);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/fees", feeRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the marketplace" });
});

// Sitemap generation

// Backend robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
# Allow public API endpoints for dynamic content
Allow: /api/products
Allow: /api/products/*
Allow: /api/businesses
Allow: /api/businesses/*
Allow: /api/gigs
Allow: /api/gigs/*
Allow: /api/search
Allow: /health

# Disallow sensitive backend routes
Disallow: /api/auth/
Disallow: /api/admin/
Disallow: /api/messages/
Disallow: /api/comments/
Disallow: /api/favorites/
Disallow: /api/push/
Disallow: /api/bids/
Disallow: /api/wallet/
Disallow: /api/cart/
Disallow: /api/orders/
Disallow: /api/fees/
Disallow: /api/telegram/
Disallow: /api/events/
Disallow: /private/
Disallow: /uploads/
Disallow: /logs/
Disallow: /config/

# Disallow backend-related files
Disallow: /*.env$
Disallow: /*.js$
Disallow: /*.ts$
Disallow: /*.json$
`);
});

// Static frontend routes (from App.js)
const staticRoutes = [
  { url: "/", changefreq: "daily", priority: 1.0 }, // Dynamic content on homepage
  { url: "/products", changefreq: "daily", priority: 0.8 }, // Dynamic product list
  { url: "/businesses", changefreq: "daily", priority: 0.8 }, // Dynamic business list
  { url: "/gigs", changefreq: "daily", priority: 0.8 }, // Dynamic gig list
  { url: "/search", changefreq: "daily", priority: 0.7 },
  { url: "/about", changefreq: "monthly", priority: 0.6 },
  { url: "/privacy", changefreq: "monthly", priority: 0.6 },
  { url: "/terms", changefreq: "monthly", priority: 0.6 },
];

// Fetch dynamic routes from API
async function getDynamicRoutes() {
  try {
    const baseUrl = process.env.API_BASE_URL || "https://mysource.com.ng";
    const [productsResponse, businessesResponse, gigsResponse] =
      await Promise.all([
        axios.get(`${baseUrl}/api/products`),
        axios.get(`${baseUrl}/api/businesses`),
        axios.get(`${baseUrl}/api/gigs`),
      ]);

    const productRoutes = productsResponse.data.map((product) => ({
      url: `/products/${product.id}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: product.updated_at || new Date().toISOString(),
    }));

    const businessRoutes = businessesResponse.data.map((business) => ({
      url: `/businesses/${business.id}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: business.updated_at || new Date().toISOString(),
    }));

    const gigRoutes = gigsResponse.data.map((gig) => ({
      url: `/gigs/${gig.id}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: gig.updated_at || new Date().toISOString(),
    }));

    return [...productRoutes, ...businessRoutes, ...gigRoutes];
  } catch (error) {
    console.error("Error fetching dynamic routes for sitemap:", error.message);
    return [];
  }
}

// Sitemap endpoint
app.get("/sitemap.xml", async (req, res) => {
  res.header("Content-Type", "application/xml");
  res.header("Content-Encoding", "gzip");
  res.header("Cache-Control", "public, max-age=3600");

  try {
    const sitemapStream = new SitemapStream({
      hostname: "https://mysource.ng",
    });
    const pipeline = sitemapStream.pipe(createGzip());

    // Write static routes
    staticRoutes.forEach((route) => sitemapStream.write(route));

    // Fetch and write dynamic routes
    const dynamicRoutes = await getDynamicRoutes();
    dynamicRoutes.forEach((route) => sitemapStream.write(route));

    sitemapStream.end();
    pipeline.pipe(res).on("error", (e) => {
      throw e;
    });
  } catch (e) {
    console.error("Error generating sitemap:", e.message);
    res.status(500).end();
  }
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.get("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    statusCode: 404,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the Telegram bot if configured
if (process.env.ENABLE_TELEGRAM === "true") {
  let bot;
  try {
    bot = startBot();
    global.bot = bot;
    console.info("Telegram bot started successfully");

    if (process.env.TELEGRAM_USE_POLLING === "true") {
      const notificationInterval = 4 * 60 * 60 * 1000; // 4 hours
      const notificationTimer = setInterval(async () => {
        try {
          await sendUnreadMessageNotifications();
        } catch (error) {
          console.error("Error sending notifications:", {
            message: error.message,
            stack: error.stack,
          });
        }
      }, notificationInterval);

      process.on("SIGTERM", () => {
        clearInterval(notificationTimer);
      });
    }
  } catch (error) {
    console.error("Failed to start Telegram bot:", {
      message: error.message,
      stack: error.stack,
    });
    console.warn("Telegram features will be disabled");
  }
} else {
  console.info(
    "Telegram bot is disabled. Set ENABLE_TELEGRAM=true to enable it."
  );
}

// Start server
app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  console.info(`Environment: ${process.env.NODE_ENV}`);
  console.info(`CORS Origin: ${process.env.CORS_ORIGIN}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

// Improved error logging for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
    code: error.code,
  });
  if (error.code === "EFATAL" || error.code === "ENOTFOUND") {
    console.warn("Non-critical error caught, continuing execution");
  } else {
    process.exit(1);
  }
});

// Improved error logging for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", {
    promise,
    reason:
      reason instanceof Error
        ? {
            message: reason.message,
            stack: reason.stack,
            code: reason.code,
          }
        : reason,
  });
  if (reason && (reason.code === "EFATAL" || reason.code === "ENOTFOUND")) {
    console.warn("Non-critical rejection caught, continuing execution");
  } else {
    process.exit(1);
  }
});
