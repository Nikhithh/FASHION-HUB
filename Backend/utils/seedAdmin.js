// utils/seedAdmin.js
// Safely ensures a single admin account exists WITHOUT wiping any data
// (unlike seeder.js, which clears entire collections).
//
// Usage: node utils/seedAdmin.js
//
// Credentials resolve in this order:
//   ADMIN_EMAIL / ADMIN_PASSWORD env vars  ->  seeder defaults
// Never prints the password.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@fashionhub.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

const ensureAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database.');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Existing user ${ADMIN_EMAIL} promoted to admin.`);
    } else {
      console.log(`Admin ${ADMIN_EMAIL} already exists. No changes made.`);
    }
    await mongoose.disconnect();
    return;
  }

  // Created through the model so the pre-save hook hashes the password.
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
  });
  console.log(`Admin ${ADMIN_EMAIL} created.`);
  await mongoose.disconnect();
};

if (require.main === module) {
  ensureAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('ensureAdmin failed:', err.message);
      process.exit(1);
    });
}

module.exports = ensureAdmin;
