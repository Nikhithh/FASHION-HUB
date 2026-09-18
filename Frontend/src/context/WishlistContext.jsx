import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setWishlist([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/wishlist');
        if (res.data && res.data.success) {
          setWishlist(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching wishlist', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const isWished = (productId) => wishlist.some((p) => (p._id || p) === productId);

  const addToWishlist = async (productId) => {
    if (!user) return { success: false, error: 'Please log in to use your wishlist.' };
    if (isWished(productId)) return { success: false, error: 'Already in wishlist' };
    try {
      const res = await api.post('/wishlist', { product: productId });
      if (res.data && res.data.success) {
        setWishlist(res.data.data || []);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to add to wishlist' };
    }
    return { success: false, error: 'Failed to add to wishlist' };
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return { success: false, error: 'Please log in to use your wishlist.' };
    try {
      const res = await api.delete(`/wishlist/${productId}`);
      if (res.data && res.data.success) {
        setWishlist(res.data.data || []);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to remove from wishlist' };
    }
    return { success: false, error: 'Failed to remove from wishlist' };
  };

  const toggleWishlist = async (productId) => {
    if (isWished(productId)) return removeFromWishlist(productId);
    return addToWishlist(productId);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, loading, isWished, addToWishlist, removeFromWishlist, toggleWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
