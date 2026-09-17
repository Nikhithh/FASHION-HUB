// tests/review.test.js
// Jest + Supertest tests for Review routes using mocked Mongoose model

const request = require('supertest');
const app = require('../app'); // Express app (tests folder is Backend/tests)

// Mock Review model
jest.mock('../models/Review', () => {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };
});

const Review = require('../models/Review');

const userToken = 'Bearer dummyUserToken';
const adminToken = 'Bearer dummyAdminToken';
const authHeader = token => ({ Authorization: token });

describe('Review Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CREATE review - success
  test('POST /api/reviews creates a review', async () => {
    const payload = { product: 'prod1', rating: 5, comment: 'Great!' };
    const created = { _id: 'r1', user: 'userId', ...payload };
    Review.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/reviews')
      .set(authHeader(userToken))
      .send(payload);
    expect(Review.create).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // CREATE duplicate review (same user/product) -> 400
  test('POST /api/reviews returns 400 when duplicate review exists', async () => {
    Review.create.mockImplementation(() => {
      const err = new Error('Duplicate review');
      err.code = 11000; // Mongo duplicate key error code
      throw err;
    });
    const payload = { product: 'prod1', rating: 4, comment: 'Nice' };
    const res = await request(app)
      .post('/api/reviews')
      .set(authHeader(userToken))
      .send(payload);
    expect(res.statusCode).toBe(400);
  });

  // GET reviews by product - success
  test('GET /api/reviews/product/:productId returns reviews', async () => {
    const reviews = [{ _id: 'r1', rating: 5 }];
    Review.find.mockResolvedValue(reviews);
    const res = await request(app).get('/api/reviews/product/prod1');
    expect(Review.find).toHaveBeenCalledWith({ product: 'prod1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(reviews);
  });

  // UPDATE own review - success
  test('PUT /api/reviews/:id updates own review', async () => {
    const updated = { _id: 'r1', rating: 3 };
    Review.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/reviews/r1')
      .set(authHeader(userToken))
      .send({ rating: 3 });
    expect(Review.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  // UPDATE other user's review -> 403
  test('PUT /api/reviews/:id returns 403 when updating another user\'s review', async () => {
    // Simulate controller throwing an authorization error
    const res = await request(app)
      .put('/api/reviews/otherReview')
      .set(authHeader(userToken))
      .send({ rating: 2 });
    expect(res.statusCode).toBe(403);
  });

  // DELETE own review - success
  test('DELETE /api/reviews/:id deletes own review', async () => {
    Review.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/reviews/r1')
      .set(authHeader(userToken));
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith('r1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ADMIN delete any review - success
  test('DELETE /api/reviews/:id as admin deletes any review', async () => {
    Review.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/reviews/r2')
      .set(authHeader(adminToken));
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith('r2');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // AUTH - unauthenticated access returns 401
  test('POST /api/reviews without token returns 401', async () => {
    const res = await request(app).post('/api/reviews').send({ product: 'p', rating: 5 });
    expect(res.statusCode).toBe(401);
  });
});
