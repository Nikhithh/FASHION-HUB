const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a category name'] },
  description: { type: String },
  categoryType: { type: String, required: [true, 'Please add a category type'], enum: ['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'] },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
