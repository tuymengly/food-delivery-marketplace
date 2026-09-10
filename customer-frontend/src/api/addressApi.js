import api from './axios';

export const fetchAddresses = async () => {
  const response = await api.get('/addresses');
  return response.data?.data || [];
};

export const createAddress = async (address) => {
  const response = await api.post('/addresses', address);
  return response.data?.data;
};