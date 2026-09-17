const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  adminDashboardRules,
  userIdParam,
  brandIdParam,
  categoryIdParam,
  productIdParam,
  orderIdParam,
  reviewIdParam,
  createBrandRules,
  updateBrandRules,
  createCategoryRules,
  updateCategoryRules,
  createProductRules,
  updateProductRules,
  updateOrderStatusRules,
  updateUserRules,
} = require('../validations/adminValidation');

const {
  getDashboard,
  // Users
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPendingBrands,
  approveBrand,
  rejectBrand,
  // Categories
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  // Products
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  // Orders
  getOrders,
  updateOrderStatus,
  // Reviews
  getAllReviews,
  deleteAnyReview,
} = require('../controllers/adminController');

const router = express.Router();

// Dashboard
router.get('/dashboard', protect, authorize('admin'), adminDashboardRules, validate, getDashboard);

// User Management
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect, authorize('admin'), userIdParam, validate, getUser);
router.put('/users/:id', protect, authorize('admin'), userIdParam, updateUserRules, validate, updateUser);
router.delete('/users/:id', protect, authorize('admin'), userIdParam, validate, deleteUser);

// Brand Management
router.get('/brands/pending', protect, authorize('admin'), getPendingBrands);
router.put('/brands/:id/approve', protect, authorize('admin'), brandIdParam, approveBrand);
router.put('/brands/:id/reject', protect, authorize('admin'), brandIdParam, rejectBrand);

router.get('/brands', protect, authorize('admin'), getBrands);
router.get('/brands/:id', protect, authorize('admin'), brandIdParam, validate, getBrand);
router.put('/brands/:id', protect, authorize('admin'), brandIdParam, updateBrandRules, validate, updateBrand);
router.delete('/brands/:id', protect, authorize('admin'), brandIdParam, validate, deleteBrand);

// Category Management
router.post('/categories', protect, authorize('admin'), createCategoryRules, validate, createCategory);
router.get('/categories', protect, authorize('admin'), getCategories);
router.get('/categories/:id', protect, authorize('admin'), categoryIdParam, validate, getCategory);
router.put('/categories/:id', protect, authorize('admin'), categoryIdParam, updateCategoryRules, validate, updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), categoryIdParam, validate, deleteCategory);

// Product Management
router.post('/products', protect, authorize('admin'), createProductRules, validate, createProduct);
router.get('/products', protect, authorize('admin'), getProducts);
router.get('/products/:id', protect, authorize('admin'), productIdParam, validate, getProduct);
router.put('/products/:id', protect, authorize('admin'), productIdParam, updateProductRules, validate, updateProduct);
router.delete('/products/:id', protect, authorize('admin'), productIdParam, validate, deleteProduct);

// Order Management
router.get('/orders', protect, authorize('admin'), getOrders);
router.put('/orders/:id/status', protect, authorize('admin'), orderIdParam, updateOrderStatusRules, validate, updateOrderStatus);

// Review Management
router.get('/reviews', protect, authorize('admin'), getAllReviews);
router.delete('/reviews/:id', protect, authorize('admin'), reviewIdParam, validate, deleteAnyReview);

module.exports = router;
