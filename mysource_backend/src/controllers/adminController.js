// import { PrismaClient } from "@prisma/client"
// import { sendEmail } from "../utils/emailUtils.js"

// const prisma = new PrismaClient()

// // Get all admins
// export const getAdmins = async (req, res) => {
//   try {
//     const admins = await prisma.user.findMany({
//       where: {
//         OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         campus: true,
//         role: true,
//         lastSeen: true,
//       },
//     })

//     res.json(admins)
//   } catch (error) {
//     console.error("Error fetching admins:", error)
//     res.status(500).json({ message: "Failed to fetch admins" })
//   }
// }

// // Get all users (for super admin)
// export const getAllUsers = async (req, res) => {
//   try {
//     const { campus, search, page = 1, limit = 20 } = req.query
//     const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

//     const where = {}

//     // Filter by campus if provided
//     if (campus) {
//       where.campus = campus
//     }

//     // Search by name or email if provided
//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: "insensitive" } },
//         { email: { contains: search, mode: "insensitive" } },
//       ]
//     }

//     const users = await prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         campus: true,
//         role: true,
//         lastSeen: true,
//         createdAt: true,
//         _count: {
//           select: {
//             products: true,
//             businesses: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       skip,
//       take: Number.parseInt(limit),
//     })

//     const total = await prisma.user.count({ where })

//     res.json({
//       users,
//       pagination: {
//         total,
//         page: Number.parseInt(page),
//         pageSize: Number.parseInt(limit),
//         totalPages: Math.ceil(total / Number.parseInt(limit)),
//       },
//     })
//   } catch (error) {
//     console.error("Error fetching users:", error)
//     res.status(500).json({ message: "Failed to fetch users" })
//   }
// }

// // Make a user an admin
// export const makeAdmin = async (req, res) => {
//   const { userId, campus } = req.body

//   if (!userId) {
//     return res.status(400).json({ message: "User ID is required" })
//   }

//   try {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     })

//     if (!user) {
//       return res.status(404).json({ message: "User not found" })
//     }

//     // Update user role to ADMIN
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         role: "ADMIN",
//         // Update campus if provided
//         ...(campus && { campus }),
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         campus: true,
//         role: true,
//       },
//     })

//     // Send email notification to the user
//     try {
//       await sendEmail({
//         to: user.email,
//         subject: "You are now an admin on Campus Marketplace",
//         text: `Congratulations! You have been made an admin for ${campus || user.campus} on Campus Marketplace. You can now manage products, businesses, and users on the platform.`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//             <h2 style="color: #0f766e; text-align: center;">You're Now an Admin!</h2>
//             <p>Congratulations ${user.name || ""}!</p>
//             <p>You have been made an admin for <strong>${campus || user.campus}</strong> on Campus Marketplace.</p>
//             <p>As an admin, you can now:</p>
//             <ul>
//               <li>Manage products and businesses</li>
//               <li>Disable content that violates our policies</li>
//               <li>Act as a middleman for transactions</li>
//               <li>Handle user reports and issues</li>
//             </ul>
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a>
//             </div>
//             <p>Thank you for helping make our platform safe and reliable!</p>
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
//               <p>Campus Marketplace</p>
//             </div>
//           </div>
//         `,
//       })
//     } catch (emailError) {
//       console.error("Error sending admin notification email:", emailError)
//       // Continue even if email fails
//     }

//     res.json({
//       message: "User has been made an admin",
//       admin: updatedUser,
//     })
//   } catch (error) {
//     console.error("Error making user admin:", error)
//     res.status(500).json({ message: "Failed to make user an admin" })
//   }
// }

// // Remove admin role from a user
// export const removeAdmin = async (req, res) => {
//   const { userId } = req.params

//   if (!userId) {
//     return res.status(400).json({ message: "User ID is required" })
//   }

//   try {
//     // Check if user exists and is an admin
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     })

//     if (!user) {
//       return res.status(404).json({ message: "User not found" })
//     }

//     if (user.role !== "ADMIN") {
//       return res.status(400).json({ message: "User is not an admin" })
//     }

//     // Cannot remove super admin role
//     if (user.role === "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Cannot remove super admin role" })
//     }

//     // Update user role to USER
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         role: "USER",
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         campus: true,
//         role: true,
//       },
//     })

//     res.json({
//       message: "Admin role has been removed",
//       user: updatedUser,
//     })
//   } catch (error) {
//     console.error("Error removing admin role:", error)
//     res.status(500).json({ message: "Failed to remove admin role" })
//   }
// }

