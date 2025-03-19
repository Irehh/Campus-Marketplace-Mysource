import express from "express"
import {
  getAdmins,
  getAllUsers,
  makeAdmin,
  removeAdmin,
  removeUser,
  disableProduct,
  enableProduct,
  disableBusiness,
  enableBusiness,
  getDisabledProducts,
  getDisabledBusinesses,
  getAdminStats,
  getCampusAdmin,
} from "../controllers/adminController.js"
import { authenticate } from "../middleware/authMiddleware.js"
import { isAdmin, isSuperAdmin } from "../middleware/adminMiddleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Add the new route for getting campus admin
// Public route to get campus admin
router.get("/campus-admin/:campus", getCampusAdmin)

// Add the new route for getting campus admins
router.get("/campus-admins/:campus", getCampusAdmin)

// Admin dashboard stats
router.get("/stats", isAdmin, getAdminStats)

// Admin management (super admin only)
router.get("/admins", isSuperAdmin, getAdmins)
router.post("/admins", isSuperAdmin, makeAdmin)
router.delete("/admins/:userId", isSuperAdmin, removeAdmin)

// User management (super admin only)
router.get("/users", isSuperAdmin, getAllUsers)
router.delete("/users/:userId", isSuperAdmin, removeUser)

// Product and business management (admin and super admin)
router.get("/disabled-products", isAdmin, getDisabledProducts)
router.get("/disabled-businesses", isAdmin, getDisabledBusinesses)
router.post("/products/:productId/disable", isAdmin, disableProduct)
router.post("/products/:productId/enable", isAdmin, enableProduct)
router.post("/businesses/:businessId/disable", isAdmin, disableBusiness)
router.post("/businesses/:businessId/enable", isAdmin, enableBusiness)

export default router

