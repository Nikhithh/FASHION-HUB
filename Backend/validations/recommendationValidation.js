const { body } = require('express-validator');
const { OCCASIONS, STYLES } = require('../services/recommendationService');

const outfitRules = [
  body('occasion')
    .notEmpty()
    .withMessage('Occasion is required')
    .isIn(OCCASIONS)
    .withMessage(`Occasion must be one of: ${OCCASIONS.join(', ')}`),
  body('style')
    .notEmpty()
    .withMessage('Style is required')
    .isIn(STYLES)
    .withMessage(`Style must be one of: ${STYLES.join(', ')}`),
  body('color')
    .notEmpty()
    .withMessage('Preferred color is required')
    .isString()
    .withMessage('Color must be a string')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Color must be between 2 and 30 characters'),
  body('maxBudget')
    .notEmpty()
    .withMessage('Maximum budget is required')
    .isFloat({ gt: 0 })
    .withMessage('Maximum budget must be a number greater than 0'),
];

module.exports = { outfitRules };
