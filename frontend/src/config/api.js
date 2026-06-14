// API Configuration
// Development: пустая строка → запросы идут через Vite proxy (localhost:3000 -> localhost:3002)
// Production: пустая строка → запросы идут на тот же домен (Render всё сам раздаёт)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const API_ORIGIN = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  
  // Users
  PROFILE: '/api/users/profile',
  AVATAR: '/api/users/avatar',
  FAVORITES: '/api/users/favorites',
  
  // Products
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/products/categories',
  
  // Orders
  ORDERS: '/api/orders',
  
  // Articles
  ARTICLES: '/api/articles',
  
  // Admin
  ADMIN_USERS: '/api/admin/users',
  ADMIN_PRODUCTS: '/api/admin/products',
  ADMIN_ARTICLES: '/api/admin/articles'
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const buildAssetUrl = (assetPath) => {
  if (!assetPath) return assetPath;
  if (assetPath.startsWith('http')) return assetPath;
  return `${API_ORIGIN}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};
