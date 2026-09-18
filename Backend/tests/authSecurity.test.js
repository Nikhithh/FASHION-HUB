// tests/authSecurity.test.js
// Security-focused tests for the admin login / authentication audit.
//
// Covers:
//  1. Public registration can never grant the admin role (HTTP + service level)
//  2. Admin login succeeds with correct credentials (service level)
//  3. Login fails with an incorrect password / unknown email (service level)
//  4. `protect` rejects missing/invalid tokens with 401 and attaches the user
//     for valid tokens (real middleware + real JWT, mocked User lookup)
//  5. `authorize('admin')` rejects customer/seller with 403, allows admin
//  6. Logout clears the token cookie
//
// No database is required: the User model is mocked.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const authService = require('../services/authService');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logout } = require('../controllers/authController');
const { generateToken } = require('../utils/jwtHelper');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

// Build a fake mongoose user document with working toObject()/matchPassword().
const fakeUserDoc = (overrides = {}) => {
  const data = {
    _id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'customer',
    ...overrides,
  };
  return {
    ...data,
    matchPassword: jest.fn(async (entered) => entered === 'correct-password'),
    toObject() {
      const { matchPassword, ...rest } = this;
      return { ...rest };
    },
  };
};

describe('Registration role security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => fakeUserDoc({ ...data, _id: 'new1' }));
  });

  test('public registration rejects role=admin with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Evil', email: 'evil@example.com', password: 'password123', role: 'admin' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('public registration accepts customer and seller roles', async () => {
    const customerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Cust', email: 'cust@example.com', password: 'password123', role: 'customer' })
      .expect(201);
    expect(customerRes.body.success).toBe(true);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'customer' })
    );

    jest.clearAllMocks();
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => fakeUserDoc({ ...data, _id: 'new2' }));

    const sellerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sell', email: 'sell@example.com', password: 'password123', role: 'seller' })
      .expect(201);
    expect(sellerRes.body.success).toBe(true);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'seller' })
    );
  });

  test('registration without a role defaults to customer', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Plain', email: 'plain@example.com', password: 'password123' })
      .expect(201);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'customer' })
    );
  });

  test('service layer whitelists role even if validation is bypassed', async () => {
    const created = await authService.registerUser({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'customer' })
    );
    expect(created.role).toBe('customer');
    expect(created.password).toBeUndefined();
  });
});

describe('Login credential verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('admin login succeeds with correct credentials and keeps the admin role', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUserDoc({
        _id: 'admin1',
        email: 'admin@fashionhub.com',
        role: 'admin',
      })),
    });
    const user = await authService.loginUser({
      email: 'admin@fashionhub.com',
      password: 'correct-password',
    });
    expect(user.role).toBe('admin');
    expect(user.password).toBeUndefined();
  });

  test('login fails with an incorrect password', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUserDoc({ email: 'admin@fashionhub.com' })),
    });
    await expect(
      authService.loginUser({ email: 'admin@fashionhub.com', password: 'wrong-password' })
    ).rejects.toThrow('Invalid email or password');
  });

  test('login fails for an unknown email', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(
      authService.loginUser({ email: 'ghost@example.com', password: 'correct-password' })
    ).rejects.toThrow('Invalid email or password');
  });
});

describe('Auth middleware (protect + authorize)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const runProtect = async (headers = {}, cookies = {}) => {
    const req = { headers, cookies };
    const res = mockRes();
    const next = jest.fn();
    await protect(req, res, next);
    return { req, res, next, err: next.mock.calls[0] ? next.mock.calls[0][0] : undefined };
  };

  test('unauthenticated request is rejected with 401', async () => {
    const { res, next, err } = await runProtect();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalled();
    expect(err).toBeInstanceOf(Error);
  });

  test('invalid token is rejected with 401', async () => {
    const { res, err } = await runProtect({ authorization: 'Bearer not-a-real-token' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(err).toBeInstanceOf(Error);
  });

  test('valid token attaches the user and passes through', async () => {
    const adminDoc = { _id: 'admin1', role: 'admin', email: 'admin@fashionhub.com' };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(adminDoc) });
    const token = generateToken('admin1');
    const { req, res, next, err } = await runProtect({ authorization: `Bearer ${token}` });
    expect(User.findById).toHaveBeenCalledWith('admin1');
    expect(req.user).toEqual(adminDoc);
    expect(err).toBeUndefined();
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith();
  });

  test('expired/tampered token signed with another secret is rejected', async () => {
    const forged = jwt.sign({ id: 'admin1' }, 'some-other-secret');
    const { res, err } = await runProtect({ authorization: `Bearer ${forged}` });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(err).toBeInstanceOf(Error);
  });

  const runAuthorize = (role) => {
    const req = role ? { user: { role } } : {};
    const res = mockRes();
    const next = jest.fn();
    authorize('admin')(req, res, next);
    return { res, next };
  };

  test('customer cannot pass authorize(admin) — 403', () => {
    const { res, next } = runAuthorize('customer');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('seller cannot pass authorize(admin) — 403', () => {
    const { res, next } = runAuthorize('seller');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('guest without a user cannot pass authorize(admin) — 403', () => {
    const { res, next } = runAuthorize(undefined);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('admin passes authorize(admin)', () => {
    const { res, next } = runAuthorize('admin');
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });
});

describe('Logout', () => {
  test('logout clears the token cookie so admin APIs fail afterwards', async () => {
    const res = mockRes();
    const next = jest.fn();
    await logout({}, res, next);
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'none',
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
