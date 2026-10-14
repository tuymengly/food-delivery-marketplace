import api from './axios';

const unwrapData = (response) => response?.data?.data ?? response?.data ?? [];

/**
 * The ratings the signed-in customer already left for the dishes of one order.
 * Only their own order is readable, and only a delivered/completed order can be
 * rated at all - see backend ReviewController.
 */
export const fetchOrderFoodReviews = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/food-reviews`);
  return unwrapData(response) || [];
};

/**
 * Rate one dish of a finished order. Rating the same dish again updates the
 * existing review instead of creating a second one.
 */
export const submitOrderFoodReview = (orderId, { foodId, rating, comment }) =>
  api.post(`/orders/${orderId}/food-reviews`, {
    food_id: foodId,
    rating,
    comment,
  });
