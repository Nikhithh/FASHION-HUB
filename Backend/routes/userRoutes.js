const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { profileUpdateRules, passwordChangeRules } = require('../validations/userValidation');
const { addressCreateRules, addressUpdateRules, addressIdRules } = require('../validations/addressValidation');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');

const router = express.Router();

// Get current user's profile
router.get('/profile', protect, getProfile);

// Update current user's profile (only name allowed)
router.put('/profile', protect, profileUpdateRules, validate, updateProfile);

// Change password
router.put('/change-password', protect, passwordChangeRules, validate, changePassword);

// Saved delivery addresses (operates only on the authenticated user's own list)
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addressCreateRules, validate, addAddress);
router.put('/addresses/:addressId', protect, addressUpdateRules, validate, updateAddress);
router.delete('/addresses/:addressId', protect, addressIdRules, validate, deleteAddress);

module.exports = router;
