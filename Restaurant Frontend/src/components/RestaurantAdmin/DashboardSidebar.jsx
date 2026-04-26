import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Table2, 
  ClipboardList, 
  Users, 
  Settings,
  ChevronRight,
  BarChart3,
  Receipt,
  X
} from 'lucide-react';

const DashboardSidebar = ({ activeTab, onTabChange, isOpen, closeSidebar }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu Builder', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables & QR', icon: Table2 },
    { id: 'orders', label: 'Live Orders', icon: ClipboardList },
  ];

  const otherItems = [
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      <aside className={`fd-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:relative z-50 h-full`}>
        <div className="flex justify-between items-center px-6 md:hidden mb-4">
          <span className="font-bold text-orange-500 text-lg">Menu</span>
          <button onClick={closeSidebar} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="fd-nav-group">
          <span className="fd-nav-label">Main Menu</span>
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className={`fd-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(item.id);
                closeSidebar();
              }}
            >
              <div className="fd-nav-content">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
          ))}
        </div>

        <div className="fd-nav-group">
          <span className="fd-nav-label">Other</span>
          {otherItems.map((item) => (
            <div 
              key={item.id}
              className={`fd-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(item.id);
                closeSidebar();
              }}
            >
              <div className="fd-nav-content">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;

