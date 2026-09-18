const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { validateWishlistAdd, validateWishlistRemove } = require('../validations/wishlistValidation');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');

const router = express.Router();

// All wishlist routes operate on the authenticated user's own list (req.user)
router.get('/', protect, getWishlist);
router.post('/', protect, validateWishlistAdd, validate, addToWishlist);
router.delete('/:productId', protect, validateWishlistRemove, validate, removeFromWishlist);

module.exports = router;
