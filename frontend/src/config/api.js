

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


export const API_ENDPOINTS = {

  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  

  PROFILE: '/api/users/profile',
  AVATAR: '/api/users/avatar',
  FAVORITES: '/api/users/favorites',
  

  PRODUCTS: '/api/products',
  CATEGORIES: '/api/products/categories',
  

  ORDERS: '/api/orders',
  

  ARTICLES: '/api/articles',
  

  ADMIN_USERS: '/api/admin/users',
  ADMIN_PRODUCTS: '/api/admin/products',
  ADMIN_ARTICLES: '/api/admin/articles'
};


export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
export const buildAssetUrl = (assetPath) => {
  if (!assetPath) return assetPath;

  if (assetPath.startsWith('data:image/')) {
    return assetPath;
  }

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




  return `${API_ORIGIN}${normalizedAssetPath}`;
};
