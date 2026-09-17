import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Successfully logged in!');
      navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1f2028]/80 backdrop-blur-lg border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl text-left space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 pl-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <FiMail className="absolute left-3.5 top-3.5 text-gray-450" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full px-4 py-3 pl-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <FiLock className="absolute left-3.5 top-3.5 text-gray-450" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300 mt-2"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-600 hover:underline font-semibold">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
