import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import { parseOptions, colorHex } from '../utils/variants';
import usePageMeta from '../hooks/usePageMeta';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { FiChevronLeft, FiShoppingBag, FiInfo, FiTag, FiStar, FiHeart, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWished, toggleWishlist } = useWishlist();
  const [wishing, setWishing] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  usePageMeta(
    product
      ? {
          title: `${product.name} | FashionHub`,
          description: product.description
            ? `${product.description.slice(0, 155)}${product.description.length > 155 ? '…' : ''}`
            : `Shop ${product.name} on FashionHub.`,
        }
      : {
          title: 'Product Details | FashionHub',
          description: 'View product details, reviews and related items on FashionHub.',
        }
  );  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [adding, setAdding] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Related products ("You May Also Like")
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Simple related-products ranking over existing catalog data only:
  // same category > same brand > similar price (±30%). No ML, no new APIs.
  const fetchRelated = async (prod) => {
    if (!prod) return;
    setRelatedLoading(true);
    try {
      let candidates = [];
      try {
        const res = await api.get('/products/filter', { params: { category: prod.category } });
        if (res.data && res.data.success) candidates = res.data.data || [];
      } catch {
        const res = await api.get('/products');
        if (res.data && res.data.success) candidates = res.data.data || [];
      }
      const scored = candidates
        .filter((p) => p._id !== prod._id && p.stock > 0)
        .map((p) => {
          let score = 0;
          if (p.category && p.category === prod.category) score += 2;
          if (p.brand && prod.brand && p.brand === prod.brand) score += 2;
          if (typeof p.price === 'number' && typeof prod.price === 'number' && prod.price > 0) {
            const diff = Math.abs(p.price - prod.price) / prod.price;
            if (diff <= 0.3) score += 1;
          }
          return { p, score };
        })
        .sort((a, b) => b.score - a.score || new Date(b.p.createdAt) - new Date(a.p.createdAt));
      setRelated(scored.slice(0, 4).map((s) => s.p));
    } catch (err) {
      console.error('Error fetching related products', err);
      setRelated([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get(`/reviews/product/${id}`);
      if (res.data && res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data && res.data.success) {
          const prod = res.data.data;
          setProduct(prod);
          // Preselect when the seller listed a single value; otherwise let the shopper choose
          const sizes = parseOptions(prod.size);
          const colors = parseOptions(prod.color);
          setSelectedSize(sizes.length === 1 ? sizes[0] : '');
          setSelectedColor(colors.length === 1 ? colors[0] : '');
          fetchRelated(prod);
        }
      } catch (err) {
        console.error('Error fetching product details', err);
        toast.error('Product not found');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id, navigate]);
  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }

    // Variant validation: shopper must pick from available options
    if (sizeOptions.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (colorOptions.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    setAdding(true);
    const res = await addToCart(product._id, quantity, product.price, selectedSize || undefined, selectedColor || undefined);
    setAdding(false);

    if (res.success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error(res.error || 'Failed to add item to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info('Please log in to use your wishlist.');
      navigate('/login');
      return;
    }
    setWishing(true);
    const res = await toggleWishlist(product._id);
    setWishing(false);
    if (res.success) {
      toast.success(isWished(product._id) ? `Removed ${product.name} from wishlist` : `Added ${product.name} to wishlist!`);
    } else {
      toast.error(res.error || 'Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to leave a review.');
      return;
    }
    if (!rating || !comment.trim()) {
      toast.error('Rating and comment are required.');
      return;
    }
    
    setSubmitLoading(true);
    try {
      const res = await api.post(`/reviews/${id}`, { rating, comment });
      if (res.data && res.data.success) {
        toast.success('Review submitted successfully!');
        setComment('');
        setRating(5);
        fetchReviews(); // refresh reviews
      }
    } catch (err) {
      console.error('Error submitting review', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 w-24 bg-gray-250 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-250 dark:bg-gray-800 rounded-3xl"></div>
          <div className="space-y-6">
            <div className="h-10 w-2/3 bg-gray-250 dark:bg-gray-800 rounded"></div>
            <div className="h-6 w-1/4 bg-gray-250 dark:bg-gray-800 rounded"></div>
            <div className="h-32 bg-gray-250 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const sizeOptions = parseOptions(product?.size);
  const colorOptions = parseOptions(product?.color);

  return (
    <div className="pb-16 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 font-semibold mb-6 transition-colors mt-8">
        <FiChevronLeft size={16} />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image Gallery */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl bg-gray-50 border border-gray-150 dark:border-gray-850 aspect-[4/5] shadow-sm relative">
            <img
              src={resolveImageUrl(product.images?.[selectedImage] || product.images?.[0])}
              alt={product.name}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishing}
              title={isWished(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md shadow-sm transition-all ${
                isWished(product._id)
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/80 dark:bg-[#16171d]/80 text-gray-600 dark:text-gray-300 hover:text-purple-600'
              }`}
            >
              <FiHeart size={18} fill={isWished(product._id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-purple-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={resolveImageUrl(img)} alt={`${product.name}-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-full border border-purple-100 dark:border-purple-900">
                {product.brand || 'Designer'}
              </span>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <FiTag size={12} />
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar key={star} size={16} fill={star <= averageRating ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {averageRating} <span className="text-gray-400 font-normal">({reviews.length} reviews)</span>
              </span>
            </div>

            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              ${product.price.toFixed(2)}
            </p>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                {product.description}
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            {/* Size selector */}
            {sizeOptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">
                    Size{sizeOptions.length > 1 ? 's' : ''}
                  </span>
                  {selectedSize && (
                    <span className="text-xs text-gray-400">Selected: <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedSize}</span></span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        selectedSize === s
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white dark:bg-[#16171d] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color swatches */}
            {colorOptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider">
                    Color{colorOptions.length > 1 ? 's' : ''}
                  </span>
                  {selectedColor && (
                    <span className="text-xs text-gray-400">Selected: <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">{selectedColor}</span></span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={c}
                      aria-label={`Color ${c}`}
                      aria-pressed={selectedColor === c}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColor === c
                          ? 'border-purple-600 scale-110 shadow-md'
                          : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:scale-105'
                      }`}
                      style={{ backgroundColor: colorHex(c) }}
                    >
                      {selectedColor === c && (
                        <FiCheck size={14} className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex items-center border border-gray-300 dark:border-gray-850 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 font-bold focus:outline-none"
                  >
                    -
                  </button>
                  <span className="px-4 font-bold text-gray-800 dark:text-gray-200 text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 font-bold focus:outline-none"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-grow flex items-center justify-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <FiShoppingBag size={18} />
                  {adding ? 'Adding to Cart...' : 'Add to Bag'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30">
                <FiInfo size={18} />
                <span className="font-semibold text-sm">Sold Out: This product is temporarily unavailable.</span>
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-2">
              {product.stock > 0 ? `In stock: ${product.stock} units ready to ship` : 'Stock replenished weekly'}
            </p>
          </div>
        </div>
      </div>

      {/* You May Also Like */}
      {(relatedLoading || related.length > 0) && (
        <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">You May Also Like</h2>
            <Link to="/shop" className="text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              View All
            </Link>
          </div>
          {relatedLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-72 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <div
                  key={item._id}
                  className="group relative flex flex-col bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                    <Link to={`/product/${item._id}`}>
                      <img
                        src={resolveImageUrl(item.images?.[0])}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  </div>
                  <Link to={`/product/${item._id}`} className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-purple-600 dark:text-purple-400 font-medium text-xs tracking-wider uppercase">
                        {item.brand}
                      </span>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-900 dark:text-white font-extrabold text-base">
                        ${item.price?.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-xs">{item.category}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Submit Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Write a Review</h3>
              
              {!user ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm mb-4">You must be logged in to leave a review.</p>
                  <Link to="/login" className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    Log In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`focus:outline-none transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
                        >
                          <FiStar size={24} fill={star <= rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Review</label>
                    <textarea
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="What did you like or dislike?"
                      className="w-full px-4 py-3 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-200 resize-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    {submitLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {reviewsLoading ? (
              <div className="animate-pulse space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 dark:bg-gray-850 rounded-2xl"></div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-[#1f2028] rounded-3xl border border-gray-150 dark:border-gray-800">
                <FiStar size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-500 font-medium">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="p-6 bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold">
                          {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar key={star} size={14} fill={star <= review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
