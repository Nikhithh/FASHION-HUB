// Helpers for the existing Product.size / Product.color string fields.
// Sellers enter single values ("M") or comma-separated options ("S, M, L, XL").

// "S, M, L" -> ["S", "M", "L"]; "M" -> ["M"]; "" -> []
export const parseOptions = (value) => {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
};

const COLOR_HEX = {
  black: '#111111',
  white: '#ffffff',
  red: '#dc2626',
  blue: '#2563eb',
  navy: '#1e3a8a',
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#ea580c',
  pink: '#ec4899',
  purple: '#9333ea',
  violet: '#8b5cf6',
  brown: '#92400e',
  beige: '#e8dcc4',
  grey: '#6b7280',
  gray: '#6b7280',
  maroon: '#7f1d1d',
  olive: '#65a30d',
  teal: '#0d9488',
  cyan: '#06b6d4',
  gold: '#ca8a04',
  silver: '#9ca3af',
  cream: '#fef3c7',
  khaki: '#a3a380',
  denim: '#3b62a6',
};

// Best-effort swatch color for a free-text color name; falls back to neutral gray.
export const colorHex = (name) => {
  if (!name) return '#9ca3af';
  const key = name.trim().toLowerCase();
  return COLOR_HEX[key] || '#9ca3af';
};

// "Size: M · Color: Red" or subset; empty string when no variant stored.
export const formatVariant = (item) => {
  const parts = [];
  if (item?.size) parts.push(`Size: ${item.size}`);
  if (item?.color) parts.push(`Color: ${item.color}`);
  return parts.join(' · ');
};
