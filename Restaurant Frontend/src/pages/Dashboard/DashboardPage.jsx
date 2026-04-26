import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import DashboardHeader from '../../components/RestaurantAdmin/DashboardHeader';
import DashboardSidebar from '../../components/RestaurantAdmin/DashboardSidebar';
import ProfileModule from '../../components/RestaurantAdmin/ProfileModule';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Hero Banner */}
            <div className="fd-hero-banner flex-col md:flex-row text-center md:text-left p-6 md:p-10">
              <div className="fd-hero-content max-w-lg z-10">
                <h2 className="uppercase text-2xl md:text-4xl">Everyday is <br className="hidden md:block" /> Wing Day</h2>
                <p className="text-white/80 mb-6 text-sm md:text-base">Sauced up goodness for your customers. Manage your menu and orders effectively.</p>
                <button className="bg-white text-orange-500 px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform text-sm md:text-base">
                  View Orders
                </button>
              </div>
              <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 h-full flex items-center opacity-20 pointer-events-none md:right-10">
                <span className="text-[120px]">🍗</span>
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Main Categories</h3>
                <button className="text-orange-500 font-semibold text-xs md:text-sm">View all &gt;</button>
              </div>
              <div className="fd-category-grid">
                {[
                  { icon: '☕', name: 'Beverage' },
                  { icon: '🍗', name: 'Chicken' },
                  { icon: '🍕', name: 'Pizza' },
                  { icon: '🍔', name: 'Burger' },
                  { icon: '🥗', name: 'Salad' }
                ].map((cat, i) => (
                  <div key={i} className="fd-category-card">
                    <div className="fd-category-icon text-2xl md:text-3xl">{cat.icon}</div>
                    <div className="font-bold text-gray-700 text-sm md:text-base">{cat.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Placeholder for Popular Dishes */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Popular Dishes</h3>
                <button className="text-orange-500 font-semibold text-xs md:text-sm">View all &gt;</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="fd-card h-32 md:h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 text-sm md:text-base">
                  Dish Items List Coming Soon
                </div>
                <div className="fd-card h-32 md:h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 text-sm md:text-base">
                  Dish Items List Coming Soon
                </div>
              </div>
            </div>
          </>
        );
      case 'profile':
        return <ProfileModule />;
      default:
        return (
          <div className="fd-card h-[300px] md:h-[400px] flex flex-col items-center justify-center text-gray-400 text-center p-6">
            <div className="text-5xl md:text-6xl mb-4">🛠</div>
            <p className="text-lg md:text-xl font-semibold uppercase tracking-widest">{activeTab} Module</p>
            <p className="text-sm md:text-base mt-2">Implementation is currently in progress.</p>
          </div>
        );
    }
  };

  return (
    <div className="fd-dashboard-root">
      <DashboardHeader toggleSidebar={toggleSidebar} setActiveTab={setActiveTab} />
      
      <div className="fd-body relative flex-col md:flex-row">
        <DashboardSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isOpen={isSidebarOpen} 
          closeSidebar={closeSidebar} 
        />
        
        <main className="fd-main flex-1 w-full md:w-auto">
          {renderContent()}
        </main>

        <aside className="fd-right-panel w-full md:w-auto mt-4 md:mt-0 pb-10 md:pb-6">
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Sales Card */}
            <div className="bg-orange-500 rounded-2xl p-5 md:p-6 text-white shadow-xl shadow-orange-200">
              <p className="text-xs md:text-sm opacity-80 mb-1">Today's Live Revenue</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">₹ 12,450.00</h2>
              <div className="flex gap-2 md:gap-3">
                <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors">
                  Top Items
                </button>
                <button className="flex-1 bg-white text-orange-500 py-2 rounded-xl text-xs md:text-sm font-bold transition-colors">
                  Withdraw
                </button>
              </div>
            </div>

            {/* Address Card */}
            <div className="fd-card p-5 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800 text-sm md:text-base">Restaurant Info</h4>
                <button className="text-orange-500 text-xs font-bold">Change</button>
              </div>
              <div className="flex gap-3 items-start mb-4 md:mb-3">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-500 shrink-0">
                  <span className="text-sm">📍</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  MG Road, Indore, <br /> Madhya Pradesh, 452001
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 border border-orange-500 text-orange-500 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap">Add Details</button>
                <button className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap">Edit Profile</button>
              </div>
            </div>

            {/* Recent Items List */}
            <div className="px-1">
              <h4 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Recent Active Orders</h4>
              <div className="flex flex-col gap-3 md:gap-4">
                {[1, 2].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-lg flex items-center justify-center text-base md:text-lg shrink-0">🍕</div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-gray-800">Pepperoni Pizza</p>
                        <p className="text-[10px] md:text-xs text-gray-500">Table 05 • x1</p>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-bold text-orange-500">+₹ 349</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;

