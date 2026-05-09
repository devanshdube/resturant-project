import api from './api';

export const tableService = {
  getTables: () => api.get('/tables'),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.patch(`/tables/${id}`, data),
  getTableBilling: (id) => api.get(`/tables/${id}/billing`),
  mergeCompleteTable: (id) => api.post(`/tables/${id}/merge-complete`),
};
