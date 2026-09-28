const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const me = (req) => req.user._id || req.user.id;

const assertValidId = (res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid notification ID');
  }
};

// @desc    Get logged-in user's notifications (newest first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: me(req) }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

// @desc    Get unread notification count for logged-in user
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: me(req), isRead: false });
  res.status(200).json({ success: true, count });
});

// @desc    Mark own notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  assertValidId(res, req.params.id);
  const notification = await Notification.findOne({ _id: req.params.id, user: me(req) });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  notification.isRead = true;
  await notification.save();
  res.status(200).json({ success: true, data: notification });
});

// @desc    Mark all own notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: me(req), isRead: false }, { $set: { isRead: true } });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete own notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  assertValidId(res, req.params.id);
  const notification = await Notification.findOne({ _id: req.params.id, user: me(req) });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  await notification.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
