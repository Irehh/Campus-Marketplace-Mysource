const express = require('express');
const {
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
  getDashboardMetrics,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public route to get campus admin
router.get('/campus-admin/:campus', getCampusAdmin);
router.get('/campus-admins/:campus', getCampusAdmin);

// Admin dashboard stats
router.get('/stats', isAdmin, getAdminStats);
router.get('/dashboard', isAdmin, getDashboardMetrics);

// Admin management (super admin only)
router.get('/admins', isSuperAdmin, getAdmins);
router.post('/admins', isSuperAdmin, makeAdmin);
router.delete('/admins/:userId', isSuperAdmin, removeAdmin);

// User management (super admin only)
router.get('/users', isSuperAdmin, getAllUsers);
router.delete('/users/:userId', isSuperAdmin, removeUser);

// Product and business management (admin and super admin)
router.get('/disabled-products', isAdmin, getDisabledProducts);
router.get('/disabled-businesses', isAdmin, getDisabledBusinesses);
router.post('/products/:productId/disable', isAdmin, disableProduct);
router.post('/products/:productId/enable', isAdmin, enableProduct);
router.post('/businesses/:businessId/disable', isAdmin, disableBusiness);
router.post('/businesses/:businessId/enable', isAdmin, enableBusiness);

module.exports = router;