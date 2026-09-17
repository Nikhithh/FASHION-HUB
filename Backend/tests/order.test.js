// tests/order.test.js
// Jest + Supertest tests for Order routes using mocked Mongoose model

const request = require('supertest');
const app = require('d:/Fashion-Hub/Backend/app'); // Express app

// Mock Order model
jest.mock('../models/Order', () => {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const Order = require('../models/Order');

const userToken = 'Bearer dummyUserToken';
const adminToken = 'Bearer dummyAdminToken';

const authHeader = token => ({ Authorization: token });

describe('Order Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CREATE order - success
  test('POST /api/orders creates a new order', async () => {
    const payload = { items: [{ product: 'p1', quantity: 2 }], totalAmount: 100 };
    const created = { _id: 'o1', ...payload, status: 'pending' };
    Order.create.mockResolvedValue(created);
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(userToken))
      .send(payload);
    expect(Order.create).toHaveBeenCalledWith(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(created);
  });

  // CREATE validation failure
  test('POST /api/orders returns 400 on validation error', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(userToken))
      .send({}); // missing required fields
    expect(res.statusCode).toBe(400);
  });

  // READ all orders (admin only)
  test('GET /api/orders returns list for admin', async () => {
    const list = [{ _id: 'o1' }, { _id: 'o2' }];
    Order.find.mockResolvedValue(list);
    const res = await request(app)
      .get('/api/orders')
      .set(authHeader(adminToken));
    expect(Order.find).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(list);
  });

  // READ all orders unauthorized (non‑admin)
  test('GET /api/orders returns 403 for non‑admin', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set(authHeader(userToken));
    expect(res.statusCode).toBe(403);
  });

  // READ single order - success (owner or admin)
  test('GET /api/orders/:id returns order for owner', async () => {
    const order = { _id: 'o1', user: 'userId' };
    Order.findById.mockResolvedValue(order);
    const res = await request(app)
      .get('/api/orders/o1')
      .set(authHeader(userToken));
    expect(Order.findById).toHaveBeenCalledWith('o1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(order);
  });

  // READ single order not found
  test('GET /api/orders/:id returns 404 when not found', async () => {
    Order.findById.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/orders/unknown')
      .set(authHeader(adminToken));
    expect(res.statusCode).toBe(404);
  });

  // UPDATE status - admin only
  test('PUT /api/orders/:id updates status for admin', async () => {
    const updated = { _id: 'o1', status: 'shipped' };
    Order.findByIdAndUpdate.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/orders/o1')
      .set(authHeader(adminToken))
      .send({ status: 'shipped' });
    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith('o1', { status: 'shipped' }, { new: true, runValidators: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(updated);
  });

  // UPDATE status unauthorized (non‑admin)
  test('PUT /api/orders/:id returns 403 for non‑admin', async () => {
    const res = await request(app)
      .put('/api/orders/o1')
      .set(authHeader(userToken))
      .send({ status: 'shipped' });
    expect(res.statusCode).toBe(403);
  });

  // DELETE order - owner can delete pending order
  test('DELETE /api/orders/:id allows owner to delete pending order', async () => {
    // simulate findById returning a pending order belonging to the user
    Order.findById.mockResolvedValue({ _id: 'o1', status: 'pending', user: 'ownerId' });
    Order.findByIdAndDelete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/orders/o1')
      .set(authHeader(userToken));
    expect(Order.findByIdAndDelete).toHaveBeenCalledWith('o1');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // DELETE order not found
  test('DELETE /api/orders/:id returns 404 when order does not exist', async () => {
    Order.findById.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/orders/o1')
      .set(authHeader(userToken));
    expect(res.statusCode).toBe(404);
  });

  // AUTH - unauthenticated request
  test('POST /api/orders without token returns 401', async () => {
    const res = await request(app).post('/api/orders').send({ items: [], totalAmount: 0 });
    expect(res.statusCode).toBe(401);
  });
});
