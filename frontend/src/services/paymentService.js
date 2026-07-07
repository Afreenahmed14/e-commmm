import api from './api';

export const paymentService = {
  createOrder: (candidateId) => api.post('/payments/order', { candidateId }).then((r) => r.data),
  verifyPayment: (payload) => api.post('/payments/verify', payload).then((r) => r.data),
  getHistory: () => api.get('/payments/history').then((r) => r.data),
  getInvoice: (id) => api.get(`/payments/${id}/invoice`).then((r) => r.data),
  updateEngagement: (unlockId, payload) => api.patch(`/payments/unlocks/${unlockId}/engagement`, payload).then((r) => r.data),
};
