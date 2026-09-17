const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createPayment } = require('../controllers/paymentController');

const router = express.Router();

// Private route – user must be logged in
router.post('/', protect, createPayment);

module.exports = router;
