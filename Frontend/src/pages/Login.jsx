import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiShoppingBag } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';
import RoleLoginForm from '../components/Auth/RoleLoginForm';
import { landingFor, loginPageFor } from '../utils/roleLanding';

// CUSTOMER LOGIN — route /login
// Uses the single AuthContext.login() (same /api/auth/login API + JWT) and
// then verifies the server-returned role is 'customer'. Sellers/admins are
// logged back out and pointed at their own login page.
const Login = () => {
  usePageMeta({
    title: 'Customer Login | FashionHub',
    description: 'Log in to your FashionHub customer account to shop, track orders and manage your wishlist.',
  });
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Any authenticated user landing here goes to their own area.
  if (user) return <Navigate to={landingFor(user.role)} replace />;

  const handleSubmit = async (email, password) => {
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }
    if (res.user?.role !== 'customer') {
      const correct = loginPageFor(res.user?.role);
      await logout();
      toast.error(
        res.user?.role === 'seller'
          ? 'This is the customer login. Please use the Brand / Seller login.'
          : 'This is the customer login. Please use the Admin login.'
      );
      navigate(correct);
      return;
    }
    toast.success('Successfully logged in!');
    navigate('/');
  };

  return (
    <RoleLoginForm
      heading="Welcome Back"
      subheading="Log in to your customer account to shop FashionHub"
      icon={<FiShoppingBag />}
      accent="purple"
      loading={loading}
      onSubmit={handleSubmit}
      registerLink="/register"
      altLogins={[
        { to: '/brand-login', label: 'Brand / Seller Login' },
        { to: '/admin-login', label: 'Admin Login' },
      ]}
    />
  );
};

export default Login;
