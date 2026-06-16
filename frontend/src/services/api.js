import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const notifySessionExpired = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

const getUnauthorizedMessage = (error) => {
  return error?.response?.data?.error?.message || error?.response?.data?.message || '';
};

const isSessionRelatedUnauthorized = (error) => {
  const message = getUnauthorizedMessage(error).toLowerCase();

  return [
    'token expired',
    'invalid token',
    'token has been invalidated',
    'no token provided',
    'access token is required',
    'user not found',
    'account is blocked'
  ].some((part) => message.includes(part));
};


const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isSessionUnauthorized = isSessionRelatedUnauthorized(error);
    const requestUrl = originalRequest?.url || '';
    const isRefreshRequest = requestUrl.includes('/auth/refresh');
    const isAuthEntryRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify');




    if (
      isUnauthorized &&
      isSessionUnauthorized &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isAuthEntryRequest
    ) {
      const token = localStorage.getItem('token');

      if (token) {
        originalRequest._retry = true;

        try {


          const refreshResponse = await api.post('/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (refreshResponse.data.success) {
            const { token: newToken, user } = refreshResponse.data.data;

            localStorage.setItem('token', newToken);
            if (user) {
              localStorage.setItem('user', JSON.stringify(user));
            }

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          notifySessionExpired();
          return Promise.reject(refreshError);
        }
      }
    }

    if (isUnauthorized && isSessionUnauthorized && (isRefreshRequest || originalRequest?._retry)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      notifySessionExpired();
    }

    return Promise.reject(error);
  }
);

export { SESSION_EXPIRED_EVENT };
export default api;
