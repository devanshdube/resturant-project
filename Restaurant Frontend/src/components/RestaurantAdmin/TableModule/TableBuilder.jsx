import { useState, useEffect } from 'react';
import { Plus, Search, Table2, QrCode, Power, X, Download } from 'lucide-react';
import { tableService } from '../../../services/tableService';
import useAuth from '../../../hooks/useAuth';

const TableBuilder = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ table_number: '', capacity: 4 });
  const [selectedQRTable, setSelectedQRTable] = useState(null);
  const isReadOnly = ['staff', 'kitchen'].includes(user?.role);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await tableService.getTables();
      setTables(res.data.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!formData.table_number) return;
    try {
      setLoading(true);
      await tableService.createTable({
        table_number: formData.table_number,
        capacity: Number(formData.capacity)
      });
      setFormData({ table_number: '', capacity: 4 });
      setShowAddForm(false);
      fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
      alert(error?.response?.data?.message || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const toggleTableStatus = async (table) => {
    try {
      setLoading(true);
      await tableService.updateTable(table.id, { is_active: table.is_active === 1 ? 0 : 1 });
      fetchTables();
    } catch (error) {
      console.error('Error toggling table:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const generateQRUrl = (table) => {
    // Current domain origin
    const origin = window.location.origin;
    // Assuming user object has slug, otherwise fallback to ID
    const restaurantIdentifier = user?.slug || user?.restaurant_id || 'guest';
    return `${origin}/menu/${restaurantIdentifier}/${table.id}?token=${table.qr_token}`;
  };

  const getQRImageUrl = (url) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  };

  const handleDownloadQR = async (table) => {
    const url = generateQRUrl(table);
    const imgUrl = getQRImageUrl(url);
    
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Table-${table.table_number}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] p-2 md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">
            <Table2 className="text-orange-500" size={24} />
            Tables & QR Codes
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full ml-2">
              {tables.length} Tables
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Manage physical tables and generate QR codes for ordering.</p>
        </div>
        
        {!isReadOnly && (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Table</>}
            </button>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddTable} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm mb-6 flex flex-col gap-4">
          <h4 className="font-bold text-gray-700">Add New Table</h4>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Table No. / Name *</label>
              <input required type="text" value={formData.table_number} onChange={(e) => setFormData({...formData, table_number: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. Table 01, T5, Balcony 2" />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity (Seats) *</label>
              <input required type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex items-end">
               <button type="submit" disabled={loading} className="w-full md:w-auto px-6 py-2.5 bg-gray-800 text-white font-bold text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50">Save Table</button>
            </div>
          </div>
        </form>
      )}

      {/* Table Grid */}
      <div className="flex-1">
        {loading && tables.length === 0 ? (
           <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
        ) : tables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {tables.map(table => (
               <div key={table.id} className={`p-5 rounded-2xl border transition-all ${table.is_active ? 'bg-white border-gray-100 hover:shadow-md hover:border-orange-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                 <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                     <Table2 size={24} />
                   </div>
                    {!isReadOnly && (
                      <button 
                        onClick={() => toggleTableStatus(table)}
                        className={`p-2 rounded-full ${table.is_active ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                        title={table.is_active ? 'Deactivate Table' : 'Activate Table'}
                      >
                        <Power size={18} />
                      </button>
                    )}
                 </div>
                 
                 <h4 className="text-xl font-bold text-gray-800 mb-1">{table.table_number}</h4>
                 <p className="text-xs text-gray-500 mb-4">{table.capacity} Seats</p>
                 
                 <div className="border-t border-dashed border-gray-200 pt-4 flex gap-2">
                    <button onClick={() => setSelectedQRTable(table)} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors">
                      <QrCode size={14} /> View QR
                    </button>
                 </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
               <Table2 size={32} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Tables Found</h3>
            {!isReadOnly && (
              <>
                <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">Add your first dining table to start generating QR codes for guest ordering.</p>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 shadow-sm transition-transform hover:scale-105">
                  Add Table
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQRTable && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedQRTable(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-bold text-gray-800 mb-1">Table {selectedQRTable.table_number}</h3>
              <p className="text-sm text-gray-500">Scan to view menu & order</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex justify-center mb-6">
              <img 
                src={getQRImageUrl(generateQRUrl(selectedQRTable))} 
                alt={`QR Code for ${selectedQRTable.table_number}`} 
                className="w-48 h-48 rounded-lg shadow-sm"
              />
            </div>
            
            <button 
              onClick={() => handleDownloadQR(selectedQRTable)}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-95"
            >
              <Download size={18} />
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableBuilder;
