import React from 'react';
import { FiSearch, FiSliders, FiCheck } from 'react-icons/fi';
import Button from '../UI/Button';
import Input from '../UI/Input';

const CATEGORY_TYPES = ['Top Wear', 'Bottom Wear', 'Footwear', 'Outerwear', 'Accessories'];

/**
 * Reusable filtering sidebar extracted from Shop.jsx.
 * Fully controlled via props so Shop owns URL-synced filter state.
 */
const FilterSidebar = ({
  categories = [],
  brands = [],
  keyword = '',
  onKeywordChange,
  category = '',
  onCategoryChange,
  brand = '',
  onBrandChange,
  minPrice = '',
  onMinPriceChange,
  maxPrice = '',
  onMaxPriceChange,
  onApply,
  onClear,
}) => {
  const optionClass = (active) =>
    `w-full text-sm text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
      active
        ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 font-semibold'
        : 'text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <aside className="w-full md:w-64 space-y-6 flex-shrink-0 text-left">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FiSliders className="text-purple-600 dark:text-purple-400" />
          <h2 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">Filters</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 font-semibold"
        >
          Clear All
        </button>
      </div>

      {/* Search */}
      <form onSubmit={onApply}>
        <Input
          type="text"
          placeholder="Search products..."
          value={keyword}
          onChange={(e) => onKeywordChange && onKeywordChange(e.target.value)}
          icon={FiSearch}
        />
      </form>

      {/* Categories grouped by CategoryType */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200 uppercase tracking-wider">
          Categories
        </h3>
        <div className="flex flex-col space-y-2">
          <button type="button" onClick={() => onCategoryChange && onCategoryChange('')} className={optionClass(!category)}>
            All Categories
            {!category && <FiCheck size={14} />}
          </button>
          {CATEGORY_TYPES.map((type) => {
            const typedCats = categories.filter((cat) => cat.categoryType === type);
            if (typedCats.length === 0) return null;
            return (
              <div key={type} className="space-y-1">
                <p className="text-xxs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2">{type}</p>
                {typedCats.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => onCategoryChange && onCategoryChange(cat.name)}
                    className={optionClass(category === cat.name)}
                  >
                    {cat.name}
                    {category === cat.name && <FiCheck size={14} />}
                  </button>
                ))}
              </div>
            );
          })}
          {categories
            .filter((cat) => !cat.categoryType)
            .map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => onCategoryChange && onCategoryChange(cat.name)}
                className={optionClass(category === cat.name)}
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
          <button type="button" onClick={() => onBrandChange && onBrandChange('')} className={optionClass(!brand)}>
            All Brands
            {!brand && <FiCheck size={14} />}
          </button>
          {brands.map((b) => (
            <button
              key={b._id}
              type="button"
              onClick={() => onBrandChange && onBrandChange(b.name)}
              className={optionClass(brand === b.name)}
            >
              {b.name}
              {brand === b.name && <FiCheck size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-200 uppercase tracking-wider">
          Price Range
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange && onMinPriceChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange && onMaxPriceChange(e.target.value)}
            className="w-1/2 px-3 py-2 bg-white dark:bg-[#1f2028] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Apply Filters Button */}
      <Button fullWidth onClick={onApply}>
        Apply Filters
      </Button>
    </aside>
  );
};

export default FilterSidebar;
