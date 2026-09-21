// tests/admin.test.js
// Jest + Supertest integration tests for Admin routes (dashboard & resource management)
//
// Auth strategy: the REAL `authorize` middleware is used, while `protect` is
// stubbed to map fixed bearer tokens to users of each role. This exercises the
// genuine role checks (admin allowed, seller/customer denied with 403,
// missing token denied with 401) without needing a database.

const request = require('supertest');

jest.mock('../middleware/authMiddleware', () => {
  const actual = jest.requireActual('../middleware/authMiddleware');
  const usersByToken = {
    'admin-token': { _id: 'admin1', name: 'Admin', email: 'admin@fashionhub.com', role: 'admin' },
    'seller-token': { _id: 'seller1', name: 'Seller', email: 'seller@fashionhub.com', role: 'seller' },
    'customer-token': { _id: 'cust1', name: 'Customer', email: 'cust@fashionhub.com', role: 'customer' },
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

const app = require('../app'); // Express app

// Mock all models used by admin controllers
jest.mock('../models/User', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Brand', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Category', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Product', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../models/Order', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() }));
jest.mock('../models/Review', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndDelete: jest.fn() }));

const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Fixed bearer tokens mapped to roles by the mocked `protect` above.
const adminToken = 'Bearer admin-token';
const sellerToken = 'Bearer seller-token';
const customerToken = 'Bearer customer-token';
const authHeader = token => ({ Authorization: token });

// Route params are validated with isMongoId(), so tests must use ObjectId-like ids.
const OID = '507f1f77bcf86cd799439011';
const OID2 = '507f1f77bcf86cd799439012';

