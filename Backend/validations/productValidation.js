const { body } = require('express-validator');

const validateProduct = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isString().withMessage('Product name must be a string'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isString().withMessage('Description must be a string'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Category must be a valid ObjectId'),
  body('brand')
    .notEmpty().withMessage('Brand is required')
    .isMongoId().withMessage('Brand must be a valid ObjectId'),
  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array')
    .custom((arr) => arr.every(url => typeof url === 'string')).withMessage('Each image must be a string URL'),
];

module.exports = { validateProduct };