// // Remove a user from the platform (super admin only)
// export const removeUser = async (req, res) => {
//   const { userId } = req.params

//   if (!userId) {
//     return res.status(400).json({ message: "User ID is required" })
//   }

//   try {
//     // Check if user exists
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         _count: {
//           select: {
//             products: true,
//             businesses: true,
//           },
//         },
//       },
//     })

//     if (!user) {
//       return res.status(404).json({ message: "User not found" })
//     }

//     // Cannot remove a super admin
//     if (user.role === "SUPER_ADMIN") {
//       return res.status(403).json({ message: "Cannot remove a super admin" })
//     }

//     // Start a transaction to remove user and all their content
//     const result = await prisma.$transaction(async (tx) => {
//       // Delete all user's products
//       await tx.product.deleteMany({
//         where: { userId },
//       })

//       // Delete all user's businesses
//       await tx.business.deleteMany({
//         where: { userId },
//       })

//       // Delete all user's comments
//       await tx.comment.deleteMany({
//         where: { userId },
//       })

//       // Delete all messages sent by or to the user
//       await tx.message.deleteMany({
//         where: {
//           OR: [{ senderId: userId }, { receiverId: userId }],
//         },
//       })

//       // Finally, delete the user
//       await tx.user.delete({
//         where: { id: userId },
//       })

//       return {
//         productsRemoved: user._count.products,
//         businessesRemoved: user._count.businesses,
//       }
//     })

//     res.json({
//       message: `User ${user.name || user.email} has been removed from the platform`,
//       details: `Removed ${result.productsRemoved} products and ${result.businessesRemoved} businesses`,
//     })
//   } catch (error) {
//     console.error("Error removing user:", error)
//     res.status(500).json({ message: "Failed to remove user" })
//   }
// }

// // Disable a product
// export const disableProduct = async (req, res) => {
//   const { productId } = req.params
//   const { reason } = req.body

//   if (!productId) {
//     return res.status(400).json({ message: "Product ID is required" })
//   }

//   try {
//     // Check if product exists
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     })

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" })
//     }

//     // Update product to disabled
//     const updatedProduct = await prisma.product.update({
//       where: { id: productId },
//       data: {
//         isDisabled: true,
//         disabledReason: reason || "Violated platform policies",
//       },
//     })

//     // Notify the product owner
//     try {
//       await sendEmail({
//         to: product.user.email,
//         subject: "Your product has been disabled",
//         text: `Your product "${product.description.substring(0, 50)}..." has been disabled by an admin. Reason: ${reason || "Violated platform policies"}. If you believe this is a mistake, please contact our support team.`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//             <h2 style="color: #0f766e; text-align: center;">Product Disabled</h2>
//             <p>Hello ${product.user.name || ""},</p>
//             <p>Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}"</strong> has been disabled by an admin.</p>
//             <p><strong>Reason:</strong> ${reason || "Violated platform policies"}</p>
//             <p>Your product will no longer be visible to other users, but you can still view it in your dashboard.</p>
//             <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
//               <p>Campus Marketplace</p>
//             </div>
//           </div>
//         `,
//       })
//     } catch (emailError) {
//       console.error("Error sending product disabled email:", emailError)
//       // Continue even if email fails
//     }

//     res.json({
//       message: "Product has been disabled",
//       product: updatedProduct,
//     })
//   } catch (error) {
//     console.error("Error disabling product:", error)
//     res.status(500).json({ message: "Failed to disable product" })
//   }
// }

// // Enable a product
// export const enableProduct = async (req, res) => {
//   const { productId } = req.params

//   if (!productId) {
//     return res.status(400).json({ message: "Product ID is required" })
//   }

//   try {
//     // Check if product exists
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     })

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" })
//     }

//     // Update product to enabled
//     const updatedProduct = await prisma.product.update({
//       where: { id: productId },
//       data: {
//         isDisabled: false,
//         disabledReason: null,
//       },
//     })

//     // Notify the product owner
//     try {
//       await sendEmail({
//         to: product.user.email,
//         subject: "Your product has been enabled",
//         text: `Good news! Your product "${product.description.substring(0, 50)}..." has been enabled and is now visible to other users.`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//             <h2 style="color: #0f766e; text-align: center;">Product Enabled</h2>
//             <p>Hello ${product.user.name || ""},</p>
//             <p>Good news! Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}"</strong> has been enabled.</p>
//             <p>Your product is now visible to other users on the platform.</p>
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
//               <p>Campus Marketplace</p>
//             </div>
//           </div>
//         `,
//       })
//     } catch (emailError) {
//       console.error("Error sending product enabled email:", emailError)
//       // Continue even if email fails
//     }

