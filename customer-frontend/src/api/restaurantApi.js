import api from './axios';

export const fetchRestaurants = async (params = {}, options = {}) => {
  const response = await api.get('/restaurants', { params, ...options });
  return response.data?.data || [];
};

export const fetchRestaurant = async (id) => {
  const response = await api.get(`/restaurants/${id}`);
  return response.data?.data || null;
};
