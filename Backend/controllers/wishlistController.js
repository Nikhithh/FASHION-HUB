const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'wishlist',
    'name price images stock brand category'
  );
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, count: user.wishlist.length, data: user.wishlist });
});

// @desc    Add product to current user's wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { product } = req.body;

  // Verify product exists
  const prod = await Product.findById(product);
  if (!prod) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent duplicates
  if (user.wishlist.some((id) => id.toString() === product)) {
    return res.status(400).json({ success: false, message: 'Product already in wishlist' });
  }

  user.wishlist.push(product);
  await user.save();
  await user.populate('wishlist', 'name price images stock brand category');
  res.status(201).json({ success: true, count: user.wishlist.length, data: user.wishlist });
});

// @desc    Remove product from current user's wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.wishlist.some((id) => id.toString() === productId)) {
    res.status(404);
    throw new Error('Product not in wishlist');
  }

  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();
  await user.populate('wishlist', 'name price images stock brand category');
  res.status(200).json({ success: true, count: user.wishlist.length, data: user.wishlist });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