//     res.json({
//       message: "Product has been enabled",
//       product: updatedProduct,
//     })
//   } catch (error) {
//     console.error("Error enabling product:", error)
//     res.status(500).json({ message: "Failed to enable product" })
//   }
// }

// // Disable a business
// export const disableBusiness = async (req, res) => {
//   const { businessId } = req.params
//   const { reason } = req.body

//   if (!businessId) {
//     return res.status(400).json({ message: "Business ID is required" })
//   }

//   try {
//     // Check if business exists
//     const business = await prisma.business.findUnique({
//       where: { id: businessId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     })

//     if (!business) {
//       return res.status(404).json({ message: "Business not found" })
//     }

//     // Update business to disabled
//     const updatedBusiness = await prisma.business.update({
//       where: { id: businessId },
//       data: {
//         isDisabled: true,
//         disabledReason: reason || "Violated platform policies",
//       },
//     })

//     // Notify the business owner
//     try {
//       await sendEmail({
//         to: business.user.email,
//         subject: "Your business has been disabled",
//         text: `Your business "${business.name}" has been disabled by an admin. Reason: ${reason || "Violated platform policies"}. If you believe this is a mistake, please contact our support team.`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//             <h2 style="color: #0f766e; text-align: center;">Business Disabled</h2>
//             <p>Hello ${business.user.name || ""},</p>
//             <p>Your business <strong>"${business.name}"</strong> has been disabled by an admin.</p>
//             <p><strong>Reason:</strong> ${reason || "Violated platform policies"}</p>
//             <p>Your business will no longer be visible to other users, but you can still view it in your dashboard.</p>
//             <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
//               <p>Campus Marketplace</p>
//             </div>
//           </div>
//         `,
//       })
//     } catch (emailError) {
//       console.error("Error sending business disabled email:", emailError)
//       // Continue even if email fails
//     }

//     res.json({
//       message: "Business has been disabled",
//       business: updatedBusiness,
//     })
//   } catch (error) {
//     console.error("Error disabling business:", error)
//     res.status(500).json({ message: "Failed to disable business" })
//   }
// }

// // Enable a business
// export const enableBusiness = async (req, res) => {
//   const { businessId } = req.params

//   if (!businessId) {
//     return res.status(400).json({ message: "Business ID is required" })
//   }

//   try {
//     // Check if business exists
//     const business = await prisma.business.findUnique({
//       where: { id: businessId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     })

//     if (!business) {
//       return res.status(404).json({ message: "Business not found" })
//     }

//     // Update business to enabled
//     const updatedBusiness = await prisma.business.update({
//       where: { id: businessId },
//       data: {
//         isDisabled: false,
//         disabledReason: null,
//       },
//     })

//     // Notify the business owner
//     try {
//       await sendEmail({
//         to: business.user.email,
//         subject: "Your business has been enabled",
//         text: `Good news! Your business "${business.name}" has been enabled and is now visible to other users.`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//             <h2 style="color: #0f766e; text-align: center;">Business Enabled</h2>
//             <p>Hello ${business.user.name || ""},</p>
//             <p>Good news! Your business <strong>"${business.name}"</strong> has been enabled.</p>
//             <p>Your business is now visible to other users on the platform.</p>
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
//               <p>Campus Marketplace</p>
//             </div>
//           </div>
//         `,
//       })
//     } catch (emailError) {
//       console.error("Error sending business enabled email:", emailError)
//       // Continue even if email fails
//     }

//     res.json({
//       message: "Business has been enabled",
//       business: updatedBusiness,
//     })
//   } catch (error) {
//     console.error("Error enabling business:", error)
//     res.status(500).json({ message: "Failed to enable business" })
//   }
// }

// // Get all disabled products
// export const getDisabledProducts = async (req, res) => {
//   const { campus } = req.query

//   try {
//     const whereClause = { isDisabled: true }

//     // If admin is campus-specific, only show products from their campus
//     if (req.user.role === "ADMIN" && req.user.campus) {
//       whereClause.campus = req.user.campus
//     }
//     // If campus is specified in query, filter by that campus
//     else if (campus) {
//       whereClause.campus = campus
//     }

