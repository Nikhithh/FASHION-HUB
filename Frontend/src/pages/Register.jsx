import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(name, email, password, role);
    setLoading(false);

    if (res.success) {
      toast.success('Successfully registered account!');
      navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1f2028]/80 backdrop-blur-lg border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl text-left space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 text-sm">Join FashionHub marketplace today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 pl-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <FiUser className="absolute left-3.5 top-3.5 text-gray-450" />
            </div>
          </div>

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
                placeholder="min. 6 characters"
                className="w-full px-4 py-3 pl-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <FiLock className="absolute left-3.5 top-3.5 text-gray-450" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account Role</label>
            <div className="grid grid-cols-2 gap-4">
              {['customer', 'seller'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-semibold capitalize text-sm transition-colors ${
                    role === r
                      ? 'border-purple-650 bg-purple-50/20 text-purple-600 dark:bg-purple-950/15'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={(e) => setRole(e.target.value)}
                    className="sr-only"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300 mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
