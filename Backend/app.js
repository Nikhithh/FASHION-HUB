const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enable CORS
app.use(cors({
  origin: true, // Allow all origins for local testing, can narrow down later
  credentials: true,
}));

// Parse body requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Base Route for status check
// Public product images only. Brand verification documents live under
// uploads/brand-documents and are NEVER served statically — they are
// streamed through authorized endpoints (owner seller or admin).
app.use('/uploads/products', express.static('uploads/products')); // Serve product images static

// Mount Api Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const brandRoutes = require('./routes/brandRoutes');
app.use('/api/brands', brandRoutes);
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);
const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const wishlistRoutes = require('./routes/wishlistRoutes');
app.use('/api/wishlist', wishlistRoutes);
const recommendationRoutes = require('./routes/recommendationRoutes');
app.use('/api/recommendations', recommendationRoutes);
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the FashionHub Multi-Brand Marketplace API!',
  });
});

// Mount Centralized Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
