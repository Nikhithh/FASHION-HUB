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

// Category create / update validation (mirrors the public validateCategory
// rules so invalid enum values fail with 400 instead of a Mongoose 500)
const CATEGORY_TYPES = ['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'];
const createCategoryRules = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('categoryType')
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(CATEGORY_TYPES)
    .withMessage('Invalid category type'),
];
const updateCategoryRules = [
  body('name').optional().notEmpty().withMessage('Category name is required'),
  body('categoryType').optional().isIn(CATEGORY_TYPES).withMessage('Invalid category type'),
];

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

// Dedicated role-change validation (role required, must be a known role)
const updateUserRoleRules = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['customer', 'seller', 'admin'])
    .withMessage('Role must be either customer, seller or admin'),
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
  updateUserRoleRules,
};
