import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiTag } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';
import RoleLoginForm from '../components/Auth/RoleLoginForm';
import { landingFor, loginPageFor } from '../utils/roleLanding';

// BRAND / SELLER LOGIN — route /brand-login (existing seller role)
// Same AuthContext.login() API. The backend blocks sellers whose brands are
// all Pending/Rejected with a 403 ("...pending." / "...rejected."), which is
// surfaced verbatim. Only role === 'seller' proceeds to /seller.
const BrandLogin = () => {
  usePageMeta({
    title: 'Brand Login | FashionHub',
    description: 'Approved FashionHub brands log in here to manage products and orders.',
  });
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={landingFor(user.role)} replace />;

  const handleSubmit = async (email, password) => {
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      toast.error(res.error);
      return;
    }
    if (res.user?.role !== 'seller') {
      const correct = loginPageFor(res.user?.role);
      await logout();
      toast.error(
        res.user?.role === 'admin'
          ? 'Brand area is for brand accounts. Please use the Admin login.'
          : 'This login is for brands. Please use the customer login.'
      );
      navigate(correct);
      return;
    }
    toast.success('Welcome back!');
    navigate('/seller');
  };

  return (
    <RoleLoginForm
      heading="Brand Login"
      subheading="Manage your brand, products and orders"
      icon={<FiTag />}
      accent="teal"
      loading={loading}
      onSubmit={handleSubmit}
      registerLink="/register"
      registerLabel="New brand? Register here"
      altLogins={[
        { to: '/login', label: 'Customer Login' },
        { to: '/admin-login', label: 'Admin Login' },
      ]}
    />
  );
};

export default BrandLogin;
