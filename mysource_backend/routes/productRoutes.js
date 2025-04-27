const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductsByIds,
} = require('../controllers/productController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/user', authenticate, getUserProducts);
router.get('/:id', optionalAuth, getProductById);

router.post(
  '/',
  authenticate,
  (req, res, next) => {
    req.upload.array('images', 2)(req, res, (err) => {
      if (err) return next(err);
      createProduct(req, res);
    });
  }
);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.get('/batch', authenticate, getProductsByIds);

module.exports = router;