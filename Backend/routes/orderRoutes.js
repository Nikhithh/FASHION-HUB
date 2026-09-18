const express = require('express');
const { protect, authorize, requireApprovedSeller } = require('../middleware/authMiddleware');
const { validateOrder } = require('../validations/orderValidation');
const { validate } = require('../middleware/validationMiddleware');
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require('../controllers/orderController');

const router = express.Router();

// General routes
router.route('/')
  .post(protect, validateOrder, validate, createOrder)
  .get(protect, authorize('admin'), getAllOrders);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/seller')
  .get(protect, authorize('admin', 'seller'), requireApprovedSeller, getSellerOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, cancelOrder);

router.route('/:id/cancel')
  .put(protect, cancelOrder)
  .post(protect, cancelOrder);

router.route('/:id/status')
  .put(protect, authorize('admin', 'seller'), requireApprovedSeller, updateOrderStatus);

module.exports = router;
