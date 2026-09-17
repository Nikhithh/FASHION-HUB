const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  // req.user is populated by protect middleware
  res.status(200).json({ success: true, data: req.user });
});

// @desc    Update logged in user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  const { name, email, password } = req.body;
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.password = password; // will be hashed by pre-save hook

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  Object.assign(user, updates);
  await user.save();

  res.status(200).json({ success: true, data: user });
});

module.exports = { getProfile, updateProfile };
