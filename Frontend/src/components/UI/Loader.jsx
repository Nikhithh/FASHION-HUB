import React from 'react';

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const Loader = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-purple-600 ${sizeClasses[size] || sizeClasses.md}`}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">{spinner}</div>
    );
  }

  return spinner;
};

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl ${className}`} />
);

export const ProductGridSkeleton = ({ count = 6, gridClassName = 'grid grid-cols-2 lg:grid-cols-3 gap-6' }) => (
  <div className={gridClassName}>
    {Array.from({ length: count }).map((_, n) => (
      <Skeleton key={n} className="h-80" />
    ))}
  </div>
);

export default Loader;
