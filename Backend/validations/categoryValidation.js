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
  body('categoryType')
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'])
    .withMessage('Invalid category type'),
];

module.exports = { validateCategory };
