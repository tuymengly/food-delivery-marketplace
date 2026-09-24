const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api';

// Where the admin / restaurant-owner / rider portal lives. Env-driven so the
// same code works for http://localhost:5173 in development and the Render URL
// in production (see .env / .env.example) - never hardcoded in the logic.
const ADMIN_APP_URL = (import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5173').replace(/\/+$/, '');

/* ---------------------------------------------------------------------------
 * Authentication session
 *
 * Laravel is the single source of truth for who is signed in and what role
 * they have. Everything kept in localStorage here is only a cache of the last
 * user payload Laravel returned: it is written in exactly one place
 * (persistSessionUser) and cleared in exactly one place (clearAuthSession),
 * so a stale role can never win over the database.
 *
 * customer-frontend (5174) and admin-restaurant (5173) are different origins
 * with separate localStorage, so neither app can clear the other's storage.
 * Instead POST /api/logout revokes the token in Laravel, and both apps drop
 * their cache as soon as Laravel answers 401 (see handleUnauthorized) - the
 * database stays authoritative across the two ports.
 * ------------------------------------------------------------------------- */

const TOKEN_STORAGE_KEY = 'token';

// Legacy key written by an earlier version of this app; still read so open
// sessions keep working, but never written again.
const LEGACY_TOKEN_STORAGE_KEY = 'access_token';

// 'currentUser' is a legacy mirror of 'user'. Both are written from the exact
// same serialized payload so they cannot drift apart.
const USER_STORAGE_KEYS = ['user', 'currentUser'];

// Every key this app may have used for authentication (including the caches
// the admin portal writes when both apps share one origin, e.g. behind a
// single Render custom domain). Logout clears the whole list.
export const AUTH_STORAGE_KEYS = [
  TOKEN_STORAGE_KEY,
  LEGACY_TOKEN_STORAGE_KEY,
  ...USER_STORAGE_KEYS,
  'role',
  'roles',
  'user_role',
  'admin_user',
  'restaurant_user',
  'restaurant',
  'restaurant_id',
];

export const getToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);

const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};

/* ---------------------------------------------------------------------------
 * Roles
 *
 * Canonical roles come from Laravel (`role_key` on every user payload, see
 * backend/app/Support/UserRoles.php): user | restaurant_owner | rider | admin.
 * The alias table below only exists so a raw `role` column value still
 * resolves correctly if something cached before this change is still around.
 * ------------------------------------------------------------------------- */
const ROLE_ALIASES = {
  user: 'user',
  customer: 'user',
  client: 'user',
  restaurant_owner: 'restaurant_owner',
  restaurant: 'restaurant_owner',
  'restaurant owner': 'restaurant_owner',
  'restaurant admin': 'restaurant_owner',
  owner: 'restaurant_owner',
  rider: 'rider',
  driver: 'rider',
  admin: 'admin',
  super_admin: 'admin',
  'super admin': 'admin',
  superadmin: 'admin',
};

export const normalizeRole = (role) =>
  String(role ?? '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

/**
 * Canonical role for a user object (prefers Laravel's `role_key`) or for a raw
 * role string. Returns '' when the value is unknown, which is treated as "no
 * role" rather than silently defaulting to customer.
 */
export const resolveRole = (userOrRole) => {
  if (!userOrRole) return '';
  if (typeof userOrRole === 'string') return ROLE_ALIASES[normalizeRole(userOrRole)] || '';

  return resolveRole(userOrRole.role_key || userOrRole.role);
};

const persistSessionUser = (user) => {
  if (!user) return;
  const serializedUser = JSON.stringify(user);
  USER_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, serializedUser));
};

export const clearAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

/** True for endpoints where a 401 means "bad credentials", not "dead session". */
export const isPublicAuthRequest = (path) =>
  PUBLIC_AUTH_PATHS.some((prefix) => String(path || '').startsWith(prefix));

let redirectingToLogin = false;

/**
 * Send the browser back to the customer login page. Skips the redirect when
 * the user is already on an auth page, so an expired session can never cause
 * a reload loop.
 */
export const redirectToLogin = () => {
  if (typeof window === 'undefined' || redirectingToLogin) return;
  if (PUBLIC_AUTH_PATHS.includes(window.location.pathname)) return;

  redirectingToLogin = true;
  window.location.assign('/login');
};

/**
 * Laravel rejected the token we sent (expired, revoked by a logout in the
 * other portal, password reset, ...). Drop the cached session so no stale
 * user/role survives it, then go back to login.
 */
export const handleUnauthorized = () => {
  if (!getToken()) return false;

  clearAuthSession();
  window.dispatchEvent(new Event('authChanged'));
  redirectToLogin();

  return true;
};

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
    // A 401 on a public auth endpoint means "wrong credentials", not "the
    // stored session died", so those are never treated as a logout.
    if (response.status === 401 && !isPublicAuthRequest(path)) {
      handleUnauthorized();
    }

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

/**
 * Store the session Laravel just handed back. Only the token and the user
 * payload are persisted - never a separately derived role, so the two can
 * never disagree.
 */
export const saveAuthSession = (response) => {
  const payload = response?.data || response;
  const user = payload?.user;
  const token = payload?.token || payload?.access_token;

  if (token) {
    setToken(token);
  }

  persistSessionUser(user);

  return { user, token };
};

