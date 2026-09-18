const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validateCartItem, validateCartUpdate } = require('../validations/cartValidation');
const { validate } = require('../middleware/validationMiddleware');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');

const router = express.Router();

// Get current user's cart
router.get('/', protect, getCart);

// Add item to cart (validate body)
router.post('/', protect, validateCartItem, validate, addItem);

// Clear entire cart
router.delete('/clear', protect, clearCart);

// Update quantity / price of a cart item (partial body allowed)
router.put('/:itemId', protect, validateCartUpdate, validate, updateItem);

// Remove cart item
router.delete('/:itemId', protect, removeItem);

module.exports = router;
