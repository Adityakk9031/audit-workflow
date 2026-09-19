import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect ONLY if not already on /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Do not redirect or reload if user is already on /login or calling login API
      const isLoginRequest = err.config?.url?.includes('/auth/login');
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (!isLoginRequest && !isLoginPage && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
