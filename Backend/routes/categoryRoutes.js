const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateCategory } = require('../validations/categoryValidation');
const { validate } = require('../middleware/validationMiddleware');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected routes (admin can manage categories)
router.post('/', protect, authorize('admin'), validateCategory, validate, createCategory);
router.put('/:id', protect, authorize('admin'), validateCategory, validate, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
