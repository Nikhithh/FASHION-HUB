// tests/user.test.js
// Jest + Supertest tests for User routes (profile management)

const request = require('supertest');
const app = require('d:/Fashion-Hub/Backend/app'); // Express app

// Mock User model
jest.mock('../models/User', () => {
  return {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const User = require('../models/User');

// Dummy auth token (admin and user)
const adminToken = 'Bearer adminToken';
const userToken = 'Bearer userToken';

const authHeader = token => ({ Authorization: token });

describe('User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/users/me - success for authenticated user', async () => {
    const user = { _id: 'u1', name: 'John', email: 'john@example.com' };
    User.findById.mockResolvedValue(user);
    const res = await request(app)
      .get('/api/users/me')
      .set(authHeader(userToken));
    expect(User.findById).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(user);
  });

  test('GET /api/users/me - unauthorized', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
  });

  test('PUT /api/users/me - update own profile success', async () => {
    const updated = { _id: 'u1', name: 'John Updated' };
    User.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(userToken))
      .send({ name: 'John Updated' });
    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  test('PUT /api/users/me - validation failure', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(authHeader(userToken))
      .send({ email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });

  test('DELETE /api/users/me - success', async () => {
    User.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/users/me')
      .set(authHeader(userToken));
    expect(User.findByIdAndDelete).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Admin can get any user - success', async () => {
    const user = { _id: 'u2', name: 'Jane' };
    User.findById.mockResolvedValue(user);
    const res = await request(app)
      .get('/api/users/u2')
      .set(authHeader(adminToken));
    expect(User.findById).toHaveBeenCalledWith('u2');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(user);
  });

  test('Admin get non-existent user returns 404', async () => {
    User.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/users/unknown')
      .set(authHeader(adminToken));
    expect(res.statusCode).toBe(404);
  });

  test('Non-admin trying admin route returns 403', async () => {
    const res = await request(app)
      .get('/api/users/u2')
      .set(authHeader(userToken));
    expect(res.statusCode).toBe(403);
  });
});
