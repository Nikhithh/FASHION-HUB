const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { createNotification } = require('../services/notificationService');

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
    { $match: { orderStatus: { $in: ['Delivered'] } } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueResult[0] ? revenueResult[0].totalRevenue : 0;

  const pendingOrders = await Order.countDocuments({ orderStatus: { $nin: ['Delivered', 'Cancelled'] } });
  const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
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

const SUPPORTED_ROLES = ['customer', 'seller', 'admin'];

// Guard: an admin must never lock themselves out by removing their own
// admin role (via the generic update route or the dedicated role route).
const blockSelfDemotion = (req, res, newRole) => {
  const callerId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
  if (callerId && String(req.params.id) === callerId && newRole && newRole !== 'admin') {
    res.status(403);
    throw new Error('You cannot remove your own admin access');
  }
};

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isVerified } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) {
    if (!SUPPORTED_ROLES.includes(role)) {
      res.status(400);
      throw new Error('Role must be either customer, seller or admin');
    }
    blockSelfDemotion(req, res, role);
    updates.role = role;
  }
  // Model-API parity: the User schema carries isVerified, so admins can
  // read/write it here. NOTE: nothing in the current auth/product flow
  // gates on this flag — live seller verification is enforced through
  // Brand.verificationStatus (admin approve/reject brand routes).
  if (isVerified !== undefined) updates.isVerified = isVerified;
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
  const callerId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
  if (callerId && String(user._id || req.params.id) === callerId) {
    res.status(403);
    throw new Error('You cannot delete your own admin account');
  }
  await user.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Change a user's role (dedicated admin-only role API)
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !SUPPORTED_ROLES.includes(role)) {
    res.status(400);
    throw new Error('Role must be either customer, seller or admin');
  }
  blockSelfDemotion(req, res, role);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// ---------- Brand Management ----------
const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create(req.body);
  res.status(201).json({ success: true, data: brand });
});

const getBrands = asyncHandler(async (req, res) => {
  const query = Brand.find();
  const brands = query && typeof query.populate === 'function'
    ? await query.populate('seller', 'name email')
    : await query;
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

const getBrand = asyncHandler(async (req, res) => {
  const query = Brand.findById(req.params.id);
  const brand = query && typeof query.populate === 'function'
    ? await query.populate('seller', 'name email')
    : await query;
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
  await brand.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Brand Status Management ----------
/**
 * @desc Get all pending brands
 * @route GET /api/admin/brands/pending
 * @access Private (admin)
 */
const getPendingBrands = asyncHandler(async (req, res) => {
  const query = Brand.find({ verificationStatus: 'Pending' });
  const brands = query && typeof query.populate === 'function'
    ? await query.populate('seller', 'name email')
    : await query;
  res.status(200).json({ success: true, count: brands.length, data: brands });
});

/**
 * @desc Approve a brand (manual admin verification)
 * @route PUT /api/admin/brands/:id/approve
 * @access Private (admin)
 */
const approveBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  brand.verificationStatus = 'Approved';
  brand.verifiedAt = new Date();
  brand.rejectionReason = undefined;
  if (req.body && typeof req.body.adminVerificationNote === 'string') {
    brand.adminVerificationNote = req.body.adminVerificationNote;
  }
  await brand.save();
  if (brand.seller) {
    await createNotification({
      userId: brand.seller,
      type: 'BRAND_APPROVED',
      title: 'Brand Application Approved',
      message: 'Your brand application has been approved. You can now access your Brand Dashboard.',
      relatedId: brand._id,
      relatedType: 'Brand',
    });
  }
  res.status(200).json({ success: true, data: brand });
});

/**
 * @desc Reject a brand (manual admin verification)
 * @route PUT /api/admin/brands/:id/reject
 * @access Private (admin)
 */
const rejectBrand = asyncHandler(async (req, res) => {
  const reason = req.body && (req.body.rejectionReason || req.body.adminVerificationNote);
  if (!reason || (typeof reason === 'string' && reason.trim() === '')) {
    res.status(400);
    throw new Error('Rejection reason is required');
  }
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  brand.verificationStatus = 'Rejected';
  brand.rejectionReason = typeof reason === 'string' ? reason : String(reason);
  if (req.body && typeof req.body.adminVerificationNote === 'string') {
    brand.adminVerificationNote = req.body.adminVerificationNote;
  } else {
    brand.adminVerificationNote = brand.rejectionReason;
  }
  await brand.save();
  if (brand.seller) {
    await createNotification({
      userId: brand.seller,
      type: 'BRAND_REJECTED',
      title: 'Brand Application Rejected',
      message: `Your brand application has been rejected. Reason: ${brand.rejectionReason}`,
      relatedId: brand._id,
      relatedType: 'Brand',
    });
  }
  res.status(200).json({ success: true, data: brand });
});

/**
 * @desc Stream a brand verification document (admin only)
 * @route GET /api/admin/brands/:id/verification-document
 * @access Private (admin)
 */
const getBrandVerificationDocument = asyncHandler(async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const { brandDocDir } = require('../middleware/upload');
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }
  if (!brand.verificationDocument) {
    res.status(404);
    throw new Error('Verification document not found');
  }
  const filename = path.basename(brand.verificationDocument);
  if (!filename || filename.includes('..')) {
    res.status(404);
    throw new Error('Verification document not found');
  }
  const absPath = path.join(brandDocDir, filename);
  if (!fs.existsSync(absPath)) {
    res.status(404);
    throw new Error('Verification document not found');
  }
  const mime = brand.verificationDocumentMimeType
    || (path.extname(absPath).toLowerCase() === '.pdf' ? 'application/pdf'
      : path.extname(absPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg');
  res.setHeader('Content-Type', mime);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${(brand.verificationDocumentName || 'verification-document').replace(/"/g, '')}"`
  );
  res.sendFile(absPath);
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
  await category.deleteOne();
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
  await product.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// ---------- Order Management ----------
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find();
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const next = orderStatus || status;
  if (next) order.orderStatus = next;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();
  const statusNotifications = {
    Processing: { type: 'ORDER_PROCESSING', title: 'Order Processing', message: `Your order #${String(order._id).slice(-6).toUpperCase()} is being processed.` },
    Shipped: { type: 'ORDER_SHIPPED', title: 'Order Shipped', message: `Your order #${String(order._id).slice(-6).toUpperCase()} has been shipped.` },
    Delivered: { type: 'ORDER_DELIVERED', title: 'Order Delivered', message: `Your order #${String(order._id).slice(-6).toUpperCase()} has been delivered.` },
    Cancelled: { type: 'ORDER_CANCELLED', title: 'Order Cancelled', message: `Your order #${String(order._id).slice(-6).toUpperCase()} has been cancelled.` },
  };
  if (next && statusNotifications[next]) {
    const note = statusNotifications[next];
    await createNotification({
      userId: order.user,
      type: note.type,
      title: note.title,
      message: note.message,
      relatedId: order._id,
      relatedType: 'Order',
    });
  }
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
  const productId = review.product;
  await review.deleteOne();

  // Recalculate product rating and numReviews
  if (productId) {
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews ? reviews.length : 0;
    let rating = 0;
    if (numReviews > 0) {
      const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
      rating = Math.round((sum / numReviews) * 10) / 10;
    }
    await Product.findByIdAndUpdate(productId, { rating, numReviews });
  }

  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getDashboard,
  // Users
  getUsers,
  getUser,
  updateUser,
  updateUserRole,
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
  getBrandVerificationDocument,
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
