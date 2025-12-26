import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('seller');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
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
  getMessages: (orderId) => api.get(`/orders/${orderId}/messages`),
  getPayment: (orderId) => api.get(`/orders/${orderId}/payment`),
};

export const paymentService = {
  createPaymentLink: (orderId, gateway = 'razorpay') => api.post(`/payments/create-payment-link/${orderId}`, null, { params: { gateway } }),
  getTransactions: () => api.get('/payments/transactions'),
};

export const whatsappService = {
  getMessages: (orderId) => api.get(`/orders/${orderId}/messages`),
};

export default api;
