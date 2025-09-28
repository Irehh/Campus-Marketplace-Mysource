const { User, Product, Image, Subscription, sequelize } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');
const twilio = require('twilio');

const API_BASE_URL = process.env.API_BASE_URL || 'https://mysource.com.ng';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Send WhatsApp message
const sendWhatsAppMessage = async (to, body) => {
  try {
    await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body,
    });
    console.info('WhatsApp message sent successfully', { to });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message', { error: error.message, to });
    return false;
  }
};

// Handle incoming WhatsApp webhook
exports.handleWebhook = async (req, res) => {
  try {
    const { From, Body, NumMedia } = req.body;
    const phoneNumber = From.replace('whatsapp:', ''); // Extract phone number (e.g., +2341234567890)

    // Find user by phone number
    const user = await User.findOne({
      where: { phone: phoneNumber },
    });

    if (!user) {
      await sendWhatsAppMessage(phoneNumber, 'Your phone number is not registered with Campus Marketplace. Please sign up or update your profile with this number.');
      return res.status(200).json({ message: 'User not found' });
    }

    // Check subscription
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        isActive: true,
        expiryDate: { [Op.gt]: new Date() },
      },
    });

    if (!subscription || subscription.remainingLimit <= 0) {
      await sendWhatsAppMessage(phoneNumber, 'Your subscription has expired or usage limit is exhausted. Please renew your membership to post listings.');
      return res.status(200).json({ message: 'Subscription invalid' });
    }

    // Handle listing (images or text-only)
    if (NumMedia > 0 && NumMedia <= 4) {
      await handleProductUpload(req.body, user, subscription, phoneNumber, 'image');
    } else if (NumMedia === 0 && Body) {
      await handleProductUpload(req.body, user, subscription, phoneNumber, 'text');
    } else if (NumMedia > 4) {
      await sendWhatsAppMessage(phoneNumber, 'Maximum 4 images allowed per listing.');
    } else {
      await sendWhatsAppMessage(phoneNumber, 'Please send a text message or 1-4 images with a caption to post a listing.');
    }

    return res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing WhatsApp webhook', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Failed to process webhook' });
  }
};

// Handle product upload (image or text-based listing)
const handleProductUpload = async (message, user, subscription, phoneNumber, listingType) => {
  try {
    const caption = message.Body || '';
    const numMedia = parseInt(message.NumMedia || 0);
    const POST_COST = 100; // ₦100 per post

    // Validate input
    if (listingType === 'image' && !caption) {
      await sendWhatsAppMessage(phoneNumber, 'Please provide a caption with your images, including title, description, price, and category.');
      return;
    }
    if (listingType === 'text' && !caption) {
      await sendWhatsAppMessage(phoneNumber, 'Please provide a description for your listing.');
      return;
    }
    if (subscription.remainingLimit < POST_COST) {
      await sendWhatsAppMessage(phoneNumber, 'Insufficient usage limit. Please renew your subscription.');
      return;
    }

    // Parse caption with AI (with fallback)
    let parsedData = { title: caption.substring(0, 100), description: caption, price: null, category: 'Other' };
    if (caption) {
      const aiParsed = await parseCaptionWithAI(caption);
      if (aiParsed) {
        parsedData = aiParsed;
      } else {
        console.warn('AI parsing failed, using fallback values');
      }
    }

    // Process images (if any)
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'Uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageData = [];
    if (listingType === 'image') {
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = message[`MediaUrl${i}`];
        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
        });
        const buffer = Buffer.from(response.data);

        const filename = `whatsapp_${Date.now()}_${Math.floor(Math.random() * 10000)}.webp`;
        const filePath = path.join(uploadDir, filename);
        const relativePath = `${API_BASE_URL}/Uploads/${filename}`;

        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(uploadDir, thumbnailFilename);
        const thumbnailRelativePath = `${API_BASE_URL}/Uploads/${thumbnailFilename}`;

        await sharp(buffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);

        await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .webp({ quality: 60 })
          .toFile(thumbnailPath);

        imageData.push({ url: relativePath, thumbnailUrl: thumbnailRelativePath });
      }
    }

    // Create product and images within a transaction
    const product = await sequelize.transaction(async (t) => {
      const newProduct = await Product.create(
        {
          description: parsedData.description,
          price: parsedData.price,
          category: parsedData.category,
          campus: user.campus || 'default',
          userId: user.id,
          isDisabled: false,
          viewCount: 0,
          listingType, // Store listing type for future extensibility
        },
        { transaction: t }
      );

      for (const img of imageData) {
        await Image.create(
          {
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            productId: newProduct.id,
          },
          { transaction: t }
        );
      }

      // Update subscription usage
      await Subscription.update(
        {
          remainingLimit: sequelize.literal(`remainingLimit - ${POST_COST}`),
        },
        { where: { id: subscription.id }, transaction: t }
      );

      return newProduct;
    });

    await sendWhatsAppMessage(
      phoneNumber,
      `✅ Product posted successfully!\n\n*${parsedData.title}*\n\nView it on the marketplace: ${process.env.FRONTEND_URL}/products/${product.id}`
    );

    console.info(`User ${user.id} posted product ${product.id} via WhatsApp (Type: ${listingType})`);
  } catch (error) {
    console.error('Error handling product upload:', error);
    await sendWhatsAppMessage(phoneNumber, 'Sorry, there was an error posting your product. Please try again later.');
  }
};

// Parse caption with AI (returns null on failure)
const parseCaptionWithAI = async (caption) => {
  try {
    const prompt = `
      Parse the following caption from a marketplace listing into a JSON object with:
      - title: Product title (short, max 100 characters)
      - description: Product description
      - price: Price in Naira (numeric, null if not specified or "On Request")
      - category: Product category (e.g., Electronics, Fashion, Books, Other)

      If category is not mentioned, infer it or default to "Other".
      If price is not specified or is "On Request", set to null.

      Caption: "${caption}"

      Return a JSON object.
    `;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error parsing caption with AI:', error);
    return null;
  }
};

// Create or renew subscription
exports.createSubscription = async (req, res) => {
  const userId = req.user.id;

  try {
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        isActive: true,
        expiryDate: { [Op.gt]: new Date() },
      },
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'Active subscription already exists' });
    }

    const subscription = await Subscription.create({
      userId,
      amount: 4000,
      usageLimit: 2000,
      remainingLimit: 2000,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    });

    await sendWhatsAppMessage(
      req.user.phone,
      `Your subscription has been activated! You can now post listings up to ₦2,000 this month.`
    );

    return res.status(201).json({ message: 'Subscription created successfully', subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ message: 'Failed to create subscription', error: error.message });
  }
};