/**
 * Ask Laravel who this token actually belongs to and replace the cached user
 * (and therefore its role) with the answer. Called after login/OTP and on
 * every app start/refresh - the stored role is never trusted on its own.
 *
 * Returns the fresh user, or null when there is no valid session. A dead
 * token clears the cache; a transient network error leaves the cache alone so
 * an API hiccup doesn't sign the user out.
 */
export const hydrateAuthSession = async () => {
  if (!getToken()) return null;

  try {
    const response = await apiRequest('/user');
    const user = response?.data?.user || null;

    if (!user) {
      clearAuthSession();
      return null;
    }

    persistSessionUser(user);
    return user;
  } catch (requestError) {
    if (requestError?.response?.status === 401 || requestError?.response?.status === 403) {
      clearAuthSession();
    } else {
      console.warn('Could not refresh the session from Laravel:', requestError);
    }

    return null;
  }
};

/**
 * Logout: revoke the token in Laravel, then drop every cached auth key here.
 * The next person to sign in on this browser starts from scratch, so they can
 * never inherit the previous user's role.
 */
export const endSession = async () => {
  try {
    if (getToken()) {
      await logoutUser();
    }
  } catch (requestError) {
    console.warn('Logout request failed; clearing the local session anyway.', requestError);
  } finally {
    clearAuthSession();
  }
};

export const getStoredUser = () => {
  const serializedUser = localStorage.getItem(USER_STORAGE_KEYS[0]);
  if (!serializedUser) return null;

  try {
    return JSON.parse(serializedUser);
  } catch {
    return null;
  }
};

/**
 * Where a given role belongs after signing in. The role always comes from
 * Laravel (login/OTP response or GET /api/user) - never from localStorage.
 *
 *   user             -> this app (customer home)
 *   restaurant_owner -> admin-restaurant  /restaurant/dashboard
 *   rider            -> admin-restaurant  /driver/dashboard
 *   admin            -> admin-restaurant  /admin/dashboard
 *
 * The admin app has no login page of its own, so the token is handed over in
 * the URL and that app re-reads the role from Laravel before routing.
 */
export const getRoleRedirect = (roleOrUser, token) => {
  const role = resolveRole(roleOrUser);
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

  if (role === 'admin') return `${ADMIN_APP_URL}/admin/dashboard${tokenParam}`;
  if (role === 'restaurant_owner') return `${ADMIN_APP_URL}/restaurant/dashboard${tokenParam}`;
  if (role === 'rider') return `${ADMIN_APP_URL}/driver/dashboard${tokenParam}`;

  // 'user' (and anything unrecognised) stays on the customer portal.
  return '/';
};

const NON_CUSTOMER_ROLES = ['admin', 'restaurant_owner', 'rider'];

/**
 * This app has no dashboard for admin/restaurant_owner/rider - if a session
 * for one of those roles ever ends up cached here (a crafted ?token=, or a
 * role change that happened after the last hydrate), send it straight to
 * its real portal instead of leaving it able to browse the customer site.
 * Returns true when it redirected (caller should stop rendering/hydrating).
 */
export const redirectAwayIfNotCustomer = (user) => {
  const role = resolveRole(user);
  if (!NON_CUSTOMER_ROLES.includes(role)) return false;

  const token = getToken();
  clearAuthSession();
  window.location.assign(getRoleRedirect(role, token));
  return true;
};

/**
 * Store the session and send the user to the dashboard that matches the role
 * Laravel reports. Used by every login path (password, registration OTP,
 * Google OTP) so there is exactly one routing rule.
 */
export const completeLogin = async (response, navigate) => {
  const { user, token } = saveAuthSession(response);

  // Ask Laravel for the authoritative user before deciding where to go. If
  // that call fails (offline hiccup) the freshly returned login payload is
  // still Laravel's own answer, so it is a safe fallback.
  const verifiedUser = (await hydrateAuthSession()) || user;

  window.dispatchEvent(new Event('authChanged'));

  const redirect = getRoleRedirect(verifiedUser, token);
  if (redirect.startsWith('http')) window.location.assign(redirect);
  else navigate(redirect);

  return verifiedUser;
};

// Lets a user land here after signing in on the admin-restaurant app (e.g. a
// customer who signed in on the wrong portal) and pick up their session via a
// one-time ?token= handoff instead of being asked to log in twice. The role is
// re-read from Laravel, never taken from the URL.
export const bootstrapSessionFromUrlToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return false;

  setToken(token);

  try {
    const response = await apiRequest('/user');
    const user = response?.data?.user || null;

    if (!user) throw new Error('No user returned for the handed-over token.');

    persistSessionUser(user);

    // A restaurant_owner/rider/admin token handed to this app (e.g. someone
    // pasting the admin portal's URL) must not sit here as a browsable
    // customer session - it belongs on the other portal.
    if (redirectAwayIfNotCustomer(user)) return true;
  } catch (error) {
    console.warn('Failed to bootstrap session from token handoff:', error);
    clearAuthSession();
  } finally {
    params.delete('token');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  return true;
};

// "Continue with Google" - a plain browser redirect (not a fetch call), so
// this just builds the URL; GoogleAuthController on the backend does the
// rest and hands the browser back here via the ?challenge= OTP handoff above.
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

// KHQR payments - the backend is the only thing that ever confirms payment.
export const createKhqrPayment = (orderId) =>
  apiRequest('/payments/khqr', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });

export const getPaymentStatus = (paymentId) => apiRequest(`/payments/${paymentId}`);

export default apiRequest;
