import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiShield } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';
import RoleLoginForm from '../components/Auth/RoleLoginForm';
import { landingFor } from '../utils/roleLanding';

// ADMIN LOGIN — route /admin-login
// Same AuthContext.login() API. Only role === 'admin' proceeds to /admin.
// Non-admin accounts are logged back out with an access-denied message.
// No public admin registration exists.
const AdminLogin = () => {
  usePageMeta({
    title: 'Administrator Login | FashionHub',
    description: 'FashionHub administrators log in here to manage the marketplace.',
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
    if (res.user?.role !== 'admin') {
      await logout();
      toast.error('Access denied. This login is for administrators only.');
      navigate('/login');
      return;
    }
    toast.success('Welcome back, admin!');
    navigate('/admin');
  };

  return (
    <RoleLoginForm
      heading="Administrator Login"
      subheading="Restricted area — authorized administrators only"
      icon={<FiShield />}
      accent="slate"
      loading={loading}
      onSubmit={handleSubmit}
      altLogins={[{ to: '/login', label: 'Customer Login' }]}
    />
  );
};

export default AdminLogin;
