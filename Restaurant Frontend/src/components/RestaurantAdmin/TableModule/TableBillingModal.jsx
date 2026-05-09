import { useState, useEffect } from 'react';
import { X, Receipt, Printer, Loader2, CheckCircle2 } from 'lucide-react';
import { tableService } from '../../../services/tableService';

const TableBillingModal = ({ tableId, tableNumber, onClose, onComplete }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        const res = await tableService.getTableBilling(tableId);
        setData(res.data.data);
      } catch (error) {
        console.error('Error fetching billing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [tableId]);

  const handleMergeComplete = async () => {
    if (!window.confirm('Kya aap sure hain ki poore table ka bill pay ho gaya hai aur aap sessions close karna chahte hain?')) return;
    try {
      setCompleting(true);
      await tableService.mergeCompleteTable(tableId);
      setSuccess(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } catch (error) {
      alert('Failed to complete billing');
    } finally {
      setCompleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl flex flex-col items-center">
          <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
          <p className="font-bold text-gray-600">Fetching Billing Data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl flex flex-col items-center text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Billing Complete!</h2>
          <p className="text-gray-500">Table {tableNumber} is now free.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 shrink-0 flex justify-between items-center print:hidden">
           <div>
              <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Merged Table Bill</p>
              <h2 className="text-2xl font-black">Table {tableNumber}</h2>
           </div>
           <div className="flex gap-2">
              <button onClick={handlePrint} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <Printer size={20} />
              </button>
              <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <X size={20} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar print:p-0">
           
           {/* Summary Section */}
           <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Active Sessions</p>
                <div className="flex gap-2">
                   {data?.sessions.map((s, idx) => (
                     <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                       Session {idx + 1}
                     </span>
                   ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Order Count</p>
                <p className="text-xl font-black text-gray-900">{data?.orders.length} Orders</p>
              </div>
           </div>

           {/* Items Table */}
           <div className="mb-8">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Receipt size={16} className="text-orange-500" /> Itemized Summary
              </h4>
              <div className="space-y-4">
                 {data?.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center py-2 group">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                            {item.quantity}×
                         </div>
                         <div>
                            <p className="font-bold text-gray-800 text-sm">{item.item_name}</p>
                            {item.variant_name && <p className="text-[10px] text-gray-400">{item.variant_name}</p>}
                         </div>
                      </div>
                      <p className="font-black text-gray-900">₹{item.subtotal}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Grand Total */}
           <div className="bg-gray-50 rounded-3xl p-6 md:p-8 space-y-4 mt-8 border border-gray-100">
              <div className="flex justify-between text-gray-500 font-bold">
                 <span>Subtotal</span>
                 <span>₹{data?.grand_total}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold">
                 <span>Taxes & Charges</span>
                 <span className="text-xs italic text-gray-400">Included</span>
              </div>
              <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                 <span className="text-lg md:text-xl font-black text-gray-900">Grand Total</span>
                 <span className="text-3xl md:text-4xl font-black text-orange-600">₹{data?.grand_total}</span>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="p-6 md:p-8 pt-0 print:hidden">
           <button 
             onClick={handleMergeComplete}
             disabled={completing || data?.sessions.length === 0}
             className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[28px] font-black text-lg md:text-xl shadow-xl shadow-gray-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
           >
             {completing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Confirm Payment & Close Table</>}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TableBillingModal;
