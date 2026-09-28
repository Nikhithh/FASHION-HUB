const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const { createNotification } = require('../services/notificationService');

// @desc    Create dummy payment for an order
// @route   POST /api/payments
// @access  Private (user must be logged in)
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  if (!orderId || !paymentMethod) {
    res.status(400);
    throw new Error('orderId and paymentMethod are required');
  }

  // Find the order and ensure it belongs to the user (or admin)
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!(isOwner || isAdmin)) {
    res.status(403);
    throw new Error('Not authorized to pay for this order');
  }

  // Calculate amount from order's totalAmount (ignore any client‑provided amount)
  const amount = order.totalAmount;

  // Create a dummy payment record
  const payment = new Payment({
    order: order._id,
    paymentMethod,
    amount,
    status: 'completed', // In a real integration this would be pending until gateway response
    transactionId: 'dummy_' + Date.now(),
  });

  await payment.save();

  // Update order payment status
  order.paymentStatus = 'Paid';
  await order.save();

  const shortId = String(order._id).slice(-6).toUpperCase();
  await createNotification({
    userId: order.user,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Successful',
    message: `Payment for order #${shortId} was completed successfully.`,
    relatedId: order._id,
    relatedType: 'Order',
  });

  res.status(201).json({ payment, order });
});

module.exports = { createPayment };
