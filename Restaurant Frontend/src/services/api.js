import axios from 'axios';
import { store } from '../store/store';
import { logout, updateTokens } from '../store/slices/authSlice';

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
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Agar token expire ho gaya ya unauthorized hai
    if (status === 401 && !originalRequest._retry) {
      // Refresh routes khud loop mein na fasein
      if (
        originalRequest.url.includes('/auth/refresh-token') ||
        originalRequest.url.includes('/super-admin/login') ||
        originalRequest.url.includes('/auth/login')
      ) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken || localStorage.getItem('rms_refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Plain axios use karein (interceptor bypass) to avoid infinite loop
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refresh_token: refreshToken
        });

        const newAccessToken = res.data.data.tokens.access_token;
        const newRefreshToken = res.data.data.tokens.refresh_token;

        store.dispatch(updateTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }));

        // New token ke saath header set karo aur request retry karo
        originalRequest.headers = {
          ...originalRequest.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        return api(originalRequest);
      } catch (err) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(err);
      }
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
