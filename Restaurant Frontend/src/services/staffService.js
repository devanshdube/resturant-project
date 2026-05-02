import api from './api';

export const staffService = {
  getStaff: () => api.get('/restaurants/staff'),
  createStaff: (data) => api.post('/restaurants/staff', data),
  updateStaff: (id, data) => api.patch(`/restaurants/staff/${id}`, data),
};
