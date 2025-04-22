// import { PrismaClient } from "@prisma/client"
// import TelegramBot from "node-telegram-bot-api"
// import nodemailer from "nodemailer"
// import { emitEvent } from "../utils/eventEmitter.js"

// const prisma = new PrismaClient()
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })

// // Create a test email transporter (for development)
// // In production, use a real email service
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || "smtp.ethereal.email",
//   port: process.env.EMAIL_PORT || 587,
//   secure: process.env.EMAIL_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL_USER || "ethereal.user@ethereal.email",
//     pass: process.env.EMAIL_PASS || "ethereal_pass",
//   },
// })

// // Get all messages for a user
// export const getMessages = async (req, res) => {
//   const userId = req.user.id

//   const messages = await prisma.message.findMany({
//     where: {
//       OR: [{ senderId: userId }, { receiverId: userId }],
//     },
//     include: {
//       sender: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//       receiver: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//       product: {
//         select: {
//           id: true,
//           description: true,
//         },
//       },
//       business: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   })

//   res.json(messages)
// }

// // Get conversation between two users
// export const getConversation = async (req, res) => {
//   const userId = req.user.id
//   const { otherUserId } = req.params

//   const messages = await prisma.message.findMany({
//     where: {
//       OR: [
//         {
//           senderId: userId,
//           receiverId: otherUserId,
//         },
//         {
//           senderId: otherUserId,
//           receiverId: userId,
//         },
//       ],
//     },
//     include: {
//       product: {
//         select: {
//           id: true,
//           description: true,
//         },
//       },
//       business: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   })

//   // Mark messages as read
//   const unreadMessages = messages.filter((message) => message.receiverId === userId && !message.read)

//   if (unreadMessages.length > 0) {
//     await prisma.message.updateMany({
//       where: {
//         id: {
//           in: unreadMessages.map((message) => message.id),
//         },
//       },
//       data: {
//         read: true,
//       },
//     })
//   }

//   res.json(messages)
// }

// // Send a message
// export const sendMessage = async (req, res) => {
//   const senderId = req.user.id
//   const { receiverId, content, productId, businessId } = req.body

//   if (!content || !receiverId) {
//     return res.status(400).json({ message: "Receiver and content are required" })
//   }

//   // Check if receiver exists
//   const receiver = await prisma.user.findUnique({
//     where: { id: receiverId },
//   })

//   if (!receiver) {
//     return res.status(404).json({ message: "Receiver not found" })
//   }

//   // Create message
//   const message = await prisma.message.create({
//     data: {
//       content,
//       senderId,
//       receiverId,
//       productId: productId || null,
//       businessId: businessId || null,
//     },
//     include: {
//       sender: {
//         select: {
//           id: true,
//           name: true,
//           campus: true,
//         },
//       },
//       product: {
//         select: {
//           id: true,
//           description: true,
//         },
//       },
//       business: {
//         select: {
//           id: true,
//           name: true,
//         },
//       },
//     },
//   })

//   // Emit event for real-time updates - include campus info
//   emitEvent("newMessage", {
//     message: `New message from ${req.user.name || "Someone"} in ${req.user.campus}`,
//     campus: req.user.campus,
//   })

//   // Check if this is the first message from this sender to this receiver
//   const previousMessages = await prisma.message.findMany({
//     where: {
//       senderId,
//       receiverId,
//       id: { not: message.id },
//     },
//     take: 1,
//   })

//   const isFirstMessage = previousMessages.length === 0

//   // Send notification via Telegram if user has telegramId and wants notifications
//   if (receiver.telegramId && receiver.notifyByTelegram) {
//     try {
//       let itemInfo = ""
//       if (message.product) {
//         itemInfo = `about your product: ${message.product.description.substring(0, 30)}...`
//       } else if (message.business) {
//         itemInfo = `about your business: ${message.business.name}`
//       }

//       // Add @ symbol if not present for username
//       const telegramRecipient = receiver.telegramId.startsWith("@") ? receiver.telegramId : `@${receiver.telegramId}`

//       await bot.sendMessage(
//         telegramRecipient,
//         `New message from ${req.user.name || "Someone"} ${itemInfo}:
        
// "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

// Login to Campus Marketplace to reply.`,
//       )
//     } catch (error) {
//       console.error("Failed to send Telegram notification:", error)
//     }
//   }

