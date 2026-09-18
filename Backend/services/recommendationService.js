// services/recommendationService.js
// RULE-BASED (no AI/ML) outfit recommendation engine.
//
// The engine only ever selects from real product documents passed in by the
// controller (queried from MongoDB). Scoring is a deterministic weighted sum:
//
//   color match    -> +30
//   style match    -> +25
//   occasion match -> +25
//   required slot  -> +10
//   budget fit     -> +10 / +5 / +0
//   rating bonus   -> +0..+10
//
// Style/occasion signals are inferred with keyword matching against the
// product's own name + description + brand + category text, because the
// Product schema has no dedicated style/occasion fields.

const OCCASIONS = ['Casual', 'Formal', 'Party', 'Wedding', 'Sports'];
const STYLES = ['Casual', 'Formal', 'Traditional', 'Streetwear', 'Sporty'];

// Outfit slots in priority order. The first three are required for a
// "complete" outfit; Accessories and Outerwear are optional extras.
const OUTFIT_SLOTS = ['Top Wear', 'Bottom Wear', 'Footwear', 'Accessories', 'Outerwear'];
const CORE_SLOTS = ['Top Wear', 'Bottom Wear', 'Footwear'];

const OCCASION_KEYWORDS = {
  Casual: ['casual', 'daily', 'weekend', 'outing', 'summer', 'relaxed', 'street', 'everyday'],
  Formal: ['formal', 'office', 'business', 'meeting', 'elegant', 'premium'],
  Party: ['party', 'evening', 'club', 'stylish', 'premium', 'night'],
  Wedding: ['wedding', 'traditional', 'ethnic', 'kurta', 'festive', 'ceremony', 'sherwani', 'celebration'],
  Sports: ['sports', 'running', 'athletic', 'gym', 'training', 'sneaker', 'workout'],
};

const STYLE_KEYWORDS = {
  Casual: ['casual', 'relaxed', 'everyday', 'classic', 'comfort', 'cotton', 'linen'],
  Formal: ['formal', 'premium', 'elegant', 'office', 'business', 'leather'],
  Traditional: ['traditional', 'ethnic', 'kurta', 'festive', 'heritage', 'handloom', 'embroidery'],
  Streetwear: ['street', 'oversized', 'graphic', 'denim', 'urban', 'hoodie'],
  Sporty: ['sports', 'athletic', 'running', 'training', 'gym', 'sneaker', 'fleece'],
};

const SCORE = { COLOR: 30, STYLE: 25, OCCASION: 25, SLOT: 10, BUDGET_FULL: 10, BUDGET_PART: 5 };

const searchableText = (product) =>
  [product.name, product.description, product.brand, product.category, product.color]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const matchesKeyword = (text, keywords) => keywords.some((kw) => text.includes(kw));

/**
 * Score one product against the user preferences.
 * @returns {{ score: number, reasons: string[] }}
 */
const scoreProduct = (product, prefs) => {
  const text = searchableText(product);
  let score = SCORE.SLOT; // candidate is always in a required outfit slot
  const reasons = ['Fits the outfit slot'];

  if (prefs.color && (product.color || '').toLowerCase() === prefs.color.toLowerCase()) {
    score += SCORE.COLOR;
    reasons.push(`Matches your color: ${product.color}`);
  }
  if (prefs.style && matchesKeyword(text, STYLE_KEYWORDS[prefs.style] || [])) {
    score += SCORE.STYLE;
    reasons.push(`Matches style: ${prefs.style}`);
  }
  if (prefs.occasion && matchesKeyword(text, OCCASION_KEYWORDS[prefs.occasion] || [])) {
    score += SCORE.OCCASION;
    reasons.push(`Suits occasion: ${prefs.occasion}`);
  }
  // Budget suitability: cheaper items leave room for the rest of the outfit.
  if (product.price <= prefs.maxBudget / 3) {
    score += SCORE.BUDGET_FULL;
    reasons.push('Great value for your budget');
  } else if (product.price <= prefs.maxBudget / 2) {
    score += SCORE.BUDGET_PART;
  }
  // Customer rating bonus (0..10).
  const ratingBonus = Math.min(Math.max(Number(product.rating) || 0, 0), 5) * 2;
  score += ratingBonus;
  if (ratingBonus >= 8) reasons.push(`Highly rated (${product.rating}/5)`);

  return { score, reasons };
};

const sortCandidates = (a, b) => b.score - a.score || a.product.price - b.product.price;

/**
 * Build an outfit from scored candidates, one item per slot.
 * Greedy: walk slots in priority order, take the best item that still
 * fits the remaining budget. Accessories/Outerwear may stay empty.
 */
const pickWithinBudget = (bySlot, maxBudget) => {
  const items = [];
  let remaining = maxBudget;
  for (const slot of OUTFIT_SLOTS) {
    const pick = (bySlot[slot] || []).find((c) => c.product.price <= remaining);
    if (pick) {
      items.push({ slot, product: pick.product, score: pick.score, reasons: pick.reasons });
      remaining -= pick.product.price;
    }
  }
  return items;
};

/** Fallback: best items per slot ignoring budget (clearly labelled over-budget). */
const pickBestEffort = (bySlot) =>
  OUTFIT_SLOTS.map((slot) => {
    const best = (bySlot[slot] || [])[0];
    return best
      ? { slot, product: best.product, score: best.score, reasons: best.reasons }
      : null;
  }).filter(Boolean);

const totalPrice = (items) => Math.round(items.reduce((sum, i) => sum + i.product.price, 0) * 100) / 100;

/**
 * Generate an outfit recommendation.
 * @param {Array} products - in-stock MongoDB product objects (plain or docs)
 * @param {Object} categoryTypeByName - map: category name -> CategoryType
 * @param {Object} prefs - { occasion, style, color, maxBudget }
 */
const generateOutfit = (products, categoryTypeByName, prefs) => {
  const bySlot = {};
  for (const product of products || []) {
    if (!product || (product.stock || 0) <= 0) continue; // never recommend unbuyable items
    const slot = categoryTypeByName[product.category];
    if (!OUTFIT_SLOTS.includes(slot)) continue; // category without a known type
    const { score, reasons } = scoreProduct(product, prefs);
    (bySlot[slot] = bySlot[slot] || []).push({ product, score, reasons });
  }
  Object.values(bySlot).forEach((list) => list.sort(sortCandidates));

  let items = pickWithinBudget(bySlot, prefs.maxBudget);
  const coreFilled = CORE_SLOTS.every((slot) => items.some((i) => i.slot === slot));
  let withinBudget = coreFilled && totalPrice(items) <= prefs.maxBudget;
  let message = 'Outfit generated from available products.';

  if (!withinBudget) {
    const fallback = pickBestEffort(bySlot);
    const fallbackCore = CORE_SLOTS.every((slot) => fallback.some((i) => i.slot === slot));
    if (fallbackCore) {
      items = fallback;
      message = `No complete outfit matching all your preferences was found within this budget. Showing the closest outfit ($${totalPrice(items).toFixed(2)}), which exceeds your budget.`;
    } else {
      items = fallback;
      message = 'No complete outfit matching all your preferences was found within this budget.';
    }
    withinBudget = false;
  }

  return {
    items,
    totalPrice: totalPrice(items),
    withinBudget,
    complete: CORE_SLOTS.every((slot) => items.some((i) => i.slot === slot)),
    message,
  };
};

module.exports = {
  OCCASIONS,
  STYLES,
  OUTFIT_SLOTS,
  CORE_SLOTS,
  generateOutfit,
  scoreProduct,
};
