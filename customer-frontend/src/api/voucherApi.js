import api from './axios';

export const validateVoucher = async (code, subtotal) => {
  const response = await api.post('/vouchers/validate', { code, subtotal });
  return response.data?.data;
};
