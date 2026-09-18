import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { FiShoppingBag, FiUser, FiLogOut, FiMenu, FiX, FiActivity, FiSearch, FiHeart } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';

const SUGGEST_LIMIT = 5;

// Reusable search box with lightweight autocomplete backed by the existing
// GET /products/search?keyword= endpoint (no new search engine).
const SearchBox = ({ autoFocus, onNavigate, className }) => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const fetchSuggestions = (q) => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get('/products/search', { params: { keyword: query } });
        const items = (res.data && res.data.data) || [];
        setSuggestions(items.slice(0, SUGGEST_LIMIT));
        setOpen(true);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
  };

  const goToShop = (keyword) => {
    const q = (keyword ?? value).trim();
    setOpen(false);
    setSuggestions([]);
    if (onNavigate) onNavigate();
    if (!q) {
      navigate('/shop');
    } else {
      navigate(`/shop?keyword=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${className || ''}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); goToShop(); }}
        className="relative"
        role="search"
      >
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => { setValue(e.target.value); fetchSuggestions(e.target.value); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder="Search products..."
          aria-label="Search products"
          className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <FiSearch className="absolute left-3 top-3 text-gray-400" size={16} />
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 rounded-xl shadow-xl bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 py-1 z-50 overflow-hidden">
          {suggestions.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setValue(p.name); goToShop(p.name); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 truncate"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const { wishlist } = useWishlist();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-[#16171d]/75 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wider text-purple-600 dark:text-purple-400">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 text-white p-2 rounded-lg leading-none shadow-md">F</span>
              FashionHub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">Home</Link>
            <Link to="/shop" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">Shop</Link>
            {(!user || user.role === 'customer') && (
              <Link to="/recommendations" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">Stylist</Link>
            )}
            {(!user || user.role === 'customer') && (
              <Link to="/compare" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">Compare</Link>
            )}
            {user?.role === 'customer' && (
              <Link to="/orders" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">My Orders</Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                <FiActivity size={16} />
                Seller Dashboard
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">Seller Orders</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                <FiActivity size={16} />
                Admin Panel
              </Link>
            )}
          </div>

          {/* Cart & Profile & Menu Toggle */}
          <div className="flex items-center space-x-4">
            {/* Desktop search */}
            <SearchBox className="hidden md:block w-56 lg:w-72" />
            {/* Wishlist Link (customer only) */}
            {user?.role === 'customer' && (
              <Link to="/wishlist" aria-label="My Wishlist" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <FiHeart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full transform translate-x-1/3 -translate-y-1/3 shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Link */}
            <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <FiShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full transform translate-x-1/3 -translate-y-1/3 shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all focus:outline-none"
                >
                  <FiUser size={20} />
                  <span className="hidden sm:inline font-medium text-sm">{user.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 py-1 z-50 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user.email}</p>
                      <p className="text-xs capitalize text-purple-600 dark:text-purple-400 mt-0.5">{user.role}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center gap-2 transition-colors"
                    >
                      <FiUser size={16} />
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                    >
                      <FiLogOut size={16} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
                  Log In
                </Link>
                <Link to="/brand-login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-colors">
                  Brand Login
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md hover:shadow-purple-500/20">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile search */}
            <div className="px-3 pb-2">
              <SearchBox onNavigate={() => setIsOpen(false)} />
            </div>
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Shop
            </Link>
            {(!user || user.role === 'customer') && (
              <Link
                to="/recommendations"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Stylist
              </Link>
            )}
            {user?.role === 'customer' && (
              <Link
                to="/orders"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                My Orders
              </Link>
            )}
            {user?.role === 'customer' && (
              <Link
                to="/wishlist"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                My Wishlist
              </Link>
            )}
            {(!user || user.role === 'customer') && (
              <Link
                to="/compare"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Compare
              </Link>
            )}
            {user && (
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                My Profile
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link
                to="/seller"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                Seller Dashboard
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link
                to="/seller"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Seller Orders
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              >
                Admin Panel
              </Link>
            )}
            {!user && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col space-y-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600"
                >
                  Log In
                </Link>
                <Link
                  to="/brand-login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600"
                >
                  Brand / Seller Login
                </Link>
                <Link
                  to="/admin-login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-slate-500"
                >
                  Admin Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
