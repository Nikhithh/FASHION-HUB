import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FiPackage, 
  FiCalendar, 
  FiClock, 
  FiArrowRight, 
  FiXCircle, 
  FiAlertTriangle, 
  FiX, 
  FiShoppingBag 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { resolveImageUrl } from '../utils/imageUrl';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/myorders');
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load user orders', err);
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    setCancellingId(orderToCancel._id);
    try {
      const res = await api.delete(`/orders/${orderToCancel._id}`);
      if (res.data && res.data.success) {
        toast.success('Order cancelled successfully.');
        setOrderToCancel(null);
        setCancelReason('');
        // Refresh orders list
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
      case 'Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse text-left">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-36 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        <div className="h-36 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 text-left space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your purchase history, track order fulfillment, and manage cancellations.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400">
            <FiPackage size={40} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't placed any orders yet.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            <FiShoppingBag size={16} />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isCancellable = order.orderStatus === 'Pending';

            return (
              <div
                key={order._id}
                className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top bar header info */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Order Placed</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-250 mt-0.5 flex items-center gap-1.5">
                        <FiCalendar size={14} className="text-gray-400" />
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Total Amount</span>
                      <p className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Order Reference</span>
                      <p className="font-mono text-gray-650 dark:text-gray-300 mt-0.5 select-all font-semibold">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>

                {/* Items in order preview */}
                <div className="p-6 space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-12 h-14 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-150 dark:border-gray-800">
                        <img
                          src={resolveImageUrl(item.product?.images?.[0])}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-sm truncate">
                          {item.product?.name || 'Product catalog item'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          ${((item.subtotal ?? (item.price * item.quantity))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar with Actions */}
                <div className="px-6 py-3.5 border-t border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-transparent flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-gray-500 dark:text-gray-400">
                    Payment: <strong className="text-gray-700 dark:text-gray-300">{order.paymentMethod}</strong> ({order.paymentStatus})
                  </div>

                  <div className="flex items-center gap-3">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => setOrderToCancel(order)}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-semibold transition-colors border border-red-200 dark:border-red-900/40"
                      >
                        Cancel Order
                      </button>
                    )}

                    <Link
                      to={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-sm transition-all hover:gap-2"
                    >
                      View Details
                      <FiArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-left relative">
            <button
              onClick={() => setOrderToCancel(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
              <FiAlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cancel Order #{orderToCancel._id.slice(-8).toUpperCase()}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Reason for Cancellation (Optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-800 dark:text-gray-200"
              >
                <option value="">Select a reason</option>
                <option value="Changed mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found better price elsewhere">Found a better price elsewhere</option>
                <option value="Delivery time too long">Delivery time is too long</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={cancellingId === orderToCancel._id}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId === orderToCancel._id}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs shadow-md hover:shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {cancellingId === orderToCancel._id ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
