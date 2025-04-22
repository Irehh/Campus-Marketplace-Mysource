// import bcrypt from "bcryptjs"
// import jwt from "jsonwebtoken"
// import { PrismaClient } from "@prisma/client"
// import fetch from "node-fetch"
// import crypto from "crypto"
// import { sendEmail } from "../utils/emailUtils.js"
// import * as emailTemplates from "../utils/emailTemplates.js"

// const prisma = new PrismaClient()

// // Register a new user
// export const register = async (req, res) => {
//   const { name, email, password } = req.body

//   // Validate input
//   if (!name || !email || !password) {
//     return res.status(400).json({ message: "Please provide all required fields" })
//   }

//   // Check if user already exists
//   const existingUser = await prisma.user.findUnique({
//     where: { email },
//   })

//   if (existingUser) {
//     return res.status(400).json({ message: "User already exists" })
//   }

//   // Hash password
//   const salt = await bcrypt.genSalt(10)
//   const hashedPassword = await bcrypt.hash(password, salt)

//   // Create user with needsCampusSelection flag
//   const user = await prisma.user.create({
//     data: {
//       name,
//       email,
//       password: hashedPassword,
//       campus: "default", // Will be updated when user selects campus
//       needsCampusSelection: true,
//     },
//   })

//   // Generate JWT
//   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })

//   // Send welcome email
//   try {
//     const welcomeTemplate = {
//       subject: "Welcome to Campus Marketplace!",
//       text: `Hello ${name},\n\nWelcome to Campus Marketplace! We're excited to have you join our community.\n\nBest regards,\nThe Campus Marketplace Team`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #4a5568;">Welcome to Campus Marketplace!</h2>
//           <p>Hello ${name},</p>
//           <p>We're excited to have you join our community. Here's what you can do:</p>
//           <ul>
//             <li>Browse products and services from your campus</li>
//             <li>List your own products or business</li>
//             <li>Connect with other students</li>
//           </ul>
//           <p>If you have any questions, feel free to reach out to our support team.</p>
//           <p>Best regards,<br>The Campus Marketplace Team</p>
//         </div>
//       `,
//     }

//     await sendEmail({
//       to: email,
//       subject: welcomeTemplate.subject,
//       text: welcomeTemplate.text,
//       html: welcomeTemplate.html,
//     }).catch((error) => {
//       // Log but don't fail registration if email fails
//       console.error("Failed to send welcome email:", error)
//     })
//   } catch (emailError) {
//     // Log but don't fail registration if email fails
//     console.error("Error preparing welcome email:", emailError)
//   }

//   // Return user data and token (excluding password)
//   const { password: _, ...userData } = user

//   res.status(201).json({
//     user: userData,
//     token,
//   })
// }

// // Login user
// export const login = async (req, res) => {
//   const { email, password } = req.body

//   // Validate input
//   if (!email || !password) {
//     return res.status(400).json({ message: "Please provide email and password" })
//   }

//   // Check if user exists
//   const user = await prisma.user.findUnique({
//     where: { email },
//   })

//   if (!user) {
//     return res.status(401).json({ message: "Invalid credentials" })
//   }

//   // Check password
//   const isMatch = await bcrypt.compare(password, user.password)

//   if (!isMatch) {
//     return res.status(401).json({ message: "Invalid credentials" })
//   }

//   // Update last seen
//   await prisma.user.update({
//     where: { id: user.id },
//     data: { lastSeen: new Date() },
//   })

//   // Generate JWT
//   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })

//   // Return user data and token (excluding password)
//   const { password: _, ...userData } = user

//   res.json({
//     user: userData,
//     token,
//   })
// }

// // Get current user
// export const getCurrentUser = async (req, res) => {
//   // User is already attached to req by auth middleware
//   const { password, ...userData } = req.user

//   // Update last seen
//   await prisma.user.update({
//     where: { id: req.user.id },
//     data: { lastSeen: new Date() },
//   })

//   res.json(userData)
// }

// // Update user profile
// export const updateProfile = async (req, res) => {
//   const { name, phone, website, campus } = req.body
//   const userId = req.user.id

//   // Update user
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       name: name || undefined,
//       phone: phone || undefined,
//       website: website || undefined,
//       campus: campus || undefined,
//       needsCampusSelection: campus ? false : undefined,
//       lastSeen: new Date(),
//     },
//   })

//   // Return updated user data (excluding password)
//   const { password, ...userData } = updatedUser

//   res.json(userData)
// }

// // Change password
// export const changePassword = async (req, res) => {
//   const { currentPassword, newPassword } = req.body
//   const userId = req.user.id

