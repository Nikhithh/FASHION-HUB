const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a product name'] },
  description: { type: String, required: [true, 'Please add a description'] },
  price: { type: Number, required: [true, 'Please add a price'], default: 0 },
  category: { type: String, required: [true, 'Please specify a category'] },
  brand: { type: String },
  size: { type: String },
  color: { type: String },
  images: [{ type: String }], // array of image URLs
  stock: { type: Number, required: true, default: 0 },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
