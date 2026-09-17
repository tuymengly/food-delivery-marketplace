import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from '../modules/admin/components/AdminLayout';
import Dashboard from '../modules/admin/pages/Dashboard';
import ManageOrders from '../modules/admin/pages/ManageOrders';
import ManageRestaurants from '../modules/admin/pages/ManageRestaurants';
import RestaurantApplications from '../modules/admin/pages/RestaurantApplications';
import ManageUsers from '../modules/admin/pages/ManageUsers';
import ManageCategories from '../modules/admin/pages/ManageCategories';
import ManageFoods from '../modules/admin/pages/ManageFoods';
import Settings from '../modules/admin/pages/Settings';
import ManageDrivers from '../modules/admin/pages/ManageDrivers';
import ManagePayments from '../modules/admin/pages/ManagePayments';
import ManageReviews from '../modules/admin/pages/ManageReviews';
import HelpCenter from '../modules/admin/pages/Helpcenter';
import Profile from '../modules/admin/pages/Profile';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="restaurants" element={<ManageRestaurants />} />
        <Route path="restaurant-applications" element={<RestaurantApplications />} />
        <Route path="drivers" element={<ManageDrivers />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="payments" element={<ManagePayments />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="foods" element={<ManageFoods />} />
        <Route path="reviews" element={<ManageReviews />} />
        <Route path="help-center" element={<HelpCenter />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
