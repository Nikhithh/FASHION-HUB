// tests/auth.test.js
// Jest tests for Auth controller using mocked auth service

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

const authService = require('../services/authService');
const { register, login, logout, getProfile } = require('../controllers/authController');

// Helper to create mock req/res.
// NOTE: the controller sets an httpOnly cookie (sendTokenResponse) and
// forwards errors via next(), so both must be stubbed.
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('register returns token and user on success', async () => {
    const dummyUser = { _id: 'u1', name: 'Test', email: 'test@example.com', role: 'customer' };
    authService.registerUser.mockResolvedValue(dummyUser);
    const req = { body: { name: 'Test', email: 'test@example.com', password: 'pass123' } };
    const res = mockResponse();
    const next = mockNext();
    await register(req, res, next);
    expect(authService.registerUser).toHaveBeenCalledWith(req.body);
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: expect.any(String), user: dummyUser });
    expect(next).not.toHaveBeenCalled();
  });

  test('login returns token and user on success', async () => {
    const dummyUser = { _id: 'u2', email: 'login@example.com', role: 'customer' };
    authService.loginUser.mockResolvedValue(dummyUser);
    const req = { body: { email: 'login@example.com', password: 'secret' } };
    const res = mockResponse();
    const next = mockNext();
    await login(req, res, next);
    expect(authService.loginUser).toHaveBeenCalledWith(req.body);
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: expect.any(String), user: dummyUser });
    expect(next).not.toHaveBeenCalled();
  });

  test('admin login returns token and admin user on success', async () => {
    const adminUser = { _id: 'a1', name: 'Admin', email: 'admin@fashionhub.com', role: 'admin' };
    authService.loginUser.mockResolvedValue(adminUser);
    const req = { body: { email: 'admin@fashionhub.com', password: 'password123' } };
    const res = mockResponse();
    const next = mockNext();
    await login(req, res, next);
    expect(authService.loginUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: expect.any(String), user: adminUser });
    expect(res.json.mock.calls[0][0].user.role).toBe('admin');
  });

  test('getProfile returns current user when authenticated', async () => {
    const req = { user: { _id: 'u3', name: 'Current' } };
    const res = mockResponse();
    const next = mockNext();
    await getProfile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, user: req.user });
  });

  test('logout clears the token cookie and returns success', async () => {
    const req = {};
    const res = mockResponse();
    const next = mockNext();
    await logout(req, res, next);
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'none',
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User logged out successfully',
    });
  });

  test('register forwards service errors to the error handler', async () => {
    authService.registerUser.mockRejectedValue(new Error('Reg error'));
    const req = { body: {} };
    const res = mockResponse();
    const next = mockNext();
    await register(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reg error' }));
  });

  test('login forwards invalid-credential errors to the error handler', async () => {
    authService.loginUser.mockRejectedValue(new Error('Invalid email or password'));
    const req = { body: { email: 'nope@example.com', password: 'wrong' } };
    const res = mockResponse();
    const next = mockNext();
    await login(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' })
    );
  });
});
