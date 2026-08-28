import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import RestaurantRoutes from './routes/RestaurantRoutes';
import DriverRoutes from './routes/DriverRoutes'; // Import DriverRoutes

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="/admin/*" element={<AdminRoutes />} />

        <Route path="/restaurant/*" element={<RestaurantRoutes />} />

        <Route path="/driver/*" element={<DriverRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}