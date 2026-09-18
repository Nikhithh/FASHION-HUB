// tests/brandVerification.test.js
// Integration tests for the manual Brand Verification Document flow:
//
//  Seller uploads verification document -> Brand stays Pending ->
//  Admin views brand + document -> Approve OR Reject ->
//  Approved seller can login, Pending/Rejected seller gets 403.
//
// No database required: the Brand/User models and the `protect` middleware
// are stubbed; the REAL `authorize` middleware and REAL multer upload
// handling (PDF/JPG/PNG <= 5MB, single file) are exercised.

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
    'sellerA-token': { _id: '507f1f77bcf86cd799439002', id: '507f1f77bcf86cd799439002', name: 'Seller A', email: 'a@seller.com', role: 'seller' },
    'sellerB-token': { _id: '507f1f77bcf86cd799439003', id: '507f1f77bcf86cd799439003', name: 'Seller B', email: 'b@seller.com', role: 'seller' },
    'sellerC-token': { _id: '507f1f77bcf86cd799439004', id: '507f1f77bcf86cd799439004', name: 'Seller C', email: 'c@seller.com', role: 'seller' },
    'customer-token': { _id: '507f1f77bcf86cd799439005', id: '507f1f77bcf86cd799439005', name: 'Customer', email: 'c@shop.com', role: 'customer' },
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

// In-memory Brand store with Mongoose-query-like chaining
// (supports .populate(), .select() and direct await).
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
      const all = [...store.values()];
      const list = all.filter((b) => {
        if (filter.verificationStatus && b.verificationStatus !== filter.verificationStatus) return false;
        if (filter.seller && String(b.seller) !== String(filter.seller)) return false;
        return true;
      });
      return chainable(list);
    }),
    findById: jest.fn((id) => chainable(store.get(String(id)) || null)),
    create: jest.fn(async (data) => {
      const doc = wrapDoc({
        _id: `507f1f77bcf86cd7994390${10 + store.size}`,
        verificationStatus: 'Pending',
        ...data,
      });
      store.set(String(doc._id), doc);
      return doc;
    }),
    findByIdAndUpdate: jest.fn(async (id, updates, opts) => {
      const existing = store.get(String(id));
      if (!existing) return null;
      Object.assign(existing, updates);
      return existing;
    }),
  };
});

jest.mock('../models/User', () => {
  const users = {
    'a@seller.com': { _id: '507f1f77bcf86cd799439002', name: 'Seller A', email: 'a@seller.com', role: 'seller' },
    'b@seller.com': { _id: '507f1f77bcf86cd799439003', name: 'Seller B', email: 'b@seller.com', role: 'seller' },
    'c@seller.com': { _id: '507f1f77bcf86cd799439004', name: 'Seller C', email: 'c@seller.com', role: 'seller' },
    'admin@fashionhub.com': { _id: '507f1f77bcf86cd799439001', name: 'Admin', email: 'admin@fashionhub.com', role: 'admin' },
  };
  const fakeDoc = (data) => ({
    ...data,
    matchPassword: async (entered) => entered === 'correct-password',
    toObject() {
      const { matchPassword, ...rest } = this;
      return { ...rest };
    },
  });
  return {
    findOne: jest.fn((query) => ({
      select: jest.fn(async () => (users[query.email] ? fakeDoc(users[query.email]) : null)),
    })),
  };
});

const request = require('supertest');
const app = require('../app');
const Brand = require('../models/Brand');

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const OID = (n) => `507f1f77bcf86cd7994390${n}`;

