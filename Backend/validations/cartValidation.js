const { body } = require('express-validator');

const validateCartItem = [
  body('product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
];

module.exports = { validateCartItem };
