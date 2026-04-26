import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import StatsCards from '../../components/SuperAdmin/StatsCards';
import OwnersTable from '../../components/SuperAdmin/OwnersTable';
import CreateOwnerModal from '../../components/SuperAdmin/CreateOwnerModal';
import LogoutConfirmModal from '../../components/shared/LogoutConfirmModal';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const { getPlatformStats } = await import('../../services/superAdminApi');
        const { data } = await getPlatformStats();
        setStatsData(data.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [refreshKey]);

  const handleCreateSuccess = () => {
    setRefreshKey((k) => k + 1); // Trigger re-fetch
  };

  const currentTime = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="sa-root">
      {/* ── Sidebar ── */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div className="sa-brand-logo">🍽</div>
          <div>
            <div className="sa-brand-name">RestaurantMS</div>
            <div className="sa-brand-tag">Platform Admin</div>
          </div>
        </div>

        <nav className="sa-nav">
          <div className="sa-nav-item sa-nav-active">
            <span className="sa-nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="sa-nav-item sa-nav-disabled">
            <span className="sa-nav-icon">🏪</span>
            <span>Restaurants</span>
            <span className="sa-nav-badge">Soon</span>
          </div>
          <div className="sa-nav-item sa-nav-disabled">
            <span className="sa-nav-icon">💳</span>
            <span>Subscriptions</span>
            <span className="sa-nav-badge">Soon</span>
          </div>
          <div className="sa-nav-item sa-nav-disabled">
            <span className="sa-nav-icon">⚙</span>
            <span>Settings</span>
            <span className="sa-nav-badge">Soon</span>
          </div>
        </nav>

        <div className="sa-sidebar-footer">
          <div className="sa-user-info">
            <div className="sa-user-avatar">
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="sa-user-name">{user?.name || 'Super Admin'}</div>
              <div className="sa-user-role">Platform Owner</div>
            </div>
          </div>
          <button id="sa-logout-btn" className="sa-logout-btn" onClick={() => setShowLogoutModal(true)}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="sa-main">
        {/* Header */}
        <header className="sa-header">
          <div>
            <h1 className="sa-header-title">Platform Dashboard</h1>
            <p className="sa-header-date">{currentTime}</p>
          </div>
          <button
            id="sa-add-restaurant-btn"
            className="sa-btn-primary sa-header-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span>＋</span> Add Restaurant
          </button>
        </header>

        {/* Stats */}
        <StatsCards
          stats={statsData}
          loading={statsLoading}
        />

        {/* Section heading */}
        <div className="sa-section-header">
          <h2 className="sa-section-title">🏪 Registered Restaurants</h2>
          <p className="sa-section-sub">Saare onboarded restaurants manage karein</p>
        </div>

        {/* Owners Table */}
        <OwnersTable
          refreshKey={refreshKey}
        />
      </main>

      {/* Create Owner Modal */}
      {showCreateModal && (
        <CreateOwnerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
