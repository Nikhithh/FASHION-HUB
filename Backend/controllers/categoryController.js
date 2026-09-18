const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const CATEGORY_TYPES = ['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'];

// @desc    Get all categories (optional filter by categoryType)
// @route   GET /api/categories?categoryType=
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const { categoryType } = req.query;
  const filter = {};

  if (categoryType) {
    if (!CATEGORY_TYPES.includes(categoryType)) {
      return res.status(400).json({ success: false, message: 'Invalid category type' });
    }
    filter.categoryType = categoryType;
  }

  const categories = await Category.find(filter);
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ success: true, data: category });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, categoryType } = req.body;
  const category = await Category.create({ name, description, categoryType });
  res.status(201).json({ success: true, data: category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ success: true, data: category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
