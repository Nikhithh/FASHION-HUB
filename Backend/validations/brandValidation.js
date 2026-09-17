const { body } = require('express-validator');

const validateBrand = [
  body('name')
    .notEmpty()
    .withMessage('Brand name is required')
    .isString()
    .withMessage('Brand name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
];

module.exports = { validateBrand };
