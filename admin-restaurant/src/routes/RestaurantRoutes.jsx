import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RestaurantLayout from '../modules/restaurant/components/RestaurantLayout';
import ManageCategories from '../modules/restaurant/pages/ManageCategories';
import ManageFoods from '../modules/restaurant/pages/ManageFoods';
import Orders from '../modules/restaurant/pages/Orders';
import Profile from '../modules/restaurant/pages/Profile';
import Reviews from '../modules/restaurant/pages/Reviews';
import Sales from '../modules/restaurant/pages/Sales';
import Dashboard from '../modules/restaurant/pages/Dashboard'; 
import HelpCenter from '../modules/restaurant/pages/HelpCenter';
export default function RestaurantRoutes() {
  return (
    <Routes>
      <Route element={<RestaurantLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="foods" element={<ManageFoods />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="sales" element={<Sales />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help-center" element={<HelpCenter />} />
      </Route>
    </Routes>
  );
}