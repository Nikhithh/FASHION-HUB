// tests/brand.test.js
// Jest tests for Brand controller using mocked Mongoose model and Supertest

const request = require('supertest');
const app = require('d:/Fashion-Hub/Backend/app'); // Import Express app

// Mock the Brand model
jest.mock('../models/Brand', () => {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const Brand = require('../models/Brand');

// Helper token (dummy) for auth
const adminToken = 'Bearer dummyAdminToken';

// Helper to set auth header
const authHeader = token => ({ Authorization: token });

describe('Brand Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CREATE - successful
  test('POST /api/brands creates a brand', async () => {
    const payload = { name: 'New Brand', description: 'Awesome' };
    const created = { _id: 'b1', ...payload };
    Brand.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/brands')
      .set(authHeader(adminToken))
      .send(payload);
    expect(Brand.create).toHaveBeenCalledWith(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // CREATE - validation failure (missing name)
  test('POST /api/brands returns 400 on validation error', async () => {
    const payload = { description: 'No name' };
    const res = await request(app)
      .post('/api/brands')
      .set(authHeader(adminToken))
      .send(payload);
    expect(res.statusCode).toBe(400);
  });

  // READ - get all brands
  test('GET /api/brands returns list of brands', async () => {
    const list = [{ _id: 'b1', name: 'A' }, { _id: 'b2', name: 'B' }];
    Brand.find.mockResolvedValue(list);
    const res = await request(app).get('/api/brands');
    expect(Brand.find).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(list);
  });

  // READ ONE - success
  test('GET /api/brands/:id returns a brand', async () => {
    const brand = { _id: 'b1', name: 'A' };
    Brand.findById.mockResolvedValue(brand);
    const res = await request(app).get('/api/brands/b1');
    expect(Brand.findById).toHaveBeenCalledWith('b1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(brand);
  });

  // READ ONE - not found
  test('GET /api/brands/:id returns 404 when not found', async () => {
    Brand.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/brands/unknown');
    expect(res.statusCode).toBe(404);
  });

  // UPDATE - success
  test('PUT /api/brands/:id updates a brand', async () => {
    const updated = { _id: 'b1', name: 'Updated' };
    Brand.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/brands/b1')
      .set(authHeader(adminToken))
      .send({ name: 'Updated' });
    expect(Brand.findByIdAndUpdate).toHaveBeenCalledWith('b1', { name: 'Updated' }, { new: true, runValidators: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  // UPDATE - validation failure
  test('PUT /api/brands/:id returns 400 on invalid data', async () => {
    const res = await request(app)
      .put('/api/brands/b1')
      .set(authHeader(adminToken))
      .send({ name: '' }); // assuming name cannot be empty
    expect(res.statusCode).toBe(400);
  });

  // DELETE - success
  test('DELETE /api/brands/:id deletes a brand', async () => {
    Brand.findByIdAndDelete.mockResolvedValue({ _id: 'b1' });
    const res = await request(app)
      .delete('/api/brands/b1')
      .set(authHeader(adminToken));
    expect(Brand.findByIdAndDelete).toHaveBeenCalledWith('b1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // AUTH - unauthorized access to protected route
  test('POST /api/brands without token returns 401', async () => {
    const res = await request(app).post('/api/brands').send({ name: 'Test' });
    expect(res.statusCode).toBe(401);
  });

  // AUTHZ - admin-only route returns 403 for non-admin (simulated)
  test('POST /api/brands with non-admin token returns 403', async () => {
    const nonAdminToken = 'Bearer dummyUserToken';
    const res = await request(app)
      .post('/api/brands')
      .set(authHeader(nonAdminToken))
      .send({ name: 'Test' });
    expect(res.statusCode).toBe(403);
  });
});
