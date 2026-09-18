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
  body('logo')
    .optional()
    .isString()
    .withMessage('Logo must be a string'),
  body('website')
    .optional()
    .isString()
    .withMessage('Website must be a string'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  body('contactPhone')
    .optional()
    .isString()
    .withMessage('Contact phone must be a string'),
];

module.exports = { validateBrand };
