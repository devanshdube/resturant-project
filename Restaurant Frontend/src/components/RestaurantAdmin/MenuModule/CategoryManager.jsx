import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { menuService } from '../../../services/menuService';

const CategoryManager = ({ categories, selectedCategory, onSelectCategory, refreshCategories, isReadOnly }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setLoading(true);
      await menuService.createCategory({ name: newCatName, sort_order: categories.length });
      setNewCatName('');
      setIsAdding(false);
      refreshCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (id) => {
    if (!editCatName.trim()) return;
    try {
      setLoading(true);
      await menuService.updateCategory(id, { name: editCatName });
      setEditingCatId(null);
      setEditCatName('');
      refreshCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation(); // Prevent triggering onSelectCategory
    if (!window.confirm('Are you sure you want to delete this category? All dishes inside it will also be deleted.')) return;
    
    try {
      setLoading(true);
      await menuService.deleteCategory(id);
      if (selectedCategory?.id === id) {
        onSelectCategory(null); // Clear selection if deleted
      }
      refreshCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Category List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {categories.map((cat) => (
          <div 
            key={cat.id}
            onClick={() => {
               if (editingCatId !== cat.id) onSelectCategory(cat);
            }}
            className={`flex flex-col p-3 rounded-xl cursor-pointer transition-colors border ${
              selectedCategory?.id === cat.id 
                ? 'bg-orange-50 border-orange-200 shadow-sm' 
                : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            }`}
          >
            {editingCatId === cat.id ? (
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-orange-300">
                <input 
                  type="text" 
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleEditCategory(cat.id)}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditCategory(cat.id); }}
                  disabled={loading}
                  className="p-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingCatId(null); }}
                  className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold ${selectedCategory?.id === cat.id ? 'text-orange-600' : 'text-gray-800'}`}>
                      {cat.name}
                    </p>
                    <p className="text-xs text-gray-500">{cat.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {!isReadOnly && (
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingCatId(cat.id); 
                        setEditCatName(cat.name); 
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && !isAdding && (
          <p className="text-center text-sm text-gray-400 mt-4">No categories found.</p>
        )}
      </div>

      {/* Add New Category Section */}
      {!isReadOnly && (
        <div className="pt-4 border-t border-gray-100 shrink-0">
          {isAdding ? (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                onClick={handleAddCategory}
                disabled={loading}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all font-medium text-sm"
            >
              <Plus size={18} />
              Add New Category
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
