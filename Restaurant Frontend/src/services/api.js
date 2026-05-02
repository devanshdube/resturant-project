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
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
        // Avoid reload if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

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

        const { access_token, refresh_token: newRefreshToken } = res.data.data.tokens;

        store.dispatch(updateTokens({ accessToken: access_token, refreshToken: newRefreshToken }));
        processQueue(null, access_token);

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Forbidden — Permission nahi hai
    if (status === 403) {
      console.error('Access forbidden: Aapke paas permission nahi hai.');
    }

    return Promise.reject(error);
  }
);

export default api;
