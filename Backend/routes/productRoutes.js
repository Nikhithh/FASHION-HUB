const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateProduct } = require('../validations/productValidation');
const { validate } = require('../middleware/validationMiddleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  filterProducts,
} = require('../controllers/productController');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);

// Protected routes
router.post('/', protect, authorize('admin', 'seller'), validateProduct, validate, createProduct);
router.put('/:id', protect, authorize('admin', 'seller'), validateProduct, validate, updateProduct);
router.delete('/:id', protect, authorize('admin', 'seller'), deleteProduct);

module.exports = router;
