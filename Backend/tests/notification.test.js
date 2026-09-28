// tests/notification.test.js
// Jest + Supertest tests for the Notification system (REST only, no sockets).

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../middleware/authMiddleware', () => {
  const actual = jest.requireActual('../middleware/authMiddleware');
  const usersByToken = {
    'customer-token': { _id: 'cust1', id: 'cust1', name: 'Customer', email: 'c@shop.com', role: 'customer' },
    'customerB-token': { _id: 'cust2', id: 'cust2', name: 'Customer B', email: 'c2@shop.com', role: 'customer' },
    'seller-token': { _id: 'seller1', id: 'seller1', name: 'Seller', email: 's@brand.com', role: 'seller' },
    'admin-token': { _id: 'admin1', id: 'admin1', name: 'Admin', email: 'admin@fashionhub.com', role: 'admin' },
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

// In-memory Notification store
jest.mock('../models/Notification', () => {
  const store = new Map();
  let seq = 0;
  const wrapDoc = (data) => {
    const doc = { ...data };
    doc.save = jest.fn(async function () {
      store.set(String(doc._id), doc);
      return doc;
    });
    doc.deleteOne = jest.fn(async function () {
      store.delete(String(doc._id));
    });
    return doc;
  };
  const matches = (doc, filter) => {
    if (!filter) return true;
    if (filter.user && String(doc.user) !== String(filter.user)) return false;
    if (filter.isRead !== undefined && doc.isRead !== filter.isRead) return false;
    if (filter._id && String(doc._id) !== String(filter._id)) return false;
    return true;
  };
  return {
    __store: store,
    __reset: () => { store.clear(); seq = 0; },
    find: jest.fn((filter = {}) => {
      const list = [...store.values()].filter((d) => matches(d, filter));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { sort: jest.fn(() => Promise.resolve(list)) };
    }),
    findOne: jest.fn(async (filter = {}) => store.get(String(filter._id)) && matches(store.get(String(filter._id)), filter)
      ? store.get(String(filter._id))
      : [...store.values()].find((d) => matches(d, filter)) || null),
    countDocuments: jest.fn(async (filter = {}) => [...store.values()].filter((d) => matches(d, filter)).length),
    create: jest.fn(async (data) => {
      seq += 1;
      const doc = wrapDoc({
        _id: `507f1f77bcf86cd7994391${String(seq).padStart(2, '0')}`,
        isRead: false,
        createdAt: new Date(),
        ...data,
      });
      store.set(String(doc._id), doc);
      return doc;
    }),
    updateMany: jest.fn(async (filter = {}, update = {}) => {
      let modified = 0;
      for (const doc of store.values()) {
        if (matches(doc, filter)) {
          if (update.$set) Object.assign(doc, update.$set);
          modified += 1;
        }
      }
      return { modifiedCount: modified };
    }),
  };
});

jest.mock('../models/User', () => ({
  find: jest.fn(() => ({
    select: jest.fn(async () => [{ _id: 'admin1' }]),
  })),
  findById: jest.fn(),
}));

jest.mock('../models/Product', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Cart', () => ({
  findOneAndDelete: jest.fn(async () => null),
}));

jest.mock('../models/Order', () => {
  function MockOrder(data) {
    Object.assign(this, data);
    this._id = 'order123';
    this.save = jest.fn(async function () { return this; });
  }
  MockOrder.find = jest.fn();
  MockOrder.findById = jest.fn();
  return MockOrder;
});

jest.mock('../models/Brand', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Brand = require('../models/Brand');

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Notification routes (ownership & auth)', () => {
  beforeEach(async () => {
    Notification.__reset();
    jest.clearAllMocks();
    // Seed: 2 for cust1 (1 unread), 1 read for cust2
    await Notification.create({ user: 'cust1', type: 'ORDER_PLACED', title: 'Order Placed', message: 'Your order #ABC has been placed successfully.', isRead: false });
    await Notification.create({ user: 'cust1', type: 'ORDER_SHIPPED', title: 'Order Shipped', message: 'Your order #ABC has been shipped.', isRead: true });
    await Notification.create({ user: 'cust2', type: 'ORDER_PLACED', title: 'Order Placed', message: 'Other user notification.', isRead: false });
  });

  test('1. Authenticated user gets only own notifications (newest first)', async () => {
    const res = await request(app).get('/api/notifications').set(auth('customer-token')).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data.every((n) => String(n.user) === 'cust1')).toBe(true);
  });

  test('2. Unauthenticated user cannot get notifications', async () => {
    await request(app).get('/api/notifications').expect(401);
    await request(app).get('/api/notifications/unread-count').expect(401);
  });

  test('3. User cannot access another user notification', async () => {
    const other = [...Notification.__store.values()].find((n) => String(n.user) === 'cust2');
    await request(app).patch(`/api/notifications/${other._id}/read`).set(auth('customer-token')).expect(404);
    await request(app).delete(`/api/notifications/${other._id}`).set(auth('customer-token')).expect(404);
  });

  test('4. User can mark own notification as read', async () => {
    const own = [...Notification.__store.values()].find((n) => String(n.user) === 'cust1' && !n.isRead);
    const res = await request(app).patch(`/api/notifications/${own._id}/read`).set(auth('customer-token')).expect(200);
    expect(res.body.data.isRead).toBe(true);
  });

  test('5. User cannot mark another user notification as read', async () => {
    const other = [...Notification.__store.values()].find((n) => String(n.user) === 'cust2');
    const res = await request(app).patch(`/api/notifications/${other._id}/read`).set(auth('customer-token')).expect(404);
    expect(res.body.success).toBe(false);
    expect(other.isRead).toBe(false);
  });

  test('6. Unread count is correct', async () => {
    const res = await request(app).get('/api/notifications/unread-count').set(auth('customer-token')).expect(200);
    expect(res.body.count).toBe(1);
  });

  test('7. Mark-all-read works', async () => {
    await request(app).patch('/api/notifications/read-all').set(auth('customer-token')).expect(200);
    const after = await request(app).get('/api/notifications/unread-count').set(auth('customer-token')).expect(200);
    expect(after.body.count).toBe(0);
    // Other user's notification untouched
    const other = [...Notification.__store.values()].find((n) => String(n.user) === 'cust2');
    expect(other.isRead).toBe(false);
  });

  test('Invalid notification ID returns 400', async () => {
    await request(app).patch('/api/notifications/not-an-id/read').set(auth('customer-token')).expect(400);
  });
});