//     const products = await prisma.product.findMany({
//       where: whereClause,
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             campus: true,
//           },
//         },
//         images: true,
//       },
//       orderBy: {
//         updatedAt: "desc",
//       },
//     })

//     res.json(products)
//   } catch (error) {
//     console.error("Error fetching disabled products:", error)
//     res.status(500).json({ message: "Failed to fetch disabled products" })
//   }
// }

// // Get all disabled businesses
// export const getDisabledBusinesses = async (req, res) => {
//   const { campus } = req.query

//   try {
//     const whereClause = { isDisabled: true }

//     // If admin is campus-specific, only show businesses from their campus
//     if (req.user.role === "ADMIN" && req.user.campus) {
//       whereClause.campus = req.user.campus
//     }
//     // If campus is specified in query, filter by that campus
//     else if (campus) {
//       whereClause.campus = campus
//     }

//     const businesses = await prisma.business.findMany({
//       where: whereClause,
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             campus: true,
//           },
//         },
//         images: true,
//       },
//       orderBy: {
//         updatedAt: "desc",
//       },
//     })

//     res.json(businesses)
//   } catch (error) {
//     console.error("Error fetching disabled businesses:", error)
//     res.status(500).json({ message: "Failed to fetch disabled businesses" })
//   }
// }

// // Get admin dashboard stats
// export const getAdminStats = async (req, res) => {
//   try {
//     const whereClause = {}

//     // If admin is campus-specific, only show stats from their campus
//     if (req.user.role === "ADMIN" && req.user.campus) {
//       whereClause.campus = req.user.campus
//     }

//     // Get counts
//     const [
//       totalUsers,
//       totalProducts,
//       totalBusinesses,
//       disabledProducts,
//       disabledBusinesses,
//       recentUsers,
//       recentProducts,
//       recentBusinesses,
//     ] = await Promise.all([
//       // Total users
//       prisma.user.count({
//         where: whereClause,
//       }),

//       // Total products
//       prisma.product.count({
//         where: whereClause,
//       }),

//       // Total businesses
//       prisma.business.count({
//         where: whereClause,
//       }),

//       // Disabled products
//       prisma.product.count({
//         where: {
//           ...whereClause,
//           isDisabled: true,
//         },
//       }),

//       // Disabled businesses
//       prisma.business.count({
//         where: {
//           ...whereClause,
//           isDisabled: true,
//         },
//       }),

//       // Recent users
//       prisma.user.findMany({
//         where: whereClause,
//         orderBy: {
//           createdAt: "desc",
//         },
//         take: 5,
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           campus: true,
//           createdAt: true,
//         },
//       }),

//       // Recent products
//       prisma.product.findMany({
//         where: whereClause,
//         orderBy: {
//           createdAt: "desc",
//         },
//         take: 5,
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           images: {
//             take: 1,
//           },
//         },
//       }),

//       // Recent businesses
//       prisma.business.findMany({
//         where: whereClause,
//         orderBy: {
//           createdAt: "desc",
//         },
//         take: 5,
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           images: {
//             take: 1,
//           },
//         },
//       }),
//     ])

//     res.json({
//       counts: {
//         users: totalUsers,
//         products: totalProducts,
//         businesses: totalBusinesses,
//         disabledProducts,
//         disabledBusinesses,
//       },
//       recent: {
//         users: recentUsers,
//         products: recentProducts,
//         businesses: recentBusinesses,
//       },
//     })
//   } catch (error) {
//     console.error("Error fetching admin stats:", error)
//     res.status(500).json({ message: "Failed to fetch admin statistics" })
//   }
// }

// // Add a new function to get campus admin
// export const getCampusAdmin = async (req, res) => {
//   const { campus } = req.params

//   if (!campus) {
//     return res.status(400).json({ message: "Campus parameter is required" })
//   }

//   try {
//     // Find admin for the specified campus
//     const admin = await prisma.user.findFirst({
//       where: {
//         campus,
//         role: { in: ["ADMIN", "SUPER_ADMIN"] },
//         website: { not: null },
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         website: true,
//         phone: true,
//       },
//     })

//     if (!admin) {
//       return res.status(404).json({ message: "No admin found for this campus" })
//     }

//     res.json(admin)
//   } catch (error) {
//     console.error("Error fetching campus admin:", error)
//     res.status(500).json({ message: "Failed to fetch campus admin" })
//   }
// }

// // Add this function to get all campus admins (not just one)
// export const getCampusAdmins = async (req, res) => {
//   const { campus } = req.params

//   if (!campus) {
//     return res.status(400).json({ message: "Campus parameter is required" })
//   }

//   try {
//     // Find admins for the specified campus
//     const admins = await prisma.user.findMany({
//       where: {
//         campus,
//         role: { in: ["ADMIN", "SUPER_ADMIN"] },
//         website: { not: null },
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         website: true,
//         phone: true,
//         role: true,
//       },
//       orderBy: [
//         { role: "desc" }, // SUPER_ADMIN first, then ADMIN
//         { lastSeen: "desc" }, // Most recently active first
//       ],
//       take: 2, // Limit to 2 admins
//     })

//     if (admins.length === 0) {
//       // If no campus-specific admins, get super admins
//       const superAdmins = await prisma.user.findMany({
//         where: {
//           role: "SUPER_ADMIN",
//           website: { not: null },
//         },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           website: true,
//           phone: true,
//           role: true,
//         },
//         orderBy: {
//           lastSeen: "desc",
//         },
//         take: 2,
//       })

//       if (superAdmins.length === 0) {
//         return res.status(404).json({ message: "No admins found" })
//       }

//       return res.json(superAdmins)
//     }

//     res.json(admins)
//   } catch (error) {
//     console.error("Error fetching campus admins:", error)
//     res.status(500).json({ message: "Failed to fetch campus admins" })
//   }
// }



import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../utils/emailUtils.js";

const prisma = new PrismaClient();

// Get all admins
export const getAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
      },
      select: {
        id: true, // Int
        name: true,
        email: true,
        campus: true,
        role: true,
        lastSeen: true,
      },
    });

    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Failed to fetch admins" });
  }
};

