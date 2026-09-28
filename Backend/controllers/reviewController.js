const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { createNotification } = require('../services/notificationService');

/**
 * Recalculate Product.rating and Product.numReviews from actual Review documents
 * @param {string|ObjectId} productId
 */
const updateProductRating = async (productId) => {
  if (!productId) return { rating: 0, numReviews: 0 };
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews ? reviews.length : 0;
  let rating = 0;
  if (numReviews > 0) {
    const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    rating = Math.round((sum / numReviews) * 10) / 10;
  }
  await Product.findByIdAndUpdate(productId, {
    rating,
    numReviews,
  });
  return { rating, numReviews };
};

// @desc    Add a review for a product
// @route   POST /api/reviews/:productId or POST /api/reviews
// @access  Private (customer)
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId || req.body.product;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  // Validate rating range 1 - 5
  if (rating === undefined || rating === null || rating < 1 || rating > 5 || isNaN(rating)) {
    res.status(400);
    throw new Error('Rating must be an integer between 1 and 5');
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userId = req.user._id || req.user.id;

  // Prevent duplicate review
  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    rating: Number(rating),
    comment,
    product: productId,
    user: userId,
  });

  // Recalculate product rating & numReviews
  await updateProductRating(productId);

  await createNotification({
    userId,
    type: 'REVIEW_SUBMITTED',
    title: 'Review Submitted',
    message: `Your review for ${product.name} has been submitted successfully.`,
    relatedId: product._id,
    relatedType: 'Product',
  });

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

  const userId = req.user._id || req.user.id;
  if (review.user && review.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  const { rating, comment } = req.body;
  if (rating !== undefined && rating !== null) {
    if (rating < 1 || rating > 5 || isNaN(rating)) {
      res.status(400);
      throw new Error('Rating must be an integer between 1 and 5');
    }
    review.rating = Number(rating);
  }
  if (comment !== undefined) review.comment = comment;

  const updated = await review.save();

  // Recalculate product rating & numReviews
  const productId = review.product;
  await updateProductRating(productId);

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

  const userId = req.user._id || req.user.id;
  if (review.user && review.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const productId = review.product;
  await review.deleteOne();

  // Recalculate product rating & numReviews
  await updateProductRating(productId);

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

  const productId = review.product;
  await review.deleteOne();

  // Recalculate product rating & numReviews
  await updateProductRating(productId);

  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  addReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  adminDeleteReview,
  updateProductRating,
};