const pdfBuffer = Buffer.from('%PDF-1.4 fake verification document for tests');
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('Brand verification document flow (manual admin verification)', () => {
  let brandId;

  afterAll(() => {
    // Clean up any files multer wrote during the tests
    const dir = process.env.BRAND_DOC_DIR;
    for (const b of Brand.__store.values()) {
      if (b.verificationDocument) {
        const abs = path.join(dir, path.basename(b.verificationDocument));
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    }
    try { fs.rmSync(suiteDocDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  test('TEST 1: seller creates brand with verification document -> Pending, doc stored, status cannot be self-approved', async () => {
    const res = await request(app)
      .post('/api/brands')
      .set(auth('sellerA-token'))
      .field('name', 'Urban Threads')
      .field('description', 'A modern fashion brand offering contemporary clothing.')
      .field('verificationStatus', 'Approved') // malicious attempt — must be ignored
      .attach('verificationDocument', pdfBuffer, { filename: 'business-registration.pdf', contentType: 'application/pdf' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('Pending');
    expect(res.body.data.verificationDocument).toMatch(/\/uploads\/brand-documents\//);
    expect(res.body.data.verificationDocumentName).toBe('business-registration.pdf');
    expect(res.body.data.verificationDocumentUploadedAt).toBeDefined();
    brandId = res.body.data._id;
  });

  test('Executable uploads are rejected with a clear message', async () => {
    const res = await request(app)
      .post('/api/brands')
      .set(auth('sellerB-token'))
      .field('name', 'Evil Brand')
      .attach('verificationDocument', Buffer.from('MZ fake exe'), { filename: 'payload.exe', contentType: 'application/x-msdownload' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/PDF, JPG, JPEG, or PNG/);
  });

  test('Pending seller cannot login (403, no usable session for selling)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@seller.com', password: 'correct-password' })
      .expect(403);
    expect(res.body.message).toMatch(/verification is pending/);
  });

  test('Customer cannot view the verification document (403)', async () => {
    await request(app)
      .get(`/api/brands/${brandId}/verification-document`)
      .set(auth('customer-token'))
      .expect(403);
  });

  test('Seller B cannot view Seller A document (403)', async () => {
    await request(app)
      .get(`/api/brands/${brandId}/verification-document`)
      .set(auth('sellerB-token'))
      .expect(403);
  });

  test('Admin sees the pending brand with owner + document metadata', async () => {
    const res = await request(app)
      .get('/api/admin/brands/pending')
      .set(auth('admin-token'))
      .expect(200);
    const found = res.body.data.find((b) => String(b._id) === String(brandId));
    expect(found).toBeDefined();
    expect(found.name).toBe('Urban Threads');
    expect(found.verificationDocumentName).toBe('business-registration.pdf');
  });

  test('Admin streams the verification document inline (200, PDF content-type)', async () => {
    const res = await request(app)
      .get(`/api/admin/brands/${brandId}/verification-document`)
      .set(auth('admin-token'))
      .expect(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/inline/);
  });

  test('Seller cannot approve their own brand (403, admin-only)', async () => {
    await request(app)
      .put(`/api/admin/brands/${brandId}/approve`)
      .set(auth('sellerA-token'))
      .expect(403);
  });

  test('TEST 2: admin approves with a note -> Approved + verifiedAt', async () => {
    const res = await request(app)
      .put(`/api/admin/brands/${brandId}/approve`)
      .set(auth('admin-token'))
      .send({ adminVerificationNote: 'Document and brand details look legitimate.' })
      .expect(200);
    expect(res.body.data.verificationStatus).toBe('Approved');
    expect(res.body.data.verifiedAt).toBeDefined();
    expect(res.body.data.adminVerificationNote).toMatch(/legitimate/);
  });

  test('TEST 3: approved seller can now login (200 + token)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@seller.com', password: 'correct-password' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('Approved seller replacing the document re-enters Pending review (no silent bypass)', async () => {
    const res = await request(app)
      .put(`/api/brands/${brandId}`)
      .set(auth('sellerA-token'))
      .field('name', 'Urban Threads')
      .attach('verificationDocument', pngBuffer, { filename: 'updated-doc.png', contentType: 'image/png' })
      .expect(200);
    expect(res.body.data.verificationStatus).toBe('Pending');
    expect(res.body.data.verificationDocumentName).toBe('updated-doc.png');
  });

  test('TEST 4: admin rejection requires a reason; rejected seller blocked with 403', async () => {
    await request(app)
      .put(`/api/admin/brands/${brandId}/reject`)
      .set(auth('admin-token'))
      .send({})
      .expect(400);

    const rejected = await request(app)
      .put(`/api/admin/brands/${brandId}/reject`)
      .set(auth('admin-token'))
      .send({ rejectionReason: 'Uploaded document could not be verified.' })
      .expect(200);
    expect(rejected.body.data.verificationStatus).toBe('Rejected');
    expect(rejected.body.data.rejectionReason).toMatch(/could not be verified/);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@seller.com', password: 'correct-password' })
      .expect(403);
    expect(login.body.message).toMatch(/verification was rejected/);
  });

  test('Verification documents are NOT publicly served as static files', async () => {
    const brand = Brand.__store.get(String(brandId));
    const publicPath = brand.verificationDocument; // e.g. /uploads/brand-documents/xxx.png
    await request(app).get(publicPath).expect(404);
  });
});
