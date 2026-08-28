import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DriverDashboard from '../modules/driver/pages/DriverDashboard';

export default function DriverRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DriverDashboard />} />
    </Routes>
  );
}