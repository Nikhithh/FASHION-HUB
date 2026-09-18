import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiTrendingUp, FiShoppingBag, FiTruck, FiShield, FiRotateCcw } from 'react-icons/fi';

import usePageMeta from '../hooks/usePageMeta';
import ProductCard from '../components/Product/ProductCard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import { ProductGridSkeleton } from '../components/UI/Loader';
import { toast } from 'react-toastify';

const Home = () => {
  usePageMeta({
    title: 'FashionHub — Multi-Brand Fashion Marketplace',
    description: 'FashionHub — multi-brand fashion marketplace. Shop clothing, footwear and accessories from verified brands.',
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get('/products');
        if (res.data && res.data.success) {
          setProducts(res.data.data.slice(0, 4) || []);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Premium Hero section */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white min-h-[500px] flex items-center shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
            alt="Luxury Fashion Landing Banner"
            className="w-full h-full object-cover object-center opacity-45 transform hover:scale-105 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#16171d] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl px-6 py-12 md:py-24 md:pl-16 space-y-6 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <FiTrendingUp size={12} />
            Summer Collection 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Elevate Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
              Personal Style
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-md font-light leading-relaxed">
            Discover the latest trends in apparel, shoes, and luxury accessories curated from leading designer brands.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link to="/shop">
              <Button size="lg">Explore Shop</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Badges */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[
          { icon: <FiTruck size={24} />, title: 'Free Shipping', desc: 'On orders over $99' },
          { icon: <FiShield size={24} />, title: 'Secure Checkouts', desc: '100% encrypted checkout' },
          { icon: <FiRotateCcw size={24} />, title: 'Easy Returns', desc: '30-day change of mind policy' },
          { icon: <FiShoppingBag size={24} />, title: 'Curated Brands', desc: 'Only 100% original pieces' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-5 rounded-2xl bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 shadow-sm">
            <div className="text-purple-600 dark:text-purple-400 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20">{item.icon}</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories Showcase */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-4">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <p className="text-sm text-gray-500 mt-1">Explore curated products across our prime categories</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
          {[
            { name: 'Apparel', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', link: '/shop?category=Apparel' },
            { name: 'Footwear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', link: '/shop?category=Footwear' },
            { name: 'Accessories', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', link: '/shop?category=Accessories' },
          ].map((cat, idx) => (
            <Link key={idx} to={cat.link} className="relative group overflow-hidden rounded-2xl aspect-[4/3] shadow-md hover:shadow-xl transition-all duration-300">
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transform group-hover:scale-110 duration-500 group-hover:brightness-75 transition-all"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-left">
                <span className="text-xl font-bold text-white tracking-wide">{cat.name}</span>
                <span className="text-xs text-purple-300 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Explore &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-4">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
            <p className="text-sm text-gray-500 mt-1">Our customer-favorites and best sellers</p>
          </div>
          <Link to="/shop" className="text-purple-600 dark:text-purple-400 font-semibold text-sm hover:underline">View All</Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} gridClassName="grid grid-cols-2 md:grid-cols-4 gap-6 px-4" />
        ) : products.length === 0 ? (
          <p className="text-gray-500 py-8">No products found. Please seed the database.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            {products.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Luxury Promo section */}
      <section className="bg-purple-650 dark:bg-purple-950/20 text-white rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 mx-4">
        <div className="text-left space-y-4 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Join the Fashion Club</h2>
          <p className="text-purple-200 text-sm md:text-base leading-relaxed">
            Get an instant 20% discount on your first order. Plus, enjoy premium access to new collections, exclusive drops, and free styling recommendations.
          </p>
        </div>
        <form
          className="flex-shrink-0 flex gap-2 w-full md:w-auto items-start"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            toast.success('Welcome to the Fashion Club! Check your inbox for 20% off.');
            setEmail('');
          }}
        >
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full md:w-64"
            inputClassName="border-none text-gray-900"
          />
          <Button type="submit">
            Subscribe
          </Button>
        </form>
      </section>
    </div>
  );
};

export default Home;
