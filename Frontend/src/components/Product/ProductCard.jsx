import React from 'react';
import { Link } from 'react-router-dom';
import { FiLayers, FiTrash2 } from 'react-icons/fi';
import { resolveImageUrl } from '../../utils/imageUrl';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600';

/**
 * Reusable product card used by Shop, Home and Wishlist.
 *
 * @param {object} props.product - product document
 * @param {boolean} props.isCompared - whether product is in comparison tray
 * @param {function} props.onToggleCompare - if provided, renders the compare toggle (Shop)
 * @param {function} props.onRemove - if provided, renders the remove/trash button (Wishlist)
 * @param {React.ReactNode} props.action - optional footer action (e.g. Add to Bag button)
 */
const ProductCard = ({ product, isCompared = false, onToggleCompare, onRemove, action }) => {
  if (!product) return null;

  const outOfStock = !product.stock || product.stock === 0;
  const imageSrc = resolveImageUrl(product.images?.[0]) || FALLBACK_IMAGE;

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove(product);
    } else if (onToggleCompare) {
      onToggleCompare(product);
    }
  };

  const showIconButton = Boolean(onRemove || onToggleCompare);

  return (
    <div className="group relative flex flex-col bg-white dark:bg-[#1f2028] border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left">
      <div className="aspect-[4/5] overflow-hidden relative bg-gray-100">
        <Link to={`/product/${product._id}`}>
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {outOfStock && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xxs font-bold uppercase px-2 py-1 rounded">
            Out Of Stock
          </span>
        )}

        {showIconButton && (
          <button
            type="button"
            onClick={handleIconClick}
            title={onRemove ? 'Remove from wishlist' : isCompared ? 'Remove from Compare' : 'Add to Compare'}
            className={
              onRemove
                ? 'absolute top-2 right-2 p-2 rounded-xl bg-white/80 dark:bg-[#16171d]/80 text-red-500 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-md shadow-sm flex items-center justify-center'
                : `absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm flex items-center justify-center ${
                    isCompared
                      ? 'bg-purple-600 text-white shadow-purple-500/40 ring-2 ring-white/50'
                      : 'bg-white/80 dark:bg-[#16171d]/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                  }`
            }
          >
            {onRemove ? <FiTrash2 size={16} /> : <FiLayers size={16} />}
          </button>
        )}
      </div>

      <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <span className="text-purple-600 dark:text-purple-400 font-medium text-xs tracking-wider uppercase">
            {product.brand}
          </span>
          <Link to={`/product/${product._id}`}>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {action ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-900 dark:text-white font-extrabold text-base">
                ${product.price?.toFixed(2)}
              </span>
              <span className="text-gray-400 text-xs">{product.category}</span>
            </div>
            {action}
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-900 dark:text-white font-extrabold text-base">
              ${product.price?.toFixed(2)}
            </span>
            <span className="text-gray-400 text-xs">{product.category}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
