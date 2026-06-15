// API Configuration
// Development: пустая строка → запросы идут через Vite proxy (localhost:3000 -> localhost:3002)
// Production: пустая строка → запросы идут на тот же домен (Render всё сам раздаёт)
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getSafeApiBaseUrl = () => {
  if (!RAW_API_BASE_URL) {
    return '';
  }

  if (typeof window === 'undefined') {
    return RAW_API_BASE_URL;
  }

  try {
    const configuredUrl = new URL(RAW_API_BASE_URL, window.location.origin);
    const currentHost = window.location.hostname;
    const configuredHost = configuredUrl.hostname;
    const isCurrentHostLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const isConfiguredHostLocal = configuredHost === 'localhost' || configuredHost === '127.0.0.1';

    // Если на проде по ошибке проброшен localhost, игнорируем его и работаем через текущий origin.
    if (!isCurrentHostLocal && isConfiguredHostLocal) {
      return '';
    }

    return configuredUrl.origin;
  } catch {
    return RAW_API_BASE_URL;
  }
};

export const API_BASE_URL = getSafeApiBaseUrl();
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

  const normalizeLegacyFlatUploadPath = (pathValue) => {
    const normalizedPath = pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
    const legacyFlatUploadMatch = normalizedPath.match(/^\/uploads\/([^/]+)$/);

    if (legacyFlatUploadMatch) {
      return `/${legacyFlatUploadMatch[1]}`;
    }

    return normalizedPath;
  };

  if (assetPath.startsWith('http')) {
    try {
      const assetUrl = new URL(assetPath);
      const normalizedPath = normalizeLegacyFlatUploadPath(assetUrl.pathname);

      if (normalizedPath !== assetUrl.pathname) {
        return `${assetUrl.origin}${normalizedPath}${assetUrl.search}${assetUrl.hash}`;
      }

      return assetPath;
    } catch {
      return assetPath;
    }
  }

  const normalizedAssetPath = normalizeLegacyFlatUploadPath(assetPath);

  // Старые товары из JSON используют плоские пути вида /uploads/<file>.
  // Реальные файлы для них лежат в public-корне как /<file>, поэтому сразу
  // нормализуем такой формат на фронте и не зависим от серверного редиректа.
  return `${API_ORIGIN}${normalizedAssetPath}`;
};
