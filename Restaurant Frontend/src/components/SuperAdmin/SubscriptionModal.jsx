import { useState } from 'react';
import { updateSubscription } from '../../services/superAdminApi';

const PLAN_OPTIONS = ['free', 'basic', 'pro'];
const STATUS_OPTIONS = ['trial', 'active', 'expired'];

const PLAN_COLORS = {
  free: '#94a3b8',
  basic: '#6c63ff',
  pro: '#00d9a6',
};
const STATUS_COLORS = {
  trial: '#f59e0b',
  active: '#22c55e',
  expired: '#ff4d6d',
};

const SubscriptionModal = ({ owner, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    plan: owner?.sub_plan || 'free',
    status: owner?.sub_status || 'trial',
    subscription_expires_at: owner?.subscription_expires_at
      ? owner.subscription_expires_at.split('T')[0]
      : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        plan: form.plan,
        status: form.status,
        subscription_expires_at: form.subscription_expires_at || null,
      };
      await updateSubscription(owner.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Update fail ho gaya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div className="sa-modal-title-wrap">
            <div className="sa-modal-icon">💳</div>
            <div>
              <h2 className="sa-modal-title">Subscription Update</h2>
              <p className="sa-modal-subtitle">{owner?.hotel_name || owner?.owner_name}</p>
            </div>
          </div>
          <button className="sa-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Current Status */}
        <div className="sa-sub-current">
          <span className="sa-sub-badge" style={{ color: PLAN_COLORS[form.plan], borderColor: PLAN_COLORS[form.plan] }}>
            {form.plan.toUpperCase()}
          </span>
          <span className="sa-sub-badge" style={{ color: STATUS_COLORS[form.status], borderColor: STATUS_COLORS[form.status] }}>
            {form.status.toUpperCase()}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="sa-modal-form">
          <div className="sa-form-group">
            <label className="sa-label">Plan</label>
            <div className="sa-plan-grid">
              {PLAN_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  id={`sub-plan-${p}`}
                  className={`sa-plan-btn ${form.plan === p ? 'sa-plan-active' : ''}`}
                  style={form.plan === p ? { borderColor: PLAN_COLORS[p], color: PLAN_COLORS[p], backgroundColor: `${PLAN_COLORS[p]}18` } : {}}
                  onClick={() => setForm({ ...form, plan: p })}
                >
                  {p === 'free' ? '🆓' : p === 'basic' ? '⭐' : '💎'} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Status</label>
            <div className="sa-plan-grid">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  id={`sub-status-${s}`}
                  className={`sa-plan-btn ${form.status === s ? 'sa-plan-active' : ''}`}
                  style={form.status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s], backgroundColor: `${STATUS_COLORS[s]}18` } : {}}
                  onClick={() => setForm({ ...form, status: s })}
                >
                  {s === 'trial' ? '⏳' : s === 'active' ? '✅' : '❌'} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Expiry Date (Optional)</label>
            <input
              id="sub-expiry-date"
              name="subscription_expires_at"
              type="date"
              className="sa-input"
              value={form.subscription_expires_at}
              onChange={handleChange}
            />
          </div>

          {error && <div className="sa-form-error">⚠ {error}</div>}

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button id="sub-update-submit" type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? (
                <span className="sa-spinner-wrap"><span className="sa-spinner" /> Saving...</span>
              ) : (
                '💾 Update Subscription'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;
