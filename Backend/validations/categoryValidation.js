const { body } = require('express-validator');

const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isString()
    .withMessage('Category name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
];

module.exports = { validateCategory };
