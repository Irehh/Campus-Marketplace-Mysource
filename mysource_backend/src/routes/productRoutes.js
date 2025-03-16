import express from "express"
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
} from "../controllers/productController.js"
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public/optional auth routes
router.get("/", optionalAuth, getProducts)
router.get("/:id", optionalAuth, getProductById)

// Protected routes
router.get("/user", authenticate, getUserProducts)
router.post("/", authenticate, (req, res, next) => {
  req.upload.array("images", 2)(req, res, (err) => {
    if (err) return next(err)
    createProduct(req, res)
  })
})

router.put("/:id", authenticate, updateProduct)
router.delete("/:id", authenticate, deleteProduct)

export default router

