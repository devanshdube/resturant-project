import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import DashboardHeader from '../../components/RestaurantAdmin/DashboardHeader';
import DashboardSidebar from '../../components/RestaurantAdmin/DashboardSidebar';
import ProfileModule from '../../components/RestaurantAdmin/ProfileModule';
import MenuBuilder from '../../components/RestaurantAdmin/MenuModule/MenuBuilder';
import TableBuilder from '../../components/RestaurantAdmin/TableModule/TableBuilder';
import LiveOrdersDashboard from '../../components/RestaurantAdmin/OrderModule/LiveOrdersDashboard';
import StaffManager from '../../components/RestaurantAdmin/StaffModule/StaffManager';
import BillingManager from '../../components/RestaurantAdmin/BillingModule/BillingManager';
import AnalyticsDashboard from '../../components/RestaurantAdmin/AnalyticsModule/AnalyticsDashboard';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    ['staff', 'kitchen'].includes(user?.role) ? 'orders' : 'dashboard'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'profile':
        return <ProfileModule />;
      case 'menu':
        return <MenuBuilder />;
      case 'tables':
        return <TableBuilder />;
      case 'orders':
        return <LiveOrdersDashboard />;
      case 'staff':
        return <StaffManager />;
      case 'billing':
        return <BillingManager />;
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
        
        <main className="fd-main flex-1 w-full md:w-auto overflow-x-hidden">
          {renderContent()}
        </main>


      </div>
    </div>
  );
};

export default DashboardPage;

