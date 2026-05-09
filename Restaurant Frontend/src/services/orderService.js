import api from './api';

export const orderService = {
  getOrders: (status = null) => {
    const url = status ? `/orders?status=${status}` : '/orders';
    return api.get(url);
  },
  getOrderDetails: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  getStats: () => api.get('/orders/stats'),
  getAnalytics: () => api.get('/orders/analytics'),
  completeSession: (session_id) => api.post('/public/session/complete', { session_id }), // Calling the public endpoint from admin
};
