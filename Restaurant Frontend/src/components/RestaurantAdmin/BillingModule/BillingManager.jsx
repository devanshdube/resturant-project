import { useState, useEffect } from 'react';
import { Receipt, Search, Download, Printer, Filter, X } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import useAuth from '../../../hooks/useAuth';

const InvoiceModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header Actions (Not Printed) */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100 print:hidden shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Receipt size={18} /> Invoice Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {/* Restaurant Header */}
          <div className="text-center mb-6 border-b-2 border-dashed border-gray-200 pb-6">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider">{user?.restaurant_name || 'RESTAURANT'}</h1>
            <p className="text-gray-500 text-sm mt-1">Tax Invoice / Bill of Supply</p>
          </div>

          {/* Order Meta */}
          <div className="flex justify-between text-sm mb-6">
            <div>
              <p className="text-gray-500">Order No:</p>
              <p className="font-bold text-gray-900">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Date:</p>
              <p className="font-bold text-gray-900">{order.created_at?.substring(0, 10)} {order.created_at?.substring(11, 16)}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm mb-8">
            <div>
              <p className="text-gray-500">Table:</p>
              <p className="font-bold text-gray-900">{order.table_number}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Status:</p>
              <p className="font-bold text-green-600 uppercase tracking-widest text-xs">{order.status}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-900 text-gray-900">
                <th className="py-2 text-left font-bold">Item</th>
                <th className="py-2 text-center font-bold">Qty</th>
                <th className="py-2 text-right font-bold">Price</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3">
                    <p className="font-semibold text-gray-800">{item.item_name}</p>
                    {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                  </td>
                  <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">₹{item.unit_price}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">₹{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="w-1/2 ml-auto space-y-2 text-sm border-t-2 border-gray-900 pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{order.total_amount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax / GST</span>
              <span>₹{order.tax_amount}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-lg text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>Total</span>
              <span>₹{order.grand_total}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-400 text-xs italic">
            <p>Thank you for visiting {user?.restaurant_name}!</p>
            <p>Please come again.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .bg-white.rounded-3xl.max-w-lg { 
            visibility: visible; 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            padding: 0;
            max-height: none;
          }
          .bg-white.rounded-3xl.max-w-lg * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:overflow-visible { overflow: visible !important; }
        }
      `}} />
    </div>
  );
};

const BillingManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        setLoading(true);
        // We fetch completed orders for billing history
        const res = await orderService.getOrders('completed');
        setOrders(res.data.data);
      } catch (error) {
        console.error('Error fetching billing history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.table_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col fd-card p-4 md:p-6 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Receipt size={22} />
            </span>
            Billing & Invoices
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-12">View completed orders, generate receipts, and print invoices.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search order no. or table..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-100 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Order Details</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 hidden sm:table-cell">Date & Time</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Items</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Amount</th>
              <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-green-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <p className="font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500 mt-1">Table: <span className="font-semibold text-gray-700">{order.table_number}</span></p>
                  </td>
                  <td className="py-4 px-6 hidden sm:table-cell">
                    <p className="text-sm text-gray-700">{order.created_at?.substring(0, 10)}</p>
                    <p className="text-xs text-gray-500">{order.created_at?.substring(11, 16)}</p>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {order.item_count}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <p className="font-black text-gray-900 text-lg">₹{order.grand_total}</p>
                    <span className="text-[10px] uppercase font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">Paid</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => setSelectedOrder(order.id)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all shadow-sm"
                      title="View Invoice"
                    >
                      <Receipt size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-20 text-center text-gray-400">
                  <div className="text-5xl mb-3">🧾</div>
                  <p className="font-semibold">No invoices found</p>
                  <p className="text-sm">Completed orders will appear here as invoices.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default BillingManager;
