import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { publicService } from '../../services/publicService';
import { ShoppingCart, Star, Clock, Info, ChevronRight, Plus, Minus, X, CheckCircle2 } from 'lucide-react';

const GuestMenuPage = () => {
  const { identifier, tableId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // 'submitting', 'success', null

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (token && tableId) {
          try {
            await publicService.verifyTable(tableId, token);
          } catch (err) {
            console.error('Table verification failed:', err);
          }
        }

        const res = await publicService.getMenu(identifier);
        setRestaurant(res.data.data.restaurant);
        setMenu(res.data.data.menu);
        if (res.data.data.menu.length > 0) {
          setSelectedCategory(res.data.data.menu[0].id);
        }
      } catch (err) {
        console.error('Error loading menu:', err);
        setError('Menu load nahi ho paya. Please check the QR code.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [identifier, tableId, token]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return newQty === 0 ? null : { ...i, quantity: newQty };
        }
        return i;
      }).filter(Boolean);
    });
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!token || !tableId) {
      alert('Order place karne ke liye QR scan karna zaroori hai.');
      return;
    }

    try {
      setOrderStatus('submitting');
      const orderData = {
        restaurant_id: restaurant.id,
        table_id: tableId,
        token: token,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: ''
        })),
        special_notes: ''
      };

      await publicService.placeOrder(orderData);
      setOrderStatus('success');
      setCart([]);
    } catch (err) {
      console.error('Order failed:', err);
      alert('Order place nahi ho paya. Please try again.');
      setOrderStatus(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🍽️</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold">Try Again</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header / Hero */}
      <div className="bg-orange-500 text-white p-6 pb-20 rounded-b-[40px] relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-extrabold">{restaurant?.name}</h1>
            <p className="text-orange-100 flex items-center gap-1 mt-1">
              <Star size={14} fill="currentColor" /> 4.5 • 20-30 mins
            </p>
          </div>
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl bg-white p-1 object-contain shadow-lg" />
          )}
        </div>
        
        <div className="absolute -bottom-6 left-6 right-6">
          <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                <Info size={20} />
             </div>
             <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Your Table</p>
                <p className="text-gray-800 font-bold">Dine-in at Table {tableId || 'General'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-12 px-6">
        {/* Categories Tabs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {menu.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl font-bold transition-all text-sm ${
                selectedCategory === cat.id 
                ? 'bg-gray-900 text-white shadow-lg scale-105' 
                : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="mt-8 space-y-6">
          {menu.find(c => c.id === selectedCategory)?.items.map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="bg-white rounded-[32px] p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl shrink-0 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍛</div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1 rounded-lg">
                    <div className={`w-3 h-3 border ${item.is_veg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description || 'Freshly prepared with authentic ingredients.'}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-xl font-black text-gray-900">₹{item.price}</p>
                    
                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-orange-500 text-white px-2 py-1.5 rounded-xl shadow-lg shadow-orange-100">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><Minus size={16} /></button>
                        <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><Plus size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-white border-2 border-orange-500 text-orange-500 font-bold px-4 py-1.5 rounded-xl hover:bg-orange-500 hover:text-white transition-all active:scale-95 flex items-center gap-1 text-sm"
                      >
                        <Plus size={16} /> ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-6 right-6 animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 text-white py-4 rounded-[24px] flex items-center justify-between px-6 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
               <div className="bg-orange-500 p-2 rounded-xl">
                 <ShoppingCart size={20} />
               </div>
               <div className="text-left">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cart.length} Items</p>
                 <p className="font-bold">₹{totalAmount.toFixed(2)}</p>
               </div>
            </div>
            <div className="flex items-center gap-1 font-bold">
               View Cart <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            <div className="p-6 pb-2 flex justify-between items-center border-b border-gray-50">
               <h3 className="text-xl font-black text-gray-800">Your Cart</h3>
               <button onClick={() => setShowCart(false)} className="p-2 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {cart.map(item => (
                 <div key={item.id} className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                       <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                         {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍛</div>}
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h4>
                          <p className="text-orange-500 font-bold text-sm mt-1">₹{item.price}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-xl">
                       <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-500 hover:text-gray-800"><Minus size={14} /></button>
                       <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-500 hover:text-gray-800"><Plus size={14} /></button>
                    </div>
                 </div>
               ))}

               <div className="bg-orange-50 rounded-[32px] p-6 space-y-3 mt-8">
                  <div className="flex justify-between text-sm text-gray-600">
                     <span>Subtotal</span>
                     <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                     <span>GST (5%)</span>
                     <span>₹{(totalAmount * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-orange-200 flex justify-between items-center font-black text-lg text-gray-900">
                     <span>Total</span>
                     <span>₹{(totalAmount * 1.05).toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="p-6 pt-2">
               <button 
                onClick={handlePlaceOrder}
                disabled={orderStatus === 'submitting'}
                className="w-full bg-orange-500 text-white py-4 rounded-[24px] font-black text-lg shadow-xl shadow-orange-100 hover:bg-orange-600 transition-colors active:scale-95 disabled:opacity-50"
               >
                 {orderStatus === 'submitting' ? 'Placing Order...' : 'Confirm Order'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderStatus === 'success' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h3>
             <p className="text-gray-500 text-sm mb-8">Chef is starting to prepare your delicious meal.</p>
             <button 
              onClick={() => {setOrderStatus(null); setShowCart(false);}}
              className="w-full bg-gray-900 text-white py-4 rounded-[24px] font-bold"
             >
               Awesome!
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestMenuPage;
