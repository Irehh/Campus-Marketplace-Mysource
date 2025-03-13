import express from "express"
import {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  addBusinessImages,
  deleteBusinessImage,
} from "../controllers/businessController.js"
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public/optional auth routes
router.get("/", optionalAuth, getBusinesses)
router.get("/:id", optionalAuth, getBusinessById)

// Protected routes
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    req.upload.single("image")(req, res, (err) => {
      if (err) return next(err)
      next()
    })
  },
  createBusiness,
)

router.put("/:id", authenticate, updateBusiness)
router.delete("/:id", authenticate, deleteBusiness)

// New routes for image management
router.post(
  "/:id/images",
  authenticate,
  (req, res, next) => {
    req.upload.array("images", 4)(req, res, (err) => {
      if (err) return next(err)
      next()
    })
  },
  addBusinessImages,
)

router.delete("/:id/images/:imageId", authenticate, deleteBusinessImage)

export default router