//   // Validate input
//   if (!currentPassword || !newPassword) {
//     return res.status(400).json({ message: "Please provide current and new password" })
//   }

//   // Get user with password
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   })

//   // Check current password
//   const isMatch = await bcrypt.compare(currentPassword, user.password)

//   if (!isMatch) {
//     return res.status(401).json({ message: "Current password is incorrect" })
//   }

//   // Hash new password
//   const salt = await bcrypt.genSalt(10)
//   const hashedPassword = await bcrypt.hash(newPassword, salt)

//   // Update password
//   await prisma.user.update({
//     where: { id: userId },
//     data: {
//       password: hashedPassword,
//       lastSeen: new Date(),
//     },
//   })

//   res.json({ message: "Password updated successfully" })
// }

// // Google OAuth login
// export const googleLogin = async (req, res) => {
//   const { token } = req.body

//   try {
//     // Instead of using the Google Auth Library, we'll use the token to get user info directly
//     const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`Google API error: ${response.statusText}`)
//     }

//     const userData = await response.json()
//     const { email, name, sub: googleId } = userData

//     if (!email) {
//       return res.status(400).json({ message: "Email not provided by Google" })
//     }

//     let user = await prisma.user.findUnique({ where: { email } })
//     let isNewUser = false

//     if (!user) {
//       // Create new user if not exists
//       user = await prisma.user.create({
//         data: {
//           email,
//           name: name || email.split("@")[0],
//           googleId,
//           campus: "default", // Mark as needing campus selection
//           needsCampusSelection: true,
//         },
//       })
//       isNewUser = true
//     } else if (!user.googleId) {
//       // Link Google account to existing user
//       user = await prisma.user.update({
//         where: { id: user.id },
//         data: {
//           googleId,
//           lastSeen: new Date(),
//         },
//       })
//     } else {
//       // Update last seen
//       user = await prisma.user.update({
//         where: { id: user.id },
//         data: { lastSeen: new Date() },
//       })
//     }

//     // Generate JWT
//     const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN || "7d",
//     })

//     res.json({
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         campus: user.campus,
//         phone: user.phone,
//         website: user.website,
//         needsCampusSelection: user.needsCampusSelection || user.campus === "default",
//       },
//       token: jwtToken,
//       isNewUser,
//     })
//   } catch (error) {
//     console.error("Google login error:", error)
//     res.status(401).json({ message: "Invalid Google token" })
//   }
// }

// // Link Telegram account
// export const linkTelegramAccount = async (req, res) => {
//   const { telegramId } = req.body
//   const userId = req.user.id

//   try {
//     // Remove @ symbol if present
//     const formattedTelegramId = telegramId.startsWith("@") ? telegramId.substring(1) : telegramId

//     // Check if this Telegram ID is already linked to another account
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         telegramId: formattedTelegramId,
//         id: { not: userId }, // Not the current user
//       },
//     })

//     if (existingUser) {
//       return res.status(400).json({
//         message: "This Telegram account is already linked to another user. Please use a different Telegram account.",
//       })
//     }

//     // Try to get the chat ID if available
//     let telegramChatId = null
//     try {
//       if (global.bot) {
//         const updates = await global.bot.getUpdates({ limit: 100 })
//         const userChat = updates.find(
//           (update) =>
//             update.message &&
//             update.message.from &&
//             (update.message.from.username === formattedTelegramId ||
//               update.message.from.username?.toLowerCase() === formattedTelegramId.toLowerCase()),
//         )

//         if (userChat && userChat.message && userChat.message.chat) {
//           telegramChatId = userChat.message.chat.id.toString()
//         }
//       }
//     } catch (error) {
//       console.error("Error getting Telegram chat ID:", error)
//       // Continue without the chat ID
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         telegramId: formattedTelegramId,
//         telegramChatId: telegramChatId,
//         lastSeen: new Date(),
//       },
//     })

//     res.json({
//       message: "Telegram account linked successfully",
//       user: {
//         id: updatedUser.id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         campus: updatedUser.campus,
//         telegramId: updatedUser.telegramId,
//         telegramChatId: updatedUser.telegramChatId,
//         phone: updatedUser.phone,
//         website: updatedUser.website,
//       },
//     })
//   } catch (error) {
//     console.error("Error linking Telegram account:", error)
//     res.status(400).json({ message: "Failed to link Telegram account" })
//   }
// }

// // Unlink Telegram account
// export const unlinkTelegramAccount = async (req, res) => {
//   const userId = req.user.id

//   try {
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         telegramId: null,
//         lastSeen: new Date(),
//       },
//     })

