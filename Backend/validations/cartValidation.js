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
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('size')
    .optional()
    .isString()
    .withMessage('Size must be a string')
    .isLength({ max: 30 })
    .withMessage('Size must be 30 characters or fewer'),
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string')
    .isLength({ max: 30 })
    .withMessage('Color must be 30 characters or fewer'),
];

const validateCartUpdate = [
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('size')
    .optional()
    .isString()
    .withMessage('Size must be a string')
    .isLength({ max: 30 })
    .withMessage('Size must be 30 characters or fewer'),
  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string')
    .isLength({ max: 30 })
    .withMessage('Color must be 30 characters or fewer'),
];

module.exports = { validateCartItem, validateCartUpdate };