describe('Notification events', () => {
  beforeEach(() => {
    Notification.__reset();
    jest.clearAllMocks();
  });

  test('8. Order creation generates customer + seller + admin notifications', async () => {
    Product.findById.mockResolvedValue({ _id: 'prod1', name: 'Tee', price: 100, stock: 5 });
    Product.find.mockResolvedValue([{ _id: 'prod1', seller: 'seller1' }]);
    const { createOrder } = require('../controllers/orderController');
    const req = {
      user: { _id: 'cust1' },
      body: {
        items: [{ product: 'prod1', quantity: 1 }],
        shippingAddress: { address: '1 St', city: 'City', postalCode: '12345', country: 'Country' },
        paymentMethod: 'Cash on Delivery',
      },
    };
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const types = Notification.create.mock.calls.map((c) => c[0].type);
    expect(types).toContain('ORDER_PLACED');
    expect(types).toContain('NEW_ORDER');
    const customerNote = Notification.create.mock.calls.find((c) => String(c[0].user) === 'cust1');
    expect(customerNote[0].title).toBe('Order Placed');
    const sellerNote = Notification.create.mock.calls.find((c) => String(c[0].user) === 'seller1');
    expect(sellerNote[0].title).toBe('New Order Received');
    expect(User.find).toHaveBeenCalled();
  });

  test('9. Order status update generates customer notification', async () => {
    const orderDoc = {
      _id: 'order123',
      user: 'cust1',
      items: [{ product: { _id: 'prod1', seller: 'seller1' } }],
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: 'Cash on Delivery',
      save: jest.fn(async function () { return this; }),
    };
    Order.findById.mockReturnValue({ populate: jest.fn(async () => orderDoc) });
    const { updateOrderStatus } = require('../controllers/orderController');
    const req = {
      user: { _id: 'admin1', role: 'admin' },
      params: { id: 'order123' },
      body: { orderStatus: 'Shipped' },
    };
    const res = mockRes();
    await updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const shipped = Notification.create.mock.calls.find((c) => c[0].type === 'ORDER_SHIPPED');
    expect(shipped).toBeDefined();
    expect(String(shipped[0].user)).toBe('cust1');
  });

  test('10. Brand approval/rejection generates seller notification', async () => {
    const { approveBrand, rejectBrand } = require('../controllers/adminController');
    const approvedDoc = {
      _id: 'brand1', name: 'Urban', seller: 'seller1', verificationStatus: 'Pending',
      save: jest.fn(async function () { return this; }),
    };
    Brand.findById.mockResolvedValue(approvedDoc);
    await approveBrand({ params: { id: 'brand1' }, body: {} }, mockRes());
    const approved = Notification.create.mock.calls.find((c) => c[0].type === 'BRAND_APPROVED');
    expect(approved).toBeDefined();
    expect(String(approved[0].user)).toBe('seller1');

    Notification.create.mockClear();
    const rejectedDoc = {
      _id: 'brand1', name: 'Urban', seller: 'seller1', verificationStatus: 'Pending',
      save: jest.fn(async function () { return this; }),
    };
    Brand.findById.mockResolvedValue(rejectedDoc);
    await rejectBrand({ params: { id: 'brand1' }, body: { rejectionReason: 'Doc unclear' } }, mockRes());
    const rejected = Notification.create.mock.calls.find((c) => c[0].type === 'BRAND_REJECTED');
    expect(rejected).toBeDefined();
    expect(rejected[0].message).toMatch(/Doc unclear/);
  });
});
