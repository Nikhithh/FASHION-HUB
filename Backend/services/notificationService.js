const Notification = require('../models/Notification');
const User = require('../models/User');

// Real Mongoose models buffer writes while disconnected, which would hang
// callers (including unit tests that mock neighbouring models but leave the
// real connection closed). Skip notification writes when the model's
// connection is not ready. Mocked models (plain objects without a
// collection) always proceed so tests control the behaviour.
const canWrite = (model) => {
  try {
    const conn = model && model.collection && model.collection.conn;
    if (conn) return conn.readyState === 1;
    return true;
  } catch (err) {
    return true;
  }
};

/**
 * Create a single notification. Never throws — notification failures
 * must never break the main business flow (orders, payments, approvals).
 */
const createNotification = async ({ userId, type, title, message, relatedId, relatedType }) => {
  try {
    if (!userId || !type || !title || !message) return null;
    if (!canWrite(Notification)) return null;
    const doc = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedId: relatedId || undefined,
      relatedType: relatedType || undefined,
    });
    return doc;
  } catch (err) {
    return null;
  }
};

/**
 * Notify every admin user. Used for brand applications and important
 * order updates. Never throws.
 */
const notifyAdmins = async ({ type, title, message, relatedId, relatedType }) => {
  try {
    if (!canWrite(User)) return [];
    const found = User.find({ role: 'admin' });
    const admins = await (found && typeof found.select === 'function'
      ? found.select('_id')
      : found);
    if (!Array.isArray(admins) || admins.length === 0) return [];
    const created = await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id || admin.id,
          type,
          title,
          message,
          relatedId,
          relatedType,
        })
      )
    );
    return created.filter(Boolean);
  } catch (err) {
    return [];
  }
};

/**
 * Resolve distinct seller user IDs owning any of the given products.
 * Excludes `excludeUserId` (e.g. the buyer) when provided. Never throws.
 */
const getSellerIdsForProducts = async (productIds, excludeUserId) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) return [];
    const Product = require('../models/Product');
    if (!canWrite(Product)) return [];
    const found = Product.find({ _id: { $in: productIds } });
    const products = await (found && typeof found.select === 'function'
      ? found.select('seller')
      : found);
    if (!Array.isArray(products)) return [];
    const excluded = excludeUserId ? String(excludeUserId) : null;
    const ids = new Set();
    for (const p of products) {
      if (p && p.seller && String(p.seller) !== excluded) ids.add(String(p.seller));
    }
    return [...ids];
  } catch (err) {
    return [];
  }
};

/**
 * Notify every seller owning any of the given products. Never throws.
 */
const notifySellersForProducts = async (productIds, { type, title, message, relatedId, relatedType, excludeUserId }) => {
  try {
    const sellerIds = await getSellerIdsForProducts(productIds, excludeUserId);
    const created = await Promise.all(
      sellerIds.map((sellerId) =>
        createNotification({ userId: sellerId, type, title, message, relatedId, relatedType })
      )
    );
    return created.filter(Boolean);
  } catch (err) {
    return [];
  }
};

module.exports = {
  createNotification,
  notifyAdmins,
  getSellerIdsForProducts,
  notifySellersForProducts,
};
