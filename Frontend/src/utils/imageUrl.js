import api from '../services/api';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600';

// Backend serves ./uploads statically; stored values look like /uploads/products/xxx.jpg
// Convert them to absolute URLs so <img> works from the Vite dev server / build.
export const resolveImageUrl = (src) => {
  if (!src || typeof src !== 'string' || src.trim() === '') return FALLBACK_IMAGE;
  const s = src.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;
  if (s.startsWith('/uploads/')) {
    const base = (api?.defaults?.baseURL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${base}${s}`;
  }
  return s;
};
