const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validateCartItem } = require('../validations/cartValidation');
const { validate } = require('../middleware/validationMiddleware');
const { getCart, addItem, updateItem, removeItem } = require('../controllers/cartController');

const router = express.Router();

// Get current user's cart
router.get('/', protect, getCart);

// Add item to cart (validate body)
router.post('/', protect, validateCartItem, validate, addItem);

// Update quantity / price of a cart item (validate body similar to add)
router.put('/:itemId', protect, validateCartItem, validate, updateItem);

// Remove cart item
router.delete('/:itemId', protect, removeItem);

module.exports = router;
