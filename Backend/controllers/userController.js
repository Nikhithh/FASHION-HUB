const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Strip password/hash from a user object before sending to frontend
const sanitizeUser = (userDoc) => {
  if (!userDoc) return userDoc;
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  return obj;
};

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  // req.user is populated by protect middleware (password already excluded)
  const user = await User.findById(req.user._id || req.user.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

// @desc    Update logged in user profile (name only; email/role read-only)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id; // never trust frontend for ID
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Only name is updatable — email, role, password, _id are ignored
  if (req.body.name !== undefined) {
    user.name = req.body.name.trim();
  }

  await user.save();
  res.status(200).json({ success: true, data: sanitizeUser(user) });
});

// @desc    Change logged in user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id; // never trust frontend for ID
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword; // hashed by pre-save hook
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

module.exports = { getProfile, updateProfile, changePassword };
