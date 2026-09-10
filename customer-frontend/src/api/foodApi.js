import api from './axios';

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

export const normalizeFood = (food) => ({
  ...food,
  categoryId: food?.category_id || food?.category?.id || null,
  price: Number(food?.price || 0),
  image: food?.image_url || food?.image || 'https://via.placeholder.com/500',
  category: food?.category?.name || food?.category || 'Food',
  restaurantName: food?.restaurant?.name || food?.restaurant_name || food?.restaurantName || 'Restaurant',
  description: food?.description || 'Delicious Khmer food',
  qty: food?.qty || 10,
});

export const fetchFoodDetail = async (id) => {
  const response = await api.get(`/foods/${id}`);
  return normalizeFood(unwrapData(response));
};

export const fetchFoods = async () => {
  const response = await api.get('/foods');
  return (unwrapData(response) || []).map(normalizeFood);
};

export const fetchCategories = async () => {
  const response = await api.get('/categories');
  return unwrapData(response) || [];
};

export const toggleFoodRecommendation = (foodId, rating) =>
  api.post(`/foods/${foodId}/recommend`, { rating });

export const getFoodRecommendation = (foodId) =>
  api.get(`/foods/${foodId}/recommendation`);

export const fetchCart = async () => {
  const response = await api.get('/cart');
  const cart = unwrapData(response) || {};
  return (cart.items || []).map((item) => ({
    id: item.food_id || item.food?.id,
    cartItemId: item.id,
    name: item.food?.name || 'Food item',
    price: Number(item.food?.price || 0),
    image: item.food?.image_url || item.food?.image || 'https://via.placeholder.com/500',
    category: item.food?.category?.name || 'Food',
    restaurantName: item.food?.restaurant?.name || item.food?.restaurant_name || 'Restaurant',
    restaurant_id: item.food?.restaurant_id || item.food?.restaurant?.id,
    quantity: item.quantity,
    type: 'food',
    detailLink: `/food/${item.food_id || item.food?.id}`,
  }));
};

export const addCartItem = (foodId, quantity) =>
  api.post('/cart/items', { food_id: foodId, quantity });

export const updateCartItem = (cartItemId, quantity) =>
  api.put(`/cart/items/${cartItemId}`, { quantity });

export const removeCartItem = (cartItemId) =>
  api.delete(`/cart/items/${cartItemId}`);

export const clearCart = () => api.delete('/cart');
