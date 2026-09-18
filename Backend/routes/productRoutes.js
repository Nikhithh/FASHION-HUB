const express = require('express');
const { protect, authorize, requireApprovedSeller } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { handleUpload } = require('../middleware/upload');
const { getProducts, getProduct, searchProducts, filterProducts, compareProducts, createProduct, updateProduct, deleteProduct, uploadProductImages } = require('../controllers/productController');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/compare', compareProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:id', getProduct);

// Protected routes (sellers/admins only — enforced by protect + authorize)
// Standalone image upload: multipart/form-data, field "images", max 5 files
router.post('/upload', protect, authorize('admin', 'seller'), requireApprovedSeller, handleUpload('images', 5), uploadProductImages);
// Create/update accept JSON (images: [urls]) AND multipart (files + existingImages)
router.post('/', protect, authorize('admin', 'seller'), requireApprovedSeller, handleUpload('images', 5), createProduct);
router.put('/:id', protect, authorize('admin', 'seller'), requireApprovedSeller, handleUpload('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin', 'seller'), requireApprovedSeller, deleteProduct);

module.exports = router;
