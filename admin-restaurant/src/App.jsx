import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import RestaurantRoutes from './routes/RestaurantRoutes';
import DriverRoutes from './routes/DriverRoutes';
import ProtectedRoute from './components/ui/ProtectedRoute';
import {
  bootstrapSessionFromUrlToken,
  hydrateSession,
  redirectToLogin,
  redirectToRoleHome,
  roleHomePath,
} from './services/session';

/**
 * App bootstrap.
 *
 * This app has no login page of its own: the customer portal authenticates
 * against Laravel and hands the token over (?token=), and every start/refresh
 * re-asks Laravel (GET /api/user) who that token belongs to. The role that
 * decides which dashboard is shown therefore always comes from the database -
 * a role cached in localStorage is never trusted on its own.
 */
export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. A session handed over from the customer portal, verified with Laravel.
      await bootstrapSessionFromUrlToken();

      // 2. Who does the stored token actually belong to right now?
      const user = await hydrateSession();

      if (cancelled) return;

      if (!user) {
        // No token, or Laravel no longer recognises it: clear everything and
        // send the user to the customer portal's login page. Never fall back
        // to a previously cached role.
        redirectToLogin();
        return;
      }

      setSessionUser(user);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady) return null;

  const home = roleHomePath(sessionUser);

  if (!home) {
    // 'user' (or an unknown role): this portal is not theirs. A customer is
    // handed back to the customer frontend with their token so they stay
    // signed in there; anything unrecognised goes to login.
    redirectToRoleHome(sessionUser);
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />

        <Route
          path="/admin/*"
          element={(
            <ProtectedRoute allowedRoles={['admin']} user={sessionUser}>
              <AdminRoutes />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/restaurant/*"
          element={(
            <ProtectedRoute allowedRoles={['restaurant_owner']} user={sessionUser}>
              <RestaurantRoutes />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/driver/*"
          element={(
            <ProtectedRoute allowedRoles={['rider']} user={sessionUser}>
              <DriverRoutes />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
