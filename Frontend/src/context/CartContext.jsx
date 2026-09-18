import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load cart on startup / user change
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        setCartItems([]);
        setCartTotal(0);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/cart');
        if (res.data && res.data.success) {
          setCartItems(res.data.data.items || []);
          setCartTotal(res.data.data.total || 0);
        }
      } catch (err) {
        console.error('Error fetching cart', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  const addToCart = async (productId, quantity, price, size, color) => {
    if (!user) {
      return { success: false, error: 'Please login to add items to cart' };
    }
    setLoading(true);
    try {
      const res = await api.post('/cart', { product: productId, quantity, price, size, color });
      if (res.data && res.data.success) {
        setCartItems(res.data.data.items || []);
        setCartTotal(res.data.data.total || 0);
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.message || 'Failed to add item to cart' };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity, price) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.put(`/cart/${itemId}`, { quantity, price });
      if (res.data && res.data.success) {
        setCartItems(res.data.data.items || []);
        setCartTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.delete(`/cart/${itemId}`);
      if (res.data && res.data.success) {
        setCartItems(res.data.data.items || []);
        setCartTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearCartState = () => {
    setCartItems([]);
    setCartTotal(0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
