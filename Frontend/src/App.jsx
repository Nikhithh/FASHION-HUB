import React from 'react';
import { ComparisonProvider } from './context/ComparisonContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import BrandLogin from './pages/BrandLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import api from './services/api';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import OutfitRecommendation from './pages/OutfitRecommendation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route guards to protect private views.
// Unauthenticated users are sent to the login page matching the area they
// tried to open; wrong-role users are bounced to their own landing page.
// Backend role authorization (protect + authorize) remains the final check.
const ProtectedRoute = ({ children, roles, loginPath = '/login' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

// Seller-only guard: role check PLUS live brand-approval check via
// GET /api/auth/seller-status (covers tokens issued before a brand was
// rejected). Unapproved sellers are sent to /brand-login; the backend
// requireApprovedSeller middleware enforces the same on seller APIs.
const SellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [status, setStatus] = React.useState(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    if (loading || !user) {
      setChecking(loading);
      return;
    }
    if (user.role !== 'seller') {
      setChecking(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await api.get('/auth/seller-status');
        if (!cancelled) setStatus(res.data);
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [loading, user]);

  if (loading || checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/brand-login" replace />;
  }

  if (user.role !== 'seller') {
    const fallback = user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={fallback} replace />;
  }

  // Seller with no brand yet may enter (to submit first application);
  // sellers whose brands are all Pending/Rejected are blocked.
  if (status && !status.approved && (status.verificationStatus === 'Pending' || status.verificationStatus === 'Rejected')) {
    return <Navigate to="/brand-login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <ComparisonProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  {/* Stylist / Outfit Recommendation — CUSTOMER ONLY */}
                  <Route
                    path="/recommendations"
                    element={
                      <ProtectedRoute roles={['customer']}>
                        <OutfitRecommendation />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/brand-login" element={<BrandLogin />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />

                  {/* Protected Customer Routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <ProtectedRoute>
                        <Wishlist />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Seller / Admin Routes */}
                  {/* /seller is seller-only (admins use /admin) */}
                  <Route
                    path="/seller"
                    element={
                      <SellerRoute>
                        <SellerDashboard />
                      </SellerRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={['admin']} loginPath="/admin-login">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
            </BrowserRouter>
        </ComparisonProvider>
        </WishlistProvider>
      </CartProvider>
      </AuthProvider >
  );
}

export default App;
