import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProductCard from '../components/Product/ProductCard';
import Button from '../components/UI/Button';
import { ProductGridSkeleton } from '../components/UI/Loader';

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState(null);

  const handleRemove = async (productId, name) => {
    const res = await removeFromWishlist(productId);
    if (res.success) {
      toast.success(`Removed ${name} from wishlist`);
    } else {
      toast.error(res.error || 'Failed to remove item');
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.info('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }
    if (!product.stock || product.stock === 0) {
      toast.warning('This product is out of stock');
      return;
    }
    setAddingId(product._id);
    // Preselect first available variant option (backend stores size/color as strings)
    const firstSize = typeof product.size === 'string' ? product.size.split(',')[0]?.trim() : product.size;
    const firstColor = typeof product.color === 'string' ? product.color.split(',')[0]?.trim() : product.color;
    const res = await addToCart(product._id, 1, product.price, firstSize || undefined, firstColor || undefined);
    setAddingId(null);
    if (res.success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error(res.error || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="pb-24">
        <ProductGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6 text-left">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
        <FiHeart className="text-purple-600 dark:text-purple-400" />
        My Wishlist
        <span className="text-base font-semibold text-gray-400">({wishlist.length})</span>
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 dark:bg-[#1f2028] rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 space-y-3">
          <FiHeart size={40} className="mx-auto text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 font-medium">Your wishlist is empty.</p>
          <Link to="/shop" className="inline-block text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Discover products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((prod) => {
            const outOfStock = !prod.stock || prod.stock === 0;
            const isAdding = addingId === prod._id;
            return (
              <ProductCard
                key={prod._id}
                product={prod}
                onRemove={(p) => handleRemove(p._id, p.name)}
                action={
                  <Button
                    fullWidth
                    onClick={() => handleAddToCart(prod)}
                    disabled={outOfStock || isAdding}
                    loading={isAdding}
                  >
                    <FiShoppingBag size={16} />
                    {outOfStock ? 'Out Of Stock' : isAdding ? 'Adding...' : 'Add to Bag'}
                  </Button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
