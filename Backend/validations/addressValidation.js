const { body, param } = require('express-validator');

const addressFields = [
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('label')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Label must be 30 characters or fewer'),
];

// POST /api/users/addresses — all fields required
const addressCreateRules = addressFields;

// PUT /api/users/addresses/:addressId — partial update allowed
const addressUpdateRules = [
  param('addressId')
    .isMongoId()
    .withMessage('Invalid address ID'),
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Street address cannot be empty'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('postalCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Postal code cannot be empty'),
  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
  body('label')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Label must be 30 characters or fewer'),
];

const addressIdRules = [
  param('addressId')
    .isMongoId()
    .withMessage('Invalid address ID'),
];

module.exports = { addressCreateRules, addressUpdateRules, addressIdRules };
