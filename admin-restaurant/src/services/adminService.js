import API from './api';

const normalizeRestaurantStatus = (status) => {
  const value = String(status).toLowerCase();
  return value === 'disabled' ? 'inactive' : value;
};

// Dashboard APIs
export const getDashboardStats = () => API.get('/admin/dashboard/stats');
export const approveRestaurant = (id) => API.put(`/restaurants/${id}/status`, { status: 'active' });
export const rejectRestaurant = (id) => API.put(`/restaurants/${id}/status`, { status: 'inactive' });

// Categories APIs
export const getCategories = () => API.get('/categories');
export const createCategory = (data) => API.post('/categories', data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

export const getOrders = async () => {
  return await API.get('/admin/orders');
};

export const updateOrderStatus = async (id, status) => {
  const payload = typeof status === 'object' ? status : { status };
  return await API.put(`/admin/orders/${id}/status`, payload);
};

// Restaurant APIs
export const getRestaurants = async () => {
  return await API.get('/restaurants');
};

export const createRestaurant = async (data) => {
  return await API.post('/restaurants', data);
};

export const updateRestaurant = async (id, data) => {
  return await API.put(`/restaurants/${id}`, data);
};

export const deleteRestaurant = async (id) => {
  return await API.delete(`/restaurants/${id}`);
};

export const updateRestaurantStatus = async (id, status) => {
  return await API.put(`/restaurants/${id}/status`, { status: normalizeRestaurantStatus(status) });
};

// Restaurant Applications (registration review) APIs
export const getRestaurantApplications = async (status = 'all') => {
  return await API.get('/admin/restaurants', { params: { status } });
};

export const getRestaurantApplication = async (id) => {
  return await API.get(`/admin/restaurants/${id}`);
};

export const approveRestaurantApplication = async (id) => {
  return await API.put(`/admin/restaurants/${id}/approve`);
};

export const rejectRestaurantApplication = async (id, rejectionReason) => {
  return await API.put(`/admin/restaurants/${id}/reject`, { rejection_reason: rejectionReason });
};

export const getReviews = async () => {
  return await API.get('/admin/reviews');
};

export const updateReviewStatus = async (id, status) => {
  return await API.patch(`/admin/reviews/${id}/status`, { status });
};

export const replyToReview = async (id, data) => {
  return await API.post(`/admin/reviews/${id}/reply`, data);
};

export const getUsers = async (params = {}) => {
  return await API.get('/admin/users', { params });
};

export const createUser = async (userData) => {
  return await API.post('/admin/users', userData);
};

export const updateUser = async (id, userData) => {
  return await API.put(`/admin/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return await API.delete(`/admin/users/${id}`);
};

// Settings APIs
export const getAdminProfile = async () => {
  return await API.get('/admin/profile');
};

export const updateAdminProfile = async (data) => {
  return await API.put('/admin/profile', data);
};

export const updateAdminPassword = async (data) => {
  return await API.put('/admin/change-password', data);
}; // <--- បានលុបលេខ ១ ចេញរួចរាល់

export const getPaymentStats = () => {
  return API.get('/admin/payments');
};

export const createPayout = (data) => {
  return API.post('/admin/payments/payout', data);
};

export const calculatePayout = (data) => {
  return API.post('/admin/payments/calculate', data);
};
