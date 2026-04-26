import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Menu, User, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import LogoutConfirmModal from '../shared/LogoutConfirmModal';

const DashboardHeader = ({ toggleSidebar, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  const restaurantName = user?.restaurant_name || 'My Restaurant';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setActiveTab('profile');
    setShowDropdown(false);
  };

  return (
    <>
      <header className="fd-header">
        <div className="fd-header-left">
          <button
            className="fd-mobile-menu-btn md:hidden p-2 -ml-2 mr-2 text-white hover:bg-white/10 rounded-lg"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>

          <div className="fd-brand-logo hidden md:flex">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-orange-500">🍔</span>
            </div>
            <span className="truncate max-w-xs lg:max-w-md xl:max-w-lg" title={restaurantName}>{restaurantName}</span>
          </div>
        </div>

        {/* Global Search Centered */}
        <div className="fd-search-bar-container flex-1 max-w-2xl mx-4">
          <div className="fd-search-bar w-full">
            <Search size={18} className="text-white/70" />
            <input
              type="text"
              placeholder="Global search (Menu, Orders, etc.)"
              className="fd-search-input"
            />
          </div>
        </div>

        <div className="fd-header-right">
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              className="fd-user-profile"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="fd-user-avatar">
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
              <span className="font-semibold text-sm hidden md:block">{user?.name || 'User'}</span>
              <ChevronDown size={14} className="hidden md:block" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 text-gray-800">
                <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                  <p className="font-semibold truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{restaurantName}</p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={handleProfileClick}
                >
                  <User size={16} /> Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={() => { setShowLogoutModal(true); setShowDropdown(false); }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

export default DashboardHeader;

