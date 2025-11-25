import axios from 'axios';

/**
 * Axios Instance
 * Настроенный HTTP client для API запросов
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Добавляет JWT токен к каждому запросу
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Обработка ошибок
 */
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Обработка ошибок
    if (error.response) {
      // Сервер вернул ошибку
      const { status, data } = error.response;

      // 401 Unauthorized - очищаем токен и редиректим на главную страницу
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }

      // Возвращаем структурированную ошибку
      return Promise.reject({
        status,
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || 'An error occurred',
        details: data.error?.details,
      });
    } else if (error.request) {
      // Запрос отправлен, но ответа нет
      return Promise.reject({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Ошибка при настройке запроса
      return Promise.reject({
        status: 0,
        code: 'REQUEST_ERROR',
        message: error.message,
      });
    }
  }
);

export default api;


