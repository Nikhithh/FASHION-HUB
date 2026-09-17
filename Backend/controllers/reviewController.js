const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Add a review for a product
// @route   POST /api/reviews/:productId
// @access  Private (customer)
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Prevent duplicate review
  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({ rating, comment, product: productId, user: req.user._id });
  res.status(201).json({ success: true, data: review });
});

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: reviews.length, data: reviews });
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
// @access  Private (owner)
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }
  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  const updated = await review.save();
  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete own review
// @route   DELETE /api/reviews/:id
// @access  Private (owner)
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }
  await review.remove();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Admin delete any review
// @route   DELETE /api/reviews/admin/:id
// @access  Private (admin)
const adminDeleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  await review.remove();
  res.status(200).json({ success: true, data: {} });
});

module.exports = { addReview, getReviewsByProduct, updateReview, deleteReview, adminDeleteReview };
