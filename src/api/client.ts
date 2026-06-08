import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const path = config.url || '';
  const isAdmin = path.startsWith('/admin');
  const token = isAdmin
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('user_token') || localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('user_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;