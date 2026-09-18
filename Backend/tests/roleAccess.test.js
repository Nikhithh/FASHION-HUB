// tests/roleAccess.test.js
// Role-based access audit for Category Management (ADMIN ONLY) and the
// customer-only stylist endpoint wiring.
//
//  POST/PUT/DELETE /api/categories -> admin only (403 otherwise)
//  GET /api/categories            -> public (sellers need it for product forms)
//
// No database required: models + `protect` are stubbed, REAL `authorize`
// middleware runs.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../middleware/authMiddleware', () => {
  const actual = jest.requireActual('../middleware/authMiddleware');
  const usersByToken = {
    'admin-token': { _id: 'admin1', id: 'admin1', name: 'Admin', email: 'admin@shop.com', role: 'admin' },
    'seller-token': { _id: 'seller1', id: 'seller1', name: 'Seller', email: 'seller@shop.com', role: 'seller' },
    'customer-token': { _id: 'cust1', id: 'cust1', name: 'Customer', email: 'cust@shop.com', role: 'customer' },
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

jest.mock('../models/Category', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Brand', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Product', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');

const OID = '507f1f77bcf86cd799439011';
const adminAuth = { Authorization: 'Bearer admin-token' };
const sellerAuth = { Authorization: 'Bearer seller-token' };
const customerAuth = { Authorization: 'Bearer customer-token' };

describe('Category management is ADMIN ONLY', () => {
  beforeEach(() => jest.clearAllMocks());

  test('seller can VIEW categories (needed for product creation)', async () => {
    Category.find.mockResolvedValue([{ _id: 'c1', name: 'Shirts', categoryType: 'Top Wear' }]);
    const res = await request(app).get('/api/categories').set(sellerAuth).expect(200);
    expect(res.body.success).toBe(true);
  });

  test.each([
    ['seller', sellerAuth],
    ['customer', customerAuth],
  ])('%s POST /api/categories -> 403', async (_role, authHeader) => {
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader)
      .send({ name: 'Sneaky', categoryType: 'Footwear' })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(Category.create).not.toHaveBeenCalled();
  });

  test.each([
    ['seller', sellerAuth],
    ['customer', customerAuth],
  ])('%s PUT /api/categories/:id -> 403', async (_role, authHeader) => {
    await request(app)
      .put(`/api/categories/${OID}`)
      .set(authHeader)
      .send({ name: 'Sneaky' })
      .expect(403);
    expect(Category.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test.each([
    ['seller', sellerAuth],
    ['customer', customerAuth],
  ])('%s DELETE /api/categories/:id -> 403', async (_role, authHeader) => {
    await request(app).delete(`/api/categories/${OID}`).set(authHeader).expect(403);
    expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
  });

  test('unauthenticated category write -> 401', async () => {
    await request(app).post('/api/categories').send({ name: 'Anon' }).expect(401);
  });

  test('admin can still manage categories', async () => {
    Category.create.mockResolvedValue({ _id: 'c9', name: 'Jackets', categoryType: 'Outerwear' });
    const created = await request(app)
      .post('/api/categories')
      .set(adminAuth)
      .send({ name: 'Jackets', categoryType: 'Outerwear' })
      .expect(201);
    expect(created.body.success).toBe(true);
  });
});

describe('Product ownership (seller own-only, admin all, customer none)', () => {
  beforeEach(() => jest.clearAllMocks());

  const ownProduct = { _id: OID, name: 'My Shirt', seller: 'seller1' };
  const otherProduct = { _id: OID, name: 'Their Shirt', seller: 'anotherSeller' };

  test('ADMIN can edit any product', async () => {
    Product.findById.mockResolvedValue(otherProduct);
    Product.findByIdAndUpdate.mockResolvedValue({ ...otherProduct, name: 'Admin Edit' });
    const res = await request(app)
      .put(`/api/products/${OID}`)
      .set(adminAuth)
      .send({ name: 'Admin Edit' })
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  test('SELLER can edit own product', async () => {
    Product.findById.mockResolvedValue(ownProduct);
    Product.findByIdAndUpdate.mockResolvedValue({ ...ownProduct, name: 'Updated' });
    await request(app)
      .put(`/api/products/${OID}`)
      .set(sellerAuth)
      .send({ name: 'Updated' })
      .expect(200);
  });

  test("SELLER cannot edit another seller's product -> 403", async () => {
    Product.findById.mockResolvedValue(otherProduct);
    await request(app)
      .put(`/api/products/${OID}`)
      .set(sellerAuth)
      .send({ name: 'Hijack' })
      .expect(403);
    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('CUSTOMER cannot edit products -> 403', async () => {
    await request(app)
      .put(`/api/products/${OID}`)
      .set(customerAuth)
      .send({ name: 'Hijack' })
      .expect(403);
    expect(Product.findById).not.toHaveBeenCalled();
  });
});

describe('Brand management roles', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SELLER can manage own brand', async () => {
    Brand.findById.mockResolvedValue({ _id: OID, name: 'Mine', seller: 'seller1' });
    Brand.findByIdAndUpdate.mockResolvedValue({ _id: OID, name: 'Mine Updated' });
    const res = await request(app)
      .put(`/api/brands/${OID}`)
      .set(sellerAuth)
      .send({ name: 'Mine Updated' })
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  test("SELLER cannot manage another seller's brand -> 403", async () => {
    Brand.findById.mockResolvedValue({ _id: OID, name: 'Theirs', seller: 'anotherSeller' });
    await request(app)
      .put(`/api/brands/${OID}`)
      .set(sellerAuth)
      .send({ name: 'Hijack' })
      .expect(403);
    expect(Brand.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('CUSTOMER cannot manage brands -> 403', async () => {
    await request(app)
      .put(`/api/brands/${OID}`)
      .set(customerAuth)
      .send({ name: 'Hijack' })
      .expect(403);
    await request(app)
      .post('/api/brands')
      .set(customerAuth)
      .send({ name: 'Fake' })
      .expect(403);
    expect(Brand.create).not.toHaveBeenCalled();
  });
});
