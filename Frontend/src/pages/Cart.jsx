import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatVariant } from '../utils/variants';
import { resolveImageUrl, FALLBACK_IMAGE } from '../utils/imageUrl';
import { FiTrash2, FiShoppingBag, FiChevronRight } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';

const Cart = () => {
  usePageMeta({
    title: 'Shopping Bag | FashionHub',
    description: 'Review items in your FashionHub shopping bag before checkout.',
  });
  const { cartItems, cartTotal, updateCartItem, removeFromCart, loading } = useCart();

  if (loading && cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-6 rounded-full bg-gray-50 dark:bg-[#1f2028] text-purple-600 dark:text-purple-400">
          <FiShoppingBag size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your bag is empty</h2>
          <p className="text-gray-500 text-sm">Looks like you haven't added anything to your wardrobe yet.</p>
        </div>
        <Link
          to="/shop"
          className="inline-block px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 text-left">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-24 sm:w-24 sm:h-28 overflow-hidden rounded-xl bg-gray-150 flex-shrink-0">
                <img
                  src={resolveImageUrl(item.product?.images?.[0]) || FALLBACK_IMAGE}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info & Controls */}
              <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">
                    <Link to={`/product/${item.product?._id}`} className="hover:text-purple-600 transition-colors">
                      {item.product?.name || 'Loading item name...'}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-400">Unit Price: ${Number(item.price || 0).toFixed(2)}</p>
                  {formatVariant(item) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{formatVariant(item)}</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-6">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateCartItem(item._id, Math.max(1, item.quantity - 1), item.price)}
                      className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 font-bold focus:outline-none"
                    >
                      -
                    </button>
                    <span className="px-3 font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartItem(item._id, item.quantity + 1, item.price)}
                      className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 font-bold focus:outline-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Total price & remove button */}
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-gray-900 dark:text-white text-base">${(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm h-fit space-y-6">
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Order Summary</h2>

          <div className="space-y-3 text-sm pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-850 dark:text-white">${Number(cartTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Shipping</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
          </div>

          <div className="flex justify-between items-end text-lg font-bold">
            <span className="text-gray-850 dark:text-white">Total</span>
            <span className="text-purple-600 dark:text-purple-400 font-black">${Number(cartTotal || 0).toFixed(2)}</span>
          </div>

          <Link
            to="/checkout"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Checkout
            <FiChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