//     res.json({
//       message: "Telegram account unlinked successfully",
//       user: {
//         id: updatedUser.id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         campus: updatedUser.campus,
//         telegramId: null,
//         phone: updatedUser.phone,
//         website: updatedUser.website,
//       },
//     })
//   } catch (error) {
//     console.error("Error unlinking Telegram account:", error)
//     res.status(400).json({ message: "Failed to unlink Telegram account" })
//   }
// }

// // Get active users count
// export const getActiveUsersCount = async (req, res) => {
//   const { campus } = req.query

//   // Consider users active if they've been seen in the last 24 hours
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

//   const where = {
//     lastSeen: {
//       gte: oneDayAgo,
//     },
//   }

//   // Add campus filter if provided
//   if (campus) {
//     where.campus = campus
//   }

//   // Get active users count
//   const activeCount = await prisma.user.count({
//     where,
//   })

//   // Get total users count
//   const totalCount = await prisma.user.count({
//     where: campus ? { campus } : {},
//   })

//   // Format with commas
//   const formattedActiveCount = activeCount.toLocaleString()
//   const formattedTotalCount = totalCount.toLocaleString()

//   res.json({
//     activeCount: formattedActiveCount,
//     totalCount: formattedTotalCount,
//     display: `${formattedActiveCount}, ${formattedTotalCount}`,
//   })
// }

// // Request password reset
// export const requestPasswordReset = async (req, res) => {
//   const { email } = req.body

//   if (!email) {
//     return res.status(400).json({ message: "Email is required" })
//   }

//   try {
//     // Find user by email
//     const user = await prisma.user.findUnique({
//       where: { email },
//     })

//     if (!user) {
//       // Don't reveal that the user doesn't exist
//       return res.json({ message: "If your email is registered, you will receive a password reset link" })
//     }

//     // Generate reset token (valid for 1 hour)
//     const resetToken = crypto.randomBytes(32).toString("hex")
//     const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

//     // Hash token before saving to database
//     const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

//     // Save token to user
//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         resetToken: hashedToken,
//         resetTokenExpiry,
//       },
//     })

//     // Create reset URL
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

//     // Get email template
//     const template = emailTemplates.passwordReset(resetUrl)

//     // Send email
//     await sendEmail({
//       to: user.email,
//       subject: template.subject,
//       text: template.text,
//       html: template.html,
//     })

//     res.json({ message: "If your email is registered, you will receive a password reset link" })
//   } catch (error) {
//     console.error("Password reset request error:", error)
//     res.status(500).json({ message: "Failed to process password reset request" })
//   }
// }

// // Reset password
// export const resetPassword = async (req, res) => {
//   const { token, password } = req.body

//   if (!token || !password) {
//     return res.status(400).json({ message: "Token and password are required" })
//   }

//   try {
//     // Hash token to compare with stored hash
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

//     // Find user with valid token
//     const user = await prisma.user.findFirst({
//       where: {
//         resetToken: hashedToken,
//         resetTokenExpiry: {
//           gt: new Date(),
//         },
//       },
//     })

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" })
//     }

//     // Hash new password
//     const salt = await bcrypt.genSalt(10)
//     const hashedPassword = await bcrypt.hash(password, salt)

//     // Update user password and clear reset token
//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         password: hashedPassword,
//         resetToken: null,
//         resetTokenExpiry: null,
//       },
//     })

//     res.json({ message: "Password reset successful. You can now log in with your new password." })
//   } catch (error) {
//     console.error("Password reset error:", error)
//     res.status(500).json({ message: "Failed to reset password" })
//   }
// }

// // Get notification settings
// export const getNotificationSettings = async (req, res) => {
//   try {
//     const userId = req.user.id

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         notifyByTelegram: true,
//         notificationKeywords: true,
//       },
//     })

//     if (!user) {
//       return res.status(404).json({ message: "User not found" })
//     }

//     res.json({
//       notifyByTelegram: user.notifyByTelegram,
//       notificationKeywords: user.notificationKeywords || "",
//     })
//   } catch (error) {
//     console.error("Error getting notification settings:", error)
//     res.status(500).json({ message: "Failed to get notification settings" })
//   }
// }

// // Update notification settings
// export const updateNotificationSettings = async (req, res) => {
//   try {
//     const userId = req.user.id
//     const { notifyByTelegram, notificationKeywords } = req.body

//     // Validate input
//     if (typeof notifyByTelegram !== "boolean") {
//       return res.status(400).json({ message: "notifyByTelegram must be a boolean" })
//     }

