import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FiPackage, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/myorders');
        if (res.data && res.data.success) {
          setOrders(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load user orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Shipped':
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse text-left">
        <div className="h-10 w-48 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 text-left">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full text-gray-400">
            <FiPackage size={40} />
          </div>
          <p className="text-gray-500 font-medium">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Top bar header info */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850/50 border-b border-gray-150 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Order Placed</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250 mt-0.5 flex items-center gap-1.5">
                      <FiCalendar size={14} className="text-gray-400" />
                      {new Date(order.orderDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Total Price</span>
                    <p className="font-bold text-purple-600 mt-0.5">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-xxs">Order Reference</span>
                    <p className="font-mono text-gray-650 mt-0.5 select-all">#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>

              {/* Items in order */}
              <div className="p-6 space-y-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-12 h-14 overflow-hidden rounded bg-gray-100 flex-shrink-0">
                      {/* Since product populated name/price, check if populated */}
                      <img
                        src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-sm truncate">
                        {item.product?.name || 'Product catalog item'}
                      </h4>
                      <p className="text-xs text-gray-450 mt-1">
                        Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deliver Info */}
              <div className="px-6 py-3 border-t border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-transparent flex justify-between text-xs text-gray-500">
                <span>Payment Mode: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                <span>Shipping: <strong>{order.shippingAddress?.city}, {order.shippingAddress?.country}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
