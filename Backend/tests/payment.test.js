const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');

let token;
let userId;
let orderId;

beforeAll(async () => {
  // Connect to test DB – assuming a test setup handles connection
  // Create a test user
  const user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123', role: 'customer' });
  userId = user._id;
  const jwt = require('jsonwebtoken');
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create a product (brand and category IDs can be dummy ObjectIds)
  const product = await Product.create({
    name: 'Demo Shirt',
    price: 100,
    stock: 10,
    description: 'Demo product',
    brand: mongoose.Types.ObjectId(),
    category: mongoose.Types.ObjectId()
  });

  // Create an order that includes the product
  const order = await Order.create({
    user: userId,
    items: [{ product: product._id, quantity: 2, price: 100, subtotal: 200 }],
    totalAmount: 200,
    shippingAddress: { address: '123 St', city: 'City', postalCode: '12345', country: 'Country' },
    paymentMethod: 'Online Payment',
  });
  orderId = order._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/payments (dummy)', () => {
  it('creates a payment using order.totalAmount and marks order as Paid', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: orderId.toString(), paymentMethod: 'Online Payment' })
      .expect(201);

    expect(res.body.payment).toBeDefined();
    expect(res.body.payment.amount).toBe(200);
    expect(res.body.payment.status).toBe('completed');

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder.paymentStatus).toBe('Paid');
  });
});
