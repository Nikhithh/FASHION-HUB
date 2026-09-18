import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thanks for subscribing to FashionHub updates!');
    setEmail('');
  };
  return (
    <footer className="bg-gray-550 dark:bg-[#101115] border-t border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="flex flex-col space-y-4">
            <span className="text-xl font-bold tracking-wider text-purple-600 dark:text-purple-400">
              FashionHub
            </span>
            <p className="text-sm">
              Discover curated designs, premium apparel, accessories, and shoes from leading fashion brands around the globe.
            </p>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-purple-600 transition-colors">All Collections</Link></li>
              <li><Link to="/shop?category=Apparel" className="hover:text-purple-600 transition-colors">Apparel</Link></li>
              <li><Link to="/shop?category=Footwear" className="hover:text-purple-600 transition-colors">Footwear</Link></li>
              <li><Link to="/shop?category=Accessories" className="hover:text-purple-600 transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase">Newsletter</h3>
            <p className="mt-4 text-sm">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="mt-4 flex max-w-md" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full min-w-0 px-4 py-2 text-base text-gray-900 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-l-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-r-xl font-medium transition-all shadow-md"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>&copy; {new Date().getFullYear()} FashionHub Multi-Brand Marketplace. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Cookies Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
