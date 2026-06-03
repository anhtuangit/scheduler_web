import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/auth/')) {
      console.log('🔄 API Request:', config.method?.toUpperCase(), config.url);
      console.log('🔄 With credentials:', config.withCredentials);
      console.log('🔄 Cookies available:', document.cookie ? 'Yes' : 'No');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/me');
      if (window.location.pathname !== '/login' && !isAuthEndpoint) {
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

