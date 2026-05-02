import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Shield, User, X, Check, Power } from 'lucide-react';
import { staffService } from '../../../services/staffService';
import useAuth from '../../../hooks/useAuth';

const StaffManager = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const initialFormState = { name: '', email: '', password: '', role: 'staff' };
  const [formData, setFormData] = useState(initialFormState);
  const [editingStaff, setEditingStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffService.getStaff();
      setStaffList(res.data.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) return;
    
    try {
      setActionLoading(true);
      await staffService.createStaff(formData);
      setFormData(initialFormState);
      setShowAddModal(false);
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      alert(error.response?.data?.message || 'Failed to add staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    try {
      setActionLoading(true);
      // We only send name and role for update
      await staffService.updateStaff(editingStaff.id, { name: formData.name, role: formData.role });
      setEditingStaff(null);
      setFormData(initialFormState);
      setShowEditModal(false);
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      alert(error.response?.data?.message || 'Failed to update staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await staffService.updateStaff(staffId, { is_active: !currentStatus });
      fetchStaff();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({ name: staff.name, email: staff.email, password: '', role: staff.role });
    setShowEditModal(true);
  };

  // Helper for role badges
  const getRoleBadge = (role) => {
    switch(role) {
      case 'manager': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Shield size={12}/> Manager</span>;
      case 'kitchen': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><FlameIcon size={12}/> Kitchen</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><User size={12}/> Staff</span>;
    }
  };

  const FlameIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  );

  return (
    <div className="h-full flex flex-col fd-card p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={22} />
            </span>
            Staff Management
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-12">Manage your restaurant staff, managers, and kitchen team.</p>
        </div>
        <button 
          onClick={() => { setFormData(initialFormState); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : staffList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <div key={staff.id} className={`border-2 rounded-2xl p-5 transition-all ${staff.is_active ? 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xl font-bold shadow-inner">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{staff.name}</h3>
                      <p className="text-xs text-gray-500">{staff.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  {getRoleBadge(staff.role)}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${staff.is_active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
                      title={staff.is_active ? 'Deactivate Staff' : 'Activate Staff'}
                    >
                      <Power size={14} /> {staff.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <button 
                    onClick={() => openEditModal(staff)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
             <div className="text-5xl mb-4">👥</div>
             <p className="font-bold text-gray-600 text-lg">No staff members found</p>
             <p className="text-sm mt-1">Click "Add Staff" to invite your team.</p>
           </div>
        )}
      </div>

      {/* Add/Edit Staff Modal Overlay */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => {setShowAddModal(false); setShowEditModal(false);}}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {showAddModal ? <><Plus size={20} className="text-blue-600"/> Add New Staff</> : <><Edit2 size={20} className="text-blue-600"/> Edit Staff</>}
              </h3>
              <button onClick={() => {setShowAddModal(false); setShowEditModal(false);}} className="text-gray-400 hover:text-gray-600 p-1"><X size={20}/></button>
            </div>

            <form onSubmit={showAddModal ? handleAddStaff : handleEditStaff} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="e.g. Rahul Kumar"/>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address {showEditModal && <span className="text-xs text-gray-400 font-normal">(Cannot be changed)</span>}</label>
                  <input required={showAddModal} disabled={showEditModal} type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500" placeholder="staff@restaurant.com"/>
                </div>

                {showAddModal && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                    <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" placeholder="Set a strong password"/>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="staff">Staff (Waiter/Server)</option>
                    <option value="kitchen">Kitchen (Chef/Cook)</option>
                    {user.role === 'owner' && <option value="manager">Manager</option>}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => {setShowAddModal(false); setShowEditModal(false);}} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50">
                  {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Check size={18} /> {showAddModal ? 'Create Staff' : 'Save Changes'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