//   // Send email notification for first message
//   if (isFirstMessage) {
//     try {
//       await transporter.sendMail({
//         from: process.env.EMAIL_FROM || '"Campus Marketplace" <no-reply@campusmarketplace.com>',
//         to: receiver.email,
//         subject: "New message on Campus Marketplace",
//         text: `You have a new message from ${req.user.name || "Someone"} on Campus Marketplace.
        
// Message: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

// Login to Campus Marketplace to view and reply to this message.`,
//         html: `<p>You have a new message from <strong>${req.user.name || "Someone"}</strong> on Campus Marketplace.</p>
//         <p><em>Message:</em> "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</p>
//         <p>Login to Campus Marketplace to view and reply to this message.</p>`,
//       })
//     } catch (error) {
//       console.error("Failed to send email notification:", error)
//     }
//   }

//   res.status(201).json(message)
// }

// // Mark messages as read
// export const markAsRead = async (req, res) => {
//   const userId = req.user.id
//   const { messageIds } = req.body

//   if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
//     return res.status(400).json({ message: "Message IDs are required" })
//   }

//   // Ensure user can only mark messages where they are the receiver
//   const messages = await prisma.message.findMany({
//     where: {
//       id: { in: messageIds },
//       receiverId: userId,
//     },
//   })

//   const validMessageIds = messages.map((message) => message.id)

//   if (validMessageIds.length === 0) {
//     return res.status(403).json({ message: "No valid messages to mark as read" })
//   }

//   await prisma.message.updateMany({
//     where: {
//       id: { in: validMessageIds },
//     },
//     data: {
//       read: true,
//     },
//   })

//   res.json({ message: "Messages marked as read" })
// }

// // Toggle Telegram notifications
// export const toggleNotifications = async (req, res) => {
//   const userId = req.user.id
//   const { notifyByTelegram } = req.body

//   if (typeof notifyByTelegram !== "boolean") {
//     return res.status(400).json({ message: "notifyByTelegram must be a boolean" })
//   }

//   const user = await prisma.user.update({
//     where: { id: userId },
//     data: { notifyByTelegram },
//   })

//   res.json({ notifyByTelegram: user.notifyByTelegram })
// }

// // Get unread messages count
// export const getUnreadCount = async (req, res) => {
//   const userId = req.user.id

//   try {
//     const count = await prisma.message.count({
//       where: {
//         receiverId: userId,
//         read: false,
//       },
//     })

//     res.json({ count })
//   } catch (error) {
//     console.error("Error getting unread messages count:", error)
//     res.status(500).json({ message: "Failed to get unread messages count" })
//   }
// }




import { PrismaClient } from "@prisma/client";
import TelegramBot from "node-telegram-bot-api";
import nodemailer from "nodemailer";
import { emitEvent } from "../utils/eventEmitter.js";

const prisma = new PrismaClient();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Create a test email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "ethereal.user@ethereal.email",
    pass: process.env.EMAIL_PASS || "ethereal_pass",
  },
});

