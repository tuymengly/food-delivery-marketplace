import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import RestaurantRoutes from './routes/RestaurantRoutes';
import DriverRoutes from './routes/DriverRoutes'; 
import Login from './pages/Login'; 
import ProtectedRoute from './components/ui/ProtectedRoute';

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

    if (role === 'super_admin' || role === 'super admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === 'restaurant' || role === 'restaurant admin') {
      return <Navigate to="/restaurant/dashboard" replace />;
    } else if (role === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
  }

  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
