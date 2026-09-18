const { body } = require('express-validator');

// Validation for creating/updating an Order – only items, shipping, payment method
const validateOrder = [
  // Items array – each element must contain product (MongoId) and quantity (int >=1)
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non‑empty array'),
  body('items.*.product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer of at least 1'),
  body('items.*.size')
    .optional()
    .isString()
    .withMessage('Size must be a string'),
  body('items.*.color')
    .optional()
    .isString()
    .withMessage('Color must be a string'),

  // Shipping address fields
  body('shippingAddress.address')
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Postal code is required'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  // Payment method – placeholder values only
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash on Delivery', 'Online Payment'])
    .withMessage('Invalid payment method'),
];

module.exports = { validateOrder };
