import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  id,
  type = 'text',
  className = '',
  inputClassName = '',
  ...rest
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`w-full px-4 py-2.5 bg-white dark:bg-[#1f2028] border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-400 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-800'
          } ${inputClassName}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
