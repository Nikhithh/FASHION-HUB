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

// Validation for placing an order
const validateOrder = [
  body('shippingAddress.address').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash on Delivery', 'Online Payment'])
    .withMessage('Invalid payment method'),
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('orderItems.*.product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('orderItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('orderItems.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
];

module.exports = { validateOrder };
