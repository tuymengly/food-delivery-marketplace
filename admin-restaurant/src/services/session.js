/* ---------------------------------------------------------------------------
 * Authentication session
 *
 * Laravel is the single source of truth for who is signed in and what role
 * they have. Everything cached in localStorage here is only the last user
 * payload Laravel returned - written through persistUser() and cleared through
 * clearSession() so a stale role can never decide which dashboard a user lands
 * on. AdminLayout/RestaurantLayout/Header render this cache; ProtectedRoute
 * and RootRedirect only trust the user Laravel confirmed at startup
 * (hydrateSession).
 *
 * This app has no login page of its own (it receives a finished session from
 * the customer portal via ?token=). Because the two apps are different origins
 * with separate localStorage, neither can clear the other's storage - so
 * logout revokes the token in Laravel and both apps drop their cache as soon
 * as Laravel answers 401 (see handleUnauthorized).
 * ------------------------------------------------------------------------- */

// Mirrors services/api.js (which builds its axios instance from this same
// value) - kept here so this module has no imports of its own and therefore
// no circular dependency on the axios client.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const TOKEN_STORAGE_KEY = 'token';

// Legacy key from an earlier version; still read so open sessions keep
// working, but never written again.
const LEGACY_TOKEN_STORAGE_KEY = 'access_token';

// Every key this app may have used for authentication, including the
// per-portal display caches written by older builds. Logout clears them all so
// nothing stale survives into the next sign-in.
export const AUTH_STORAGE_KEYS = [
  TOKEN_STORAGE_KEY,
  LEGACY_TOKEN_STORAGE_KEY,
  'user',
  'currentUser',
  'role',
  'roles',
  'user_role',
  'admin_user',
  'restaurant_user',
  'restaurant',
  'restaurant_id',
  // Caches from the admin panel that belong to the previous user.
  'admin_permissions',
  'name',
];

export const getToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);

export const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
};

/* ---------------------------------------------------------------------------
 * Roles
 *
 * Canonical roles come from Laravel (`role_key` on every user payload, see
 * backend/app/Support/UserRoles.php): user | restaurant_owner | rider | admin.
 * The alias table only backstops raw `role` values from older payloads.
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
 * Canonical role for a user object (prefers Laravel's `role_key`) or a raw
 * role string. '' means "unknown role", which is never treated as access.
 */
export const resolveRole = (userOrRole) => {
  if (!userOrRole) return '';
  if (typeof userOrRole === 'string') return ROLE_ALIASES[normalizeRole(userOrRole)] || '';

  return resolveRole(userOrRole.role_key || userOrRole.role);
};

export const persistUser = (user) => {
  if (!user) return;
  localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = () => {
  const serializedUser = localStorage.getItem('user');
  if (!serializedUser || serializedUser === 'undefined') return null;

  try {
    return JSON.parse(serializedUser);
  } catch {
    return null;
  }
};

export const clearSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

// Where the customer portal lives. Env-driven so the same code works for
// http://localhost:5174 in development and the Render URL in production.
export const CUSTOMER_APP_URL = (
  import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174'
).replace(/\/+$/, '');

// Where each role's dashboard lives inside this app. Centralised so App.jsx,
// ProtectedRoute and the layouts can never disagree about a role's home.
const ROLE_HOME_PATHS = {
  admin: '/admin/dashboard',
  restaurant_owner: '/restaurant/dashboard',
  rider: '/driver/dashboard',
};

export const roleHomePath = (roleOrUser) => ROLE_HOME_PATHS[resolveRole(roleOrUser)] || '';

export const isRoleAllowed = (roleOrUser, allowedRoles = []) => {
  const role = resolveRole(roleOrUser);

  return Boolean(role) && allowedRoles.map(resolveRole).includes(role);
};

/**
 * Send the browser back to the customer portal's login page - this app has no
 * login UI of its own. Session state is cleared first, so the next sign-in
 * always starts from the database's answer.
 */
export const redirectToLogin = () => {
  clearSession();
  window.location.assign(`${CUSTOMER_APP_URL}/login`);
};

/**
 * Hand a signed-in customer back to the customer portal with their token, so
 * they are not asked to log in twice. Only the token travels - that app
 * re-reads the role from Laravel itself.
 */
export const redirectToCustomerApp = (token = getToken()) => {
  clearSession();
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  window.location.assign(`${CUSTOMER_APP_URL}/${query}`);
};

/** Route a verified user to the dashboard their Laravel role owns. */
export const redirectToRoleHome = (roleOrUser) => {
  const role = resolveRole(roleOrUser);

  if (role === 'user') {
    redirectToCustomerApp();
    return;
  }

  const home = ROLE_HOME_PATHS[role];

  if (!home) {
    redirectToLogin();
    return;
  }

  window.location.assign(home);
};

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

/** True when Laravel answered 401 for a request that carried our token. */
export const handleUnauthorized = () => {
  if (!getToken()) return false;

  clearSession();
  window.location.assign(`${CUSTOMER_APP_URL}/login`);

  return true;
};

export const isAuthError = (error) => {
  const status = error?.response?.status;
  const path = error?.config?.url || '';

  return status === 401 && !PUBLIC_AUTH_PATHS.some((prefix) => String(path).startsWith(prefix));
};

/**
 * Ask Laravel who owns the stored token. Returns the authoritative user (and
 * persists it), or null when there is no valid session. A 401/403 clears the
 * cache; a transient network error leaves it alone so an API hiccup doesn't
 * sign the user out.
 */
export const hydrateSession = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      clearSession();
      return null;
    }

    if (!response.ok) {
      console.warn('Could not verify the session with Laravel (HTTP ' + response.status + ').');
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    const user = payload?.data?.user || null;

    if (!user) {
      clearSession();
      return null;
    }

    persistUser(user);
    return user;
  } catch (error) {
    console.warn('Could not reach Laravel to verify the session:', error);
    return null;
  }
};

/**
 * Store a session handed over from the customer portal via ?token=. The role
 * is then read back from Laravel (never from the URL) by hydrateSession().
 */
export const bootstrapSessionFromUrlToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const incomingToken = params.get('token');

  if (!incomingToken) return false;

  setToken(incomingToken);

  try {
    const user = await hydrateSession();

    if (!user) throw new Error('Laravel rejected the handed-over token.');
  } catch (error) {
    console.warn('Failed to bootstrap session from token handoff:', error);
    clearSession();
  } finally {
    params.delete('token');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  return true;
};

/**
 * Logout: revoke the token in Laravel (which also invalidates the copy the
 * customer portal holds, since the token itself is the shared secret), clear
 * every cached key here, then return to the customer login page.
 */
export const logout = async () => {
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.warn('Logout request failed; clearing the local session anyway.', error);
  } finally {
    clearSession();
    window.location.assign(`${CUSTOMER_APP_URL}/login`);
  }
};
