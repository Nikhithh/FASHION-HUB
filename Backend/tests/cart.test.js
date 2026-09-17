// tests/cart.test.js
// Jest tests for Cart controller with mocked Mongoose models

const asyncHandler = require('express-async-handler');

// Mock Cart and Product models
jest.mock('../models/Cart', () => {
  const mongoose = require('mongoose');
  const schema = new mongoose.Schema({});
  const Model = mongoose.model('Cart', schema);
  Model.findOne = jest.fn();
  Model.create = jest.fn();
  return Model;
});
jest.mock('../models/Product', () => ({
  findById: jest.fn(),
}));

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

// Helper to create mock req/res
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Cart Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getCart returns empty cart when none exists', async () => {
    Cart.findOne.mockResolvedValue(null);
    const req = { user: { _id: 'user1' } };
    const res = mockResponse();
    await getCart(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { items: [], total: 0 } });
  });

  test('addItem creates cart and adds product', async () => {
    const prod = { _id: 'prod1' };
    Product.findById.mockResolvedValue(prod);
    Cart.findOne.mockResolvedValue(null);
    const createdCart = { items: [], save: jest.fn().mockResolvedValue(), _id: 'c1' };
    Cart.create.mockResolvedValue(createdCart);
    const req = { user: { _id: 'user1' }, body: { product: 'prod1', quantity: 2, price: 50 } };
    const res = mockResponse();
    await addItem(req, res);
    expect(Cart.create).toHaveBeenCalled();
    expect(createdCart.items).toEqual([{ product: 'prod1', quantity: 2, price: 50 }]);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateItem updates quantity and price', async () => {
    const cart = {
      items: [{ _id: 'item1', product: 'p', quantity: 1, price: 10 }],
      save: jest.fn().mockResolvedValue(),
    };
    Cart.findOne.mockResolvedValue(cart);
    const req = { user: { _id: 'u' }, params: { itemId: 'item1' }, body: { quantity: 5, price: 12 } };
    const res = mockResponse();
    await updateItem(req, res);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.items[0].price).toBe(12);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('removeItem deletes an item', async () => {
    const pullMock = jest.fn();
    const cart = { items: [{ _id: 'i1' }], pull: pullMock, save: jest.fn().mockResolvedValue() };
    Cart.findOne.mockResolvedValue(cart);
    const req = { user: { _id: 'u' }, params: { itemId: 'i1' } };
    const res = mockResponse();
    await removeItem(req, res);
    expect(pullMock).toHaveBeenCalledWith('i1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('clearCart empties cart', async () => {
    const cart = { items: [{}, {}], save: jest.fn().mockResolvedValue() };
    Cart.findOne.mockResolvedValue(cart);
    const req = { user: { _id: 'u' } };
    const res = mockResponse();
    await clearCart(req, res);
    expect(cart.items).toEqual([]);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
