import API from './api';

export const getDrivers = async () => {
  return await API.get('/drivers');
};

export const createDriver = async (driverData) => {
  return await API.post('/drivers', driverData);
};

export const updateDriver = async (id, driverData) => {
  return await API.put(`/drivers/${id}`, driverData);
};

export const deleteDriver = async (id) => {
  return await API.delete(`/drivers/${id}`);
};

export const sendDriverCredentials = async (emailData) => {
  return await API.post('/admin/drivers/send-credentials', emailData);
};

export const getDriverOrders = async () => {
  return await API.get('/driver/orders');
};

export const updateDriverOrderStatus = async (id, status) => {
  return await API.patch(`/driver/orders/${id}/status`, { status });
};

export const getRiderProfile = async () => {
  return await API.get('/rider/profile');
};

export const updateRiderLocation = async (latitude, longitude) => {
  return await API.put('/rider/location', { latitude, longitude });
};

export const updateRiderOnlineStatus = async (isOnline) => {
  return await API.put('/rider/online-status', { is_online: isOnline });
};
