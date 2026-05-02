import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Clock } from 'lucide-react';
import { menuService } from '../../../services/menuService';

const MenuItemManager = ({ category, isReadOnly }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    price: '',
    description: '',
    is_veg: true,
    prep_time_mins: '',
    image_url: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchItems = async () => {
    if (!category?.id) return;
    try {
      setLoading(true);
      const res = await menuService.getMenuItems(category.id);
      setItems(res.data.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setShowAddForm(false);
    setEditingItemId(null);
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddForm = () => {
    setFormData(initialFormState);
    setEditingItemId(null);
    setShowAddForm(true);
  };

  const openEditForm = (item) => {
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || '',
      is_veg: item.is_veg === 1,
      prep_time_mins: item.prep_time_mins || '',
      image_url: item.image_url || ''
    });
    setEditingItemId(item.id);
    setShowAddForm(true);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert('Name and Price are required');

    try {
      setLoading(true);
      
      const payload = {
        category_id: category.id,
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        is_veg: formData.is_veg ? 1 : 0,
        prep_time_mins: formData.prep_time_mins ? Number(formData.prep_time_mins) : null,
        image_url: formData.image_url || null
      };

      if (editingItemId) {
        await menuService.updateMenuItem(editingItemId, payload);
      } else {
        await menuService.createMenuItem(payload);
      }
      
      setFormData(initialFormState);
      setShowAddForm(false);
      setEditingItemId(null);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setLoading(true);
      await menuService.deleteMenuItem(id);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. It might be linked to existing orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2 flex-wrap">
            {category.name}
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full whitespace-nowrap">
              {items.length} Items
            </span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Manage dishes for this category</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          {!isReadOnly && (
            <button 
              onClick={() => showAddForm ? setShowAddForm(false) : openAddForm()}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Dish</>}
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Item Form (Inline) */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-6 flex flex-col gap-4">
          <h4 className="font-bold text-gray-700">{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Dish Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. Paneer Tikka" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹) *</label>
              <input required type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. 250" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none" rows="2" placeholder="Brief description of the dish..."></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
              <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="https://example.com/image.jpg" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" name="is_veg" checked={formData.is_veg} onChange={handleInputChange} className="w-4 h-4 accent-green-600" />
                <span className="flex items-center gap-1"><div className="w-3 h-3 border border-green-600 p-[1px] rounded-sm flex items-center justify-center"><div className="w-full h-full bg-green-600 rounded-full"></div></div> Pure Veg</span>
              </label>
              
              <div className="flex items-center gap-2 flex-1">
                <Clock size={16} className="text-gray-400" />
                <input type="number" name="prep_time_mins" value={formData.prep_time_mins} onChange={handleInputChange} placeholder="Prep Time (mins)" className="w-full p-2 border border-gray-200 rounded-lg text-sm" title="Estimated time to prepare this dish" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setShowAddForm(false); setEditingItemId(null); }} className="px-4 py-2 text-gray-500 font-medium text-sm hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-gray-800 text-white font-bold text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50">
              {editingItemId ? 'Update Dish' : 'Save Dish'}
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 shrink-0 relative overflow-hidden">
                  {/* Veg/Non-Veg Indicator */}
                  <div className="absolute top-1 left-1 bg-white p-0.5 rounded-sm shadow-sm">
                     <div className={`w-2.5 h-2.5 border ${item.is_veg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-[2px]`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                     </div>
                  </div>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Tag size={24} className="opacity-20" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="font-bold text-orange-500">₹{item.price}</p>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    {item.prep_time_mins && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {item.prep_time_mins} mins</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.is_available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                    
                    {!isReadOnly && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditForm(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl py-12">
            <UtensilsCrossed size={48} className="text-gray-200 mb-4" />
            <p className="font-medium text-gray-500">No dishes in this category</p>
            {!isReadOnly && (
              <>
                <p className="text-sm mt-1 mb-4">Add your first dish to start building the menu</p>
                <button onClick={openAddForm} className="px-4 py-2 bg-orange-50 text-orange-600 font-bold text-sm rounded-lg hover:bg-orange-100">Add Dish</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple UtensilsCrossed icon fallback for the empty state since it's not imported at top
const UtensilsCrossed = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.24 4.24 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>
);

export default MenuItemManager;
