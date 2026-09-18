const express = require('express');
const { protect, authorize, requireApprovedSeller } = require('../middleware/authMiddleware');
const { validateBrand } = require('../validations/brandValidation');
const { validate } = require('../middleware/validationMiddleware');
const { handleBrandDocUpload } = require('../middleware/upload');
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getVerificationDocument,
} = require('../controllers/brandController');

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Protected routes (sellers manage own brands, admins manage all;
// customers can never create/modify brands -> 403)
router.post('/', protect, authorize('admin', 'seller'), requireApprovedSeller, handleBrandDocUpload('verificationDocument'), validateBrand, validate, createBrand);
router.put('/:id', protect, authorize('admin', 'seller'), requireApprovedSeller, handleBrandDocUpload('verificationDocument'), validateBrand, validate, updateBrand);
router.delete('/:id', protect, authorize('admin', 'seller'), requireApprovedSeller, deleteBrand);

// Owner-seller or admin streams the verification document (never public)
router.get('/:id/verification-document', protect, authorize('admin', 'seller'), requireApprovedSeller, getVerificationDocument);

module.exports = router;
