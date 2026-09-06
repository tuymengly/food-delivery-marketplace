import API from './api';

export const getRestaurantDashboardStats = (restaurantId) => {
  const params = restaurantId ? { restaurant_id: restaurantId } : {};
  return API.get('/restaurant/stats', { params });
};

export const getRestaurantSalesStats = ({ restaurantId, range } = {}) => {
  const params = {};

  if (restaurantId) params.restaurant_id = restaurantId;
  if (range) params.range = range;

  return API.get('/restaurant/sales', { params });
};

export const getRestaurantReviews = (restaurantId) => {
  const params = restaurantId ? { restaurant_id: restaurantId } : {};
  return API.get('/restaurant/reviews', { params });
};

export const replyToRestaurantReview = (reviewId, reply) => {
  return API.post(`/restaurant/reviews/${reviewId}/reply`, { reply });
};

export const deleteRestaurantReview = (reviewId) => {
  return API.delete(`/restaurant/reviews/${reviewId}`);
};
