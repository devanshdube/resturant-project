import { useState, useEffect } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import CategoryManager from './CategoryManager';
import MenuItemManager from './MenuItemManager';
import { menuService } from '../../../services/menuService';

const MenuBuilder = () => {
  const { user } = useAuth();
  const isReadOnly = ['staff', 'kitchen'].includes(user?.role);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await menuService.getCategories();
      setCategories(res.data.data);
      if (res.data.data.length > 0 && !selectedCategory) {
        setSelectedCategory(res.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full lg:h-[calc(100vh-130px)]">
      {/* Categories Sidebar */}
      <div className="w-full lg:w-1/3 lg:max-w-sm fd-card flex flex-col p-3 md:p-4 h-[350px] lg:h-full shrink-0 overflow-hidden">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Layers className="text-orange-500" size={20} />
            Categories
          </h3>
        </div>
        
        <CategoryManager 
          categories={categories} 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          refreshCategories={fetchCategories}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* Menu Items Area */}
      <div className="w-full lg:w-2/3 fd-card flex flex-col p-3 md:p-4 flex-1 min-h-[500px] lg:min-h-0 lg:h-full overflow-hidden">
        {selectedCategory ? (
          <MenuItemManager category={selectedCategory} isReadOnly={isReadOnly} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p>Select or create a category to manage items</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBuilder;
