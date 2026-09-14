import { Navigate } from 'react-router-dom';

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';

const normalizeRole = (role) => String(role || '').toLowerCase().trim();

const roleHome = (role) => {
  if (role === 'restaurant' || role === 'restaurant admin') return '/restaurant/dashboard';
  if (role === 'driver' || role === 'rider') return '/driver/dashboard';
  if (role === 'admin' || role === 'super_admin' || role === 'super admin') {
    return '/admin/dashboard';
  }
  return '/';
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const savedUser = localStorage.getItem('user');

  if (!token || !savedUser) {
    window.location.assign(`${CUSTOMER_APP_URL}/login`);
    return null;
  }

  let user;
  try {
    user = JSON.parse(savedUser);
  } catch {
    window.location.assign(`${CUSTOMER_APP_URL}/login`);
    return null;
  }

  const role = normalizeRole(user?.role);
  const roles = allowedRoles.map(normalizeRole);

  if (!roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return children;
}
