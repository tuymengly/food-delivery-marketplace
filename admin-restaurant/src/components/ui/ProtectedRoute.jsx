import { Navigate } from 'react-router-dom';
import { getStoredUser, isRoleAllowed, redirectToCustomerApp, redirectToLogin, roleHomePath } from '../../services/session';

/**
 * Role gate for this app's portals.
 *
 * `user` is the session user Laravel confirmed at startup (App.jsx passes it
 * down); when it isn't provided the last Laravel-verified user in localStorage
 * is used. Either way the role comes from the database - never from a value
 * this browser decided on its own - and an unrecognised role is treated as
 * "no access" rather than being allowed through.
 */
export default function ProtectedRoute({ allowedRoles, user, children }) {
  const sessionUser = user || getStoredUser();

  if (!sessionUser) {
    redirectToLogin();
    return null;
  }

  if (isRoleAllowed(sessionUser, allowedRoles)) {
    return children;
  }

  const home = roleHomePath(sessionUser);

  // A customer belongs to the customer frontend - hand their session over
  // instead of showing them a dashboard this portal doesn't own.
  if (!home) {
    redirectToCustomerApp();
    return null;
  }

  return <Navigate to={home} replace />;
}
