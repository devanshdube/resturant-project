import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor — Attach JWT Token from Redux store
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor — Handle Global Errors (401, 403, etc.)
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // Agar token expire ho gaya ya unauthorized hai
    if (status === 401) {
      store.dispatch(logout());
      window.location.href = '/login';
    }

    // Forbidden — Permission nahi hai
    if (status === 403) {
      console.error('Access forbidden: Aapke paas permission nahi hai.');
    }

    // Server Error
    if (status >= 500) {
      console.error('Server Error: Kuch gadbad ho gayi, baad mein try karein.');
    }

    return Promise.reject(error);
  }
);

export default api;
