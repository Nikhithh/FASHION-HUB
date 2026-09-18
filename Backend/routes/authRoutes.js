const express = require('express');
const {
  register,
  registerSeller,
  login,
  logout,
  getProfile,
  getSellerStatus,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const {
  registerRules,
  sellerRegisterRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate,
} = require('../validations/authValidation');
const { protect } = require('../middleware/authMiddleware');
const { handleBrandDocUpload } = require('../middleware/upload');

const router = express.Router();

// Public auth endpoints with inputs validation
router.post('/register', registerRules, validate, register);
// Combined seller + brand application (multipart/form-data; the
// verification document rides in the `verificationDocument` field)
router.post('/register-seller', handleBrandDocUpload('verificationDocument'), sellerRegisterRules, validate, registerSeller);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, validate, resetPassword);

// Protected user profile endpoint
router.get('/profile', protect, getProfile);

// Seller/brand verification status for the authenticated user
router.get('/seller-status', protect, getSellerStatus);

module.exports = router;
