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

  return { user, token };
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

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5173';

export const getRoleRedirect = (role, token) => {
  const normalizedRole = String(role || '').toLowerCase().trim();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

  if (normalizedRole === 'admin') {
    return `${ADMIN_APP_URL}/admin/dashboard${tokenParam}`;
  }
  if (normalizedRole === 'restaurant' || normalizedRole === 'restaurant_owner') {
    return `${ADMIN_APP_URL}/restaurant/dashboard${tokenParam}`;
  }
  if (normalizedRole === 'rider' || normalizedRole === 'driver') {
    return `${ADMIN_APP_URL}/driver/dashboard${tokenParam}`;
  }
  return '/home';
};

// Lets a user land here after logging in on the admin-restaurant app (e.g. a
// customer who signed in on the wrong portal) and pick up their session via
// a one-time ?token= handoff instead of being asked to log in twice.
export const bootstrapSessionFromUrlToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return false;

  localStorage.setItem('token', token);

  try {
    const response = await apiRequest('/user');
    const user = response?.data?.user;
    if (user) {
      const serializedUser = JSON.stringify(user);
      localStorage.setItem('user', serializedUser);
      localStorage.setItem('currentUser', serializedUser);
    }
  } catch (error) {
    console.warn('Failed to bootstrap session from token handoff:', error);
    localStorage.removeItem('token');
  } finally {
    params.delete('token');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  return true;
};

export const createOrder = (payload) =>
  apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getOrders = () => apiRequest('/orders');

export default apiRequest;
