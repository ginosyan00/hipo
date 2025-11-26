import axios from 'axios';

/**
 * Get API Base URL
 * Автоматически определяет API URL на основе текущего host
 * - Если frontend на localhost → API на localhost:5000
 * - Если frontend на IP (192.168.x.x) → API на том же IP:5000
 */
function getApiBaseURL(): string {
  // Если указан в env, используем его
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Определяем текущий host
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Если это localhost или 127.0.0.1
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000/api/v1';
  }
  
  // Если это IP адрес (192.168.x.x, 10.x.x.x, etc.)
  // Используем тот же IP для API
  // Всегда используем http:// для API (backend работает на HTTP)
  return `http://${host}:5000/api/v1`;
}

// Получаем API base URL
const apiBaseURL = getApiBaseURL();

// Логируем для отладки (только в development)
if (import.meta.env.DEV) {
  console.log('🔗 [API] Base URL:', apiBaseURL);
}

/**
 * Axios Instance
 * Настроенный HTTP client для API запросов
 */
const api = axios.create({
  baseURL: apiBaseURL,
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
    // Логируем запросы в development
    if (import.meta.env.DEV) {
      console.log('📤 [API] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
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
      console.error('❌ [API] Network Error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        message: error.message,
      });
      return Promise.reject({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        details: {
          url: error.config?.baseURL + error.config?.url,
          host: window.location.hostname,
        },
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


