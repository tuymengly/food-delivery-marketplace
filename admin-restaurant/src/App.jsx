import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import RestaurantRoutes from './routes/RestaurantRoutes';
import DriverRoutes from './routes/DriverRoutes';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ui/ProtectedRoute';
import API from './services/api';

// មុខងារជំនួយសម្រាប់ពិនិត្យ Role និងផ្ញើទៅកន្លែងត្រឹមត្រូវពេលចូល Root (/)
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const role = user?.role?.toLowerCase()?.trim();

    if (role === 'admin' || role === 'super_admin' || role === 'super admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'restaurant' || role === 'restaurant admin') {
      return <Navigate to="/restaurant/dashboard" replace />;
    } else if (role === 'driver' || role === 'rider') {
      return <Navigate to="/driver/dashboard" replace />;
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
  }

  return <Navigate to="/login" replace />;
};

// Picks up a session handed off from another portal (e.g. customer-frontend)
// via a one-time ?token= param, instead of forcing a second login.
function useSessionBootstrap() {
  const [ready, setReady] = useState(() => !new URLSearchParams(window.location.search).get('token'));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingToken = params.get('token');

    if (!incomingToken) {
      return;
    }

    (async () => {
      localStorage.setItem('token', incomingToken);
      try {
        const response = await API.get('/user');
        const user = response.data?.data?.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.warn('Failed to bootstrap session from token handoff:', error);
        localStorage.removeItem('token');
      } finally {
        params.delete('token');
        const query = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
        setReady(true);
      }
    })();
  }, []);

  return ready;
}

export default function App() {
  const ready = useSessionBootstrap();

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* ប្រើប្រាស់ RootRedirect ដើម្បីបែងចែកទិសដៅស្វ័យប្រវត្តិ */}
        <Route path="/" element={<RootRedirect />} />
      
        {/* Nested Routes សម្រាប់បែងចែកតាម Panel នីមួយៗ */}
        <Route
          path="/admin/*"
          element={(
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'super admin']}>
              <AdminRoutes />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/restaurant/*"
          element={(
            <ProtectedRoute allowedRoles={['restaurant', 'restaurant admin']}>
              <RestaurantRoutes />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/driver/*"
          element={(
            <ProtectedRoute allowedRoles={['driver', 'rider']}>
              <DriverRoutes />
            </ProtectedRoute>
          )}
        />
        
        {/* 
          ចំណាំ៖ កុំដាក់ Catch-all (<Route path="*" ... />) ហוុយៗ ប្រសិនបើវាធ្វើឱ្យប៉ះពាល់ដល់ការ Refresh 
          ទំព័ររង (Sub-routes) ដូចជា /restaurant/profile ។ 
          បើចាំបាច់ត្រូវឱ្យ Vite config ត្រូវនឹង SPA Fallback (historyApiFallback) ផងដែរ។
        */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
