const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: [true, 'Please add a rating'], min: 1, max: 5 },
  comment: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to recalculate average rating & numReviews on Product
reviewSchema.statics.calculateAverageRating = async function(productId) {
  if (!productId) return { rating: 0, numReviews: 0 };
  const reviews = await this.find({ product: productId });
  const numReviews = reviews ? reviews.length : 0;
  let rating = 0;
  if (numReviews > 0) {
    const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    rating = Math.round((sum / numReviews) * 10) / 10;
  }
  const Product = mongoose.model('Product');
  await Product.findByIdAndUpdate(productId, {
    rating,
    numReviews,
  });
  return { rating, numReviews };
};

module.exports = mongoose.model('Review', reviewSchema);
