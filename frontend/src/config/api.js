// API Configuration
// В production адрес backend берется из переменной окружения Netlify/Vite.
// Локально оставляем пустую строку, чтобы запросы шли через Vite proxy.
// Если VITE_API_BASE_URL не задана, используем Railway URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://h1mamkgithubio-production.up.railway.app';

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
