import { Navigate } from 'react-router-dom';

const normalizeRole = (role) => String(role || '').toLowerCase().trim();

const roleHome = (role) => {
  if (role === 'restaurant' || role === 'restaurant admin') return '/restaurant/dashboard';
  if (role === 'driver' || role === 'rider') return '/driver/dashboard';
  if (role === 'admin' || role === 'super_admin' || role === 'super admin') {
    return '/admin/dashboard';
  }
  return '/login';
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const savedUser = localStorage.getItem('user');

  if (!token || !savedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(savedUser);
  } catch {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user?.role);
  const roles = allowedRoles.map(normalizeRole);

  if (!roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return children;
}
