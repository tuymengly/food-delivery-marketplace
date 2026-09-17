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

export const verifyOtp = (payload) =>
  apiRequest('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resendOtp = (payload) =>
  apiRequest('/auth/otp/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const forgotPassword = (email) =>
  apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resetPassword = (payload) =>
  apiRequest('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const OTP_CHALLENGE_STORAGE_KEY = 'pendingOtpChallenge';

export const saveOtpChallenge = (response) => {
  const challenge = response?.data || response;

  if (!challenge?.challenge_token || !challenge?.purpose) {
    throw new Error('The server did not return a valid OTP challenge.');
  }

  sessionStorage.setItem(OTP_CHALLENGE_STORAGE_KEY, JSON.stringify(challenge));
  return challenge;
};

export const getStoredOtpChallenge = () => {
  const serializedChallenge = sessionStorage.getItem(OTP_CHALLENGE_STORAGE_KEY);

  if (!serializedChallenge) return null;

  try {
    return JSON.parse(serializedChallenge);
  } catch {
    sessionStorage.removeItem(OTP_CHALLENGE_STORAGE_KEY);
    return null;
  }
};

export const clearOtpChallenge = () => {
  sessionStorage.removeItem(OTP_CHALLENGE_STORAGE_KEY);
};

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

  if (['admin', 'super_admin', 'super admin'].includes(normalizedRole)) {
    return `${ADMIN_APP_URL}/admin/dashboard${tokenParam}`;
  }
  if (normalizedRole === 'restaurant' || normalizedRole === 'restaurant_owner') {
    return `${ADMIN_APP_URL}/restaurant/dashboard${tokenParam}`;
  }
  if (normalizedRole === 'rider' || normalizedRole === 'driver') {
    return `${ADMIN_APP_URL}/driver/dashboard${tokenParam}`;
  }

  if (normalizedRole === 'user' || normalizedRole === 'customer') {
    return '/';
  }

  return '/';
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

// "Continue with Google" - a plain browser redirect (not a fetch call), so
// this just builds the URL; GoogleAuthController on the backend does the
// rest and hands the browser back here via the ?token= handoff above.
const GOOGLE_ROLES = ['customer', 'restaurant'];

export const getGoogleAuthUrl = (role = 'customer') => {
  const safeRole = GOOGLE_ROLES.includes(role) ? role : 'customer';
  return `${API_BASE_URL}/auth/google/redirect?role=${safeRole}`;
};

export const createOrder = (payload) =>
  apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getOrders = () => apiRequest('/orders');

// PayWay payments - the backend is the only thing that ever confirms payment.
export const createPayWayPayment = (orderId, paymentMethod = 'khqr') =>
  apiRequest('/payments/payway', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, payment_method: paymentMethod }),
  });

export const createKhqrPayment = (orderId) =>
  createPayWayPayment(orderId, 'khqr');

export const getPaymentStatus = (paymentId) => apiRequest(`/payments/${paymentId}`);

export default apiRequest;
