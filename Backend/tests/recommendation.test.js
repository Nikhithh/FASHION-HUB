// tests/recommendation.test.js
// Tests for the RULE-BASED outfit recommendation engine (no AI/externals).
// Service logic is tested purely; the HTTP layer with mocked models.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../middleware/authMiddleware', () => {
  const actual = jest.requireActual('../middleware/authMiddleware');
  const usersByToken = {
    'customer-token': { _id: 'cust1', name: 'Customer', email: 'cust@shop.com', role: 'customer' },
    'seller-token': { _id: 'seller1', name: 'Seller', email: 'seller@shop.com', role: 'seller' },
    'admin-token': { _id: 'admin1', name: 'Admin', email: 'admin@shop.com', role: 'admin' },
  };
  return {
    protect: jest.fn((req, res, next) => {
      const header = req.headers && req.headers.authorization;
      const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
      const user = token ? usersByToken[token] : undefined;
      if (!user) {
        res.status(401);
        return next(new Error('Not authorized to access this resource, token missing'));
      }
      req.user = user;
      return next();
    }),
    authorize: actual.authorize,
    requireApprovedSeller: actual.requireApprovedSeller,
  };
});

jest.mock('../models/Product', () => ({ find: jest.fn() }));
jest.mock('../models/Category', () => ({ find: jest.fn() }));

const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { generateOutfit, scoreProduct } = require('../services/recommendationService');

const catMap = {
  Shirts: 'Top Wear',
  Trousers: 'Bottom Wear',
  Sneakers: 'Footwear',
  Watches: 'Accessories',
};

const mk = (overrides = {}) => ({
  _id: overrides._id || 'p1',
  name: 'Test Product',
  description: 'A product',
  price: 50,
  category: 'Shirts',
  brand: 'Zara',
  color: 'Black',
  stock: 10,
  rating: 4,
  ...overrides,
});

const prefs = { occasion: 'Wedding', style: 'Traditional', color: 'Black', maxBudget: 500 };

describe('scoreProduct (rule weights)', () => {
  test('color match adds 30', () => {
    const base = scoreProduct(mk({ color: 'White', name: 'Plain', description: 'plain' }), prefs).score;
    const matched = scoreProduct(mk({ color: 'Black', name: 'Plain', description: 'plain' }), prefs).score;
    expect(matched - base).toBe(30);
  });

  test('style and occasion keyword hits add 25 each', () => {
    const plain = scoreProduct(mk({ name: 'Plain Tee', description: 'plain everyday top' }), prefs).score;
    const styled = scoreProduct(
      mk({ name: 'Traditional Kurta', description: 'ethnic wedding festive wear' }),
      prefs
    ).score;
    expect(styled - plain).toBe(50);
  });
});

describe('generateOutfit (deterministic selection)', () => {
  const catalog = [
    mk({ _id: 't1', category: 'Shirts', price: 50 }),
    mk({ _id: 'b1', category: 'Trousers', price: 55 }),
    mk({ _id: 'f1', category: 'Sneakers', price: 90 }),
    mk({ _id: 'a1', category: 'Watches', price: 40 }),
  ];

  test('returns one item per slot grouped by CategoryType', () => {
    const out = generateOutfit(catalog, catMap, prefs);
    expect(out.complete).toBe(true);
    expect(out.withinBudget).toBe(true);
    const slots = out.items.map((i) => i.slot).sort();
    expect(slots).toEqual(['Accessories', 'Bottom Wear', 'Footwear', 'Top Wear']);
  });

  test('total stays within budget', () => {
    const out = generateOutfit(catalog, catMap, prefs);
    expect(out.totalPrice).toBeLessThanOrEqual(prefs.maxBudget);
  });

  test('out-of-stock products are never recommended', () => {
    const withOos = [
      mk({ _id: 't-cheap', category: 'Shirts', price: 1, stock: 0 }),
      ...catalog,
    ];
    const out = generateOutfit(withOos, catMap, prefs);
    expect(out.items.some((i) => i.product._id === 't-cheap')).toBe(false);
  });

  test('products with unknown category type are skipped', () => {
    const out = generateOutfit(
      [mk({ _id: 'x', category: 'Mystery', price: 10 })],
      catMap,
      prefs
    );
    expect(out.items).toEqual([]);
    expect(out.complete).toBe(false);
  });

  test('impossible budget returns over-budget outfit with clear message', () => {
    const out = generateOutfit(catalog, catMap, { ...prefs, maxBudget: 10 });
    expect(out.withinBudget).toBe(false);
    expect(out.message).toMatch(/within this budget/);
    // Closest outfit still returned and labelled, never silently over budget.
    expect(out.complete).toBe(true);
  });

  test('every recommended product comes from the input catalog', () => {
    const out = generateOutfit(catalog, catMap, prefs);
    const ids = catalog.map((p) => p._id);
    for (const item of out.items) {
      expect(ids).toContain(item.product._id);
    }
  });
});

describe('POST /api/recommendations/outfit', () => {
  beforeEach(() => jest.clearAllMocks());

  const customerAuth = { Authorization: 'Bearer customer-token' };
  const validBody = { occasion: 'Casual', style: 'Casual', color: 'Black', maxBudget: 500 };

  test('valid customer request returns a complete outfit from MongoDB products', async () => {
    Product.find.mockResolvedValue([
      mk({ _id: 't1', category: 'Shirts', price: 50 }),
      mk({ _id: 'b1', category: 'Trousers', price: 55 }),
      mk({ _id: 'f1', category: 'Sneakers', price: 90 }),
    ]);
    Category.find.mockResolvedValue([
      { name: 'Shirts', categoryType: 'Top Wear' },
      { name: 'Trousers', categoryType: 'Bottom Wear' },
      { name: 'Sneakers', categoryType: 'Footwear' },
    ]);
    const res = await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send(validBody)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.complete).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
  });

  test('only in-stock products are queried', async () => {
    Product.find.mockResolvedValue([]);
    Category.find.mockResolvedValue([]);
    await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send(validBody)
      .expect(200);
    expect(Product.find).toHaveBeenCalledWith({ stock: { $gt: 0 } });
  });

  test('invalid budget is rejected with 400', async () => {
    const res = await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send({ occasion: 'Casual', style: 'Casual', color: 'Black', maxBudget: -5 })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid occasion/style are rejected with 400', async () => {
    await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send({ occasion: 'Graduation', style: 'Casual', color: 'Black', maxBudget: 500 })
      .expect(400);
    await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send({ occasion: 'Casual', style: 'Gothic', color: 'Black', maxBudget: 500 })
      .expect(400);
  });

  test('missing fields are rejected with 400', async () => {
    await request(app)
      .post('/api/recommendations/outfit')
      .set(customerAuth)
      .send({ occasion: 'Casual' })
      .expect(400);
  });

  test('unauthenticated request is rejected with 401', async () => {
    await request(app)
      .post('/api/recommendations/outfit')
      .send(validBody)
      .expect(401);
  });

  test('seller is forbidden from the stylist endpoint with 403', async () => {
    await request(app)
      .post('/api/recommendations/outfit')
      .set({ Authorization: 'Bearer seller-token' })
      .send(validBody)
      .expect(403);
  });

  test('admin is forbidden from the stylist endpoint with 403', async () => {
    await request(app)
      .post('/api/recommendations/outfit')
      .set({ Authorization: 'Bearer admin-token' })
      .send(validBody)
      .expect(403);
  });
});
