import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiMapPin, FiCreditCard, FiPackage } from 'react-icons/fi';

const Checkout = () => {
  const { cartItems, cartTotal, clearCartState } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      }));

      const payload = {
        orderItems,
        shippingAddress: { address, city, postalCode, country },
        paymentMethod,
        totalAmount: cartTotal,
      };

      const res = await api.post('/orders', payload);

      if (res.data && res.data.success) {
        toast.success('Order placed successfully!');
        clearCartState();
        navigate('/orders');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to place order. Check form input validations.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-16 text-left">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form & Payment Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <FiMapPin className="text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-base text-gray-950 dark:text-white uppercase tracking-wider">Shipping Address</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Fashion Ave, Apt 4B"
                  className="w-full px-4 py-3 bg-white dark:bg-[#1f2028] border border-gray-350 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-3 bg-white dark:bg-[#1f2028] border border-gray-350 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                    className="w-full px-4 py-3 bg-white dark:bg-[#1f2028] border border-gray-350 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full px-4 py-3 bg-white dark:bg-[#1f2028] border border-gray-350 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <FiCreditCard className="text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-base text-gray-950 dark:text-white uppercase tracking-wider">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Cash on Delivery', desc: 'Pay with cash upon package receipt' },
                { name: 'Online Payment', desc: 'Mock credit card / debit checkout flow' },
              ].map((opt) => (
                <label
                  key={opt.name}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === opt.name
                      ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/10'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.name}
                    checked={paymentMethod === opt.name}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 text-purple-650 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{opt.name}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order review sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
              <FiPackage className="text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-base text-gray-950 dark:text-white uppercase tracking-wider">Order Items</h2>
            </div>

            {/* Item list */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-3 text-sm">
                  <div className="w-10 h-12 overflow-hidden rounded bg-gray-100 flex-shrink-0">
                    <img
                      src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-250 truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} &times; ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total calculation */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between items-end text-base font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-900 dark:text-white">Amount Due</span>
                <span className="text-purple-650 dark:text-purple-400 font-extrabold">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