//     // Clean and validate keywords
//     let cleanedKeywords = null
//     if (notificationKeywords) {
//       // Split by commas, trim whitespace, filter out empty strings, and join back
//       cleanedKeywords = notificationKeywords
//         .split(",")
//         .map((keyword) => keyword.trim().toLowerCase())
//         .filter((keyword) => keyword.length > 0)
//         .join(",")
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         notifyByTelegram,
//         notificationKeywords: cleanedKeywords,
//         lastSeen: new Date(),
//       },
//       select: {
//         notifyByTelegram: true,
//         notificationKeywords: true,
//       },
//     })

//     res.json({
//       message: "Notification settings updated successfully",
//       settings: updatedUser,
//     })
//   } catch (error) {
//     console.error("Error updating notification settings:", error)
//     res.status(500).json({ message: "Failed to update notification settings" })
//   }
// }



import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import crypto from "crypto";
import { sendEmail } from "../utils/emailUtils.js";
import * as emailTemplates from "../utils/emailTemplates.js";

const prisma = new PrismaClient();

// Register a new user
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      campus: "default",
      needsCampusSelection: true,
    },
  });

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

  // Send welcome email
  try {
    const welcomeTemplate = {
      subject: "Welcome to Campus Marketplace!",
      text: `Hello ${name},\n\nWelcome to Campus Marketplace! We're excited to have you join our community.\n\nBest regards,\nThe Campus Marketplace Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Welcome to Campus Marketplace!</h2>
          <p>Hello ${name},</p>
          <p>We're excited to have you join our community. Here's what you can do:</p>
          <ul>
            <li>Browse products and services from your campus</li>
            <li>List your own products or business</li>
            <li>Connect with other students</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Campus Marketplace Team</p>
        </div>
      `,
    };

    await sendEmail({
      to: email,
      subject: welcomeTemplate.subject,
      text: welcomeTemplate.text,
      html: welcomeTemplate.html,
    }).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });
  } catch (emailError) {
    console.error("Error preparing welcome email:", emailError);
  }

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user;

  res.status(201).json({
    user: userData,
    token,
  });
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Update last seen
  await prisma.user.update({
    where: { id: user.id }, // user.id is Int
    data: { lastSeen: new Date() },
  });

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user;

  res.json({
    user: userData,
    token,
  });
};

// Get current user
export const getCurrentUser = async (req, res) => {
  // User is attached by auth middleware
  const userId = req.user.id; // Assumed to be an integer from JWT

  // Update last seen
  await prisma.user.update({
    where: { id: userId }, // userId is Int
    data: { lastSeen: new Date() },
  });

  // Return user data (excluding password)
  const { password, ...userData } = req.user;

  res.json(userData);
};

// Update user profile
export const updateProfile = async (req, res) => {
  const { name, phone, website, campus } = req.body;
  const userId = req.user.id; // Assumed to be an integer

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId }, // userId is Int
    data: {
      name: name || undefined,
      phone: phone || undefined,
      website: website || undefined,
      campus: campus || undefined,
      needsCampusSelection: campus ? false : undefined,
      lastSeen: new Date(),
    },
  });

  // Return updated user data (excluding password)
  const { password, ...userData } = updatedUser;

  res.json(userData);
};

// Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Assumed to be an integer

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide current and new password" });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }, // userId is Int
  });

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  await prisma.user.update({
    where: { id: userId }, // userId is Int
    data: {
      password: hashedPassword,
      lastSeen: new Date(),
    },
  });

  res.json({ message: "Password updated successfully" });
};

