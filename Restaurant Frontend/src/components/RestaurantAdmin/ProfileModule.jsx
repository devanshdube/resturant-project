import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

const ProfileModule = () => {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    restaurantName: '',
    owner_name: '',
    address: '',
    phone: '',
    restaurant_email: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    restaurant_type: 'both',
    service_type: 'both',
    operating_hours_open: '',
    operating_hours_close: '',
    gst_enabled: false,
    gst_no: '',
    gst_percentage: '0.00',
  });

  // Fetch using React Query
  const { isLoading, error, data } = useQuery({
    queryKey: ['restaurantProfile'],
    queryFn: async () => {
      const response = await api.get('/restaurants/profile');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update formData when data is fetched
  useEffect(() => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        restaurantName: data.name || '',
        owner_name: data.owner_name || '',
        address: data.address || '',
        phone: data.phone || '',
        restaurant_email: data.email || '',
        currency: data.currency || 'INR',
        timezone: data.timezone || 'Asia/Kolkata',
        restaurant_type: data.restaurant_type || 'both',
        service_type: data.service_type || 'both',
        operating_hours_open: data.operating_hours_open || '',
        operating_hours_close: data.operating_hours_close || '',
        gst_enabled: data.gst_enabled === 1 || data.gst_enabled === true,
        gst_no: data.gst_no || '',
        gst_percentage: data.gst_percentage || '0.00',
      }));
    }
  }, [data]);

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await api.patch('/restaurants/profile', updatedData);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMsg('✅ Profile successfully update ho gayi!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    updateProfileMutation.mutate({
      address: formData.address,
      phone: formData.phone,
      email: formData.restaurant_email,
      currency: formData.currency,
      timezone: formData.timezone,
      restaurant_type: formData.restaurant_type,
      service_type: formData.service_type,
      operating_hours_open: formData.operating_hours_open,
      operating_hours_close: formData.operating_hours_close,
      gst_enabled: formData.gst_enabled ? 1 : 0,
      gst_no: formData.gst_no,
      gst_percentage: formData.gst_percentage,
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">Profile load ho rahi hai...</p>
        </div>
      </div>
    );
  }

  const fetchErrorMsg = error ? (error.response?.data?.message || error.message || 'Unknown error') : null;
  const mutationErrorMsg = updateProfileMutation.error ? (updateProfileMutation.error.response?.data?.message || updateProfileMutation.error.message || 'Update failed') : null;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profile &amp; Settings</h2>
          <p className="text-sm text-gray-500">Manage your personal and restaurant information.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200 disabled:opacity-60 flex items-center gap-2"
        >
          {updateProfileMutation.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>}
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Alerts */}
      {(fetchErrorMsg || mutationErrorMsg) && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex-shrink-0">
          {fetchErrorMsg || mutationErrorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex-shrink-0">
          {successMsg}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 p-5 md:p-6 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* ── Column 1: Personal Info ── */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Personal Info</h3>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Name change ke liye admin se contact karein.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Owner Name (Restaurant)</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Service Type</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                >
                  <option value="dine_in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* ── Column 2: Restaurant Details ── */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Restaurant Details</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Name change ke liye Super Admin se request karein.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Restaurant Email</label>
                <input
                  type="email"
                  name="restaurant_email"
                  value={formData.restaurant_email}
                  onChange={handleChange}
                  placeholder="restaurant@example.com"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Restaurant ka pura address..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm resize-none"
                ></textarea>
              </div>
            </div>

            {/* ── Column 3: Operation & GST ── */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">Operation &amp; Billing</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Restaurant Type</label>
                <select
                  name="restaurant_type"
                  value={formData.restaurant_type}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                >
                  <option value="veg">Pure Veg 🟢</option>
                  <option value="non_veg">Non Veg 🔴</option>
                  <option value="both">Both (Veg &amp; Non-Veg)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Opening</label>
                  <input
                    type="time"
                    name="operating_hours_open"
                    value={formData.operating_hours_open}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Closing</label>
                  <input
                    type="time"
                    name="operating_hours_close"
                    value={formData.operating_hours_close}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
              </div>

              {/* GST Box */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800 text-sm">GST Billing</span>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="gst_enabled"
                        className="sr-only"
                        checked={formData.gst_enabled}
                        onChange={handleChange}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.gst_enabled ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow ${formData.gst_enabled ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                </div>

                {formData.gst_enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">GST Number</label>
                      <input
                        type="text"
                        name="gst_no"
                        value={formData.gst_no}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all uppercase text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">GST %</label>
                      <select
                        name="gst_percentage"
                        value={formData.gst_percentage}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      >
                        <option value="0.00">0%</option>
                        <option value="5.00">5%</option>
                        <option value="12.00">12%</option>
                        <option value="18.00">18%</option>
                        <option value="28.00">28%</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModule;
