const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

// @desc    Admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (admin)
const getDashboard = asyncHandler(async (req, res) => {
  const [userCount, brandCount, categoryCount, productCount, orderCount] = await Promise.all([
    User.countDocuments(),
    Brand.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
  ]);

  const revenueResult = await Order.aggregate([
    { $match: { status: { $in: ['completed', 'delivered'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;

  const pendingOrders = await Order.countDocuments({ status: { $ne: 'completed' } });
  const completedOrders = await Order.countDocuments({ status: { $in: ['completed', 'delivered'] } });
  const verifiedBrands = await Brand.countDocuments({ verificationStatus: 'Approved' });
  const pendingBrands = await Brand.countDocuments({ verificationStatus: 'Pending' });
  const rejectedBrands = await Brand.countDocuments({ verificationStatus: 'Rejected' });

  res.status(200).json({
    success: true,
    data: {
      totalUsers: userCount,
      totalBrands: brandCount,
      verifiedBrands,
      pendingBrands,
      rejectedBrands,
      totalCategories: categoryCount,
      totalProducts: productCount,
      totalOrders: orderCount,
      totalRevenue,
      pendingOrders,
      completedOrders,
    },
  });
});

// ---------- User Management ----------
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, count: users.length, data: users });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.remove();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Brand Management ----------
const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find();
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

const getBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  await brand.remove();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Brand Status Management ----------
/**
 * @desc Get all pending brands
 * @route GET /api/admin/brands/pending
 * @access Private (admin)
 */
const getPendingBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ verificationStatus: 'Pending' });
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

/**
 * @desc Approve a brand
 * @route PUT /api/admin/brands/:id/approve
 * @access Private (admin)
 */
const approveBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'Approved' },
    { new: true, runValidators: true }
  );
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

/**
 * @desc Reject a brand
 * @route PUT /api/admin/brands/:id/reject
 * @access Private (admin)
 */
const rejectBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'Rejected' },
    { new: true, runValidators: true }
  );
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  res.status(200).json({ success: true, data: brand });
});

// ---------- Category Management ----------
const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.status(200).json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await category.remove();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Product Management ----------
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({ success: true, count: products.length, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.status(200).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.status(200).json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.remove();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Order Management ----------
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find();
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = status || order.status;
  await order.save();
  res.status(200).json({ success: true, data: order });
});

// ---------- Review Management ----------
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate('user', 'name email').populate('product', 'name');
  res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

const deleteAnyReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  await review.remove();
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getDashboard,
  // Users
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  // Brands
  createBrand,
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand,
  // Brand status management
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
};
