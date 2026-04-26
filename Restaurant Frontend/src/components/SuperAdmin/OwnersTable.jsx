import { useState, useEffect, useCallback } from 'react';
import { getAllOwners, toggleOwnerStatus } from '../../services/superAdminApi';
import SubscriptionModal from './SubscriptionModal';

const PLAN_COLORS = { free: '#94a3b8', basic: '#6c63ff', pro: '#00d9a6' };
const STATUS_COLORS = { trial: '#f59e0b', active: '#22c55e', expired: '#ff4d6d' };

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const OwnersTable = ({ onDataLoad, refreshKey }) => {
  const [owners, setOwners] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [togglingId, setTogglingId] = useState(null);
  const [subModal, setSubModal] = useState(null); // owner object
  const [toast, setToast] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOwners = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getAllOwners({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: statusFilter,
      });
      setOwners(data.data.owners);
      setPagination(data.data.pagination);
      if (onDataLoad) onDataLoad(data.data.owners, data.data.pagination.total);
    } catch (err) {
      showToast('Owners load karne mein error aaya', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.limit, refreshKey]);

  useEffect(() => {
    fetchOwners(1);
  }, [debouncedSearch, statusFilter, refreshKey]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = async (owner) => {
    setTogglingId(owner.id);
    try {
      await toggleOwnerStatus(owner.id);
      showToast(`${owner.hotel_name} ${owner.is_active ? 'block' : 'unblock'} kar diya gaya ✓`);
      fetchOwners(pagination.page);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Toggle fail ho gaya', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubSuccess = () => {
    showToast('Subscription update ho gaya ✓');
    fetchOwners(pagination.page);
  };

  const SkeletonRow = () => (
    <tr className="sa-table-skeleton-row">
      {[...Array(8)].map((_, i) => (
        <td key={i}><div className="sa-skeleton-cell" /></td>
      ))}
    </tr>
  );

  return (
    <div className="sa-table-section">
      {/* Toast */}
      {toast && (
        <div className={`sa-toast ${toast.type === 'error' ? 'sa-toast-error' : 'sa-toast-success'}`}>
          {toast.type === 'error' ? '⚠' : '✓'} {toast.msg}
        </div>
      )}

      {/* Subscription Modal */}
      {subModal && (
        <SubscriptionModal
          owner={subModal}
          onClose={() => setSubModal(null)}
          onSuccess={handleSubSuccess}
        />
      )}

      {/* Controls */}
      <div className="sa-table-controls">
        <div className="sa-search-wrap">
          <span className="sa-search-icon">🔍</span>
          <input
            id="owners-search"
            className="sa-search-input"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="sa-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="sa-filter-wrap">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              id={`filter-${s}`}
              className={`sa-filter-btn ${statusFilter === s ? 'sa-filter-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? '🌐 All' : s === 'active' ? '✅ Active' : '🚫 Blocked'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Restaurant</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="sa-empty-state">
                    <span className="sa-empty-icon">🍽</span>
                    <p>Koi restaurant nahi mila</p>
                    <span>{search ? 'Search query change karein' : 'Pehla restaurant add karein!'}</span>
                  </div>
                </td>
              </tr>
            ) : (
              owners.map((owner, idx) => (
                <tr key={owner.id} className="sa-table-row">
                  <td className="sa-td-num">
                    {(pagination.page - 1) * pagination.limit + idx + 1}
                  </td>
                  <td>
                    <div className="sa-restaurant-cell">
                      <div className="sa-restaurant-avatar">
                        {(owner.hotel_name || 'R')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="sa-restaurant-name">{owner.hotel_name}</div>
                        <div className="sa-restaurant-slug">/{owner.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="sa-td-owner">{owner.owner_name}</td>
                  <td className="sa-td-email">{owner.email}</td>
                  <td className="sa-td-phone">{owner.phone}</td>
                  <td>
                    <span
                      className="sa-badge"
                      style={{ color: PLAN_COLORS[owner.sub_plan], borderColor: `${PLAN_COLORS[owner.sub_plan]}60` }}
                    >
                      {owner.sub_plan?.toUpperCase() || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="sa-badge"
                      style={{ color: STATUS_COLORS[owner.sub_status], borderColor: `${STATUS_COLORS[owner.sub_status]}60` }}
                    >
                      {owner.sub_status?.toUpperCase() || '—'}
                    </span>
                  </td>
                  <td className="sa-td-date">{formatDate(owner.created_at)}</td>
                  <td>
                    <div className="sa-action-wrap">
                      <button
                        id={`toggle-${owner.id}`}
                        className={`sa-action-btn ${owner.is_active ? 'sa-action-block' : 'sa-action-unblock'}`}
                        onClick={() => handleToggle(owner)}
                        disabled={togglingId === owner.id}
                        title={owner.is_active ? 'Block karo' : 'Unblock karo'}
                      >
                        {togglingId === owner.id ? '...' : owner.is_active ? '🚫' : '✅'}
                      </button>
                      <button
                        id={`sub-${owner.id}`}
                        className="sa-action-btn sa-action-sub"
                        onClick={() => setSubModal(owner)}
                        title="Subscription update karo"
                      >
                        💳
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pagination.total_pages > 1 && (
        <div className="sa-pagination">
          <span className="sa-page-info">
            Showing {owners.length} of {pagination.total} restaurants
          </span>
          <div className="sa-page-btns">
            <button
              id="page-prev"
              className="sa-page-btn"
              disabled={pagination.page <= 1}
              onClick={() => fetchOwners(pagination.page - 1)}
            >
              ← Prev
            </button>
            {[...Array(pagination.total_pages)].map((_, i) => (
              <button
                key={i}
                id={`page-${i + 1}`}
                className={`sa-page-btn ${pagination.page === i + 1 ? 'sa-page-active' : ''}`}
                onClick={() => fetchOwners(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              id="page-next"
              className="sa-page-btn"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => fetchOwners(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnersTable;