// Get all users (for super admin)
export const getAllUsers = async (req, res) => {
  try {
    const { campus, search, page = 1, limit = 20 } = req.query;
    const parsedPage = Number.parseInt(page);
    const parsedLimit = Number.parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    // Validate pagination parameters
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ message: "Invalid page or limit" });
    }

    const where = {};

    if (campus) {
      where.campus = campus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, // Int
        name: true,
        email: true,
        campus: true,
        role: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            businesses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: parsedLimit,
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        total,
        page: parsedPage,
        pageSize: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Make a user an admin
export const makeAdmin = async (req, res) => {
  const { userId, campus } = req.body;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }, // Use parsed integer
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: parsedUserId }, // Use parsed integer
      data: {
        role: "ADMIN",
        ...(campus && { campus }),
      },
      select: {
        id: true, // Int
        name: true,
        email: true,
        campus: true,
        role: true,
      },
    });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: "You are now an admin on Campus Marketplace",
        text: `Congratulations! You have been made an admin for ${campus || user.campus} on Campus Marketplace. You can now manage products, businesses, and users on the platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">You're Now an Admin!</h2>
            <p>Congratulations ${user.name || ""}!</p>
            <p>You have been made an admin for <strong>${campus || user.campus}</strong> on Campus Marketplace.</p>
            <p>As an admin, you can now:</p>
            <ul>
              <li>Manage products and businesses</li>
              <li>Disable content that violates our policies</li>
              <li>Act as a middleman for transactions</li>
              <li>Handle user reports and issues</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a>
            </div>
            <p>Thank you for helping make our platform safe and reliable!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
    }

    res.json({
      message: "User has been made an admin",
      admin: updatedUser,
    });
  } catch (error) {
    console.error("Error making user admin:", error);
    res.status(500).json({ message: "Failed to make user an admin" });
  }
};

// Remove admin role from a user
export const removeAdmin = async (req, res) => {
  const { userId } = req.params;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Check if user exists and is an admin
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }, // Use parsed integer
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "ADMIN") {
      return res.status(400).json({ message: "User is not an admin" });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot remove super admin role" });
    }

    // Update user role to USER
    const updatedUser = await prisma.user.update({
      where: { id: parsedUserId }, // Use parsed integer
      data: {
        role: "USER",
      },
      select: {
        id: true, // Int
        name: true,
        email: true,
        campus: true,
        role: true,
      },
    });

    res.json({
      message: "Admin role has been removed",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error removing admin role:", error);
    res.status(500).json({ message: "Failed to remove admin role" });
  }
};

// Remove a user from the platform (super admin only)
export const removeUser = async (req, res) => {
  const { userId } = req.params;

  // Parse userId to integer
  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }, // Use parsed integer
      include: {
        _count: {
          select: {
            products: true,
            businesses: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot remove a super admin" });
    }

    // Start a transaction to remove user and their content
    const result = await prisma.$transaction(async (tx) => {
      await tx.product.deleteMany({
        where: { userId: parsedUserId }, // Use parsed integer
      });

      await tx.business.deleteMany({
        where: { userId: parsedUserId }, // Use parsed integer
      });

      await tx.comment.deleteMany({
        where: { userId: parsedUserId }, // Use parsed integer
      });

      await tx.message.deleteMany({
        where: {
          OR: [{ senderId: parsedUserId }, { receiverId: parsedUserId }], // Use parsed integer
        },
      });

      await tx.user.delete({
        where: { id: parsedUserId }, // Use parsed integer
      });

      return {
        productsRemoved: user._count.products,
        businessesRemoved: user._count.businesses,
      };
    });

    res.json({
      message: `User ${user.name || user.email} has been removed from the platform`,
      details: `Removed ${result.productsRemoved} products and ${result.businessesRemoved} businesses`,
    });
  } catch (error) {
    console.error("Error removing user:", error);
    res.status(500).json({ message: "Failed to remove user" });
  }
};

// Disable a product
export const disableProduct = async (req, res) => {
  const { productId } = req.params;
  const { reason } = req.body;

  // Parse productId to integer
  const parsedProductId = parseInt(productId, 10);
  if (isNaN(parsedProductId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId }, // Use parsed integer
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product to disabled
    const updatedProduct = await prisma.product.update({
      where: { id: parsedProductId }, // Use parsed integer
      data: {
        isDisabled: true,
        disabledReason: reason || "Violated platform policies",
      },
    });

    // Notify the product owner
    try {
      await sendEmail({
        to: product.user.email,
        subject: "Your product has been disabled",
        text: `Your product "${product.description.substring(0, 50)}..." has been disabled by an admin. Reason: ${reason || "Violated platform policies"}. If you believe this is a mistake, please contact our support team.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Product Disabled</h2>
            <p>Hello ${product.user.name || ""},</p>
            <p>Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}"</strong> has been disabled by an admin.</p>
            <p><strong>Reason:</strong> ${reason || "Violated platform policies"}</p>
            <p>Your product will no longer be visible to other users, but you can still view it in your dashboard.</p>
            <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending product disabled email:", emailError);
    }

    res.json({
      message: "Product has been disabled",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error disabling product:", error);
    res.status(500).json({ message: "Failed to disable product" });
  }
};