describe('Admin Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------- Dashboard -------------------
  test('GET /api/admin/dashboard returns aggregated statistics', async () => {
    User.countDocuments.mockResolvedValue(10);
    Brand.countDocuments.mockImplementation(async (filter) => {
      if (!filter) return 3;
      if (filter.verificationStatus === 'Approved') return 2;
      if (filter.verificationStatus === 'Pending') return 1;
      return 0;
    });
    Category.countDocuments.mockResolvedValue(5);
    Product.countDocuments.mockResolvedValue(20);
    Order.countDocuments.mockImplementation(async (filter) => {
      if (!filter) return 15;
      if (filter.orderStatus === 'Delivered') return 5;
      return 4; // pending (not Delivered/Cancelled)
    });
    Order.aggregate.mockResolvedValue([{ totalRevenue: 5000 }]);
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader(adminToken))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalUsers: 10,
      totalBrands: 3,
      totalCategories: 5,
      totalProducts: 20,
      totalOrders: 15,
      totalRevenue: 5000,
      pendingOrders: 4,
      completedOrders: 5,
      verifiedBrands: 2,
      pendingBrands: 1,
    });
  });

  // ------------------- Users Management -------------------
  test('GET /api/admin/users lists all users', async () => {
    const users = [{ _id: 'u1', name: 'Alice' }, { _id: 'u2', name: 'Bob' }];
    User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(users) });
    const res = await request(app)
      .get('/api/admin/users')
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.find).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(users);
  });

  test('GET /api/admin/users/:id returns a single user', async () => {
    const user = { _id: OID, name: 'Alice' };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    const res = await request(app)
      .get(`/api/admin/users/${OID}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.findById).toHaveBeenCalledWith(OID);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(user);
  });

  test('PUT /api/admin/users/:id updates a user', async () => {
    const updated = { _id: OID, name: 'Alice Updated' };
    User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(updated) });
    const res = await request(app)
      .put(`/api/admin/users/${OID}`)
      .set(authHeader(adminToken))
      .send({ name: 'Alice Updated' })
      .expect(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      OID,
      { name: 'Alice Updated' },
      { new: true, runValidators: true }
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  test('PUT /api/admin/users/:id rejects an invalid role', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${OID}`)
      .set(authHeader(adminToken))
      .send({ role: 'superadmin' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('DELETE /api/admin/users/:id removes a user', async () => {
    User.findById.mockResolvedValue({ _id: OID, deleteOne: jest.fn().mockResolvedValue({}) });
    const res = await request(app)
      .delete(`/api/admin/users/${OID}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.findById).toHaveBeenCalledWith(OID);
    expect(res.body.success).toBe(true);
  });

  test('PUT /api/admin/users/:id/role changes a user role', async () => {
    const updated = { _id: OID, name: 'Bob', role: 'seller' };
    User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(updated) });
    const res = await request(app)
      .put(`/api/admin/users/${OID}/role`)
      .set(authHeader(adminToken))
      .send({ role: 'seller' })
      .expect(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      OID,
      { role: 'seller' },
      { new: true, runValidators: true }
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('seller');
  });

  test('PUT /api/admin/users/:id/role rejects an invalid role', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${OID}/role`)
      .set(authHeader(adminToken))
      .send({ role: 'superadmin' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('PUT /api/admin/users/:id/role rejects a missing role', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${OID}/role`)
      .set(authHeader(adminToken))
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('PUT /api/admin/users/:id/role forbids non-admin callers', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${OID}/role`)
      .set(authHeader(customerToken))
      .send({ role: 'seller' })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('PUT /api/admin/users/:id/role returns 404 for unknown user', async () => {
    User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app)
      .put(`/api/admin/users/${OID}/role`)
      .set(authHeader(adminToken))
      .send({ role: 'customer' })
      .expect(404);
    expect(res.body.success).toBe(false);
  });

  // ------------------- Brands Management -------------------
  test('POST /api/admin/brands creates a brand', async () => {
    const payload = { name: 'NewBrand' };
    const created = { _id: 'b1', ...payload };
    Brand.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/admin/brands')
      .set(authHeader(adminToken))
      .send(payload)
      .expect(201);
    expect(Brand.create).toHaveBeenCalledWith(payload);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // ------------------- Categories Management -------------------
  test('POST /api/admin/categories creates a category', async () => {
    const payload = { name: 'NewCat' };
    const created = { _id: 'c1', ...payload };
    Category.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/admin/categories')
      .set(authHeader(adminToken))
      .send(payload)
      .expect(201);
    expect(Category.create).toHaveBeenCalledWith(payload);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // ------------------- Products Management -------------------
  test('POST /api/admin/products creates a product', async () => {
    const payload = { name: 'Shirt', price: 30, brand: 'b1', category: 'c1' };
    const created = { _id: 'p1', ...payload };
    Product.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/admin/products')
      .set(authHeader(adminToken))
      .send(payload)
      .expect(201);
    expect(Product.create).toHaveBeenCalledWith(payload);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // ------------------- Orders Management -------------------
  test('GET /api/admin/orders lists all orders', async () => {
    const list = [{ _id: 'o1' }, { _id: 'o2' }];
    Order.find.mockResolvedValue(list);
    const res = await request(app)
      .get('/api/admin/orders')
      .set(authHeader(adminToken))
      .expect(200);
    expect(Order.find).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(list);
  });

  test('PUT /api/admin/orders/:id/status updates order status', async () => {
    const orderDoc = { _id: OID, status: 'Pending', save: jest.fn().mockResolvedValue(true) };
    Order.findById.mockResolvedValue(orderDoc);
    const res = await request(app)
      .put(`/api/admin/orders/${OID}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'shipped' })
      .expect(200);
    expect(Order.findById).toHaveBeenCalledWith(OID);
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('shipped');
  });

  // ------------------- Reviews Management -------------------
  test('GET /api/admin/reviews lists all reviews', async () => {
    const reviews = [{ _id: 'r1' }, { _id: 'r2' }];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reviews),
      }),
    });
    const res = await request(app)
      .get('/api/admin/reviews')
      .set(authHeader(adminToken))
      .expect(200);
    expect(Review.find).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(reviews);
  });

  test('DELETE /api/admin/reviews/:id removes a review', async () => {
    Review.findById.mockResolvedValue({
      _id: OID,
      product: OID2,
      deleteOne: jest.fn().mockResolvedValue({}),
    });
    Review.find.mockResolvedValue([]);
    Product.findByIdAndUpdate.mockResolvedValue({});
    const res = await request(app)
      .delete(`/api/admin/reviews/${OID}`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(Review.findById).toHaveBeenCalledWith(OID);
    expect(res.body.success).toBe(true);
  });

  // ------------------- Authorization Failures -------------------
  test('Customer cannot access admin API (403)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader(customerToken))
      .expect(403);
    expect(res.body.success).toBe(false);
  });

  test('Seller cannot access admin API (403)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader(sellerToken))
      .expect(403);
    expect(res.body.success).toBe(false);
  });

  test('Seller cannot access admin user management (403)', async () => {
    await request(app)
      .get('/api/admin/users')
      .set(authHeader(sellerToken))
      .expect(403);
  });

  test('Access admin routes without token returns 401', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .expect(401);
  });

  test('Access admin routes with an unknown token returns 401', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader('Bearer unknown-token'))
      .expect(401);
  });
});
