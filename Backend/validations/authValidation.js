const { body, validationResult } = require('express-validator');

// Validation rules for registration
const registerRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['customer', 'seller'])
    .withMessage('Role must be either customer or seller'),
];

// Validation rules for the combined seller + brand application.
// Reuses the same account rules as plain registration plus the required
// brand name; optional brand fields mirror validations/brandValidation.js.
const sellerRegisterRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('brandName')
    .notEmpty()
    .withMessage('Brand name is required')
    .isString()
    .withMessage('Brand name must be a string'),
  body('brandDescription')
    .optional()
    .isString()
    .withMessage('Brand description must be a string'),
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
// Validation rules for login
const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation rules for forgot password
const forgotPasswordRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

// Validation rules for reset password (new password body; token is a URL param)
const resetPasswordRules = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Middleware to check validation results and handle errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array().map((err) => err.msg).join(', ')));
  }
  next();
};

module.exports = {
  registerRules,
  sellerRegisterRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate,
};
