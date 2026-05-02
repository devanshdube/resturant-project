import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, RefreshCw, ChevronRight, Clock,
  CheckCircle2, Flame, Bell, Package, XCircle, X
} from 'lucide-react';
import { orderService } from '../../../services/orderService';
import useAuth from '../../../hooks/useAuth';

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'New Order', icon: Bell,
    bg: 'bg-yellow-50', border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-400 animate-pulse',
    next: { status: 'confirmed', label: 'Accept Order', color: 'bg-green-500 hover:bg-green-600' }
  },
  confirmed: {
    label: 'Confirmed', icon: CheckCircle2,
    bg: 'bg-blue-50', border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    next: { status: 'preparing', label: 'Start Cooking', color: 'bg-orange-500 hover:bg-orange-600' }
  },
  preparing: {
    label: 'Cooking', icon: Flame,
    bg: 'bg-orange-50', border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400 animate-pulse',
    next: { status: 'ready', label: 'Mark Ready', color: 'bg-green-600 hover:bg-green-700' }
  },
  ready: {
    label: 'Ready!', icon: Package,
    bg: 'bg-green-50', border: 'border-green-300',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500 animate-pulse',
    next: { status: 'served', label: 'Mark Served', color: 'bg-gray-800 hover:bg-gray-900' }
  },
  served: {
    label: 'Served', icon: CheckCircle2,
    bg: 'bg-gray-50', border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
    next: { status: 'completed', label: 'Complete', color: 'bg-purple-500 hover:bg-purple-600' }
  },
  completed: {
    label: 'Completed', icon: CheckCircle2,
    bg: 'bg-purple-50', border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-400',
    next: null
  },
  cancelled: {
    label: 'Cancelled', icon: XCircle,
    bg: 'bg-red-50', border: 'border-red-200',
    badge: 'bg-red-100 text-red-600',
    dot: 'bg-red-400',
    next: null
  }
};

const FILTER_TABS = [
  { id: null, label: 'All Orders' },
  { id: 'pending', label: '🔔 New' },
  { id: 'confirmed', label: '✅ Confirmed' },
  { id: 'preparing', label: '🔥 Cooking' },
  { id: 'ready', label: '📦 Ready' },
  { id: 'served', label: 'Served' },
  { id: 'completed', label: 'Completed' },
];

// ── Order Detail Modal ─────────────────────────────────────────────────────
const OrderDetailModal = ({ orderId, onClose, onStatusUpdate }) => {
  const { user } = useAuth();
  const isManager = ['owner', 'manager'].includes(user?.role);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderService.getOrderDetails(orderId);
        setOrder(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);
      await orderService.updateStatus(orderId, status);
      onStatusUpdate();
      onClose();
    } catch (e) {
      alert('Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const cfg = order ? STATUS_CONFIG[order.status] : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-900 text-white p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Order Details</p>
              <h2 className="text-2xl font-black">{order?.order_number || '...'}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          {order && (
            <div className="flex items-center gap-3 mt-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg?.badge}`}>{cfg?.label}</span>
              <span className="text-gray-400 text-xs">Table: {order.table_number}</span>
              <span className="text-gray-400 text-xs">• {order.created_at?.substring(11, 16)}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="p-5 max-h-64 overflow-y-auto space-y-3">
              {order?.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-gray-800">{item.item_name}</p>
                    {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                    {item.special_notes && <p className="text-xs text-orange-600 italic mt-0.5">"{item.special_notes}"</p>}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-bold text-gray-800">×{item.quantity}</p>
                    {isManager && <p className="text-sm text-orange-500 font-bold">₹{item.subtotal}</p>}
                  </div>
                </div>
              ))}
              {order?.special_notes && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-3">
                  <p className="text-xs font-bold text-orange-700 mb-1">Special Instructions:</p>
                  <p className="text-sm text-orange-800">"{order.special_notes}"</p>
                </div>
              )}
            </div>

            {/* Total */}
            {isManager && (
              <div className="px-5 pb-2 border-t border-gray-100">
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 font-medium">Grand Total</span>
                  <span className="text-2xl font-black text-gray-900">₹{order?.grand_total || order?.total_amount}</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            {cfg?.next && (
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className="flex-none px-4 py-3 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(cfg.next.status)}
                  disabled={updating}
                  className={`flex-1 py-3 text-white font-bold rounded-2xl transition-colors text-sm disabled:opacity-50 ${cfg.next.color}`}
                >
                  {updating ? 'Updating...' : cfg.next.label}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Order Card ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, onClick }) => {
  const { user } = useAuth();
  const isManager = ['owner', 'manager'].includes(user?.role);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <p className="font-black text-gray-900 text-lg">{order.order_number}</p>
        </div>
        <div className="text-right">
          {isManager && <p className="font-black text-orange-500 text-lg">₹{order.grand_total || order.total_amount}</p>}
          <p className="text-xs text-gray-500">{order.created_at?.substring(11, 16)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-black/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="text-lg">🪑</span>
            <span className="text-sm font-bold">{order.table_number}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <ClipboardList size={14} />
            <span className="text-sm font-bold">{order.item_count} items</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const LiveOrdersDashboard = () => {
  const { user } = useAuth();
  const isManager = ['owner', 'manager'].includes(user?.role);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        orderService.getOrders(activeFilter),
        orderService.getStats().catch(() => ({ data: { data: null } }))
      ]);
      setOrders(ordersRes.data.data);
      setStats(statsRes.data.data);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  // Initial load + auto refresh every 20s
  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
              <ClipboardList size={22} />
            </span>
            Live Orders
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-12">
            Auto-refreshes every 20s • Last: {lastRefreshed.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Orders", value: stats.total_orders || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '🔔 Pending', value: stats.pending || 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '🔥 Cooking', value: stats.preparing || 0, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: "Today's Revenue", value: `₹${Number(stats.total_revenue || 0).toFixed(0)}`, color: 'text-green-600', bg: 'bg-green-50', managerOnly: true },
          ].filter(s => !s.managerOnly || isManager).map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4 border border-black/5`}>
              <p className="text-xs text-gray-500 font-semibold mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              activeFilter === tab.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrderId(order.id)}
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="font-bold text-gray-600 text-lg">No orders yet</p>
            <p className="text-sm mt-1">
              {activeFilter ? `No ${activeFilter} orders at the moment` : 'Orders will appear here when customers scan QR codes'}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default LiveOrdersDashboard;
