import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // critical for cookies (cookie-parser on backend)
});

// Automatically inject Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Notification API (uses the shared Axios client above — same baseURL,
// credentials, and Authorization header injection).
export const getNotifications = () => api.get('/notifications');

export const getUnreadNotificationCount = () => api.get('/notifications/unread-count');

export const markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () => api.patch('/notifications/read-all');

export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
