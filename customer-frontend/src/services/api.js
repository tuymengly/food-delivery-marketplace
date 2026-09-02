const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('access_token');
};

export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Request failed. Please check the backend server.';
    throw new Error(message);
  }
  return data;
};
export const createRestaurantOrder = (payload) => {
  return apiRequest('/restaurant/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
