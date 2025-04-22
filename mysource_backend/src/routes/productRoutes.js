

import express from "express"
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductsByIds
} from "../controllers/productController.js"
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", optionalAuth, getProducts)
router.get("/user", authenticate, getUserProducts)
router.get("/:id", optionalAuth, getProductById) // This should NOT match /user

router.post("/", authenticate, (req, res, next) => {
  req.upload.array("images", 2)(req, res, (err) => {
    if (err) return next(err)
    createProduct(req, res)
  })
})
router.put("/:id", authenticate, updateProduct)
router.delete("/:id", authenticate, deleteProduct)
router.get("/batch", authenticate, getProductsByIds)

export default router