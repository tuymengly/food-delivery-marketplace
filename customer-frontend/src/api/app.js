const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api';

const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('access_token');

export const apiRequest = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'The backend request failed.');
    error.response = { data, status: response.status };
    throw error;
  }

  return data;
};

export const loginUser = (credentials) =>
  apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const registerUser = (userData) =>
  apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const logoutUser = () => apiRequest('/logout', { method: 'POST' });

export const saveAuthSession = (response) => {
  const payload = response?.data || response;
  const user = payload?.user;
  const token = payload?.token || payload?.access_token;

  if (token) {
    localStorage.setItem('token', token);
    localStorage.removeItem('access_token');
  }

  if (user) {
    const serializedUser = JSON.stringify(user);
    localStorage.setItem('user', serializedUser);
    localStorage.setItem('currentUser', serializedUser);
  }

  return user;
};

export const clearAuthSession = () => {
  ['token', 'access_token', 'user', 'currentUser'].forEach((key) =>
    localStorage.removeItem(key)
  );
};

export const getStoredUser = () => {
  const serializedUser =
    localStorage.getItem('user') || localStorage.getItem('currentUser');
  return serializedUser ? JSON.parse(serializedUser) : null;
};

export const getRoleRedirect = (role) => {
  if (role === 'admin') {
    return 'http://localhost:5174/admin/dashboard';
  }
  if (role === 'restaurant' || role === 'restaurant_owner') {
    return 'http://localhost:5174/restaurant/dashboard';
  }
  if (role === 'rider' || role === 'driver') {
    return 'http://localhost:5174/rider';
  }
  return '/home';
};

export const createOrder = (payload) =>
  apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getOrders = () => apiRequest('/orders');

export default apiRequest;
