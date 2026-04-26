import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from './store/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard/SuperAdminDashboard';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  // Role ke hisaab se default redirect decide karo
  const defaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    return user?.role === 'superadmin' ? '/super-admin' : '/dashboard';
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultRedirect()} replace /> : <LoginPage />}
      />

      {/* Protected Routes — Restaurant Users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Protected Routes — Super Admin */}
      <Route element={<ProtectedRoute />}>
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Route>

      {/* Fallback — Root redirect */}
      <Route
        path="/"
        element={<Navigate to={defaultRedirect()} replace />}
      />

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#64748b', textAlign: 'center' }}>
            <div>
              <h1 style={{ fontSize: '72px', fontWeight: 700, margin: 0 }}>404</h1>
              <p style={{ marginTop: '8px' }}>Page nahi mila!</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
