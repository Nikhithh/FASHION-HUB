// utils/seedCatalog.js
// Non-destructive catalog seed for the recommendation engine (and Shop).
// Inserts categories (with CategoryType) and products ONLY when those
// collections are empty. Never touches users, carts or orders.
//
// Usage: node utils/seedCatalog.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const categories = [
  { name: 'Shirts', description: 'Casual and formal shirts', categoryType: 'Top Wear' },
  { name: 'Kurtas', description: 'Traditional ethnic wear', categoryType: 'Top Wear' },
  { name: 'T-Shirts', description: 'Everyday tees and sweatshirts', categoryType: 'Top Wear' },
  { name: 'Jeans', description: 'Denim jeans', categoryType: 'Bottom Wear' },
  { name: 'Trousers', description: 'Formal and casual trousers', categoryType: 'Bottom Wear' },
  { name: 'Sneakers', description: 'Sports and casual sneakers', categoryType: 'Footwear' },
  { name: 'Loafers', description: 'Traditional and formal loafers', categoryType: 'Footwear' },
  { name: 'Jackets', description: 'Jackets and outerwear', categoryType: 'Outerwear' },
  { name: 'Watches', description: 'Wrist watches', categoryType: 'Accessories' },
  { name: 'Handbags', description: 'Handbags and clutches', categoryType: 'Accessories' },
];

const products = [
  {
    name: 'Classic White Casual Shirt',
    description: 'Breathable lightweight casual cotton shirt perfect for summer outings and daily wear.',
    price: 49.99, category: 'Shirts', brand: 'Zara', size: 'M', color: 'White', stock: 50,
    rating: 4.5, numReviews: 120,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
  },
  {
    name: 'Black Traditional Kurta',
    description: 'Elegant ethnic kurta with fine embroidery, ideal for weddings, festive ceremonies and traditional celebrations.',
    price: 59.99, category: 'Kurtas', brand: 'Zara', size: 'L', color: 'Black', stock: 30,
    rating: 4.8, numReviews: 85,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
  },
  {
    name: 'Slim Fit Blue Denim Jeans',
    description: 'Classic street-style denim jeans with relaxed comfort for casual everyday wear.',
    price: 69.99, category: 'Jeans', brand: 'Zara', size: '32', color: 'Blue', stock: 40,
    rating: 4.4, numReviews: 200,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'],
  },
  {
    name: 'Black Formal Trousers',
    description: 'Sharp formal trousers for office, business meetings and elegant evening wear.',
    price: 54.99, category: 'Trousers', brand: 'Zara', size: '32', color: 'Black', stock: 25,
    rating: 4.3, numReviews: 60,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
  },
  {
    name: 'Air Max Runner Sneakers',
    description: 'High-performance running sneakers designed for sports, athletic training and gym workouts.',
    price: 129.99, category: 'Sneakers', brand: 'Nike', size: '10', color: 'Black', stock: 35,
    rating: 4.9, numReviews: 340,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  },
  {
    name: 'Traditional Brown Leather Loafers',
    description: 'Premium leather loafers for weddings and festive ceremonies, elegant traditional footwear.',
    price: 89.99, category: 'Loafers', brand: 'Zara', size: '9', color: 'Brown', stock: 15,
    rating: 4.6, numReviews: 45,
    images: ['https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600'],
  },
  {
    name: 'Standard Fit Grey Fleece Hoodie',
    description: 'Cozy fleece hoodie for sporty street looks, gym training and casual winter days.',
    price: 65.0, category: 'T-Shirts', brand: 'Adidas', size: 'L', color: 'Grey', stock: 40,
    rating: 4.5, numReviews: 150,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'],
  },
  {
    name: 'Premium Black Leather Watch',
    description: 'Elegant premium watch, a timeless formal accessory for office, evening parties and special occasions.',
    price: 89.5, category: 'Watches', brand: 'Zara', size: 'One Size', color: 'Black', stock: 20,
    rating: 4.7, numReviews: 90,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'],
  },
  {
    name: 'Stylish Tan Party Handbag',
    description: 'Chic stylish handbag for parties and evening outings, a premium night-out accessory.',
    price: 79.99, category: 'Handbags', brand: 'Zara', size: 'One Size', color: 'Tan', stock: 18,
    rating: 4.4, numReviews: 55,
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],
  },
  {
    name: 'Blue Denim Trucker Jacket',
    description: 'Rugged urban denim jacket for street style casual layering on cool days.',
    price: 99.99, category: 'Jackets', brand: 'Zara', size: 'M', color: 'Blue', stock: 22,
    rating: 4.5, numReviews: 70,
    images: ['https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600'],
  },
  {
    name: 'Red Evening Party Dress',
    description: 'Stunning red dress for parties and evening celebrations, stylish premium party wear.',
    price: 79.99, category: 'Kurtas', brand: 'Nike', size: 'M', color: 'Red', stock: 0,
    rating: 4.2, numReviews: 30,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
  },
];

const seedCatalog = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database.');

  if ((await Category.countDocuments()) === 0) {
    await Category.create(categories);
    console.log(`Seeded ${categories.length} categories.`);
  } else {
    console.log('Categories already exist. Skipping.');
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.create(products);
    console.log(`Seeded ${products.length} products.`);
  } else {
    console.log('Products already exist. Skipping.');
  }

  await mongoose.disconnect();
};

if (require.main === module) {
  seedCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('seedCatalog failed:', err.message);
      process.exit(1);
    });
}

module.exports = seedCatalog;
