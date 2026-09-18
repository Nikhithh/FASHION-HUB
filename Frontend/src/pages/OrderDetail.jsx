import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatVariant } from '../utils/variants';
import { resolveImageUrl } from '../utils/imageUrl';
import { 
  FiChevronLeft, 
  FiPackage, 
  FiCalendar, 
  FiClock, 
  FiTruck, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiMapPin, 
  FiCreditCard, 
  FiX, 
  FiShoppingBag,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data && res.data.success) {
        setOrder(res.data.data);
      } else {
        setError('Unable to load order details.');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      if (err.response?.status === 404) {
        setError('Order not found. Please check the order reference.');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this order.');
      } else {
        setError(err.response?.data?.message || 'Failed to load order details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order || order.orderStatus !== 'Pending') {
      toast.error('Only pending orders can be cancelled.');
      return;
    }

    setCancelling(true);
    try {
      // Backend supports DELETE /api/orders/:id and PUT /api/orders/:id/cancel
      const res = await api.delete(`/orders/${order._id}`);
      if (res.data && res.data.success) {
        toast.success('Order cancelled successfully.');
        setShowCancelModal(false);
        setCancelReason('');
        // Refresh order details to update UI
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
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

  // Timeline Tracker Steps Helper
  const getTimelineSteps = (status) => {
    if (status === 'Cancelled') {
      return [
        { key: 'Pending', label: 'Order Placed', desc: 'Order received', icon: FiClock, state: 'completed' },
        { key: 'Processing', label: 'Processing', desc: 'Review & packing', icon: FiPackage, state: 'completed' },
        { key: 'Cancelled', label: 'Cancelled', desc: 'Order was cancelled', icon: FiXCircle, state: 'cancelled' },
      ];
    }

    const standardSteps = [
      { key: 'Pending', label: 'Order Placed', desc: 'Order received', icon: FiClock },
      { key: 'Processing', label: 'Processing', desc: 'Preparing items', icon: FiPackage },
      { key: 'Shipped', label: 'Shipped', desc: 'On the way', icon: FiTruck },
      { key: 'Delivered', label: 'Delivered', desc: 'Package delivered', icon: FiCheckCircle },
    ];

    const orderIndexMap = {
      'Pending': 0,
      'Processing': 1,
      'Shipped': 2,
      'Delivered': 3,
    };

    const currentIndex = orderIndexMap[status] ?? 0;

    return standardSteps.map((step, idx) => {
      let state = 'remaining';
      if (idx < currentIndex) {
        state = 'completed';
      } else if (idx === currentIndex) {
        state = 'current';
      }
      return { ...step, state };
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-8 animate-pulse text-left">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <FiAlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {error || 'Order Details Unavailable'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
          We couldn't retrieve the details for this order. It may not exist, or you might not have permission to view it.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold transition-colors"
          >
            <FiRefreshCw size={14} />
            Try Again
          </button>
          <Link
            to="/orders"
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order.orderStatus);
  const isCancellable = order.orderStatus === 'Pending';

  return (
    <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 space-y-8 text-left">
      {/* Navigation & Header */}
      <div className="space-y-4 pt-2">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors"
        >
          <FiChevronLeft size={16} />
          Back to My Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <FiCalendar size={14} />
              Placed on{' '}
              {new Date(order.orderDate || order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Cancellation button if eligible */}
          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors border border-red-200 dark:border-red-900/50 shadow-sm"
            >
              <FiXCircle size={15} />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Visual Order Tracking Timeline */}
      <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6 sm:mb-8">
          Order Status Tracker
        </h2>

        {/* Timeline Desktop / Tablet (horizontal) */}
        <div className={`hidden sm:grid gap-2 relative ${timelineSteps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {timelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.state === 'completed';
            const isCurrent = step.state === 'current';
            const isCancelled = step.state === 'cancelled';

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                {/* Connecting bar behind step node */}
                {idx < timelineSteps.length - 1 && (
                  <div 
                    className={`absolute top-5 left-1/2 w-full h-1 -z-10 transition-colors ${
                      isCancelled 
                        ? 'bg-red-300 dark:bg-red-900/50' 
                        : isCompleted 
                        ? 'bg-purple-600 dark:bg-purple-500' 
                        : 'bg-gray-200 dark:bg-gray-800'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isCancelled
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-100 dark:ring-red-950/50'
                      : isCompleted
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : isCurrent
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-100 dark:ring-purple-950/50 animate-pulse'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <p className={`mt-3 text-xs sm:text-sm font-bold ${
                  isCancelled
                    ? 'text-red-600 dark:text-red-400'
                    : isCurrent || isCompleted
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xxs text-gray-400 mt-0.5 max-w-[120px]">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Timeline Mobile (vertical) */}
        <div className="sm:hidden space-y-6 relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 ml-4">
          {timelineSteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.state === 'completed';
            const isCurrent = step.state === 'current';
            const isCancelled = step.state === 'cancelled';

            return (
              <div key={step.key} className="relative">
                {/* Node icon anchored to vertical line */}
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                    isCancelled
                      ? 'bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-950/50'
                      : isCompleted
                      ? 'bg-purple-600 text-white'
                      : isCurrent
                      ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/50'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <Icon size={14} />
                </div>

                <div className="pl-2">
                  <p className={`text-sm font-bold ${
                    isCancelled
                      ? 'text-red-600 dark:text-red-400'
                      : isCurrent || isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancellation Notice Banner if Cancelled */}
        {order.orderStatus === 'Cancelled' && (
          <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-xs sm:text-sm font-medium">
            <FiAlertTriangle className="flex-shrink-0" size={18} />
            <span>This order was cancelled. Any reserved stock has been released back into inventory.</span>
          </div>
        )}
      </div>

      {/* Main Grid: Order Items & Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Ordered Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Ordered Items ({order.items?.length || 0})
              </h2>
              <span className="text-xs text-gray-400">Products</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {order.items?.map((item, idx) => {
                const prod = item.product || {};
                const imageUrl = resolveImageUrl(prod.images?.[0]);
                const subtotal = item.subtotal ?? (item.price * item.quantity);

                return (
                  <div key={idx} className="py-4 flex gap-4 items-center">
                    <div className="w-16 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-150 dark:border-gray-800">
                      <img
                        src={imageUrl}
                        alt={prod.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      {prod._id ? (
                        <Link
                          to={`/product/${prod._id}`}
                          className="font-bold text-sm text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1"
                        >
                          {prod.name || 'Product'}
                        </Link>
                      ) : (
                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                          {prod.name || 'Product item'}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        Unit Price: <span className="font-semibold text-gray-700 dark:text-gray-300">${item.price.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Quantity: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.quantity}</span>
                      </p>
                      {formatVariant(item) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                          {formatVariant(item)}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-gray-400 block">Subtotal</span>
                      <span className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary, Payment & Shipping */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-800">
              Payment Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items Subtotal</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping Fee</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 dark:text-white text-base">Total Amount</span>
                <span className="font-black text-xl text-purple-600 dark:text-purple-400">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Mode Info */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Payment Method:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <FiCreditCard size={13} />
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Payment Status:</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xxs border ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-800">
              <FiMapPin size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Delivery Address</span>
            </div>

            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">
                {order.user?.name || 'Customer'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                {order.shippingAddress?.address}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                {order.shippingAddress?.country}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-left relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
              <FiAlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cancel Order #{order._id.slice(-8).toUpperCase()}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to cancel this order? This action cannot be undone once confirmed.
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
                <option value="Incorrect shipping address">Incorrect shipping address</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs shadow-md hover:shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
