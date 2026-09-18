require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Mock data
const users = [
  {
    name: 'Admin User',
    email: 'admin@fashionhub.com',
    password: 'password123',
    role: 'admin',
    isVerified: true,
  },
  {
    name: 'Seller Zara',
    email: 'zara@fashionhub.com',
    password: 'password123',
    role: 'seller',
    isVerified: true,
  },
  {
    name: 'Customer Jane',
    email: 'jane@gmail.com',
    password: 'password123',
    role: 'customer',
    isVerified: true,
  },
];

const categories = [
  { name: 'Apparel', description: 'Clothing, shirts, jackets, pants, and dresses', categoryType: 'Top Wear' },
  { name: 'Footwear', description: 'Shoes, sneakers, sandals, and boots', categoryType: 'Footwear' },
  { name: 'Accessories', description: 'Bags, belts, sunglasses, and jewelry', categoryType: 'Accessories' },
];

const brands = [
  { name: 'Zara', description: 'Fast-fashion streetwear and formal wear' },
  { name: 'Nike', description: 'Premium athletic footwear and sportswear' },
  { name: 'Adidas', description: 'Iconic sportswear and active lifestyle fashion' },
];

const products = [
  {
    name: 'Classic Casual Linen Shirt',
    description: 'Breathable and lightweight linen shirt perfect for summer outings and beach days.',
    price: 49.99,
    category: 'Apparel',
    brand: 'Zara',
    size: 'M',
    color: 'White',
    stock: 50,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
  },
  {
    name: 'Air Max Runner Sneakers',
    description: 'High-performance running shoes designed for ultimate comfort and impact absorption.',
    price: 129.99,
    category: 'Footwear',
    brand: 'Nike',
    size: '10',
    color: 'Black/Red',
    stock: 35,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  },
  {
    name: 'Standard Fit Fleece Hoodie',
    description: 'Cozy and warm pullover hoodie with standard athletic sizing and a soft lining.',
    price: 65.00,
    category: 'Apparel',
    brand: 'Adidas',
    size: 'L',
    color: 'Grey',
    stock: 40,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'],
  },
  {
    name: 'Premium Leather Crossbody Bag',
    description: 'Elegant accessories statement piece made of 100% genuine calf leather.',
    price: 89.50,
    category: 'Accessories',
    brand: 'Zara',
    size: 'One Size',
    color: 'Tan',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],
  },
];

const runSeeder = async () => {
  try {
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashionhub');
    console.log('Seeder Connected to Database...');

    // Clear previous records
    await User.deleteMany();
    await Product.deleteMany();
    await Brand.deleteMany();
    await Category.deleteMany();
    await Cart.deleteMany();
    await Order.deleteMany();

    console.log('Cleaned database collection contents.');

    // Seed Users
    await User.create(users);
    console.log('Seed users created.');

    // Seed Brands and Categories
    await Brand.create(brands);
    await Category.create(categories);
    console.log('Seed brands and categories created.');

    // Seed Products
    await Product.create(products);
    console.log('Seed products created.');

    console.log('Database Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeder execution failed:', error.message);
    process.exit(1);
  }
};

runSeeder();
