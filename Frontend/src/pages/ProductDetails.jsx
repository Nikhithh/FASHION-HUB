import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiChevronLeft, FiShoppingBag, FiInfo, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data && res.data.success) {
          const prod = res.data.data;
          setProduct(prod);
          if (prod.size) setSelectedSize(prod.size);
          if (prod.color) setSelectedColor(prod.color);
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
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }

    setAdding(true);
    const res = await addToCart(product._id, quantity, product.price);
    setAdding(false);

    if (res.success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error(res.error || 'Failed to add item to cart');
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

  return (
    <div className="pb-16 text-left">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 font-semibold mb-6 transition-colors">
        <FiChevronLeft size={16} />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image Gallery */}
        <div className="overflow-hidden rounded-3xl bg-gray-50 border border-gray-150 dark:border-gray-850 aspect-[4/5] shadow-sm">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'}
            alt={product.name}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
          />
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
            {/* Spec info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.size && (
                <div>
                  <span className="text-gray-400">Standard Size</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 capitalize">{product.size}</p>
                </div>
              )}
              {product.color && (
                <div>
                  <span className="text-gray-400">Color Palette</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 capitalize">{product.color}</p>
                </div>
              )}
            </div>

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
    </div>
  );
};

export default ProductDetails;
