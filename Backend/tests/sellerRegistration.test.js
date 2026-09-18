// tests/sellerRegistration.test.js
// Integration tests for the ONE combined seller + brand application:
//
//  POST /api/auth/register-seller (multipart: account fields + brand
//  fields + verificationDocument) creates User (role=seller) AND Brand
//  (Pending, linked) together, issues NO token, and rolls the user back
//  if brand creation fails.
//
// No database required: User/Brand models are stubbed in-memory; the REAL
// multer upload handling, validation, controllers and login gate run.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Isolate multer uploads for this suite (parallel jest workers share the
// real uploads dir otherwise, causing cross-suite flakes).
const suiteDocDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fh-brand-docs-'));
process.env.BRAND_DOC_DIR = suiteDocDir;

jest.mock('../middleware/authMiddleware', () => {
  const actual = jest.requireActual('../middleware/authMiddleware');
  const usersByToken = {
    'admin-token': { _id: '507f1f77bcf86cd799439001', id: '507f1f77bcf86cd799439001', name: 'Admin', email: 'admin@fashionhub.com', role: 'admin' },
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

jest.mock('../models/User', () => {
  const store = new Map();
  const fakeDoc = (data) => {
    const doc = { ...data };
    doc.matchPassword = async (entered) => entered === 'correct-password';
    doc.toObject = function () {
      const { matchPassword, toObject, ...rest } = this;
      return { ...rest };
    };
    return doc;
  };
  // Chainable like Mongoose: awaitable directly AND via .select()
  const chainable = (value) => ({
    select: jest.fn(() => Promise.resolve(value)),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  });
  return {
    __store: store,
    findOne: jest.fn((query) => {
      const found = [...store.values()].find((u) => u.email === (query && query.email)) || null;
      return chainable(found);
    }),
    create: jest.fn(async (data) => {
      const doc = fakeDoc({ _id: `507f1f77bcf86cd7994390${20 + store.size}`, ...data });
      store.set(String(doc._id), doc);
      store.set(`email:${doc.email}`, doc);
      return doc;
    }),
    findByIdAndDelete: jest.fn(async (id) => {
      const doc = store.get(String(id));
      if (doc) {
        store.delete(String(id));
        store.delete(`email:${doc.email}`);
      }
      return doc || null;
    }),
  };
});

jest.mock('../models/Brand', () => {
  const store = new Map();
  const chainable = (value) => ({
    populate: jest.fn(() => Promise.resolve(value)),
    select: jest.fn(() => Promise.resolve(value)),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  });
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
  return {
    __store: store,
    find: jest.fn((filter = {}) => {
      const list = [...store.values()].filter((b) => {
        if (filter.verificationStatus && b.verificationStatus !== filter.verificationStatus) return false;
        if (filter.seller && String(b.seller) !== String(filter.seller)) return false;
        return true;
      });
      return chainable(list);
    }),
    findById: jest.fn((id) => chainable(store.get(String(id)) || null)),
    create: jest.fn(async (data) => {
      const doc = wrapDoc({
        _id: `507f1f77bcf86cd7994390${40 + store.size}`,
        verificationStatus: 'Pending',
        ...data,
      });
      store.set(String(doc._id), doc);
      return doc;
    }),
  };
});

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Brand = require('../models/Brand');

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const pdfBuffer = Buffer.from('%PDF-1.4 fake seller application document');

const docDir = () => process.env.BRAND_DOC_DIR;
const docFiles = () => new Set(fs.existsSync(docDir()) ? fs.readdirSync(docDir()) : []);
const cleanupDocs = (known) => {
  for (const f of docFiles()) {
    if (!known.has(f)) {
      try { fs.unlinkSync(path.join(docDir(), f)); } catch (e) { /* ignore */ }
    }
  }
};

describe('Combined seller + brand registration', () => {
  let baselineFiles;
  let appliedBrandId;

  beforeAll(() => {
    baselineFiles = docFiles();
  });

  afterAll(() => {
    cleanupDocs(baselineFiles);
    try { fs.rmSync(suiteDocDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  test('TEST 1: customer registration unchanged (token issued)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Cust', email: 'cust@example.com', password: 'password123', role: 'customer' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('TEST 2: seller application creates User (seller) + Brand (Pending) with doc, issues NO token', async () => {
    const res = await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'Seller One')
      .field('email', 'seller1@shop.com')
      .field('password', 'password123')
      .field('brandName', 'Urban Threads')
      .field('brandDescription', 'A modern fashion brand offering contemporary clothing.')
      .field('website', 'https://urbanthreads.example.com')
      .field('location', 'Kochi, Kerala')
      .field('contactPhone', '+91 98765 43210')
      .attach('verificationDocument', pdfBuffer, { filename: 'business-registration.pdf', contentType: 'application/pdf' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/pending admin verification/i);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.role).toBe('seller');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.brand.verificationStatus).toBe('Pending');
    expect(res.body.brand.seller).toBe(res.body.user._id);
    expect(res.body.brand.verificationDocument).toMatch(/\/uploads\/brand-documents\//);
    expect(res.body.brand.verificationDocumentName).toBe('business-registration.pdf');
    appliedBrandId = res.body.brand._id;
  });

  test('TEST 3: pending seller login blocked with 403', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'seller1@shop.com', password: 'correct-password' })
      .expect(403);
    expect(res.body.message).toMatch(/verification is pending/);
  });

  test('TEST 7: pending seller cannot reach protected seller APIs without a session', async () => {
    // No token was ever issued, so authenticated seller endpoints reject.
    await request(app).get('/api/auth/profile').expect(401);
    await request(app).get(`/api/brands/${appliedBrandId}/verification-document`).expect(401);
  });

  test('TEST 4: admin approves -> TEST 5: seller login succeeds', async () => {
    await request(app)
      .put(`/api/admin/brands/${appliedBrandId}/approve`)
      .set(auth('admin-token'))
      .send({ adminVerificationNote: 'Documents look legitimate.' })
      .expect(200);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'seller1@shop.com', password: 'correct-password' })
      .expect(200);
    expect(login.body.token).toBeDefined();
  });

  test('TEST 6: second application rejected -> seller stays blocked', async () => {
    const second = await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'Seller Two')
      .field('email', 'seller2@shop.com')
      .field('password', 'password123')
      .field('brandName', 'Shady Threads')
      .attach('verificationDocument', pdfBuffer, { filename: 'license.pdf', contentType: 'application/pdf' })
      .expect(201);
    await request(app)
      .put(`/api/admin/brands/${second.body.brand._id}/reject`)
      .set(auth('admin-token'))
      .send({ rejectionReason: 'Uploaded document could not be verified.' })
      .expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'seller2@shop.com', password: 'correct-password' })
      .expect(403);
  });

  test('TEST 8: invalid document (.exe) rejected, no user created', async () => {
    const before = User.__store.size;
    const res = await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'Evil')
      .field('email', 'evil@shop.com')
      .field('password', 'password123')
      .field('brandName', 'Evil Brand')
      .attach('verificationDocument', Buffer.from('MZ fake'), { filename: 'payload.exe', contentType: 'application/x-msdownload' })
      .expect(400);
    expect(res.body.message).toMatch(/PDF, JPG, JPEG, or PNG/);
    expect(User.__store.size).toBe(before);
  });

  test('Missing document / missing brand name rejected with 400', async () => {
    await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'No Doc')
      .field('email', 'nodoc@shop.com')
      .field('password', 'password123')
      .field('brandName', 'No Doc Brand')
      .expect(400);

    const res = await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'No Brand')
      .field('email', 'nobrand@shop.com')
      .field('password', 'password123')
      .attach('verificationDocument', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(400);
    expect(res.body.message).toMatch(/Brand name is required/);
  });

  test('Duplicate email rejected, no brand created, no stray file left', async () => {
    const brandsBefore = Brand.__store.size;
    const filesBefore = docFiles();
    await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'Seller One Again')
      .field('email', 'seller1@shop.com')
      .field('password', 'password123')
      .field('brandName', 'Copycat Brand')
      .attach('verificationDocument', pdfBuffer, { filename: 'copy.pdf', contentType: 'application/pdf' })
      .expect(400);
    expect(Brand.__store.size).toBe(brandsBefore);
    expect(docFiles()).toEqual(filesBefore);
  });

  test('Brand creation failure rolls back the orphaned seller account', async () => {
    Brand.create.mockImplementationOnce(async () => {
      throw new Error('Simulated brand failure');
    });
    const usersBefore = User.__store.size;
    await request(app)
      .post('/api/auth/register-seller')
      .field('name', 'Rollback')
      .field('email', 'rollback@shop.com')
      .field('password', 'password123')
      .field('brandName', 'Rollback Brand')
      .attach('verificationDocument', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(500);
    // Orphaned user removed (only email-index + doc entries counted before)
    const leftover = [...User.__store.values()].filter((u) => u.email === 'rollback@shop.com');
    expect(leftover).toHaveLength(0);
    expect(User.__store.size).toBe(usersBefore);
  });
});
