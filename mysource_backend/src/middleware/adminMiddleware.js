import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Middleware to check if user is an admin
export const isAdmin = async (req, res, next) => {
  try {
    // User should already be attached to req by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    // Check if user is an admin
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Admin access required" })
    }

    // User is an admin, proceed
    next()
  } catch (error) {
    console.error("Admin middleware error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Middleware to check if user is a super admin
export const isSuperAdmin = async (req, res, next) => {
  try {
    // User should already be attached to req by auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    // Check if user is a super admin
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Super admin access required" })
    }

    // User is a super admin, proceed
    next()
  } catch (error) {
    console.error("Super admin middleware error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

