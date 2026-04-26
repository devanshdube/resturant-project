import { createSlice } from '@reduxjs/toolkit';

// LocalStorage se initial state load karo
const token = localStorage.getItem('rms_token');
const refreshToken = localStorage.getItem('rms_refresh_token');
const user = localStorage.getItem('rms_user');

const initialState = {
  user: user ? JSON.parse(user) : null,
  token: token || null,
  refreshToken: refreshToken || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ─── Login ───────────────────────────────────────────
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      if (refreshToken) state.refreshToken = refreshToken;
      state.error = null;
      // Persist to localStorage
      localStorage.setItem('rms_token', token);
      if (refreshToken) localStorage.setItem('rms_refresh_token', refreshToken);
      localStorage.setItem('rms_user', JSON.stringify(user));
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // ─── Logout ──────────────────────────────────────────
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('rms_token');
      localStorage.removeItem('rms_refresh_token');
      localStorage.removeItem('rms_user');
    },

    // ─── Update Tokens (Silent Refresh) ────────────────────
    updateTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      if (accessToken) {
        state.token = accessToken;
        localStorage.setItem('rms_token', accessToken);
      }
      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('rms_refresh_token', refreshToken);
      }
    },

    // ─── Update User Profile ──────────────────────────────
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('rms_user', JSON.stringify(state.user));
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateTokens, updateUser, clearError } =
  authSlice.actions;

// ─── Selectors ───────────────────────────────────────────
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refreshToken;

export default authSlice.reducer;
