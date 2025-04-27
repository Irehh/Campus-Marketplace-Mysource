const express = require('express');
const {
  getBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses,
  addBusinessImages,
  deleteBusinessImage,
  getBusinessesByIds,
} = require('../controllers/businessController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Public/optional auth routes
router.get('/', optionalAuth, getBusinesses);
router.get('/user', authenticate, getUserBusinesses);
router.get('/:id', optionalAuth, getBusinessById);

// Protected routes
router.post(
  '/',
  authenticate,
  (req, res, next) => {
    req.upload.single('image')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  createBusiness
);

router.put('/:id', authenticate, updateBusiness);
router.delete('/:id', authenticate, deleteBusiness);

// New routes for image management
router.post(
  '/:id/images',
  authenticate,
  (req, res, next) => {
    req.upload.array('images', 4)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  addBusinessImages
);

router.delete('/:id/images/:imageId', authenticate, deleteBusinessImage);

router.get('/batch', authenticate, getBusinessesByIds);

module.exports = router;