// Enable a product
export const enableProduct = async (req, res) => {
  const { productId } = req.params;

  // Parse productId to integer
  const parsedProductId = parseInt(productId, 10);
  if (isNaN(parsedProductId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId }, // Use parsed integer
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product to enabled
    const updatedProduct = await prisma.product.update({
      where: { id: parsedProductId }, // Use parsed integer
      data: {
        isDisabled: false,
        disabledReason: null,
      },
    });

    // Notify the product owner
    try {
      await sendEmail({
        to: product.user.email,
        subject: "Your product has been enabled",
        text: `Good news! Your product "${product.description.substring(0, 50)}..." has been enabled and is now visible to other users.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Product Enabled</h2>
            <p>Hello ${product.user.name || ""},</p>
            <p>Good news! Your product <strong>"${product.description.substring(0, 50)}${product.description.length > 50 ? "..." : ""}"</strong> has been enabled.</p>
            <p>Your product is now visible to other users on the platform.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending product enabled email:", emailError);
    }

    res.json({
      message: "Product has been enabled",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error enabling product:", error);
    res.status(500).json({ message: "Failed to enable product" });
  }
};

// Disable a business
export const disableBusiness = async (req, res) => {
  const { businessId } = req.params;
  const { reason } = req.body;

  // Parse businessId to integer
  const parsedBusinessId = parseInt(businessId, 10);
  if (isNaN(parsedBusinessId)) {
    return res.status(400).json({ message: "Invalid business ID" });
  }

  try {
    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: parsedBusinessId }, // Use parsed integer
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
          },
        },
      },
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Update business to disabled
    const updatedBusiness = await prisma.business.update({
      where: { id: parsedBusinessId }, // Use parsed integer
      data: {
        isDisabled: true,
        disabledReason: reason || "Violated platform policies",
      },
    });

    // Notify the business owner
    try {
      await sendEmail({
        to: business.user.email,
        subject: "Your business has been disabled",
        text: `Your business "${business.name}" has been disabled by an admin. Reason: ${reason || "Violated platform policies"}. If you believe this is a mistake, please contact our support team.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Business Disabled</h2>
            <p>Hello ${business.user.name || ""},</p>
            <p>Your business <strong>"${business.name}"</strong> has been disabled by an admin.</p>
            <p><strong>Reason:</strong> ${reason || "Violated platform policies"}</p>
            <p>Your business will no longer be visible to other users, but you can still view it in your dashboard.</p>
            <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending business disabled email:", emailError);
    }

    res.json({
      message: "Business has been disabled",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error disabling business:", error);
    res.status(500).json({ message: "Failed to disable business" });
  }
};

// Enable a business
export const enableBusiness = async (req, res) => {
  const { businessId } = req.params;

  // Parse businessId to integer
  const parsedBusinessId = parseInt(businessId, 10);
  if (isNaN(parsedBusinessId)) {
    return res.status(400).json({ message: "Invalid business ID" });
  }

  try {
    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: parsedBusinessId }, // Use parsed integer
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
          },
        },
      },
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Update business to enabled
    const updatedBusiness = await prisma.business.update({
      where: { id: parsedBusinessId }, // Use parsed integer
      data: {
        isDisabled: false,
        disabledReason: null,
      },
    });

    // Notify the business owner
    try {
      await sendEmail({
        to: business.user.email,
        subject: "Your business has been enabled",
        text: `Good news! Your business "${business.name}" has been enabled and is now visible to other users.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0f766e; text-align: center;">Business Enabled</h2>
            <p>Hello ${business.user.name || ""},</p>
            <p>Good news! Your business <strong>"${business.name}"</strong> has been enabled.</p>
            <p>Your business is now visible to other users on the platform.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
              <p>Campus Marketplace</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending business enabled email:", emailError);
    }

    res.json({
      message: "Business has been enabled",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error enabling business:", error);
    res.status(500).json({ message: "Failed to enable business" });
  }
};

// Get all disabled products
export const getDisabledProducts = async (req, res) => {
  const { campus } = req.query;

  try {
    const whereClause = { isDisabled: true };

    if (req.user.role === "ADMIN" && req.user.campus) {
      whereClause.campus = req.user.campus;
    } else if (campus) {
      whereClause.campus = campus;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
            campus: true,
          },
        },
        images: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching disabled products:", error);
    res.status(500).json({ message: "Failed to fetch disabled products" });
  }
};

// Get all disabled businesses
export const getDisabledBusinesses = async (req, res) => {
  const { campus } = req.query;

  try {
    const whereClause = { isDisabled: true };

    if (req.user.role === "ADMIN" && req.user.campus) {
      whereClause.campus = req.user.campus;
    } else if (campus) {
      whereClause.campus = campus;
    }

    const businesses = await prisma.business.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true, // Int
            name: true,
            email: true,
            campus: true,
          },
        },
        images: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json(businesses);
  } catch (error) {
    console.error("Error fetching disabled businesses:", error);
    res.status(500).json({ message: "Failed to fetch disabled businesses" });
  }
};

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const whereClause = {};

    if (req.user.role === "ADMIN" && req.user.campus) {
      whereClause.campus = req.user.campus;
    }

    const [
      totalUsers,
      totalProducts,
      totalBusinesses,
      disabledProducts,
      disabledBusinesses,
      recentUsers,
      recentProducts,
      recentBusinesses,
    ] = await Promise.all([
      prisma.user.count({
        where: whereClause,
      }),
      prisma.product.count({
        where: whereClause,
      }),
      prisma.business.count({
        where: whereClause,
      }),
      prisma.product.count({
        where: {
          ...whereClause,
          isDisabled: true,
        },
      }),
      prisma.business.count({
        where: {
          ...whereClause,
          isDisabled: true,
        },
      }),
      prisma.user.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true, // Int
          name: true,
          email: true,
          campus: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true, // Int
              name: true,
            },
          },
          images: {
            take: 1,
          },
        },
      }),
      prisma.business.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true, // Int
              name: true,
            },
          },
          images: {
            take: 1,
          },
        },
      }),
    ]);

    res.json({
      counts: {
        users: totalUsers,
        products: totalProducts,
        businesses: totalBusinesses,
        disabledProducts,
        disabledBusinesses,
      },
      recent: {
        users: recentUsers,
        products: recentProducts,
        businesses: recentBusinesses,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
};

// Get campus admin
export const getCampusAdmin = async (req, res) => {
  const { campus } = req.params;

  if (!campus) {
    return res.status(400).json({ message: "Campus parameter is required" });
  }

  try {
    const admin = await prisma.user.findFirst({
      where: {
        campus,
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        website: { not: null },
      },
      select: {
        id: true, // Int
        name: true,
        email: true,
        website: true,
        phone: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ message: "No admin found for this campus" });
    }

    res.json(admin);
  } catch (error) {
    console.error("Error fetching campus admin:", error);
    res.status(500).json({ message: "Failed to fetch campus admin" });
  }
};

// Get all campus admins
export const getCampusAdmins = async (req, res) => {
  const { campus } = req.params;

  if (!campus) {
    return res.status(400).json({ message: "Campus parameter is required" });
  }

  try {
    const admins = await prisma.user.findMany({
      where: {
        campus,
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        website: { not: null },
      },
      select: {
        id: true, // Int
        name: true,
        email: true,
        website: true,
        phone: true,
        role: true,
      },
      orderBy: [
        { role: "desc" },
        { lastSeen: "desc" },
      ],
      take: 2,
    });

    if (admins.length === 0) {
      const superAdmins = await prisma.user.findMany({
        where: {
          role: "SUPER_ADMIN",
          website: { not: null },
        },
        select: {
          id: true, // Int
          name: true,
          email: true,
          website: true,
          phone: true,
          role: true,
        },
        orderBy: {
          lastSeen: "desc",
        },
        take: 2,
      });

      if (superAdmins.length === 0) {
        return res.status(404).json({ message: "No admins found" });
      }

      return res.json(superAdmins);
    }

    res.json(admins);
  } catch (error) {
    console.error("Error fetching campus admins:", error);
    res.status(500).json({ message: "Failed to fetch campus admins" });
  }
};


export const getDashboardMetrics = async (req, res) => {
  const userId = req.user.id; // Integer from auth middleware
  const { campus } = req.query; // Optional campus filter
  const role = req.user.role; // ADMIN or SUPER_ADMIN
  const userCampus = req.user.campus; // e.g., unilag

  try {
    // Build where clauses
    const userWhere = role === "SUPER_ADMIN" ? {} : { campus: userCampus };
    if (campus && role === "SUPER_ADMIN") {
      userWhere.campus = campus;
    }

    const productWhere = role === "SUPER_ADMIN" ? {} : { campus: userCampus };
    if (campus && role === "SUPER_ADMIN") {
      productWhere.campus = campus;
    }

    const businessWhere = role === "SUPER_ADMIN" ? {} : { campus: userCampus };
    if (campus && role === "SUPER_ADMIN") {
      businessWhere.campus = campus;
    }

    // Fetch metrics
    const [totalUsers, totalProducts, totalBusinesses, disabledProducts, disabledBusinesses] =
      await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.product.count({ where: productWhere }),
        prisma.business.count({ where: businessWhere }),
        prisma.product.count({ where: { ...productWhere, isDisabled: true } }),
        prisma.business.count({ where: { ...businessWhere, isDisabled: true } }),
      ]);

    // Users by campus (only for super admin or if campus is not filtered)
    const usersByCampus = role === "SUPER_ADMIN" && !campus
      ? await prisma.user.groupBy({
          by: ["campus"],
          _count: { id: true },
        }).then((results) =>
          results.reduce((acc, { campus, _count }) => {
            acc[campus] = _count.id;
            return acc;
          }, {}),
        )
      : campus
        ? { [campus]: totalUsers }
        : { [userCampus]: totalUsers };

    // Products by category
    const productsByCategory = await prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      where: productWhere,
    }).then((results) =>
      results.reduce((acc, { category, _count }) => {
        acc[category] = _count.id;
        return acc;
      }, {}),
    );

    // Businesses by category
    const businessesByCategory = await prisma.business.groupBy({
      by: ["category"],
      _count: { id: true },
      where: businessWhere,
    }).then((results) =>
      results.reduce((acc, { category, _count }) => {
        acc[category] = _count.id;
        return acc;
      }, {}),
    );

    res.json({
      totalUsers,
      totalProducts,
      totalBusinesses,
      disabledProducts,
      disabledBusinesses,
      usersByCampus,
      productsByCategory,
      businessesByCategory,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
};