// Google OAuth login
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Fetch user info from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const userData = await response.json();
    const { email, name, sub: googleId } = userData;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google" });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          googleId,
          campus: "default",
          needsCampusSelection: true,
        },
      });
      isNewUser = true;
    } else if (!user.googleId) {
      // Link Google account
      user = await prisma.user.update({
        where: { id: user.id }, // user.id is Int
        data: {
          googleId,
          lastSeen: new Date(),
        },
      });
    } else {
      // Update last seen
      user = await prisma.user.update({
        where: { id: user.id }, // user.id is Int
        data: { lastSeen: new Date() },
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      user: {
        id: user.id, // Int
        name: user.name,
        email: user.email,
        campus: user.campus,
        phone: user.phone,
        website: user.website,
        needsCampusSelection: user.needsCampusSelection || user.campus === "default",
      },
      token: jwtToken,
      isNewUser,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

// Link Telegram account
export const linkTelegramAccount = async (req, res) => {
  const { telegramId } = req.body;
  const userId = req.user.id; // Assumed to be an integer

  try {
    // Remove @ symbol if present
    const formattedTelegramId = telegramId.startsWith("@") ? telegramId.substring(1) : telegramId;

    // Check if Telegram ID is already linked
    const existingUser = await prisma.user.findFirst({
      where: {
        telegramId: formattedTelegramId,
        id: { not: userId }, // userId is Int
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This Telegram account is already linked to another user. Please use a different Telegram account.",
      });
    }

    // Try to get the chat ID
    let telegramChatId = null;
    try {
      if (global.bot) {
        const updates = await global.bot.getUpdates({ limit: 100 });
        const userChat = updates.find(
          (update) =>
            update.message &&
            update.message.from &&
            (update.message.from.username === formattedTelegramId ||
              update.message.from.username?.toLowerCase() === formattedTelegramId.toLowerCase()),
        );

        if (userChat && userChat.message && userChat.message.chat) {
          telegramChatId = userChat.message.chat.id.toString();
        }
      }
    } catch (error) {
      console.error("Error getting Telegram chat ID:", error);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // userId is Int
      data: {
        telegramId: formattedTelegramId,
        telegramChatId: telegramChatId,
        lastSeen: new Date(),
      },
    });

    res.json({
      message: "Telegram account linked successfully",
      user: {
        id: updatedUser.id, // Int
        name: updatedUser.name,
        email: updatedUser.email,
        campus: updatedUser.campus,
        telegramId: updatedUser.telegramId,
        telegramChatId: updatedUser.telegramChatId,
        phone: updatedUser.phone,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    console.error("Error linking Telegram account:", error);
    res.status(400).json({ message: "Failed to link Telegram account" });
  }
};

// Unlink Telegram account
export const unlinkTelegramAccount = async (req, res) => {
  const userId = req.user.id; // Assumed to be an integer

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // userId is Int
      data: {
        telegramId: null,
        lastSeen: new Date(),
      },
    });

    res.json({
      message: "Telegram account unlinked successfully",
      user: {
        id: updatedUser.id, // Int
        name: updatedUser.name,
        email: updatedUser.email,
        campus: updatedUser.campus,
        telegramId: null,
        phone: updatedUser.phone,
        website: updatedUser.website,
      },
    });
  } catch (error) {
    console.error("Error unlinking Telegram account:", error);
    res.status(400).json({ message: "Failed to unlink Telegram account" });
  }
};

// Get active users count
export const getActiveUsersCount = async (req, res) => {
  const { campus } = req.query;

  // Consider users active if seen in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where = {
    lastSeen: {
      gte: oneDayAgo,
    },
  };

  if (campus) {
    where.campus = campus;
  }

  // Get counts
  const activeCount = await prisma.user.count({
    where,
  });

  const totalCount = await prisma.user.count({
    where: campus ? { campus } : {},
  });

  // Format with commas
  const formattedActiveCount = activeCount.toLocaleString();
  const formattedTotalCount = totalCount.toLocaleString();

  res.json({
    activeCount: formattedActiveCount,
    totalCount: formattedTotalCount,
    display: `${formattedActiveCount}, ${formattedTotalCount}`,
  });
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({ message: "If your email is registered, you will receive a password reset link" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token to user
    await prisma.user.update({
      where: { id: user.id }, // user.id is Int
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const template = emailTemplates.passwordReset(resetUrl);

    await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    res.json({ message: "If your email is registered, you will receive a password reset link" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Failed to process password reset request" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  try {
    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await prisma.user.update({
      where: { id: user.id }, // user.id is Int
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password reset successful. You can now log in with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // Assumed to be an integer

    const user = await prisma.user.findUnique({
      where: { id: userId }, // userId is Int
      select: {
        notifyByTelegram: true,
        notificationKeywords: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      notifyByTelegram: user.notifyByTelegram,
      notificationKeywords: user.notificationKeywords || "",
    });
  } catch (error) {
    console.error("Error getting notification settings:", error);
    res.status(500).json({ message: "Failed to get notification settings" });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id; // Assumed to be an integer
    const { notifyByTelegram, notificationKeywords } = req.body;

    // Validate input
    if (typeof notifyByTelegram !== "boolean") {
      return res.status(400).json({ message: "notifyByTelegram must be a boolean" });
    }

    // Clean keywords
    let cleanedKeywords = null;
    if (notificationKeywords) {
      cleanedKeywords = notificationKeywords
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 0)
        .join(",");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // userId is Int
      data: {
        notifyByTelegram,
        notificationKeywords: cleanedKeywords,
        lastSeen: new Date(),
      },
      select: {
        notifyByTelegram: true,
        notificationKeywords: true,
      },
    });

    res.json({
      message: "Notification settings updated successfully",
      settings: updatedUser,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Failed to update notification settings" });
  }
};