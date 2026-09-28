import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { deleteNotification } from '../services/api';
import Loader from '../components/UI/Loader';

// Resolve where a notification should navigate, reusing existing pages only.
// Customer order/payment/review -> /orders or /orders/:id
// Seller order -> /seller ; seller brand approval -> /seller
// Admin brand/order -> /admin
const resolveDestination = (notification, role) => {
  const { relatedId, relatedType, type } = notification;
  const orderId = relatedType === 'Order' && relatedId ? `/orders/${relatedId}` : null;

  if (role === 'admin') {
    if (type === 'NEW_BRAND_APPLICATION' || type === 'NEW_ORDER' || type === 'IMPORTANT_ORDER_UPDATE') {
      return '/admin';
    }
    return orderId || '/admin';
  }
  if (role === 'seller') {
    return '/seller';
  }
  // customer (and fallback)
  if (type === 'REVIEW_SUBMITTED' && relatedType === 'Product' && relatedId) {
    return `/product/${relatedId}`;
  }
  if (orderId) return orderId;
  if (type && type.startsWith('ORDER_')) return '/orders';
  return null;
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    const dest = resolveDestination(notification, user?.role);
    if (dest) navigate(dest);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch {
      // Ignore delete failures; list stays as-is.
    }
  };

  if (loading) return <Loader />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">You have no notifications yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {notifications.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  n.isRead ? 'bg-white dark:bg-[#16171d]' : 'bg-purple-50/60 dark:bg-purple-950/20'
                }`}
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    n.isRead ? 'bg-gray-300 dark:bg-gray-600' : 'bg-purple-600'
                  }`}
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${n.isRead ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 truncate">{n.message}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Delete notification"
                  onClick={(e) => handleDelete(e, n._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(e, n._id); }}
                  className="text-gray-400 hover:text-red-600 text-lg leading-none px-1 flex-shrink-0"
                >
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
