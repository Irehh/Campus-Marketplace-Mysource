import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { OAuth2Client } from "google-auth-library"

const prisma = new PrismaClient()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Register a new user
export const register = async (req, res) => {
  const { name, email, password, campus } = req.body

  // Validate input
  if (!name || !email || !password || !campus) {
    return res.status(400).json({ message: "Please provide all required fields" })
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" })
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      campus,
    },
  })

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user

  res.status(201).json({
    user: userData,
    token,
  })
}

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" })
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  // Generate JWT
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })

  // Return user data and token (excluding password)
  const { password: _, ...userData } = user

  res.json({
    user: userData,
    token,
  })
}

// Get current user
export const getCurrentUser = async (req, res) => {
  // User is already attached to req by auth middleware
  const { password, ...userData } = req.user

  res.json(userData)
}

// Update user profile
export const updateProfile = async (req, res) => {
  const { name, campus } = req.body
  const userId = req.user.id

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      campus: campus || undefined,
    },
  })

  // Return updated user data (excluding password)
  const { password, ...userData } = updatedUser

  res.json(userData)
}

// Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide current and new password" })
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password)

  if (!isMatch) {
    return res.status(401).json({ message: "Current password is incorrect" })
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  res.json({ message: "Password updated successfully" })
}

// Google OAuth login
export const googleLogin = async (req, res) => {
  const { token } = req.body

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const { email, name, sub: googleId } = ticket.getPayload()

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Create new user if not exists
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          campus: "default", // You might want to ask for campus during first login
        },
      })
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      })
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
      },
      token: jwtToken,
    })
  } catch (error) {
    console.error("Google login error:", error)
    res.status(401).json({ message: "Invalid Google token" })
  }
}

// Link Telegram account
export const linkTelegramAccount = async (req, res) => {
  const { telegramId } = req.body
  const userId = req.user.id

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { telegramId },
    })

    res.json({
      message: "Telegram account linked successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        campus: updatedUser.campus,
        telegramId: updatedUser.telegramId,
      },
    })
  } catch (error) {
    console.error("Error linking Telegram account:", error)
    res.status(400).json({ message: "Failed to link Telegram account" })
  }
}

