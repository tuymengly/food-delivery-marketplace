import { Routes, Route, Navigate } from 'react-router-dom';
import DriverDashboard from '../modules/driver/pages/DriverDashboard';
export default function DriverRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DriverDashboard />} />
      <Route path="DriverDashboard" element={<Navigate to="../dashboard" replace />} />
      <Route path="*" element={<Navigate to="../dashboard" replace />} />
    </Routes>
  );
}
