import { createSlice } from '@reduxjs/toolkit';

// LocalStorage se initial state load karo
const token = localStorage.getItem('rms_token');
const user = localStorage.getItem('rms_user');

const initialState = {
  user: user ? JSON.parse(user) : null,
  token: token || null,
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
      const { user, token } = action.payload;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      state.error = null;
      // Persist to localStorage
      localStorage.setItem('rms_token', token);
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
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('rms_token');
      localStorage.removeItem('rms_user');
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

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, clearError } =
  authSlice.actions;

// ─── Selectors ───────────────────────────────────────────
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;

export default authSlice.reducer;
