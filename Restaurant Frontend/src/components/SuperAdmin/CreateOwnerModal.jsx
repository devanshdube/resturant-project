import { useState } from 'react';
import { createOwner } from '../../services/superAdminApi';

const CreateOwnerModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    owner_name: '',
    hotel_name: '',
    email: '',
    mobile: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.owner_name || form.owner_name.trim().length < 3)
      return 'Owner ka naam kam se kam 3 characters ka hona chahiye';
    if (!form.hotel_name || form.hotel_name.trim().length < 2)
      return 'Hotel name required hai';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Valid email address daalein';
    if (!/^[0-9]{10}$/.test(form.mobile.trim()))
      return 'Mobile number 10 digits ka hona chahiye';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    try {
      await createOwner(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Kuch gadbad ho gayi, dobara try karein');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div className="sa-modal-title-wrap">
            <div className="sa-modal-icon">🏪</div>
            <div>
              <h2 className="sa-modal-title">Naya Restaurant Onboard Karo</h2>
              <p className="sa-modal-subtitle">Owner credentials automatically email ho jayenge</p>
            </div>
          </div>
          <button className="sa-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="sa-modal-form">
          <div className="sa-form-grid">
            <div className="sa-form-group">
              <label className="sa-label">Owner Ka Naam *</label>
              <input
                id="create-owner-name"
                name="owner_name"
                className="sa-input"
                placeholder="e.g. Rajesh Kumar"
                value={form.owner_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Hotel / Restaurant Naam *</label>
              <input
                id="create-hotel-name"
                name="hotel_name"
                className="sa-input"
                placeholder="e.g. Spice Garden"
                value={form.hotel_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Email Address *</label>
              <input
                id="create-email"
                name="email"
                type="email"
                className="sa-input"
                placeholder="owner@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Mobile Number *</label>
              <input
                id="create-mobile"
                name="mobile"
                type="tel"
                className="sa-input"
                placeholder="10-digit number"
                value={form.mobile}
                onChange={handleChange}
                maxLength={10}
                required
              />
            </div>
            <div className="sa-form-group sa-form-full">
              <label className="sa-label">Address (Optional)</label>
              <input
                id="create-address"
                name="address"
                className="sa-input"
                placeholder="Restaurant ka address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="sa-form-error">⚠ {error}</div>}

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button id="create-owner-submit" type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? (
                <span className="sa-spinner-wrap"><span className="sa-spinner" /> Creating...</span>
              ) : (
                '🚀 Create & Send Credentials'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOwnerModal;
