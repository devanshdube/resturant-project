import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Receipt, Utensils, Star, Flame } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import useAuth from '../../../hooks/useAuth';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await orderService.getAnalytics();
        setAnalytics(res.data.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  const stats = analytics?.stats || { total_revenue: 0, total_orders: 0, total_customers: 0 };
  const popularItems = analytics?.popular_items || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-3xl p-8 text-white shadow-xl shadow-orange-200/50 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Chef'}! 👨‍🍳</h2>
          <p className="text-orange-50 text-sm md:text-base mb-6">
            Here's what's happening at {user?.restaurant_name || 'your restaurant'} today. Keep up the great work!
          </p>
          <button className="bg-white text-orange-600 px-6 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2">
            <BarChart3 size={16} /> View Detailed Reports
          </button>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 translate-x-10 pointer-events-none" />
        <div className="absolute right-[-20px] bottom-[-20px] text-[120px] opacity-20 rotate-[-15deg] pointer-events-none">
          🍔
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" /> Business Overview
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Receipt size={24} />
              </div>
              <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-bold">+12%</span>
            </div>
            <p className="text-gray-500 text-sm font-semibold mb-1">Total Revenue</p>
            <h4 className="text-3xl font-black text-gray-900">₹{Number(stats.total_revenue).toLocaleString()}</h4>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Utensils size={24} />
              </div>
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold">+5%</span>
            </div>
            <p className="text-gray-500 text-sm font-semibold mb-1">Total Orders</p>
            <h4 className="text-3xl font-black text-gray-900">{stats.total_orders}</h4>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users size={24} />
              </div>
              <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-bold">Stable</span>
            </div>
            <p className="text-gray-500 text-sm font-semibold mb-1">Unique Customers</p>
            <h4 className="text-3xl font-black text-gray-900">{stats.total_customers}</h4>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div>
        <div className="flex justify-between items-center mb-4 mt-2">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Flame size={20} className="text-orange-500" /> Most Popular Dishes
          </h3>
        </div>
        
        {popularItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center relative group hover:border-orange-200 transition-colors">
                <div className="absolute top-3 left-3 bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  #{idx + 1}
                </div>
                
                <div className="w-20 h-20 rounded-full bg-gray-50 border-4 border-white shadow-md flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🍽️
                </div>
                
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.item_name}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <span className="font-semibold text-orange-500">{item.total_sold}</span> sold
                </div>
                
                <div className="mt-auto pt-3 border-t border-gray-50 w-full">
                  <p className="text-xs text-gray-400 font-medium">Revenue</p>
                  <p className="font-bold text-gray-800">₹{Number(item.total_revenue).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">📊</div>
            <p className="font-bold text-gray-600">No sales data yet</p>
            <p className="text-sm text-gray-500 mt-1">Once you start receiving orders, your most popular dishes will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
