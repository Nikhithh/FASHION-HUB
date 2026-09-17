const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validateBrand } = require('../validations/brandValidation');
const { validate } = require('../middleware/validationMiddleware');
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Protected routes
router.post('/', protect, validateBrand, validate, createBrand);
router.put('/:id', protect, validateBrand, validate, updateBrand);
router.delete('/:id', protect, deleteBrand);

module.exports = router;
