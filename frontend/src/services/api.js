import axios from 'axios';

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

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api',
  timeout: 30000, // 30 секунд для медленных запросов к MongoDB
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления токена авторизации
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

// Интерсептор для обработки ответов
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

    // Если access token истек, пробуем получить новый и повторить исходный запрос.
    // Это исправляет ситуацию, когда админ-панель открывается по кешированному пользователю,
    // но запросы к защищенным эндпоинтам, включая отзывы, падают с 401.
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
          // Важно: не отправляем JSON literal `null`, т.к. strict JSON parser на бэкенде
          // может отклонять такой body. Отправляем пустой объект.
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
