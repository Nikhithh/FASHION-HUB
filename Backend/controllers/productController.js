const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand'); // added for verification

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.status(200).json({ success: true, data: product });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const Category = require('../models/Category');

const createProduct = asyncHandler(async (req, res) => {
  // Category validation
  if (req.body.category) {
    const categoryExists = await Category.findOne({ name: req.body.category });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid category. Please select an existing category.' });
    }
  }

  // Set seller to authenticated user (Do not trust client ID)
  if (req.user && req.user.role !== 'admin') {
    req.body.seller = req.user.id;
  }

  // Brand validation
  if (req.user && req.user.role !== 'admin') {
    const brandId = req.body.brand;
    if (!brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required' });
    }
    const brand = await Brand.findById(brandId);
    if (!brand || brand.verificationStatus !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Brand is not approved.' });
    }
  }

  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Ownership and brand check for seller
  if (req.user && req.user.role !== 'admin') {
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    // Do not allow changing the seller field
    if (req.body.seller) {
      delete req.body.seller;
    }

    const brandIdToCheck = req.body.brand || product.brand;
    if (brandIdToCheck) {
      const brand = await Brand.findById(brandIdToCheck);
      if (!brand || brand.verificationStatus !== 'Approved') {
        return res.status(403).json({ success: false, message: 'Brand is not approved.' });
      }
    }
  }

  // Category validation
  if (req.body.category) {
    const categoryExists = await Category.findOne({ name: req.body.category });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid category. Please select an existing category.' });
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (req.user && req.user.role !== 'admin') {
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }
  }

  await product.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Search products by name
// @route   GET /api/products/search?keyword=keyword
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { keyword } = req.query;
  const filter = {};
  if (keyword) {
    filter.name = new RegExp(keyword, 'i');
  }
  const products = await Product.find(filter);
  res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Filter products by brand, category, price range, and keyword
// @route   GET /api/products/filter?brand=...&category=...&minPrice=...&maxPrice=...&keyword=...
// @access  Public
const mongoose = require('mongoose');

const filterProducts = asyncHandler(async (req, res) => {
  const { keyword, brand, category, minPrice, maxPrice } = req.query;
  const filter = {};

  if (keyword) {
    filter.name = new RegExp(keyword, 'i');
  }

  if (category) {
    const Category = require('../models/Category');
    let q = { name: category };
    if (mongoose.Types.ObjectId.isValid(category)) {
      q = { $or: [{ name: category }, { _id: category }] };
    }
    const categoryExists = await Category.findOne(q);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    filter.category = category;
  }

  if (brand) {
    const Brand = require('../models/Brand');
    let q = { name: brand };
    if (mongoose.Types.ObjectId.isValid(brand)) {
      q = { $or: [{ name: brand }, { _id: brand }] };
    }
    const brandExists = await Brand.findOne(q);
    if (!brandExists) {
      return res.status(400).json({ success: false, message: 'Invalid brand' });
    }
    filter.brand = brand;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const min = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : 0;
    const max = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : Infinity;

    if (isNaN(min) || min < 0) {
      return res.status(400).json({ success: false, message: 'Invalid minimum price' });
    }
    if (isNaN(max) || max < 0) {
      return res.status(400).json({ success: false, message: 'Invalid maximum price' });
    }
    if (min > max) {
      return res.status(400).json({ success: false, message: 'minPrice cannot be greater than maxPrice' });
    }

    filter.price = {};
    if (minPrice !== undefined && minPrice !== '') filter.price.$gte = min;
    if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = max;
  }

  const products = await Product.find(filter);
  res.status(200).json({ success: true, count: products.length, data: products });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
};
