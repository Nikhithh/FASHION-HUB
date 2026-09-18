// tests/passwordReset.test.js
// Forgot/reset password flow: mocked User model, real routes + validation.

const request = require('supertest');
const crypto = require('crypto');

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true, stub: true }),
}));

const User = require('../models/User');
const emailService = require('../services/emailService');
const app = require('../app');

const GENERIC_MSG = 'If an account exists for this email, a password reset link has been sent.';

const makeUserDoc = (over = {}) => ({
  _id: 'u1',
  email: 'user@example.com',
  password: 'OLD_HASHED',
  passwordResetToken: undefined,
  passwordResetExpires: undefined,
  save: jest.fn().mockResolvedValue(true),
  ...over,
});

// select() chain helper for resetPassword's query
const withSelect = (doc) => ({ select: jest.fn().mockResolvedValue(doc) });

describe('Forgot / Reset password', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('valid forgot-password request stores hashed token with expiry', async () => {
    const doc = makeUserDoc();
    User.findOne.mockResolvedValue(doc);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(GENERIC_MSG);
    expect(doc.save).toHaveBeenCalled();
    // Only a hash is stored — never the raw token
    expect(doc.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(doc.passwordResetToken).not.toBe(res.body.resetToken);
    expect(doc.passwordResetToken).toBe(crypto.createHash('sha256').update(res.body.resetToken).digest('hex'));
    // Expiry roughly 15 minutes in the future
    const ttl = new Date(doc.passwordResetExpires).getTime() - Date.now();
    expect(ttl).toBeGreaterThan(10 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  test('unknown email returns the identical generic response (no enumeration)', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(GENERIC_MSG);
    expect(res.body.resetToken).toBeUndefined();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('reset with invalid token is rejected', async () => {
    User.findOne.mockReturnValue(withSelect(null));

    const res = await request(app)
      .post('/api/auth/reset-password/' + 'a'.repeat(64))
      .send({ password: 'newpass123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message || JSON.stringify(res.body)).toMatch(/invalid|expired/i);
  });

  test('reset with expired token is rejected', async () => {
    // Expired tokens never match the { $gt: now } query -> null, same as invalid
    User.findOne.mockReturnValue(withSelect(null));

    const res = await request(app)
      .post('/api/auth/reset-password/' + 'b'.repeat(64))
      .send({ password: 'newpass123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message || JSON.stringify(res.body)).toMatch(/expired|invalid/i);
  });

  test('successful reset sets new password and invalidates the token', async () => {
    const doc = makeUserDoc({
      passwordResetToken: 'storedhash',
      passwordResetExpires: new Date(Date.now() + 60000),
    });
    User.findOne.mockReturnValue(withSelect(doc));

    const res = await request(app)
      .post('/api/auth/reset-password/' + 'c'.repeat(64))
      .send({ password: 'brandnew1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(doc.password).toBe('brandnew1'); // hashed later by pre-save hook
    expect(doc.passwordResetToken).toBeUndefined();
    expect(doc.passwordResetExpires).toBeUndefined();
    expect(doc.save).toHaveBeenCalled();
  });

  test('reused token is rejected after a successful reset', async () => {
    const doc = makeUserDoc({
      passwordResetToken: 'storedhash',
      passwordResetExpires: new Date(Date.now() + 60000),
    });
    // First use succeeds, second finds nothing (token was cleared)
    User.findOne
      .mockReturnValueOnce(withSelect(doc))
      .mockReturnValue(withSelect(null));

    const token = 'd'.repeat(64);
    const first = await request(app).post(`/api/auth/reset-password/${token}`).send({ password: 'once1234' });
    expect(first.statusCode).toBe(200);

    const second = await request(app).post(`/api/auth/reset-password/${token}`).send({ password: 'twice1234' });
    expect(second.statusCode).toBe(400);
  });

  test('weak password is rejected by validation before lookup', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/' + 'e'.repeat(64))
      .send({ password: '123' });

    expect(res.statusCode).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });
});
