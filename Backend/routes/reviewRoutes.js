const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { reviewRules, reviewUpdateRules } = require('../validations/reviewValidation');
const {
  addReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  adminDeleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

// Add a review for a product (user) - supports both / and /:productId
router.post('/', protect, reviewRules, validate, addReview);
router.post('/:productId', protect, reviewRules, validate, addReview);

// Get all reviews for a product (public)
router.get('/product/:productId', getReviewsByProduct);

// Update own review (rating optional for comment-only edits)
router.put('/:id', protect, reviewUpdateRules, validate, updateReview);

// Delete own review
router.delete('/:id', protect, deleteReview);

// Admin delete any review
router.delete('/admin/:id', protect, authorize('admin'), adminDeleteReview);

module.exports = router;
