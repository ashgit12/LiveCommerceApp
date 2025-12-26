import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Remove token interceptor for now
api.interceptors.request.use(
  (config) => {
    // Token handling removed
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
};

export const sareeService = {
  getAll: () => api.get('/sarees/'),
  getOne: (id) => api.get(`/sarees/${id}`),
  create: (data) => api.post('/sarees/', data),
  update: (id, data) => api.put(`/sarees/${id}`, data),
  delete: (id) => api.delete(`/sarees/${id}`),
};

export const liveService = {
  getSessions: () => api.get('/live/sessions/'),
  createSession: (data) => api.post('/live/sessions/', data),
  endSession: (id) => api.post(`/live/sessions/${id}/end`),
  pinSaree: (sessionId, sareeCode) => api.post(`/live/sessions/${sessionId}/pin`, null, { params: { saree_code: sareeCode } }),
  getComments: (sessionId) => api.get(`/live/sessions/${sessionId}/comments`),
};

export const orderService = {
  getAll: (status) => api.get('/orders/', { params: { status } }),
  getOne: (orderId) => api.get(`/orders/${orderId}`),
  create: (data, sessionId) => api.post('/orders/', data, { params: { live_session_id: sessionId } }),
  updateStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, null, { params: { order_status: status } }),
};

export const paymentService = {
  createPaymentLink: (orderId, gateway = 'razorpay') => api.post(`/payments/create-payment-link/${orderId}`, null, { params: { gateway } }),
};

export default api;
