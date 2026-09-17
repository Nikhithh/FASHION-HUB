const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { reviewRules } = require('../validations/reviewValidation');
const {
  addReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  adminDeleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

// Add a review for a product (user)
router.post('/:productId', protect, reviewRules, validate, addReview);

// Get all reviews for a product (public)
router.get('/product/:productId', getReviewsByProduct);

// Update own review
router.put('/:id', protect, reviewRules, validate, updateReview);

// Delete own review
router.delete('/:id', protect, deleteReview);

// Admin delete any review
router.delete('/admin/:id', protect, authorize('admin'), adminDeleteReview);

module.exports = router;
