const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get current user's saved addresses
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, count: user.addresses.length, data: user.addresses });
});

// @desc    Add a saved address to current user
// @route   POST /api/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { label, address, city, postalCode, country } = req.body;
  user.addresses.push({ label: label || '', address, city, postalCode, country });
  await user.save();
  res.status(201).json({ success: true, count: user.addresses.length, data: user.addresses });
});

// @desc    Edit a saved address of current user
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const sub = user.addresses.id(req.params.addressId);
  if (!sub) {
    res.status(404);
    throw new Error('Address not found');
  }
  const fields = ['label', 'address', 'city', 'postalCode', 'country'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) sub[f] = typeof req.body[f] === 'string' ? req.body[f].trim() : req.body[f];
  });
  await user.save();
  res.status(200).json({ success: true, count: user.addresses.length, data: user.addresses });
});

// @desc    Delete a saved address of current user
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const sub = user.addresses.id(req.params.addressId);
  if (!sub) {
    res.status(404);
    throw new Error('Address not found');
  }
  user.addresses.pull(req.params.addressId);
  await user.save();
  res.status(200).json({ success: true, count: user.addresses.length, data: user.addresses });
});

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
