import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  FiPieChart, 
  FiUsers, 
  FiTag, 
  FiLayers,
  FiGrid,
  FiStar,
  FiEdit,
  FiShoppingBag, 
  FiCheck, 
  FiX, 
  FiTrash2, 
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // State
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [pendingBrands, setPendingBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [docBusyId, setDocBusyId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catType, setCatType] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [savingCat, setSavingCat] = useState(false);

  const CATEGORY_TYPES = ['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'];

  // Brand Management (all brands, any status)
  const [allBrands, setAllBrands] = useState([]);
  const [allBrandsLoading, setAllBrandsLoading] = useState(false);
  const [brandFilter, setBrandFilter] = useState('Pending');
  const [editingBrand, setEditingBrand] = useState(null); // brand object | 'new' | null
  const [brandForm, setBrandForm] = useState({ name: '', description: '', website: '', location: '', contactPhone: '', logo: '' });
  const [savingBrandAdmin, setSavingBrandAdmin] = useState(false);

  // Product Management (ALL products)
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminProductsLoading, setAdminProductsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // product object | 'new' | null
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', brand: '', size: '', color: '', stock: '', images: '' });
  const [savingProduct, setSavingProduct] = useState(false);

  // Review Management
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch Dashboard Stats
  const loadDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data && res.data.success) {
        setDashboard(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Pending Brands
  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const res = await api.get('/admin/brands/pending');
      if (res.data && res.data.success) {
        setPendingBrands(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending brands:', err);
      toast.error('Failed to load pending brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Fetch Orders
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/admin/orders');
      if (res.data && res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'brands') { loadBrands(); loadAllBrands(); }
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'products') { loadAdminProducts(); loadCategories(); }
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'reviews') loadReviews();
  }, [activeTab]);

  // Fetch Categories (admin management)
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data && res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ---------- Category Actions (ADMIN ONLY) ----------
  const resetCatForm = () => {
    setCatName('');
    setCatDesc('');
    setCatType('');
    setEditingCatId(null);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catType) {
      toast.error('Please select a category type.');
      return;
    }
    setSavingCat(true);
    try {
      const payload = { name: catName, description: catDesc, categoryType: catType };
      const res = editingCatId
        ? await api.put(`/admin/categories/${editingCatId}`, payload)
        : await api.post('/admin/categories', payload);
      if (res.data && res.data.success) {
        toast.success(editingCatId ? 'Category updated successfully' : 'Category created successfully');
        resetCatForm();
        loadCategories();
      }
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSavingCat(false);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat._id);
    setCatName(cat.name || '');
    setCatDesc(cat.description || '');
    setCatType(cat.categoryType || '');
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName || 'this category'}"? Products using it must be reassigned.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/categories/${catId}`);
      if (res.data && res.data.success) {
        toast.success('Category deleted successfully');
        if (editingCatId === catId) resetCatForm();
        loadCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // ---------- User Actions ----------
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (res.data && res.data.success) {
        toast.success(`User role updated to ${newRole}`);
        loadUsers();
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName || 'this user'}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data && res.data.success) {
        toast.success('User deleted successfully');
        loadUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // ---------- Brand Actions ----------
  const getAdminNote = (brandId) => adminNotes[brandId] || '';

  const openBrandDocument = async (brand, download = false) => {
    setDocBusyId(brand._id);
    try {
      const res = await api.get(`/admin/brands/${brand._id}/verification-document`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = brand.verificationDocumentName || 'verification-document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      console.error('Error opening verification document:', err);
      toast.error(err.response?.data?.message || 'Failed to open verification document');
    } finally {
      setDocBusyId(null);
    }
  };

  const handleApproveBrand = async (brandId, brandName) => {
    try {
      const res = await api.put(`/admin/brands/${brandId}/approve`, {
        adminVerificationNote: getAdminNote(brandId),
      });
      if (res.data && res.data.success) {
        toast.success(`Brand "${brandName}" approved successfully`);
        setAdminNotes((prev) => ({ ...prev, [brandId]: '' }));
        loadBrands();
      }
    } catch (err) {
      console.error('Error approving brand:', err);
      toast.error(err.response?.data?.message || 'Failed to approve brand');
    }
  };

  const handleRejectBrand = async (brandId, brandName) => {
    const reason = getAdminNote(brandId);
    if (!reason || reason.trim() === '') {
      toast.error('Please provide a rejection reason before rejecting the brand.');
      return;
    }
    try {
      const res = await api.put(`/admin/brands/${brandId}/reject`, {
        rejectionReason: reason,
        adminVerificationNote: reason,
      });
      if (res.data && res.data.success) {
        toast.info(`Brand "${brandName}" rejected`);
        setAdminNotes((prev) => ({ ...prev, [brandId]: '' }));
        loadBrands();
      }
    } catch (err) {
      console.error('Error rejecting brand:', err);
      toast.error(err.response?.data?.message || 'Failed to reject brand');
    }
  };

  // ---------- Brand Management (all brands) ----------
  const loadAllBrands = async () => {
    setAllBrandsLoading(true);
    try {
      const res = await api.get('/admin/brands');
      if (res.data && res.data.success) {
        setAllBrands(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching all brands:', err);
      toast.error('Failed to load brands');
    } finally {
      setAllBrandsLoading(false);
    }
  };

  const resetBrandForm = () => {
    setEditingBrand(null);
    setBrandForm({ name: '', description: '', website: '', location: '', contactPhone: '', logo: '' });
  };

  const startEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name || '',
      description: brand.description || '',
      website: brand.website || '',
      location: brand.location || '',
      contactPhone: brand.contactPhone || '',
      logo: brand.logo || '',
    });
  };

  const handleSaveBrandAdmin = async (e) => {
    e.preventDefault();
    setSavingBrandAdmin(true);
    try {
      const res = editingBrand === 'new'
        ? await api.post('/admin/brands', brandForm)
        : await api.put(`/admin/brands/${editingBrand._id}`, brandForm);
      if (res.data && res.data.success) {
        toast.success(editingBrand === 'new' ? 'Brand created successfully' : 'Brand updated successfully');
        resetBrandForm();
        loadAllBrands();
        loadBrands();
      }
    } catch (err) {
      console.error('Error saving brand:', err);
      toast.error(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSavingBrandAdmin(false);
    }
  };

  const handleDeleteBrandAdmin = async (brandId, brandName) => {
    if (!window.confirm(`Delete brand "${brandName || 'this brand'}"? Products using it must be reassigned.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/brands/${brandId}`);
      if (res.data && res.data.success) {
        toast.success('Brand deleted successfully');
        loadAllBrands();
        loadBrands();
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      toast.error(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  // ---------- Product Management (ALL products) ----------
  const loadAdminProducts = async () => {
    setAdminProductsLoading(true);
    try {
      const res = await api.get('/admin/products');
      if (res.data && res.data.success) {
        setAdminProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setAdminProductsLoading(false);
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', category: '', brand: '', size: '', color: '', stock: '', images: '' });
  };

  const startEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price ?? '',
      category: prod.category || '',
      brand: typeof prod.brand === 'object' ? prod.brand?.name || '' : prod.brand || '',
      size: prod.size || '',
      color: prod.color || '',
      stock: prod.stock ?? '',
      images: Array.isArray(prod.images) ? prod.images.join('\n') : '',
    });
  };

  const handleSaveProductAdmin = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        category: productForm.category,
        stock: Number(productForm.stock),
      };
      if (productForm.brand) payload.brand = productForm.brand;
      if (productForm.size) payload.size = productForm.size;
      if (productForm.color) payload.color = productForm.color;
      payload.images = productForm.images.split('\n').map((u) => u.trim()).filter(Boolean);
      const res = editingProduct === 'new'
        ? await api.post('/admin/products', payload)
        : await api.put(`/admin/products/${editingProduct._id}`, payload);
      if (res.data && res.data.success) {
        toast.success(editingProduct === 'new' ? 'Product created successfully' : 'Product updated successfully');
        resetProductForm();
        loadAdminProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProductAdmin = async (prodId, prodName) => {
    if (!window.confirm(`Delete product "${prodName || 'this product'}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/products/${prodId}`);
      if (res.data && res.data.success) {
        toast.success('Product deleted successfully');
        if (editingProduct && editingProduct._id === prodId) resetProductForm();
        loadAdminProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // ---------- Review Management ----------
  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      if (res.data && res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      toast.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review? The product rating will be recalculated.')) {
      return;
    }
    try {
      const res = await api.delete(`/admin/reviews/${reviewId}`);
      if (res.data && res.data.success) {
        toast.success('Review deleted successfully');
        loadReviews();
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  // ---------- Order Actions ----------
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { 
        status: newStatus,
        orderStatus: newStatus 
      });
      if (res.data && res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        loadOrders();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          You need administrator privileges to view and manage the FashionHub Admin Panel.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-md"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const filteredAdminBrands =
    brandFilter === 'All'
      ? allBrands
      : allBrands.filter((b) => (b.verificationStatus || 'Pending') === brandFilter);

  return (
    <div className="pb-16 text-left space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Control Center</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor system metrics, review brand applications, regulate users, and manage store orders.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', name: 'Overview', icon: <FiPieChart size={16} /> },
          { id: 'users', name: 'Users', icon: <FiUsers size={16} /> },
          { id: 'brands', name: 'Brands', icon: <FiTag size={16} /> },
          { id: 'categories', name: 'Categories', icon: <FiLayers size={16} /> },
          { id: 'products', name: 'Products', icon: <FiGrid size={16} /> },
          { id: 'orders', name: 'Orders', icon: <FiShoppingBag size={16} /> },
          { id: 'reviews', name: 'Reviews', icon: <FiStar size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center whitespace-nowrap gap-2 pb-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {dashboardLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 bg-gray-100 dark:bg-[#1f2028] rounded-3xl border border-gray-150 dark:border-gray-800"></div>
                ))}
              </div>
            ) : dashboard ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Users */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Users</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{dashboard.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FiUsers size={22} />
                  </div>
                </div>

                {/* Total Products */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Products</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{dashboard.totalProducts || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FiTag size={22} />
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Orders</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{dashboard.totalOrders || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FiShoppingBag size={22} />
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Revenue</p>
                    <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
                      ${(dashboard.totalRevenue || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FiDollarSign size={22} />
                  </div>
                </div>

                {/* Pending Brands */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Brands</p>
                    <p className="text-3xl font-extrabold text-amber-500 mt-2">{dashboard.pendingBrands || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                    <FiClock size={22} />
                  </div>
                </div>

                {/* Verified Brands */}
                <div className="bg-white dark:bg-[#1f2028] p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Verified Brands</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{dashboard.verifiedBrands || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <FiCheckCircle size={22} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#1f2028] rounded-3xl border border-gray-150 dark:border-gray-800">
                <p className="text-gray-500">No dashboard statistics available.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                User Registry
              </h2>
              <span className="text-xs text-gray-400">Total Users: {users.length}</span>
            </div>

            {usersLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">
                          {u.name}
                        </td>
                        <td className="py-4 pr-4 text-gray-600 dark:text-gray-400">
                          {u.email}
                        </td>
                        <td className="py-4 pr-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                                : u.role === 'seller'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50'
                                : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                            }`}
                          >
                            <option value="customer">customer</option>
                            <option value="seller">seller</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                            title="Delete User"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BRAND APPROVAL */}
        {activeTab === 'brands' && (
          <>
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                Pending Brand Applications
              </h2>
              <span className="text-xs text-gray-400">Applications: {pendingBrands.length}</span>
            </div>

            {brandsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                ))}
              </div>
            ) : pendingBrands.length === 0 ? (
              <div className="text-center py-12">
                <FiCheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                <p className="text-gray-500 text-sm font-medium">All brand applications have been reviewed!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingBrands.map((brand) => {
                  const sellerName = typeof brand.seller === 'object' ? brand.seller?.name : undefined;
                  const sellerEmail = typeof brand.seller === 'object' ? brand.seller?.email : undefined;
                  return (
                  <div
                    key={brand._id}
                    className="p-5 border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-[#16171d] rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{brand.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/40">
                          {brand.verificationStatus || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {brand.description || 'No description provided by applicant.'}
                      </p>
                      {brand.logo && (
                        <img
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          className="w-16 h-16 object-contain rounded-xl border border-gray-200 dark:border-gray-800 bg-white"
                        />
                      )}
                      <dl className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex gap-1.5">
                          <dt className="font-semibold text-gray-500 w-24 shrink-0">Owner/Seller:</dt>
                          <dd>{sellerName || 'Unknown'}</dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="font-semibold text-gray-500 w-24 shrink-0">Email:</dt>
                          <dd className="break-all">{sellerEmail || '—'}</dd>
                        </div>
                        {brand.contactPhone && (
                          <div className="flex gap-1.5">
                            <dt className="font-semibold text-gray-500 w-24 shrink-0">Phone:</dt>
                            <dd>{brand.contactPhone}</dd>
                          </div>
                        )}
                        {brand.location && (
                          <div className="flex gap-1.5">
                            <dt className="font-semibold text-gray-500 w-24 shrink-0">Location:</dt>
                            <dd>{brand.location}</dd>
                          </div>
                        )}
                        {brand.website && (
                          <div className="flex gap-1.5">
                            <dt className="font-semibold text-gray-500 w-24 shrink-0">Website:</dt>
                            <dd className="break-all">{brand.website}</dd>
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <dt className="font-semibold text-gray-500 w-24 shrink-0">Submitted:</dt>
                          <dd>{brand.createdAt ? new Date(brand.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</dd>
                        </div>
                      </dl>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2028] p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification Document</p>
                        {brand.verificationDocument ? (
                          <>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium break-all">
                              {brand.verificationDocumentName || 'Verification document submitted'}
                            </p>
                            <p className="text-xxs text-gray-400">
                              Uploaded {brand.verificationDocumentUploadedAt ? new Date(brand.verificationDocumentUploadedAt).toLocaleString() : 'date unknown'} — manual admin review required. Upload alone does not prove genuineness.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openBrandDocument(brand, false)}
                                disabled={docBusyId === brand._id}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-semibold rounded-lg"
                              >
                                {docBusyId === brand._id ? 'Opening...' : 'View Document'}
                              </button>
                              <button
                                onClick={() => openBrandDocument(brand, true)}
                                disabled={docBusyId === brand._id}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg"
                              >
                                Download
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-amber-600">No verification document submitted.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Admin Verification Note
                        </label>
                        <textarea
                          rows="2"
                          value={getAdminNote(brand._id)}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [brand._id]: e.target.value }))}
                          placeholder="Reviewed document and brand details... (required when rejecting)"
                          className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-200/50 dark:border-gray-800">
                      <button
                        onClick={() => handleRejectBrand(brand._id, brand.name)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <FiX size={14} />
                        Reject Brand
                      </button>
                      <button
                        onClick={() => handleApproveBrand(brand._id, brand.name)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <FiCheck size={14} />
                        Approve Brand
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Brand Management (all brands, any status) */}
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                Brand Management
              </h2>
              <div className="flex items-center gap-2">
                {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrandFilter(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      brandFilter === s
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => { resetBrandForm(); setEditingBrand('new'); }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  + New Brand
                </button>
              </div>
            </div>

            {editingBrand && (
              <form onSubmit={handleSaveBrandAdmin} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#16171d] p-4 space-y-4">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  {editingBrand === 'new' ? 'Create Brand' : `Edit Brand: ${editingBrand.name}`}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Brand Name</label>
                    <input
                      type="text"
                      required
                      value={brandForm.name}
                      onChange={(e) => setBrandForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Website</label>
                    <input
                      type="text"
                      value={brandForm.website}
                      onChange={(e) => setBrandForm((p) => ({ ...p, website: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows="2"
                    value={brandForm.description}
                    onChange={(e) => setBrandForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Location</label>
                    <input
                      type="text"
                      value={brandForm.location}
                      onChange={(e) => setBrandForm((p) => ({ ...p, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={brandForm.contactPhone}
                      onChange={(e) => setBrandForm((p) => ({ ...p, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Logo URL</label>
                    <input
                      type="text"
                      value={brandForm.logo}
                      onChange={(e) => setBrandForm((p) => ({ ...p, logo: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingBrandAdmin}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold rounded-xl"
                  >
                    {savingBrandAdmin ? 'Saving...' : editingBrand === 'new' ? 'Create Brand' : 'Update Brand'}
                  </button>
                  <button
                    type="button"
                    onClick={resetBrandForm}
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {allBrandsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
              </div>
            ) : filteredAdminBrands.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No brands found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                      <th className="pb-3">Brand</th>
                      <th className="pb-3">Seller</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {filteredAdminBrands.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{b.name}</p>
                            {b.verificationDocumentName && <p className="text-xs text-gray-400">Doc: {b.verificationDocumentName}</p>}
                          </td>
                          <td className="py-4 pr-4 text-xs">
                            {typeof b.seller === 'object' ? b.seller?.email || b.seller?.name : '—'}
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              b.verificationStatus === 'Approved'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50'
                                : b.verificationStatus === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50'
                            }`}>
                              {b.verificationStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => startEditBrand(b)}
                              className="p-2 mr-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                              title="Edit Brand"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBrandAdmin(b._id, b.name)}
                              className="p-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                              title="Delete Brand"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}

        {/* TAB 4: CATEGORY MANAGEMENT (ADMIN ONLY) */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveCategory} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                {editingCatId ? 'Edit Category' : 'Add Category'}
              </h2>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="T-Shirts"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows="2"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Casual cotton tops..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category Type</label>
                <select
                  required
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Type</option>
                  {CATEGORY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium shadow-sm"
                >
                  {savingCat ? 'Saving...' : editingCatId ? 'Update Category' : 'Save Category'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCatForm}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="lg:col-span-2 bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                  Category Management
                </h2>
                <span className="text-xs text-gray-400">Total Categories: {categories.length}</span>
              </div>
              {categoriesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No categories found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                        <th className="pb-3">Category Name</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                      {categories.map((cat) => (
                        <tr key={cat._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                            {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
                          </td>
                          <td className="py-4 pr-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50">
                              {cat.categoryType || 'Unspecified'}
                            </span>
                          </td>
                          <td className="py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="p-2 mr-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                              title="Edit Category"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id, cat.name)}
                              className="p-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                              title="Delete Category"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ORDER MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                Store Orders
              </h2>
              <span className="text-xs text-gray-400">Total Orders: {orders.length}</span>
            </div>

            {ordersLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 pr-4 font-mono text-xs font-bold text-gray-900 dark:text-white">
                          #{order._id ? order._id.slice(-8).toUpperCase() : 'N/A'}
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{order.user?.name || 'Customer'}</p>
                          <p className="text-xs text-gray-400">{order.user?.email || ''}</p>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">
                          ${(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            order.orderStatus === 'Delivered'
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50'
                              : order.orderStatus === 'Cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                              : order.orderStatus === 'Shipped'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50'
                              : order.orderStatus === 'Processing'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50'
                          }`}>
                            {order.orderStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs text-gray-500 dark:text-gray-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td className="py-4 text-right">
                          <select
                            value={order.orderStatus || 'Pending'}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer text-gray-900 dark:text-gray-100"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* TAB 6: PRODUCT MANAGEMENT (ALL products) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {editingProduct && (
              <form onSubmit={handleSaveProductAdmin} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                  {editingProduct === 'new' ? 'Create Product' : `Edit Product`}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Product Name</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows="2"
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}{c.categoryType ? ` (${c.categoryType})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Brand (name)</label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={(e) => setProductForm((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="Brand name"
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Size</label>
                    <input
                      type="text"
                      value={productForm.size}
                      onChange={(e) => setProductForm((p) => ({ ...p, size: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color</label>
                    <input
                      type="text"
                      value={productForm.color}
                      onChange={(e) => setProductForm((p) => ({ ...p, color: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Stock</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Image URLs (one per line)</label>
                  <textarea
                    rows="2"
                    value={productForm.images}
                    onChange={(e) => setProductForm((p) => ({ ...p, images: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium shadow-sm"
                  >
                    {savingProduct ? 'Saving...' : editingProduct === 'new' ? 'Create Product' : 'Update Product'}
                  </button>
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                  All Products
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Total Products: {adminProducts.length}</span>
                  <button
                    onClick={() => { resetProductForm(); setEditingProduct('new'); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    + New Product
                  </button>
                </div>
              </div>
              {adminProductsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                  ))}
                </div>
              ) : adminProducts.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No products found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Brand</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Stock</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                      {adminProducts.map((prod) => (
                        <tr key={prod._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">{prod.name}</td>
                          <td className="py-4 pr-4">{typeof prod.brand === 'object' ? prod.brand?.name : prod.brand || '—'}</td>
                          <td className="py-4 pr-4">{prod.category || '—'}</td>
                          <td className="py-4 pr-4">${Number(prod.price || 0).toFixed(2)}</td>
                          <td className="py-4 pr-4">{prod.stock}</td>
                          <td className="py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => startEditProduct(prod)}
                              className="p-2 mr-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                              title="Edit Product"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProductAdmin(prod._id, prod.name)}
                              className="p-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                              title="Delete Product"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: REVIEW MANAGEMENT */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
                Customer Reviews
              </h2>
              <span className="text-xs text-gray-400">Total Reviews: {reviews.length}</span>
            </div>
            {reviewsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No reviews found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-xs">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Rating</th>
                      <th className="pb-3">Comment</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {reviews.map((rev) => (
                      <tr key={rev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-white">
                          {typeof rev.product === 'object' ? rev.product?.name : rev.product || '—'}
                        </td>
                        <td className="py-4 pr-4 text-xs">
                          {typeof rev.user === 'object' ? rev.user?.email || rev.user?.name : '—'}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                            <FiStar size={14} /> {rev.rating}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs max-w-xs truncate">{rev.comment || rev.review || '—'}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            className="p-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                            title="Delete Review"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
