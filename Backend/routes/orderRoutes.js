const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateOrder } = require('../validations/orderValidation');
const { validate } = require('../middleware/validationMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');

const router = express.Router();

// General routes
router.route('/')
  .post(protect, validateOrder, validate, createOrder)
  .get(protect, authorize('admin', 'seller'), getAllOrders);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/status')
  .put(protect, authorize('admin', 'seller'), updateOrderStatus);

module.exports = router;
