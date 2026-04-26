import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// useAuth — Custom hook for all authentication-related logic
// ─────────────────────────────────────────────────────────────────────────────
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // ─── Login ────────────────────────────────────────────
  const login = async (credentials, userType = 'restaurant') => {
    dispatch(loginStart());
    try {
      const endpoint = userType === 'admin' ? '/super-admin/login' : '/auth/login';
      const { data } = await api.post(endpoint, credentials);

      const userData = userType === 'admin'
        ? { ...data.data.admin, role: 'superadmin' }
        : data.data.user;

      const token = data.data.tokens?.access_token || data.data.token;
      const refreshToken = data.data.tokens?.refresh_token;

      dispatch(loginSuccess({ user: userData, token, refreshToken }));

      // Role ke hisaab se navigate karo
      const role = userData?.role;
      if (role === 'superadmin') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }

      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Login fail ho gaya, dobara try karein.';
      dispatch(loginFailure(message));
      return { success: false, message };
    }
  };

  // ─── Logout ───────────────────────────────────────────
  const logoutUser = () => {
    dispatch(logout());
    navigate('/login');
  };

  // ─── Clear Error ──────────────────────────────────────
  const clearAuthError = () => dispatch(clearError());

  // ─── Update Profile ───────────────────────────────────
  const updateProfile = (updatedData) => dispatch(updateUser(updatedData));

  return {
    user,
    isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout: logoutUser,
    clearAuthError,
    updateProfile,
  };
};

export default useAuth;
