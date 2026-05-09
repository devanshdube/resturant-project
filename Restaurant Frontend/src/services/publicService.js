import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const publicApi = axios.create({
  baseURL: `${API_BASE_URL}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicService = {
  getMenu: (slug) => publicApi.get(`/menu/${slug}`),
  verifyTable: (id, token) => publicApi.get(`/table/${id}/${token}`),
  startSession: (table_id, token) => publicApi.post('/session/start', { table_id, token }),
  getOrders: (session_id) => publicApi.get(`/orders/${session_id}`),
  requestBill: (table_id, session_id) => publicApi.post('/session/request-bill', { table_id, session_id }),
  placeOrder: (data) => publicApi.post('/order', data),
};
