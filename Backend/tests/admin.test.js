// tests/admin.test.js
// Jest + Supertest integration tests for Admin routes (dashboard & resource management)

const request = require('supertest');
const app = require('../app'); // Express app

// Mock all models used by admin controllers
jest.mock('../models/User', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }));
jest.mock('../models/Brand', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }));
jest.mock('../models/Category', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }));
jest.mock('../models/Product', () => ({ find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }));
jest.mock('../models/Order', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }));
jest.mock('../models/Review', () => ({ find: jest.fn(), findById: jest.fn(), findByIdAndDelete: jest.fn() }));

const User = require('../models/User');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Dummy admin token – the protect/authorize middleware in the project accepts any token and checks role via decoded payload.
const adminToken = 'Bearer dummyAdminToken';
const nonAdminToken = 'Bearer dummyUserToken';
const authHeader = token => ({ Authorization: token });

describe('Admin Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------- Dashboard -------------------
  test('GET /api/admin/dashboard returns aggregated statistics', async () => {
    // Mock each model countDocuments call (implemented in controller via Model.countDocuments())
    User.countDocuments = jest.fn().mockResolvedValue(10);
    Brand.countDocuments = jest.fn().mockResolvedValue(3);
    Category.countDocuments = jest.fn().mockResolvedValue(5);
    Product.countDocuments = jest.fn().mockResolvedValue(20);
    Order.countDocuments = jest.fn().mockResolvedValue(15);
    Order.aggregate = jest.fn().mockResolvedValue([{ totalRevenue: 5000 }]);
    Order.countDocuments.mockResolvedValueOnce(4); // pending orders mock
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
    });
  });

  // ------------------- Users Management -------------------
  test('GET /api/admin/users lists all users', async () => {
    const users = [{ _id: 'u1', name: 'Alice' }, { _id: 'u2', name: 'Bob' }];
    User.find.mockResolvedValue(users);
    const res = await request(app)
      .get('/api/admin/users')
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.find).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(users);
  });

  test('GET /api/admin/users/:id returns a single user', async () => {
    const user = { _id: 'u1', name: 'Alice' };
    User.findById.mockResolvedValue(user);
    const res = await request(app)
      .get('/api/admin/users/u1')
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(user);
  });

  test('PUT /api/admin/users/:id updates a user', async () => {
    const updated = { _id: 'u1', name: 'Alice Updated' };
    User.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/admin/users/u1')
      .set(authHeader(adminToken))
      .send({ name: 'Alice Updated' })
      .expect(200);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { name: 'Alice Updated' }, { new: true, runValidators: true });
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  test('DELETE /api/admin/users/:id removes a user', async () => {
    User.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/admin/users/u1')
      .set(authHeader(adminToken))
      .expect(200);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
    expect(res.body.success).toBe(true);
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

  test('PUT /api/admin/orders/:id updates order status', async () => {
    const updated = { _id: 'o1', status: 'shipped' };
    Order.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/admin/orders/o1')
      .set(authHeader(adminToken))
      .send({ status: 'shipped' })
      .expect(200);
    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith('o1', { status: 'shipped' }, { new: true, runValidators: true });
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  // ------------------- Reviews Management -------------------
  test('GET /api/admin/reviews lists all reviews', async () => {
    const reviews = [{ _id: 'r1' }, { _id: 'r2' }];
    Review.find.mockResolvedValue(reviews);
    const res = await request(app)
      .get('/api/admin/reviews')
      .set(authHeader(adminToken))
      .expect(200);
    expect(Review.find).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(reviews);
  });

  test('DELETE /api/admin/reviews/:id removes a review', async () => {
    Review.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/admin/reviews/r1')
      .set(authHeader(adminToken))
      .expect(200);
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith('r1');
    expect(res.body.success).toBe(true);
  });

  // ------------------- Authorization Failures -------------------
  test('Access admin routes with non‑admin token returns 403', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set(authHeader(nonAdminToken))
      .expect(403);
    expect(res.body.success).toBe(false);
  });

  test('Access admin routes without token returns 401', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .expect(401);
  });
});
