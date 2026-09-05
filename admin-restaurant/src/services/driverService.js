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

export const getDriverOrders = async () => {
  return await API.get('/driver/orders');
};

export const updateDriverOrderStatus = async (id, status) => {
  return await API.patch(`/driver/orders/${id}/status`, { status });
};
