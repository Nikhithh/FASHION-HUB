// tests/auth.test.js
// Jest tests for Auth controller using mocked auth service

const asyncHandler = require('express-async-handler');

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

const authService = require('../services/authService');
const { register, login, getProfile } = require('../controllers/authController');

// Helper to create mock req/res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('register returns token and user on success', async () => {
    const dummyUser = { _id: 'u1', name: 'Test', email: 'test@example.com' };
    authService.registerUser.mockResolvedValue(dummyUser);
    const req = { body: { name: 'Test', email: 'test@example.com', password: 'pass123' } };
    const res = mockResponse();
    await register(req, res);
    expect(authService.registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: expect.any(String), user: dummyUser });
  });

  test('login returns token and user on success', async () => {
    const dummyUser = { _id: 'u2', email: 'login@example.com' };
    authService.loginUser.mockResolvedValue(dummyUser);
    const req = { body: { email: 'login@example.com', password: 'secret' } };
    const res = mockResponse();
    await login(req, res);
    expect(authService.loginUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: expect.any(String), user: dummyUser });
  });

  test('getProfile returns current user when authenticated', async () => {
    const req = { user: { _id: 'u3', name: 'Current' } };
    const res = mockResponse();
    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, user: req.user });
  });

  test('register throws error when service fails', async () => {
    authService.registerUser.mockRejectedValue(new Error('Reg error'));
    const req = { body: {} };
    const res = mockResponse();
    await expect(register(req, res)).rejects.toThrow('Reg error');
  });

  test('login throws error when service fails', async () => {
    authService.loginUser.mockRejectedValue(new Error('Login error'));
    const req = { body: {} };
    const res = mockResponse();
    await expect(login(req, res)).rejects.toThrow('Login error');
  });
});
