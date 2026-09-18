const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateOutfit } = require('../services/recommendationService');

// @desc    Generate a rule-based outfit from real catalog products
// @route   POST /api/recommendations/outfit
// @access  Private (customer only)
const getOutfitRecommendation = asyncHandler(async (req, res) => {
  const { occasion, style, color, maxBudget } = req.body;

  const prefs = {
    occasion,
    style,
    color: (color || '').trim(),
    maxBudget: Number(maxBudget),
  };

  // Only purchasable products can ever be recommended.
  const [products, categories] = await Promise.all([
    Product.find({ stock: { $gt: 0 } }),
    Category.find({}),
  ]);

  const categoryTypeByName = {};
  for (const cat of categories) {
    if (cat.name && cat.categoryType) categoryTypeByName[cat.name] = cat.categoryType;
  }

  const outfit = generateOutfit(products, categoryTypeByName, prefs);

  res.status(200).json({
    success: true,
    data: {
      preferences: prefs,
      ...outfit,
    },
  });
});

module.exports = { getOutfitRecommendation };
