import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTag, FiShoppingBag, FiDatabase, FiGrid } from 'react-icons/fi';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [activeTab, setActiveTab] = useState('products');

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodSize, setProdSize] = useState('');
  const [prodColor, setProdColor] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');

  // Add Brand/Category forms
  const [newBrand, setNewBrand] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadData = async () => {
    try {
      const [pRes, cRes, bRes, oRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/orders'),
      ]);
      if (pRes.data.success) setProducts(pRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (bRes.data.success) setBrands(bRes.data.data);
      if (oRes.data.success) setOrders(oRes.data.data);
    } catch (err) {
      console.error('Failed to load seller dashboard details', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        category: prodCategory,
        brand: prodBrand,
        size: prodSize,
        color: prodColor,
        stock: parseInt(prodStock),
        images: prodImage ? [prodImage] : [],
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        toast.success('Product added successfully!');
        // Clear
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setProdCategory('');
        setProdBrand('');
        setProdSize('');
        setProdColor('');
        setProdStock('');
        setProdImage('');
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', { name: newCat, description: newCatDesc });
      if (res.data.success) {
        toast.success('Category created!');
        setNewCat('');
        setNewCatDesc('');
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create category');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/brands', { name: newBrand, description: newBrandDesc });
      if (res.data.success) {
        toast.success('Brand created!');
        setNewBrand('');
        setNewBrandDesc('');
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create brand');
    }
  };

  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    const nextStatusMap = {
      'Pending': 'Processing',
      'Processing': 'Shipped',
      'Shipped': 'Delivered',
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    try {
      const res = await api.put(`/orders/${orderId}/status`, { orderStatus: nextStatus });
      if (res.data.success) {
        toast.success(`Order status updated to ${nextStatus}`);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="pb-16 text-left space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Seller Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-250 dark:border-gray-800 gap-6">
        {[
          { id: 'products', name: 'Products Catalog', icon: <FiGrid /> },
          { id: 'add-product', name: 'Add Product', icon: <FiPlus /> },
          { id: 'brands-categories', name: 'Brands & Categories', icon: <FiTag /> },
          { id: 'orders', name: 'Customer Orders', icon: <FiShoppingBag /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-850'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Products Catalog Tab */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Active Inventory</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-850 text-gray-400 font-semibold uppercase tracking-wider text-xxs">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Brand</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 font-medium text-gray-700 dark:text-gray-300">
                {products.map((prod) => (
                  <tr key={prod._id}>
                    <td className="py-4 pr-4">{prod.name}</td>
                    <td className="py-4 pr-4">{prod.brand}</td>
                    <td className="py-4 pr-4">{prod.category}</td>
                    <td className="py-4 pr-4">${prod.price.toFixed(2)}</td>
                    <td className="py-4 pr-4">{prod.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Tab */}
      {activeTab === 'add-product' && (
        <form onSubmit={handleAddProduct} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl">
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Create New Listing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Slim Fit Cotton Shirt"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                placeholder="49.99"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows="3"
              required
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Provide a comprehensive product description..."
              className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <select
                required
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Brand</label>
              <select
                required
                value={prodBrand}
                onChange={(e) => setProdBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Size</label>
              <input
                type="text"
                value={prodSize}
                onChange={(e) => setProdSize(e.target.value)}
                placeholder="M, L, XL, 10"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Color</label>
              <input
                type="text"
                value={prodColor}
                onChange={(e) => setProdColor(e.target.value)}
                placeholder="Blue, Beige"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stock Inventory</label>
              <input
                type="number"
                required
                value={prodStock}
                onChange={(e) => setProdStock(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Image URL</label>
            <input
              type="text"
              value={prodImage}
              onChange={(e) => setProdImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-md"
          >
            Add Product Listing
          </button>
        </form>
      )}

      {/* Brands & Categories Tab */}
      {activeTab === 'brands-categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Category */}
          <form onSubmit={handleAddCategory} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Create Category</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category Name</label>
              <input
                type="text"
                required
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Activewear"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows="2"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Sportswear, tracksuits, athletic tights..."
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-purple-650 hover:bg-purple-750 text-white rounded-xl font-medium shadow-sm">
              Save Category
            </button>
          </form>

          {/* Create Brand */}
          <form onSubmit={handleAddBrand} className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Create Brand</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Brand Name</label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Gucci"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows="2"
                value={newBrandDesc}
                onChange={(e) => setNewBrandDesc(e.target.value)}
                placeholder="Italian fashion house specializing in leather goods..."
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-purple-650 hover:bg-purple-750 text-white rounded-xl font-medium shadow-sm">
              Save Brand
            </button>
          </form>
        </div>
      )}

      {/* Customer Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Active Customer Orders</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-850 text-gray-400 font-semibold uppercase tracking-wider text-xxs">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items Count</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Current Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 font-medium text-gray-700 dark:text-gray-300">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-mono">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="py-4">{order.user?.name || 'Jane Doe'}</td>
                    <td className="py-4">{order.items?.length || 0}</td>
                    <td className="py-4">${order.totalAmount?.toFixed(2)}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded text-xs border bg-purple-50 text-purple-700 border-purple-200">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-4">
                      {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order._id, order.orderStatus)}
                          className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
                        >
                          Progress status
                        </button>
                      ) : (
                        <span className="text-xs text-gray-405 font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
