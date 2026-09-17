const express = require('express');
const {
  register,
  login,
  logout,
  getProfile,
} = require('../controllers/authController');
const {
  registerRules,
  loginRules,
  validate,
} = require('../validations/authValidation');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public auth endpoints with inputs validation
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);

// Protected user profile endpoint
router.get('/profile', protect, getProfile);

module.exports = router;
