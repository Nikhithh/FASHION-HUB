const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a brand name'] },
  description: { type: String },
  verificationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
