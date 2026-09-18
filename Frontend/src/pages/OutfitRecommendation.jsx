import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import usePageMeta from '../hooks/usePageMeta';
import Button from '../components/UI/Button';
import { ProductGridSkeleton } from '../components/UI/Loader';
import { FiShoppingBag, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Must stay in sync with Backend/services/recommendationService.js
const OCCASIONS = ['Casual', 'Formal', 'Party', 'Wedding', 'Sports'];
const STYLES = ['Casual', 'Formal', 'Traditional', 'Streetwear', 'Sporty'];
const COLORS = ['Black', 'White', 'Blue', 'Brown', 'Grey', 'Red', 'Tan'];

const selectClass =
  'w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500';

const OutfitRecommendation = () => {
  usePageMeta({
    title: 'Outfit Stylist | FashionHub',
    description: 'Get a rule-based complete outfit recommendation from real FashionHub products.',
  });

  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [occasion, setOccasion] = useState('Casual');
  const [style, setStyle] = useState('Casual');
  const [color, setColor] = useState('Black');
  const [maxBudget, setMaxBudget] = useState('500');
  const [loading, setLoading] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/recommendations/outfit', {
        occasion,
        style,
        color,
        maxBudget: Number(maxBudget),
      });
      if (res.data && res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error('Failed to generate outfit', err);
      toast.error(err.response?.data?.message || 'Failed to generate outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntireOutfit = async () => {
    if (!result || result.items.length === 0) return;
    if (!user) {
      toast.info('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }
    setAddingAll(true);
    let added = 0;
    let failed = 0;
    for (const item of result.items) {
      const p = item.product;
      // Reuse the existing cart API — one call per recommended product.
      // Products may list multiple options ("S, M, L"); send the first single value.
      const firstSize = typeof p.size === 'string' ? p.size.split(',')[0]?.trim() : p.size;
      const firstColor = typeof p.color === 'string' ? p.color.split(',')[0]?.trim() : p.color;
      const res = await addToCart(p._id, 1, p.price, firstSize || undefined, firstColor || undefined);
      if (res.success) added += 1;
      else failed += 1;
    }
    setAddingAll(false);
    if (added > 0) toast.success(`Added ${added} item${added > 1 ? 's' : ''} to cart!`);
    if (failed > 0) toast.warning(`${failed} item${failed > 1 ? 's' : ''} could not be added (may be out of stock).`);
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="text-left space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Smart Outfit Stylist</h1>
        <p className="text-sm text-gray-500">
          Pick an occasion, style, color and budget — we match real in-stock products into one complete outfit.
        </p>
      </div>

      {/* Preferences form */}
      <form
        onSubmit={handleGenerate}
        className="bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-left"
      >
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Occasion</label>
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={selectClass}>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClass}>
            {STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Preferred Color</label>
          <select value={color} onChange={(e) => setColor(e.target.value)} className={selectClass}>
            {COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Max Budget ($)</label>
          <input
            type="number"
            min="1"
            step="any"
            required
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="500"
            className={selectClass}
          />
        </div>
        <Button type="submit" loading={loading} fullWidth>
          Generate Outfit
        </Button>
      </form>

      {/* Loading */}
      {loading && <ProductGridSkeleton count={4} gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />}

      {/* Result */}
      {!loading && result && (
        <section className="space-y-6">
          <div
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              result.withinBudget
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
            }`}
          >
            {result.withinBudget ? <FiCheck size={18} className="mt-0.5 flex-shrink-0" /> : <FiAlertCircle size={18} className="mt-0.5 flex-shrink-0" />}
            <p>{result.message}</p>
          </div>

          {result.items.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No products available for these preferences right now.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {result.items.map((item) => (
                  <div
                    key={item.product._id + item.slot}
                    className="group flex flex-col bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                  >
                    <div className="px-4 pt-3">
                      <span className="inline-block text-xxs font-bold uppercase tracking-wider px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
                        {item.slot}
                      </span>
                    </div>
                    <div className="aspect-[4/5] overflow-hidden relative bg-gray-100 m-4 mb-0 rounded-xl">
                      <Link to={`/product/${item.product._id}`}>
                        <img
                          src={resolveImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>
                    </div>
                    <div className="p-4 space-y-2 flex-grow flex flex-col">
                      <div>
                        <span className="text-purple-600 dark:text-purple-400 font-medium text-xs tracking-wider uppercase">
                          {item.product.brand}
                        </span>
                        <Link to={`/product/${item.product._id}`}>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1 line-clamp-1 hover:text-purple-600 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-900 dark:text-white font-extrabold text-base mt-1">
                          ${item.product.price?.toFixed(2)}
                        </p>
                      </div>
                      <ul className="space-y-1 pt-1">
                        {item.reasons.filter((r) => r !== 'Fits the outfit slot').slice(0, 3).map((reason) => (
                          <li key={reason} className="flex items-start gap-1.5 text-xs text-gray-500">
                            <FiCheck size={12} className="mt-0.5 text-green-500 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 pt-2 mt-auto">
                        <Link
                          to={`/product/${item.product._id}`}
                          className="flex-1 text-center px-3 py-2 text-xs font-semibold border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-2xl p-5">
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Total Outfit Price:{' '}
                  <span className="font-extrabold text-gray-900 dark:text-white text-lg">
                    ${result.totalPrice?.toFixed(2)}
                  </span>{' '}
                  <span className="text-xs text-gray-400">(budget ${Number(maxBudget).toFixed(2)})</span>
                </p>
                <Button onClick={handleAddEntireOutfit} loading={addingAll} disabled={result.items.length === 0}>
                  <FiShoppingBag size={16} />
                  Add Entire Outfit to Cart
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default OutfitRecommendation;
