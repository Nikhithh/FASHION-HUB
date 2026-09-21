import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import { toast } from 'react-toastify';
import { FiPlus, FiTag, FiShoppingBag, FiDatabase, FiGrid, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Brand verification document (manual admin review — upload is NOT proof of genuineness)
const BRAND_DOC_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BRAND_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const BRAND_DOC_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [activeTab, setActiveTab] = useState('products');
  const [editingId, setEditingId] = useState(null);

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodSize, setProdSize] = useState('');
  const [prodColor, setProdColor] = useState('');
  const [prodStock, setProdStock] = useState('');
  // Images: preserved/URL-based + newly selected files (multipart upload)
  const [existingImages, setExistingImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [prodFiles, setProdFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Add Brand/Category forms
  const [newBrand, setNewBrand] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [newBrandWebsite, setNewBrandWebsite] = useState('');
  const [newBrandLocation, setNewBrandLocation] = useState('');
  const [newBrandPhone, setNewBrandPhone] = useState('');
  const [brandDoc, setBrandDoc] = useState(null);
  const [replacementDocs, setReplacementDocs] = useState({});
  const [savingBrand, setSavingBrand] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatType, setNewCatType] = useState(''); // admin only

  const { user, loading: authLoading } = useAuth();

  const loadData = async () => {
    try {
      const [pRes, cRes, bRes, oRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/orders/seller'),
      ]);
      if (pRes.data.success) {
        const myId = String(user?._id || user?.id || '');
        const filtered = pRes.data.data.filter(p => String(typeof p.seller === 'object' ? p.seller?._id : p.seller) === myId);
        setProducts(filtered);
      }
      if (cRes.data.success) setCategories(cRes.data.data);
      if (bRes.data.success) setBrands(bRes.data.data);
      if (oRes.data.success) setOrders(oRes.data.data);
    } catch (err) {
      console.error('Failed to load seller dashboard details', err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadData();
  }, [user, authLoading]);

  const resetProductForm = () => {
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdCategory('');
    setProdBrand('');
    setProdSize('');
    setProdColor('');
    setProdStock('');
    setExistingImages([]);
    setImageUrlInput('');
    setProdFiles([]);
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setFilePreviews([]);
    setEditingId(null);
  };

  const handleFileSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    const totalAfter = existingImages.length + prodFiles.length + picked.length;
    if (totalAfter > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      e.target.value = '';
      return;
    }
    const valid = [];
    for (const f of picked) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not an allowed image type (jpg, png, webp, gif)`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds 5MB`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length > 0) {
      setProdFiles((prev) => [...prev, ...valid]);
      setFilePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
    }
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (existingImages.length + prodFiles.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error('Image URL must start with http(s)://');
      return;
    }
    setExistingImages((prev) => [...prev, url]);
    setImageUrlInput('');
  };

  const removeExistingImage = (idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx));

  const removeNewFile = (idx) => {
    setProdFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx]) URL.revokeObjectURL(prev[idx]);
      return next;
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const totalImages = existingImages.length + prodFiles.length;
    if (totalImages > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', prodName);
      formData.append('description', prodDesc);
      formData.append('price', prodPrice);
      formData.append('category', prodCategory);
      formData.append('brand', prodBrand);
      if (prodSize) formData.append('size', prodSize);
      if (prodColor) formData.append('color', prodColor);
      formData.append('stock', prodStock);
      // Preserve existing/URL images on edit + create; backend merges with uploaded files
      formData.append('existingImages', JSON.stringify(existingImages));
      prodFiles.forEach((f) => formData.append('images', f));

      if (editingId) {
        await api.put(`/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product added successfully!');
      }

      resetProductForm();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (prod) => {
    setEditingId(prod._id);
    setProdName(prod.name);
    setProdDesc(prod.description);
    setProdPrice(prod.price);
    setProdCategory(prod.category);
    setProdBrand(typeof prod.brand === 'object' ? prod.brand._id : prod.brand);
    setProdSize(prod.size);
    setProdColor(prod.color);
    setProdStock(prod.stock);
    // Preserve existing image URLs when editing (backend keeps these + new uploads)
    setExistingImages(Array.isArray(prod.images) ? [...prod.images] : []);
    setImageUrlInput('');
    setProdFiles([]);
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setFilePreviews([]);
    setActiveTab('add-product');
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted');
        loadData();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: newCat, description: newCatDesc };
      if (user?.role === 'admin') {
        payload.categoryType = newCatType;
      }
      const res = await api.post('/categories', payload);
      if (res.data.success) {
        toast.success('Category created!');
        setNewCat('');
        setNewCatDesc('');
        setNewCatType('');
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

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

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!brandDoc) {
      toast.error('Please upload a brand verification document (PDF, JPG, JPEG, PNG up to 5 MB).');
      return;
    }
    if (!isValidBrandDoc(brandDoc)) {
      toast.error('Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
      return;
    }
    setSavingBrand(true);
    try {
      const formData = new FormData();
      formData.append('name', newBrand);
      formData.append('description', newBrandDesc);
      if (newBrandWebsite) formData.append('website', newBrandWebsite);
      if (newBrandLocation) formData.append('location', newBrandLocation);
      if (newBrandPhone) formData.append('contactPhone', newBrandPhone);
      formData.append('verificationDocument', brandDoc);
      const res = await api.post('/brands', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Verification document submitted! Your brand is Pending admin verification.');
        setNewBrand('');
        setNewBrandDesc('');
        setNewBrandWebsite('');
        setNewBrandLocation('');
        setNewBrandPhone('');
        setBrandDoc(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create brand');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleReplaceBrandDoc = async (brandId) => {
    const file = replacementDocs[brandId];
    if (!file) {
      toast.error('Choose a replacement document first.');
      return;
    }
    if (!isValidBrandDoc(file)) {
      toast.error('Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
      return;
    }
    const brand = brands.find((b) => b._id === brandId);
    try {
      const formData = new FormData();
      formData.append('name', brand?.name || '');
      formData.append('verificationDocument', file);
      const res = await api.put(`/brands/${brandId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Verification document resubmitted! Your brand is Pending admin verification.');
        setReplacementDocs((prev) => ({ ...prev, [brandId]: null }));
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to replace verification document');
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

  // Brands owned by the logged-in seller. Seller registration now creates
  // the brand application together with the account, so the standalone
  // "Create Brand" form is only needed for legacy sellers with no brand yet.
  const myBrands = brands.filter((b) => {
    if (user?.role === 'admin') return true;
    if (b.seller) {
      const sId = typeof b.seller === 'object' ? b.seller._id : b.seller;
      return sId === user?._id || sId === user?.id;
    }
    return true;
  });

  return (
    <div className="pb-16 text-left space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Brand Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-250 dark:border-gray-800 gap-6">
        {[
          { id: 'products', name: 'Products Catalog', icon: <FiGrid /> },
          { id: 'add-product', name: 'Add/Edit Product', icon: <FiPlus /> },
          { id: 'brands-categories', name: 'Brands & Categories', icon: <FiTag /> },
          { id: 'orders', name: 'Orders', icon: <FiShoppingBag /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== 'add-product') resetProductForm(); }}
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
                  <th className="pb-3">Image</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Brand</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 font-medium text-gray-700 dark:text-gray-300">
                {products.map((prod) => (
                  <tr key={prod._id}>
                    <td className="py-4 pr-4">
                      <img
                        src={resolveImageUrl(prod.images?.[0])}
                        alt={prod.name}
                        className="w-12 h-12 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
                      />
                    </td>
                    <td className="py-4 pr-4">{prod.name}</td>
                    <td className="py-4 pr-4">{prod.brand?.name || prod.brand}</td>
                    <td className="py-4 pr-4">{prod.category}</td>
                    <td className="py-4 pr-4">${prod.price.toFixed(2)}</td>
                    <td className="py-4 pr-4">{prod.stock}</td>
                    <td className="py-4 flex gap-3">
                      <button onClick={() => startEdit(prod)} className="text-blue-600 hover:text-blue-800"><FiEdit /></button>
                      <button onClick={() => deleteProduct(prod._id)} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
                    </td>
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
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">{editingId ? 'Edit Listing' : 'Create New Listing'}</h2>

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
                  <option key={c._id} value={c.name}>{c.name} {c.categoryType ? `(${c.categoryType})` : ''}</option>
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
                <option value="">Select Brand (Approved only)</option>
                {brands
                  .filter((b) => {
                    if (user?.role === 'admin') return true;
                    if (b.verificationStatus !== 'Approved') return false;
                    if (b.seller) {
                      const sId = typeof b.seller === 'object' ? b.seller._id : b.seller;
                      return sId === user?._id || sId === user?.id;
                    }
                    return true;
                  })
                  .map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
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
              <p className="text-xxs text-gray-400 mt-1">Comma-separated for multiple options (each becomes selectable).</p>
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
              <p className="text-xxs text-gray-400 mt-1">Comma-separated for multiple swatches.</p>
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

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Images (max {MAX_IMAGES}, 5MB each, jpg/png/webp/gif)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-grow px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm font-semibold rounded-xl"
              >
                Add URL
              </button>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold hover:file:bg-purple-100"
            />
            {(existingImages.length > 0 || filePreviews.length > 0) && (
              <div className="flex flex-wrap gap-3">
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                    <img src={resolveImageUrl(url)} alt={`existing-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {filePreviews.map((preview, i) => (
                  <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-300">
                    <img src={preview} alt={`new-${i}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xxs text-center">NEW</span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">{existingImages.length + prodFiles.length}/{MAX_IMAGES} images selected. Existing URLs are preserved on edit unless removed.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-2xl shadow-md"
            >
              {uploading ? 'Uploading...' : editingId ? 'Update Product' : 'Add Product Listing'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetProductForm}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* Brands & Categories Tab */}
      {activeTab === 'brands-categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Category + list with CategoryType */}
          <div className="space-y-8">
            {user?.role === 'admin' && (
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
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category Type</label>
                  <select
                    required
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Top Wear">Top Wear</option>
                    <option value="Bottom Wear">Bottom Wear</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <button type="submit" className="px-6 py-2.5 bg-purple-650 hover:bg-purple-750 text-white rounded-xl font-medium shadow-sm">
                  Save Category
                </button>
              </form>
            )}

            <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Categories by Type</h2>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">No categories yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-850">
                  {categories.map((cat) => (
                    <li key={cat._id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
                        {cat.description ? (
                          <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                        ) : null}
                      </div>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs border bg-purple-50 text-purple-700 border-purple-200">
                        {cat.categoryType || 'Unspecified'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* Create Brand — only for sellers with no brand yet (registration
                now submits the brand application together with the account) */}
            {myBrands.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Website (optional)</label>
                  <input
                    type="text"
                    value={newBrandWebsite}
                    onChange={(e) => setNewBrandWebsite(e.target.value)}
                    placeholder="https://urbanthreads.example.com"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Phone (optional)</label>
                  <input
                    type="text"
                    value={newBrandPhone}
                    onChange={(e) => setNewBrandPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location (optional)</label>
                <input
                  type="text"
                  value={newBrandLocation}
                  onChange={(e) => setNewBrandLocation(e.target.value)}
                  placeholder="Kochi, Kerala"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Brand Verification Document</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleBrandDocSelect}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Upload a document that helps verify your brand ownership or business legitimacy. Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 5 MB.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Examples: business registration certificate, trademark/brand registration document, business license, or other official proof of brand ownership.
                </p>
                {brandDoc && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Selected: {brandDoc.name}</p>
                )}
                <p className="text-xs text-amber-600 mt-1">
                  Submitting a document does not automatically verify your brand — an admin will manually review it.
                </p>
              </div>
              <button type="submit" disabled={savingBrand} className="px-6 py-2.5 bg-purple-650 hover:bg-purple-750 disabled:bg-purple-400 text-white rounded-xl font-medium shadow-sm">
                {savingBrand ? 'Submitting...' : 'Save Brand'}
              </button>
            </form>
            ) : (
              <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Brand Application</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Your brand was submitted with your brand application. Manage its verification status and
                  documents in the Registered Brands list below.
                </p>
              </div>
            )}

            {/* Brand Statuses */}
            <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Registered Brands</h2>
              {brands.length === 0 ? (
                <p className="text-sm text-gray-500">No brands registered yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-850">
                  {brands
                    .filter((b) => {
                      if (user?.role === 'admin') return true;
                      if (b.seller) {
                        const sId = typeof b.seller === 'object' ? b.seller._id : b.seller;
                        return sId === user?._id || sId === user?.id;
                      }
                      return true;
                    })
                    .map((b) => (
                      <li key={b._id} className="py-3 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{b.name}</p>
                          {b.description ? (
                            <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                          ) : null}
                          <p className="text-xs text-gray-500">
                            Verification document:{' '}
                            <span className="font-medium">{b.verificationDocumentName || (b.verificationDocument ? 'Submitted' : 'Not submitted')}</span>
                          </p>
                          {b.rejectionReason && b.verificationStatus === 'Rejected' && (
                            <p className="text-xs text-red-600">Admin feedback: {b.rejectionReason}</p>
                          )}
                          {(b.verificationStatus === 'Pending' || b.verificationStatus === 'Rejected') && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={(e) => {
                                  const f = (e.target.files || [])[0];
                                  if (!f) return;
                                  if (!isValidBrandDoc(f)) {
                                    toast.error('Invalid verification document. Please upload a PDF, JPG, JPEG, or PNG file up to 5 MB.');
                                    e.target.value = '';
                                    return;
                                  }
                                  setReplacementDocs((prev) => ({ ...prev, [b._id]: f }));
                                }}
                                className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 file:font-semibold file:text-xs"
                              />
                              {replacementDocs[b._id] && (
                                <button
                                  type="button"
                                  onClick={() => handleReplaceBrandDoc(b._id)}
                                  className="text-xs px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                                >
                                  Resubmit for verification
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          b.verificationStatus === 'Approved'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50'
                            : b.verificationStatus === 'Rejected'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50'
                        }`}>
                          {b.verificationStatus || 'Pending'}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-gray-950 dark:text-white uppercase tracking-wider">Active Orders</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-850 text-gray-400 font-semibold uppercase tracking-wider text-xxs">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Payment Status</th>
                  <th className="pb-3">Order Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-850 font-medium text-gray-700 dark:text-gray-300">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="py-4 font-mono">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="py-4">{order.user?.name || 'Unknown'}</td>
                    <td className="py-4">{order.items?.length || 0}</td>
                    <td className="py-4">${order.totalAmount?.toFixed(2)}</td>
                    <td className="py-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                        {order.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50'
                      }`}>
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </td>
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
