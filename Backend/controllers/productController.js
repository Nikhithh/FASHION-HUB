const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand'); // added for verification
const mongoose = require('mongoose');
const { toPublicImagePath } = require('../middleware/upload');

// Parse an images-ish body value (array, JSON-stringified array, or single string)
// into a clean array of string URLs. Never throws.
const parseImageUrls = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.filter((u) => typeof u === 'string' && u.trim() !== '');
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === 'string' && u.trim() !== '');
    } catch (e) {
      // not JSON — treat as single URL (unless multipart marker)
    }
    return [trimmed];
  }
  return [];
};

// Merge uploaded files (req.files) with existing/URL images from the body.
// Body may carry `existingImages` (preferred, JSON or array) or `images`.
const collectImageUrls = (req, fallback = []) => {
  const uploaded = (req.files || []).map(toPublicImagePath);
  let base = [];
  if (req.body && req.body.existingImages !== undefined) {
    base = parseImageUrls(req.body.existingImages);
  } else if (req.body && req.body.images !== undefined) {
    base = parseImageUrls(req.body.images);
  } else {
    base = Array.isArray(fallback) ? fallback : [];
  }
  return [...base, ...uploaded];
};
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
  // Reject customers
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Not authorized to create products' });
  }

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
    let brand = await Brand.findById(brandId);
    if (!brand) {
      brand = await Brand.findOne({ name: brandId });
    }
    if (!brand || brand.verificationStatus !== 'Approved') {
      return res.status(403).json({ success: false, message: 'Brand is not approved.' });
    }
    // Check if brand belongs to another seller
    if (brand.seller && req.user.id && brand.seller.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to sell products under this brand.' });
    }
    if (brand.name) {
      req.body.brand = brand.name;
    }
  }

  // Merge uploaded files + URL-based images (multipart or JSON both work)
  req.body.images = collectImageUrls(req, []);

  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  // Reject customers
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Not authorized to update products' });
  }

  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Ownership and brand check for seller
  if (req.user && req.user.role !== 'admin') {
    if (product.seller && product.seller.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    // Do not allow changing the seller field
    if (req.body.seller) {
      delete req.body.seller;
    }

    const brandIdToCheck = req.body.brand || product.brand;
    if (brandIdToCheck) {
      let brand = await Brand.findById(brandIdToCheck);
      if (!brand) {
        brand = await Brand.findOne({ name: brandIdToCheck });
      }
      if (!brand || brand.verificationStatus !== 'Approved') {
        return res.status(403).json({ success: false, message: 'Brand is not approved.' });
      }
      // Check if brand belongs to another seller
      if (brand.seller && req.user.id && brand.seller.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to sell products under this brand.' });
      }
      if (req.body.brand && brand.name) {
        req.body.brand = brand.name;
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

  // Merge images: preserve existing URLs sent as `existingImages`/`images`,
  // otherwise keep current product images, then append newly uploaded files.
  const keepBase = req.body.existingImages !== undefined || req.body.images !== undefined
    ? collectImageUrls(req, [])
    : collectImageUrls(req, product.images || []);
  req.body.images = keepBase;

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
  // Reject customers
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete products' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (req.user && req.user.role !== 'admin') {
    if (product.seller && product.seller.toString() !== req.user.id.toString()) {
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

// @desc    Compare multiple products
// @route   GET /api/products/compare?ids=commaSeparatedIds
// @access  Public
const compareProducts = asyncHandler(async (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) {
    return res.status(400).json({ success: false, message: 'Product IDs are required' });
  }

  const ids = idsParam.split(',').map(id => id.trim()).filter(id => id);

  if (ids.length < 2) {
    return res.status(400).json({ success: false, message: 'At least 2 product IDs are required for comparison' });
  }
  if (ids.length > 4) {
    return res.status(400).json({ success: false, message: 'Maximum 4 products can be compared at a time' });
  }

  // Validate each ID format
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: `Invalid product ID: ${id}` });
    }
  }

  // Reject duplicate IDs
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    return res.status(400).json({ success: false, message: 'Duplicate product IDs are not allowed' });
  }

  // Fetch products — category and brand are Strings, not ObjectId refs
  const products = await Product.find({ _id: { $in: ids } });

  if (products.length !== ids.length) {
    return res.status(404).json({ success: false, message: 'One or more products not found' });
  }

  // Collect unique category names from the fetched products
  const categoryNames = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Query the Category collection to get categoryType for each category name
  const categoryDocs = await Category.find({ name: { $in: categoryNames } });
  const categoryMap = {};
  categoryDocs.forEach(cat => {
    categoryMap[cat.name] = cat.categoryType;
  });

  // Build the response with only the required fields
  const formatted = products.map(p => ({
    _id: p._id,
    name: p.name,
    brand: p.brand || null,
    category: p.category || null,
    categoryType: p.category ? (categoryMap[p.category] || null) : null,
    price: p.price,
    size: p.size || null,
    color: p.color || null,
    stock: p.stock,
    rating: p.rating,
    description: p.description,
    images: p.images,
  }));

  res.status(200).json({ success: true, data: formatted });
});
// @desc    Upload product images (multipart/form-data, field: images, max 5)
// @route   POST /api/products/upload
// @access  Private (seller, admin)
const uploadProductImages = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'customer') {
    return res.status(403).json({ success: false, message: 'Not authorized to upload images' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided. Use field "images".' });
  }
  const urls = req.files.map(toPublicImagePath);
  res.status(201).json({ success: true, count: urls.length, data: urls });
});
module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
  compareProducts,
  uploadProductImages,
};
