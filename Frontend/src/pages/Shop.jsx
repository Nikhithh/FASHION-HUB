import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FiSearch, FiSliders, FiCheck, FiXCircle } from 'react-icons/fi';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search, Category, and Brand state synced with URL SearchParams
  const keywordParam = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || 'latest';

  const [keyword, setKeyword] = useState(keywordParam);
  const [category, setCategory] = useState(categoryParam);
  const [brand, setBrand] = useState(brandParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);

  useEffect(() => {
    // Load categories & brands for sidebar filter options
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        if (catRes.data && catRes.data.success) setCategories(catRes.data.data);
        if (brandRes.data && brandRes.data.success) setBrands(brandRes.data.data);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        let endpoint = '/products';
        const params = {};

        // Only add params if they have a value
        if (keywordParam) params.keyword = keywordParam;
        if (categoryParam) params.category = categoryParam;
        if (brandParam) params.brand = brandParam;
        if (minPriceParam) params.minPrice = minPriceParam;
        if (maxPriceParam) params.maxPrice = maxPriceParam;

        // If any filters are applied, use /filter
        // If only keyword is applied, use /search (or /filter, both work since we updated /filter to accept keyword)
        if (Object.keys(params).length > 0) {
          if (Object.keys(params).length === 1 && params.keyword) {
             endpoint = '/products/search';
          } else {
             endpoint = '/products/filter';
          }
        }

        const res = await api.get(endpoint, { params });
        if (res.data && res.data.success) {
          let items = res.data.data || [];

          // Sorting
          if (sortParam === 'price-low') {
            items.sort((a, b) => a.price - b.price);
          } else if (sortParam === 'price-high') {
            items.sort((a, b) => b.price - a.price);
          } else {
            // Latest (createdAt)
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }

          setProducts(items);
        }
      } catch (err) {
        console.error('Error fetching products', err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to fetch products. Please try again.');
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keywordParam, categoryParam, brandParam, minPriceParam, maxPriceParam, sortParam]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    updateParams({
      keyword,
      category,
      brand,
      minPrice,
      maxPrice,
      sort: sortParam
    });
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const updateParams = (newParams) => {
    const nextParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        nextParams.set(key, val);
      }
    });
    setSearchParams(nextParams);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      {/* Sidebar Filter Panel */}
      <aside className="w-full md:w-64 space-y-6 flex-shrink-0 text-left">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FiSliders className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">Filters</h2>
          </div>
          <button 
            onClick={handleClearFilters}
            className="text-xs text-red-500 hover:text-red-700 font-semibold"
          >
            Clear All
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleApplyFilters} className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
        </form>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200 uppercase tracking-wider">Categories</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setCategory('')}
              className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                !category ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 font-semibold' : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All Categories
              {!category && <FiCheck size={14} />}
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setCategory(cat.name)}
                className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  category === cat.name ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 font-semibold' : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {cat.name}
                {category === cat.name && <FiCheck size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200 uppercase tracking-wider">Brands</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setBrand('')}
              className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                !brand ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 font-semibold' : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All Brands
              {!brand && <FiCheck size={14} />}
            </button>
            {brands.map((b) => (
              <button
                key={b._id}
                onClick={() => setBrand(b.name)}
                className={`text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  brand === b.name ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 font-semibold' : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {b.name}
                {brand === b.name && <FiCheck size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200 uppercase tracking-wider">Price Range</h3>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* Apply Filters Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          Apply Filters
        </button>

      </aside>

      {/* Main Grid Content */}
      <main className="flex-grow space-y-6">
        {/* Top bar controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 text-left">
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{products.length}</span> products
          </p>
          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sort By:</label>
            <select
              id="sort"
              value={sortParam}
              onChange={(e) => updateParams({ sort: e.target.value, keyword, category, brand, minPrice, maxPrice })}
              className="px-3 py-1.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="latest">Latest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
            <FiXCircle className="mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-80 rounded-2xl"></div>
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="text-center py-24 bg-gray-50 dark:bg-[#1f2028] rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 space-y-3">
            <p className="text-gray-500 font-medium">No matches found for your filter criteria.</p>
            <button
              onClick={handleClearFilters}
              className="text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <Link
                key={prod._id}
                to={`/product/${prod._id}`}
                className="group flex flex-col bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left"
              >
                <div className="aspect-[4/5] overflow-hidden relative bg-gray-100">
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {prod.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xxs font-bold uppercase px-2 py-1 rounded">Out Of Stock</span>
                  )}
                </div>
                <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-xs tracking-wider uppercase">{prod.brand}</span>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {prod.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-900 dark:text-white font-extrabold text-base">${prod.price?.toFixed(2)}</span>
                    <span className="text-gray-400 text-xs">{prod.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
