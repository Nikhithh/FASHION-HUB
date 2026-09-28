const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  // Customer
  'ORDER_PLACED',
  'ORDER_PROCESSING',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'PAYMENT_SUCCESS',
  'REVIEW_SUBMITTED',
  // Brand/Seller
  'NEW_ORDER',
  'BRAND_APPROVED',
  'BRAND_REJECTED',
  // Admin
  'NEW_BRAND_APPLICATION',
  'IMPORTANT_ORDER_UPDATE',
];

const RELATED_TYPES = ['Order', 'Brand', 'Product', 'Payment', 'Review', 'User'];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: [true, 'Please add a notification title'], trim: true },
    message: { type: String, required: [true, 'Please add a notification message'], trim: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedType' },
    relatedType: { type: String, enum: RELATED_TYPES },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
module.exports.RELATED_TYPES = RELATED_TYPES;
