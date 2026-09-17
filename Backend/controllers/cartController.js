const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price');
  if (!cart) {
    return res.status(200).json({ success: true, data: { items: [], total: 0 } });
  }
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.status(200).json({ success: true, data: { items: cart.items, total } });
});

// @desc    Add item to cart (or increase quantity if exists)
// @route   POST /api/cart
// @access  Private
const addItem = asyncHandler(async (req, res) => {
  const { product, quantity, price } = req.body;
  // Ensure product exists
  const prod = await Product.findById(product);
  if (!prod) {
    res.status(404);
    throw new Error('Product not found');
  }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  const existingItem = cart.items.find((i) => i.product.toString() === product);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // update price snapshot
  } else {
    cart.items.push({ product, quantity, price });
  }
  await cart.save();
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.status(201).json({ success: true, data: { items: cart.items, total } });
});

// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
  const { quantity, price } = req.body;
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  const item = cart.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }
  if (quantity !== undefined) item.quantity = quantity;
  if (price !== undefined) item.price = price;
  await cart.save();
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.status(200).json({ success: true, data: { items: cart.items, total } });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  const item = cart.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found');
  }
  cart.items.pull(itemId);
  await cart.save();
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.status(200).json({ success: true, data: { items: cart.items, total } });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(200).json({ success: true, data: { items: [], total: 0 } });
  }
  cart.items = [];
  await cart.save();
  res.status(200).json({ success: true, data: { items: [], total: 0 } });
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
