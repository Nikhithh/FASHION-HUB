const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { outfitRules } = require('../validations/recommendationValidation');
const { getOutfitRecommendation } = require('../controllers/recommendationController');

const router = express.Router();

// Rule-based outfit recommendation from live catalog data.
// CUSTOMER ONLY — sellers/admins must not use the stylist workflow.
router.post('/outfit', protect, authorize('customer'), outfitRules, validate, getOutfitRecommendation);

module.exports = router;
