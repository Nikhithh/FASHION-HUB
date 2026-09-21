import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiPhone, FiTag, FiFileText } from 'react-icons/fi';
import usePageMeta from '../hooks/usePageMeta';

const BRAND_DOC_MAX_SIZE = 5 * 1024 * 1024; // 5MB — mirrors backend limit
const BRAND_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const BRAND_DOC_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

const inputCls =
  'w-full px-4 py-3 bg-white dark:bg-[#16171d] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2';

const Register = () => {
  usePageMeta({
    title: 'Register | FashionHub',
    description: 'Create a FashionHub account to shop, track orders and manage your wishlist.',
  });
  const { register, registerSeller, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  // Brand application fields (seller only — one combined application)
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [brandLocation, setBrandLocation] = useState('');
  const [brandDoc, setBrandDoc] = useState(null);

  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const isValidBrandDoc = (file) => {
    if (!file) return false;
    const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    return BRAND_DOC_TYPES.includes(file.type) && BRAND_DOC_EXTS.includes(ext) && file.size <= BRAND_DOC_MAX_SIZE;
  };

  const handleBrandDocSelect = (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    if (!isValidBrandDoc(file)) {
      toast.error('Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
      e.target.value = '';
      setBrandDoc(null);
      return;
    }
    setBrandDoc(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let res;
    if (role === 'seller') {
      // ONE seller + brand application (User role=seller, Brand Pending, doc attached)
      if (!brandDoc) {
        setLoading(false);
        toast.error('Please upload a brand verification document (PDF, JPG, JPEG, PNG up to 5 MB).');
        return;
      }
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('brandName', brandName);
      if (brandDescription) formData.append('brandDescription', brandDescription);
      if (brandLogo) formData.append('logo', brandLogo);
      if (brandWebsite) formData.append('website', brandWebsite);
      if (brandLocation) formData.append('location', brandLocation);
      if (phone) formData.append('contactPhone', phone);
      formData.append('verificationDocument', brandDoc);
      res = await registerSeller(formData);
      setLoading(false);
      if (res.success) {
        toast.success(res.message || 'Your brand application has been submitted and is pending admin verification.');
        navigate('/login');
      } else {
        toast.error(res.error);
      }
      return;
    }
    res = await register(name, email, password, role);
    setLoading(false);

    if (res.success) {
      toast.success('Successfully registered account!');
      navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className={`w-full ${role === 'seller' ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-[#1f2028]/80 backdrop-blur-lg border border-gray-150 dark:border-gray-800 rounded-3xl p-8 shadow-xl text-left space-y-6`}>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 text-sm">Join FashionHub marketplace today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Account Type</label>
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
                  {r === 'seller' ? 'Brand' : r}
                </label>
              ))}
            </div>
          </div>

          {/* ---------- SECTION 1 — SELLER / ACCOUNT INFORMATION ---------- */}
          {role === 'seller' && (
            <h2 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider pt-2">
              Brand Owner Information
            </h2>
          )}
          <div className={`grid grid-cols-1 ${role === 'seller' ? 'sm:grid-cols-2' : ''} gap-4`}>
            <div className="space-y-1">
              <label className={labelCls}>Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={`${inputCls} pl-10`}
                />
                <FiUser className="absolute left-3.5 top-3.5 text-gray-450" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputCls} pl-10`}
                />
                <FiMail className="absolute left-3.5 top-3.5 text-gray-450" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 6 characters"
                  className={`${inputCls} pl-10`}
                />
                <FiLock className="absolute left-3.5 top-3.5 text-gray-450" />
              </div>
            </div>

            {role === 'seller' && (
              <div className="space-y-1">
                <label className={labelCls}>Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`${inputCls} pl-10`}
                  />
                  <FiPhone className="absolute left-3.5 top-3.5 text-gray-450" />
                </div>
              </div>
            )}
          </div>

          {/* ---------- SECTION 2 — BRAND INFORMATION (seller only) ---------- */}
          {role === 'seller' && (
            <>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider pt-2">
                Brand Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Brand Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Urban Threads"
                      className={`${inputCls} pl-10`}
                    />
                    <FiTag className="absolute left-3.5 top-3.5 text-gray-450" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Website (optional)</label>
                  <input
                    type="text"
                    value={brandWebsite}
                    onChange={(e) => setBrandWebsite(e.target.value)}
                    placeholder="https://urbanthreads.example.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Description (optional)</label>
                <textarea
                  rows="2"
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="A modern fashion brand offering contemporary clothing."
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Location (optional)</label>
                  <input
                    type="text"
                    value={brandLocation}
                    onChange={(e) => setBrandLocation(e.target.value)}
                    placeholder="Kochi, Kerala"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Logo URL (optional)</label>
                  <input
                    type="text"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Brand Verification Document *</label>
                <div className="relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleBrandDocSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold hover:file:bg-purple-100"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Upload a document that helps verify your brand ownership or business legitimacy. Accepted formats:
                  PDF, JPG, JPEG, PNG. Maximum size: 5 MB.
                </p>
                {brandDoc && (
                  <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                    <FiFileText /> Selected: {brandDoc.name}
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-0.5 transition-all duration-300 mt-2"
          >
            {loading
              ? role === 'seller' ? 'Submitting Application...' : 'Creating Account...'
              : role === 'seller' ? 'Submit Brand Application' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2 space-y-2">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={role === 'seller' ? '/brand-login' : '/login'} className="text-purple-600 hover:underline font-semibold">
              Log In
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            {role === 'seller' ? (
              <>Shopping instead? <Link to="/login" className="text-purple-600 hover:underline font-semibold">Customer Login</Link></>
            ) : (
              <>Selling a brand? <Link to="/brand-login" className="text-teal-600 hover:underline font-semibold">Brand Login</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
