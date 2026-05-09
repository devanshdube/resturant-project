import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { 
  ShoppingCart, Star, Info, ChevronRight, Plus, Minus, X, 
  CheckCircle2, Loader2, AlertTriangle, Clock, Receipt, 
  UtensilsCrossed, CheckCircle, Search, ArrowLeft, Heart,
  Flame, Leaf, Award
} from 'lucide-react';

const getSessionKey = (tableId) => `rms_guest_session_${tableId}`;

const GuestMenuPage = () => {
  const { identifier, tableId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [guestSession, setGuestSession] = useState(null);

  // Order Tracking State
  const [activeOrders, setActiveOrders] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // UI State
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // 'submitting', 'success', null
  const [billRequestLoading, setBillRequestLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Session Initialization ─────────────────────────────────────────────────
  const initSession = useCallback(async () => {
    if (!tableId || !token) return;
    const sessionKey = getSessionKey(tableId);
    const savedSession = localStorage.getItem(sessionKey);
    if (savedSession) {
      setGuestSession(JSON.parse(savedSession));
      return;
    }
    try {
      setSessionLoading(true);
      const res = await publicService.startSession(tableId, token);
      const sessionData = res.data.data;
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      setGuestSession(sessionData);
    } catch (err) {
      setError('Verification failed. Please re-scan QR.');
    } finally {
      setSessionLoading(false);
    }
  }, [tableId, token]);

  const refreshOrders = useCallback(async (silent = false) => {
    if (!guestSession?.session_id) return;
    try {
      if (!silent) setIsRefreshingOrders(true);
      const res = await publicService.getOrders(guestSession.session_id);
      setActiveOrders(res.data.data.orders);
      setSessionStatus(res.data.data.session_status);
      if (res.data.data.session_status === 'completed') {
        localStorage.removeItem(getSessionKey(tableId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingOrders(false);
    }
  }, [guestSession?.session_id, tableId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await initSession();
        const res = await publicService.getMenu(identifier);
        setRestaurant(res.data.data.restaurant);
        setMenu(res.data.data.menu);
        if (res.data.data.menu.length > 0) {
          setSelectedCategory(res.data.data.menu[0].id);
        }
      } catch (err) {
        setError('Menu load nahi ho paya.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [identifier, tableId, token, initSession]);

  useEffect(() => {
    if (!guestSession?.session_id || sessionStatus === 'completed') return;
    refreshOrders(true);
    const interval = setInterval(() => refreshOrders(true), 15000);
    return () => clearInterval(interval);
  }, [guestSession?.session_id, refreshOrders, sessionStatus]);

  // ─── Cart Logic ─────────────────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    try {
      setOrderStatus('submitting');
      await publicService.placeOrder({
        restaurant_id: restaurant.id,
        table_id: tableId,
        token: token,
        session_id: guestSession.session_id,
        items: cart.map(item => ({ menu_item_id: item.id, quantity: item.quantity })),
      });
      setOrderStatus('success');
      setCart([]);
      refreshOrders();
    } catch (err) {
      alert('Order failed!');
      setOrderStatus(null);
    }
  };

  const handleRequestBill = async () => {
    if (!window.confirm('Request Bill?')) return;
    try {
      setBillRequestLoading(true);
      await publicService.requestBill(tableId, guestSession.session_id);
      alert('Staff notified!');
      refreshOrders();
    } catch (err) {
      alert('Request failed');
    } finally {
      setBillRequestLoading(false);
    }
  };

  if (loading || sessionLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
       <div className="relative">
         <div className="w-20 h-20 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
         <div className="absolute inset-0 flex items-center justify-center font-bold text-orange-500 text-xs">RMS</div>
       </div>
       <p className="mt-4 text-gray-400 font-medium animate-pulse">Setting up your table...</p>
    </div>
  );

  if (sessionStatus === 'completed') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
      <div className="w-32 h-32 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
        <CheckCircle size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Visit Again!</h2>
      <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">Hope you enjoyed your meal at <span className="font-bold text-orange-500">{restaurant?.name}</span>.</p>
      <div className="mt-12 bg-gray-50 px-8 py-4 rounded-full inline-flex items-center gap-3 text-green-600 font-bold border border-green-100">
        <CheckCircle2 size={20} /> Bill Paid Successfully
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-gray-900 font-sans selection:bg-orange-100">
      
      {/* ── Sticky Navigation Header ── */}
      <header className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Bill Button */}
          <div className="flex-none">
            <button 
              onClick={handleRequestBill} 
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs border border-orange-100 hover:bg-orange-100 transition-all active:scale-95 whitespace-nowrap"
            >
              <div className="relative">
                <Receipt size={18} />
                <span className="absolute -bottom-1 -right-1 bg-white text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full border border-orange-100">₹</span>
              </div>
              <span className="hidden sm:inline">Request Bill</span>
              <span className="sm:hidden text-[10px]">Bill</span>
            </button>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search dishes..." 
              className="w-full bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500/30 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right: Cart/Quantity Info */}
          <div className="flex-none">
            <button 
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all relative"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">My Cart</span>
              {cart.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1 min-w-[20px] text-center">
                  {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs (Sticky below main row) */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-2 overflow-x-auto no-scrollbar py-1">
          {menu.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Page Branding Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
           <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{restaurant?.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-medium">
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider text-[9px]">Table {guestSession?.table_number || tableId}</span>
                <span className="w-1 h-1 bg-gray-200 rounded-full hidden sm:block"></span>
                <div className="hidden sm:flex items-center gap-1"><Star size={12} className="fill-orange-400 text-orange-400" /> 4.8 Ratings</div>
              </div>
           </div>
           <button onClick={() => setShowOrders(true)} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 shadow-sm hover:shadow-md transition-all active:scale-95">
              <Clock size={14} className="text-orange-500" /> <span className="hidden sm:inline">Track Orders</span><span className="sm:hidden">Orders</span>
           </button>
        </div>

        {/* ── Responsive Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(menu.find(c => c.id === selectedCategory)?.items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) || []).length > 0 ? (menu.find(c => c.id === selectedCategory)?.items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) || []).map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="bg-white rounded-[32px] overflow-hidden border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-orange-100/10 transition-all duration-500 group flex flex-col">
                {/* Image Section */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-50 shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">🍜</div>
                  )}
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-white/20">
                      <div className={`w-3.5 h-3.5 border ${item.is_veg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-[2px] p-[1px]`}>
                        <div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">{item.name}</h4>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-medium">{item.description || 'Delicately balanced flavors with hand-picked spices.'}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Price</p>
                       <p className="text-xl font-black text-gray-900">₹{item.price}</p>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-gray-900 text-white p-1 rounded-2xl shadow-lg ring-4 ring-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20"><Minus size={14} /></button>
                        <span className="font-black text-sm w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)} 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-lg shadow-orange-100 transition-all active:scale-95"
                      >
                        ADD +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
              <div className="text-7xl mb-4 opacity-10">🥡</div>
              <h3 className="text-xl font-bold text-gray-400 tracking-tight">No items found</h3>
              <p className="text-sm text-gray-300 mt-2">Try looking in a different category</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Cart Modal (Mobile Drawer Style) ── */}
      {showCart && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-white w-full max-w-xl rounded-t-[48px] sm:rounded-[48px] flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
               <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-gray-50">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">Your Basket</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Complete your selection</p>
                  </div>
                  <button onClick={() => setShowCart(false)} className="p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-100 transition-colors"><X size={20} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-20">
                       <div className="text-6xl mb-4 opacity-10">🛒</div>
                       <p className="text-gray-400 font-bold">Your basket is empty</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between group">
                         <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50">
                               {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>}
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-800 leading-tight group-hover:text-orange-500 transition-colors">{item.name}</h4>
                               <p className="text-orange-500 font-black text-sm mt-1">₹{item.price}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 bg-gray-50 px-3 py-2 rounded-2xl">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-gray-900 transition-colors"><Minus size={16} /></button>
                            <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-gray-900 transition-colors"><Plus size={16} /></button>
                         </div>
                      </div>
                    ))
                  )}

                  {cart.length > 0 && (
                    <div className="mt-8 bg-gray-50 rounded-[32px] p-6 space-y-4">
                       <div className="flex justify-between text-sm font-medium text-gray-500">
                          <span>Subtotal</span>
                          <span className="text-gray-900">₹{totalAmount.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm font-medium text-gray-500">
                          <span>GST & Taxes (5%)</span>
                          <span className="text-gray-900">₹{(totalAmount * 0.05).toFixed(2)}</span>
                       </div>
                       <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-lg font-black text-gray-900">To Pay</span>
                          <span className="text-2xl font-black text-orange-600">₹{(totalAmount * 1.05).toFixed(0)}</span>
                       </div>
                    </div>
                  )}
               </div>

               {cart.length > 0 && (
                 <div className="p-8 pt-0">
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={orderStatus === 'submitting'}
                      className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[28px] font-black text-xl shadow-xl shadow-gray-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {orderStatus === 'submitting' ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Order'}
                    </button>
                 </div>
               )}
            </div>
          </div>
        )}

      {/* ── My Orders Tracking ── */}
      {showOrders && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-[#fafafa] w-full max-w-xl rounded-t-[48px] sm:rounded-[48px] flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden">
               <div className="px-8 pt-6 pb-4 flex justify-between items-center border-b border-gray-100 bg-white">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">Order History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Track your live orders</p>
                  </div>
                  <button onClick={() => setShowOrders(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-500 hover:bg-gray-100 transition-colors"><X size={20} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-20">
                       <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <UtensilsCrossed size={40} className="text-gray-200" />
                       </div>
                       <h4 className="font-bold text-gray-400">No active orders</h4>
                    </div>
                  ) : (
                    activeOrders.map(order => (
                      <div key={order.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-5 pb-5 border-b border-gray-50">
                           <div>
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">#{order.order_number}</p>
                              <p className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                           </div>
                           <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                              order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              order.status === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              order.status === 'ready' ? 'bg-green-50 text-green-600 border-green-100 animate-pulse' :
                              'bg-gray-50 text-gray-600 border-gray-100'
                           }`}>
                              {order.status}
                           </div>
                        </div>
                        
                        <div className="space-y-3">
                           {order.items.map(item => (
                             <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                   <span className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-900 font-bold rounded-lg text-xs">{item.quantity}</span>
                                   <span className="font-bold text-gray-700">{item.item_name}</span>
                                </div>
                                <span className="font-black text-gray-900">₹{item.subtotal}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
        </div>
      )}

      {/* ── Order Success Overlay ── */}
      {orderStatus === 'success' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center flex flex-col items-center shadow-2xl animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <CheckCircle2 size={48} strokeWidth={2.5} />
             </div>
             <h3 className="text-3xl font-black text-gray-900 mb-3">Sent to Kitchen!</h3>
             <p className="text-gray-500 text-sm leading-relaxed mb-10">Your food is being prepared with love and care.</p>
             <button 
              onClick={() => {setOrderStatus(null); setShowCart(false); setShowOrders(true);}}
              className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-gray-200 active:scale-95 transition-all"
             >
               Track Order
             </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default GuestMenuPage;
