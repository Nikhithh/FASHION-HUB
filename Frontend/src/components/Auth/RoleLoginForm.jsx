import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Shared presentational login form used by the three role entry points
 * (/login, /brand-login, /admin-login).
 *
 * Authentication itself is NOT duplicated here — the parent page calls the
 * single AuthContext.login() (same /api/auth/login API, JWT + cookie) and
 * then validates the server-returned role.
 */
const RoleLoginForm = ({
  heading,
  subheading,
  icon,
  accent = 'purple',
  loading,
  onSubmit,
  registerLink,
  registerLabel,
  altLogins = [],
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const accents = {
    purple: {
      button: 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 hover:shadow-purple-500/20',
      focus: 'focus:ring-purple-500',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    teal: {
      button: 'bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 hover:shadow-teal-500/20',
      focus: 'focus:ring-teal-500',
      text: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    },
    slate: {
      button: 'bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 hover:shadow-slate-500/20',
      focus: 'focus:ring-slate-500',
      text: 'text-slate-600',
      badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  };
  const a = accents[accent] || accents.purple;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1f2028]/80 backdrop-blur-lg border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl text-left space-y-6">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${a.badge}`}>
            {icon}
            <span>FashionHub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{heading}</h1>
          <p className="text-gray-500 text-sm">{subheading}</p>
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
                className={`w-full px-4 py-3 pl-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 ${a.focus}`}
              />
              <FiMail className="absolute left-3.5 top-3.5 text-gray-450" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pl-10 pr-10 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 ${a.focus}`}
              />
              <FiLock className="absolute left-3.5 top-3.5 text-gray-450" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-3 text-gray-450 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-semibold rounded-2xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 mt-2 ${a.button}`}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="text-center">
          <Link to="/forgot-password" className={`text-sm hover:underline font-semibold ${a.text}`}>
            Forgot password?
          </Link>
        </div>

        {registerLink && (
          <div className="text-center pt-1">
            <p className="text-sm text-gray-500">
              {registerLabel || "Don't have an account?"}{' '}
              <Link to={registerLink} className={`hover:underline font-semibold ${a.text}`}>
                Register Here
              </Link>
            </p>
          </div>
        )}

        {altLogins.length > 0 && (
          <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mt-3 mb-2">Looking for a different login?</p>
            <div className="flex items-center justify-center gap-4">
              {altLogins.map((l) => (
                <Link key={l.to} to={l.to} className={`text-xs font-semibold hover:underline ${a.text}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleLoginForm;
