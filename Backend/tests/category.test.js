// tests/category.test.js
// Jest + Supertest tests for Category routes using mocked Mongoose model

const request = require('supertest');
const app = require('d:/Fashion-Hub/Backend/app'); // Express app

// Mock Category model
jest.mock('../models/Category', () => {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const Category = require('../models/Category');

const adminToken = 'Bearer dummyAdminToken';
const authHeader = token => ({ Authorization: token });

describe('Category Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CREATE success
  test('POST /api/categories creates a category', async () => {
    const payload = { name: 'New Category', description: 'Desc' };
    const created = { _id: 'c1', ...payload };
    Category.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader(adminToken))
      .send(payload);
    expect(Category.create).toHaveBeenCalledWith(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // CREATE validation failure
  test('POST /api/categories returns 400 on validation error', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader(adminToken))
      .send({});
    expect(res.statusCode).toBe(400);
  });

  // READ all
  test('GET /api/categories returns list', async () => {
    const list = [{ _id: 'c1', name: 'A' }, { _id: 'c2', name: 'B' }];
    Category.find.mockResolvedValue(list);
    const res = await request(app).get('/api/categories');
    expect(Category.find).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(list);
  });

  // READ one success
  test('GET /api/categories/:id returns a category', async () => {
    const cat = { _id: 'c1', name: 'A' };
    Category.findById.mockResolvedValue(cat);
    const res = await request(app).get('/api/categories/c1');
    expect(Category.findById).toHaveBeenCalledWith('c1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(cat);
  });

  // READ one not found
  test('GET /api/categories/:id returns 404 when not found', async () => {
    Category.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/categories/unknown');
    expect(res.statusCode).toBe(404);
  });

  // UPDATE success
  test('PUT /api/categories/:id updates a category', async () => {
    const updated = { _id: 'c1', name: 'Updated' };
    Category.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/categories/c1')
      .set(authHeader(adminToken))
      .send({ name: 'Updated' });
    expect(Category.findByIdAndUpdate).toHaveBeenCalledWith('c1', { name: 'Updated' }, { new: true, runValidators: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  // UPDATE validation failure
  test('PUT /api/categories/:id returns 400 on bad data', async () => {
    const res = await request(app)
      .put('/api/categories/c1')
      .set(authHeader(adminToken))
      .send({ name: '' });
    expect(res.statusCode).toBe(400);
  });

  // DELETE success
  test('DELETE /api/categories/:id deletes a category', async () => {
    Category.findByIdAndDelete.mockResolvedValue({ _id: 'c1' });
    const res = await request(app)
      .delete('/api/categories/c1')
      .set(authHeader(adminToken));
    expect(Category.findByIdAndDelete).toHaveBeenCalledWith('c1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // AUTH - unauthorized access to protected routes
  test('POST /api/categories without token returns 401', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Test' });
    expect(res.statusCode).toBe(401);
  });

  // AUTHZ - seller gets 403
  test('Seller cannot create category', async () => {
    const sellerToken = 'Bearer dummyUserToken';
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader(sellerToken))
      .send({ name: 'Test' });
    expect(res.statusCode).toBe(403);
  });

  test('Seller cannot update category', async () => {
    const sellerToken = 'Bearer dummyUserToken';
    const res = await request(app)
      .put('/api/categories/c1')
      .set(authHeader(sellerToken))
      .send({ name: 'Test' });
    expect(res.statusCode).toBe(403);
  });

  test('Seller cannot delete category', async () => {
    const sellerToken = 'Bearer dummyUserToken';
    const res = await request(app)
      .delete('/api/categories/c1')
      .set(authHeader(sellerToken));
    expect(res.statusCode).toBe(403);
  });
});
