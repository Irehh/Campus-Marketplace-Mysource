const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fetch = require("node-fetch")
const crypto = require("crypto")
const { sendEmail } = require("../utils/emailUtils")
const emailTemplates = require("../utils/emailTemplates")
const { User } = require("../models")
const { Op } = require("sequelize")

// Register a new user
exports.register = async (req, res) => {
  const { name, email, password } = req.body

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" })
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } })

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user with verification token
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by the beforeCreate hook
      campus: "default", // Will be updated when user selects campus
      needsCampusSelection: true,
      isVerified: false,
      verificationToken,
      verificationExpiry,
    })

    // Create verification URL
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`

    // Send verification email
    try {
      const template = emailTemplates.emailVerification(verifyUrl, name)

      await sendEmail({
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      })
    } catch (emailError) {
      console.error("Error sending verification email:", emailError)
      // Continue with registration even if email fails
    }

    // Return user data (excluding password and verification token)
    const userData = user.toJSON()
    delete userData.password
    delete userData.verificationToken

    res.status(201).json({
      user: userData,
      message: "Registration successful! Please check your email to verify your account.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    logger.error("Error during registration:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
}

// Verify email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" })
  }

  try {
    // Find user with this token
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationExpiry: {
          [Op.gt]: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" })
    }

    // Update user to verified
    user.isVerified = true
    user.verificationToken = null
    user.verificationExpiry = null
    await user.save()

    // Generate JWT for auto-login
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })

    res.json({
      message: "Email verified successfully!",
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
      },
    })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({ message: "Failed to verify email" })
  }
}

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" })
  }

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } })

    if (!user) {
      // Record failed login attempt
      await require("../middleware/rateLimitMiddleware").recordFailedLoginAttempt(req)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      // Record failed login attempt
      await require("../middleware/rateLimitMiddleware").recordFailedLoginAttempt(req)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Regenerate verification token if expired
      let verificationToken = user.verificationToken
      let verificationExpiry = user.verificationExpiry

      if (!verificationToken || new Date(verificationExpiry) < new Date()) {
        verificationToken = crypto.randomBytes(32).toString("hex")
        verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        user.verificationToken = verificationToken
        user.verificationExpiry = verificationExpiry
        await user.save()
      }

      // Send verification email again
      try {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
        const template = emailTemplates.emailVerification(verifyUrl, user.name)

        await sendEmail({
          to: email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        })
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
      }

      return res.status(403).json({
        message: "Please verify your email before logging in. A new verification email has been sent.",
        needsVerification: true,
      })
    }

     // Reset login attempts on successful login
     await require("../middleware/rateLimitMiddleware").resetLoginAttempts(req)

    // Update last seen
    user.lastSeen = new Date()
    await user.save()

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })

    // Return user data and token (excluding password)
    const userData = user.toJSON()
    delete userData.password

    res.json({
      user: userData,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
}

// Resend verification email
exports.resendVerification = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } })

    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.json({ message: "If your email is registered, you will receive a verification email" })
    }

    // If already verified
    if (user.isVerified) {
      return res.json({ message: "Your email is already verified. You can log in." })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken
    user.verificationExpiry = verificationExpiry
    await user.save()

    // Create verification URL
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`

    // Send verification email
    const template = emailTemplates.emailVerification(verifyUrl, user.name)

    await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    res.json({ message: "Verification email sent. Please check your inbox." })
  } catch (error) {
    console.error("Resend verification error:", error)
    res.status(500).json({ message: "Failed to send verification email" })
  }
}

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update last seen
    user.lastSeen = new Date()
    await user.save()

    // Return user data (excluding password)
    const userData = user.toJSON()
    delete userData.password

    res.json(userData)
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update user profile
exports.updateProfile = async (req, res) => {
  const { name, phone, website, campus } = req.body
  const userId = req.user.id

  try {
    // Find user
    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user
    if (name) user.name = name
    if (phone) user.phone = phone
    if (website) user.website = website
    if (campus) {
      user.campus = campus
      user.needsCampusSelection = false
    }

    user.lastSeen = new Date()
    await user.save()

    // Return updated user data (excluding password)
    const userData = user.toJSON()
    delete userData.password

    res.json(userData)
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide current and new password" })
  }

  try {
    // Get user with password
    const user = await User.findByPk(userId)

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    user.password = hashedPassword
    user.lastSeen = new Date()
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Google OAuth login
exports.googleLogin = async (req, res) => {
  const { token } = req.body

  try {
    // Instead of using the Google Auth Library, we'll use the token to get user info directly
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`)
    }

    const userData = await response.json()
    const { email, name, sub: googleId } = userData

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google" })
    }

    let user = await User.findOne({ where: { email } })
    let isNewUser = false

    if (!user) {
      // Create new user if not exists
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        googleId,
        campus: "default", // Mark as needing campus selection
        needsCampusSelection: true,
        isVerified: true, // Google accounts are pre-verified
      })
      isNewUser = true
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId
      user.lastSeen = new Date()
      await user.save()
    } else {
      // Update last seen
      user.lastSeen = new Date()
      await user.save()
    }

    // Generate JWT
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        campus: user.campus,
        phone: user.phone,
        website: user.website,
        needsCampusSelection: user.needsCampusSelection || user.campus === "default",
      },
      token: jwtToken,
      isNewUser,
    })
  } catch (error) {
    console.error("Google login error:", error)
    res.status(401).json({ message: "Invalid Google token" })
  }
}

// Link Telegram account
exports.linkTelegramAccount = async (req, res) => {
  const { telegramId } = req.body
  const userId = req.user.id

  try {
    // Remove @ symbol if present
    const formattedTelegramId = telegramId.startsWith("@") ? telegramId.substring(1) : telegramId

    // Check if this Telegram ID is already linked to another account
    const existingUser = await User.findOne({
      where: {
        telegramId: formattedTelegramId,
        id: { [Op.ne]: userId }, // Not the current user
      },
    })

    if (existingUser) {
      return res.status(400).json({
        message: "This Telegram account is already linked to another user. Please use a different Telegram account.",
      })
    }

    // Try to get the chat ID if available
    let telegramChatId = null
    try {
      if (global.bot) {
        const updates = await global.bot.getUpdates({ limit: 100 })
        const userChat = updates.find(
          (update) =>
            update.message &&
            update.message.from &&
            (update.message.from.username === formattedTelegramId ||
              update.message.from.username?.toLowerCase() === formattedTelegramId.toLowerCase()),
        )

        if (userChat && userChat.message && userChat.message.chat) {
          telegramChatId = userChat.message.chat.id.toString()
        }
      }
    } catch (error) {
      console.error("Error getting Telegram chat ID:", error)
      // Continue without the chat ID
    }

    const user = await User.findByPk(userId)
    user.telegramId = formattedTelegramId
    user.telegramChatId = telegramChatId
    user.lastSeen = new Date()
    await user.save()

    res.json({
      message: "Telegram account linked successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        campus: user.campus,
        telegramId: user.telegramId,
        telegramChatId: user.telegramChatId,
        phone: user.phone,
        website: user.website,
      },
    })
  } catch (error) {
    console.error("Error linking Telegram account:", error)
    res.status(400).json({ message: "Failed to link Telegram account" })
  }
}

// Unlink Telegram account
exports.unlinkTelegramAccount = async (req, res) => {
  const userId = req.user.id

  try {
    const user = await User.findByPk(userId)
    user.telegramId = null
    user.telegramChatId = null
    user.lastSeen = new Date()
    await user.save()

    res.json({
      message: "Telegram account unlinked successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        campus: user.campus,
        telegramId: null,
        telegramChatId: null,
        phone: user.phone,
        website: user.website,
      },
    })
  } catch (error) {
    console.error("Error unlinking Telegram account:", error)
    res.status(400).json({ message: "Failed to unlink Telegram account" })
  }
}

// Get active users count
exports.getActiveUsersCount = async (req, res) => {
  const { campus } = req.query

  // Consider users active if they've been seen in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const where = {
    lastSeen: {
      [Op.gte]: oneDayAgo,
    },
  }

  // Add campus filter if provided
  if (campus) {
    where.campus = campus
  }

  try {
    // Get active users count
    const activeCount = await User.count({ where })

    // Get total users count
    const totalCount = await User.count({
      where: campus ? { campus } : {},
    })

    // Format with commas
    const formattedActiveCount = activeCount.toLocaleString()
    const formattedTotalCount = totalCount.toLocaleString()

    res.json({
      activeCount: formattedActiveCount,
      totalCount: formattedTotalCount,
      display: `${formattedActiveCount}, ${formattedTotalCount}`,
    })
  } catch (error) {
    console.error("Error getting active users count:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } })

    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.json({ message: "If your email is registered, you will receive a password reset link" })
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Hash token before saving to database
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Save token to user
    user.resetToken = hashedToken
    user.resetTokenExpiry = resetTokenExpiry
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    // Get email template
    const template = emailTemplates.passwordReset(resetUrl)

    // Send email
    await sendEmail({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    res.json({ message: "If your email is registered, you will receive a password reset link" })
  } catch (error) {
    console.error("Password reset request error:", error)
    res.status(500).json({ message: "Failed to process password reset request" })
  }
}

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" })
  }

  try {
    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with valid token
    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          [Op.gt]: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update user password and clear reset token
    user.password = hashedPassword
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()

    res.json({ message: "Password reset successful. You can now log in with your new password." })
  } catch (error) {
    console.error("Password reset error:", error)
    res.status(500).json({ message: "Failed to reset password" })
  }
}

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findByPk(userId, {
      attributes: ["notifyByTelegram", "notificationKeywords"],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      notifyByTelegram: user.notifyByTelegram,
      notificationKeywords: user.notificationKeywords || "",
    })
  } catch (error) {
    console.error("Error getting notification settings:", error)
    res.status(500).json({ message: "Failed to get notification settings" })
  }
}

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id
    const { notifyByTelegram, notificationKeywords } = req.body

    // Validate input
    if (typeof notifyByTelegram !== "boolean") {
      return res.status(400).json({ message: "notifyByTelegram must be a boolean" })
    }

    // Clean and validate keywords
    let cleanedKeywords = null
    if (notificationKeywords) {
      // Split by commas, trim whitespace, filter out empty strings, and join back
      cleanedKeywords = notificationKeywords
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 0)
        .join(",")
    }

    const user = await User.findByPk(userId)
    user.notifyByTelegram = notifyByTelegram
    user.notificationKeywords = cleanedKeywords
    user.lastSeen = new Date()
    await user.save()

    res.json({
      message: "Notification settings updated successfully",
      settings: {
        notifyByTelegram: user.notifyByTelegram,
        notificationKeywords: user.notificationKeywords || "",
      },
    })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    res.status(500).json({ message: "Failed to update notification settings" })
  }
}