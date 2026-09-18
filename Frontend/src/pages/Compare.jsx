import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useComparison } from '../context/ComparisonContext';
import { 
  FiChevronLeft, 
  FiTrash2, 
  FiStar, 
  FiCheck, 
  FiX, 
  FiLayers, 
  FiShoppingBag,
  FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { resolveImageUrl } from '../utils/imageUrl';

const Compare = () => {
  const { selected, removeProduct, clearComparison } = useComparison();
  const navigate = useNavigate();

  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComparison = async () => {
    if (selected.length < 2) {
      setCompareData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const ids = selected.map((p) => p._id).join(',');
      const res = await api.get(`/products/compare?ids=${ids}`);
      if (res.data && res.data.success) {
        setCompareData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching comparison details:', err);
      setError(err.response?.data?.message || 'Failed to fetch comparison details');
      toast.error('Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selected]);

  const handleRemove = (id) => {
    removeProduct(id);
    toast.info('Product removed from comparison');
  };

  // Edge case: Fewer than 2 products selected
  if (selected.length < 2) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <FiLayers size={36} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Compare Products
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm md:text-base">
          {selected.length === 1
            ? 'You have 1 item selected. Please add at least one more product from the shop to compare.'
            : 'You have no products selected for comparison. Choose up to 4 items from the shop.'}
        </p>

        {selected.length === 1 && (
          <div className="flex justify-center items-center gap-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1f2028] border border-purple-200 dark:border-purple-900/50 rounded-2xl shadow-sm">
              <img
                src={resolveImageUrl(selected[0].images?.[0])}
                alt={selected[0].name}
                className="w-12 h-12 object-cover rounded-xl"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{selected[0].name}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">${selected[0].price?.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleRemove(selected[0]._id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            <FiShoppingBag size={18} />
            Browse Shop to Add Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 font-semibold mb-2 transition-colors"
          >
            <FiChevronLeft size={16} />
            Back to Shop
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Product Comparison
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Comparing {compareData.length || selected.length} products side by side
          </p>
        </div>

        <button
          onClick={clearComparison}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <FiTrash2 size={14} />
          Clear Comparison
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-100 dark:bg-[#1f2028] rounded-3xl"></div>
          <div className="h-96 bg-gray-100 dark:bg-[#1f2028] rounded-3xl"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <table className="w-full border-collapse bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
            <tbody>
              {/* Product Header / Image Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 w-40 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Product
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-6 text-center min-w-[220px] max-w-[280px]">
                    <div className="relative group flex flex-col items-center">
                      <button
                        onClick={() => handleRemove(item._id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-[#16171d]/90 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl shadow-sm transition-all"
                        title="Remove product"
                      >
                        <FiTrash2 size={16} />
                      </button>

                      <div className="w-40 h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm">
                        <img
                          src={resolveImageUrl(item.images?.[0])}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {item.name}
                      </h3>

                      <Link
                        to={`/product/${item._id}`}
                        className="px-4 py-1.5 text-xs font-semibold text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-200 dark:border-purple-900 rounded-xl transition-all"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Price
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center font-black text-lg text-purple-600 dark:text-purple-400">
                    ${item.price?.toFixed(2)}
                  </td>
                ))}
              </tr>

              {/* Brand Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Brand
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {item.brand || '—'}
                  </td>
                ))}
              </tr>

              {/* Category Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Category
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {item.category || '—'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Rating Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Rating
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400">
                      <FiStar size={16} fill="currentColor" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {item.rating !== undefined && item.rating !== null ? Number(item.rating).toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Size Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Size
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center text-sm capitalize text-gray-800 dark:text-gray-200">
                    {item.size || 'Standard'}
                  </td>
                ))}
              </tr>

              {/* Color Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Color
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center text-sm capitalize text-gray-800 dark:text-gray-200">
                    {item.color || '—'}
                  </td>
                ))}
              </tr>

              {/* Stock Status Row */}
              <tr className="border-b border-gray-150 dark:border-gray-800">
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Stock
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-center">
                    {item.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/40">
                        <FiCheck size={12} />
                        In Stock ({item.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/40">
                        <FiX size={12} />
                        Out of Stock
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Description Row */}
              <tr>
                <td className="p-4 font-bold text-xs uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-[#16171d]/50">
                  Description
                </td>
                {compareData.map((item) => (
                  <td key={item._id} className="p-4 text-left text-xs text-gray-600 dark:text-gray-400 leading-relaxed align-top">
                    {item.description || 'No description provided.'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Compare;
