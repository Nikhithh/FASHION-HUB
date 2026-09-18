// backend/validations/adminValidation.js
// Minimal placeholder validation rules for admin routes.
// Real validation can be added later. For now, each export is an empty array of express-validator checks.

const { body, param } = require('express-validator');

// Dashboard (no specific payload)
const adminDashboardRules = [];

// Param validators
const userIdParam = [param('id', 'Invalid user ID').isMongoId()];
const brandIdParam = [param('id', 'Invalid brand ID').isMongoId()];
const categoryIdParam = [param('id', 'Invalid category ID').isMongoId()];
const productIdParam = [param('id', 'Invalid product ID').isMongoId()];
const orderIdParam = [param('id', 'Invalid order ID').isMongoId()];
const reviewIdParam = [param('id', 'Invalid review ID').isMongoId()];

// Brand create / update validation (basic checks)
const createBrandRules = [];
const updateBrandRules = [];

// Category create / update validation
const createCategoryRules = [];
const updateCategoryRules = [];

// Product create / update validation
const createProductRules = [];
const updateProductRules = [];

// Order status update validation
const updateOrderStatusRules = [];

// User update validation (admin-only route; role must stay within known roles)
const updateUserRules = [
  body('role')
    .optional()
    .isIn(['customer', 'seller', 'admin'])
    .withMessage('Role must be either customer, seller or admin'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean'),
];

module.exports = {
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
};
