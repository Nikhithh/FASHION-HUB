import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatVariant } from '../utils/variants';
import api from '../services/api';
import { toast } from 'react-toastify';
import { resolveImageUrl } from '../utils/imageUrl';
import { FiMapPin, FiCreditCard, FiPackage } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';

const Checkout = () => {
  usePageMeta({
    title: 'Checkout | FashionHub',
    description: 'Complete your FashionHub purchase with secure checkout and delivery options.',
  });
  const { cartItems, cartTotal, clearCartState } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [submitting, setSubmitting] = useState(false);

  // Saved addresses (select one to auto-fill the form)
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('');

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        if (res.data && res.data.success) setSavedAddresses(res.data.data || []);
      } catch (err) {
        console.error('Failed to load saved addresses', err);
      }
    };
    loadAddresses();
  }, []);

  const handleSelectAddress = (addrId) => {
    setSelectedAddrId(addrId);
    if (!addrId) return; // "enter new address" — keep current manual input
    const addr = savedAddresses.find((a) => a._id === addrId);
    if (addr) {
      setAddress(addr.address || '');
      setCity(addr.city || '');
      setPostalCode(addr.postalCode || '');
      setCountry(addr.country || '');
    }
  };

  // Cart may hold either a populated product object ({ _id, ... }) or a raw
  // ObjectId string (depends on which cart endpoint last updated state).
  // Never use the cart line `item._id` here — that is the line id, not the product id.
  const resolveProductId = (item) => {
    if (!item) return null;
    const p = item.product;
    if (typeof p === 'string' && p) return p;
    if (p && typeof p === 'object') {
      if (typeof p._id === 'string' && p._id) return p._id;
      if (p._id && typeof p._id === 'object') return String(p._id);
      if (typeof p.id === 'string' && p.id) return p.id;
    }
    if (typeof item.productId === 'string' && item.productId) return item.productId;
    if (item.productId && typeof item.productId === 'object' && item.productId._id) {
      return String(item.productId._id);
    }
    return null;
  };

  const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id || '');
  const ALLOWED_PAYMENTS = ['Cash on Delivery', 'Online Payment'];

  const getProductView = (item) =>
    item && item.product && typeof item.product === 'object' ? item.product : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!address.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      toast.error('Please provide a complete shipping address (street, city, postal code, country).');
      return;
    }
    if (!ALLOWED_PAYMENTS.includes(paymentMethod)) {
      toast.error('Please select a supported payment method.');
      return;
    }

    // Client-side cart validation — never send invalid data to the backend.
    const items = [];
    for (let idx = 0; idx < cartItems.length; idx += 1) {
      const item = cartItems[idx];
      const product = resolveProductId(item);
      if (!product || !isValidObjectId(product)) {
        toast.error(`Cart item ${idx + 1} has a missing or invalid product. Please refresh your cart and try again.`);
        return;
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        toast.error(`Invalid quantity for cart item ${idx + 1}. Quantity must be a positive integer.`);
        return;
      }
      items.push({
        product,
        quantity: item.quantity,
        ...(item.size ? { size: item.size } : {}),
        ...(item.color ? { color: item.color } : {}),
      });
    }

    setSubmitting(true);
    try {
      // NOTE: prices/total are intentionally omitted — the backend loads product
      // prices from MongoDB and calculates the order total securely.
      const payload = {
        items,
        shippingAddress: {
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        paymentMethod,
      };

      const res = await api.post('/orders', payload);

      if (res.data && res.data.success) {
        toast.success('Order placed successfully!');
        clearCartState();
        navigate('/orders');
      }
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const backendMsg = err.response?.data?.message;
      if (status === 401) {
        toast.error('Please log in to place an order.');
      } else if (status === 404) {
        toast.error(backendMsg || 'One of the products was not found. It may have been deleted. Please refresh your cart.');
      } else if (status === 409) {
        toast.error(backendMsg || 'Order conflict. Please review your cart and try again.');
      } else if (status === 400) {
        toast.error(backendMsg || 'Invalid order data. Please check your cart, address, and payment method.');
      } else {
        toast.error(backendMsg || 'Failed to place order. Check form input validations.');
      }
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

            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Choose a saved address</label>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedAddrId === addr._id
                          ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/10'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        value={addr._id}
                        checked={selectedAddrId === addr._id}
                        onChange={(e) => handleSelectAddress(e.target.value)}
                        className="mt-1 text-purple-650 focus:ring-purple-500"
                      />
                      <div className="text-sm">
                        {addr.label && <p className="font-semibold text-gray-900 dark:text-white">{addr.label}</p>}
                        <p className="text-gray-600 dark:text-gray-400">
                          {addr.address}, {addr.city} {addr.postalCode}, {addr.country}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 cursor-pointer text-sm text-gray-500">
                    <input
                      type="radio"
                      name="savedAddress"
                      value=""
                      checked={selectedAddrId === ''}
                      onChange={(e) => handleSelectAddress(e.target.value)}
                      className="text-purple-650 focus:ring-purple-500"
                    />
                    Enter a new address below
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  Manage saved addresses in <Link to="/profile" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">My Profile</Link>.
                </p>
              </div>
            )}

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
              {cartItems.map((item) => {
                const view = getProductView(item);
                return (
                <div key={item._id} className="flex gap-3 text-sm">
                  <div className="w-10 h-12 overflow-hidden rounded bg-gray-100 flex-shrink-0">
                    <img
                      src={resolveImageUrl(view?.images?.[0])}
                      alt={view?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-250 truncate">{view?.name || 'Product unavailable — please refresh cart'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} &times; ${Number(item.price || 0).toFixed(2)}</p>
                    {formatVariant(item) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{formatVariant(item)}</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Total calculation */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white">${Number(cartTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between items-end text-base font-bold pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-900 dark:text-white">Amount Due</span>
                <span className="text-purple-650 dark:text-purple-400 font-extrabold">${Number(cartTotal || 0).toFixed(2)}</span>
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
