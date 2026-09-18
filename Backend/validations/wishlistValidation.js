const { body, param } = require('express-validator');

const validateWishlistAdd = [
  body('product')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID'),
];

const validateWishlistRemove = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid Product ID'),
];

module.exports = { validateWishlistAdd, validateWishlistRemove };
