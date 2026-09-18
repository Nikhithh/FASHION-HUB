const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Always return cart items with product populated so every consumer
// (Cart page, Checkout page) sees one consistent shape:
//   { _id, product: { _id, name, price, images }, quantity, price, size, color }
// Tolerant: real Mongoose docs expose .populate(); plain mock objects in
// unit tests may not — skip populating there instead of crashing.
const populateCart = async (cart) => {
  if (cart && typeof cart.populate === 'function') {
    await cart.populate('items.product', 'name price images');
  }
  return cart;
};

const cartResponse = (cart) => {
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items: cart.items, total };
};

// Extract the raw product ObjectId string whether the subdoc is populated or not.
const subdocProductId = (productField) => {
  if (!productField) return '';
  if (typeof productField === 'string') return productField;
  if (typeof productField === 'object') {
    if (productField._id) return productField._id.toString();
    return productField.toString();
  }
  return String(productField);
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images');
  if (!cart) {
    return res.status(200).json({ success: true, data: { items: [], total: 0 } });
  }
  res.status(200).json({ success: true, data: cartResponse(cart) });
});

// @desc    Add item to cart (or increase quantity if same product + variant exists)
// @route   POST /api/cart
// @access  Private
const addItem = asyncHandler(async (req, res) => {
  const { product, quantity, size, color } = req.body;
  // Ensure product exists
  const prod = await Product.findById(product);
  if (!prod) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Server-authoritative price (ignore any client-supplied price)
  const price = prod.price;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  // Same product with a different size/color stays a separate line item
  const existingItem = cart.items.find(
    (i) => subdocProductId(i.product) === product && (i.size || '') === (size || '') && (i.color || '') === (color || '')
  );
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // update price snapshot
  } else {
    cart.items.push({ product, quantity, price, size, color });
  }
  await cart.save();
  await populateCart(cart);
  res.status(201).json({ success: true, data: cartResponse(cart) });
});

// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
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
  // Re-sync price snapshot from the product record (never trust client price)
  const prod = await Product.findById(subdocProductId(item.product));
  if (prod) item.price = prod.price;
  await cart.save();
  await populateCart(cart);
  res.status(200).json({ success: true, data: cartResponse(cart) });
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
  await populateCart(cart);
  res.status(200).json({ success: true, data: cartResponse(cart) });
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
