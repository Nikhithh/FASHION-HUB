// Single source of truth for role-based landing pages after login.
// Used by all three login entry points (/login, /brand-login, /admin-login).
export const landingFor = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/seller';
  return '/';
};

export const loginPageFor = (role) => {
  if (role === 'admin') return '/admin-login';
  if (role === 'seller') return '/brand-login';
  return '/login';
};
