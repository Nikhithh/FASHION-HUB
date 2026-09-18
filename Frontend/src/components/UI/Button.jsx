import React from 'react';

const variantClasses = {
  primary:
    'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-purple-500/20 disabled:bg-purple-300',
  secondary:
    'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-60',
  outline:
    'border border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 disabled:opacity-60',
  danger:
    'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300',
  ghost:
    'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60',
  white:
    'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 disabled:opacity-60',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-2xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
        variantClasses[variant] || variantClasses.primary
      } ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" aria-hidden="true" />
      )}
      {children}
    </button>
  );
};

export default Button;
