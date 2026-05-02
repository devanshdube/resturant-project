import api from './api';

export const menuService = {
  // Categories
  getCategories: () => api.get('/menu/categories'),
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (id, data) => api.patch(`/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}`),

  // Items
  getMenuItems: (categoryId = null) => {
    const url = categoryId ? `/menu/items?category_id=${categoryId}` : '/menu/items';
    return api.get(url);
  },
  createMenuItem: (data) => api.post('/menu/items', data),
  updateMenuItem: (id, data) => api.patch(`/menu/items/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/menu/items/${id}`),

  // Variants
  getVariants: (itemId) => api.get(`/menu/items/${itemId}/variants`),
  createVariant: (itemId, data) => api.post(`/menu/items/${itemId}/variants`, data),
};
