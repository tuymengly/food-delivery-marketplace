import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  FolderTree, 
  DollarSign, 
  Star, 
  User, 
  ExternalLink, 
  HelpCircle, 
  LogOut,
  X
} from 'lucide-react';

import logoImg from '../../../assets/Logo Upgrade (No Background).png';
import API from '../../../services/api';

const resolveImageUrl = (image) => {
  if (!image) return logoImg;
  if (/^https?:\/\//i.test(image)) return image;
  return `http://127.0.0.1:8000/storage/${image}`;
};

export default function RestaurantSidebar({ onClose }) {
  const [restaurantData, setRestaurantData] = useState({
    name: '24 HOUR FOOD',
    image: logoImg,
    isOpen: true
  });

  useEffect(() => {
    const applyRestaurantInfo = (parsedData) => {
      if (!parsedData) return;
      setRestaurantData({
        name: parsedData.name || '24 HOUR FOOD',
        image: resolveImageUrl(parsedData.image),
        isOpen: parsedData.status === 'active' || parsedData.is_open === true,
      });
    };

    const loadRestaurantInfo = async () => {
      try {
        const response = await API.get('/restaurant/profile');
        const profile = response.data.data || response.data;
        if (profile?.id) {
          localStorage.setItem('restaurant', JSON.stringify(profile));
          localStorage.setItem('restaurant_id', String(profile.id));
        }
        applyRestaurantInfo(profile);
        return;
      } catch (error) {
        console.warn('Could not load restaurant profile for sidebar:', error);
      }

      try {
      const storedRestaurant = localStorage.getItem('restaurant');
      if (storedRestaurant) {
        applyRestaurantInfo(JSON.parse(storedRestaurant));
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.restaurant) {
            applyRestaurantInfo(user.restaurant);
          }
        }
      }
      } catch (error) {
        console.error('Failed to load restaurant info from localStorage:', error);
      }
    };

    void loadRestaurantInfo();
    window.addEventListener('restaurantUpdated', loadRestaurantInfo);
    return () => window.removeEventListener('restaurantUpdated', loadRestaurantInfo);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/restaurant/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/restaurant/orders', icon: ShoppingBag },
    { name: 'Manage Foods', path: '/restaurant/foods', icon: UtensilsCrossed },
    { name: 'Categories', path: '/restaurant/categories', icon: FolderTree },
    { name: 'Sales & Earnings', path: '/restaurant/sales', icon: DollarSign },
    { name: 'Reviews', path: '/restaurant/reviews', icon: Star },
    { name: 'Profile / Settings', path: '/restaurant/profile', icon: User },
  ];

  return (
    <aside className="dashboard-sidebar w-64 text-white flex flex-col justify-between p-4 h-full overflow-y-auto">
      <div>
        <div className="relative mb-6 pt-2 pb-4 border-b border-white/10 text-center">
          <button 
            onClick={onClose}
            className="lg:hidden absolute right-0 top-0 text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>

          {/* Logo Card & Text */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-20 h-20 overflow-hidden flex items-center justify-center">
              <img 
                src={restaurantData.image} 
                alt={restaurantData.name} 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div>
              {/* បង្ហាញឈ្មោះ Restaurant ដែលទាញបាន */}
              <h1 className="font-bold text-white text-base leading-tight tracking-wide">{restaurantData.name}</h1>
              <span className="inline-flex items-center gap-1.5 text-xs text-white font-medium mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 
                {restaurantData.isOpen ? 'Open for Orders' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `dashboard-nav-item flex items-center justify-between px-4 py-3 font-medium ${isActive ? 'bg-[#163A63] text-white' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="space-y-1.5 pt-6 border-t border-white/10 mt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#0B1F3A] hover:bg-slate-100 font-medium rounded-md transition text-sm mb-3"
        >
          <ExternalLink size={16} /> View Store Online
        </a>

        <NavLink
          to="/restaurant/help-center"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm ${
              isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white hover:bg-white/15'
            }`
          }
        >
          <HelpCircle size={18} /> Help Center
        </NavLink>

        <button 
          onClick={onClose}
           className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition w-full text-left text-sm"
        >
          <LogOut size={18} /> Logout Store
        </button>
      </div>
    </aside>
  );
}
