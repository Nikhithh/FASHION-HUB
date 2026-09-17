const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find();
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
const getBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

// @desc    Create brand
// @route   POST /api/brands
// @access  Private
const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