// Get all messages for a user
export const getMessages = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer (Int)

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true, // Int
            name: true,
          },
        },
        receiver: {
          select: {
            id: true, // Int
            name: true,
          },
        },
        product: {
          select: {
            id: true, // Int
            description: true,
          },
        },
        business: {
          select: {
            id: true, // Int
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Get conversation between two users
export const getConversation = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer (Int)
  const { otherUserId } = req.params;

  // Parse otherUserId to integer
  const parsedOtherUserId = parseInt(otherUserId, 10);
  if (isNaN(parsedOtherUserId)) {
    return res.status(400).json({ message: "Invalid other user ID" });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
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
      include: {
        product: {
          select: {
            id: true, // Int
            description: true,
          },
        },
        business: {
          select: {
            id: true, // Int
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark messages as read
    const unreadMessages = messages.filter((message) => message.receiverId === userId && !message.read);

    if (unreadMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: {
            in: unreadMessages.map((message) => message.id), // Int
          },
        },
        data: {
          read: true,
        },
      });
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const senderId = req.user.id; // Assumed to be an integer (Int)
  const { receiverId, content, productId, businessId } = req.body;

  // Validate required fields
  if (!content || !receiverId) {
    return res.status(400).json({ message: "Receiver and content are required" });
  }

  // Parse receiverId to integer
  const parsedReceiverId = parseInt(receiverId, 10);
  if (isNaN(parsedReceiverId)) {
    return res.status(400).json({ message: "Invalid receiver ID" });
  }

  // Parse productId and businessId to integers if provided
  let parsedProductId = null;
  if (productId) {
    parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
  }

  let parsedBusinessId = null;
  if (businessId) {
    parsedBusinessId = parseInt(businessId, 10);
    if (isNaN(parsedBusinessId)) {
      return res.status(400).json({ message: "Invalid business ID" });
    }
  }

  try {
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: parsedReceiverId }, // Use parsed integer
    });

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: parsedReceiverId, // Use parsed integer
        productId: parsedProductId, // Nullable Int
        businessId: parsedBusinessId, // Nullable Int
      },
      include: {
        sender: {
          select: {
            id: true, // Int
            name: true,
            campus: true,
          },
        },
        product: {
          select: {
            id: true, // Int
            description: true,
          },
        },
        business: {
          select: {
            id: true, // Int
            name: true,
          },
        },
      },
    });

    // Emit event for real-time updates
    emitEvent("newMessage", {
      message: `New message from ${req.user.name || "Someone"} in ${req.user.campus}`,
      campus: req.user.campus,
    });

    // Check if this is the first message from this sender to this receiver
    const previousMessages = await prisma.message.findMany({
      where: {
        senderId,
        receiverId: parsedReceiverId, // Use parsed integer
        id: { not: message.id }, // Int
      },
      take: 1,
    });

    const isFirstMessage = previousMessages.length === 0;

    // Send notification via Telegram if enabled
    if (receiver.telegramId && receiver.notifyByTelegram) {
      try {
        let itemInfo = "";
        if (message.product) {
          itemInfo = `about your product: ${message.product.description.substring(0, 30)}...`;
        } else if (message.business) {
          itemInfo = `about your business: ${message.business.name}`;
        }

        const telegramRecipient = receiver.telegramId.startsWith("@")
          ? receiver.telegramId
          : `@${receiver.telegramId}`;

        await bot.sendMessage(
          telegramRecipient,
          `New message from ${req.user.name || "Someone"} ${itemInfo}:
          
"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

Login to Campus Marketplace to reply.`,
        );
      } catch (error) {
        console.error("Failed to send Telegram notification:", error);
      }
    }

    // Send email notification for first message
    if (isFirstMessage) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Campus Marketplace" <no-reply@campusmarketplace.com>',
          to: receiver.email,
          subject: "New message on Campus Marketplace",
          text: `You have a new message from ${req.user.name || "Someone"} on Campus Marketplace.
          
Message: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

Login to Campus Marketplace to view and reply to this message.`,
          html: `<p>You have a new message from <strong>${req.user.name || "Someone"}</strong> on Campus Marketplace.</p>
          <p><em>Message:</em> "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</p>
          <p>Login to Campus Marketplace to view and reply to this message.</p>`,
        });
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer (Int)
  const { messageIds } = req.body;

  // Validate messageIds
  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ message: "Message IDs are required" });
  }

  // Parse messageIds to integers
  const parsedMessageIds = messageIds.map((id) => parseInt(id, 10));
  if (parsedMessageIds.some(isNaN)) {
    return res.status(400).json({ message: "Invalid message IDs" });
  }

  try {
    // Ensure user can only mark messages where they are the receiver
    const messages = await prisma.message.findMany({
      where: {
        id: { in: parsedMessageIds }, // Use parsed integers
        receiverId: userId,
      },
    });

    const validMessageIds = messages.map((message) => message.id);

    if (validMessageIds.length === 0) {
      return res.status(403).json({ message: "No valid messages to mark as read" });
    }

    await prisma.message.updateMany({
      where: {
        id: { in: validMessageIds }, // Int
      },
      data: {
        read: true,
      },
    });

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

// Toggle Telegram notifications
export const toggleNotifications = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer (Int)
  const { notifyByTelegram } = req.body;

  if (typeof notifyByTelegram !== "boolean") {
    return res.status(400).json({ message: "notifyByTelegram must be a boolean" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId }, // Use integer
      data: { notifyByTelegram },
    });

    res.json({ notifyByTelegram: user.notifyByTelegram });
  } catch (error) {
    console.error("Error toggling notifications:", error);
    res.status(500).json({ message: "Failed to toggle notifications" });
  }
};

// Get unread messages count
export const getUnreadCount = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer (Int)

  try {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread messages count:", error);
    res.status(500).json({ message: "Failed to get unread messages count" });
  }
};