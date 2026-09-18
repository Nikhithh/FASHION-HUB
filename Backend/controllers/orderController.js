const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

/** Helper: calculate price, subtotal, total (carries selected size/color through) */
const calculateItems = async (items) => {
  const detailed = [];
  let total = 0;
  for (const { product, quantity, size, color } of items) {
    const prod = await Product.findById(product);
    if (!prod) {
      const err = new Error(`Product ${product} not found`);
      err.statusCode = 404;
      throw err;
    }
    if (prod.stock < quantity) {
      const err = new Error(`Insufficient stock for product ${prod.name}`);
      err.statusCode = 400;
      throw err;
    }
    const price = prod.price;
    const subtotal = price * quantity;
    total += subtotal;
    detailed.push({ product, quantity, price, subtotal, size, color });
  }
  return { detailed, total };
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (customer)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  const { detailed, total } = await calculateItems(items);

  const order = new Order({
    user: req.user._id,
    items: detailed,
    shippingAddress,
    paymentMethod,
    totalAmount: total,
  });

  const createdOrder = await order.save();

  // Decrease stock
  for (const { product, quantity } of detailed) {
    await Product.findByIdAndUpdate(product, { $inc: { stock: -quantity } });
  }

  // Clear cart
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(201).json({ success: true, data: createdOrder });
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private (customer)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name price images');
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Get orders containing seller's products
// @route   GET /api/orders/seller
// @access  Private (seller)
const getSellerOrders = asyncHandler(async (req, res) => {
  const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
  const productIds = sellerProducts.map(p => p._id);
  const orders = await Order.find({ 'items.product': { $in: productIds } })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('items.product', 'name price images');
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (owner, seller of any product in order, admin)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name price images seller');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const orderUserId = order.user && order.user._id ? order.user._id.toString() : (order.user ? order.user.toString() : null);
  const isOwner = orderUserId === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isSeller = req.user.role === 'seller' && order.items.some(i => i.product?.seller?.toString() === req.user._id.toString());
  if (!(isOwner || isAdmin || isSeller)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.status(200).json({ success: true, data: order });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (admin, seller of product in order)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const validOrderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const validPaymentStatuses = ['Pending', 'Paid', 'Failed'];
  if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error('Invalid order status');
  }
  if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
    res.status(400);
    throw new Error('Invalid payment status');
  }
  const order = await Order.findById(req.params.id).populate('items.product', 'seller');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isAdmin = req.user.role === 'admin';
  const isSeller = req.user.role === 'seller' && order.items.some(i => i.product?.seller?.toString() === req.user._id.toString());
  if (!(isAdmin || isSeller)) {
    res.status(403);
    throw new Error('Not authorized to update order status');
  }
  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  const updated = await order.save();
  res.status(200).json({ success: true, data: updated });
});

// @desc    Cancel own order (only if pending)
// @route   DELETE /api/orders/:id
// @access  Private (customer)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const orderOwnerId = order.user && order.user._id ? order.user._id.toString() : order.user.toString();
  if (orderOwnerId !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Cannot cancel others\' orders');
  }
  if (order.orderStatus !== 'Pending') {
    res.status(400);
    throw new Error('Only pending orders can be cancelled');
  }
  order.orderStatus = 'Cancelled';
  await order.save();

  // Restore stock for cancelled items
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  res.status(200).json({ success: true, data: order });
});

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private (admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('items.product', 'name price images');
  res.status(200).json({ success: true, count: orders.length, data: orders });
});

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
};
