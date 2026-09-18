import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiXCircle,
  FiColumns,
  FiX
} from 'react-icons/fi';
import { useComparison } from '../context/ComparisonContext';
import { toast } from 'react-toastify';
import usePageMeta from '../hooks/usePageMeta';
import FilterSidebar from '../components/Product/FilterSidebar';
import ProductCard from '../components/Product/ProductCard';
import { ProductGridSkeleton } from '../components/UI/Loader';

const Shop = () => {
  usePageMeta({
    title: 'Shop | FashionHub',
    description: 'Browse and filter clothing, footwear and accessories from verified brands on FashionHub.',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comparison context
  const { selected, addProduct, removeProduct, clearComparison } = useComparison();

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

  // Keep filters in sync when navigating (e.g. Navbar search, Footer/Home category links
  // while already on /shop).
  useEffect(() => {
    setKeyword(keywordParam);
    setCategory(categoryParam);
    setBrand(brandParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [keywordParam, categoryParam, brandParam, minPriceParam, maxPriceParam]);

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
        // If only keyword is applied, use /search
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

  // Clear only the search keyword, preserving category/brand/price/sort filters.
  const handleClearSearch = () => {
    setKeyword('');
    updateParams({
      keyword: '',
      category,
      brand,
      minPrice,
      maxPrice,
      sort: sortParam,
    });
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

  const isCompared = (productId) => {
    return selected.some((p) => p._id === productId);
  };

  const handleToggleCompare = (product) => {
    if (isCompared(product._id)) {
      removeProduct(product._id);
      toast.info(`Removed ${product.name} from comparison`);
    } else {
      const res = addProduct(product);
      if (!res.success) {
        toast.warning(res.message);
      } else {
        toast.success(`Added ${product.name} to compare`);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-24 relative">
      <FilterSidebar
        categories={categories}
        brands={brands}
        keyword={keyword}
        onKeywordChange={setKeyword}
        category={category}
        onCategoryChange={setCategory}
        brand={brand}
        onBrandChange={setBrand}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

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

        {/* Active search indicator with clear-search */}
        {keywordParam && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 rounded-full font-medium">
              Results for &ldquo;{keywordParam}&rdquo;
              <button
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="hover:text-purple-900 dark:hover:text-purple-100 font-bold"
              >
                <FiX size={14} />
              </button>
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
            <FiXCircle className="mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <ProductGridSkeleton count={6} />
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
              <ProductCard
                key={prod._id}
                product={prod}
                isCompared={isCompared(prod._id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Comparison Bar at Bottom */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-white/95 dark:bg-[#1f2028]/95 backdrop-blur-lg border border-purple-200 dark:border-purple-900/50 shadow-2xl rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1">
              {selected.map((item) => (
                <div key={item._id} className="relative group/thumb flex-shrink-0">
                  <img
                    src={resolveImageUrl(item.images?.[0])}
                    alt={item.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-purple-200 dark:border-purple-900"
                  />
                  <button
                    onClick={() => removeProduct(item._id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap hidden sm:inline">
                {selected.length}/4 selected
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clearComparison}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear
              </button>
              <Link
                to="/compare"
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                <FiColumns size={14} />
                Compare Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
